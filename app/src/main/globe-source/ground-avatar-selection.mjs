/** The selected portrait retains its projected footprint and ground position.
 * Selection must never substitute a four-times larger floating avatar. */
export function groundAvatarSelectionMetrics(item) {
  const spriteBaseSize = item?.avatar?.isHost ? 60 : 56;
  const size = Math.max(0, Number.isFinite(item?.size) ? item.size : spriteBaseSize);
  return { spriteBaseSize, spriteScale: size / spriteBaseSize,
    spriteDrop: 0, lift: 0, halfSpriteSize: size / 2 };
}
