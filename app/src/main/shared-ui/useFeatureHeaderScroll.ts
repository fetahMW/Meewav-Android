import { useLayoutEffect, type RefObject } from 'react';
import { createChatHeaderScroll } from '../messaging-source/chatHeaderScroll';
import './feature-header-scroll.css';

type Feature = 'market' | 'rooms' | 'tremplin' | 'profile' | 'messages';
const features: Record<Feature, { bands: string[]; controls?: string; scrollers: string }> = {
  market: { bands: ['.market-topbar'], controls: '.mobile-feature-back', scrollers: '.market-scroll' },
  rooms: { bands: ['.rooms-topbar', '.rooms-home__controls'], controls: '.mobile-feature-back', scrollers: '.rooms-home' },
  tremplin: { bands: ['.tremplin-topbar'], controls: '.mobile-tremplin-back', scrollers: '.tremplin-scroll' },
  profile: { bands: ['.profile-command-bar, .profile-viewer-page.is-page > .profile-viewer-command-bar'], scrollers: '.profile-main, .profile-viewer-page.is-page' },
  messages: { bands: ['.mobile-messaging-header', '.mw-chat-header'], scrollers: '.mw-conversation-list, .mw-context-pane[data-content-space="collabs"]' },
};
const editable = 'input, textarea, select, [contenteditable="true"]';
const overlays = '[role="dialog"], [role="menu"], .mobile-feature-menu, .mobile-tremplin-menu, .android-room-viewer, .shorts-player-layer';
const persistentReturn = '[data-feature-return], .profile-viewer-page.is-page';

/** Android browsing chrome follows the same direction/hysteresis as chat.
 * Permanent content padding keeps the viewport stable during every animation. */
