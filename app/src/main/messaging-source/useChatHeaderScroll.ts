import { useLayoutEffect, type RefObject } from 'react';
import { createChatHeaderScroll } from './chatHeaderScroll';

const timelineSelector = '.mw-chat-scene > .mw-chat-timeline';
const headerSelector = '.mw-mobile-workspace-header, .mw-chat-header:has(.mw-chat-header__identity)';
const editable = 'input, textarea, select, [contenteditable="true"]';

/** Only finger/wheel scrolling may collapse chat chrome. Incoming
 * messages, initial positioning and keyboard resizes rebase the detector. */
export function useChatHeaderScroll(surfaceRef: RefObject<HTMLDivElement | null>, enabled: boolean, routeKey: string) {
  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !enabled) return;
    type Context = {
      timeline: HTMLElement; scene: HTMLElement; owner: HTMLElement; header: HTMLElement;
      content: HTMLElement | null; detector: ReturnType<typeof createChatHeaderScroll>;
      until: number; hidden: boolean; originalHidden: string | null; originalInert: boolean;
    };
    const contexts = new Map<HTMLElement, Context>();
    let pointer: { context: Context; id: number; y: number; moved: boolean } | null = null;
    const setHidden = (context: Context, hidden: boolean) => {
      context.hidden = hidden;
      context.header.toggleAttribute('data-chat-header-hidden', hidden);
      context.header.inert = hidden || context.originalInert;
      if (hidden) context.header.setAttribute('aria-hidden', 'true');
      else if (context.originalHidden === null) context.header.removeAttribute('aria-hidden');
      else context.header.setAttribute('aria-hidden', context.originalHidden);
    };
    const sample = (context: Context, userIntent = false, forceVisible = false) => {
      const timeline = context.timeline;
      setHidden(context, context.detector.update({ top: timeline.scrollTop,
        maximum: Math.max(0, timeline.scrollHeight - timeline.clientHeight), viewport: timeline.clientHeight,
        userIntent, forceVisible }));
    };
    const reveal = () => {
      pointer = null;
      for (const context of contexts.values()) {
        context.until = 0; context.detector.reset(); sample(context, false, true);
      }
    };
    const sizes = new ResizeObserver(entries => {
      for (const entry of entries) {
        const header = entry.target as HTMLElement;
        const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight);
        if (!height) continue;
        for (const context of contexts.values()) if (context.header === header) {
          context.scene.style.setProperty('--auto-chat-header-height', `${height}px`);
          context.detector.reset(); sample(context, false, true);
        }
      }
    });
    const detach = (context: Context) => {
      sizes.unobserve(context.header);
      setHidden(context, false);
      context.header.inert = context.originalInert;
      context.header.removeAttribute('data-auto-chat-chrome');
      context.owner.removeAttribute('data-auto-chat-header-owner');
      context.content?.removeAttribute('data-auto-chat-header-content');
      context.scene.removeAttribute('data-auto-chat-header-scene');
      context.scene.style.removeProperty('--auto-chat-header-height');
      contexts.delete(context.timeline);
    };
    const connect = () => {
      for (const context of contexts.values()) if (!surface.contains(context.timeline) || !surface.contains(context.header)) detach(context);
      surface.querySelectorAll<HTMLElement>(timelineSelector).forEach(timeline => {
        if (contexts.has(timeline)) return;
        let owner = timeline.parentElement;
        let header: HTMLElement | undefined;
        while (owner && owner !== surface) {
          header = [...owner.children].find(child => child.matches(headerSelector)) as HTMLElement | undefined;
          if (header) break;
          owner = owner.parentElement;
        }
        if (!owner || !header) return;
        const scene = timeline.parentElement!;
        const content = timeline.closest<HTMLElement>('.mwp-project-detail__content, .agw-panel__body');
        const context: Context = { timeline, scene, owner, header, content, detector: createChatHeaderScroll(),
          until: 0, hidden: false, originalHidden: header.getAttribute('aria-hidden'), originalInert: Boolean(header.inert) };
        contexts.set(timeline, context);
        owner.setAttribute('data-auto-chat-header-owner', '');
        header.setAttribute('data-auto-chat-chrome', '');
        scene.setAttribute('data-auto-chat-header-scene', '');
        content?.setAttribute('data-auto-chat-header-content', '');
        scene.style.setProperty('--auto-chat-header-height', `${header.offsetHeight || (header.matches('.mw-mobile-workspace-header') ? 112 : 64)}px`);
        sizes.observe(header, { box: 'border-box' });
        sample(context, false, true);
      });
    };
    const contextFrom = (target: EventTarget | null) => target instanceof Element
      ? contexts.get(target.closest<HTMLElement>('.mw-chat-timeline')!) : undefined;
    const onScroll = (event: Event) => {
      const context = contexts.get(event.target as HTMLElement);
      if (!context) return;
      const now = performance.now();
      const intent = context.until > now;
      if (intent) context.until = now + 700; // Keep natural finger inertia in the same gesture.
      sample(context, intent, surface.contains(document.activeElement) && Boolean(document.activeElement?.matches(editable)));
    };
    const onDown = (event: PointerEvent) => {
      const context = contextFrom(event.target);
      if (!context) return;
      sample(context);
      pointer = { context, id: event.pointerId, y: event.clientY, moved: false };
    };
    const onMove = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (Math.abs(event.clientY - pointer.y) > 4) {
        pointer.moved = true;
        pointer.context.until = performance.now() + 700;
      }
    };
    const onUp = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      // pointercancel is also emitted when the WebView takes over native scrolling.
      if (pointer.moved) pointer.context.until = performance.now() + 700;
      pointer = null;
    };
    const onWheel = (event: WheelEvent) => {
      const context = contextFrom(event.target);
      if (context && event.deltaY) {
        const now = performance.now();
        if (context.until <= now) sample(context);
        context.until = now + 700;
      }
    };
    const onKey = () => reveal();
    const onFocus = (event: FocusEvent) => { if (event.target instanceof Element && event.target.matches(editable)) reveal(); };
    connect();
    const mounts = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element
        && (node.matches(`${timelineSelector}, ${headerSelector}`) || node.querySelector(`${timelineSelector}, ${headerSelector}`))))) connect();
    });
    mounts.observe(surface, { childList: true, subtree: true });
    surface.addEventListener('scroll', onScroll, { capture: true, passive: true });
    surface.addEventListener('pointerdown', onDown, { passive: true });
    surface.addEventListener('pointermove', onMove, { passive: true });
    surface.addEventListener('pointerup', onUp, { passive: true });
    surface.addEventListener('pointercancel', onUp, { passive: true });
    surface.addEventListener('wheel', onWheel, { passive: true });
    surface.addEventListener('keydown', onKey);
    surface.addEventListener('focusin', onFocus);
    window.addEventListener('resize', reveal);
    window.visualViewport?.addEventListener('resize', reveal);
    window.addEventListener('meewav:messaging-detail', reveal);
    return () => {
      mounts.disconnect();
      for (const context of [...contexts.values()]) detach(context);
      sizes.disconnect();
      surface.removeEventListener('scroll', onScroll, true);
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('pointermove', onMove);
      surface.removeEventListener('pointerup', onUp);
      surface.removeEventListener('pointercancel', onUp);
      surface.removeEventListener('wheel', onWheel);
      surface.removeEventListener('keydown', onKey);
      surface.removeEventListener('focusin', onFocus);
      window.removeEventListener('resize', reveal);
      window.visualViewport?.removeEventListener('resize', reveal);
      window.removeEventListener('meewav:messaging-detail', reveal);
    };
  }, [surfaceRef, enabled, routeKey]);
}
