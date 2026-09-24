// Read-only verification of two dedicated QA accounts against the LIVE API.
// Usage: node verify.mjs [--conversation-id UUID] [--dm-a TEXT] [--dm-b TEXT]
//        [--dm-a-id UUID] [--dm-b-id UUID]
//        [--audio-name NAME | --audio-message-id UUID] [--audio-from a|b|either]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const directory = resolve(root, 'app/build/messaging-dual-agent');
const reportPath = resolve(directory, 'verification.json');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const options = new Set([
  '--conversation-id', '--dm-a', '--dm-b', '--dm-a-id', '--dm-b-id',
  '--audio-name', '--audio-message-id', '--audio-from',
]);

function parseArgs(args) {
  if (args.includes('--help')) {
    console.log('node verify.mjs [--conversation-id UUID] [--dm-a TEXT] [--dm-b TEXT] [--dm-a-id UUID] [--dm-b-id UUID] [--audio-name NAME] [--audio-message-id UUID] [--audio-from a|b|either]');
    process.exit(0);
  }
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!options.has(key) || !value || value.startsWith('--') || result[key] !== undefined) {
      throw new VerifyError('invalid_arguments');
    }
    result[key] = value;
  }
  for (const key of ['--conversation-id', '--dm-a-id', '--dm-b-id', '--audio-message-id']) {
    if (result[key] && !uuid.test(result[key])) throw new VerifyError('invalid_arguments');
  }
  if (result['--audio-from'] && !['a', 'b', 'either'].includes(result['--audio-from'])) {
    throw new VerifyError('invalid_arguments');
  }
  return result;
}

