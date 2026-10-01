import * as T from 'three';
import { xyz, lonlat } from './vendor/globe-vinyle/shared/src/geo.mjs';
import { AXIS_GLOBE_MIN_HEIGHT, globeDragSpeed } from './vendor/globe-vinyle/shared/src/globe-drag.mjs';

const radians = Math.PI / 180;

// Rotate the whole camera frame in screen space, independently of the disc's
// axle. Geographic anchoring remains the close-map gesture; it is singular at
// the overview's silhouette and poles. No extra animation loop or render pass.
export function createGlobeTouchRotation({ camera, motion, updateCamera, height, align = null }) {
  const radial = new T.Vector3(), heading = new T.Vector3();
  const east = new T.Vector3(), north = new T.Vector3();
  const right = new T.Vector3(), up = new T.Vector3(), axis = new T.Vector3();
  const rotation = new T.Quaternion(), unalign = align?.clone().invert();
  function basis(lon, lat) {
    east.set(Math.cos(lon), 0, -Math.sin(lon));
    north.set(-Math.sin(lat) * Math.sin(lon), Math.cos(lat), -Math.sin(lat) * Math.cos(lon));
  }
  return {
    get active() { return motion.view.height >= AXIS_GLOBE_MIN_HEIGHT; },
    pan(from, to) {
      if (!this.active) return false;
      const dx = to.x - from.x, dy = to.y - from.y;
      if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return true;
      const view = motion.view;
      radial.fromArray(xyz(view.lon, view.lat, 1));
      basis(view.lon * radians, view.lat * radians);
      const bearing = view.bearing * radians;
      heading.copy(north).multiplyScalar(Math.cos(bearing)).addScaledVector(east, Math.sin(bearing));
      if (align) { radial.applyQuaternion(align); heading.applyQuaternion(align); }

      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      axis.copy(up).multiplyScalar(dx).addScaledVector(right, dy).normalize();
      rotation.setFromAxisAngle(axis, -Math.hypot(dx, dy) * globeDragSpeed(camera, height()) * radians);
      radial.applyQuaternion(rotation); heading.applyQuaternion(rotation);
      if (unalign) { radial.applyQuaternion(unalign); heading.applyQuaternion(unalign); }
      const [lon, lat] = lonlat(radial.x, radial.y, radial.z);
      basis(lon * radians, lat * radians);
      motion.rotateTo({ lon, lat, bearing: Math.atan2(heading.dot(east), heading.dot(north)) / radians }, true);
      updateCamera();
      return true;
    },
  };
}
