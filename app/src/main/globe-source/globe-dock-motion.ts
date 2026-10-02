import { dockLayout, nearestAngle, viewportRotation } from './globe-dock-geometry.mjs';

type NativeDockMotion = { update: (roll: number | null, displayRotation: number, turning?: boolean) => void };
declare global { interface Window { meewavGlobeDock?: NativeDockMotion } }

/** Confirmed display turns share one bounded animation with the dock and scene.
 * Raw device tilt cannot drive either one, including during the transition. */
export function installGlobeDockMotion() {
  const root = document.documentElement;
  const motionStyle = document.querySelector<HTMLElement>('.globe-device-dock')?.style ?? root.style;
  const screenOrientation = window.screen.orientation;
  const screenSizes = [window.screen.width, window.screen.height].filter(value => Number.isFinite(value) && value > 0);
  const naturalWidth = screenSizes.length === 2 ? Math.min(...screenSizes)
    : Math.min(window.innerWidth, window.innerHeight);
  // Keep the portrait search size when Android exchanges viewport axes.
  // Screen's short edge is stable even while the keyboard reduces WebView height.
  root.style.setProperty('--globe-portrait-width', `${naturalWidth}px`);
  let nativeRotation: number | undefined;
  let turning = false;
  let controlsHidden = false;
  let revealTimer: ReturnType<typeof window.setTimeout> | undefined;
  let iconAngle: number | undefined;
  let lastRotation: number | undefined;
  let lastWidth = 0, lastHeight = 0;
  let active = !document.hidden;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let sceneParameters: string | undefined, sceneEngine: any;

  const cancelReveal = () => {
    if (revealTimer != null) window.clearTimeout(revealTimer);
    revealTimer = undefined;
  };
  const hideControls = () => {
    cancelReveal();
    if (!active || controlsHidden) return;
    controlsHidden = true;
    root.dataset.globeTurning = 'true';
  };
  const revealControls = () => {
    cancelReveal();
    if (!active || turning || !controlsHidden) return;
    revealTimer = window.setTimeout(() => {
      revealTimer = undefined;
      const canvas = document.querySelector<HTMLCanvasElement>('.globe-stage canvas');
      // Wait for the new live frame; a slow redraw never exposes moving CTAs.
      if ((nativeRotation != null && nativeRotation !== lastRotation)
        || (canvas?.dataset.globeDisplayRotation != null
          && Number(canvas.dataset.globeDisplayRotation) !== lastRotation)) return;
      controlsHidden = false;
      delete root.dataset.globeTurning;
    }, reducedMotion.matches ? 0 : 120);
  };

  const setAngle = (value: number) => {
    const next = nearestAngle(value, iconAngle ?? value);
    if (iconAngle === next) return;
    iconAngle = next;
    motionStyle.setProperty('--globe-dock-icon-angle', `${next}deg`);
  };
  const requestedRotation = () => {
    // Android's display is authoritative: some WebViews keep reporting angle
    // zero. The browser value is only a first-paint fallback before native data.
    return nativeRotation ?? (Number.isFinite(screenOrientation?.angle) ? screenOrientation.angle
      : window.innerWidth > window.innerHeight ? 90 : 0);
  };
  const updateScene = () => {
    const engine = (window as any).__meewavEngine;
    if (!active || !engine?.setDeviceOrientation || lastRotation == null) return;
    const parameters = `${lastRotation}:${reducedMotion.matches}`;
    if (parameters === sceneParameters && sceneEngine === engine) return;
    sceneParameters = parameters; sceneEngine = engine;
    engine.setDeviceOrientation(null, lastRotation, reducedMotion.matches);
  };
  const layout = () => {
    const width = window.innerWidth, height = window.innerHeight;
    const rotation = viewportRotation(requestedRotation(), lastRotation, width, naturalWidth,
      null, screenOrientation?.angle);
    if (rotation === lastRotation && width === lastWidth && height === lastHeight) return;
    if (lastRotation != null && rotation !== lastRotation) hideControls();
    lastRotation = rotation; lastWidth = width; lastHeight = height;
    const frame = dockLayout(rotation, width, height);
    root.dataset.globeDockSide = frame.side;
    root.dataset.globeDisplayRotation = String(rotation);
    root.style.setProperty('--globe-display-angle', `${rotation}deg`);
    root.style.setProperty('--globe-dock-width', `${frame.width}px`);
    root.style.setProperty('--globe-dock-center-x', `${frame.centerX}px`);
    root.style.setProperty('--globe-dock-center-y', `${frame.centerY}px`);
    root.style.setProperty('--globe-dock-frame-angle', `${frame.rotation}deg`);
    window.dispatchEvent(new Event('meewav:globe-display'));
    if (active) setAngle(rotation);
    updateScene();
    revealControls();
  };
  const receiver: NativeDockMotion = {
    update(_roll, rotation, isTurning = false) {
      if (!Number.isFinite(rotation) || rotation % 90 !== 0) return;
      const normalized = ((rotation % 360) + 360) % 360;
      const changedDisplay = nativeRotation != null && nativeRotation !== normalized;
      nativeRotation = normalized;
      turning = isTurning === true && (changedDisplay || turning);
      if (turning) hideControls();
      layout();
      if (active) setAngle(lastRotation!);
      updateScene();
      revealControls();
    },
  };
  const refreshActivity = () => {
    cancelReveal();
    sceneParameters = undefined;
    if (active) { layout(); preference(); revealControls(); }
    else { controlsHidden = false; delete root.dataset.globeTurning; }
  };
  const lifecycle = (event: Event) => {
    active = (event as CustomEvent).detail?.active === true && !document.hidden;
    refreshActivity();
  };
  const visibility = () => { active = !document.hidden && !root.hasAttribute('data-profile-inactive'); refreshActivity(); };
  const preference = () => {
    if (active) setAngle(lastRotation!);
    updateScene();
  };
  window.meewavGlobeDock = receiver;
  root.dataset.globeDeviceDock = 'true';
  layout();
  window.addEventListener('resize', layout, { passive: true });
  screenOrientation?.addEventListener('change', layout);
  document.addEventListener('globelab-lifecycle', lifecycle);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('meewav:globe-surface', revealControls);
  reducedMotion.addEventListener('change', preference);
  return () => {
    cancelReveal();
    window.removeEventListener('resize', layout);
    screenOrientation?.removeEventListener('change', layout);
    document.removeEventListener('globelab-lifecycle', lifecycle);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('meewav:globe-surface', revealControls);
    reducedMotion.removeEventListener('change', preference);
    if (window.meewavGlobeDock === receiver) delete window.meewavGlobeDock;
    delete root.dataset.globeDeviceDock;
    delete root.dataset.globeDockSide;
    delete root.dataset.globeTurning;
    delete root.dataset.globeDisplayRotation;
    root.style.removeProperty('--globe-display-angle');
    root.style.removeProperty('--globe-portrait-width');
    for (const property of ['width', 'center-x', 'center-y', 'frame-angle', 'icon-angle'])
      root.style.removeProperty(`--globe-dock-${property}`);
    motionStyle.removeProperty('--globe-dock-icon-angle');
  };
}
