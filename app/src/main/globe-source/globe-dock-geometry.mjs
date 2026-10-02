/** Android display rotation turns graphics clockwise relative to the device.
 * Undo it for the chassis; the sensor supplies the independent icon rotation. */
export function dockLayout(rotation, width, height, thickness = 104) {
  const quarter = ((Math.round(rotation / 90) % 4) + 4) % 4;
  const side = ['bottom', 'right', 'top', 'left'][quarter];
  return {
    rotation: -quarter * 90,
    width: quarter % 2 ? height : width,
    deviceHeight: quarter % 2 ? width : height,
    thickness,
    side,
    centerX: quarter === 1 ? width - thickness / 2 : quarter === 3 ? thickness / 2 : width / 2,
    centerY: quarter === 0 ? height - thickness / 2 : quarter === 2 ? thickness / 2 : height / 2,
  };
}

/** Choose the neighbouring revolution, so crossing ±180 never makes a full turn. */
export function nearestAngle(angle, previous) {
  return previous + ((angle - previous) % 360 + 540) % 360 - 180;
}

/** Display and WebView size notifications can arrive in either order. Never
 * apply a landscape compensation to a still-portrait drawing surface. Width,
 * rather than aspect, also avoids mistaking an open keyboard for a rotation. */
export function viewportRotation(requested, previous, width, naturalWidth, roll, browserAngle) {
  const landscape = width > naturalWidth * 1.2;
  const fits = angle => Number.isFinite(angle) && angle % 90 === 0
    && (Math.abs(angle / 90) % 2 === 1) === landscape;
  if (fits(requested)) return ((requested % 360) + 360) % 360;
  if (fits(previous)) return previous;
  if (fits(browserAngle)) return ((browserAngle % 360) + 360) % 360;
  const candidates = landscape ? [90, 270] : [0, 180];
  const target = roll == null ? requested : -roll;
  return candidates.reduce((best, angle) => Math.abs(nearestAngle(angle, target) - target)
    < Math.abs(nearestAngle(best, target) - target) ? angle : best);
}
