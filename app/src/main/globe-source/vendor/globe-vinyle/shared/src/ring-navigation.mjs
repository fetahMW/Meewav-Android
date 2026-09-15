import * as T from 'three';
import { createRingFlight } from './ring-flight.mjs';
import { RING_PORTRAIT_LANES } from './saturn-ring.mjs';
import { elasticDelta, springRemaining } from '../../../../touch-elastic.mjs';

// A separate navigation mode on the existing ring surface and renderer.
export function createRingNavigation(camera, ring, reducedMotion) {
  const ringState = ring.state();
  const normal = new T.Vector3().fromArray(ringState.normal).normalize();
  const target = new T.PerspectiveCamera();
  const flight = createRingFlight(camera, ring);
  let returning = false, onReturned = null;
  let active = false, angle = Math.PI / 2, across = RING_PORTRAIT_LANES.centers[0], heading = 0, elevation = 2.8;
  let transition = 0, dirty = false, pointer = null;
  let pitch = Math.atan2(20, 2.2), roll = 0, spring = null;
  const radial = new T.Vector3(), gaze = new T.Vector3(), tangent = new T.Vector3();
  const raycaster = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane();
  const radialWidth = ringState.outerRadius - ringState.innerRadius;
  const tau = Math.PI * 2, wrap = a => T.MathUtils.euclideanModulo(a + Math.PI, tau) - Math.PI;
  let limits = { low: .06, high: .94, minElevation: .8, maxElevation: 20, minPitch: 0, maxPitch: 85 * Math.PI / 180 };
  function surfacePosition() {
    const bounded = T.MathUtils.clamp(across, 0, 1), surface = ring.surfaceAt(angle, bounded);
    radial.copy(surface.position).addScaledVector(normal, -surface.position.dot(normal)).normalize();
    surface.position.addScaledVector(radial, (across - bounded) * radialWidth);
    return surface;
  }
  function pose() {
    const surface = surfacePosition();
    const forward = surface.forward.clone().addScaledVector(normal, -surface.forward.dot(normal)).normalize();
    forward.applyAxisAngle(normal, heading);
    target.position.copy(surface.position).addScaledVector(normal, elevation);
    gaze.copy(forward).multiplyScalar(Math.sin(pitch)).addScaledVector(normal, -Math.cos(pitch));
    target.up.copy(forward).multiplyScalar(Math.cos(pitch)).addScaledVector(normal, Math.sin(pitch));
    target.up.applyAxisAngle(gaze, roll);
    target.lookAt(target.position.clone().add(gaze));
  }
  function updateTouch() {
    pose(); camera.position.copy(target.position); camera.quaternion.copy(target.quaternion);
    camera.up.copy(target.up); camera.updateMatrixWorld(); dirty = true;
  }
  function pickTouchPoint(x, y, width, height) {
    ndc.set(x / width * 2 - 1, 1 - y / height * 2); raycaster.setFromCamera(ndc, camera);
    plane.setFromNormalAndCoplanarPoint(normal, surfacePosition().position);
    if (Math.abs(raycaster.ray.direction.dot(normal)) < .025) return null;
    const point = raycaster.ray.intersectPlane(plane, new T.Vector3());
    return point && point.distanceTo(camera.position) < 1500 ? point : null;
  }
  function anchorTouch(anchor, to, width, height) {
    const hit = anchor && pickTouchPoint(to.x, to.y, width, height);
    if (!hit) return;
    const position = surfacePosition().position.add(anchor.clone().sub(hit));
    const nextAngle = flight.angleAt(position), oldAngle = angle;
    position.addScaledVector(normal, -position.dot(normal));
    const nextAcross = (position.length() - ringState.innerRadius) / radialWidth;
    across = elasticDelta(across, nextAcross - across, limits.low, limits.high, .025);
    angle = nextAngle; heading += wrap(nextAngle - oldAngle);
    updateTouch();
  }
  return {
    pickTouchPoint,
    interruptTouch() {
      spring = null; pointer = null;
      if (!active || (!returning && transition >= 1)) return;
      // Adopt the displayed flight pose, including roll, without sampling its end.
      angle = flight.angleAt(camera.position);
      radial.copy(camera.position).addScaledVector(normal, -camera.position.dot(normal));
      across = (radial.length() - ringState.innerRadius) / radialWidth;
      const surface = surfacePosition();
      elevation = camera.position.clone().sub(surface.position).dot(normal);
      camera.getWorldDirection(gaze);
      pitch = Math.acos(T.MathUtils.clamp(-gaze.dot(normal), -1, 1));
      tangent.copy(surface.forward).addScaledVector(normal, -surface.forward.dot(normal)).normalize();
      const horizontal = gaze.clone().addScaledVector(normal, -gaze.dot(normal)).normalize();
      heading = Math.atan2(normal.dot(tangent.clone().cross(horizontal)), tangent.dot(horizontal));
      const naturalUp = horizontal.clone().multiplyScalar(Math.cos(pitch)).addScaledVector(normal, Math.sin(pitch));
      const actualUp = new T.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      roll = Math.atan2(gaze.dot(naturalUp.clone().cross(actualUp)), naturalUp.dot(actualUp));
      // A flight can be outside the walking bands: retain its legal starting pose.
      limits = { low: Math.min(.06, across), high: Math.max(.94, across),
        minElevation: Math.min(.8, elevation), maxElevation: Math.max(20, elevation),
        minPitch: Math.min(0, pitch), maxPitch: Math.max(85 * Math.PI / 180, pitch) };
      returning = false; onReturned = null; transition = 1; dirty = true;
    },
    releaseTouch() { spring = null; },
    panTouch(from, to, width, height) {
      const anchor = pickTouchPoint(from.x, from.y, width, height);
      if (anchor) anchorTouch(anchor, to, width, height);
      else { angle += (to.x - from.x) * .001; heading += (to.x - from.x) * .001; updateTouch(); }
    },
    transformTouch({ factor, rotation, pitch: deltaPitch, from, to, anchor }, width, height) {
      // Elevation follows the same continuous ratio as the geographic camera.
      elevation = elasticDelta(elevation, elevation * (factor - 1), limits.minElevation, limits.maxElevation, .25);
      heading += rotation * Math.PI / 180;
      pitch = elasticDelta(pitch, deltaPitch * Math.PI / 180, limits.minPitch, limits.maxPitch, .025);
      updateTouch(); anchorTouch(anchor, to, width, height);
    },
    settleTouch(seconds) {
      if (!active) return false;
      if (!spring) {
        spring = { across, elevation, pitch,
          a: T.MathUtils.clamp(across, limits.low, limits.high),
          e: T.MathUtils.clamp(elevation, limits.minElevation, limits.maxElevation),
          p: T.MathUtils.clamp(pitch, limits.minPitch, limits.maxPitch) };
        if (spring.a === across && spring.e === elevation && spring.p === pitch) { spring = null; return false; }
      }
      const k = springRemaining(seconds), s = spring;
      across = s.a + (s.across - s.a) * k; elevation = s.e + (s.elevation - s.e) * k;
      pitch = s.p + (s.pitch - s.p) * k; updateTouch();
      if (k === 0) spring = null;
      return k !== 0;
    },
    get active() { return active; },
    get returning() { return returning; },
    get returnProgress() { return flight.progress(transition); },
    get entryProgress() { return transition; },
    restore(snapshot) {
      angle = T.MathUtils.euclideanModulo(snapshot.angle, Math.PI * 2);
      across = T.MathUtils.clamp(snapshot.across, 0.06, 0.94);
      heading = snapshot.heading; elevation = snapshot.elevation;
      pitch = snapshot.pitch ?? Math.atan2(20, elevation - .6); roll = snapshot.roll || 0;
      active = true; returning = false; transition = 1; dirty = true;
      pointer = null; onReturned = null;
    },
    enter() {
      pitch = Math.atan2(20, 2.2); roll = 0; elevation = 2.8; spring = null;
      limits = { low: .06, high: .94, minElevation: .8, maxElevation: 20, minPitch: 0, maxPitch: 85 * Math.PI / 180 };
      // Start on the innermost populated band, including after the visitor
      // previously moved across the disc. Other bands remain freely accessible.
      across = RING_PORTRAIT_LANES.centers[0];
      // Land on the visible side and face the oncoming portraits. The record's
      // negative local-Y rotation moves them along surface.forward, so looking
      // against that tangent keeps playback approaching from ahead on every side.
      angle = T.MathUtils.euclideanModulo(flight.angleAt(camera.position), Math.PI * 2);
      heading = Math.PI;
      pose();
      flight.begin(target, 'enter');
      active = true; returning = false; onReturned = null;
      transition = reducedMotion ? 1 : 0; dirty = true; pointer = null;
    },
    returnTo(destinationCamera, complete) {
      if (!active || returning) return;
      flight.begin(destinationCamera, 'return');
      returning = true; onReturned = complete; pointer = null;
      transition = reducedMotion ? 1 : 0; dirty = true;
    },
    exit() { active = returning = false; pointer = null; onReturned = null; },
    cancel() { pointer = null; },
    down(event) {
      if (pointer || returning) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moving: false, rotate: event.button === 2 || event.ctrlKey };
    },
    move(event, width, height) {
      if (returning || !pointer || pointer.id !== event.pointerId) return;
      // A press during entry remains usable after landing. Do not accumulate
      // movement from the transition and jump when the camera arrives.
      if (transition < 1) {
        pointer.x = pointer.startX = event.clientX; pointer.y = pointer.startY = event.clientY;
        return;
      }
      if (!pointer.moving && Math.hypot(event.clientX-pointer.startX, event.clientY-pointer.startY) < 6) return;
      pointer.moving = true;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      pointer.x = event.clientX; pointer.y = event.clientY;
      if (pointer.rotate) heading = T.MathUtils.euclideanModulo(heading - dx / Math.max(300, width) * Math.PI * 2, Math.PI * 2);
      else {
        // A horizontal pull always travels around the ring, even at a band edge.
        // Vertical dragging chooses a lane independently of the viewing heading.
        const scale = 125 / Math.max(300, Math.min(width, height));
        const radius = T.MathUtils.lerp(ringState.innerRadius, ringState.outerRadius, across);
        angle = T.MathUtils.euclideanModulo(angle + dx*scale/radius, Math.PI*2);
        across = T.MathUtils.clamp(across - dy*0.8/Math.max(300, height), 0.06, 0.94);
      }
      dirty = true;
    },
    up(event) { if (pointer?.id === event.pointerId) pointer = null; },
    wheel(delta) {
      if (transition < 1 || returning) return;
      angle = T.MathUtils.euclideanModulo(angle + T.MathUtils.clamp(delta, -160, 160) * 0.0007, Math.PI * 2);
      dirty = true;
    },
    key(key) {
      if (transition < 1 || returning) return false;
      if (key === 'ArrowUp' || key === 'ArrowDown') angle += key === 'ArrowUp' ? 0.025 : -0.025;
      else if (key === 'ArrowLeft' || key === 'ArrowRight') heading += key === 'ArrowLeft' ? 0.12 : -0.12;
      else return false;
      angle = T.MathUtils.euclideanModulo(angle, Math.PI * 2); dirty = true; return true;
    },
    tick(dt, force = false) {
      if (!active || (!dirty && transition >= 1 && !force)) return false;
      transition = Math.min(1, transition + Math.min(Math.max(dt, 0), 0.05) / flight.duration);
      if (returning || transition < 1) {
        flight.sample(transition);
      } else {
        pose();
        camera.position.copy(target.position);
        camera.quaternion.copy(target.quaternion);
        camera.up.copy(target.up);
      }
      camera.near = 0.03; camera.far = 900;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      dirty = false;
      if (returning && transition >= 1) {
        const complete = onReturned;
        active = returning = false; onReturned = null;
        complete?.();
      }
      return true;
    },
    state: () => ({ active, returning, angle, across, heading, elevation, pitch, roll,
      flight: active && (returning || transition < 1) ? flight.state() : null }),
  };
}
