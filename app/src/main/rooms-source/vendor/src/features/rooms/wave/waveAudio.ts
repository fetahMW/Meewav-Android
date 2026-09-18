// ============================================================================
// LA WAVE — moteur audio (parité iOS WaveHostLiveSetController +
// WaveLiveAudioEngine + WaveViewerStudioAudioEngine + PlaceVocalPluginConsole)
//
//  • LiveSetEngine : lancements quantifiés sur la mesure, repeat policy,
//    mute/solo (gains), stopAll, cue privé isolé.
//  • StudioEngine  : micro → chaîne FX (tune/eq/comp/reverb) → capture bornée
//    + count-in + review base/ensemble/stem.
//  • VocalChain    : traitement voix du Mix (console plugins).
//  • DeckPlayer    : lecteur de piste (progress/seek/loop range).
//  • SFX           : pads one-shot du soundboard.
// ============================================================================

import {
  WAVE_SESSION_BPM,
  WAVE_SESSION_BEATS_PER_BAR,
  barDuration,
  barAt,
  beatAt,
  nextBarLaunch,
  defaultRepeatFor,
  repeatTotalDuration,
  type WaveLiveClip,
  type WavePlaybackState,
  type WaveRepeatPolicy,
  type AutotuneSettings,
  type VocalPresetId,
  type StudioTakeBars,
  type StudioReviewMode,
} from "./waveData";

type ClipNodes = {
  gain: GainNode;
  source: AudioBufferSourceNode | null;
  repetitionsDone: number;
  launchTime: number; // ctx.currentTime du départ effectif
};

// ---------------------------------------------------------------------------
// Autotune — AudioWorklet pitch-corrector compact (détection autocorrélée +
// resample granulaire vers la note la plus proche de la gamme).
// ---------------------------------------------------------------------------

const AUTOTUNE_WORKLET = `
class TuneProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufSize = 2048;
    this.buf = new Float32Array(this.bufSize);
    this.bufPos = 0;
    this.keyMask = new Array(12).fill(1);
    this.amount = 0;
    this.speed = 0.6;
    this.phase = 0;
    this.port.onmessage = (e) => {
      const d = e.data;
      if (d.keyMask) this.keyMask = d.keyMask;
      if (d.amount !== undefined) this.amount = d.amount;
      if (d.speed !== undefined) this.speed = d.speed;
    };
  }
  detect(frame, sr) {
    // Autocorrélation simple
    let best = 0, bestLag = 0;
    const minLag = Math.floor(sr / 1000), maxLag = Math.floor(sr / 70);
    for (let lag = minLag; lag < maxLag; lag++) {
      let s = 0;
      for (let i = 0; i < frame.length - lag; i += 2) s += frame[i] * frame[i + lag];
      if (s > best) { best = s; bestLag = lag; }
    }
    return bestLag > 0 ? sr / bestLag : 0;
  }
  nearestScaleFreq(f) {
    if (f <= 0) return f;
    const midi = 69 + 12 * Math.log2(f / 440);
    let best = midi, bestDist = 99;
    for (let m = Math.floor(midi) - 2; m <= Math.ceil(midi) + 2; m++) {
      const pc = ((m % 12) + 12) % 12;
      if (!this.keyMask[pc]) continue;
      const d = Math.abs(m - midi);
      if (d < bestDist) { bestDist = d; best = m; }
    }
    return 440 * Math.pow(2, (best - 69) / 12);
  }
  process(inputs, outputs) {
    const input = inputs[0], output = outputs[0];
    if (!input || !input[0]) return true;
    const ch = input[0], out = output[0];
    for (let i = 0; i < ch.length; i++) {
      this.buf[this.bufPos] = ch[i];
      this.bufPos++;
      if (this.bufPos >= this.bufSize) {
        const f = this.detect(this.buf, sampleRate);
        const target = this.nearestScaleFreq(f);
        const ratio = f > 0 && target > 0 ? 1 + (target / f - 1) * this.amount : 1;
        this._ratio = this._ratio === undefined ? ratio : this._ratio + (ratio - this._ratio) * this.speed;
        this.bufPos = 0;
        this.phase = 0;
      }
      const r = this._ratio || 1;
      const idx = this.phase * r;
      const i0 = Math.floor(idx) % this.bufSize;
      const i1 = (i0 + 1) % this.bufSize;
      const frac = idx - Math.floor(idx);
      out[i] = this.buf[i0] * (1 - frac) + this.buf[i1] * frac;
      this.phase++;
      if (this.phase * r >= this.bufSize) this.phase = 0;
    }
    return true;
  }
}
registerProcessor('wave-tune', TuneProcessor);
`;

