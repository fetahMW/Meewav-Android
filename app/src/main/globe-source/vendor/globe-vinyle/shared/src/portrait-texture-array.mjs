import * as T from 'three';

// One isolated mip chain per unchanged 512px portrait. Empty atlas cells and
// an initial upload of a full blank atlas are unnecessary. The tiny placeholder
// keeps the exact old background colour while all photos finish loading.
export function createPortraitTextureArray(count, size = 512, page = document) {
  const background = [117, 107, 157, 255], layerBytes = size * size * 4;
  const placeholder = new Uint8Array(count * 4);
  for (let index = 0; index < count; index++) placeholder.set(background, index * 4);
  let texture = new T.DataArrayTexture(placeholder, 1, 1, count), pixels = null, canvas = null, context = null;
  let disposed = false;
  function configure(value, mipmaps) {
    value.name = 'Legendary portraits — isolated full-resolution mipmaps';
    value.colorSpace = T.SRGBColorSpace;
    value.magFilter = T.LinearFilter;
    value.minFilter = mipmaps ? T.LinearMipmapLinearFilter : T.LinearFilter;
    value.generateMipmaps = mipmaps;
    value.needsUpdate = true;
    return value;
  }
  configure(texture, false);
  function prepare() {
    if (disposed || pixels) return;
    pixels = new Uint8Array(count * layerBytes);
    canvas = page.createElement('canvas'); canvas.width = canvas.height = size;
    context = canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
  }
  return {
    get texture() { return texture; },
    prepare,
    setPortrait(index, image) {
      if (disposed) return;
      prepare();
      context.fillStyle = '#756B9D'; context.fillRect(0, 0, size, size);
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      pixels.set(context.getImageData(0, 0, size, size).data, index * layerBytes);
    },
    setFallback(index) {
      if (disposed) return;
      prepare();
      for (let offset = index * layerBytes; offset < (index + 1) * layerBytes; offset += 4) pixels.set(background, offset);
    },
    commit() {
      if (disposed || !pixels) return texture;
      const previous = texture;
      texture = configure(new T.DataArrayTexture(pixels, size, size, count), true);
      previous.dispose();
      pixels = null;
      canvas.width = canvas.height = 1; canvas = context = null;
      return texture;
    },
    dispose() {
      disposed = true; texture.dispose(); texture.image.data = null; pixels = null;
      if (canvas) canvas.width = canvas.height = 1;
      canvas = context = null;
    },
  };
}
