import { Matrix4, Vector3 } from 'three';
import { createScreenAnchorSolver } from './vendor/globe-vinyle/shared/src/screen-anchor.mjs';
import { createOrbitCameraUpdater } from './vendor/globe-vinyle/shared/src/orbit-camera.mjs';
import { xyz, RADIUS } from './vendor/globe-vinyle/shared/src/geo.mjs';

const metresToWorld = RADIUS / 6371000;

/** Calculate the real camera destination entirely off-screen. Neither the
 * displayed pose nor its projection is changed while Newton solves the anchor. */
export function createGroundArtistDestination({ camera, view, align = null, roll = () => 0 }) {
  const scratch = camera.clone(), scratchView = { ...view };
  const updateOrbit = createOrbitCameraUpdater(scratch, scratchView, align);
  const solve = createScreenAnchorSolver(), turn = new Matrix4();
  const origin = new Vector3(), destination = new Vector3(), point = new Vector3();
  const offset = { x: 0, y: 0 };
  let angle = 0;
  const update = () => {
    updateOrbit();
    scratch.updateProjectionMatrix();
    if (angle) {
      const c = Math.cos(angle), s = Math.sin(angle), aspect = scratch.aspect;
      turn.set(c, s / aspect, 0, 0, -s * aspect, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      scratch.projectionMatrix.premultiply(turn);
      scratch.projectionMatrixInverse.copy(scratch.projectionMatrix).invert();
    }
  };
  return ({ artist, target, width, height }) => {
    if (![artist?.lon, artist?.lat, artist?.radius, artist?.halfSizeWorld, target?.x, target?.y, width, height]
      .every(Number.isFinite) || width <= 0 || height <= 0) return null;
    scratch.copy(camera); Object.assign(scratchView, view);
    angle = roll() * Math.PI / 180;
    update();
    point.fromArray(xyz(artist.lon, artist.lat, artist.radius));
    if (align) point.applyQuaternion(align);
    const projected = point.clone().project(scratch);
    const halfSize = artist.halfSizeWorld / Math.max(scratch.near, scratch.position.distanceTo(point));
    const pixelDistance = Math.hypot((projected.x + 1) * width / 2 - target.x,
      (1 - projected.y) * height / 2 - halfSize - target.y);
    if (pixelDistance < 1) return { pose: { ...view }, duration: 0 };
    // Resolve the destination around the artist, then apply the card's pixel
    // offset. Newton from a distant horizon point can be singular or diverge;
    // this geographic seed has the same local frame as hand navigation.
    const options = { view: scratchView, camera: scratch, point: [artist.lon, artist.lat],
      radius: artist.radius, x: target.x, y: target.y, width, height, align, updateCamera: update,
      maxIterations: 12,
      screenOffset: (workCamera, world) => {
        offset.y = -artist.halfSizeWorld / Math.max(workCamera.near, workCamera.position.distanceTo(world));
        return offset;
      },
    };
    const attempt = seed => {
      Object.assign(scratchView, seed); update();
      if (!solve(options)) return false;
      projected.copy(point).project(scratch);
      origin.copy(scratch.position).sub(point);
      const facing = point.dot(origin) / (artist.radius * origin.length());
      return Number.isFinite(projected.z) && projected.z >= -1 && projected.z <= 1 && facing >= .08;
    };
    let solved = attempt({ ...view, lon: artist.lon, lat: artist.lat });
    if (!solved) {
      // A very close, large host at a steep tilt can have another local
      // solution. Continue from the displayed hand-navigation frame instead.
      solved = attempt(view);
    }
    if (!solved) {
      // At minimum altitude and a steep tilt, a large host can make this
      // screen offset unreachable. Back off modestly instead of losing the fly
      // or magnifying the portrait; keep its bearing and tilt unchanged.
      for (const scale of [1.25, 1.5, 2]) {
        solved = attempt({ ...view, lon: artist.lon, lat: artist.lat, height: view.height * scale });
        if (solved) break;
      }
    }
    if (!solved) return null;
    origin.fromArray(xyz(view.lon, view.lat));
    destination.fromArray(xyz(scratchView.lon, scratchView.lat));
    const metres = origin.distanceTo(destination) / metresToWorld;
    // Nearby people use a flat pan. A farther step has a small, bounded rise,
    // keeping the same altitude, heading and tilt at arrival.
    const hop = metres > 60 ? Math.min(12, (metres - 60) * .08, view.height / metresToWorld * .06) : 0;
    return { pose: { ...scratchView, localFlight: true, groundHopHeight: hop * metresToWorld },
      duration: Math.round(Math.max(280, Math.min(1800, 280 + 240 * Math.log1p(metres / 120)
        + 180 * Math.abs(Math.log(scratchView.height / view.height))))) };
  };
}

/** One geographic flight per selection/layout. Projected-anchor updates never
 * restart it. The engine flushes this queue in its existing render loop. */
export function createGroundArtistFlight({ events = window, getPoint, viewport, solveDestination,
  startFlight, cancelFlight, invalidate, enabled = () => true }) {
  let pending = null, owner = null, lastKey = '', disposed = false;
  const cancel = () => {
    pending = null; lastKey = '';
    const previous = owner; owner = null;
    if (previous) cancelFlight(previous.flightId);
  };
  const request = event => {
    const detail = event.detail;
    if (detail?.source !== 'ground' || detail.identity == null || !detail.target
      || ![detail.target.x, detail.target.y, detail.viewportWidth, detail.viewportHeight].every(Number.isFinite)
      || detail.viewportWidth <= 0 || detail.viewportHeight <= 0) return;
    const key = [detail.identity, detail.target.x, detail.target.y, detail.viewportWidth, detail.viewportHeight].join(':');
    if (key === lastKey || key === pending?.key) return;
    pending = { ...detail, key }; invalidate();
  };
  const dismiss = event => {
    const detail = event.detail;
    if (detail?.source !== 'ground') return;
    if (pending?.identity === detail.identity) pending = null;
    if (owner?.identity !== detail.identity) return;
    cancelFlight(owner.flightId); owner = null; lastKey = '';
  };
  events.addEventListener('meewav:artist-popup-frame', request);
  events.addEventListener('meewav:artist-popup-dismiss', dismiss);
  return {
    flush() {
      if (disposed || !pending || !enabled()) return false;
      const request = pending; pending = null;
      const artist = getPoint(request.identity);
      if (!artist) return false;
      const size = viewport();
      const target = { x: request.target.x * size.viewportWidth / request.viewportWidth - size.left,
        y: request.target.y * size.viewportHeight / request.viewportHeight - size.top };
      const result = solveDestination({ artist, target, width: size.width, height: size.height });
      if (!result) return false;
      lastKey = request.key;
      if (!result.duration && owner) cancelFlight(owner.flightId);
      const flightId = result.duration ? startFlight(result.pose, result.duration) : null;
      owner = { identity: request.identity, flightId };
      return Boolean(flightId);
    },
    cancel,
    dispose() {
      if (disposed) return;
      disposed = true;
      events.removeEventListener('meewav:artist-popup-frame', request);
      events.removeEventListener('meewav:artist-popup-dismiss', dismiss);
      cancel();
    },
  };
}
