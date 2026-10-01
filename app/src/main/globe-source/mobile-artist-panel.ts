// Shared with the Top 10 geometry in full-globe-mobile.css. Landscape profiles
// retain this screen rectangle; portrait marker popups use their own compact,
// vertically anchored geometry in portrait-artist-popup.ts.
export function mobileArtistPanel(viewport: { width: number; height: number }) {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  // A keyboard can make a portrait viewport wider than it is tall. Use the
  // device orientation selected by globe-layout, matching the CSS controls.
  const landscape = root.dataset.globeOrientation
    ? root.dataset.globeOrientation === 'landscape' : viewport.width > viewport.height;
  const read = (name: string, fallback: number) => {
    const value = style.getPropertyValue(name).trim();
    // Custom properties preserve calc()/min() expressions. Do not parse their
    // first number as a pixel length; calculate the matching layout instead.
    return /^\d+(?:\.\d+)?px$/.test(value) ? Number.parseFloat(value) : fallback;
  };
  const width = Math.max(1, Math.min(read('--mobile-artist-panel-width', landscape ? 288 : 320),
    viewport.width - (landscape ? 184 : 24)));
  const top = read('--mobile-artist-panel-top', 72);
  const bottom = read('--mobile-artist-panel-bottom', landscape ? 12 : read('--feature-dock-inset', 104) + 12);
  const right = read('--mobile-artist-panel-right', landscape ? 76 : 12);
  const height = Math.max(1, viewport.height - top - bottom);
  // Mobile controls use real CSS pixels rather than a scaled desktop card.
  return { scale: 1, width, height, left: viewport.width - right - width, top,
    logicalHeight: height };
}
