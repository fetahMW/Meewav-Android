/** Let the canvas resolve a tap before dismissing the current artist.
 * A successful avatar pick replaces the card directly; empty taps and actual
 * gestures still dismiss it. No pointer capture or input handling is stolen. */
export function createGroundProfileDismissal({ events, inside, canvas, close,
  defer = queueMicrotask }: {
  events: EventTarget;
  inside: (target: EventTarget | null) => boolean;
  canvas: (target: EventTarget | null) => boolean;
  close: () => void;
  defer?: (callback: () => void) => void;
}) {
  const pointers = new Map<number, { x: number; y: number; revision: number }>();
  let revision = 0, disposed = false, dismissed = false;
  const dismiss = () => {
    if (disposed || dismissed) return;
    dismissed = true; pointers.clear(); close();
  };
  const down = (event: Event) => {
    const pointer = event as PointerEvent;
    if (inside(event.target)) return;
    if (!canvas(event.target)) { dismiss(); return; }
    pointers.set(pointer.pointerId, { x: pointer.clientX, y: pointer.clientY, revision });
    if (pointers.size > 1) dismiss();
  };
  const move = (event: Event) => {
    const pointer = event as PointerEvent, start = pointers.get(pointer.pointerId);
    if (start && Math.hypot(pointer.clientX - start.x, pointer.clientY - start.y) > 8) dismiss();
  };
  const up = (event: Event) => {
    const id = (event as PointerEvent).pointerId, start = pointers.get(id);
    pointers.delete(id);
    if (start) defer(() => { if (start.revision === revision) dismiss(); });
  };
  const cancel = (event: Event) => {
    if (pointers.has((event as PointerEvent).pointerId)) dismiss();
  };
  const selected = (event: Event) => { if ((event as CustomEvent).detail?.id) revision++; };
  const wheel = (event: Event) => { if (!inside(event.target)) dismiss(); };
  const key = (event: Event) => {
    const keyboard = event as KeyboardEvent;
    if (keyboard.key !== 'Escape') return;
    keyboard.preventDefault(); keyboard.stopPropagation(); dismiss();
  };
  events.addEventListener('pointerdown', down, true);
  events.addEventListener('pointermove', move, true);
  events.addEventListener('pointerup', up, true);
  events.addEventListener('pointercancel', cancel, true);
  events.addEventListener('lostpointercapture', cancel, true);
  events.addEventListener('meewav:ground-avatar-select', selected);
  events.addEventListener('wheel', wheel, { capture: true, passive: true });
  events.addEventListener('keydown', key, true);
  return () => {
    disposed = true; pointers.clear();
    events.removeEventListener('pointerdown', down, true);
    events.removeEventListener('pointermove', move, true);
    events.removeEventListener('pointerup', up, true);
    events.removeEventListener('pointercancel', cancel, true);
    events.removeEventListener('lostpointercapture', cancel, true);
    events.removeEventListener('meewav:ground-avatar-select', selected);
    events.removeEventListener('wheel', wheel, true);
    events.removeEventListener('keydown', key, true);
  };
}
