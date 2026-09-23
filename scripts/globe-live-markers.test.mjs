import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json', import.meta.url));
const { build } = require('esbuild');
const source = fileURLToPath(new URL('../app/src/main/globe-source/vendor/globe-vinyle/shared/src/live-markers.ts', import.meta.url));
const result = await build({ entryPoints: [source], bundle: true, write: false, platform: 'node', format: 'esm' });
const { parseLiveMarkers } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));

test('real Globe accepts only identified public marker rows with coarse coordinates', () => {
  const profile = '11111111-1111-4111-8111-111111111111';
  const markers = parseLiveMarkers([
    { profile_id: profile, display_name: 'Luma', primary_role_key: 'dj', avatar_icon_id: 'avatar_17', grade: 3,
      city: 'Paris', commune_code: '75056', zone_id: 'paris_charonne', longitude: 2.35, latitude: 48.86 },
    { profile_id: profile, display_name: 'Luma updated', longitude: 2.35, latitude: 48.86 },
    { profile_id: 'demo-person', display_name: 'Fiction', longitude: 2.35, latitude: 48.86 },
    { profile_id: '22222222-2222-4222-8222-222222222222', longitude: 250, latitude: 48.86 },
  ]);
  assert.equal(markers.length, 1);
  assert.equal(markers[0].id, profile);
  assert.equal(markers[0].live, true);
  assert.equal(markers[0].name, 'Luma updated');
  assert.equal(markers[0].cityId, ''); // latest row wins; no stale fixture metadata
});

test('malformed projection fails closed instead of inserting demo avatars', () => {
  assert.throws(() => parseLiveMarkers({ avatars: [] }), /illisible/);
  assert.deepEqual(parseLiveMarkers([]), []);
});

test('real marker keeps a public portrait URL but rejects Android drawable names', () => {
  const id = '33333333-3333-4333-8333-333333333333';
  const base = { profile_id: id, longitude: 2.35, latitude: 48.86 };
  assert.equal(parseLiveMarkers([{ ...base, avatar_url: 'https://example.test/portrait.webp' }])[0].avatarUrl,
    'https://example.test/portrait.webp');
  assert.equal(parseLiveMarkers([{ ...base, avatar_url: 'BeatmakerIcon' }])[0].avatarUrl, null);
});
