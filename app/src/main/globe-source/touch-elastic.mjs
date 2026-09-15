// Bounded resistance with immediate reversal: no hidden accumulated overscroll.
export function elasticDelta(value, delta, min, max, extent) {
  if (!Number.isFinite(delta) || delta === 0) return value;
  if (delta < 0) return -elasticDelta(-value, -delta, -max, -min, extent);
  if (value < min) return Math.min(max + extent, value + delta);
  const inside = Math.max(0, max - value);
  if (delta <= inside) return value + delta;
  const excess = Math.max(0, value - max);
  return max + excess + Math.max(0, extent - excess) * -Math.expm1(-(delta - inside) / extent);
}

export const springRemaining = seconds => seconds >= .45 ? 0 : (1 + 24 * seconds) * Math.exp(-24 * seconds);
