import * as T from "three";
import { xyz, RADIUS } from "./geo.mjs";
import { wrapLongitude } from "./camera.mjs";
const clamp = T.MathUtils.clamp;
const solvers = new WeakMap();
export function solveScreenAnchor(options) {
  let solve = solvers.get(options.camera);
  if (!solve) { solve = createScreenAnchorSolver(); solvers.set(options.camera, solve); }
  return solve(options);
}
export function createScreenAnchorSolver() {
  const target = new T.Vector2(), worldPoint = new T.Vector3(), projected = new T.Vector3();
  const current = new T.Vector2(), error = new T.Vector2(), lonDerivative = new T.Vector2();
  const latDerivative = new T.Vector2(), candidate = new T.Vector2();
  const weights = [1, .5, .25];
  return function solve({ view, camera, point, x, y, width, height, updateCamera, align = null, latitudeLimit = 85 }) {
  const entry = { lon: view.lon, lat: view.lat };
  const rollback = () => {
    view.lon = entry.lon;
    view.lat = entry.lat;
    updateCamera();
    return false;
  };
  target.set(x, y);
  worldPoint.fromArray(xyz(point[0], point[1], RADIUS));
  if (align) worldPoint.applyQuaternion(align);
  const project = out => {
    projected.copy(worldPoint).project(camera);
    return out.set(((projected.x + 1) * width) / 2, ((1 - projected.y) * height) / 2);
  };
  // Solve in screen space, which stays continuous when an anchor passes over a pole.
  for (let i = 0; i < 5; i++) {
    project(current); error.copy(target).sub(current);
    if (error.length() < 0.15) return true;
    const original = { lon: view.lon, lat: view.lat },
      epsilon = Math.min(0.001, view.height * 0.01);
    view.lon = original.lon + epsilon;
    updateCamera();
    project(lonDerivative)
      .sub(current)
      .multiplyScalar(1 / epsilon);
    view.lon = original.lon;
    view.lat = original.lat + epsilon;
    updateCamera();
    project(latDerivative)
      .sub(current)
      .multiplyScalar(1 / epsilon);
    view.lat = original.lat;
    updateCamera();
    const determinant = lonDerivative.x * latDerivative.y - latDerivative.x * lonDerivative.y;
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8) return rollback();
    const dl = clamp((error.x * latDerivative.y - error.y * latDerivative.x) / determinant, -4, 4);
    const dp = clamp((lonDerivative.x * error.y - lonDerivative.y * error.x) / determinant, -3, 3);
    let improved = false;
    for (const step of weights) {
      view.lon = wrapLongitude(original.lon + dl * step);
      view.lat = clamp(original.lat + dp * step, -latitudeLimit, latitudeLimit);
      updateCamera();
      if (project(candidate).distanceTo(target) < error.length()) {
        improved = true;
        break;
      }
    }
    if (!improved) return rollback();
  }
  return project(candidate).distanceTo(target) < 1 || rollback();
  };
}
