import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json', import.meta.url));
const { build } = require('esbuild');
const source = fileURLToPath(new URL('../app/src/main/profile-source/vendor/src/features/profile/profile.service.ts', import.meta.url));
const result = await build({ entryPoints: [source], bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'profile-backend', setup(context) {
    context.onResolve({ filter: /\/lib\/supabaseClient$/ }, () => ({ path: 'backend', namespace: 'stub' }));
    context.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const supabase = {};' }));
  } }],
});
const { mapProfileRecord } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));

test('registration avatar style survives an old Android drawable identifier and a localized label', () => {
  const profile = mapProfileRecord({
    id: '11111111-1111-4111-8111-111111111111', username: 'beatmaker',
    avatar_url: 'BeatmakerIcon', avatar_name: 'Beatmaker', avatar_style_key: 'avatar_25',
    profile_image_url: null, grade: 1,
  });
  assert.equal(profile.avatarUrl, '/avatars/beatmaker.png');
  const user = mapProfileRecord({
    id: '22222222-2222-4222-8222-222222222222', username: 'utilisatrice',
    avatar_url: null, avatar_name: 'Artiste', avatar_style_key: 'avatar_3',
    profile_image_url: null, grade: 1,
  });
  assert.equal(user.avatarUrl, '/avatars/utilisatrice.png');
});

test('an uploaded portrait still takes precedence over the registration illustration', () => {
  const profile = mapProfileRecord({
    id: '33333333-3333-4333-8333-333333333333', username: 'beatmaker',
    avatar_url: 'BeatmakerIcon', avatar_name: 'Beatmaker', avatar_style_key: 'avatar_25',
    profile_image_url: 'https://example.test/portrait.webp', grade: 1,
  });
  assert.equal(profile.avatarUrl, 'https://example.test/portrait.webp');
});
