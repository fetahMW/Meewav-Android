import { useLayoutEffect } from "react";
import { scenePrivateKey } from "../scenePrivateStorage";
type Position = { y: number; anchor?: string; offset?: number; focus?: string };
const positions = new Map<string, Position>();
/** One restoration authority per history entry, with a visible-card anchor. */
export function useSceneDocumentScroll(entryKey: string, enabled: boolean) {
 useLayoutEffect(() => {
  if (!enabled) return;
  const scroller = document.querySelector<HTMLElement>(".scene-page");
  if (!scroller) return;
  const key = scenePrivateKey(`meewav:scene:scroll:${entryKey}`);
  const previous = history.scrollRestoration; history.scrollRestoration = "manual";
  let saveTimer: number | undefined;
  const save = (event?: Event) => {
   const cards = [...scroller.querySelectorAll<HTMLAnchorElement>('.scene-video-card__media-hit, .scene-featured-card')];
   const top = Math.max(0, scroller.querySelector('.scene-browse-chips-shell')?.getBoundingClientRect().bottom
    ?? scroller.querySelector('.shorts-topbar')?.getBoundingClientRect().bottom ?? 0);
   const anchor = cards.find((card) => card.getBoundingClientRect().bottom > top);
   const trigger = event?.target instanceof Element ? event.target.closest("a[href]") : null;
   const active = trigger?.getAttribute("href") ?? (document.activeElement instanceof HTMLAnchorElement ? document.activeElement.getAttribute("href") ?? undefined : undefined);
   const position = { y: scroller.scrollTop, anchor: anchor?.getAttribute('href') ?? undefined, offset: anchor?.getBoundingClientRect().top, focus: active };
   positions.set(key, position); try { sessionStorage.setItem(key, JSON.stringify(position)); } catch { /* In-memory fallback. */ }
  };
  const settled = () => { window.clearTimeout(saveTimer); saveTimer = undefined; save(); };
  const onScroll = () => {
   // Keep the exact offset immediately; expensive anchor layout/storage waits
   // until scrolling settles instead of blocking every frame of a fast fling.
   positions.set(key, { y: scroller.scrollTop });
   window.clearTimeout(saveTimer);
   saveTimer = window.setTimeout(settled, 150);
  };
  const onPointer = (event: Event) => {
   if (event.target instanceof Node && scroller.contains(event.target)) save(event);
  };
  const frame = requestAnimationFrame(() => {
   let position = positions.get(key) ?? { y: 0 };
   try { const stored = JSON.parse(sessionStorage.getItem(key) ?? 'null'); if (stored && typeof stored.y === 'number') position = stored; } catch { /* In-memory fallback. */ }
   const links = [...scroller.querySelectorAll<HTMLAnchorElement>('a[href]')];
   const anchor = links.find((link) => link.getAttribute('href') === position.anchor);
   const y = anchor && position.offset !== undefined ? scroller.scrollTop + anchor.getBoundingClientRect().top - position.offset : position.y;
   scroller.scrollTo({ top: y, behavior: 'instant' });
   if (position.focus) links.find((link) => link.getAttribute('href') === position.focus)?.focus({ preventScroll: true });
  });
  scroller.addEventListener('scroll', onScroll, { passive: true });
  scroller.addEventListener('scrollend', settled, { passive: true });
  document.addEventListener('pointerdown', onPointer, true);
  window.addEventListener('pagehide', settled);
  return () => {
   cancelAnimationFrame(frame); window.clearTimeout(saveTimer); save();
   scroller.removeEventListener('scroll', onScroll); scroller.removeEventListener('scrollend', settled);
   document.removeEventListener('pointerdown', onPointer, true); window.removeEventListener('pagehide', settled);
   history.scrollRestoration = previous;
  };
 }, [entryKey, enabled]);
}