// ---------------------------------------------------------------------------
// Contexte partagé
// ---------------------------------------------------------------------------

let _ctx: AudioContext | null = null;
export const audioCtx = (): AudioContext => {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_ctx.state === "suspended") void _ctx.resume();
  return _ctx;
};

const bufferCache = new Map<string, Promise<AudioBuffer>>();

export const loadBuffer = (src: string): Promise<AudioBuffer> => {
  let p = bufferCache.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then((ab) => audioCtx().decodeAudioData(ab));
    bufferCache.set(src, p);
    p.catch(() => bufferCache.delete(src));
  }
  return p;
};

export const waveformOf = async (src: string, buckets = 48): Promise<number[]> => {
  const buf = await loadBuffer(src);
  const data = buf.getChannelData(0);
  const step = Math.floor(data.length / buckets);
  const out: number[] = [];
  for (let i = 0; i < buckets; i++) {
    let peak = 0;
    for (let j = i * step; j < Math.min((i + 1) * step, data.length); j += 64) {
      peak = Math.max(peak, Math.abs(data[j]));
    }
    out.push(Math.min(1, peak * 1.4));
  }
  return out;
};

// ---------------------------------------------------------------------------
// LiveSetEngine — clock + lanes quantifiées (WaveHostLiveSetController)
// ---------------------------------------------------------------------------

export interface LiveSetSnapshot {
  clockRunning: boolean;
  elapsed: number;
  bar: number;
  beat: number;
}

type LiveSetEvents = {
  onClipState?: (id: string, state: WavePlaybackState) => void;
  onTick?: (snap: LiveSetSnapshot) => void;
  onClockChange?: (running: boolean) => void;
};

class LiveSetEngine {
  private master: GainNode | null = null;
  private cueBus: GainNode | null = null;
  private clips = new Map<string, ClipNodes>();
  private buffers = new Map<string, AudioBuffer>();
  private origin: number | null = null; // ctx.currentTime de la mesure 1
  private timer: number | null = null;
  private events: LiveSetEvents = {};
  private cueSource: AudioBufferSourceNode | null = null;
  private cueGainNode: GainNode | null = null;
  private cueId: string | null = null;

  configure(events: LiveSetEvents) {
    this.events = events;
  }

