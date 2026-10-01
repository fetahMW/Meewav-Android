import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector2, Vector3, Matrix4, Raycaster } from 'three';
import { portraitArtistPopup } from '../../app/src/main/globe-source/portrait-artist-popup';
import { mobileArtistPanel } from '../../app/src/main/globe-source/mobile-artist-panel';
import { createArtistAnchorPublisher } from '../../app/src/main/globe-source/artist-popup-anchor';
import { createArtistPopupFraming } from '../../app/src/main/globe-source/artist-popup-framing';

const viewport = { width: 412, height: 863 };
const anchor = (x, y, clearance = 40, dimensions = viewport) => ({ x, y, clearance,
  viewportWidth: dimensions.width, viewportHeight: dimensions.height });
const insets = { top: 68, bottom: 12 };
const place = point => portraitArtistPopup(viewport, point, insets);
const near = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) <= tolerance,
  'Expected ' + actual + ' to be within ' + tolerance + ' of ' + expected);

test('portrait card has a complete, stable rectangle immediately under search', () => {
  const card = place(anchor(206, 450));
  assert.equal(card.width, 320);
  assert.equal(card.height, 420);
  assert.equal(card.top, 68);
  assert.equal(card.left, 46);
  assert.equal(card.placement, 'above');
  assert.equal(card.arrowX, 160);
});
test('avatar position cannot move or shrink the portrait card', () => {
  for (const x of [0, 12, 206, 400, 412]) for (const y of [0, 80, 430, 808, 863]) {
    const card = place(anchor(x, y));
    assert.deepEqual([card.left, card.top, card.width, card.height], [46, 68, 320, 420]);
  }
});
test('camera target puts the complete avatar under the arrow with a gap', () => {
  for (const clearance of [20, 40, 80]) {
    const card = place(anchor(50, 150, clearance));
    assert.equal(card.avatarTarget.x, card.left + card.arrowX);
    assert.equal(card.avatarTarget.y - clearance, card.top + card.height + 14);
    assert.ok(card.avatarTarget.y + clearance < viewport.height - insets.bottom);
  }
});
test('a taller phone keeps the same readable size', () => {
  const dimensions = { width: 412, height: 1400 };
  const card = portraitArtistPopup(dimensions, anchor(50, 1100, 40, dimensions), insets);
  assert.equal(card.width, 320);
  assert.equal(card.height, 420);
  assert.equal(card.top, 68);
});
test('tablet portrait keeps the same size and centres under search', () => {
  const dimensions = { width: 800, height: 1280 };
  const card = portraitArtistPopup(dimensions, anchor(20, 90, 70, dimensions), insets);
  assert.equal(card.width, 320);
  assert.equal(card.height, 420);
  assert.equal(card.left, 240);
});
test('narrow screen reserves the avatar lane without depending on marker position', () => {
  const dimensions = { width: 260, height: 568 };
  const card = portraitArtistPopup(dimensions, anchor(20, 90, 38, dimensions), insets);
  assert.deepEqual([card.left, card.top, card.width, card.height], [12, 68, 236, 344]);
  assert.ok(card.avatarTarget.y + 38 <= dimensions.height - 12);
});
test('normal 360px phone gives full content height even for an edge avatar', () => {
  const dimensions = { width: 360, height: 740 };
  const card = portraitArtistPopup(dimensions, anchor(340, 70, 48, dimensions), insets);
  assert.deepEqual([card.left, card.top, card.width, card.height], [20, 68, 320, 420]);
  assert.ok(card.avatarTarget.y + 48 < 636);
});
test('portrait inverted dock keeps the card below the actual search bottom', () => {
  const card = portraitArtistPopup(viewport, anchor(100, 160), { top: 172, bottom: 12 });
  assert.equal(card.top, 172);
  assert.equal(card.height, 420);
  assert.equal(card.avatarTarget.y, 172 + 420 + 14 + 40);
});
test('long biography or restore action can grow the card without moving its top', () => {
  const card = portraitArtistPopup(viewport, anchor(50, 100), insets, 448);
  assert.equal(card.height, 448);
  assert.equal(card.top, 68);
  assert.equal(card.left, 46);
});
test('stale landscape projection only scales avatar clearance, not card position', () => {
  const oldViewport = { width: 863, height: 412 };
  const card = place(anchor(431.5, 206, 80, oldViewport));
  assert.deepEqual([card.left, card.top, card.width, card.height], [46, 68, 320, 420]);
  near(card.avatarTarget.y, 68 + 420 + 14 + 80 * 412 / 863);
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
test('moving anchors never replay selection or duplicate subpixel movement', () => {
  const events = new EventTarget(), updates = [];
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
test('rotation republishes anchor dimensions even when its centre is unchanged', () => {
  const events = new EventTarget(), updates = [];
  events.addEventListener('meewav:ring-portrait-anchor', e => updates.push(e.detail));
  const publish = createArtistAnchorPublisher(events, 'meewav:ring-portrait-anchor', 'instanceId');
  publish(4, anchor(200, 200));
  publish(4, anchor(200, 200, 40, { width: 863, height: 412 }));
  assert.equal(updates.length, 2);
  assert.equal(updates[1].instanceId, 4);
  assert.equal(updates[1].anchor.viewportWidth, 863);
});

function fixture({ reducedMotion = false, source = 'ground', roll = 0 } = {}) {
  const size = { ...viewport };
  const camera = new PerspectiveCamera(50, size.width / size.height, .1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
  const pixelRoll = () => {
    camera.updateProjectionMatrix();
    const c = Math.cos(roll), s = Math.sin(roll), aspect = camera.aspect;
    camera.projectionMatrix.premultiply(new Matrix4().set(c, s / aspect, 0, 0,
      -s * aspect, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  };
  pixelRoll();
  const original = camera.projectionMatrix.clone();
  const point = new Vector3(-1.2, 1.5, 0);
  const events = new EventTarget();
  let time = 0, invalidations = 0;
  const project = () => {
    const ndc = point.clone().project(camera);
    return { x: (ndc.x + 1) * size.width / 2, y: (1 - ndc.y) * size.height / 2 };
  };
  const controller = createArtistPopupFraming({ camera, viewport: () => size, events,
    reducedMotion, now: () => time, invalidate: () => invalidations++ });
  const target = { x: 206, y: 548 };
  const request = (extra = {}) => events.dispatchEvent(new CustomEvent('meewav:artist-popup-frame', {
    detail: { identity: 'artist-1', source, anchor: anchor(project().x, project().y, 40, size),
      target, viewportWidth: size.width, viewportHeight: size.height, ...extra },
  }));
  const dismiss = (extra = {}) => events.dispatchEvent(new CustomEvent('meewav:artist-popup-dismiss', {
    detail: { identity: 'artist-1', source, ...extra },
  }));
  const tick = value => { time = value; controller.tick(time); controller.applyProjection(); };
  return { camera, controller, events, size, point, target, original, project, request, dismiss, tick, pixelRoll,
    get invalidations() { return invalidations; } };
}
test('screen flight brings the selected world point to the portrait target', () => {
  const f = fixture();
  f.request(); f.tick(360);
  near(f.project().x, f.target.x); near(f.project().y, f.target.y);
  assert.equal(f.controller.moving, false);
  f.controller.dispose();
});
test('screen framing preserves position, quaternion, zoom, FOV and aspect', () => {
  const f = fixture({ reducedMotion: true, source: 'ring' });
  const position = f.camera.position.clone(), rotation = f.camera.quaternion.clone();
  const lens = [f.camera.zoom, f.camera.fov, f.camera.aspect, f.camera.near, f.camera.far];
  f.request(); f.controller.applyProjection();
  assert.ok(f.camera.position.equals(position));
  assert.ok(f.camera.quaternion.equals(rotation));
  assert.deepEqual([f.camera.zoom, f.camera.fov, f.camera.aspect, f.camera.near, f.camera.far], lens);
  near(f.project().x, f.target.x); near(f.project().y, f.target.y);
  f.controller.dispose();
});
test('intermediate flight is smooth and never overshoots', () => {
  const f = fixture(), initial = f.project();
  f.request();
  for (const time of [60, 120, 180, 240, 300]) {
    f.tick(time);
    const p = f.project();
    assert.ok(p.x >= Math.min(initial.x, f.target.x) && p.x <= Math.max(initial.x, f.target.x) + 1e-7);
    assert.ok(p.y >= Math.min(initial.y, f.target.y) && p.y <= Math.max(initial.y, f.target.y) + 1e-7);
  }
  f.tick(360);
  near(f.project().x, f.target.x); near(f.project().y, f.target.y);
  f.controller.dispose();
});
test('fresh anchors during the flight cannot restart it or amplify displacement', () => {
  const f = fixture();
  f.request();
  for (const time of [60, 120, 180, 240, 300, 360]) {
    f.tick(time); f.request();
  }
  near(f.project().x, f.target.x); near(f.project().y, f.target.y);
  assert.equal(f.controller.moving, false);
  f.controller.dispose();
});
test('pixel framing stays vertical after a 90-degree physical scene roll', () => {
  const f = fixture({ reducedMotion: true, roll: Math.PI / 2 });
  f.request(); f.controller.applyProjection();
  near(f.project().x, f.target.x); near(f.project().y, f.target.y);
  f.controller.dispose();
  assert.ok(f.camera.projectionMatrix.equals(f.original));
});
test('matching inverse projection keeps the ray picker on the same artist', () => {
  const f = fixture({ reducedMotion: true, roll: Math.PI / 2 });
  f.request(); f.controller.applyProjection();
  const p = f.project(), ray = new Raycaster();
  ray.setFromCamera(new Vector2(2 * p.x / f.size.width - 1, 1 - 2 * p.y / f.size.height), f.camera);
  assert.ok(ray.ray.distanceToPoint(f.point) < 1e-7);
  f.controller.dispose();
});
test('restoring base for the scene-roll cache and reapplying does not accumulate', () => {
  const f = fixture({ reducedMotion: true, roll: .32 });
  f.request(); f.controller.applyProjection();
  const framed = f.camera.projectionMatrix.clone(), version = f.camera.userData.meewavProjectionVersion;
  for (let i = 0; i < 100; i++) {
    f.controller.restoreBaseProjection();
    assert.ok(f.camera.projectionMatrix.equals(f.original));
    assert.equal(f.controller.applyProjection(), false);
    assert.ok(f.camera.projectionMatrix.equals(framed));
  }
  assert.equal(f.camera.userData.meewavProjectionVersion, version);
  f.controller.dispose();
});
test('settled framing causes no dirty frames or projection version changes', () => {
  const f = fixture();
  f.request(); f.tick(360);
  const invalidations = f.invalidations, version = f.camera.userData.meewavProjectionVersion;
  for (const time of [400, 500, 800, 1000]) {
    assert.equal(f.controller.tick(time), false);
    assert.equal(f.controller.applyProjection(), false);
  }
  assert.equal(f.invalidations, invalidations);
  assert.equal(f.camera.userData.meewavProjectionVersion, version);
  f.controller.dispose();
});
test('base lens rebuild is respected and never gets a duplicate screen shift', () => {
  const f = fixture({ reducedMotion: true, roll: .32 });
  f.request(); f.controller.applyProjection();
  f.pixelRoll();
  f.controller.applyProjection();
  near(f.project().x, f.target.x); near(f.project().y, f.target.y);
  f.controller.dispose();
});
test('close smoothly restores the exact original projection', () => {
  const f = fixture();
  f.request(); f.tick(360);
  f.dismiss(); f.tick(540);
  assert.equal(f.controller.moving, true);
  f.tick(720);
  assert.ok(f.camera.projectionMatrix.equals(f.original));
  assert.equal(f.controller.active, false);
  f.controller.dispose();
});
test('an old profile close cannot reset a newly selected artist', () => {
  const f = fixture({ reducedMotion: true });
  f.request({ identity: 'artist-2' }); f.controller.applyProjection();
  const framed = f.camera.projectionMatrix.clone();
  f.dismiss({ identity: 'artist-1' }); f.controller.applyProjection();
  assert.ok(f.camera.projectionMatrix.equals(framed));
  f.dismiss({ identity: 'artist-2' }); f.controller.applyProjection();
  assert.ok(f.camera.projectionMatrix.equals(f.original));
  f.controller.dispose();
});
test('orientation reset removes framing immediately for the landscape camera', () => {
  const f = fixture();
  f.request(); f.tick(120);
  f.dismiss({ immediate: true }); f.controller.applyProjection();
  assert.equal(f.controller.moving, false);
  assert.equal(f.controller.active, false);
  assert.ok(f.camera.projectionMatrix.equals(f.original));
  f.controller.dispose();
});
test('Top 10 synthetic profile anchors cannot fly the globe', () => {
  const f = fixture({ reducedMotion: true });
  f.request({ source: 'top-ten' }); f.controller.applyProjection();
  assert.ok(f.camera.projectionMatrix.equals(f.original));
  assert.equal(f.controller.active, false);
  f.controller.dispose();
});
test('malformed framing coordinates are ignored without corrupting the camera', () => {
  const f = fixture({ reducedMotion: true });
  f.request({ target: { x: NaN, y: 500 } }); f.controller.applyProjection();
  assert.ok(f.camera.projectionMatrix.equals(f.original));
  assert.equal(f.controller.active, false);
  f.controller.dispose();
});
test('destroy restores the camera and removes all framing listeners', () => {
  const f = fixture({ reducedMotion: true });
  f.request(); f.controller.applyProjection(); f.controller.dispose();
  assert.ok(f.camera.projectionMatrix.equals(f.original));
  const invalidations = f.invalidations;
  f.request();
  assert.equal(f.invalidations, invalidations);
  assert.equal(f.controller.active, false);
});