class VerifyError extends Error {
  constructor(code, status = null) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

function property(contents, name) {
  return contents.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim().replaceAll('\\:', ':');
}

async function api(baseUrl, apiKey, path, { token, body, method = 'POST' } = {}) {
  let response;
  try {
    response = await fetch(new URL(path, baseUrl), {
      method,
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new VerifyError('network_error');
  }
  if (!response.ok) throw new VerifyError('api_http_error', response.status);
  try { return await response.json(); }
  catch { throw new VerifyError('invalid_api_response'); }
}

async function rpc(config, token, name, body) {
  return api(config.baseUrl, config.apiKey, `/rest/v1/rpc/${name}`, { token, body });
}

function conversationFor(rows, peerId) {
  if (!Array.isArray(rows)) throw new VerifyError('invalid_conversation_response');
  const matches = rows.filter((row) => row?.kind === 'direct' && row.counterpart_profile_id === peerId);
  if (matches.length > 1) throw new VerifyError('duplicate_direct_conversation');
  return matches[0]?.conversation_id ?? null;
}

async function readConversation(config, token, peer) {
  const rows = await rpc(config, token, 'list_my_conversations_v2', {
    p_cursor: null,
    p_limit: 100,
    p_kinds: ['direct'],
    p_unread_only: false,
    p_search: null,
  });
  return conversationFor(rows, peer.id);
}

async function readMessages(config, token, conversationId) {
  const all = [];
  let before = null;
  for (let page = 0; page < 20; page++) {
    const rows = await rpc(config, token, 'get_conversation_messages_v3', {
      p_conversation_id: conversationId,
      p_before_sequence: before,
      p_limit: 100,
    });
    if (!Array.isArray(rows)) throw new VerifyError('invalid_message_response');
    for (const row of rows) {
      if (row?.conversation_id !== conversationId || !uuid.test(row?.id ?? '')) {
        throw new VerifyError('invalid_message_response');
      }
      all.push(row);
    }
    if (rows.length < 100) break;
    if (page === 19) throw new VerifyError('message_history_limit_reached');
    const oldest = Math.min(...rows.map((row) => Number(row.sequence)));
    if (!Number.isSafeInteger(oldest) || oldest < 1 || (before !== null && oldest >= before)) {
      throw new VerifyError('invalid_message_pagination');
    }
    before = oldest;
  }
  return all;
}

function findSharedMessage(aRows, bRows, predicate) {
  const visibleToB = new Map(bRows.map((row) => [row.id, row]));
  return aRows
    .filter((row) => {
      const peer = visibleToB.get(row.id);
      return peer && row.conversation_id === peer.conversation_id
        && row.sender_profile_id === peer.sender_profile_id
        && row.sequence === peer.sequence && row.kind === peer.kind
        && predicate(row) && predicate(peer);
    })
    .sort((left, right) => Number(right.sequence) - Number(left.sequence))[0] ?? null;
}

function verifyDm(aRows, bRows, senderId, marker, messageId) {
  if (!marker && !messageId) return { status: 'pending', reason: 'marker_required' };
  const row = findSharedMessage(aRows, bRows, (item) =>
    item.sender_profile_id === senderId && item.kind === 'text' && !item.deleted_at
    && (!marker || item.body === marker) && (!messageId || item.id === messageId));
  return row
    ? { status: 'pass', messageId: row.id, sequence: row.sequence }
    : { status: 'pending', reason: 'message_not_visible_to_both' };
}

function audioAttachment(row, name) {
  if (!Array.isArray(row.attachments)) return null;
  return row.attachments.find((item) =>
    ['audio', 'voice_note'].includes(item?.purpose)
    && typeof item.mime_type === 'string' && item.mime_type.startsWith('audio/')
    && item.available === true && Number(item.size_bytes) > 0
    && typeof item.storage_bucket === 'string' && item.storage_bucket.length > 0
    && typeof item.storage_path === 'string' && item.storage_path.length > 0
    && (!name || item.display_name === name)) ?? null;
}

function verifyAudio(aRows, bRows, accounts, args) {
  const name = args['--audio-name'];
  const messageId = args['--audio-message-id'];
  if (!name && !messageId) return { status: 'pending', reason: 'marker_required' };
  const from = args['--audio-from'] ?? 'either';
  const row = findSharedMessage(aRows, bRows, (item) =>
    !item.deleted_at && (!messageId || item.id === messageId)
    && (from === 'either' || item.sender_profile_id === accounts[from === 'a' ? 0 : 1].id)
    && audioAttachment(item, name) !== null);
  if (!row) return { status: 'pending', reason: 'audio_not_visible_to_both' };
  const attachment = audioAttachment(row, name);
  const other = bRows.find((item) => item.id === row.id);
  const peerAttachment = audioAttachment(other, name);
  if (attachment.attachment_id !== peerAttachment.attachment_id
    || attachment.size_bytes !== peerAttachment.size_bytes) {
    return { status: 'fail', reason: 'audio_attachment_mismatch' };
  }
  return {
    status: 'pass', messageId: row.id, attachmentId: attachment.attachment_id,
    purpose: attachment.purpose, mimeType: attachment.mime_type,
    sizeBytes: attachment.size_bytes,
  };
}

async function storageReadable(config, token, attachment) {
  const bucket = encodeURIComponent(attachment.storage_bucket);
  const path = attachment.storage_path.split('/').map(encodeURIComponent).join('/');
  let response;
  try {
    response = await fetch(new URL(`/storage/v1/object/authenticated/${bucket}/${path}`, config.baseUrl), {
      method: 'GET',
      headers: { apikey: config.apiKey, Authorization: `Bearer ${token}`, Range: 'bytes=0-0' },
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new VerifyError('audio_storage_network_error');
  }
  await response.body?.cancel();
  return response.ok;
}

async function main(args) {
  const report = {
    checkedAt: new Date().toISOString(),
    status: 'pending',
    source: 'Supabase Auth + messaging read RPCs',
    checks: {},
  };
  try {
    const options = parseArgs(args);
    const [contents, savedAccounts] = await Promise.all([
      readFile(resolve(root, 'meewav.local.properties'), 'utf8'),
      readFile(resolve(directory, 'accounts.json'), 'utf8'),
    ]);
    const accounts = JSON.parse(savedAccounts);
    if (!Array.isArray(accounts) || accounts.length !== 2 || accounts.some((account) =>
      !uuid.test(account?.id ?? '') || !account.username || !account.email || !account.password)) {
      throw new VerifyError('invalid_qa_accounts');
    }
    if (accounts[0].id === accounts[1].id) throw new VerifyError('duplicate_qa_accounts');
    const baseUrl = property(contents, 'SUPABASE_URL');
    const apiKey = property(contents, 'SUPABASE_PUBLISHABLE_KEY');
    if (!baseUrl || !apiKey || new URL(baseUrl).protocol !== 'https:') {
      throw new VerifyError('invalid_local_supabase_configuration');
    }
    const config = { baseUrl, apiKey };
    const tokens = [];
    for (const account of accounts) {
      const session = await api(baseUrl, apiKey, '/auth/v1/token?grant_type=password', {
        body: { email: account.email, password: account.password },
      });
      if (session?.user?.id !== account.id || !session.access_token) {
        throw new VerifyError('qa_auth_identity_mismatch');
      }
      tokens.push(session.access_token);
    }
    const [aConversation, bConversation] = await Promise.all([
      readConversation(config, tokens[0], accounts[1]),
      readConversation(config, tokens[1], accounts[0]),
    ]);
    const expected = options['--conversation-id'];
    const shared = aConversation && aConversation === bConversation
      && (!expected || expected === aConversation);
    report.checks.conversation = {
      status: shared ? 'pass' : aConversation && bConversation && aConversation !== bConversation ? 'fail' : 'pending',
      conversationId: shared ? aConversation : null,
      visibleToA: Boolean(aConversation), visibleToB: Boolean(bConversation),
    };
    if (expected && aConversation && bConversation && !shared) {
      report.checks.conversation.status = 'fail';
    }
    if (shared) {
      const [aRows, bRows] = await Promise.all([
        readMessages(config, tokens[0], aConversation),
        readMessages(config, tokens[1], bConversation),
      ]);
      report.checks.dmAtoB = verifyDm(aRows, bRows, accounts[0].id, options['--dm-a'], options['--dm-a-id']);
      report.checks.dmBtoA = verifyDm(aRows, bRows, accounts[1].id, options['--dm-b'], options['--dm-b-id']);
      report.checks.audio = verifyAudio(aRows, bRows, accounts, options);
      if (report.checks.audio.status === 'pass') {
        const audioRow = aRows.find((row) => row.id === report.checks.audio.messageId);
        const attachment = audioAttachment(audioRow, options['--audio-name']);
        const [readableA, readableB] = await Promise.all([
          storageReadable(config, tokens[0], attachment),
          storageReadable(config, tokens[1], attachment),
        ]);
        report.checks.audio.storageReadableA = readableA;
        report.checks.audio.storageReadableB = readableB;
        if (!readableA || !readableB) report.checks.audio.status = 'fail';
      }
    } else {
      for (const name of ['dmAtoB', 'dmBtoA', 'audio']) {
        report.checks[name] = { status: 'pending', reason: 'shared_conversation_required' };
      }
    }
    report.status = Object.values(report.checks).some((check) => check.status === 'fail')
      ? 'fail'
      : Object.values(report.checks).every((check) => check.status === 'pass') ? 'pass' : 'pending';
  } catch (error) {
    // Do not print request bodies, server messages, account data, tokens, or URLs.
    report.status = 'error';
    report.error = error instanceof VerifyError ? error.code : 'unexpected_error';
    if (error instanceof VerifyError && error.status !== null) report.httpStatus = error.status;
  }
  await mkdir(directory, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(report));
  if (report.status !== 'pass') process.exitCode = report.status === 'pending' ? 2 : 1;
}

await main(process.argv.slice(2));
