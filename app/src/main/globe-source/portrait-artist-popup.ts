export type ArtistPopupAnchor = {
  x: number;
  y: number;
  clearance: number;
  viewportWidth: number;
  viewportHeight: number;
};

/** The portrait card stays below search. Its height depends on the screen,
 * never on where the artist happens to be: the camera makes room instead.
 * All coordinates are WebView CSS pixels. */
export function portraitArtistPopup(
  viewport: { width: number; height: number },
  anchor: ArtistPopupAnchor,
  insets: { top: number; bottom: number },
  preferredHeight = 420,
) {
  const margin = Math.min(12, viewport.width / 4);
  const width = Math.min(320, Math.max(1, viewport.width - margin * 2));
  const left = (viewport.width - width) / 2;
  const top = Math.max(0, insets.top);
  // Keep a separate lane for the avatar. On ordinary phone screens the
  // complete card keeps the same size even when an avatar is near an edge.
  const height = Math.max(1, Math.min(preferredHeight, viewport.height - top - insets.bottom - 144));
  const clearance = Math.max(0, anchor.clearance) * viewport.width / Math.max(1, anchor.viewportWidth);
  return {
    width, height, left, top, placement: 'above' as const, arrowX: width / 2,
    avatarTarget: { x: left + width / 2, y: top + height + 14 + clearance },
  };
}
