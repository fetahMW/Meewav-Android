// Dedicated LIVE identities, with resumable credentials stored only under ignored .local.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { testAccountsDirectory } from './local-state.mjs';

const root = resolve(import.meta.dirname, '../..');
const directory = testAccountsDirectory;
const stateFile = resolve(directory, 'provision-state.json');
const aliases = ['testeur1', 'testeur2', 'testeur3'];
const newAccount = alias => ({ alias, id: null,
  email: `meewav-${alias}-${randomBytes(6).toString('hex')}@example.test`,
  password: `${randomBytes(24).toString('base64url')}!aA4` });
const properties = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
const value = (key) => properties.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim().replaceAll('\\:', ':');
const supabaseUrl = value('SUPABASE_URL')?.replace(/\/$/, '');
const publishableKey = value('SUPABASE_PUBLISHABLE_KEY');
if (!supabaseUrl?.startsWith('https://') || !publishableKey?.startsWith('sb_publishable_')) throw new Error('Configuration Supabase publique absente.');

class ApiError extends Error {
  constructor(status, code) { super(`Supabase HTTP ${status} (${code || 'request_failed'})`); this.status = status; this.code = code; }
}
async function request(path, body, token, method = 'POST') {
  let response;
  try {
    response = await fetch(`${supabaseUrl}${path}`, {
      method, redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { apikey: publishableKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch { throw new Error('Supabase inaccessible : aucun compte ne peut être activé.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data?.error_code || data?.code);
  return data;
}

await mkdir(directory, { recursive: true });
let state;
try { state = JSON.parse(await readFile(stateFile, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!state) {
  state = { supabaseUrl, accounts: aliases.map(newAccount) };
}
// Reuse only the three dedicated QA identities created by this script, never personal profiles.
const previousAliases = { s22: 'testeur1', redmi: 'testeur2', windows: 'testeur3' };
if (state.supabaseUrl === supabaseUrl && Array.isArray(state.accounts)) {
  state.accounts = state.accounts.map(account => ({ ...account, alias: previousAliases[account.alias] || account.alias }));
}
if (state.supabaseUrl !== supabaseUrl || !Array.isArray(state.accounts) || state.accounts.length > aliases.length
  || state.accounts.some(a => !aliases.includes(a.alias))
  || new Set(state.accounts.map(a => a.alias)).size !== state.accounts.length) throw new Error('Configuration QA incohérente : aucun compte modifié.');
for (const alias of aliases) if (!state.accounts.some(a => a.alias === alias)) state.accounts.push(newAccount(alias));
const save = () => writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
await save(); // Persist before signup, so an interrupted run can recover the same identity.

try {
  const sessions = new Map();
  for (const account of state.accounts) {
    let session;
    try { session = await request('/auth/v1/token?grant_type=password', { email: account.email, password: account.password }); }
    catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'invalid_credentials' || account.id) throw error;
      const available = await request('/rest/v1/rpc/is_profile_username_available', { p_username: account.alias });
      if (available !== true) throw new Error(`Le nom ${account.alias} est déjà utilisé : aucun compte existant ne sera repris.`);
      const signup = await request('/auth/v1/signup', { email: account.email, password: account.password,
        data: { username: account.alias, artist_type: 'IA', primary_role_key: 'dj', avatar_style_key: 'avatar_17', qa_test_account: true } });
      if (signup?.user?.id) { account.id = signup.user.id; await save(); }
      if (!signup?.access_token) throw new Error(`Le compte ${account.alias} attend une confirmation d’e-mail. Activation impossible sans confirmation ou accès administrateur Supabase.`);
      session = signup;
    }
    if (!session?.user?.id || !session.access_token || (account.id && account.id !== session.user.id)
      || session.user.user_metadata?.qa_test_account !== true) throw new Error(`Identité QA ${account.alias} non vérifiée : aucun profil modifié.`);
    account.id = session.user.id;
    await save();
    await request('/rest/v1/rpc/complete_onboarding', {
      p_username: account.alias, p_display_name: account.alias,
      p_avatar_style_key: account.alias === 'testeur2' ? 'avatar_17' : 'avatar_18', p_primary_role_key: 'dj',
      p_city: 'Paris', p_country_code: 'FR', p_latitude: 48.8566, p_longitude: 2.3522,
      p_is_ghost_mode: false, p_show_on_public_profile: true,
    }, session.access_token);
    await request('/auth/v1/user', { data: { username: account.alias, display_name: account.alias } }, session.access_token, 'PUT');
    sessions.set(account.alias, session.access_token);
  }
  for (const account of state.accounts) {
    for (const peer of state.accounts.filter(item => item.alias !== account.alias)) {
      const found = await request('/rest/v1/rpc/search_messageable_profiles_v1', { p_query: peer.alias, p_limit: 20 }, sessions.get(account.alias));
      if (!Array.isArray(found) || !found.some(row => row.profile_id === peer.id)) throw new Error(`Le profil ${peer.alias} n’est pas encore joignable depuis ${account.alias}.`);
    }
  }
  for (const account of state.accounts) {
    await writeFile(resolve(directory, `${account.alias}.json`), `${JSON.stringify({
      version: 1, enabled: true, supabaseUrl, publishableKey, accounts: state.accounts,
    }, null, 2)}\n`, { mode: 0o600 });
  }
  console.log('Profils testeur1, testeur2 et testeur3 authentifiés, onboarding complet, recherche mutuelle validée. Configurations locales dans .local/test-accounts/.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
