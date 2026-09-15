import { applyDirectDrag } from './vendor/globe-vinyle/shared/src/direct-drag.mjs';
import { CAMERA_LIMITS, wrapLongitude } from './vendor/globe-vinyle/shared/src/camera.mjs';
import { elasticDelta, springRemaining } from './touch-elastic.mjs';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const minLog = Math.log(CAMERA_LIMITS.minHeight), maxLog = Math.log(CAMERA_LIMITS.maxHeight);
const logExtent = Math.log(1.18);

// Gesture transforms write the existing camera view; no second pose or React state.
export function createTouchCamera({ view, motion, pickPoint, keepPoint, updateCamera, ring, width, height, rect = () => ({ left: 0, top: 0 }) }) {
  let spring = null, lastAnchor = null;
  const dragMotion = { drag(lon, lat) {
    view.lon = wrapLongitude(view.lon + lon);
    view.lat = elasticDelta(view.lat, lat, -85, 85, 3);
  } };
  const anchored = anchor => keepPoint(anchor, 88);
  return {
    pickPoint(x, y) { const r = rect(); return ring.active ? ring.pickTouchPoint(x - r.left, y - r.top, width(), height()) : pickPoint(x, y); },
    interrupt() {
      spring = null; lastAnchor = null; motion.interrupt();
      if (ring.active) ring.interruptTouch();
    },
    release() { spring = null; motion.release(); ring.releaseTouch(); },
    pan(from, to, dragState) {
      if (ring.active) { const r = rect(); ring.panTouch({ x: from.x - r.left, y: from.y - r.top },
        { x: to.x - r.left, y: to.y - r.top }, width(), height()); return; }
      applyDirectDrag({ view, motion: dragMotion, dragState, from, to, pickPoint,
        keepPoint: anchored, updateCamera, maxSteps: 12 });
      lastAnchor = dragState.anchor ? { x: to.x, y: to.y, point: dragState.anchor } : null;
    },
    transform({ factor, rotation, pitch, from, to, anchor }) {
      if (ring.active) { const r = rect(); ring.transformTouch({ factor, rotation, pitch,
        from: { x: from.x - r.left, y: from.y - r.top }, to: { x: to.x - r.left, y: to.y - r.top }, anchor }, width(), height()); return; }
      const previousLat = view.lat;
      view.height = Math.exp(elasticDelta(Math.log(view.height), Math.log(factor), minLog, maxLog, logExtent));
      view.bearing = wrapLongitude(view.bearing - rotation);
      view.pitch = elasticDelta(view.pitch, pitch, 0, 75, 3);
      updateCamera();
      lastAnchor = anchor ? { x: to.x, y: to.y, point: anchor } : null;
      if (!lastAnchor || !anchored(lastAnchor)) {
        const dx = to.x - from.x, dy = to.y - from.y;
        const speed = Math.min(.22, view.height * .003), angle = view.bearing * Math.PI / 180;
        dragMotion.drag((-dx * Math.cos(angle) + dy * Math.sin(angle)) * speed,
          (dy * Math.cos(angle) + dx * Math.sin(angle)) * speed);
      } else if (Math.abs(view.lat) > 85) view.lat = elasticDelta(previousLat, view.lat - previousLat, -85, 85, 3);
      updateCamera();
    },
    settle(seconds) {
      if (ring.active) return ring.settleTouch(seconds);
      if (!spring) {
        const log = Math.log(view.height), targetLog = clamp(log, minLog, maxLog);
        const pitch = clamp(view.pitch, 0, 75), lat = clamp(view.lat, -85, 85);
        if (Math.abs(log - targetLog) < 1e-10 && pitch === view.pitch && lat === view.lat) return false;
        spring = { log, targetLog, pitch: view.pitch, targetPitch: pitch, lat: view.lat, targetLat: lat };
      }
      const k = springRemaining(seconds), s = spring;
      view.height = Math.exp(s.targetLog + (s.log - s.targetLog) * k);
      view.pitch = s.targetPitch + (s.pitch - s.targetPitch) * k;
      view.lat = s.targetLat + (s.lat - s.targetLat) * k;
      updateCamera();
      if (lastAnchor && s.lat === s.targetLat) { anchored(lastAnchor); updateCamera(); }
      if (k === 0) { view.lat = clamp(view.lat, -85, 85); updateCamera(); spring = null; }
      return k !== 0;
    },
  };
}
