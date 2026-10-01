import { useLayoutEffect, type RefObject } from 'react';
import { getGlobeOrientation, subscribeGlobeOrientation } from './globe-layout';
import { mobileArtistPanel } from './mobile-artist-panel';
import { portraitArtistPopup, type ArtistPopupAnchor, type VerticalPopupPlacement } from './portrait-artist-popup';

/** Moving the card never rerenders its media, resets its scroll or remounts
 * the profile. The renderer publishes fresh projected anchors separately
 * from selection events, including after an orientation change. */
export function useArtistPopupPosition(
  panel: RefObject<HTMLDivElement | null>,
  identity: string | number,
  initialAnchor: ArtistPopupAnchor,
  anchorEvent: 'meewav:ground-avatar-anchor' | 'meewav:ring-portrait-anchor' | null,
) {
  useLayoutEffect(() => {
    const node = panel.current;
    if (!node) return;
    let anchor = initialAnchor;
    let viewport = { width: window.innerWidth, height: window.innerHeight };
    let portrait = getGlobeOrientation() === 'portrait';
    let previousPlacement: VerticalPopupPlacement | undefined;
    let landscapePanel = mobileArtistPanel(viewport);
    let topInset = landscapePanel.top;
    const apply = () => {
      node.dataset.orientation = portrait ? 'portrait' : 'landscape';
      // The dock is hidden while this dialog is open. Native safe insets are
      // already outside the WebView; keep a small edge margin for the card.
      const layout = portrait
        ? portraitArtistPopup(viewport, anchor, { top: topInset, bottom: 12 }, previousPlacement)
        : { ...landscapePanel, placement: 'right', arrowX: 0 };
      if (portrait) previousPlacement = layout.placement as VerticalPopupPlacement;
      node.dataset.placement = layout.placement;
      node.style.left = `${layout.left}px`;
      node.style.top = `${layout.top}px`;
      node.style.width = `${layout.width}px`;
      node.style.height = `${layout.height}px`;
      node.style.transform = 'none';
      node.style.setProperty('--mw-bubble-w', `${layout.width}px`);
      node.style.setProperty('--mw-bubble-h', `${layout.height}px`);
      node.style.setProperty('--mw-arrow-x', `${layout.arrowX}px`);
    };
    const resize = () => {
      viewport = { width: window.innerWidth, height: window.innerHeight };
      portrait = getGlobeOrientation() === 'portrait';
      landscapePanel = mobileArtistPanel(viewport);
      topInset = landscapePanel.top;
      previousPlacement = undefined;
      apply();
    };
    const updateAnchor = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if ((detail?.id ?? detail?.instanceId) !== identity || !detail.anchor) return;
      anchor = detail.anchor;
      apply();
    };
    apply();
    window.addEventListener('resize', resize, { passive: true });
    const unsubscribeOrientation = subscribeGlobeOrientation(resize);
    if (anchorEvent) window.addEventListener(anchorEvent, updateAnchor);
    return () => {
      window.removeEventListener('resize', resize);
      unsubscribeOrientation();
      if (anchorEvent) window.removeEventListener(anchorEvent, updateAnchor);
    };
  }, [panel, identity, initialAnchor, anchorEvent]);
}
