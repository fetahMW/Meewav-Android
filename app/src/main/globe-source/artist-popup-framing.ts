import { Matrix4, type PerspectiveCamera } from 'three';
import type { ArtistPopupAnchor } from './portrait-artist-popup';

export type ArtistPopupFrameRequest = {
  identity: string | number;
  source: 'ground' | 'ring';
  anchor: ArtistPopupAnchor;
  target: { x: number; y: number };
  viewportWidth: number;
  viewportHeight: number;
};

/** Temporary ring framing, independent of geographic motion and lens zoom.
 * Apply it AFTER scene roll: the portrait's target is always in screen pixels.
 * Ray picking shares the resulting inverse projection. No second RAF loop. */
export function createArtistPopupFraming({
  camera, viewport, invalidate, reducedMotion = false, events = window,
  now = () => performance.now(), duration = 360,
}: {
  camera: PerspectiveCamera;
  viewport: () => { width: number; height: number };
  invalidate: () => void;
  reducedMotion?: boolean;
  events?: EventTarget;
  now?: () => number;
  duration?: number;
}) {
  const shift = new Matrix4(), base = new Matrix4(), applied = new Matrix4();
  let owner: { identity: string | number; source: 'ground' | 'ring' } | null = null;
  let x = 0, y = 0, fromX = 0, fromY = 0, targetX = 0, targetY = 0, started = 0;
  let moving = false, appliedValid = false, appliedX = 0, appliedY = 0;
  let appliedWidth = 1, appliedHeight = 1, appliedNdcX = 0, appliedNdcY = 0;
  let disposed = false;
  const sample = (time: number) => {
    if (!moving) return;
    const progress = reducedMotion || duration <= 0 ? 1 : Math.max(0, Math.min(1, (time - started) / duration));
    const ease = 1 - (1 - progress) ** 3;
    x = fromX + (targetX - fromX) * ease;
    y = fromY + (targetY - fromY) * ease;
    if (progress === 1) { x = targetX; y = targetY; moving = false; }
  };
  const retarget = (nextX: number, nextY: number, restart = false, immediate = false) => {
    if (Math.abs(nextX - targetX) < .5 && Math.abs(nextY - targetY) < .5 && !immediate) return;
    const time = now();
    sample(time);
    if (!moving || restart) {
      fromX = x; fromY = y; started = time;
    }
    targetX = nextX; targetY = nextY; moving = true;
    if (immediate || reducedMotion || duration <= 0) { x = targetX; y = targetY; moving = false; }
    invalidate();
  };
  const request = (event: Event) => {
    const detail = (event as CustomEvent<ArtistPopupFrameRequest>).detail;
    if (!detail || detail.source !== 'ring' || detail.identity == null || !detail.anchor || !detail.target) return;
    const { anchor, target, viewportWidth, viewportHeight } = detail;
    if (![anchor.x, anchor.y, anchor.viewportWidth, anchor.viewportHeight, target.x, target.y,
      viewportWidth, viewportHeight].every(Number.isFinite)
      || anchor.viewportWidth <= 0 || anchor.viewportHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) return;
    // Anchor publishers use the camera's last APPLIED projection, which can
    // lag the tween sample by a frame. Using that offset avoids overshoot.
    const framed = appliedValid && applied.equals(camera.projectionMatrix);
    const previousX = framed ? appliedX * viewportWidth / appliedWidth : 0;
    const previousY = framed ? appliedY * viewportHeight / appliedHeight : 0;
    const nextX = previousX + anchor.x * viewportWidth / anchor.viewportWidth - target.x;
    const nextY = previousY + anchor.y * viewportHeight / anchor.viewportHeight - target.y;
    const newOwner = owner?.identity !== detail.identity || owner?.source !== detail.source;
    owner = { identity: detail.identity, source: detail.source };
    retarget(nextX, nextY, newOwner);
  };
  const dismiss = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.identity !== owner?.identity || detail?.source !== owner?.source) return;
    owner = null;
    retarget(0, 0, true, Boolean(detail.immediate));
  };
  events.addEventListener('meewav:artist-popup-frame', request);
  events.addEventListener('meewav:artist-popup-dismiss', dismiss);

  const restoreBaseProjection = () => {
    if (!appliedValid || !(appliedNdcX || appliedNdcY) || !applied.equals(camera.projectionMatrix)) return;
    // Restore the exact matrix, rather than subtracting floating-point shifts.
    // The scene-roll cache can then remain idle once our flight has settled.
    camera.projectionMatrix.copy(base);
    camera.projectionMatrixInverse.copy(base).invert();
  };
  const applyProjection = () => {
    const { width, height } = viewport();
    if (width <= 0 || height <= 0) return false;
    const ndcX = -2 * x / width, ndcY = 2 * y / height;
    const alreadyApplied = appliedValid && applied.equals(camera.projectionMatrix);
    if (alreadyApplied && ndcX === appliedNdcX && ndcY === appliedNdcY) return false;
    if (!alreadyApplied && !x && !y && !appliedX && !appliedY) { appliedValid = false; return false; }
    restoreBaseProjection();
    base.copy(camera.projectionMatrix);
    if (ndcX || ndcY) {
      shift.makeTranslation(ndcX, ndcY, 0);
      camera.projectionMatrix.premultiply(shift);
    }
    const changed = !appliedValid || !applied.equals(camera.projectionMatrix);
    applied.copy(camera.projectionMatrix); appliedValid = true;
    appliedX = x; appliedY = y; appliedWidth = width; appliedHeight = height;
    appliedNdcX = ndcX; appliedNdcY = ndcY;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    if (!changed) return false;
    camera.userData.meewavProjectionVersion = (camera.userData.meewavProjectionVersion || 0) + 1;
    return true;
  };
  return {
    get moving() { return moving; },
    get active() { return Boolean(x || y || targetX || targetY); },
    tick(time: number) {
      if (disposed || !moving) return false;
      const previousX = x, previousY = y;
      sample(time);
      const changed = x !== previousX || y !== previousY;
      if (changed) invalidate();
      return changed;
    },
    applyProjection,
    restoreBaseProjection,
    dispose() {
      if (disposed) return;
      disposed = true;
      events.removeEventListener('meewav:artist-popup-frame', request);
      events.removeEventListener('meewav:artist-popup-dismiss', dismiss);
      owner = null; x = y = targetX = targetY = 0; moving = false;
      applyProjection();
    },
  };
}
