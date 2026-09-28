import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createRequire } from 'node:module';

// Use the same installed compiler as build-messaging.mjs.
const require = createRequire(new URL('../../Meewav-Web/vendor/globe-vinyle/package.json', import.meta.url));
const { transform } = require('esbuild');

const source = await readFile(new URL('../app/src/main/messaging-source/voiceHoldGesture.ts', import.meta.url), 'utf8');
const { code } = await transform(source, { loader: 'ts', format: 'esm', target: 'es2022' });
const { VoiceHoldGesture } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

test('a held recording sends on its own release, once', () => {
  const gesture = new VoiceHoldGesture();
  assert.equal(gesture.begin(1, 300), true);
  gesture.started(100);
  assert.equal(gesture.finish(1, 900), 'send');
  assert.equal(gesture.finish(1, 910), null);
});

test('release before permission is granted cannot send or revive capture', () => {
  const gesture = new VoiceHoldGesture();
  gesture.begin(1, 300);
  assert.equal(gesture.finish(1, 900), 'cancel');
  gesture.started(1000);
  assert.equal(gesture.active, false);
  assert.equal(gesture.finish(1, 2000), null);
});

test('a tap never sends an accidental short voice note', () => {
  const gesture = new VoiceHoldGesture();
  gesture.begin(1, 300);
  gesture.started(100);
  assert.equal(gesture.finish(1, 200), 'cancel');
});

test('slide left or release on the trash cancels', () => {
  for (const [x, overTrash] of [[200, false], [285, true]]) {
    const gesture = new VoiceHoldGesture();
    gesture.begin(1, 300);
    gesture.started(100);
    assert.equal(gesture.move(1, x, overTrash), true);
    assert.equal(gesture.finish(1, 900), 'cancel');
  }
});

test('moving back out of the cancellation zone can send normally', () => {
  const gesture = new VoiceHoldGesture();
  gesture.begin(1, 300);
  gesture.started(100);
  gesture.move(1, 200, false);
  assert.equal(gesture.move(1, 290, false), false);
  assert.equal(gesture.finish(1, 900), 'send');
});

test('a second finger cannot start, cancel or finish the first recording', () => {
  const gesture = new VoiceHoldGesture();
  gesture.begin(1, 300);
  gesture.started(100);
  assert.equal(gesture.begin(2, 300), false);
  assert.equal(gesture.move(2, 0, true), null);
  assert.equal(gesture.finish(2, 900), null);
  assert.equal(gesture.finish(1, 900), 'send');
});

test('interruption and navigation discard a held recording', () => {
  const gesture = new VoiceHoldGesture();
  gesture.begin(1, 300);
  gesture.started(100);
  assert.equal(gesture.finish(1, 900, true), 'cancel');
  gesture.begin(2, 300);
  gesture.started(1000);
  gesture.cancel();
  assert.equal(gesture.finish(2, 2000), null);
});
