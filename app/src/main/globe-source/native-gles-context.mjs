import { GLES } from './native-gles-enums.mjs';

/** The render graph, picking and GLSL remain identical. GPU calls are encoded
 * once per frame for Android's separate GLES3 surface. This object never asks
 * Chromium for a WebGL context (including during capability detection). */
export function createNativeGlobeContext(canvas, bridge = globalThis.MeewavNativeGl) {
  if (!bridge) throw new Error('Native globe bridge unavailable');
  bridge.reset();
  const encoder = new TextEncoder();
  let memory = new ArrayBuffer(1024 * 1024), words = new DataView(memory), used = 0;
  let nextId = 1, disposed = false, lastLayout = '', frames = 0;
  const transferBudget = 4 * 1024 * 1024;
  const parameters = new Map(), shaderSources = new Map(), pixelStore = new Map();
  const supported = new Set(JSON.parse(bridge.query(11, 0, 0, '')));
  const extensions = new Map();
  const recentTransfers = [];
  let transferNext = 0, queryCount = 0;
  const reserve = count => {
    if (used + count <= memory.byteLength) return;
    let capacity = memory.byteLength;
    while (capacity < used + count) capacity *= 2;
    const replacement = new ArrayBuffer(capacity);
    new Uint8Array(replacement).set(new Uint8Array(memory, 0, used));
    memory = replacement; words = new DataView(memory);
  };
  const record = (op, args = [], floats = false, data = null) => {
    if (disposed) throw new Error('Native globe context disposed');
    const byteLength = data?.byteLength || 0;
    const payload = args.length * 4 + ((byteLength + 3) & ~3);
    if (used && used + payload + 8 > transferBudget) flush(false);
    reserve(payload + 8);
    words.setUint32(used, op, true); words.setUint32(used + 4, payload, true); used += 8;
    for (let i = 0; i < args.length; i++, used += 4) {
      if (floats === true || (Array.isArray(floats) && floats.includes(i))) words.setFloat32(used, args[i], true);
      else words.setInt32(used, args[i] ?? 0, true);
    }
    if (byteLength) new Uint8Array(memory, used, byteLength).set(new Uint8Array(data.buffer, data.byteOffset, byteLength));
    const padding = ((byteLength + 3) & ~3) - byteLength;
    if (padding) new Uint8Array(memory, used + byteLength, padding).fill(0);
    used += ((byteLength + 3) & ~3);
  };
  const encode = () => {
    const bytes = new Uint8Array(memory, 0, used);
    // Modern WebView can encode the exact view directly in native code. Avoid
    // spreading every byte into JS arguments and building an intermediate string.
    if (typeof bytes.toBase64 === 'function') return bytes.toBase64();
    let binary = '';
    for (let offset = 0; offset < used; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, Math.min(used, offset + 16384)));
    return btoa(binary);
  };
  const flush = frame => {
    if (!used && !frame) return;
    const bytes = used, started = performance.now();
    const encoded = encode(), encodedAt = performance.now();
    const error = bridge.send(encoded, !!frame), finished = performance.now();
    recentTransfers[transferNext] = { bytes, encodeCpuMs: encodedAt-started, bridgeWaitMs: finished-encodedAt };
    transferNext = (transferNext+1)%120;
    used = 0;
    if (error) throw new Error(error);
  };
  const query = (kind, id = 0, argument = 0, name = '') => {
    queryCount++;
    flush(false);
    const result = JSON.parse(bridge.query(kind, id, argument, name));
    if (result?.error) throw new Error(result.error);
    return result;
  };
  const objectId = object => object?.id || 0;
  const create = (type, argument) => { const object = Object.freeze({ id: nextId++, type }); record(1, argument === undefined ? [type, object.id] : [type, object.id, argument]); return object; };
  const remove = (type, object) => { if (object) record(2, [type, objectId(object)]); };
  const view = (data, offset = 0, length) => {
    if (data == null) return null;
    if (data instanceof ArrayBuffer) return new Uint8Array(data, offset, length);
    const elementSize = data.BYTES_PER_ELEMENT || 1;
    return new Uint8Array(data.buffer, data.byteOffset + offset * elementSize, length === undefined ? data.byteLength - offset * elementSize : length * elementSize);
  };
  const uniform = (location, kind, size, values, integer = false, unsigned = false) => {
    if (location == null) return;
    const Type = unsigned ? Uint32Array : integer ? Int32Array : Float32Array;
    const array = values instanceof Type ? values : new Type(values);
    record(19, [location, kind, array.length / size], false, array);
  };
  const uniformSlice = (values, offset, length) => {
    const end = length === undefined ? undefined : offset + length;
    return typeof values.subarray === 'function' ? values.subarray(offset, end) : values.slice(offset, end);
  };
  const pixels = (image, format, type) => {
    const width = image.videoWidth || image.naturalWidth || image.width;
    const height = image.videoHeight || image.naturalHeight || image.height;
    if (!(width > 0 && height > 0)) throw new Error('Invalid native image size');
    const scratch = document.createElement('canvas'); scratch.width = width; scratch.height = height;
    const context = scratch.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
    if (!context) throw new Error('Texture decode unavailable');
    if (typeof ImageData !== 'undefined' && image instanceof ImageData) context.putImageData(image, 0, 0);
    else context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, width, height).data;
    if (type !== GLES.UNSIGNED_BYTE) throw new Error('Unsupported DOM texture type');
    const channels = format === GLES.RGB ? 3 : format === GLES.RED || format === GLES.ALPHA || format === GLES.LUMINANCE ? 1 : format === GLES.RG || format === GLES.LUMINANCE_ALPHA ? 2 : 4;
    const alignment = pixelStore.get(GLES.UNPACK_ALIGNMENT) || 4;
    const rowBytes = width * channels, stride = Math.ceil(rowBytes / alignment) * alignment;
    const data = new Uint8Array(stride * height);
    // WebGL ignores these unpack flags for ImageBitmap: its creation options
    // already define orientation and alpha. GLTFLoader uses this path too.
    const bitmap = typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap;
    const flip = !bitmap && !!pixelStore.get(GLES.UNPACK_FLIP_Y_WEBGL);
    const premultiply = !bitmap && !!pixelStore.get(GLES.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const from = ((flip ? height - 1 - y : y) * width + x) * 4, to = y * stride + x * channels;
      const alpha = rgba[from + 3] / 255;
      for (let c = 0; c < channels; c++) data[to + c] = c === 3 ? rgba[from + 3] : Math.round(rgba[from + c] * (premultiply ? alpha : 1));
    }
    return { width, height, data };
  };
  const texture3d = (target, level, x, y, z, width, height, depth, format, type, bytes) => {
    // Photo/icon arrays are contiguous layers. Keep the exact bytes and GPU
    // allocation while bounding bridge/Base64/JNI copies to a few MiB.
    const scalar = [GLES.UNSIGNED_BYTE,GLES.BYTE].includes(type) ? 1 : [GLES.UNSIGNED_SHORT,GLES.SHORT,GLES.HALF_FLOAT].includes(type) ? 2 : 4;
    const channels = [GLES.RED,GLES.RED_INTEGER].includes(format) ? 1 : [GLES.RG,GLES.RG_INTEGER].includes(format) ? 2 : [GLES.RGB,GLES.RGB_INTEGER].includes(format) ? 3 : 4;
    const layerBytes = width * height * channels * scalar;
    const contiguous = bytes && bytes.byteLength === layerBytes * depth &&
      ![GLES.UNPACK_ROW_LENGTH,GLES.UNPACK_IMAGE_HEIGHT,GLES.UNPACK_SKIP_ROWS,GLES.UNPACK_SKIP_PIXELS,GLES.UNPACK_SKIP_IMAGES].some(key => pixelStore.get(key));
    if (contiguous && bytes.byteLength > transferBudget && layerBytes <= transferBudget) {
      const layersPerBatch = Math.max(1,Math.floor(transferBudget / layerBytes));
      for (let layer=0;layer<depth;layer+=layersPerBatch) {
        const count=Math.min(layersPerBatch,depth-layer), slice=bytes.subarray(layer*layerBytes,(layer+count)*layerBytes);
        record(28,[target,level,x,y,z+layer,width,height,count,format,type,slice.byteLength],false,slice);
      }
    } else record(28,[target,level,x,y,z,width,height,depth,format,type,bytes?.byteLength || 0],false,bytes);
  };
  const gl = Object.assign({}, GLES, {
    canvas,
    get drawingBufferWidth() { return canvas.width; },
    get drawingBufferHeight() { return canvas.height; },
    drawingBufferColorSpace: 'srgb', unpackColorSpace: 'srgb',
    getContextAttributes: () => ({ alpha: true, depth: true, stencil: false, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance', desynchronized: false }),
    isContextLost: () => disposed,
    getSupportedExtensions: () => [...extensions.keys()],
    getExtension(name) {
      if (extensions.has(name)) return extensions.get(name);
      let result = null;
      const nativeName = { EXT_color_buffer_float: 'GL_EXT_color_buffer_float', EXT_color_buffer_half_float: 'GL_EXT_color_buffer_half_float', OES_texture_float_linear: 'GL_OES_texture_float_linear' }[name];
      if (nativeName && supported.has(nativeName)) result = {};
      if (name === 'EXT_texture_filter_anisotropic' && supported.has('GL_EXT_texture_filter_anisotropic')) result = { TEXTURE_MAX_ANISOTROPY_EXT: 0x84fe, MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84ff };
      // Web-specific multi-draw, clip/cull and render-to-texture extensions do
      // not have identical contracts in GLES. The core fallback preserves output.
      extensions.set(name, result); return result;
    },
    getParameter(parameter) {
      if (parameter === GLES.UNPACK_FLIP_Y_WEBGL || parameter === GLES.UNPACK_PREMULTIPLY_ALPHA_WEBGL) return !!pixelStore.get(parameter);
      if (parameter === GLES.UNPACK_COLORSPACE_CONVERSION_WEBGL) return pixelStore.get(parameter) ?? GLES.BROWSER_DEFAULT_WEBGL;
      const constant = Object.keys(GLES).find(key => GLES[key] === parameter && (key.startsWith('MAX_') || ['VERSION','VENDOR','RENDERER','SHADING_LANGUAGE_VERSION','ALIASED_LINE_WIDTH_RANGE','ALIASED_POINT_SIZE_RANGE','COMPRESSED_TEXTURE_FORMATS'].includes(key)));
      if (constant && parameters.has(parameter)) return parameters.get(parameter);
      const result = query(1, 0, parameter);
      if (constant) parameters.set(parameter, result);
      return result;
    },
    getShaderPrecisionFormat: (shader, precision) => query(10, shader, precision),
    getError: () => query(12),
    createBuffer: () => create(1), deleteBuffer: object => remove(1, object),
    createTexture: () => create(2), deleteTexture: object => remove(2, object),
    createFramebuffer: () => create(3), deleteFramebuffer: object => remove(3, object),
    createRenderbuffer: () => create(4), deleteRenderbuffer: object => remove(4, object),
    createVertexArray: () => create(5), deleteVertexArray: object => remove(5, object),
    createProgram: () => create(6), deleteProgram: object => remove(6, object),
    createShader: type => create(7, type), deleteShader: object => { shaderSources.delete(objectId(object)); remove(7, object); },
    shaderSource(shader, source) { shaderSources.set(objectId(shader), source); const bytes = encoder.encode(source); record(3, [objectId(shader), bytes.length], false, bytes); },
    getShaderSource: shader => shaderSources.get(objectId(shader)) || '',
    compileShader: shader => record(4, [objectId(shader)]),
    attachShader: (program, shader) => record(5, [objectId(program), objectId(shader)]),
    linkProgram: program => record(6, [objectId(program)]),
    useProgram: program => record(7, [objectId(program)]),
    bindAttribLocation(program, index, name) { const bytes = encoder.encode(name); record(8, [objectId(program), index, bytes.length], false, bytes); },
    getShaderParameter: (shader, parameter) => parameter === GLES.COMPILE_STATUS ? !!query(2, objectId(shader), parameter) : query(2, objectId(shader), parameter),
    getProgramParameter: (program, parameter) => [GLES.LINK_STATUS, GLES.VALIDATE_STATUS].includes(parameter) ? !!query(3, objectId(program), parameter) : query(3, objectId(program), parameter),
    getShaderInfoLog: shader => query(4, objectId(shader)), getProgramInfoLog: program => query(5, objectId(program)),
    getActiveUniform: (program, index) => query(6, objectId(program), index), getActiveAttrib: (program, index) => query(7, objectId(program), index),
    getUniformLocation(program, name) { const location = query(8, objectId(program), 0, name); return location < 0 ? null : location; },
    getAttribLocation: (program, name) => query(9, objectId(program), 0, name),
    bindVertexArray: vao => record(9, [objectId(vao)]),
    bindBuffer: (target, buffer) => record(10, [target, objectId(buffer)]),
    bufferData(target, data, usage, offset = 0, length) {
      const bytes = typeof data === 'number' ? null : view(data,offset,length);
      if (bytes?.byteLength > transferBudget) { record(11,[target,usage,bytes.byteLength,0]);gl.bufferSubData(target,0,bytes); }
      else record(11,[target,usage,bytes?.byteLength ?? data,bytes ? 1 : 0],false,bytes);
    },
    bufferSubData(target,destinationOffset,data,sourceOffset=0,length) {
      const bytes=view(data,sourceOffset,length);
      for(let from=0;from<bytes.byteLength;from+=transferBudget) { const slice=bytes.subarray(from,Math.min(bytes.byteLength,from+transferBudget));record(12,[target,destinationOffset+from,slice.byteLength],false,slice); }
    },
    enableVertexAttribArray: index => record(13, [index]), disableVertexAttribArray: index => record(14, [index]),
    vertexAttribPointer: (index, size, type, normalized, stride, offset) => record(15, [index, size, type, +normalized, stride, offset]),
    vertexAttribIPointer: (index, size, type, stride, offset) => record(16, [index, size, type, stride, offset]),
    vertexAttribDivisor: (index, divisor) => record(17, [index, divisor]),
    activeTexture: texture => record(20, [texture]), bindTexture: (target, texture) => record(21, [target, objectId(texture)]),
    texParameteri: (target, parameter, value) => record(22, [target, parameter, value]), texParameterf: (target, parameter, value) => record(23, [target, parameter, value], [2]),
    pixelStorei(parameter, value) { pixelStore.set(parameter, value); if (![GLES.UNPACK_FLIP_Y_WEBGL,GLES.UNPACK_PREMULTIPLY_ALPHA_WEBGL,GLES.UNPACK_COLORSPACE_CONVERSION_WEBGL].includes(parameter)) record(24, [parameter, value]); },
    texImage2D(...args) {
      let [target, level, internal, width, height, border, format, type, data, offset = 0] = args;
      if (args.length === 6) { [target, level, internal, format, type, data] = args; const image = pixels(data, format, type); width = image.width; height = image.height; border = 0; data = image.data; offset = 0; }
      else if (data && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer)) data = pixels(data, format, type).data;
      const bytes = view(data, offset); record(25, [target, level, internal, width, height, border, format, type, bytes?.byteLength || 0], false, bytes);
    },
    texSubImage2D(...args) {
      let [target, level, x, y, width, height, format, type, data, offset = 0] = args;
      if (args.length === 7) { [target, level, x, y, format, type, data] = args; const image = pixels(data, format, type); width = image.width; height = image.height; data = image.data; offset = 0; }
      else if (data && !ArrayBuffer.isView(data) && !(data instanceof ArrayBuffer)) { const image = pixels(data, format, type); data = image.data; }
      const bytes = view(data, offset); record(26, [target, level, x, y, width, height, format, type, bytes?.byteLength || 0], false, bytes);
    },
    texImage3D(target,level,internal,width,height,depth,border,format,type,data,offset=0) {
      const bytes=view(data,offset);
      if(bytes?.byteLength > transferBudget) { record(27,[target,level,internal,width,height,depth,border,format,type,0]);texture3d(target,level,0,0,0,width,height,depth,format,type,bytes); }
      else record(27,[target,level,internal,width,height,depth,border,format,type,bytes?.byteLength || 0],false,bytes);
    },
    texSubImage3D(target,level,x,y,z,width,height,depth,format,type,data,offset=0) { texture3d(target,level,x,y,z,width,height,depth,format,type,view(data,offset)); },
    texStorage2D: (...args) => record(29, args), texStorage3D: (...args) => record(30, args), generateMipmap: target => record(31, [target]),
    bindFramebuffer: (target, framebuffer) => record(32, [target, objectId(framebuffer)]),
    framebufferTexture2D: (target, attachment, textureTarget, texture, level) => record(33, [target, attachment, textureTarget, objectId(texture), level]),
    framebufferTextureLayer: (target, attachment, texture, level, layer) => record(34, [target, attachment, objectId(texture), level, layer]),
    bindRenderbuffer: (target, renderbuffer) => record(35, [target, objectId(renderbuffer)]), renderbufferStorage: (...args) => record(36, args), renderbufferStorageMultisample: (...args) => record(37, args),
    framebufferRenderbuffer: (target, attachment, renderbufferTarget, renderbuffer) => record(38, [target, attachment, renderbufferTarget, objectId(renderbuffer)]),
    drawBuffers: buffers => record(39, [buffers.length], false, new Uint32Array(buffers)), readBuffer: buffer => record(40, [buffer]),
    blitFramebuffer: (...args) => record(41, args), copyTexSubImage2D: (...args) => record(42, args), copyTexImage2D: (...args) => record(43, args),
    enable: capability => record(44, [capability]), disable: capability => record(45, [capability]),
    clearColor: (...args) => record(46, args, true), clearDepth: value => record(47, [value], true), clearStencil: value => record(48, [value]), clear: mask => record(49, [mask]),
    viewport: (...args) => record(50, args), scissor: (...args) => record(51, args), depthFunc: value => record(52, [value]), depthMask: value => record(53, [+value]),
    colorMask: (...args) => record(54, args.map(Number)), cullFace: value => record(55, [value]), frontFace: value => record(56, [value]),
    blendEquationSeparate: (...args) => record(57, args), blendEquation: value => record(57, [value, value]),
    blendFuncSeparate: (...args) => record(58, args), blendFunc: (source, destination) => record(58, [source, destination, source, destination]),
    blendColor: (...args) => record(59, args, true), polygonOffset: (...args) => record(60, args, true), lineWidth: value => record(61, [value], true),
    stencilMask: mask => record(62, [mask]), stencilFunc: (...args) => record(63, args), stencilOp: (...args) => record(64, args),
    drawArrays: (...args) => record(65, args), drawElements: (...args) => record(66, args), drawArraysInstanced: (...args) => record(67, args), drawElementsInstanced: (...args) => record(68, args),
    compressedTexImage2D(target, level, internal, width, height, border, data, offset = 0, length) { const bytes = view(data, offset, length); record(69, [target, internal, level, width, height, border, bytes.byteLength], false, bytes); },
    compressedTexSubImage2D(target, level, x, y, width, height, format, data, offset = 0, length) { const bytes = view(data, offset, length); record(70, [target, level, x, y, width, height, format, bytes.byteLength], false, bytes); },
    flush: () => { record(71); flush(false); },
    clearBufferfv: (buffer, drawBuffer, values) => record(72, [buffer, drawBuffer], false, new Float32Array(values)),
    clearBufferiv: (buffer, drawBuffer, values) => record(73, [buffer, drawBuffer], false, new Int32Array(values)),
    clearBufferfi: (buffer, drawBuffer, depth, stencil) => record(74, [buffer, drawBuffer, depth, stencil], [2]),
    copyBufferSubData: (...args) => record(76, args),
    invalidateFramebuffer: (target, attachments) => record(77, [target, attachments.length], false, new Uint32Array(attachments)),
    checkFramebufferStatus: target => query(13, 0, target),
    _resize(width, height) { record(75, [width, height]); },
    _present() {
      const rect = canvas.getBoundingClientRect();
      const matrix = new DOMMatrix(getComputedStyle(canvas).transform);
      const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
      const layout = [canvas.width, canvas.height, rect.x + rect.width / 2, rect.y + rect.height / 2, canvas.clientWidth, canvas.clientHeight, angle, innerWidth];
      const key = layout.join(':');
      if (key !== lastLayout) { bridge.layout(...layout); lastLayout = key; }
      flush(true); canvas.dataset.nativeGlobeFrame = String(++frames); return frames;
    },
    _status: () => ({ ...JSON.parse(bridge.status()), javascriptFrames: frames, backend: 'native-gles3' }),
    _performance: () => {
      const transfers = { samples: recentTransfers.length, queries: queryCount };
      for (const name of ['bytes','encodeCpuMs','bridgeWaitMs']) {
        const values = recentTransfers.map(sample => sample[name]).sort((a,b) => a-b);
        transfers[name] = { mean: values.reduce((total,value) => total+value,0)/(values.length || 1), p95: values[Math.floor((values.length-1)*.95)] || 0 };
      }
      return { nativeCpu: JSON.parse(bridge.metrics()), transfers };
    },
    _gpuInfo: () => ({ vendor: query(1,0,GLES.VENDOR), renderer: query(1,0,GLES.RENDERER), ...query(14) }),
    async _whenPresented(frame) {
      const deadline = performance.now() + 10000;
      for (;;) {
        const status = JSON.parse(bridge.status());
        if (status.error) throw new Error(status.error);
        if (status.presented >= frame && status.appliedLayout >= status.layout) return;
        if (performance.now() > deadline) throw new Error('Native frame presentation timed out');
        await new Promise(resolve => setTimeout(resolve, 16));
      }
    },
    _dispose() { flush(false); disposed = true; },
  });
  // Object.assign would evaluate getters. Keep framebuffer sizes live.
  Object.defineProperties(gl, { drawingBufferWidth: { get: () => canvas.width }, drawingBufferHeight: { get: () => canvas.height } });
  for (let size = 1; size <= 4; size++) {
    gl[`uniform${size}f`] = (location, ...values) => uniform(location, size, size, values);
    gl[`uniform${size}fv`] = (location, values, offset = 0, length) => uniform(location, size, size, uniformSlice(values, offset, length));
    gl[`uniform${size}i`] = (location, ...values) => uniform(location, size + 4, size, values, true);
    gl[`uniform${size}iv`] = (location, values, offset = 0, length) => uniform(location, size + 4, size, uniformSlice(values, offset, length), true);
    gl[`uniform${size}ui`] = (location, ...values) => uniform(location, size + 11, size, values, false, true);
    gl[`uniform${size}uiv`] = (location, values, offset = 0, length) => uniform(location, size + 11, size, uniformSlice(values, offset, length), false, true);
    gl[`vertexAttrib${size}fv`] = (index, values) => record(18, [index, values[0], size > 1 ? values[1] : 0, size > 2 ? values[2] : 0, size > 3 ? values[3] : 1], [1,2,3,4]);
  }
  for (let size = 2; size <= 4; size++) gl[`uniformMatrix${size}fv`] = (location, transpose, values, offset = 0, length) => {
    if (transpose) throw new Error('GLSL matrices require transpose=false');
    uniform(location, size + 7, size * size, uniformSlice(values, offset, length));
  };
  return gl;
}
