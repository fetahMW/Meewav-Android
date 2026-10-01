import test from 'node:test';
import assert from 'node:assert/strict';
import { portraitArtistPopup } from '../../app/src/main/globe-source/portrait-artist-popup';
import { mobileArtistPanel } from '../../app/src/main/globe-source/mobile-artist-panel';
import { createArtistAnchorPublisher } from '../../app/src/main/globe-source/artist-popup-anchor';

const viewport = { width: 412, height: 863 };
const anchor = (x, y, clearance = 40, dimensions = viewport) => ({ x, y, clearance,
  viewportWidth: dimensions.width, viewportHeight: dimensions.height });
const insets = { top: 72, bottom: 12 };
const place = (point, previous) => portraitArtistPopup(viewport, point, insets, previous);

test('a central avatar gets a compact card above it with a visible gap', () => {
  const card = place(anchor(206, 450));
  assert.equal(card.placement, 'above');
  assert.equal(card.width, 280);
  assert.equal(card.height, 304);
  assert.equal(card.left + card.arrowX, 206);
  assert.equal(card.top + card.height + 14, 410);
});
test('an avatar near the top gets its card below, not to either side', () => {
  const card = place(anchor(90, 128));
  assert.equal(card.placement, 'below');
  assert.equal(card.top, 182);
  assert.equal(card.height, 304);
});
test('an avatar near the bottom gets its card above', () => {
  const card = place(anchor(330, 808));
  assert.equal(card.placement, 'above');
  assert.equal(card.top + card.height, 754);
});
test('a taller phone does not stretch the portrait card', () => {
  const larger = { width: 412, height: 1400 };
  const card = portraitArtistPopup(larger, anchor(206, 700, 40, larger), insets);
  assert.equal(card.width, 280);
  assert.equal(card.height, 304);
});
test('a wide portrait tablet never acquires a side panel', () => {
  const tablet = { width: 800, height: 1280 };
  const card = portraitArtistPopup(tablet, anchor(400, 640, 70, tablet), insets);
  assert.equal(card.width, 280);
  assert.equal(card.height, 304);
  assert.ok(['above', 'below'].includes(card.placement));
  assert.equal(card.left + card.width / 2, 400);
});
test('edge avatars keep the complete card on screen and its pointer on the card', () => {
  for (const x of [0, 12, 40, 372, 400, 412]) {
    const card = place(anchor(x, 450));
    assert.ok(card.left >= 12);
    assert.ok(card.left + card.width <= 400);
    assert.ok(card.arrowX >= 24 && card.arrowX <= card.width - 24);
  }
});
test('a small phone gets a bounded card without horizontal clipping', () => {
  const small = { width: 260, height: 568 };
  const card = portraitArtistPopup(small, anchor(130, 284, 38, small), insets);
  assert.equal(card.width, 236);
  assert.ok(card.height < 304);
  assert.ok(card.top >= 72 && card.top + card.height <= 556);
  assert.equal(card.placement, 'below');
});
test('constrained height shrinks the card into the larger vertical space', () => {
  const short = { width: 412, height: 620 };
  const card = portraitArtistPopup(short, anchor(206, 340, 70, short), insets);
  assert.equal(card.placement, 'above');
  assert.equal(card.height, 184);
  assert.equal(card.top, 72);
  assert.equal(card.top + card.height + 14, 270);
});
test('ring player top inset is respected', () => {
  const card = portraitArtistPopup(viewport, anchor(206, 200), { top: 126, bottom: 12 });
  assert.equal(card.placement, 'below');
  assert.ok(card.top >= 126);
});
test('a prior side that still fits is retained', () => {
  const card = place(anchor(206, 450, 0), 'below');
  assert.equal(card.placement, 'below');
  assert.equal(card.height, 304);
});
test('small movements around equal available space do not flip the card', () => {
  const middle = (72 + 851) / 2;
  assert.equal(place(anchor(206, middle - 2, 100), 'above').placement, 'above');
  assert.equal(place(anchor(206, middle + 2, 100), 'below').placement, 'below');
});
test('the card switches sides once the previous side no longer has room', () => {
  assert.equal(place(anchor(206, 130), 'above').placement, 'below');
  assert.equal(place(anchor(206, 810), 'below').placement, 'above');
});
test('a newly projected anchor after rotation takes precedence over old ratios', () => {
  const fresh = anchor(100, 160, 48);
  const card = place(fresh);
  assert.equal(card.placement, 'below');
  assert.equal(card.top, 222);
  assert.equal(card.left + card.arrowX, 100);
});
test('a stale anchor scales safely until the renderer publishes the new projection', () => {
  const oldViewport = { width: 863, height: 412 };
  const card = place(anchor(431.5, 206, 40, oldViewport));
  assert.equal(card.left + card.width / 2, 206);
  assert.ok(card.top >= 72 && card.top + card.height <= 851);
});
test('landscape keeps its established screen rectangle', () => {
  globalThis.document = { documentElement: { dataset: { globeOrientation: 'landscape' } } };
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
  assert.deepEqual(mobileArtistPanel({ width: 863, height: 412 }), {
    scale: 1, width: 288, height: 328, left: 499, top: 72, logicalHeight: 328,
  });
  assert.deepEqual(mobileArtistPanel({ width: 600, height: 360 }), {
    scale: 1, width: 288, height: 276, left: 236, top: 72, logicalHeight: 276,
  });
  delete globalThis.document;
  delete globalThis.getComputedStyle;
});
test('anchor movement emits no selection event and no duplicate subpixel update', () => {
  const events = new EventTarget();
  const updates = [];
  let selections = 0;
  events.addEventListener('meewav:ground-avatar-anchor', e => updates.push(e.detail));
  events.addEventListener('meewav:ground-avatar-select', () => selections++);
  const publish = createArtistAnchorPublisher(events, 'meewav:ground-avatar-anchor', 'id');
  assert.equal(publish('artist-1', anchor(206, 450)), true);
  assert.equal(publish('artist-1', anchor(206.1, 450.2)), false);
  assert.equal(publish('artist-1', anchor(207, 450)), true);
  assert.equal(updates.length, 2);
  assert.equal(selections, 0);
});
test('viewport changes republish an anchor even when its centre does not move', () => {
  const events = new EventTarget();
  const updates = [];
  events.addEventListener('meewav:ring-portrait-anchor', e => updates.push(e.detail));
  const publish = createArtistAnchorPublisher(events, 'meewav:ring-portrait-anchor', 'instanceId');
  publish(4, anchor(200, 200));
  publish(4, anchor(200, 200, 40, { width: 863, height: 412 }));
  assert.equal(updates.length, 2);
  assert.equal(updates[1].instanceId, 4);
  assert.equal(updates[1].anchor.viewportWidth, 863);
});
