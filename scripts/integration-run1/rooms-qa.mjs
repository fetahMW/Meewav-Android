// RUN 1 QA-only Rooms API helper. All writes use QA A's authenticated session.
// Writes are restricted to exact room IDs recorded in the ignored run ledger.
// Usage: node rooms-qa.mjs create RUN1_... A|B
//        node rooms-qa.mjs find RUN1_... A|B
//        node rooms-qa.mjs register RUN1_... A|B ROOM_UUID
//        node rooms-qa.mjs snapshot ROOM_UUID
//        node rooms-qa.mjs send ROOM_UUID [RUN2_MARKER] [REQUEST_UUID]
//        node rooms-qa.mjs end ROOM_UUID
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const directory = resolve(root, 'app/build/integration-run1');
const ledgerPath = resolve(directory, 'rooms-ledger.json');
const [command, arg1, arg2, arg3] = process.argv.slice(2);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const runIdPattern = /^RUN1_[A-Za-z0-9_]{8,48}$/;
if (!['create', 'find', 'register', 'snapshot', 'send', 'end'].includes(command)) {
  throw new Error('Expected create, find, register, snapshot, send or end');
}
if (['create', 'find', 'register'].includes(command)
  && (!runIdPattern.test(arg1 ?? '') || !['A', 'B'].includes(arg2))) {
  throw new Error('A unique RUN1_ runId and label A or B are required');
}
if (command === 'register' && !uuid.test(arg3 ?? '')) throw new Error('Exact room UUID required');
if (['snapshot', 'send', 'end'].includes(command) && !uuid.test(arg1 ?? '')) {
  throw new Error('Exact room UUID required');
}
if (command === 'send' && arg2 !== undefined && !/^RUN2_[A-Z0-9_]{8,80}$/.test(arg2)) {
  throw new Error('Optional mutation marker must be a RUN2_ QA marker');
}
if (command === 'send' && arg3 !== undefined && !uuid.test(arg3)) {
  throw new Error('Optional request ID must be a UUID');
}

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

