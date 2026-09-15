import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Native vertical paging: the complete card follows the finger. */
export function TopTenProfilePages({ index, total, onChange, renderPage }: {
  index: number; total: number; onChange: (index: number) => void;
  renderPage: (index: number, active: boolean) => ReactNode;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const reported = useRef(index);
  const positioned = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; start: number; page: number; time: number; moving: boolean } | null>(null);
  const suppressClick = useRef(false);
  const settle = (node: HTMLDivElement, page: number) => {
    node.classList.remove('is-dragging');
    node.scrollTo({ top: Math.max(0, Math.min(total - 1, page)) * node.clientHeight,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    // A swipe reports the nearest card without resetting the native scroll.
    // A rail/keyboard selection instead positions that page directly.
    if (!positioned.current || reported.current !== index) {
      node.scrollTop = index * node.clientHeight;
      positioned.current = true;
      reported.current = index;
    }
  }, [index]);
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const resize = new ResizeObserver(() => { node.scrollTop = reported.current * node.clientHeight; });
    resize.observe(node);
    return () => resize.disconnect();
  }, []);
  return <div ref={viewport} className="top-ten-profile-pages"
    onPointerDownCapture={event => {
      suppressClick.current = false;
      if (event.button !== 0 || !event.isPrimary ||
        (event.target as Element).closest('input, select, textarea, audio, video, [role="slider"]')) return;
      const node = event.currentTarget;
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: node.scrollTop,
        page: Math.round(node.scrollTop / Math.max(1, node.clientHeight)), time: performance.now(), moving: false };
    }}
    onPointerMoveCapture={event => {
      const gesture = drag.current;
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (!gesture.moving) {
        // Ignore small sideways drift while the intended direction settles.
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.5) { drag.current = null; return; }
        if (Math.abs(dy) < 6 || Math.abs(dy) < Math.abs(dx) * 1.1) return;
        gesture.moving = true; suppressClick.current = true;
        event.currentTarget.classList.add('is-dragging');
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.preventDefault(); event.stopPropagation();
      const node = event.currentTarget, height = node.clientHeight;
      node.scrollTop = Math.max(Math.max(0, gesture.page - 1) * height,
        Math.min(Math.min(total - 1, gesture.page + 1) * height, gesture.start - dy));
    }}
    onPointerUpCapture={event => {
      const gesture = drag.current;
      if (!gesture || gesture.id !== event.pointerId) return;
      drag.current = null;
      if (!gesture.moving) return;
      event.preventDefault(); event.stopPropagation();
      const dy = event.clientY - gesture.y;
      const speed = Math.abs(dy) / Math.max(1, performance.now() - gesture.time);
      const advance = Math.abs(dy) > Math.min(70, event.currentTarget.clientHeight * .2) || (Math.abs(dy) > 20 && speed > .45);
      settle(event.currentTarget, gesture.page + (advance ? -Math.sign(dy) : 0));
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onPointerCancel={event => {
      const gesture = drag.current;
      if (!gesture || gesture.id !== event.pointerId) return;
      drag.current = null;
      if (gesture?.moving) settle(event.currentTarget, gesture.page);
    }}
    onLostPointerCapture={event => {
      // Media controls can release their own capture inside a page.
      if (event.target !== event.currentTarget) return;
      const gesture = drag.current;
      if (!gesture || gesture.id !== event.pointerId) return;
      drag.current = null;
      if (gesture?.moving) settle(event.currentTarget, gesture.page);
    }}
    onClickCapture={event => {
      if (!suppressClick.current) return;
      event.preventDefault(); event.stopPropagation(); suppressClick.current = false;
    }}
    onScroll={event => {
      const node = event.currentTarget;
      const next = Math.max(0, Math.min(total - 1, Math.round(node.scrollTop / Math.max(1, node.clientHeight))));
      if (next === reported.current) return;
      reported.current = next;
      onChange(next);
    }}>
    {Array.from({ length: total }, (_, page) => <div className="top-ten-profile-page" key={page}
      aria-hidden={page !== index} inert={page !== index}>
      {Math.abs(page - index) <= 1 && renderPage(page, page === index)}
    </div>)}
  </div>;
}
