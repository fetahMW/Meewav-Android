// Creates only two dedicated LIVE QA accounts. Secrets stay under ignored app/build/.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const directory = resolve(root, 'app/build/messaging-dual-agent');
const accountsPath = resolve(directory, 'accounts.json');
const properties = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
const value = (name) => properties.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim().replaceAll('\\:', ':');
const baseUrl = value('SUPABASE_URL');
const apiKey = value('SUPABASE_PUBLISHABLE_KEY');
if (!baseUrl || !apiKey || new URL(baseUrl).protocol !== 'https:') throw new Error('Supabase LIVE configuration missing');
await mkdir(directory, { recursive: true });

async function request(path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { apikey: apiKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${data?.code ?? data?.error_code ?? ''} ${data?.message ?? ''}`);
  return data;
}

let accounts = [];
try { accounts = JSON.parse(await readFile(accountsPath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!Array.isArray(accounts) || accounts.length > 2) throw new Error('Invalid dedicated QA accounts file');

for (let index = accounts.length; index < 2; index++) {
  const suffix = randomBytes(4).toString('hex');
  const username = `qa${index ? 'b' : 'a'}${suffix}`;
  const account = {
    id: null,
    username,
    displayName: index ? 'QA Messagerie Beta' : 'QA Messagerie Alpha',
    email: `${username}@example.test`,
    password: `${randomBytes(24).toString('base64url')}!aA4`,
  };
  const signup = await request('/auth/v1/signup', {
    body: { email: account.email, password: account.password, data: {
      username, artist_type: 'IA', primary_role_key: 'dj', avatar_style_key: 'avatar_17',
      onboarding_completed: false, qa_messaging_dual_agent: true,
    } },
  });
  if (!signup?.user?.id || !signup?.access_token) throw new Error('QA signup requires an auto-confirmed session');
  account.id = signup.user.id;
  accounts.push(account);
  await writeFile(accountsPath, `${JSON.stringify(accounts, null, 2)}\n`, { mode: 0o600 });
}

// An earlier interrupted run may have signed up before validating the app's
// short username rule. Keep the account IDs and credentials, then complete it.
for (const [index, account] of accounts.entries()) {
  if (!account.username.startsWith('qa_msg_')) continue;
  account.username = `qa${index ? 'b' : 'a'}${account.id.replaceAll('-', '').slice(0, 8)}`;
}
await writeFile(accountsPath, `${JSON.stringify(accounts, null, 2)}\n`, { mode: 0o600 });

for (const account of accounts) {
  const session = await request('/auth/v1/token?grant_type=password', {
    body: { email: account.email, password: account.password },
  });
  if (session?.user?.id !== account.id || !session.access_token) throw new Error(`QA sign-in failed for ${account.username}`);
  await request('/rest/v1/rpc/complete_onboarding', { token: session.access_token, body: {
    p_username: account.username,
    p_display_name: account.displayName,
    p_avatar_style_key: 'avatar_17',
    p_primary_role_key: 'dj',
    p_city: 'Paris', p_country_code: 'FR', p_latitude: 48.8566, p_longitude: 2.3522,
    p_is_ghost_mode: false,
    p_show_on_public_profile: true,
  } });
}

const checks = [];
for (const [index, account] of accounts.entries()) {
  const peer = accounts[1 - index];
  const session = await request('/auth/v1/token?grant_type=password', {
    body: { email: account.email, password: account.password },
  });
  const found = await request('/rest/v1/rpc/search_messageable_profiles_v1', {
    token: session.access_token, body: { p_query: peer.username, p_limit: 20 },
  });
  checks.push({ from: account.username, peer: peer.username, searchable: Array.isArray(found) && found.some((row) => row.profile_id === peer.id) });
}
if (checks.some((item) => !item.searchable)) throw new Error(`QA contacts created but not mutually searchable: ${JSON.stringify(checks)}`);
console.log(JSON.stringify({ accountsPath, accounts: accounts.map(({ id, username }) => ({ id, username })), checks }, null, 2));
