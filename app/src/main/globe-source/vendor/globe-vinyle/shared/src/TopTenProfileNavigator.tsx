import { useRef, type CSSProperties } from 'react';

export type ProfileNavigation = {
  index: number;
  total: number;
  name: string;
  onChange: (index: number) => void;
};

/** A persistent touch rail: changing artists never unmounts the drag target. */
export function TopTenProfileNavigator({ index, total, name, onChange }: ProfileNavigation) {
  const drag = useRef<{ id: number; offset: number } | null>(null);
  const wheelTime = useRef(0);
  const lastIndex = Math.max(0, total - 1);
  const change = (next: number) => onChange(Math.max(0, Math.min(lastIndex, next)));
  const atPointer = (element: HTMLDivElement, y: number, offset: number) => {
    const rect = element.getBoundingClientRect();
    change(Math.round((y - rect.top - offset) / Math.max(1, rect.height - 32) * lastIndex));
  };
  return <div className="top-ten-profile-navigation">
    <span className="top-ten-profile-navigation__rank" aria-hidden="true">{index + 1}/{total}</span>
    <div className="top-ten-profile-navigation__rail" role="scrollbar" tabIndex={0}
      aria-label="Parcourir les pré-profils du Top 10" aria-orientation="vertical"
      aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}
      aria-valuetext={`${index + 1} sur ${total} : ${name}`}
      aria-controls="top-ten-active-profile"
      style={{ '--profile-progress': lastIndex ? index / lastIndex : 0 } as CSSProperties}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault(); event.stopPropagation();
        const thumb = event.currentTarget.querySelector('.top-ten-profile-navigation__thumb')!;
        const rect = thumb.getBoundingClientRect();
        const offset = event.clientY >= rect.top && event.clientY <= rect.bottom ? event.clientY - rect.top : 16;
        drag.current = { id: event.pointerId, offset };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus({ preventScroll: true });
        atPointer(event.currentTarget, event.clientY, offset);
      }}
      onPointerMove={event => {
        if (drag.current?.id === event.pointerId) atPointer(event.currentTarget, event.clientY, drag.current.offset);
      }}
      onPointerUp={event => {
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }}
      onWheel={event => {
        event.stopPropagation();
        const now = performance.now();
        if (!event.deltaY || now - wheelTime.current < 160) return;
        wheelTime.current = now;
        change(index + Math.sign(event.deltaY));
      }}
      onKeyDown={event => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? lastIndex
          : ['ArrowDown', 'PageDown'].includes(event.key) ? index + 1
          : ['ArrowUp', 'PageUp'].includes(event.key) ? index - 1 : null;
        if (next === null) return;
        event.preventDefault(); event.stopPropagation(); change(next);
      }}>
      <span className="top-ten-profile-navigation__track" />
      <span className="top-ten-profile-navigation__thumb" />
    </div>
  </div>;
}
