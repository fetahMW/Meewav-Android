/** Device orientation remains stable when the on-screen keyboard reduces the
 * WebView height. Only layout changes; the renderer and camera stay mounted. */
export function installGlobeLayout() {
  const orientation = window.screen.orientation;
  const update = () => {
    const type = orientation?.type;
    document.documentElement.dataset.globeOrientation = type?.startsWith('portrait') ? 'portrait'
      : type?.startsWith('landscape') ? 'landscape'
      : window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  };
  update();
  orientation?.addEventListener('change', update);
  window.addEventListener('resize', update, { passive: true });
  const dispose = () => {
    orientation?.removeEventListener('change', update);
    window.removeEventListener('resize', update);
    window.removeEventListener('pagehide', dispose);
  };
  window.addEventListener('pagehide', dispose);
  return dispose;
}
