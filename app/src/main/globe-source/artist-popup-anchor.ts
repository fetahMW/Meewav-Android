import type { ArtistPopupAnchor } from './portrait-artist-popup';

/** Anchor updates are position-only events. They must never replay a profile
 * selection/visit or wake React for subpixel noise on a stationary scene. */
export function createArtistAnchorPublisher(
  target: EventTarget,
  eventName: string,
  identityKey: 'id' | 'instanceId',
) {
  let previous: { identity: string | number; anchor: ArtistPopupAnchor } | null = null;
  return (identity: string | number, anchor: ArtistPopupAnchor) => {
    const old = previous?.anchor;
    if (previous?.identity === identity && old &&
      old.viewportWidth === anchor.viewportWidth && old.viewportHeight === anchor.viewportHeight &&
      Math.abs(old.x - anchor.x) < .5 && Math.abs(old.y - anchor.y) < .5 &&
      Math.abs(old.clearance - anchor.clearance) < .5) return false;
    previous = { identity, anchor };
    target.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true, detail: { [identityKey]: identity, anchor },
    }));
    return true;
  };
}