  private bus(): GainNode {
    const ctx = audioCtx();
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);
    }
    return this.master;
  }

  private cue(): GainNode {
    const ctx = audioCtx();
    if (!this.cueBus) {
      this.cueBus = ctx.createGain();
      this.cueBus.gain.value = 1;
      this.cueBus.connect(ctx.destination);
    }
    return this.cueBus;
  }

  elapsed(): number {
    if (this.origin == null) return 0;
    return Math.max(0, audioCtx().currentTime - this.origin);
  }

  isClockRunning() {
    return this.origin != null;
  }

  /** Prépare le buffer d'un clip (état loading → ready). */
  async prepare(id: string, src: string): Promise<boolean> {
    try {
      const buf = await loadBuffer(src);
      this.buffers.set(id, buf);
      const ctx = audioCtx();
      const gain = ctx.createGain();
      gain.connect(this.bus());
      this.clips.set(id, { gain, source: null, repetitionsDone: 0, launchTime: 0 });
      return true;
    } catch {
      return false;
    }
  }

  /** Démarre la clock (toggleClock iOS : clock nil → start). */
  startClock() {
    const ctx = audioCtx();
    // origin légèrement dans le futur = pré-roll de la première mesure
    this.origin = ctx.currentTime + 0.08;
    this.runTimer();
    this.events.onClockChange?.(true);
  }

  /** stopAll iOS : clock nil + tous les clips repassent en ready. */
  stopAll(): string[] {
    this.origin = null;
    this.stopTimer();
    const ids: string[] = [];
    this.clips.forEach((nodes, id) => {
      if (nodes.source) {
        try { nodes.source.onended = null; nodes.source.stop(); } catch { /* noop */ }
        nodes.source = null;
      }
      ids.push(id);
    });
    this.events.onClockChange?.(false);
    return ids;
  }

  /** ready → lancement au prochain bord de mesure (queuedStart → playing). */
  queueLaunch(clip: WaveLiveClip): number | null {
    const nodes = this.clips.get(clip.descriptor.id);
    const buf = this.buffers.get(clip.descriptor.id);
    if (!nodes || !buf) return null;
    if (this.origin == null) this.startClock();
    const plan = nextBarLaunch(this.elapsed());
    const launchAt = this.origin! + (plan.bar - 1) * barDuration();
    nodes.launchTime = launchAt;

    const ctx = audioCtx();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const reps = clip.repeatPolicy;
    const isLoop = clip.descriptor.kind === "loop";
    src.loop = isLoop && reps === -1;
    nodes.source = src;
    nodes.repetitionsDone = 0;
    src.connect(nodes.gain);
    src.start(launchAt);

    // Répétitions bornées : une fin = ready ; ∞/actif = continue.
    const total = repeatTotalDuration(reps, buf.duration);
    src.onended = () => {
      if (nodes.source !== src) return;
      nodes.source = null;
      this.events.onClipState?.(clip.descriptor.id, { kind: "ready" });
    };
    if (total != null) {
      src.stop(launchAt + total);
    }

    // Transition queuedStart → playing au moment du lancement
    const ms = Math.max(0, (launchAt - ctx.currentTime) * 1000);
    window.setTimeout(() => {
      if (nodes.source === src) {
        this.events.onClipState?.(clip.descriptor.id, { kind: "playing" });
      }
    }, ms + 10);
    return plan.bar;
  }

  /** queued/playing → arrêt immédiat (retour ready). */
  stopClip(id: string) {
    const nodes = this.clips.get(id);
    if (!nodes?.source) return;
    try { nodes.source.onended = null; nodes.source.stop(); } catch { /* noop */ }
    nodes.source = null;
  }

  /** Mute/solo → resynchronisation des gains (isEffectivelyMuted iOS). */
  syncAudibility(clips: WaveLiveClip[]) {
    const hasSolo = clips.some((c) => c.isSolo);
    clips.forEach((c) => {
      const nodes = this.clips.get(c.descriptor.id);
      if (!nodes) return;
      const muted = c.isMuted || (hasSolo && !c.isSolo);
      nodes.gain.gain.setTargetAtTime(muted ? 0 : 1, audioCtx().currentTime, 0.015);
    });
  }

  /** Met à jour la politique de répétition d'un clip actif (iOS: updateRepeatPolicy). */
  updateActiveRepeat(clip: WaveLiveClip) {
    const nodes = this.clips.get(clip.descriptor.id);
    const buf = this.buffers.get(clip.descriptor.id);
    if (!nodes?.source || !buf) return;
    const total = repeatTotalDuration(clip.repeatPolicy, buf.duration);
    if (clip.descriptor.kind === "loop") {
      nodes.source.loop = clip.repeatPolicy === -1;
    }
    if (total != null) {
      try { nodes.source.stop(nodes.launchTime + total); } catch { /* noop */ }
    } else {
      try { nodes.source.stop(); } catch { /* noop */ } // annule la fin programmée
    }
  }

  releaseClip(id: string) {
    this.stopClip(id);
    const nodes = this.clips.get(id);
    if (nodes) {
      try { nodes.gain.disconnect(); } catch { /* noop */ }
    }
    this.clips.delete(id);
    this.buffers.delete(id);
  }

  /** Cue privé — bus séparé, jamais dans le programme (beginPrivateCue iOS). */
  async startCue(id: string, src: string): Promise<boolean> {
    this.stopCue();
    try {
      const buf = await loadBuffer(src);
      const ctx = audioCtx();
      const s = ctx.createBufferSource();
      const g = ctx.createGain();
      s.buffer = buf;
      s.connect(g);
      g.connect(this.cue());
      s.start();
      this.cueSource = s;
      this.cueGainNode = g;
      this.cueId = id;
      s.onended = () => {
        if (this.cueSource === s) this.clearCueNodes();
      };
      return true;
    } catch {
      return false;
    }
  }

  stopCue() {
    if (this.cueSource) {
      try { this.cueSource.onended = null; this.cueSource.stop(); } catch { /* noop */ }
    }
    this.clearCueNodes();
  }

  private clearCueNodes() {
    this.cueSource = null;
    this.cueId = null;
    if (this.cueGainNode) {
      try { this.cueGainNode.disconnect(); } catch { /* noop */ }
      this.cueGainNode = null;
    }
  }

  cueIdActive() {
    return this.cueId;
  }

  private runTimer() {
    this.stopTimer();
    this.timer = window.setInterval(() => {
      const el = this.elapsed();
      this.events.onTick?.({
        clockRunning: this.origin != null,
        elapsed: el,
        bar: barAt(el),
        beat: beatAt(el),
      });
    }, 120);
  }

  private stopTimer() {
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = null;
  }

  shutdown() {
    this.stopAll();
    this.stopCue();
    this.stopTimer();
  }
}

