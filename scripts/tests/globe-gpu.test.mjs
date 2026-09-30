import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { resolveGlobeActivity, resolveVinylQuality } from '../../app/src/main/globe-source/globe-render-policy.mjs';
import { vinylRecordLayout, createVinylRecordGeometry, sampleVinylRecord } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/vinyl-record-geometry.mjs';
import { createGroundAvatarSprites } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/ground-avatar-sprites.mjs';
import { createGeographicLabels } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/geographic-labels.mjs';
import { RADIUS, xyz } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/geo.mjs';

test('mobile vinyl halves submitted triangles while keeping the complete pressed edge, UVs and analytic navigation surface', () => {
  const high = vinylRecordLayout('high'), mobile = vinylRecordLayout(resolveVinylQuality(null));
  assert.equal(mobile.bevelSegments, high.bevelSegments);
  assert.equal(resolveVinylQuality('high'), 'high');
  assert.equal(resolveVinylQuality('low'), 'low');
  const a = createVinylRecordGeometry(high), b = createVinylRecordGeometry(mobile);
  assert.equal(a.index.count / 3, 73728);
  assert.equal(b.index.count / 3, 36864);
  const profileSize = b.attributes.position.count / (mobile.angularSegments + 1);
  for (let angle = 0; angle <= mobile.angularSegments; angle++) {
    for (let profile = 0; profile < profileSize; profile++) {
      for (const name of ['position', 'normal', 'uv']) {
        const attrA = a.attributes[name], attrB = b.attributes[name];
        for (let component = 0; component < attrB.itemSize; component++) {
          assert.equal(attrB.array[(angle * profileSize + profile) * attrB.itemSize + component],
            attrA.array[(angle * 2 * profileSize + profile) * attrA.itemSize + component]);
        }
      }
    }
  }
  for (const angle of [0, .3, 2.7, Math.PI * 2]) {
    for (const radius of [high.innerRadius, high.innerRadius + high.bevel / 2, high.outerRadius / 1.2, high.outerRadius]) {
      assert.deepEqual(sampleVinylRecord(mobile, angle, radius), sampleVinylRecord(high, angle, radius));
    }
  }
  // Maximum circular chord deviation at a deliberately generous 2000px
  // projected radius. No bevel reduction, texture downscale or DPR change.
  assert.ok(2000 * (1 - Math.cos(Math.PI / mobile.angularSegments)) < .04);
  a.dispose(); b.dispose();
});

test('page visibility cannot revive an off-screen native globe or a disposed engine', async () => {
  const oldWindow = globalThis.window, oldDocument = globalThis.document;
  const page = Object.assign(new EventTarget(), { hidden: false });
  globalThis.document = page;
  globalThis.window = new EventTarget();
  const events = [];
  page.addEventListener('globelab-lifecycle', event => events.push(event.detail.active));
  try {
    const { notifyHost } = await import('../../app/src/main/globe-source/full-globe-bridge.ts');
    const bridge = window.meewavFullGlobe;
    bridge.setActive(false);
    page.hidden = true;
    assert.equal(resolveGlobeActivity(bridge.active, page.hidden), false);
    page.hidden = false;
    assert.equal(resolveGlobeActivity(bridge.active, page.hidden), false);
    notifyHost('ready');
    assert.equal(events.at(-1), false);
    bridge.setActive(true);
    assert.equal(resolveGlobeActivity(bridge.active, page.hidden), true);
    page.hidden = true;
    notifyHost('ready');
    assert.equal(events.at(-1), false);
    bridge.dispose();
    page.hidden = false;
    bridge.setActive(true);
    assert.equal(resolveGlobeActivity(bridge.active, page.hidden), false);
    assert.equal(resolveGlobeActivity(undefined, false), true);
    assert.equal(resolveGlobeActivity(undefined, true), false);
  } finally { globalThis.window = oldWindow; globalThis.document = oldDocument; }
});

