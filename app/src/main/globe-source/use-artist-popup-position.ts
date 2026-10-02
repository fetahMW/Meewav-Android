import { useLayoutEffect, type RefObject } from 'react';
import { getGlobeOrientation, subscribeGlobeOrientation } from './globe-layout';
import { mobileArtistPanel } from './mobile-artist-panel';
import { portraitArtistPopup, type ArtistPopupAnchor } from './portrait-artist-popup';
import { groundArtistPopup } from './ground-artist-popup';

/** Camera framing follows projected anchors. The card stays below search;
 * neighbourhood portrait height follows its content, never the moving avatar. */
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
    let groundContentHeight: number | undefined;
    let positioned = '';
    let framedGroundSignature = '';
    let framing = false;
    let contentFitFrame = 0;
    const search = document.querySelector<HTMLElement>('.reference-search-dock');
    let topInset = search ? search.getBoundingClientRect().bottom + 10 : 72;

    const dismissFraming = (immediate = false) => {
      if (!framing || !source) return;
      framing = false;
      window.dispatchEvent(new CustomEvent('meewav:artist-popup-dismiss', {
        detail: { identity, source, immediate },
      }));
    };
    const apply = (sendFrame = true) => {
      const layout = source === 'ground'
        ? groundArtistPopup(viewport, initialAnchor, { top: topInset, bottom: 12,
          left: portrait ? 0 : 104, right: portrait ? 0 : 60 }, !portrait, groundContentHeight)
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
      if (!sendFrame) return;
      if ((portrait || source === 'ground') && source && 'avatarTarget' in layout) {
        const frameSignature = [signature, viewport.width, viewport.height,
          layout.avatarTarget.x, layout.avatarTarget.y].join(':');
        if (source === 'ground' && frameSignature === framedGroundSignature) return;
        framedGroundSignature = frameSignature;
        framing = true;
        window.dispatchEvent(new CustomEvent('meewav:artist-popup-frame', {
          detail: { identity, source, anchor, target: layout.avatarTarget,
            viewportWidth: viewport.width, viewportHeight: viewport.height },
        }));
      } else dismissFraming(true);
    };
    const fitContent = () => {
      if (!portrait) return;
      if (source === 'ground') {
        const surface = node.querySelector<HTMLElement>('.mw-hover-preprofile-bubble__surface');
        const profile = surface?.querySelector<HTMLElement>('.mw-preprofile');
        const body = profile?.querySelector<HTMLElement>(':scope > .mw-preprofile__scroll-body');
        const footer = profile?.querySelector<HTMLElement>(':scope > .mw-preprofile__footer');
        if (!surface || !profile || !body || !footer) return;
        const pixels = (style: CSSStyleDeclaration, property: string) =>
          Number.parseFloat(style.getPropertyValue(property)) || 0;
        const edgeHeight = (style: CSSStyleDeclaration) =>
          pixels(style, 'padding-top') + pixels(style, 'padding-bottom')
          + pixels(style, 'border-top-width') + pixels(style, 'border-bottom-width');
        const outerMargin = (style: CSSStyleDeclaration) =>
          pixels(style, 'margin-top') + pixels(style, 'margin-bottom');
        const bodyStyle = getComputedStyle(body), footerStyle = getComputedStyle(footer);
        const profileStyle = getComputedStyle(profile);
        // The body has intrinsic flex sizing. scrollHeight still measures all
        // its content when a short screen must constrain its visible height.
        const measuredHeight = Math.ceil(edgeHeight(getComputedStyle(surface))
          + edgeHeight(profileStyle) + pixels(profileStyle, 'row-gap')
          + body.scrollHeight + outerMargin(bodyStyle)
          + pixels(bodyStyle, 'border-top-width') + pixels(bodyStyle, 'border-bottom-width')
          + footer.getBoundingClientRect().height + outerMargin(footerStyle));
        if (groundContentHeight !== measuredHeight) {
          groundContentHeight = measuredHeight;
          apply();
        }
        return;
      }
      // Ring cards retain their established size, with extra room for a long
      // biography or restore action. Their layout is independent of this fit.
      const bodies = node.querySelectorAll<HTMLElement>('.mw-preprofile__scroll-body');
      let overflow = 0;
      for (const body of bodies) overflow = Math.max(overflow, body.scrollHeight - body.clientHeight);
      if (overflow > 1) {
        const maximum = viewport.height - topInset - 12 - 144;
        const next = Math.min(maximum, preferredHeight + overflow + 1);
        if (next > preferredHeight) { preferredHeight = next; apply(); }
      }
    };
    const queueContentFit = () => {
      if (contentFitFrame) return;
      contentFitFrame = requestAnimationFrame(() => {
        contentFitFrame = 0;
        fitContent();
      });
    };
    const positionAndFit = () => {
      // Establish width before measuring text, then send only the final camera
      // target. Observer notifications with unchanged content cannot replay it.
      apply(source !== 'ground');
      fitContent();
      if (source === 'ground') apply();
    };
    const resize = () => {
      viewport = { width: window.innerWidth, height: window.innerHeight };
      portrait = getGlobeOrientation() === 'portrait';
      landscapePanel = mobileArtistPanel(viewport);
      topInset = search ? search.getBoundingClientRect().bottom + 10 : 72;
      positionAndFit();
    };
    const updateAnchor = (event: Event) => {
      // The neighbourhood flight has one destination. Moving sprites must not
      // relaunch it or move its fixed card while the camera travels.
      if (source === 'ground') return;
      const detail = (event as CustomEvent).detail;
      if ((detail?.id ?? detail?.instanceId) !== identity || !detail.anchor) return;
      anchor = detail.anchor;
      apply();
    };
    positionAndFit();
    const contentResize = new ResizeObserver(source === 'ground' ? queueContentFit : fitContent);
    const observeContent = () => {
      contentResize.disconnect();
      node.querySelectorAll<HTMLElement>('.mw-preprofile__scroll-body, .mw-preprofile__scroll-body > *, .mw-preprofile__footer')
        .forEach(element => contentResize.observe(element));
      if (source === 'ground') queueContentFit();
      else fitContent();
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
      if (contentFitFrame) cancelAnimationFrame(contentFitFrame);
      contentMutation.disconnect();
      searchResize.disconnect();
      dockSideMutation.disconnect();
      dismissFraming();
    };
  }, [panel, identity, initialAnchor, anchorEvent]);
}