export const liveSet = new LiveSetEngine();

// ---------------------------------------------------------------------------
// Chaîne vocale — PlaceVocalPluginConsole (mic → tune/eq/comp/reverb → monit.)
// ---------------------------------------------------------------------------

const NOTE_MASKS: Record<string, number[]> = {
  chromatic: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

const scaleMask = (key: string, scale: string): number[] => {
  if (scale === "chromatic") return NOTE_MASKS.chromatic;
  const keyIndex = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"].indexOf(key);
  const minor = [0, 2, 3, 5, 7, 8, 10];
  const major = [0, 2, 4, 5, 7, 9, 11];
  const steps = scale === "minor" ? minor : major;
  const mask = new Array(12).fill(0);
  steps.forEach((s) => { mask[(keyIndex + s) % 12] = 1; });
  return mask;
};

export interface VocalChainNodes {
  input: MediaStreamAudioSourceNode;
  tune: AudioWorkletNode | null;
  eq: BiquadFilterNode;
  eqLow: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  reverb: ConvolverNode;
  reverbGain: GainNode;
  dry: GainNode;
  monitor: GainNode;
  analyser: AnalyserNode;
  out: GainNode;
}

const impulse = (ctx: BaseAudioContext, seconds = 1.6, decay = 2.4): AudioBuffer => {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
};

let workletReady: Promise<boolean> | null = null;
const ensureWorklet = (ctx: AudioContext): Promise<boolean> => {
  if (!workletReady) {
    const url = URL.createObjectURL(new Blob([AUTOTUNE_WORKLET], { type: "application/javascript" }));
    workletReady = ctx.audioWorklet
      .addModule(url)
      .then(() => true)
      .catch(() => false);
  }
  return workletReady;
};

class VocalChain {
  nodes: VocalChainNodes | null = null;
  private stream: MediaStream | null = null;
  settings: AutotuneSettings | null = null;
  enabled: Record<string, boolean> = { tune: true, reverb: true, eq: true, comp: true };

  async start(stream?: MediaStream): Promise<boolean> {
    if (this.nodes) return true;
    const ctx = audioCtx();
    try {
      this.stream = stream ?? (await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      }));
    } catch {
      return false;
    }
    const input = ctx.createMediaStreamSource(this.stream);
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = "highpass";
    eqLow.frequency.value = 80;
    const eq = ctx.createBiquadFilter();
    eq.type = "peaking";
    eq.frequency.value = 3200;
    eq.gain.value = 2;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 18;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.18;
    const dry = ctx.createGain();
    dry.gain.value = 1;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const out = ctx.createGain();
    out.gain.value = 1;
    const monitor = ctx.createGain();
    monitor.gain.value = 0; // RETOUR coupé par défaut

    let tune: AudioWorkletNode | null = null;
    if (await ensureWorklet(ctx)) {
      tune = new AudioWorkletNode(ctx, "wave-tune");
    }

    // Chaîne : input → tune? → eqLow → eq → comp → dry → out
    //                                      ↘ reverb → reverbGain ↗
    let head: AudioNode = input;
    if (tune) {
      input.connect(tune);
      head = tune;
    }
    head.connect(eqLow);
    eqLow.connect(eq);
    eq.connect(comp);
    comp.connect(dry);
    comp.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(out);
    dry.connect(out);
    out.connect(analyser);
    out.connect(monitor);
    monitor.connect(ctx.destination);

    this.nodes = { input, tune, eq, eqLow, comp, reverb, reverbGain, dry, monitor, analyser, out };
    if (this.settings) this.applyAutotune(this.settings);
    this.applyEnabled();
    return true;
  }

  applyAutotune(s: AutotuneSettings) {
    this.settings = s;
    const tune = this.nodes?.tune;
    if (!tune) return;
    const speedMap = { subtle: 0.25, medium: 0.55, extreme: 0.92 } as const;
    tune.port.postMessage({
      keyMask: scaleMask(s.key, s.scale),
      amount: s.intensity,
      speed: speedMap[s.speed] * (s.clamp === "tight" ? 1.2 : s.clamp === "off" ? 0.6 : 1),
    });
  }

  applyEnabled() {
    const n = this.nodes;
    if (!n) return;
    n.tune?.parameters.get("amount");
    // EQ/comp/reverb se règlent en gain, Tune en amount
    if (n.tune && this.settings) {
      n.tune.port.postMessage({ amount: this.enabled.tune ? this.settings.intensity : 0 });
    }
    n.eq.gain.value = this.enabled.eq ? 2 : 0;
    n.comp.ratio.value = this.enabled.comp ? 4 : 1;
    n.reverbGain.gain.value = this.enabled.reverb ? 0.18 : 0;
  }

  setEffectEnabled(kind: string, on: boolean) {
    this.enabled[kind] = on;
    this.applyEnabled();
  }

  setPreset(preset: VocalPresetId) {
    const map: Record<VocalPresetId, Record<string, boolean>> = {
      clean: { tune: false, reverb: false, eq: true, comp: true },
      warm: { tune: false, reverb: true, eq: true, comp: true },
      rap: { tune: false, reverb: false, eq: true, comp: true },
      trap: { tune: true, reverb: true, eq: true, comp: true },
      radio: { tune: false, reverb: true, eq: true, comp: true },
    };
    this.enabled = { ...this.enabled, ...map[preset] };
    this.applyEnabled();
  }

  setMonitoring(on: boolean) {
    if (this.nodes) this.nodes.monitor.gain.value = on ? 0.9 : 0;
  }

  level(): number {
    const n = this.nodes;
    if (!n) return 0;
    const data = new Uint8Array(n.analyser.frequencyBinCount);
    n.analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
    return peak;
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.nodes = null;
  }
}