function canvasDocument() {
  return { createElement: () => ({ width: 0, height: 0, getContext: () => ({
    clearRect() {}, drawImage() {}, strokeText() {}, fillText() {},
    measureText: () => ({ width: 80 }),
    getImageData: () => ({ data: new Uint8ClampedArray(256 * 256 * 4) }),
  }) }) };
}
function spriteHarness() {
  const batch = createGroundAvatarSprites();
  batch.setImages(new Map([['one', {}], ['two', {}]]));
  let geometry;
  const gpu = new Map();
  const renderer = { autoClear: true, render(scene) {
    geometry = scene.children[0].geometry;
    for (const [name, attr] of Object.entries(geometry.attributes)) {
      const saved = gpu.get(name);
      if (!saved) gpu.set(name, { version: attr.version, data: attr.array.slice() });
      else if (saved.version !== attr.version) {
        for (const range of attr.updateRanges) saved.data.set(attr.array.subarray(range.start, range.start + range.count), range.start);
        saved.version = attr.version;
      }
      attr.clearUpdateRanges();
    }
  } };
  const paint = (items, { saturation = .3, radius = 5, drop = 2, render = true } = {}) => {
    batch.begin(800, 600, items.length);
    for (const item of items) batch.add(item, 80, 1, saturation, radius, drop);
    batch.finish();
    if (render) batch.render(renderer);
    return geometry;
  };
  return { batch, paint, renderer, gpu };
}
const avatar = (icon = 'one', x = 100, color = '#aa66dd') => ({ x, y: 120, depth: .1, avatar: { icon, pinColor: color } });

test('camera motion avoids invariant avatar uploads, while icon, saturation and pin changes still reach GPU data', () => {
  const previous = globalThis.document; globalThis.document = canvasDocument();
  const { batch, paint, gpu } = spriteHarness();
  try {
    const geometry = paint([avatar()]);
    const versions = Object.fromEntries(Object.entries(geometry.attributes).map(([name, attr]) => [name, attr.version]));
    paint([avatar('one', 140)]);
    assert.ok(geometry.attributes.avatarRect.version > versions.avatarRect);
    for (const name of ['iconLayer', 'avatarSaturation', 'avatarPin', 'avatarPinDrop']) assert.equal(geometry.attributes[name].version, versions[name]);
    paint([avatar('two', 140, '#22ff66')], { saturation: .8, radius: 9, drop: 4 });
    assert.equal(gpu.get('iconLayer').data[0], 1);
    assert.equal(gpu.get('avatarSaturation').data[0], Math.fround(.8));
    assert.equal(gpu.get('avatarPin').data[3], 9);
    assert.equal(gpu.get('avatarPinDrop').data[0], 4);
    paint([avatar('two')], { radius: 0 });
    assert.deepEqual(Array.from(gpu.get('avatarPin').data.subarray(0, 4)), [0, 0, 0, 0]);
    batch.hide();
    assert.equal(geometry.instanceCount, 0);
    paint([avatar()]);
    assert.equal(geometry.instanceCount, 1);
  } finally { batch.dispose(); globalThis.document = previous; }
});

test('changes queued before a hidden batch renders are retained when its visible count later shrinks and grows', () => {
  const previous = globalThis.document; globalThis.document = canvasDocument();
  const { batch, paint, gpu } = spriteHarness();
  try {
    paint([avatar(), avatar(), avatar()]);
    paint([avatar('two'), avatar('two'), avatar('two')], { render: false });
    paint([avatar()], { render: false });
    paint([avatar(), avatar('two'), avatar('two')]);
    assert.deepEqual(Array.from(gpu.get('iconLayer').data.subarray(0, 3)), [0, 1, 1]);
  } finally { batch.dispose(); globalThis.document = previous; }
});

test('geographic labels keep their atlas coordinates on pan and repack them correctly after occlusion', () => {
  const previous = globalThis.document; globalThis.document = canvasDocument();
  let hideFirst = false;
  const layer = createGeographicLabels([
    { id: 'a', name: 'Alpha', kind: 'country', rank: 1, center: [0, 0] },
    { id: 'b', name: 'Beta', kind: 'country', rank: 1, center: [5, 0] },
  ], [], null, (_camera, anchor) => hideFirst && Math.abs(anchor.x) < .001);
  try {
    const camera = new T.PerspectiveCamera(38, 800 / 600, .00002, 2000);
    camera.position.set(...xyz(0, 0, RADIUS + 50)); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    assert.equal(layer.update(camera, 30, 800, 600), 2);
    const uv = layer.mesh.geometry.attributes.uv;
    const initialVersion = uv.version, firstUV = uv.getX(0), secondUV = uv.getX(6);
    camera.position.x += .2; camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    assert.equal(layer.update(camera, 30, 800, 600), 2);
    assert.equal(uv.version, initialVersion);
    hideFirst = true;
    assert.equal(layer.update(camera, 30, 800, 600), 1);
    assert.equal(layer.mesh.geometry.drawRange.count, 6);
    assert.equal(uv.getX(0), secondUV);
    assert.notEqual(uv.getX(0), firstUV);
    hideFirst = false;
    assert.equal(layer.update(camera, 30, 800, 600), 2);
    assert.equal(layer.mesh.geometry.drawRange.count, 12);
    assert.ok(uv.version > initialVersion);
  } finally { layer.dispose(); globalThis.document = previous; }
});
