// Authenticated QA A profile probe. The saved state stays under ignored app/build.
// Usage: node profile-marker.mjs snapshot | set RUN1_... | restore
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const stateDir = resolve(root, 'app/build/integration-run1');
const statePath = resolve(stateDir, 'profile-marker-state.json');
const command = process.argv[2];
if (!['snapshot', 'set', 'restore'].includes(command)) throw new Error('Expected snapshot, set or restore');
const runId = process.argv[3];
if (command === 'set' && !/^RUN1_[A-Za-z0-9_]{8,48}$/.test(runId ?? '')) {
  throw new Error('set requires a unique RUN1_ runId');
}

const envText = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
const property = name => envText.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]
  ?.trim().replaceAll('\\:', ':').replace(/^['"]|['"]$/g, '');
const baseUrl = property('SUPABASE_URL');
const apiKey = property('SUPABASE_PUBLISHABLE_KEY');
if (!baseUrl?.includes('dqabekaqpznjsagoxzwc') || !apiKey) {
  throw new Error('Expected LIVE QA backend configuration is unavailable');
}
const accounts = JSON.parse(await readFile(resolve(root, 'app/build/messaging-dual-agent/accounts.json'), 'utf8'));
const account = accounts[0];
if (!account?.id || !account.email || !account.password || account.id === accounts[1]?.id) {
  throw new Error('Distinct QA A/B accounts are required');
}

async function request(path, { method = 'GET', body, token, prefer } = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: {
      apikey: apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`QA request failed: HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

const session = await request('/auth/v1/token?grant_type=password', {
  method: 'POST', body: { email: account.email, password: account.password },
});
if (session?.user?.id !== account.id || !session.access_token) {
  throw new Error('QA A authentication did not match the saved account ID');
}
const token = session.access_token;
const fields = 'id,username,display_name,full_name,avatar_url,profile_image_url,avatar_style_key,avatar_icon_id';
const pathFor = (filter = '') => `/rest/v1/profiles?id=eq.${encodeURIComponent(account.id)}${filter}&select=${fields}`;
async function profile() {
  const rows = await request(pathFor(), { token });
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== account.id) {
    throw new Error('QA A owner profile is unavailable or ambiguous');
  }
  return rows[0];
}
function valueFilter(value) {
  return value === null ? '&display_name=is.null' : `&display_name=eq.${encodeURIComponent(value)}`;
}
async function change(from, to) {
  const rows = await request(pathFor(valueFilter(from)), {
    method: 'PATCH', token, prefer: 'return=representation', body: { display_name: to },
  });
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].display_name !== to) {
    throw new Error('Conditional QA profile update did not affect exactly one matching row');
  }
  return rows[0];
}

if (command === 'snapshot') {
  console.log(JSON.stringify({ at: new Date().toISOString(), profile: await profile() }, null, 2));
} else if (command === 'set') {
  await mkdir(stateDir, { recursive: true });
  try { await readFile(statePath); throw new Error('A QA marker is already pending restoration'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const before = await profile();
  const marker = `QA_${runId}`;
  if (before.display_name === marker) throw new Error('Marker already active');
  // Record the original value before mutation so a failed run can be restored.
  await writeFile(statePath, JSON.stringify({ accountId: account.id, before, marker, runId,
    createdAt: new Date().toISOString() }, null, 2), { flag: 'wx' });
  const after = await change(before.display_name, marker);
  console.log(JSON.stringify({ at: new Date().toISOString(), accountId: account.id,
    marker, originalDisplayName: before.display_name, currentDisplayName: after.display_name }));
} else {
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  if (state.accountId !== account.id || !state.before || !state.marker) {
    throw new Error('Marker state does not belong to QA A');
  }
  const current = await profile();
  if (current.display_name === state.before.display_name) {
    await unlink(statePath);
    console.log(JSON.stringify({ at: new Date().toISOString(), accountId: account.id,
      restored: true, mutationWasNotApplied: true }));
    process.exit(0);
  }
  if (current.display_name !== state.marker) {
    throw new Error('QA display name changed since marker set; refusing blind restore');
  }
  const after = await change(state.marker, state.before.display_name);
  if (after.full_name !== state.before.full_name || after.username !== state.before.username ||
      after.avatar_url !== state.before.avatar_url ||
      after.profile_image_url !== state.before.profile_image_url ||
      after.avatar_style_key !== state.before.avatar_style_key ||
      after.avatar_icon_id !== state.before.avatar_icon_id) {
    throw new Error('Other QA profile fields changed; investigate before clearing state');
  }
  await unlink(statePath);
  console.log(JSON.stringify({ at: new Date().toISOString(), accountId: account.id,
    restored: after.display_name === state.before.display_name }));
}
