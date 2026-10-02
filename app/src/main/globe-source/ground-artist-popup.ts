import type { ArtistPopupAnchor } from './portrait-artist-popup';

/** The neighbourhood card has a fixed home below search in both orientations.
 * Reframe only an artist outside the clear, forward-facing lane. */
export function groundArtistPopup(
  viewport: { width: number; height: number },
  anchor: ArtistPopupAnchor,
  insets: { top: number; bottom: number; left?: number; right?: number },
  landscape: boolean,
) {
  const leftInset = insets.left || 0, rightInset = insets.right || 0;
  const availableWidth = Math.max(1, viewport.width - leftInset - rightInset);
  const width = Math.min(landscape ? 600 : 320, Math.max(1, availableWidth - 24));
  const left = leftInset + (availableWidth - width) / 2;
  const top = Math.max(0, insets.top);
  const height = Math.max(1, Math.min(landscape ? 260 : 480,
    viewport.height - top - insets.bottom - (landscape ? 64 : 100)));
  const clearance = Math.max(0, anchor.clearance) * viewport.width / Math.max(1, anchor.viewportWidth);
  const centreX = left + width / 2;
  const frontHalfWidth = Math.min(landscape ? 120 : 64, availableWidth / 4);
  const laneTop = top + height + 12;
  const laneBottom = Math.max(laneTop, viewport.height - insets.bottom - 12);
  // A close artist may be taller than this lane. Keep its centre visible rather
  // than pushing it beyond the screen or changing the card's fixed height.
  const visibleClearance = Math.min(clearance, (laneBottom - laneTop) / 2);
  const minimumY = laneTop + visibleClearance;
  const maximumY = laneBottom - visibleClearance;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  return {
    left, top, width, height, placement: 'above' as const, arrowX: width / 2,
    avatarTarget: {
      x: clamp(anchor.x * viewport.width / Math.max(1, anchor.viewportWidth),
        centreX - frontHalfWidth, centreX + frontHalfWidth),
      y: clamp(anchor.y * viewport.height / Math.max(1, anchor.viewportHeight), minimumY, maximumY),
    },
  };
}
