import { useLayoutEffect, type RefObject } from 'react';
import { getGlobeOrientation, subscribeGlobeOrientation } from './globe-layout';
import { mobileArtistPanel } from './mobile-artist-panel';
import { portraitArtistPopup, type ArtistPopupAnchor } from './portrait-artist-popup';
import { groundArtistPopup } from './ground-artist-popup';

/** Camera framing follows projected anchors; the portrait card never follows
 * them or reduces its height to fit beside an avatar. */
export function useArtistPopupPosition(
  panel: RefObject<HTMLDivElement | null>,
  identity: string | number,
  initialAnchor: ArtistPopupAnchor,
  anchorEvent: 'meewav:ground-avatar-anchor' | 'meewav:ring-portrait-anchor' | null,
) {
  useLayoutEffect(() => {
    const node = panel.current;
    if (!node) return;
    const source = anchorEvent === 'meewav:ground-avatar-anchor' ? 'ground'
      : anchorEvent === 'meewav:ring-portrait-anchor' ? 'ring' : null;
    let anchor = initialAnchor;
    let viewport = { width: window.innerWidth, height: window.innerHeight };
    let portrait = getGlobeOrientation() === 'portrait';
    let landscapePanel = mobileArtistPanel(viewport);
    let preferredHeight = 420;
    let positioned = '';
    let framing = false;
    const search = document.querySelector<HTMLElement>('.reference-search-dock');
    let topInset = search ? search.getBoundingClientRect().bottom + 10 : 72;

    const dismissFraming = (immediate = false) => {
      if (!framing || !source) return;
      framing = false;
      window.dispatchEvent(new CustomEvent('meewav:artist-popup-dismiss', {
        detail: { identity, source, immediate },
      }));
    };
    const apply = () => {
      const layout = source === 'ground'
        ? groundArtistPopup(viewport, anchor, { top: topInset, bottom: 12,
          left: portrait ? 0 : 104, right: portrait ? 0 : 60 }, !portrait)
        : portrait
        ? portraitArtistPopup(viewport, anchor, { top: topInset, bottom: 12 }, preferredHeight)
        : { ...landscapePanel, placement: 'right', arrowX: 0 };
      const signature = [portrait, layout.left, layout.top, layout.width, layout.height].join(':');
      if (signature !== positioned) {
        positioned = signature;
        node.dataset.orientation = portrait ? 'portrait' : 'landscape';
        node.dataset.placement = layout.placement;
        node.style.left = layout.left + 'px';
        node.style.top = layout.top + 'px';
        node.style.width = layout.width + 'px';
        node.style.height = layout.height + 'px';
        node.style.transform = 'none';
        node.style.setProperty('--mw-bubble-w', layout.width + 'px');
        node.style.setProperty('--mw-bubble-h', layout.height + 'px');
        node.style.setProperty('--mw-arrow-x', layout.arrowX + 'px');
      }
      if ((portrait || source === 'ground') && source && 'avatarTarget' in layout) {
        framing = true;
        window.dispatchEvent(new CustomEvent('meewav:artist-popup-frame', {
          detail: { identity, source, anchor, target: layout.avatarTarget,
            viewportWidth: viewport.width, viewportHeight: viewport.height },
        }));
      } else dismissFraming(true);
    };
    // A long biography or the restore action may need a little more room.
    // Grow the card once; never shrink it as the camera moves or tabs change.
    const fitContent = () => {
      if (!portrait || source === 'ground') return;
      const bodies = node.querySelectorAll<HTMLElement>('.mw-preprofile__scroll-body');
      let overflow = 0;
      for (const body of bodies) overflow = Math.max(overflow, body.scrollHeight - body.clientHeight);
      if (overflow > 1) {
        const maximum = viewport.height - topInset - 12 - 144;
        const next = Math.min(maximum, preferredHeight + overflow + 1);
        if (next > preferredHeight) { preferredHeight = next; apply(); }
      }
    };
    const resize = () => {
      viewport = { width: window.innerWidth, height: window.innerHeight };
      portrait = getGlobeOrientation() === 'portrait';
      landscapePanel = mobileArtistPanel(viewport);
      topInset = search ? search.getBoundingClientRect().bottom + 10 : 72;
      apply();
      fitContent();
    };
    const updateAnchor = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if ((detail?.id ?? detail?.instanceId) !== identity || !detail.anchor) return;
      anchor = detail.anchor;
      apply();
    };
    apply();
    fitContent();
    const contentResize = new ResizeObserver(fitContent);
    const observeContent = () => {
      contentResize.disconnect();
      node.querySelectorAll<HTMLElement>('.mw-preprofile__scroll-body, .mw-preprofile__scroll-body > *, .mw-preprofile__footer')
        .forEach(element => contentResize.observe(element));
      fitContent();
    };
    observeContent();
    const contentMutation = new MutationObserver(observeContent);
    contentMutation.observe(node, { subtree: true, childList: true });
    const searchResize = new ResizeObserver(resize);
    if (search) searchResize.observe(search);
    // A 180-degree turn moves the physical dock above search without a resize.
    const dockSideMutation = new MutationObserver(resize);
    dockSideMutation.observe(document.documentElement, { attributes: true,
      attributeFilter: ['data-globe-dock-side'] });
    window.addEventListener('resize', resize, { passive: true });
    const unsubscribeOrientation = subscribeGlobeOrientation(resize);
    if (anchorEvent) window.addEventListener(anchorEvent, updateAnchor);
    return () => {
      window.removeEventListener('resize', resize);
      unsubscribeOrientation();
      if (anchorEvent) window.removeEventListener(anchorEvent, updateAnchor);
      contentResize.disconnect();
      contentMutation.disconnect();
      searchResize.disconnect();
      dockSideMutation.disconnect();
      dismissFraming();
    };
  }, [panel, identity, initialAnchor, anchorEvent]);
}
