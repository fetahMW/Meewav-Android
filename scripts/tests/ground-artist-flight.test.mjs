import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3, Matrix4, Quaternion, Euler } from 'three';
import { groundArtistPopup } from '../../app/src/main/globe-source/ground-artist-popup';
import { createGroundAvatarEmphasis, groundAvatarSelectionMetrics } from '../../app/src/main/globe-source/ground-avatar-selection.mjs';
import { createGroundArtistDestination, createGroundArtistFlight } from '../../app/src/main/globe-source/ground-artist-flight.mjs';
import { createCamera } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/camera.mjs';
import { createOrbitCameraUpdater } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/orbit-camera.mjs';
import { RADIUS, xyz } from '../../app/src/main/globe-source/vendor/globe-vinyle/shared/src/geo.mjs';

const metresToWorld = RADIUS / 6371000;
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `Expected ${actual} within ${tolerance} of ${expected}`);

function geographicFixture({ landscape = false, roll = 0, pitch = 45, height = .015, host = false, bearing = 32, artistOffset = null } = {}) {
  const size = landscape ? { width: 863, height: 412 } : { width: 412, height: 863 };
  const motion = createCamera({ lon: 2.365, lat: 48.855, height, pitch, bearing });
  const initial = { ...motion.view };
  const camera = new PerspectiveCamera(38, size.width / size.height, .00002, 500);
  const align = new Quaternion().setFromEuler(new Euler(.24, .15, -.38));
  const updateOrbit = createOrbitCameraUpdater(camera, motion.view, align);
  const update = () => {
    updateOrbit(); camera.updateProjectionMatrix();
    const c = Math.cos(roll * Math.PI / 180), s = Math.sin(roll * Math.PI / 180), aspect = camera.aspect;
    camera.projectionMatrix.premultiply(new Matrix4().set(c, s / aspect, 0, 0,
      -s * aspect, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  };
  update();
  const artists = new Map([
    ['artist-1', { lon: 2.366, lat: 48.856 }],
    ['artist-2', { lon: 2.3645, lat: 48.8555 }],
  ].map(([id, point]) => [id, { ...point, id, radius: RADIUS + 10 * metresToWorld,
    halfSizeWorld: groundAvatarSelectionMetrics({ size: 53.3 * (host ? 2.5 : 1), avatar: { isHost: host } }).halfSpriteSize * .003 }]));
  if (artistOffset) Object.assign(artists.get('artist-1'), { lon: initial.lon + artistOffset.lon, lat: initial.lat + artistOffset.lat });
  const events = new EventTarget(), flights = [];
  let enabled = true, currentFlightId = null, invalidations = 0;
  const project = (identity = 'artist-1') => {
    const artist = artists.get(identity);
    const world = new Vector3(...xyz(artist.lon, artist.lat, artist.radius)).applyQuaternion(align);
    const point = world.clone().project(camera);
    return { x: (point.x + 1) * size.width / 2,
      y: (1 - point.y) * size.height / 2 - artist.halfSizeWorld / Math.max(camera.near, camera.position.distanceTo(world)) };
  };
  const target = groundArtistPopup(size, { x: 20, y: 100, clearance: 20,
    viewportWidth: size.width, viewportHeight: size.height },
  { top: 68, bottom: 12, left: landscape ? 104 : 0, right: landscape ? 60 : 0 }, landscape).avatarTarget;
  const solve = createGroundArtistDestination({ camera, view: motion.view, align, roll: () => roll });
  const controller = createGroundArtistFlight({ events, getPoint: identity => artists.get(identity),
    viewport: () => ({ ...size, left: 0, top: 0, viewportWidth: size.width, viewportHeight: size.height }),
    solveDestination: solve,
    startFlight: (pose, duration) => {
      const from = { ...motion.view };
      currentFlightId = motion.flyTo(pose, duration);
      flights.push({ from, pose, duration, id: currentFlightId }); return currentFlightId;
    },
    cancelFlight: id => {
      if (id != null && id === currentFlightId && motion.isFlying()) motion.interrupt();
    }, invalidate: () => invalidations++, enabled: () => enabled,
  });
  const request = (identity = 'artist-1', extra = {}) => events.dispatchEvent(new CustomEvent('meewav:artist-popup-frame', {
    detail: { source: 'ground', identity, anchor: { ...project(identity), clearance: 20,
      viewportWidth: size.width, viewportHeight: size.height }, target,
    viewportWidth: size.width, viewportHeight: size.height, ...extra },
  }));
  const dismiss = (identity = 'artist-1') => events.dispatchEvent(new CustomEvent('meewav:artist-popup-dismiss', {
    detail: { source: 'ground', identity },
  }));
  const step = (dt = 1 / 60) => { controller.flush(); motion.tick(dt); update(); };
  const finish = () => { for (let i = 0; i < 180; i++) step(); };
  return { camera, motion, initial, artists, flights, controller, target, solve, project, request, dismiss, step, finish,
    set enabled(value) { enabled = value; }, get invalidations() { return invalidations; } };
}

test('calculating a ground destination never mutates the displayed camera or pose', () => {
  const f = geographicFixture();
  const position = f.camera.position.clone(), rotation = f.camera.quaternion.clone(), projection = f.camera.projectionMatrix.clone();
  const result = f.solve({ artist: f.artists.get('artist-1'), target: f.target, width: 412, height: 863 });
  assert.ok(result && result.duration > 0);
  assert.deepEqual(f.motion.view, f.initial);
  assert.ok(f.camera.position.equals(position)); assert.ok(f.camera.quaternion.equals(rotation));
  assert.ok(f.camera.projectionMatrix.equals(projection));
  assert.notDeepEqual([result.pose.lon, result.pose.lat], [f.initial.lon, f.initial.lat]);
  f.controller.dispose();
});

test('ground flight moves the real camera and lands the enlarged artist below the fixed card', () => {
  const f = geographicFixture(), initialPosition = f.camera.position.clone();
  f.request(); assert.equal(f.controller.flush(), true);
  const departure = { ...f.motion.view };
  f.step();
  const totalDistance = Math.hypot(f.flights[0].pose.lon - departure.lon, f.flights[0].pose.lat - departure.lat);
  assert.ok(Math.hypot(f.motion.view.lon - departure.lon, f.motion.view.lat - departure.lat) < totalDistance * .005);
  f.finish();
  assert.ok(f.camera.position.distanceTo(initialPosition) > 1e-5);
  near(f.project().x, f.target.x, 1); near(f.project().y, f.target.y, 1);
  near(f.motion.view.height, f.initial.height); near(f.motion.view.pitch, f.initial.pitch); near(f.motion.view.bearing, f.initial.bearing);
  assert.equal(f.motion.isFlying(), false); f.controller.dispose();
});

test('anchor refreshes during real motion cannot restart or amplify the ground flight', () => {
  const f = geographicFixture();
  f.request();
  for (let i = 0; i < 90; i++) { f.step(); f.request(); }
  assert.equal(f.flights.length, 1);
  near(f.project().x, f.target.x, 1); near(f.project().y, f.target.y, 1);
  assert.equal(f.motion.isFlying(), false); f.controller.dispose();
});

test('closing the profile after arrival retains the physical camera destination', () => {
  const f = geographicFixture(); f.request(); f.finish();
  const arrival = { ...f.motion.view }, position = f.camera.position.clone();
  f.dismiss(); f.finish();
  assert.deepEqual(f.motion.view, arrival); assert.ok(f.camera.position.equals(position));
  f.controller.dispose();
});

test('switching artists starts from the displayed pose and stale dismissal cannot cancel the new flight', () => {
  const f = geographicFixture(); f.request();
  for (let i = 0; i < 10; i++) f.step();
  const displayed = { ...f.motion.view };
  f.request('artist-2'); f.controller.flush();
  assert.deepEqual(f.flights[1].from, displayed); assert.deepEqual(f.motion.view, displayed);
  f.dismiss('artist-1'); assert.equal(f.motion.isFlying(), true);
  f.finish(); near(f.project('artist-2').x, f.target.x, 1); near(f.project('artist-2').y, f.target.y, 1);
  f.controller.dispose();
});

test('manual navigation cancels an active artist flight without springing back', () => {
  const f = geographicFixture(); f.request();
  for (let i = 0; i < 10; i++) f.step();
  f.controller.cancel(); f.motion.drag(.0002, -.0001); f.motion.release();
  const displayed = { ...f.motion.view };
  f.dismiss(); f.finish();
  assert.deepEqual(f.motion.view, displayed); assert.equal(f.flights.length, 1);
  f.controller.dispose();
});

test('manual input clears a deferred flight before orientation or pointers settle', () => {
  const f = geographicFixture(); f.enabled = false; f.request();
  f.controller.cancel(); f.enabled = true; f.finish();
  assert.equal(f.flights.length, 0); assert.deepEqual(f.motion.view, f.initial);
  f.controller.dispose();
});

test('deferred orientation changes only fly to the latest selected artist', () => {
  const f = geographicFixture(); f.enabled = false;
  f.request(); f.request('artist-2'); f.step(); assert.equal(f.flights.length, 0);
  f.enabled = true; f.finish(); assert.equal(f.flights.length, 1);
  near(f.project('artist-2').x, f.target.x, 1); near(f.project('artist-2').y, f.target.y, 1);
  f.controller.dispose();
});

test('physical centring works in both phone orientations, rolled projections and tilted views', () => {
  for (const landscape of [false, true]) for (const roll of [0, 90, 180, -90]) for (const pitch of [0, 60]) {
    const f = geographicFixture({ landscape, roll, pitch });
    f.request(); f.finish();
    assert.equal(f.flights.length, 1, `landscape=${landscape} roll=${roll} pitch=${pitch}`);
    near(f.project().x, f.target.x, 1); near(f.project().y, f.target.y, 1);
    near(f.motion.view.height, f.initial.height); near(f.motion.view.pitch, pitch);
    f.controller.dispose();
  }
});

test('a centred artist can reopen without an unnecessary second fly', () => {
  const f = geographicFixture(); f.request(); f.finish(); f.dismiss();
  f.request(); f.finish(); assert.equal(f.flights.length, 1); f.controller.dispose();
});

test('a visible distant horizon artist always starts a real fly and arrives under the card', () => {
  const f = geographicFixture({ height: .1, pitch: 75, bearing: 0, artistOffset: { lon: 0, lat: .12 } });
  const initialPoint = f.project();
  assert.ok(initialPoint.x >= 0 && initialPoint.x <= 412 && initialPoint.y >= 0 && initialPoint.y <= 863);
  f.request(); f.controller.flush();
  assert.equal(f.flights.length, 1);
  assert.ok(f.flights[0].duration > 1000);
  f.finish();
  near(f.project().x, f.target.x, 1); near(f.project().y, f.target.y, 1);
  assert.ok(f.motion.view.lat > f.initial.lat + .1);
  f.controller.dispose();
});

test('arrival remains reachable for far, close and side avatars at steep tilts in both orientations', () => {
  for (const landscape of [false, true]) for (const pitch of [45, 60, 75]) for (const height of [.003, .008, .015, .1]) {
    for (const host of [false, true]) for (const artistOffset of [{ lon: .005, lat: 0 }, { lon: -.04, lat: 0 }, { lon: .04, lat: .01 }, { lon: 0, lat: .12 }]) {
      const f = geographicFixture({ landscape, pitch, height, host, artistOffset });
      f.request(); f.finish();
      assert.equal(f.flights.length, 1, `landscape=${landscape} pitch=${pitch} height=${height} host=${host} offset=${JSON.stringify(artistOffset)}`);
      near(f.project().x, f.target.x, 1); near(f.project().y, f.target.y, 1);
      assert.ok(f.motion.view.height >= height && f.motion.view.height <= height * 2);
      near(f.motion.view.pitch, pitch); near(f.motion.view.bearing, 32);
      f.controller.dispose();
    }
  }
});

test('nearby camera movement stays flat while a farther flight only has a bounded small hop', () => {
  const close = geographicFixture({ height: .003 });
  const displayed = close.project(); close.request('artist-1', { target: { x: displayed.x + 8, y: displayed.y + 4 } });
  close.controller.flush(); assert.equal(close.flights[0].pose.groundHopHeight, 0);
  for (let i = 0; i < 90; i++) { close.step(); near(close.motion.view.height, .003); }
  close.controller.dispose();
  const far = geographicFixture(); far.request(); far.controller.flush();
  assert.ok(far.flights[0].pose.groundHopHeight > 0);
  assert.ok(far.flights[0].pose.groundHopHeight <= 12 * metresToWorld);
  for (let i = 0; i < 90; i++) { far.step(); assert.ok(far.motion.view.height <= far.initial.height + 12 * metresToWorld + 1e-10); }
  near(far.motion.view.height, far.initial.height); far.controller.dispose();
});

test('real sprite radius and the enlarged host portrait determine the arrival centre', () => {
  for (const host of [false, true]) for (const height of [.003, .03]) {
    const f = geographicFixture({ host, height }); f.request(); f.finish();
    assert.equal(f.flights.length, 1, `host=${host} height=${height}`);
    near(f.project().x, f.target.x, 1); near(f.project().y, f.target.y, 1);
    f.controller.dispose();
  }
});

test('portrait enlargement eases in and stops invalidating after it settles', () => {
  let time = 0;
  const emphasis = createGroundAvatarEmphasis(() => time);
  assert.equal(emphasis.moving, false); emphasis.start();
  assert.equal(emphasis.value, 0); assert.equal(emphasis.moving, true);
  let previous = 0;
  for (time = 16; time <= 144; time += 16) { assert.ok(emphasis.value > previous); previous = emphasis.value; }
  time = 160; assert.equal(emphasis.value, 1); assert.equal(emphasis.moving, false);
  time = 3000; assert.equal(emphasis.value, 1); assert.equal(emphasis.moving, false);
  const reduced = createGroundAvatarEmphasis(() => time, true); reduced.start();
  assert.equal(reduced.value, 1); assert.equal(reduced.moving, false);
});

test('invalid framing and disposed listeners cannot move the camera', () => {
  const f = geographicFixture();
  f.request('artist-1', { target: { x: NaN, y: 100 } }); f.finish();
  assert.equal(f.flights.length, 0); f.controller.dispose();
  const invalidations = f.invalidations; f.request(); f.finish();
  assert.equal(f.invalidations, invalidations); assert.equal(f.flights.length, 0);
  assert.deepEqual(f.motion.view, f.initial);
});
