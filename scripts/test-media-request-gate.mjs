import test from 'node:test';
import assert from 'node:assert/strict';
import { createMediaRequestGate } from '../app/src/main/shared-ui/media-request-gate.mjs';
const stream = () => {
  let stopped = 0;
  return { getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }], stopped: () => stopped };
};
test('accepts both cameras of the current preview without stopping them', () => {
  const gate = createMediaRequestGate(), request = gate.begin(), first = stream(), second = stream();
  assert.equal(gate.accept(request, first), true); assert.equal(gate.accept(request, second), true);
  assert.equal(first.stopped() + second.stopped(), 0);
});
test('stops every track when permission resolves after preview cancellation', async () => {
  const gate = createMediaRequestGate(), request = gate.begin(), media = stream();
  const pending = Promise.resolve(media);
  gate.invalidate();
  assert.equal(gate.accept(request, await pending), false); assert.equal(media.stopped(), 2);
});
test('rejects a late camera from an earlier camera configuration', () => {
  const gate = createMediaRequestGate(), old = gate.begin(), current = gate.begin();
  const late = stream(), wanted = stream();
  assert.equal(gate.accept(old, late), false); assert.equal(late.stopped(), 2);
  assert.equal(gate.accept(current, wanted), true); assert.equal(wanted.stopped(), 0);
});
test('inactivity blocks a late stream even before the visibility observer fires', () => {
  let active = true;
  const gate = createMediaRequestGate({ isActive: () => active }), request = gate.begin(), media = stream();
  active = false;
  assert.equal(gate.accept(request, media), false); assert.equal(media.stopped(), 2);
});
test('closing blocks callbacks and requests after unmount', () => {
  const gate = createMediaRequestGate(), request = gate.begin(); gate.close();
  const a = stream(), b = stream();
  assert.equal(gate.accept(request, a), false); assert.equal(gate.accept(gate.begin(), b), false);
  assert.equal(a.stopped() + b.stopped(), 4);
});
test('an effect remount can request again without accepting callbacks from before cleanup', () => {
  const gate = createMediaRequestGate(), old = gate.begin(); gate.close(); gate.reopen();
  const current = gate.begin(), a = stream(), b = stream();
  assert.equal(gate.accept(old, a), false); assert.equal(gate.accept(current, b), true);
});
