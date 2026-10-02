import * as T from 'three';
import { nearestAngle } from './globe-dock-geometry.mjs';

/** Roll the rendered scene without changing the geographic camera pose.
 * Physical roll eases like the dock icons; display compensation is immediate,
 * otherwise Android's 90° switch would become a second visible rotation. */
export function createGlobeSceneOrientation(camera, duration = 65) {
  duration = Math.max(0, duration);
  const turn = new T.Matrix4(), appliedProjection = new T.Matrix4();
  let enabled = false, physical = 0, from = 0, target = 0, started = 0;
  let tweenDuration = duration, displayRotation = 0, angle = 0, focalLength = 0;
  let appliedAngle = NaN, lensFov = NaN, lensAspect = NaN, lensNear = NaN, lensFar = NaN, lensZoom = NaN;
  const sample = now => {
    const progress = tweenDuration ? T.MathUtils.clamp((now - started) / tweenDuration, 0, 1) : 1;
    return progress === 1 ? target : from + (target - from) * progress;
  };
  return {
    get enabled() { return enabled; },
    get angle() { return angle; },
    get displayRotation() { return displayRotation; },
    get moving() { return enabled && physical !== target; },
    set(roll, rotation, now, viewportHeight, instant = false) {
      if (!Number.isFinite(rotation) || rotation % 90 !== 0 || (roll != null && !Number.isFinite(roll))) return false;
      const previousAngle = angle;
      const previousTarget = target;
      const previousRotation = displayRotation;
      const counterRoll = roll == null ? rotation : -roll;
      const nextDuration = instant ? 0 : duration;
      if (!enabled) {
        focalLength = Math.max(1, viewportHeight) * camera.zoom / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)));
        physical = from = target = counterRoll;
        started = now;
        enabled = true;
      } else {
        physical = sample(now);
        const nextTarget = nearestAngle(counterRoll, target);
        if (nextTarget !== target || nextDuration !== tweenDuration) {
          from = physical; target = nextTarget; started = now;
        }
      }
      tweenDuration = nextDuration;
      physical = sample(now);
      displayRotation = rotation;
      angle = physical - displayRotation;
      return !Number.isFinite(appliedAngle) || angle !== previousAngle || target !== previousTarget || displayRotation !== previousRotation;
    },
    tick(now) {
      if (!enabled) return false;
      const previous = angle;
      physical = sample(now);
      angle = physical - displayRotation;
      return previous !== angle;
    },
    fovForHeight(height) {
      return T.MathUtils.radToDeg(2 * Math.atan(Math.max(1, height) * camera.zoom / (2 * focalLength)));
    },
    apply() {
      if (!enabled) return false;
      if (appliedAngle === angle && lensFov === camera.fov && lensAspect === camera.aspect
        && lensNear === camera.near && lensFar === camera.far && lensZoom === camera.zoom
        && appliedProjection.equals(camera.projectionMatrix)) return false;
      // Rotate in pixels, not raw NDC: its axes have different scales in a
      // portrait viewport. This keeps the sphere circular in every orientation.
      const radians = T.MathUtils.degToRad(angle), c = Math.cos(radians), s = Math.sin(radians);
      const aspect = camera.aspect;
      turn.set(c, s / aspect, 0, 0, -s * aspect, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      camera.updateProjectionMatrix();
      camera.projectionMatrix.premultiply(turn);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      appliedProjection.copy(camera.projectionMatrix);
      appliedAngle = angle; lensFov = camera.fov; lensAspect = camera.aspect;
      lensNear = camera.near; lensFar = camera.far; lensZoom = camera.zoom;
      camera.userData.meewavProjectionVersion = (camera.userData.meewavProjectionVersion || 0) + 1;
      return true;
    },
  };
}
