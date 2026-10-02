/** Keep the last complete image at its real pixel size while Android swaps
 * display axes. The CSS compensation cancels the system quarter turn until
 * the next render is ready; no duplicate canvas, snapshot or extra GPU pass. */
export function createGlobeSurfaceFrame(canvas) {
  let previousWidth = 0, previousHeight = 0, previousRotation;
  return {
    commit(width, height, rotation) {
      if (!(width > 0 && height > 0) || !Number.isFinite(rotation) || rotation % 90 !== 0) return false;
      if (previousWidth === width && previousHeight === height && previousRotation === rotation) return false;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.setProperty('--globe-rendered-display-angle', `${rotation}deg`);
      canvas.dataset.globeDisplayRotation = String(rotation);
      previousWidth = width; previousHeight = height; previousRotation = rotation;
      return true;
    },
  };
}
