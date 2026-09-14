import * as THREE from 'three';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { NAVBAR_GLOBE_PALETTE } from './vendor/globe-vinyle/shared/src/globe-palette.mjs';
import { vinylRecordLayout, createVinylRecordGeometry } from './vendor/globe-vinyle/shared/src/vinyl-record-geometry.mjs';
import { createVinylRecordMaterial } from './vendor/globe-vinyle/shared/src/vinyl-record-material.mjs';
import earthMaskUrl from 'meewav:earth-mask';

// Scene ported from the current Web HolographicOrbCTA.tsx. Its camera,
// geometry, pigments, optical shader and two rotation rates are preserved.
const canvas = document.querySelector('canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let disposed = false;
let nativeActive = false;
let interactive = false;
let frame = 0;
let previousFrameAt = performance.now();
let texture = null;
let recordRotation = 0;
let fittedDistance = 9;
let renderStatus = 'loading';

const renderer = new THREE.WebGLRenderer({
  canvas, alpha: true, antialias: true, premultipliedAlpha: false,
  powerPreference: 'high-performance',
});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 9);

const globeGeometry = new THREE.SphereGeometry(1.5, 96, 96);
const globeMaterial = new THREE.MeshBasicMaterial({
  color: NAVBAR_GLOBE_PALETTE.ocean, toneMapped: false,
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
globe.rotation.set(0.35, -Math.PI / 2, 0);
scene.add(globe);

const recordLayout = vinylRecordLayout('low');
const recordGeometry = createVinylRecordGeometry(recordLayout);
const recordMaterial = createVinylRecordMaterial(recordLayout);
const record = new THREE.Mesh(recordGeometry, recordMaterial);
record.scale.setScalar(1.5 / 100);
const recordAxis = new THREE.Group();
recordAxis.rotation.set(0.36, 0, 0.28);
recordAxis.add(record);
scene.add(recordAxis);

const rimGeometry = new THREE.SphereGeometry(1.5, 64, 64);
const rimMaterial = new THREE.MeshBasicMaterial({
  color: '#8B5CF6', transparent: true, opacity: 0.16,
  side: THREE.BackSide, depthWrite: false,
});
const rim = new THREE.Mesh(rimGeometry, rimMaterial);
rim.scale.setScalar(1.025);
scene.add(rim);

const controls = new OrbitControls(camera, canvas);
controls.enabled = false;
controls.enablePan = false;
controls.enableDamping = false;
controls.minDistance = 3.2;
controls.maxDistance = 24;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.8;

function createGlobeMap(image) {
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = image.naturalWidth;
  mapCanvas.height = image.naturalHeight;
  const context = mapCanvas.getContext('2d');
  if (!context) return null;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
  const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const ocean = rgb(NAVBAR_GLOBE_PALETTE.ocean);
  const land = rgb(NAVBAR_GLOBE_PALETTE.land);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const color = pixels.data[i] >= 128 ? ocean : land;
    pixels.data[i] = color[0];
    pixels.data[i + 1] = color[1];
    pixels.data[i + 2] = color[2];
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const map = new THREE.CanvasTexture(mapCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  return map;
}

function draw() {
  if (disposed || renderer.getContext().isContextLost()) return;
  rim.rotation.copy(globe.rotation);
  renderer.render(scene, camera);
  if (texture) renderStatus = 'ready';
}

function resize() {
  if (disposed) return;
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  // The square CTA keeps the Web's camera exactly. The full-screen viewer
  // fits the complete record at entry, including narrow portrait windows.
  const nextDistance = interactive ? 7.2 / Math.min(1, camera.aspect) : 9;
  camera.position.multiplyScalar(nextDistance / fittedDistance);
  fittedDistance = nextDistance;
  controls.maxDistance = Math.max(24, fittedDistance * 2.5);
  camera.updateProjectionMatrix();
  controls.update();
  draw();
}

function renderFrame(now) {
  frame = 0;
  if (disposed || !nativeActive || document.hidden || reducedMotion.matches) return;
  const delta = Math.min((now - previousFrameAt) / 1000, 0.1);
  previousFrameAt = now;
  globe.rotation.y -= delta * (Math.PI * 2 / 36);
  recordRotation -= delta * (Math.PI * 2 / 72);
  record.rotation.y = recordRotation;
  recordMaterial.uniforms.uReflectionSurfaceRotation.value = recordRotation;
  draw();
  frame = requestAnimationFrame(renderFrame);
}

function updateActivity() {
  cancelAnimationFrame(frame);
  frame = 0;
  controls.enabled = nativeActive && interactive && !document.hidden;
  if (disposed || !nativeActive || document.hidden) return;
  previousFrameAt = performance.now();
  draw();
  if (!reducedMotion.matches) frame = requestAnimationFrame(renderFrame);
}

function dispose() {
  if (disposed) return;
  disposed = true;
  cancelAnimationFrame(frame);
  resizeObserver.disconnect();
  document.removeEventListener('visibilitychange', updateActivity);
  reducedMotion.removeEventListener('change', updateActivity);
  window.removeEventListener('pagehide', dispose);
  canvas.removeEventListener('webglcontextlost', contextLost);
  canvas.removeEventListener('webglcontextrestored', contextRestored);
  controls.removeEventListener('change', draw);
  controls.dispose();
  texture?.dispose();
  recordGeometry.dispose();
  recordMaterial.dispose();
  globeGeometry.dispose();
  globeMaterial.dispose();
  rimGeometry.dispose();
  rimMaterial.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
}

function contextLost(event) {
  event.preventDefault();
  cancelAnimationFrame(frame);
  frame = 0;
}
function contextRestored() { updateActivity(); }

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
controls.addEventListener('change', draw);
document.addEventListener('visibilitychange', updateActivity);
reducedMotion.addEventListener('change', updateActivity);
window.addEventListener('pagehide', dispose);
canvas.addEventListener('webglcontextlost', contextLost);
canvas.addEventListener('webglcontextrestored', contextRestored);
resize();

new THREE.ImageLoader().load(earthMaskUrl, (image) => {
  if (disposed) return;
  texture = createGlobeMap(image);
  if (!texture) { renderStatus = 'error'; return; }
  globeMaterial.color.set(0xffffff);
  globeMaterial.map = texture;
  globeMaterial.needsUpdate = true;
  draw();
}, undefined, () => {
  renderStatus = 'error';
});

// Native-to-page lifecycle/controls only: no JavaScript interface, credentials,
// network endpoint or callback into Android is exposed to this local document.
window.meewavAuthGlobe = Object.freeze({
  get status() { return renderStatus; },
  setActive(value) { nativeActive = value === true; updateActivity(); },
  setInteractive(value) {
    const next = value === true;
    if (interactive === next) return;
    interactive = next;
    camera.position.set(0, 0, fittedDistance);
    controls.target.set(0, 0, 0);
    resize();
    updateActivity();
  },
  zoomIn() {
    if (!interactive) return;
    camera.position.multiplyScalar(Math.max(controls.minDistance / camera.position.length(), 0.8));
    controls.update();
    draw();
  },
  zoomOut() {
    if (!interactive) return;
    camera.position.multiplyScalar(Math.min(controls.maxDistance / camera.position.length(), 1.25));
    controls.update();
    draw();
  },
  rotateLeft() {
    if (!interactive) return;
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8);
    controls.update();
    draw();
  },
  rotateRight() {
    if (!interactive) return;
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 8);
    controls.update();
    draw();
  },
  resetView() {
    camera.position.set(0, 0, fittedDistance);
    controls.target.set(0, 0, 0);
    controls.update();
    draw();
  },
  dispose,
});