export const vocalChain = new VocalChain();

// ---------------------------------------------------------------------------
// StudioEngine — WaveViewerStudioAudioEngine (local, privé, hors RTC)
// ---------------------------------------------------------------------------

type StudioEvents = {
  onPhase?: (phase: string) => void;
  onProgress?: (elapsed: number, total: number) => void;
  onRecorded?: (blob: Blob, duration: number) => void;
  onReviewEnded?: () => void;
};

class StudioEngine {
  private events: StudioEvents = {};
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private countInTimer: number | null = null;
  private progressTimer: number | null = null;
  private baseSource: AudioBufferSourceNode | null = null;
  private takeSource: AudioBufferSourceNode | null = null;
  private busNode: GainNode | null = null;
  takeBuffer: AudioBuffer | null = null;

  configure(events: StudioEvents) {
    this.events = events;
  }

  private bus(): GainNode {
    const ctx = audioCtx();
    if (!this.busNode) {
      this.busNode = ctx.createGain();
      this.busNode.gain.value = 1;
      this.busNode.connect(ctx.destination);
    }
    return this.busNode;
  }

  /** Count-in d'une mesure (4 clics) puis capture bornée `bars` mesures. */
  async record(bars: StudioTakeBars, preset: VocalPresetId, monitoring: boolean): Promise<boolean> {
    const ok = await vocalChain.start();
    if (!ok) return false;
    vocalChain.setPreset(preset);
    vocalChain.setMonitoring(monitoring);

    const ctx = audioCtx();
    const stream = ctx.createMediaStreamDestination();
    if (vocalChain.nodes) {
      try { vocalChain.nodes.out.connect(stream); } catch { /* noop */ }
    }
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/mp4";
    this.recorder = new MediaRecorder(stream.stream, { mimeType: mime });
    this.chunks = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.recorder.onstop = async () => {
      const blob = new Blob(this.chunks, { type: mime });
      try {
        const ab = await blob.arrayBuffer();
        this.takeBuffer = await audioCtx().decodeAudioData(ab);
      } catch {
        this.takeBuffer = null;
      }
      this.events.onRecorded?.(blob, this.takeBuffer?.duration ?? bars * barDuration());
    };

    // Count-in : 4 temps sur la mesure de pré-roll
    this.events.onPhase?.("countIn");
    const beat = 60 / WAVE_SESSION_BPM;
    let step = 0;
    const click = (accent: boolean) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = accent ? 1568 : 1046;
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.1);
    };
    return await new Promise<boolean>((resolve) => {
      const tickIn = () => {
        click(step === 0);
        step++;
        if (step < WAVE_SESSION_BEATS_PER_BAR) {
          this.countInTimer = window.setTimeout(tickIn, beat * 1000);
        } else {
          this.events.onPhase?.("recording");
          this.recorder!.start(120);
          const total = bars * barDuration();
          const t0 = performance.now();
          this.progressTimer = window.setInterval(() => {
            const el = (performance.now() - t0) / 1000;
            this.events.onProgress?.(el, total);
            if (el >= total) this.stopRecording();
          }, 100);
          resolve(true);
        }
      };
      tickIn();
    });
  }

  stopRecording() {
    if (this.progressTimer != null) window.clearInterval(this.progressTimer);
    this.progressTimer = null;
    if (this.recorder && this.recorder.state !== "inactive") {
      this.events.onPhase?.("rendering");
      this.recorder.stop();
    }
  }

  cancelRecording() {
    if (this.countInTimer != null) window.clearTimeout(this.countInTimer);
    this.countInTimer = null;
    if (this.progressTimer != null) window.clearInterval(this.progressTimer);
    this.progressTimer = null;
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.onstop = null;
      this.recorder.stop();
    }
    this.recorder = null;
  }

  /** Review : baseOnly / ensemble / takeOnly — rendu local privé. */
  async playReview(mode: StudioReviewMode, baseSrc: string): Promise<boolean> {
    this.stopReview();
    const ctx = audioCtx();
    try {
      if (mode !== "takeOnly") {
        const base = await loadBuffer(baseSrc);
        const s = ctx.createBufferSource();
        s.buffer = base;
        s.connect(this.bus());
        s.start();
        this.baseSource = s;
      }
      if (mode !== "baseOnly" && this.takeBuffer) {
        const s = ctx.createBufferSource();
        s.buffer = this.takeBuffer;
        s.connect(this.bus());
        s.start();
        this.takeSource = s;
        s.onended = () => this.events.onReviewEnded?.();
      }
      return true;
    } catch {
      return false;
    }
  }

  stopReview() {
    [this.baseSource, this.takeSource].forEach((s) => {
      if (s) { try { s.onended = null; s.stop(); } catch { /* noop */ } }
    });
    this.baseSource = null;
    this.takeSource = null;
  }

  playBaseOnce(baseSrc: string) {
    void this.playReview("baseOnly", baseSrc);
  }

  shutdown() {
    this.cancelRecording();
    this.stopReview();
    vocalChain.setMonitoring(false);
  }
}

