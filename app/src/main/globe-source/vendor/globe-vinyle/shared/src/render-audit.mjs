// Opt-in diagnostics. No timers, queries, GL wrappers or frame arrays are
// active during normal use. Counts are submissions/uploads, not displayed FPS.
const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? +sorted[Math.floor((sorted.length - 1) * p)].toFixed(3) : null;
};
export function bufferTransferBytes(data, offset = 0, length = 0) {
  if (typeof data === 'number') return data;
  if (!data?.byteLength) return 0;
  const elementBytes = data.BYTES_PER_ELEMENT || 1;
  return length > 0 ? length * elementBytes : Math.max(0, data.byteLength - offset * elementBytes);
}
export function createRenderAudit(gl, renderer, now = () => performance.now()) {
  const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  let enabled = false, session = 0, started = 0, previous = null;
  let frames = [], gpu = [], pending = [], restorers = [];
  let counters = {};
  const resetCounters = () => { counters = { bufferBytes: 0, bufferData: 0, bufferSubData: 0, textureUploads: 0, mipmapGenerations: 0 }; };
  function hook(name, count) {
    const original = gl[name], descriptor = Object.getOwnPropertyDescriptor(gl, name);
    if (typeof original !== 'function') return;
    const wrapped = function (...args) { count(args); return original.apply(this, args); };
    gl[name] = wrapped;
    restorers.push(() => {
      if (gl[name] !== wrapped) return;
      if (descriptor) Object.defineProperty(gl, name, descriptor); else delete gl[name];
    });
  }
  function poll() {
    if (!timer) return;
    const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT);
    while (pending.length && (disjoint || gl.getQueryParameter(pending[0].query, gl.QUERY_RESULT_AVAILABLE))) {
      const item = pending.shift();
      if (!disjoint && item.session === session && enabled) gpu.push({ activity: item.activity, ms: gl.getQueryParameter(item.query, gl.QUERY_RESULT) / 1e6 });
      gl.deleteQuery(item.query);
    }
  }
  const distribution = list => ({ samples: list.length, p50: percentile(list, .5), p95: percentile(list, .95), p99: percentile(list, .99), max: percentile(list, 1) });
  function report() {
    const states = {};
    for (const activity of new Set(frames.map(frame => frame.activity))) {
      const selected = frames.filter(frame => frame.activity === activity);
      states[activity] = {
        submissions: selected.length,
        cpuMs: distribution(selected.map(frame => frame.cpuMs)),
        intervalMs: distribution(selected.map(frame => frame.intervalMs).filter(value => value !== null)),
        drawCalls: distribution(selected.map(frame => frame.calls)),
        triangles: distribution(selected.map(frame => frame.triangles)),
        gpuMs: distribution(gpu.filter(sample => sample.activity === activity).map(sample => sample.ms)),
      };
    }
    return { enabled, durationMs: +(now() - started).toFixed(1), submissions: frames.length,
      gpuTimerAvailable: !!timer, pendingGpuSamples: pending.length, uploads: { ...counters }, states,
      peakTextures: Math.max(0, ...frames.map(frame => frame.textures)),
      peakGeometries: Math.max(0, ...frames.map(frame => frame.geometries)),
      drawingBuffer: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, dpr: renderer.getPixelRatio() },
      meaning: 'CPU is frame JS work through submission; interval is between submissions; GPU is timer-query time only when available. Texture/geometry values are resource counts, not memory bytes.' };
  }
  return {
    get enabled() { return enabled; },
    start() {
      this.stop(); session++; enabled = true; started = now(); previous = null; frames = []; gpu = []; resetCounters();
      hook('bufferData', args => { counters.bufferData++; counters.bufferBytes += bufferTransferBytes(args[1], args[3], args[4]); });
      hook('bufferSubData', args => { counters.bufferSubData++; counters.bufferBytes += bufferTransferBytes(args[2], args[3], args[4]); });
      for (const method of ['texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D']) hook(method, () => { counters.textureUploads++; });
      hook('generateMipmap', () => { counters.mipmapGenerations++; });
    },
    begin(activity, cpuStart) {
      if (!enabled || frames.length >= 10000) return null;
      poll();
      const query = timer && pending.length < 8 ? gl.createQuery() : null;
      if (query) gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
      return { activity, cpuStart, query, session };
    },
    end(token) {
      if (!token) return;
      if (token.query) { gl.endQuery(timer.TIME_ELAPSED_EXT); pending.push(token); }
      const current = now(), info = renderer.info;
      frames.push({ activity: token.activity, cpuMs: current - token.cpuStart,
        intervalMs: previous === null ? null : current - previous, calls: info.render.calls,
        triangles: info.render.triangles, textures: info.memory.textures, geometries: info.memory.geometries });
      previous = current;
    },
    report() { poll(); return report(); },
    stop() {
      poll();
      const result = report();
      enabled = false;
      for (const restore of restorers.splice(0)) restore();
      for (const item of pending.splice(0)) gl.deleteQuery(item.query);
      return result;
    },
  };
}
