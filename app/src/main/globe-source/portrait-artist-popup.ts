export type ArtistPopupAnchor = {
  x: number;
  y: number;
  clearance: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type VerticalPopupPlacement = 'above' | 'below';

/** Portrait cards have their own compact geometry, independent of the full
 * height panel used in landscape. All coordinates are WebView CSS pixels. */
export function portraitArtistPopup(
  viewport: { width: number; height: number },
  anchor: ArtistPopupAnchor,
  insets: { top: number; bottom: number },
  previousPlacement?: VerticalPopupPlacement,
) {
  const margin = Math.min(12, viewport.width / 4);
  const width = Math.min(280, Math.max(1, viewport.width - margin * 2));
  const x = anchor.x * viewport.width / Math.max(1, anchor.viewportWidth);
  const y = anchor.y * viewport.height / Math.max(1, anchor.viewportHeight);
  const clearance = Math.max(0, anchor.clearance) * viewport.width / Math.max(1, anchor.viewportWidth);
  const gap = 14;
  const topLimit = Math.min(insets.top, Math.max(0, viewport.height - 1));
  const bottomLimit = Math.max(topLimit + 1, viewport.height - insets.bottom);
  const above = Math.max(0, Math.min(bottomLimit, y - clearance - gap) - topLimit);
  const below = Math.max(0, bottomLimit - Math.max(topLimit, y + clearance + gap));
  const preferredHeight = Math.min(304, bottomLimit - topLimit);

  // Keep the current side while it still fits, or while both sides have
  // nearly the same space. A moving avatar must not make the card flicker.
  let placement: VerticalPopupPlacement = above >= preferredHeight ? 'above'
    : below >= preferredHeight ? 'below' : above >= below ? 'above' : 'below';
  if (previousPlacement) {
    const available = previousPlacement === 'above' ? above : below;
    const alternative = previousPlacement === 'above' ? below : above;
    if (available >= preferredHeight || (available > 0 && available >= alternative - 20)) {
      placement = previousPlacement;
    }
  }
  const height = Math.max(1, Math.min(preferredHeight, placement === 'above' ? above : below));
  const left = Math.max(margin, Math.min(viewport.width - margin - width, x - width / 2));
  const top = Math.max(topLimit, Math.min(bottomLimit - height,
    placement === 'above' ? y - clearance - gap - height : y + clearance + gap));
  const arrowMargin = Math.min(24, width / 2);
  const arrowX = Math.max(arrowMargin, Math.min(width - arrowMargin, x - left));
  return { width, height, left, top, placement, arrowX };
}