export function useFeatureHeaderScroll(
  surfaceRef: RefObject<HTMLElement | null>, feature: Feature, routeKey: string, enabled = true,
) {
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !enabled) return;
    const config = features[feature];
    const chromeSelector = [...config.bands, config.controls].filter(Boolean).join(', ');
    const structuralSelector = `${chromeSelector}, ${config.scrollers}, ${overlays}, ${persistentReturn}`;
    const detector = createChatHeaderScroll({ stableContent: true, revealDistance: 24, matchGestureDirection: true });
    let chrome: { element: HTMLElement; inert: boolean }[] = [];
    let bands: HTMLElement[] = [];
    let activeScroller: HTMLElement | null = null;
    let hidden = false;
    let intentUntil = 0;
    let gestureDirection = 0;
    let pointer: { id: number; y: number; moved: boolean } | null = null;
    const originalDistance = surface.style.getPropertyValue('--feature-collapse-distance');

    const restore = (original: typeof chrome[number]) => {
      original.element.inert = original.inert;
    };
    const setHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      surface.toggleAttribute('data-feature-header-hidden', next);
      for (const original of chrome) {
        // inert covers focus and accessibility without changing React-owned aria.
        if (next) original.element.inert = true;
        else restore(original);
      }
    };
    const reveal = () => {
      pointer = null;
      intentUntil = 0;
      gestureDirection = 0;
      detector.reset();
      setHidden(false);
    };
    const measure = () => {
      const leadingInset = bands[0]?.matches('.profile-viewer-command-bar')
        ? parseFloat(getComputedStyle(bands[0]).top) || 0 : 0;
      const height = leadingInset + bands.reduce((total, element) => total + element.getBoundingClientRect().height, 0);
      if (height > 0) {
        const distance = `${height}px`;
        if (surface.style.getPropertyValue('--feature-collapse-distance') !== distance) {
          surface.style.setProperty('--feature-collapse-distance', distance);
          reveal();
        }
      }
    };
    const sizes = new ResizeObserver(measure);
    const connect = () => {
      const nextBands = config.bands.map(selector => surface.querySelector<HTMLElement>(selector));
      const nextChrome = [...surface.querySelectorAll<HTMLElement>(chromeSelector)];
      if (chrome.length === nextChrome.length && chrome.every((item, index) => item.element === nextChrome[index])) return;
      reveal();
      chrome.forEach(restore);
      sizes.disconnect();
      bands = nextBands.filter((element): element is HTMLElement => element !== null);
      chrome = nextChrome.map(element => ({ element, inert: element.inert }));
      const ready = bands.length === config.bands.length;
      if (ready) surface.setAttribute('data-auto-feature-chrome', feature);
      else surface.removeAttribute('data-auto-feature-chrome');
      bands.forEach(element => sizes.observe(element));
      measure();
      activeScroller = null;
    };
    const blocked = () => Boolean(document.activeElement?.matches(editable))
      || Boolean(surface.querySelector(persistentReturn))
      || bands.some(element => Boolean(element.querySelector('[aria-expanded="true"]')))
      || [...document.querySelectorAll<HTMLElement>(overlays)].some(element => element.getClientRects().length > 0 && !element.closest('[hidden], [aria-hidden="true"]'))
      || Boolean(surface.querySelector(`${config.controls ?? '[data-no-controls]'}[aria-expanded="true"]`));
    const scrollerFor = (target: EventTarget | null) => {
      if (!(target instanceof Element) || target.closest(overlays)) return null;
      const scroller = target.closest<HTMLElement>(config.scrollers);
      return scroller && surface.contains(scroller) && scroller.clientHeight > 0
        && !scroller.closest('[hidden], [aria-hidden="true"]') ? scroller : null;
    };
    const sample = (scroller: HTMLElement, userIntent = false) => {
      if (activeScroller !== scroller) { reveal(); activeScroller = scroller; }
      setHidden(detector.update({
        top: scroller.scrollTop, maximum: Math.max(0, scroller.scrollHeight - scroller.clientHeight),
        viewport: scroller.clientHeight, userIntent, forceVisible: blocked(), gestureDirection,
      }));
    };
    const gestureScroller = (target: EventTarget | null) => {
      if (target instanceof Element && target.closest(chromeSelector)) return null;
      return scrollerFor(target);
    };
    const onScroll = (event: Event) => {
      const scroller = scrollerFor(event.target);
      if (!scroller || event.target !== scroller || !surface.hasAttribute('data-auto-feature-chrome')) return;
      const now = performance.now();
      const intent = intentUntil > now;
      if (intent) intentUntil = now + 700;
      sample(scroller, intent);
    };
    const onDown = (event: PointerEvent) => {
      connect();
      const scroller = gestureScroller(event.target);
      if (!scroller) { reveal(); return; }
      intentUntil = 0; gestureDirection = 0;
      sample(scroller);
      pointer = { id: event.pointerId, y: event.clientY, moved: false };
    };
    const onMove = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId && Math.abs(event.clientY - pointer.y) > 4) {
        gestureDirection = Math.sign(pointer.y - event.clientY);
        pointer.y = event.clientY;
        pointer.moved = true; intentUntil = performance.now() + 700;
      }
    };
    const onUp = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      if (pointer.moved) intentUntil = performance.now() + 700;
      pointer = null;
    };
    const onWheel = (event: WheelEvent) => {
      const scroller = gestureScroller(event.target);
      if (!event.deltaY || !scroller) return;
      if (intentUntil <= performance.now()) sample(scroller);
      gestureDirection = Math.sign(event.deltaY);
      intentUntil = performance.now() + 700;
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && (event.target.matches(editable) || event.target.closest(chromeSelector))) reveal();
    };
    // Lazy pages can mount after their shell. Observe only structural replacements,
    // never our attributes or individual card updates; no polling or frame loop.
    const structure = new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes')) reveal();
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node =>
        node instanceof Element && (node.matches(structuralSelector) || node.querySelector(structuralSelector))))) { reveal(); connect(); }
    });
    structure.observe(surface, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-feature-return'] });
    connect();
    surface.addEventListener('scroll', onScroll, { capture: true, passive: true });
    surface.addEventListener('pointerdown', onDown, { passive: true });
    surface.addEventListener('pointermove', onMove, { passive: true });
    surface.addEventListener('pointerup', onUp, { passive: true });
    surface.addEventListener('pointercancel', onUp, { passive: true });
    surface.addEventListener('wheel', onWheel, { passive: true });
    surface.addEventListener('keydown', reveal);
    surface.addEventListener('focusin', onFocus);
    window.addEventListener('resize', reveal);
    window.visualViewport?.addEventListener('resize', reveal);
    document.addEventListener('fullscreenchange', reveal);
    return () => {
      structure.disconnect(); sizes.disconnect();
      surface.removeEventListener('scroll', onScroll, true);
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerup', onUp);
      surface.removeEventListener('pointercancel', onUp);
      surface.removeEventListener('wheel', onWheel);
      surface.removeEventListener('keydown', reveal);
      surface.removeEventListener('focusin', onFocus);
      window.removeEventListener('resize', reveal);
      window.visualViewport?.removeEventListener('resize', reveal);
      document.removeEventListener('fullscreenchange', reveal);
      reveal(); chrome.forEach(restore);
      surface.removeAttribute('data-auto-feature-chrome');
      if (originalDistance) surface.style.setProperty('--feature-collapse-distance', originalDistance);
      else surface.style.removeProperty('--feature-collapse-distance');
    };
  }, [surfaceRef, feature, routeKey, enabled]);
}
