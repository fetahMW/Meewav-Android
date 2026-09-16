// Real Auth/PostgREST recipe accounts only; credentials stay in ignored app/build.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const props = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
const host = props.match(/^SUPABASE_URL=(.+)$/m)[1].trim().replaceAll('\\:', ':');
const key = props.match(/^SUPABASE_PUBLISHABLE_KEY=(.+)$/m)[1].trim();
assert.equal(new URL(host).hostname, 'dqabekaqpznjsagoxzwc.supabase.co');
const dir = resolve(root, 'app/build/shared-recipe');
await mkdir(dir, { recursive: true });
async function request(path, { token, body, method = body ? 'POST' : 'GET', prefer } = {}) {
  const response = await fetch(host + path, { method, headers: {
    apikey: key, ...(token ? { Authorization: 'Bearer ' + token } : {}),
    'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}
let accounts;
try { accounts = JSON.parse(await readFile(resolve(dir, 'accounts.json'), 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') throw e; accounts = []; }
for (let n = accounts.length; n < 2; n++) {
  const username = 'recette_' + randomBytes(4).toString('hex');
  const account = { username, email: username + '@example.test', password: randomBytes(24).toString('base64url') + '!aA4' };
  const result = await request('/auth/v1/signup', { body: { email: account.email, password: account.password, data: { username, artist_type: n ? 'IA' : 'REEL', avatar_style_key: 'avatar_17', primary_role_key: 'dj', onboarding_completed: false, wiring_recipe: '20260916' } } });
  assert.equal(result.ok, true, 'Recipe signup HTTP ' + result.status);
  assert.ok(result.data?.user?.id && result.data.access_token, 'Recipe requires autoconfirmed session');
  accounts.push({ ...account, id: result.data.user.id });
  await writeFile(resolve(dir, 'accounts.json'), JSON.stringify(accounts));
}
const sessions = [];
for (const a of accounts) {
  const r = await request('/auth/v1/token?grant_type=password', { body: { email: a.email, password: a.password } });
  assert.equal(r.ok, true, 'Recipe sign-in HTTP ' + r.status);
  assert.equal(r.data.user.id, a.id);
  sessions.push(r.data);
}
const [a, b] = accounts;
const [sa, sb] = sessions;
const token = sa.access_token;
const complete = await request('/rest/v1/rpc/complete_onboarding', { token, body: {
  p_username: a.username, p_display_name: 'Recette interclients A', p_avatar_style_key: 'avatar_17', p_primary_role_key: 'dj',
  p_city: 'Paris', p_country_code: 'FR', p_latitude: 48.85431, p_longitude: 2.39012,
  p_is_ghost_mode: true, p_show_on_public_profile: false,
} });
assert.equal(complete.ok, true, 'Complete onboarding HTTP ' + complete.status);
const discovery = await request('/rest/v1/rpc/update_my_public_discovery_profile', { token, body: {
  p_scene_name: 'Recette Charonne', p_commune_code: '75056', p_zone_id: 'recipe-charonne', p_district_name: 'Charonne', p_avatar_icon_id: 'avatar_17',
} });
assert.equal(discovery.ok, true, 'Discovery write HTTP ' + discovery.status);
const owner = await request('/rest/v1/rpc/get_my_private_profile', { token, body: {} });
assert.equal(owner.data?.id, a.id); assert.equal(owner.data?.email, a.email);
const edit = await request('/rest/v1/profiles?id=eq.' + a.id, { token, method: 'PATCH', body: { bio: 'Recette interclients 20260916', primary_role_key: 'producer', artist_type: 'producer' } });
assert.equal(edit.ok, true, 'Owner edit HTTP ' + edit.status);
// A separate Auth login represents the second client for the same owner.
const other = await request('/auth/v1/token?grant_type=password', { body: { email: a.email, password: a.password } });
assert.equal(other.ok, true);
const reload = await request('/rest/v1/profiles?select=id,bio,primary_role_key,creator_type,artist_type&id=eq.' + a.id, { token: other.data.access_token });
assert.equal(reload.data?.[0]?.bio, 'Recette interclients 20260916');
assert.equal(reload.data?.[0]?.primary_role_key, 'producer'); assert.equal(reload.data?.[0]?.creator_type, 'REEL');
assert.equal(reload.data?.[0]?.artist_type, 'REEL');
const pii = await request('/rest/v1/profiles?select=email', { token: sb.access_token });
assert.equal(pii.ok, false, 'Private column must be denied');
const authority = await request('/rest/v1/profiles?id=eq.' + a.id, { token, method: 'PATCH', body: { grade: 6 } });
assert.equal(authority.ok, false, 'Authority field must be denied');
const crossWrite = await request('/rest/v1/profiles?select=id&id=eq.' + a.id, { token: sb.access_token, method: 'PATCH', body: { bio: 'must-not-persist' }, prefer: 'return=representation' });
assert.equal(crossWrite.ok, true); assert.deepEqual(crossWrite.data, []);
const hidden = await request('/rest/v1/public_profiles?select=id&id=eq.' + a.id);
assert.equal(hidden.ok, true); assert.deepEqual(hidden.data, []);
const proof = { at: new Date().toISOString(), project: new URL(host).hostname, assertions: ['two real Auth accounts', 'onboarding and discovery RPC', 'owner private read', 'profile re-read through separate Auth session', 'creator/profession compatibility', 'PII denied', 'authority write denied', 'cross-owner write denied', 'private profile hidden'], uiTested: false };
await writeFile(resolve(dir, 'identity-proof.json'), JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof));
