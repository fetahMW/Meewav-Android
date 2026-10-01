import { useLayoutEffect, type RefObject } from 'react';
import { createChatHeaderScroll } from '../messaging-source/chatHeaderScroll';

const editable = 'input, textarea, select, [contenteditable="true"]';
const fixedControls = '.shorts-topbar, .mobile-scene-tools, .scene-browse-chips-shell, .scene-browse-nav, .shorts-player-layer, [role="dialog"]';

/** The chat detector drives both Scene rows. The viewport and its initial
 * content padding stay fixed, so chrome animation never changes scrollTop. */
export function useSceneHeaderScroll(surfaceRef: RefObject<HTMLElement | null>, routeKey: string) {
  useLayoutEffect(() => {
    const scroller = surfaceRef.current;
    if (!scroller) return;
    const chrome = [...scroller.querySelectorAll<HTMLElement>('.shorts-topbar, .mobile-scene-tools')]
      .map(element => ({ element, inert: element.inert, ariaHidden: element.getAttribute('aria-hidden') }));
    if (chrome.length !== 2) return;
    const detector = createChatHeaderScroll();
    let hidden = false;
    let intentUntil = 0;
    let pointer: { id: number; y: number; moved: boolean } | null = null;

    const setHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      scroller.toggleAttribute('data-scene-header-hidden', next);
      for (const original of chrome) {
        original.element.inert = next || original.inert;
        if (next) original.element.setAttribute('aria-hidden', 'true');
        else if (original.ariaHidden === null) original.element.removeAttribute('aria-hidden');
        else original.element.setAttribute('aria-hidden', original.ariaHidden);
      }
    };
    const hasFocusedEditor = () => scroller.contains(document.activeElement)
      && Boolean(document.activeElement?.matches(editable));
    const sample = (userIntent = false, forceVisible = false) => setHidden(detector.update({
      top: scroller.scrollTop,
      maximum: Math.max(0, scroller.scrollHeight - scroller.clientHeight),
      viewport: scroller.clientHeight,
      userIntent,
      forceVisible,
    }));
    const reveal = () => {
      pointer = null;
      intentUntil = 0;
      detector.reset();
      sample(false, true);
    };
    const isContentGesture = (target: EventTarget | null) => target instanceof Element
      && scroller.contains(target) && !target.closest(fixedControls);
    const onScroll = (event: Event) => {
      if (event.target !== scroller) return;
      const now = performance.now();
      const intent = intentUntil > now;
      if (intent) intentUntil = now + 700;
      sample(intent, hasFocusedEditor()
        || Boolean(scroller.querySelector('.mobile-scene-tools [aria-expanded="true"]')));
    };
    const onDown = (event: PointerEvent) => {
      if (!isContentGesture(event.target)) return;
      sample();
      pointer = { id: event.pointerId, y: event.clientY, moved: false };
    };
    const onMove = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId && Math.abs(event.clientY - pointer.y) > 4) {
        pointer.moved = true;
        intentUntil = performance.now() + 700;
      }
    };
    const onUp = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      if (pointer.moved) intentUntil = performance.now() + 700;
      pointer = null;
    };
    const onWheel = (event: WheelEvent) => {
      if (!event.deltaY || !isContentGesture(event.target)) return;
      const now = performance.now();
      if (intentUntil <= now) sample();
      intentUntil = now + 700;
    };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(editable)) reveal();
    };

    scroller.setAttribute('data-auto-scene-chrome', '');
    sample(false, true);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    scroller.addEventListener('pointerdown', onDown, { passive: true });
    scroller.addEventListener('pointermove', onMove, { passive: true });
    scroller.addEventListener('pointerup', onUp, { passive: true });
    scroller.addEventListener('pointercancel', onUp, { passive: true });
    scroller.addEventListener('wheel', onWheel, { passive: true });
    scroller.addEventListener('keydown', reveal);
    scroller.addEventListener('focusin', onFocus);
    window.addEventListener('resize', reveal);
    window.visualViewport?.addEventListener('resize', reveal);
    document.addEventListener('fullscreenchange', reveal);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('pointerdown', onDown);
      scroller.removeEventListener('pointermove', onMove);
      scroller.removeEventListener('pointerup', onUp);
      scroller.removeEventListener('pointercancel', onUp);
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('keydown', reveal);
      scroller.removeEventListener('focusin', onFocus);
      window.removeEventListener('resize', reveal);
      window.visualViewport?.removeEventListener('resize', reveal);
      document.removeEventListener('fullscreenchange', reveal);
      setHidden(false);
      scroller.removeAttribute('data-auto-scene-chrome');
    };
  }, [surfaceRef, routeKey]);
}
