import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json', import.meta.url));
const { code } = await require('esbuild').transform(await readFile(new URL('../app/src/main/messaging-source/sessionIdentity.ts', import.meta.url), 'utf8'), { loader: 'ts', format: 'esm' });
const { createNativeSessionReader } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const session = () => ({ preview: false, url: 'https://example.supabase.co', key: 'public-key', token: 'short-token', userId: 'owner-a' });

test('demo and logged-out readers do not contact Auth', async () => {
  for (const config of [{ ...session(), preview: true }, { ...session(), token: null }, undefined]) {
    const reader = createNativeSessionReader(() => config, () => { throw Error('must not fetch'); });
    assert.ok((await reader.getSessionUser()).error);
  }
});
test('uses the native access token without a second SDK session', async () => {
  const reader = createNativeSessionReader(session, async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/user');
    assert.equal(options.headers.Authorization, 'Bearer short-token');
    assert.equal(options.cache, 'no-store');
    return Response.json({ id: 'owner-a', email: 'recipe@example.test' });
  });
  assert.equal((await reader.getSessionUser()).data.user.id, 'owner-a');
});
test('discard stale reads when a different account arrives or logout happens', async () => {
  for (const after of [{ ...session(), userId: 'owner-b' }, { ...session(), token: null }]) {
    let config = session();
    const reader = createNativeSessionReader(() => config, async () => { config = after; return Response.json({ id: 'owner-a' }); });
    assert.ok((await reader.getSessionUser()).error);
  }
});
test('does not accept a mismatched server identity or expose provider errors', async () => {
  for (const response of [Response.json({ id: 'owner-b' }), Response.json({ secret: 'hidden' }, { status: 401 })]) {
    const value = await createNativeSessionReader(session, async () => response).getSessionUser();
    assert.equal(value.data.user, null); assert.ok(value.error); assert.ok(!value.error.message.includes('hidden'));
  }
});
test('MFA factors come from the same authenticated owner read', async () => {
  const reader = createNativeSessionReader(session, async () => Response.json({ id: 'owner-a', factors: [
    { id: '1', factor_type: 'totp', status: 'verified' }, { id: '2', factor_type: 'totp', status: 'unverified' },
  ] }));
  const value = await reader.getSessionFactors();
  assert.equal(value.data.all.length, 2); assert.equal(value.data.totp.length, 1);
});