async function api(path, { method = 'GET', body, token, prefer } = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: {
      apikey: apiKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`QA Rooms request failed: HTTP ${response.status}`);
  if (response.status === 204) return null;
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}
const session = await api('/auth/v1/token?grant_type=password', {
  method: 'POST', body: { email: account.email, password: account.password },
});
if (session?.user?.id !== account.id || !session.access_token) {
  throw new Error('QA A authentication did not match the saved account ID');
}
const token = session.access_token;
const get = path => api(path, { token });
const post = (path, body, prefer) => api(path, { method: 'POST', body, token, prefer });
async function ledger() {
  try { return JSON.parse(await readFile(ledgerPath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { rooms: [], events: [] }; throw error; }
}
async function save(value) {
  await mkdir(directory, { recursive: true });
  await writeFile(ledgerPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}
async function room(id) {
  const rows = await get(`/rest/v1/rooms_v2?id=eq.${id}&select=id,host_id,type,title,status,livekit_room_name,participants_count,created_at`);
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Expected exactly one room with the given UUID');
  return rows[0];
}
function ownedRoom(record, runId, label) {
  return record.host_id === account.id && record.title === `QA_INT_${runId}_${label}`;
}

if (command === 'find') {
  const title = `QA_INT_${arg1}_${arg2}`;
  const rows = await get(`/rest/v1/rooms_v2?title=eq.${encodeURIComponent(title)}&select=id,host_id,type,title,status,created_at&order=created_at.desc`);
  console.log(JSON.stringify({ at: new Date().toISOString(), runId: arg1, label: arg2,
    rooms: Array.isArray(rows) ? rows.filter(row => row.host_id === account.id && row.title === title) : [] }));
} else if (command === 'create') {
  const runId = arg1;
  const label = arg2;
  const data = await ledger();
  if (data.rooms.some(item => item.runId === runId && item.label === label)) {
    throw new Error('This run/label is already recorded; refusing duplicate creation');
  }
  const id = randomUUID();
  const title = `QA_INT_${runId}_${label}`;
  data.rooms.push({ id, runId, label, title, ownerId: account.id, origin: 'QA API',
    state: 'prepared', preparedAt: new Date().toISOString() });
  await save(data);
  const inserted = await post('/rest/v1/rooms_v2?select=id,host_id,title,status,type', {
    id, host_id: account.id, type: 'wave', title, status: 'live',
    livekit_room_name: `room-${id}`, queue_open: false, video_format: 'landscape',
  }, 'return=representation');
  if (!Array.isArray(inserted) || inserted.length !== 1 || inserted[0].id !== id) {
    throw new Error('Room insert not confirmed; exact ID is preserved in ledger');
  }
  data.rooms.at(-1).state = 'room-created';
  await save(data);
  const membership = await post('/rest/v1/room_participants_v2?on_conflict=room_id,user_id&select=room_id,user_id,role,left_at', {
    room_id: id, user_id: account.id, role: 'host', left_at: null,
  }, 'resolution=merge-duplicates,return=representation');
  if (!Array.isArray(membership) || membership.length !== 1
    || membership[0].room_id !== id || membership[0].user_id !== account.id
    || membership[0].role !== 'host' || membership[0].left_at !== null) {
    throw new Error('QA host membership not confirmed; exact ID is preserved in ledger');
  }
  data.rooms.at(-1).state = 'live';
  await save(data);
  console.log(JSON.stringify({ at: new Date().toISOString(), runId, label, id, title,
    hostId: account.id, status: 'live' }));
} else if (command === 'register') {
  const [runId, label, id] = [arg1, arg2, arg3];
  const data = await ledger();
  if (data.rooms.some(item => item.id === id || item.runId === runId && item.label === label)) {
    throw new Error('Room UUID or run/label is already recorded');
  }
  const record = await room(id);
  if (!ownedRoom(record, runId, label)) throw new Error('Room is not the exact QA run room');
  data.rooms.push({ id, runId, label, title: record.title, ownerId: account.id,
    origin: 'Android UI', state: record.status, registeredAt: new Date().toISOString() });
  await save(data);
  console.log(JSON.stringify({ at: new Date().toISOString(), runId, label, id,
    title: record.title, status: record.status }));
} else {
  const id = arg1;
  const data = await ledger();
  const entry = data.rooms.find(item => item.id === id);
  if (!entry || !runIdPattern.test(entry.runId) || entry.ownerId !== account.id) {
    throw new Error('Room UUID is not in this RUN 1 QA ledger');
  }
  const current = await room(id);
  if (!ownedRoom(current, entry.runId, entry.label)) throw new Error('Room ownership/title changed');
  if (command === 'snapshot') {
    const [participants, messages] = await Promise.all([
      get(`/rest/v1/room_participants_v2?room_id=eq.${id}&select=room_id,user_id,role,joined_at,left_at&order=joined_at.asc`),
      get(`/rest/v1/room_messages_v2?room_id=eq.${id}&select=id,room_id,user_id,content,created_at,is_system,is_highlighted&order=created_at.desc&limit=80`),
    ]);
    console.log(JSON.stringify({ at: new Date().toISOString(), room: current, participants, messages }));
  } else if (command === 'send') {
    if (current.status !== 'live') throw new Error('Room is not live');
    const requestId = arg3 ?? randomUUID();
    const content = arg2 ?? `QA_INT_${entry.runId}_${entry.label}_MUTATION_${Date.now()}`;
    data.events.push({ roomId: id, requestId, content, state: 'prepared',
      at: new Date().toISOString() });
    await save(data);
    const result = await post('/rest/v1/rpc/rooms_send_message_idempotent_v1', {
      p_room_id: id, p_content: content, p_client_request_id: requestId,
    });
    data.events.at(-1).state = 'submitted';
    await save(data);
    console.log(JSON.stringify({ at: new Date().toISOString(), roomId: id, requestId,
      content, response: result }));
  } else {
    await post('/rest/v1/rpc/rooms_end_room_v1', { p_room_id: id });
    const after = await room(id);
    if (after.status !== 'ended') throw new Error('Exact QA room did not end');
    entry.state = 'ended';
    entry.endedAt = new Date().toISOString();
    await save(data);
    console.log(JSON.stringify({ at: new Date().toISOString(), roomId: id, status: after.status }));
  }
}
