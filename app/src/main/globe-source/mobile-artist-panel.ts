// Shared with the Top 10 geometry in full-globe-mobile.css. Portalled profiles
// use the same screen rectangle, independent of the portrait's 3D position.
export function mobileArtistPanel(viewport: { width: number; height: number }) {
  if (viewport.width <= viewport.height || viewport.height > 600) return null;
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: number) => parseFloat(style.getPropertyValue(name)) || fallback;
  const width = read('--mobile-artist-panel-width', 210);
  const top = read('--mobile-artist-panel-top', 50);
  const bottom = read('--mobile-artist-panel-bottom', 14);
  const right = read('--mobile-artist-panel-right', 12);
  const scale = width / 413;
  return { scale, left: viewport.width - right - width, top,
    logicalHeight: Math.max(1, viewport.height - top - bottom) / scale };
}
