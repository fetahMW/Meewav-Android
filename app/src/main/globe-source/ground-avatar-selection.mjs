/** Selection grows from the artist's feet; the geographic anchor stays put. */
export function groundAvatarSelectionMetrics(item, emphasis = 1) {
  const spriteBaseSize = item?.avatar?.isHost ? 60 : 56;
  const normalSize = Math.max(0, Number.isFinite(item?.size) ? item.size : spriteBaseSize);
  // A selection cue stays secondary to the profile. Hosts are already larger.
  const multiplier = 1 + (item?.avatar?.isHost ? .15 : .25) * Math.max(0, Math.min(1, emphasis));
  const size = normalSize * multiplier;
  return { spriteBaseSize, spriteScale: size / spriteBaseSize,
    spriteDrop: 0, lift: 0, halfSpriteSize: size / 2, size, multiplier };
}

export function createGroundAvatarEmphasis(now = () => performance.now(), reducedMotion = false) {
  let started = -Infinity;
  return {
    start() { started = now(); },
    get value() {
      const t = reducedMotion ? 1 : Math.max(0, Math.min(1, (now() - started) / 160));
      return 1 - (1 - t) ** 3;
    },
    get moving() { return !reducedMotion && now() - started < 160; },
  };
}
