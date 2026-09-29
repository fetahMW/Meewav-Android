// Soft-delete only the two exact RUN 1 QA text messages, under their senders' JWTs.
// Usage: node cleanup-messaging-smoke.mjs <conversation-report.json> <verification.json>
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const [conversationPath, verificationPath] = process.argv.slice(2);
if (!conversationPath || !verificationPath) throw new Error('Conversation and verification reports required');
const conversation = JSON.parse(await readFile(resolve(conversationPath), 'utf8'));
const verification = JSON.parse(await readFile(resolve(verificationPath), 'utf8'));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (conversation.scope !== 'two-direction DM smoke' ||
    !/^RUN1_[A-Za-z0-9_]{8,48}$/.test(conversation.auditRunId ?? '') ||
    conversation.status !== 'passed' || verification.status !== 'pass') {
  throw new Error('Only a verified RUN 1 DM smoke can be cleaned');
}
const conversationId = verification.checks?.conversation?.conversationId;
const ids = [verification.checks?.dmAtoB?.messageId, verification.checks?.dmBtoA?.messageId];
const markers = ['a_to_b_visual_delivery', 'b_to_a_visual_delivery'].map(step =>
  conversation.results?.find(item => item.step === step)?.marker);
if (!uuid.test(conversationId ?? '') || ids.some(id => !uuid.test(id ?? '')) || ids[0] === ids[1]
    || markers.some(text => typeof text !== 'string' || !text.includes(conversation.auditRunId))) {
  throw new Error('Exact message IDs and run markers are missing');
}

const properties = await readFile(resolve(root, 'meewav.local.properties'), 'utf8');
const property = name => properties.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]
  ?.trim().replaceAll('\\:', ':').replace(/^['"]|['"]$/g, '');
const baseUrl = property('SUPABASE_URL');
const apiKey = property('SUPABASE_PUBLISHABLE_KEY');
if (!baseUrl?.includes('dqabekaqpznjsagoxzwc') || !apiKey) throw new Error('Wrong LIVE target');
const accounts = JSON.parse(await readFile(resolve(root, 'app/build/messaging-dual-agent/accounts.json'), 'utf8'));
if (!Array.isArray(accounts) || accounts.length !== 2 || accounts[0].id === accounts[1].id) {
  throw new Error('Two distinct QA accounts required');
}

async function api(path, token, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: { apikey: apiKey, ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`QA Messaging request failed: HTTP ${response.status}`);
  return response.json();
}
const tokens = [];
for (const account of accounts) {
  const session = await api('/auth/v1/token?grant_type=password', null,
    { email: account.email, password: account.password });
  if (session?.user?.id !== account.id || !session.access_token) throw new Error('QA auth mismatch');
  tokens.push(session.access_token);
}
async function messages(token) {
  const rows = [];
  let before = null;
  for (let page = 0; page < 20; page++) {
    const batch = await api('/rest/v1/rpc/get_conversation_messages_v3', token, {
      p_conversation_id: conversationId, p_before_sequence: before, p_limit: 100,
    });
    if (!Array.isArray(batch) || batch.some(row => row.conversation_id !== conversationId)) {
      throw new Error('Unexpected QA conversation response');
    }
    rows.push(...batch);
    if (ids.every(id => rows.some(row => row.id === id)) || batch.length < 100) break;
    const oldest = Math.min(...batch.map(row => Number(row.sequence)));
    if (!Number.isSafeInteger(oldest) || oldest < 1 || before !== null && oldest >= before) {
      throw new Error('Invalid message pagination');
    }
    before = oldest;
  }
  return ids.map(id => rows.find(row => row.id === id) ?? null);
}

const beforeA = await messages(tokens[0]);
const beforeB = await messages(tokens[1]);
for (let index = 0; index < 2; index++) {
  const a = beforeA[index];
  const b = beforeB[index];
  if (!a || !b || a.id !== ids[index] || b.id !== ids[index]
      || a.sender_profile_id !== accounts[index].id || b.sender_profile_id !== accounts[index].id
      || a.body !== markers[index] || b.body !== markers[index]
      || a.deleted_at || b.deleted_at) {
    throw new Error(`QA message ${index} no longer matches the verified run marker`);
  }
}
const outputPath = resolve(root, 'app/build/integration-run1/messaging-smoke-cleanup.json');
const evidence = { at: new Date().toISOString(), auditRunId: conversation.auditRunId,
  conversationId, messageIds: ids, before: [beforeA, beforeB], deletion: [], after: null };
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
for (let index = 0; index < 2; index++) {
  const result = await api('/rest/v1/rpc/delete_message_v1', tokens[index], {
    p_message_id: ids[index],
  });
  if (result?.ok !== true || result.message_id !== ids[index]
      || result.conversation_id !== conversationId || !result.deleted_at) {
    throw new Error(`Exact QA message ${index} deletion was not confirmed`);
  }
  evidence.deletion.push({ senderId: accounts[index].id, messageId: ids[index],
    deletedAt: result.deleted_at, idempotent: result.idempotent });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
}
const afterA = await messages(tokens[0]);
const afterB = await messages(tokens[1]);
for (const rows of [afterA, afterB]) for (let index = 0; index < 2; index++) {
  const row = rows[index];
  if (!row || row.id !== ids[index] || !row.deleted_at || row.body !== null
      || Array.isArray(row.attachments) && row.attachments.length > 0) {
    throw new Error('QA tombstone not visible to both members as expected');
  }
}
evidence.after = [afterA, afterB];
evidence.status = 'cleaned-to-tombstones';
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ status: evidence.status, auditRunId: evidence.auditRunId,
  conversationId, messageIds: ids, evidence: outputPath }));
