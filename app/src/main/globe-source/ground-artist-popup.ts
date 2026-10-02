import type { ArtistPopupAnchor } from './portrait-artist-popup';

/** The neighbourhood card has a fixed home below search in both orientations.
 * Camera navigation centres the artist in the clear lane underneath. */
export function groundArtistPopup(
  viewport: { width: number; height: number },
  anchor: ArtistPopupAnchor,
  insets: { top: number; bottom: number; left?: number; right?: number },
  landscape: boolean,
  contentHeight?: number,
) {
  const leftInset = insets.left || 0, rightInset = insets.right || 0;
  const availableWidth = Math.max(1, viewport.width - leftInset - rightInset);
  const width = Math.min(landscape ? 600 : 320, Math.max(1, availableWidth - 24));
  const left = leftInset + (availableWidth - width) / 2;
  const top = Math.max(0, insets.top);
  const preferredHeight = !landscape && contentHeight !== undefined
    && Number.isFinite(contentHeight) && contentHeight > 0 ? contentHeight : landscape ? 260 : 480;
  const height = Math.max(1, Math.min(preferredHeight,
    viewport.height - top - insets.bottom - (landscape ? 64 : 100)));
  const clearance = Math.max(0, anchor.clearance) * viewport.width / Math.max(1, anchor.viewportWidth);
  const centreX = left + width / 2;
  const laneTop = top + height + 12;
  const laneBottom = Math.max(laneTop, viewport.height - insets.bottom - 12);
  // A close artist may be taller than this lane. Keep its centre visible rather
  // than pushing it beyond the screen or changing the card's content height.
  const visibleClearance = Math.min(clearance, (laneBottom - laneTop) / 2);
  const minimumY = laneTop + visibleClearance;
  const maximumY = laneBottom - visibleClearance;
  return {
    left, top, width, height, placement: 'above' as const, arrowX: width / 2,
    avatarTarget: {
      x: centreX,
      y: (minimumY + maximumY) / 2,
    },
  };
}
