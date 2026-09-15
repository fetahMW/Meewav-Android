import { memo, useEffect, useRef } from "react";

/** Keep the navigation globe still: repeated Canvas2D paints stall this WebView. */
export default memo(function AndroidNavGlobeTexture({ landColor = "#EFE5FF", size = 38 }: { landColor?: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let disposed = false;
    const map = new Image();
    const landRGB = [1, 3, 5].map(offset => parseInt(landColor.slice(offset, offset + 2), 16));

    map.onload = () => {
      if (disposed) return;
      // Preserve the Web map, coastline mask, colour and pixel density.
      const texture = document.createElement("canvas");
      texture.width = map.naturalWidth;
      texture.height = map.naturalHeight;
      const bake = texture.getContext("2d", { willReadFrequently: true });
      if (!bake) return;
      bake.drawImage(map, 0, 0);
      const pixels = bake.getImageData(0, 0, texture.width, texture.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const luminance = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 3;
        const land = Math.max(0, Math.min(1, ((1 - luminance / 255) - .5) * 1.3 + .5));
        pixels.data[i] = landRGB[0];
        pixels.data[i + 1] = landRGB[1];
        pixels.data[i + 2] = landRGB[2];
        pixels.data[i + 3] = Math.round(land * 255);
      }
      bake.putImageData(pixels, 0, 0);

      const scale = Math.max(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(size * scale);
      canvas.height = Math.round(size * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(texture, 0, 0, size * 72 / 38, size);
      // No animation loop: the first rendered map remains visible until unmount.
      map.onload = null;
    };
    map.src = new URL("ui/images/earth_specular.jpg", document.baseURI).href;

    return () => {
      disposed = true;
      map.onload = null;
    };
  }, [landColor, size]);

  return <canvas ref={canvasRef} className="meewav-primary-nav__globe-map" aria-hidden="true" />;
});
