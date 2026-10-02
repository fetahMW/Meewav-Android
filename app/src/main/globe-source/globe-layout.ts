/** Device orientation remains stable when the on-screen keyboard reduces the
 * WebView height. Only layout changes; the renderer and camera stay mounted. */
const orientationEvent = 'meewav:globe-orientation';

export function getGlobeOrientation(): 'portrait' | 'landscape' {
  return document.documentElement.dataset.globeOrientation === 'landscape' ? 'landscape' : 'portrait';
}

export function subscribeGlobeOrientation(update: () => void) {
  window.addEventListener(orientationEvent, update);
  return () => window.removeEventListener(orientationEvent, update);
}

export function installGlobeLayout() {
  const orientation = window.screen.orientation;
  const update = () => {
    const type = orientation?.type;
    const root = document.documentElement;
    const display = root.dataset.globeDeviceDock ? Number(root.dataset.globeDisplayRotation) : NaN;
    const next = Number.isFinite(display) ? (display % 180 === 0 ? 'portrait' : 'landscape')
      : type?.startsWith('portrait') ? 'portrait'
      : type?.startsWith('landscape') ? 'landscape'
      : window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    if (document.documentElement.dataset.globeOrientation === next) return;
    document.documentElement.dataset.globeOrientation = next;
    window.dispatchEvent(new Event(orientationEvent));
  };
  update();
  orientation?.addEventListener('change', update);
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('meewav:globe-display', update);
  const dispose = () => {
    orientation?.removeEventListener('change', update);
    window.removeEventListener('resize', update);
    window.removeEventListener('meewav:globe-display', update);
    window.removeEventListener('pagehide', dispose);
  };
  window.addEventListener('pagehide', dispose);
  return dispose;
}