export const studio = new StudioEngine();

// ---------------------------------------------------------------------------
// DeckPlayer — lecteur de piste du Mix (progress, seek, loop range)
// ---------------------------------------------------------------------------

type DeckEvents = {
  onProgress?: (ratio: number, seconds: number) => void;
  onEnded?: () => void;
};

class DeckPlayer {
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private startCtx = 0;
  private offset = 0;
  private timer: number | null = null;
  private loopRange: { start: number; end: number } | null = null;
  private events: DeckEvents = {};
  playing = false;

  configure(events: DeckEvents) {
    this.events = events;
  }

  async load(src: string): Promise<number> {
    this.buffer = await loadBuffer(src);
    return this.buffer.duration;
  }

  duration() {
    return this.buffer?.duration ?? 0;
  }

  play() {
    if (!this.buffer || this.playing) return;
    const ctx = audioCtx();
    this.gain = ctx.createGain();
    this.gain.connect(ctx.destination);
    const s = ctx.createBufferSource();
    s.buffer = this.buffer;
    s.connect(this.gain);
    const dur = this.buffer.duration;
    s.start(0, this.offset % dur);
    this.startCtx = ctx.currentTime;
    this.source = s;
    this.playing = true;
    s.onended = () => {
      if (this.source === s) this.pauseInternal(true);
    };
    this.timer = window.setInterval(() => this.tick(), 120);
  }

