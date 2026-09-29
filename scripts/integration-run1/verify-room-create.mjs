// Read-only QA A check for a single Rooms UI diagnostic window.
// Usage: node verify-room-create.mjs FROM_ISO TO_ISO UNIQUE_QA_TITLE [REQUEST_UUID]
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [fromRaw, toRaw, title, requestId] = process.argv.slice(2);
const from = new Date(fromRaw);
const to = new Date(toRaw);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!Number.isFinite(from.valueOf()) || !Number.isFinite(to.valueOf())
  || to <= from || to - from > 30 * 60_000
  || !/^QA_CREATE_UI_[A-Za-z0-9_]{12,64}$/.test(title ?? '')
  || (requestId && !uuid.test(requestId))) {
  throw new Error('Expected bounded ISO window, unique QA_CREATE_UI_ title and optional UUID');
}
const root = resolve(import.meta.dirname, '../..');
const properties = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
const property = name => properties.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]
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
async function api(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: { apikey: apiKey, ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`QA read failed: HTTP ${response.status}`);
  return response.json();
}
const session = await api('/auth/v1/token?grant_type=password', {
  method: 'POST', body: { email: account.email, password: account.password },
});
if (session?.user?.id !== account.id || !session.access_token) {
  throw new Error('QA A authentication did not match the saved account ID');
}
const token = session.access_token;
const get = path => api(path, { token });
const select = 'id,host_id,type,title,status,created_at,participants_count,livekit_room_name';
const windowRows = await get(`/rest/v1/rooms_v2?host_id=eq.${account.id}&created_at=gte.${encodeURIComponent(from.toISOString())}&created_at=lte.${encodeURIComponent(to.toISOString())}&select=${select}&order=created_at.asc`);
const byId = new Map((windowRows ?? []).map(row => [row.id, row]));
if (requestId) {
  for (const row of await get(`/rest/v1/rooms_v2?id=eq.${requestId}&select=${select}`)) byId.set(row.id, row);
}
const rows = [...byId.values()];
const ids = rows.map(row => row.id).filter(id => uuid.test(id));
const participants = ids.length ? await get(`/rest/v1/room_participants_v2?room_id=in.(${ids.join(',')})&select=room_id,user_id,role,joined_at,left_at&order=joined_at.asc`) : [];
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), from: from.toISOString(),
  to: to.toISOString(), qaUserId: account.id, expectedTitle: title,
  requestId: requestId ?? null, exactTitleRows: rows.filter(row => row.title === title),
  hostWindowRows: rows, participants }, null, 2));
