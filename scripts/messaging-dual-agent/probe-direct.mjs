// Diagnostic for the LIVE direct-conversation RPC with dedicated QA accounts.
// Prints only HTTP status and sanitized error code, never credentials or tokens.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repo = resolve(import.meta.dirname, '../..');
const accounts = JSON.parse(await readFile(resolve(repo, 'app/build/messaging-dual-agent/accounts.json'), 'utf8'));
const properties = await readFile(resolve(repo, 'meewav.local.properties'), 'utf8');
const value = (name) => properties.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim();
const url = value('SUPABASE_URL');
const key = value('SUPABASE_PUBLISHABLE_KEY');
if (!url || !key || accounts?.length !== 2) throw new Error('configuration_missing');
const call = async (path, token, body) => {
  const response = await fetch(new URL(path, url), {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => ({}));
  return { status: response.status, result };
};
const auth = await call('/auth/v1/token?grant_type=password', key, {
  email: accounts[0].email, password: accounts[0].password,
});
if (auth.status !== 200 || auth.result.user?.id !== accounts[0].id) {
  console.log(JSON.stringify({ step: 'auth', status: auth.status, code: auth.result.error_code ?? null }));
  process.exit(1);
}
const result = await call('/rest/v1/rpc/get_or_create_direct_conversation_v1', auth.result.access_token, {
  p_other_profile_id: accounts[1].id,
  p_idempotency_key: `qa-probe:${crypto.randomUUID()}`,
});
console.log(JSON.stringify({ step: 'direct_rpc', status: result.status, code: result.result.code ?? null,
  message: result.status === 200 ? null : result.result.message ?? null,
  conversationId: result.status === 200 ? result.result.conversation_id ?? null : null }));
if (result.status !== 200) process.exitCode = 1;