  private position(): number {
    if (!this.playing || !this.buffer) return this.offset;
    return (this.offset + audioCtx().currentTime - this.startCtx) % this.buffer.duration;
  }

  private tick() {
    const pos = this.position();
    if (this.loopRange && pos >= this.loopRange.end) {
      this.seek(this.loopRange.start);
      return;
    }
    this.events.onProgress?.(this.buffer ? pos / this.buffer.duration : 0, pos);
  }

  pause() {
    this.offset = this.position();
    this.pauseInternal(false);
  }

  private pauseInternal(ended: boolean) {
    if (this.source) {
      try { this.source.onended = null; this.source.stop(); } catch { /* noop */ }
      this.source = null;
    }
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = null;
    this.playing = false;
    if (ended) {
      this.offset = 0;
      this.events.onEnded?.();
    }
  }

  seek(ratio: number) {
    const was = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(1, ratio)) * (this.buffer?.duration ?? 0);
    if (was) this.play();
    else this.events.onProgress?.(ratio, this.offset);
  }

  setLoopRange(range: { start: number; end: number } | null) {
    this.loopRange = range;
  }

  stop() {
    this.pause();
    this.offset = 0;
  }
}

export const deck = new DeckPlayer();

// ---------------------------------------------------------------------------
// SFX — soundboard one-shots
// ---------------------------------------------------------------------------

export const playSfx = async (src: string): Promise<boolean> => {
  try {
    const buf = await loadBuffer(src);
    const ctx = audioCtx();
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = 0.9;
    s.buffer = buf;
    s.connect(g);
    g.connect(ctx.destination);
    s.start();
    return true;
  } catch {
    return false;
  }
};
