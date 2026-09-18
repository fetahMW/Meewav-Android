// ============================================================================
// LA WAVE — onglet Mix (parité iOS WaveMixerView + WaveVocalEffectsPanel +
// PlaceChannelStrip + WaveMixerDeckPlayer + soundboard)
//
// Page Traitement : strips MIC/AUDIO alignés sous les icônes Chat/Mix ·
// colonne FX VOIX (Tune/Réverb/EQ/Comp + réglages) · deck 40% en bas.
// Page Live : soundboard SFX + volume.
// Console Simple = presets · Pro = chaîne par effet avec fiches de réglages.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AudioWaveform,
  Check,
  ChevronDown,
  ChevronRight,
  Headphones,
  Layers,
  Loader2,
  Mic,
  MicOff,
  Music2,
  Play,
  Power,
  Repeat,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Square,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { deck, loadBuffer, playSfx, vocalChain, waveformOf } from "./waveAudio";
import {
  AUTOTUNE_CLAMPS,
  AUTOTUNE_KEYS,
  AUTOTUNE_RANGES,
  AUTOTUNE_SCALES,
  AUTOTUNE_SPEEDS,
  DEFAULT_AUTOTUNE,
  EFFECT_KIND_COLOR,
  EFFECT_KIND_LABEL,
  SFX_PADS,
  VOCAL_PRESETS,
  type AutotuneSettings,
  type MixChannel,
  type VocalEffectKind,
  type VocalPresetId,
} from "./waveData";

// ---------------------------------------------------------------------------
// Strip de canal — PlaceChannelStrip (meter, fader verticale, mute)
// ---------------------------------------------------------------------------

function ChannelStrip({
  channel,
  level,
  onMute,
  onGain,
}: {
  channel: MixChannel;
  level: number;
  onMute: () => void;
  onGain: (v: number) => void;
}) {
  const faderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const isMic = channel.kind === "mic";

  const setFromY = useCallback(
    (clientY: number) => {
      const el = faderRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ratio = 1 - Math.min(Math.max((clientY - r.top) / r.height, 0), 1);
      onGain(Math.round(ratio * 100) / 100);
    },
    [onGain],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setFromY(e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) setFromY(e.clientY);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const MuteIcon = isMic ? (channel.muted ? MicOff : Mic) : channel.muted ? VolumeX : Volume2;

  return (
    <div className={`wvm-strip${channel.muted ? " is-muted" : ""}`}>
      <div className="wvm-strip-head">
        {isMic ? <Mic size={11} strokeWidth={2.4} /> : <Music2 size={11} strokeWidth={2.4} />}
        <span>{isMic ? "Micro" : "Audio"}</span>
      </div>
      <div className="wvm-strip-body">
        <div
          ref={faderRef}
          className="wvm-fader"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(channel.gain * 100)}
          aria-label={`Volume ${isMic ? "Micro" : "Audio"}`}
        >
          <div className="wvm-fader-track">
            <div className="wvm-fader-fill" style={{ height: `${channel.gain * 100}%` }} />
          </div>
          <div className="wvm-fader-thumb" style={{ bottom: `${channel.gain * 100}%` }} />
        </div>
      </div>
      <button
        className={`wvm-strip-mute${channel.muted ? " is-on" : ""}`}
        onClick={onMute}
        aria-label={channel.muted ? `Réactiver ${isMic ? "Micro" : "Audio"}` : `Couper ${isMic ? "Micro" : "Audio"}`}
      >
        <MuteIcon size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carte effet — WaveVocalEffectCard (toggle + bouton réglages)
// ---------------------------------------------------------------------------

const EFFECT_ICONS: Record<VocalEffectKind, React.ReactNode> = {
  tune: <Activity size={13} strokeWidth={2.6} />,
  reverb: <AudioWaveform size={13} strokeWidth={2.6} />,
  eq: <SlidersHorizontal size={13} strokeWidth={2.6} />,
  comp: <Zap size={13} strokeWidth={2.6} />,
  delay: <Repeat size={13} strokeWidth={2.6} />,
  limiter: <Volume2 size={13} strokeWidth={2.6} />,
};

// ---------------------------------------------------------------------------
// Carte effet Simple — simpleEffectCard : en-tête (dot+icône+titre+power) + slot
// ---------------------------------------------------------------------------

function SimpleEffectCard({
  title,
  icon,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`wvm-simple-card${enabled ? " is-on" : ""}`}>
      <div className="wvm-simple-card-head">
        <span className="wvm-simple-dot" />
        <span className="wvm-simple-icon">{icon}</span>
        <span className="wvm-simple-title">{title}</span>
        <button
          className={`wvm-simple-power${enabled ? " is-on" : ""}`}
          onClick={onToggle}
          aria-label={enabled ? `Désactiver ${title}` : `Activer ${title}`}
        >
          <Power size={10} strokeWidth={2.8} />
        </button>
      </div>
      <div className="wvm-simple-card-body">{children}</div>
    </div>
  );
}

// Champ sélecteur — simpleTuneSelectorField : label au-dessus + boîte valeur/chevron
function TuneSelectorField({
  title,
  value,
  onOpen,
}: {
  title: string;
  value: string;
  onOpen: () => void;
}) {
  return (
    <div className="wvm-tune-field">
      <span className="wvm-tune-field-label">{title}</span>
      <button className="wvm-tune-field-box" onClick={onOpen}>
        <span className="wvm-tune-field-value">{value}</span>
        <ChevronDown size={10} strokeWidth={2.8} />
      </button>
    </div>
  );
}

// Slider espace réverb — StudioReverbSpaceSlider : Douce → Large
function ReverbSpaceSlider({
  value,
  enabled,
  onChange,
}: {
  value: number;
  enabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className={`wvm-reverb${enabled ? "" : " is-off"}`}>
      <div className="wvm-reverb-labels">
        <span style={{ opacity: 0.38 + (1 - value) * 0.5 }}>Douce</span>
        <span style={{ opacity: 0.38 + value * 0.5 }}>Large</span>
      </div>
      <div className="wvm-reverb-track">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label="Espace de réverbération"
        />
        <div className="wvm-reverb-fill" style={{ width: `${value * 100}%` }} />
        <div className="wvm-reverb-knob" style={{ left: `${value * 100}%` }} />
      </div>
    </div>
  );
}

// Panneau sélecteur Simple — simpleSelectorPanel : clé (grille) / gamme (liste)
function SimpleSelectorPanel({
  selector,
  autotune,
  onPick,
  onClose,
}: {
  selector: "key" | "scale";
  autotune: AutotuneSettings;
  onPick: (s: AutotuneSettings) => void;
  onClose: () => void;
}) {
  return (
    <div className="wvm-selector">
      <div className="wvm-selector-head">
        <Music2 size={12} strokeWidth={2.6} className="wvm-selector-icon" />
        <span className="wvm-selector-title">
          {selector === "key" ? "Choisir la clé" : "Choisir la gamme"}
        </span>
        <button className="wvm-selector-close" onClick={onClose} aria-label="Fermer">
          <X size={10} strokeWidth={2.8} />
        </button>
      </div>
      {selector === "key" ? (
        <div className="wvm-selector-grid">
          {AUTOTUNE_KEYS.map((k) => (
            <button
              key={k}
              className={`wvm-selector-btn${autotune.key === k ? " is-active" : ""}`}
              onClick={() => onPick({ ...autotune, key: k })}
            >
              {k}
            </button>
          ))}
        </div>
      ) : (
        <div className="wvm-selector-list">
          {AUTOTUNE_SCALES.map((s) => (
            <button
              key={s.id}
              className={`wvm-selector-btn wvm-selector-btn--wide${autotune.scale === s.id ? " is-active" : ""}`}
              onClick={() => onPick({ ...autotune, scale: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EffectCard({
  kind,
  enabled,
  onToggle,
  onSettings,
}: {
  kind: VocalEffectKind;
  enabled: boolean;
  onToggle: () => void;
  onSettings: () => void;
}) {
  const color = EFFECT_KIND_COLOR[kind];
  return (
    <div className={`wvm-fx-card${enabled ? " is-on" : ""}`} style={{ ["--fx" as string]: color }}>
      <button className="wvm-fx-toggle" onClick={onToggle}>
        <span className="wvm-fx-icon">{EFFECT_ICONS[kind]}</span>
        <span className="wvm-fx-name">{EFFECT_KIND_LABEL[kind].toUpperCase()}</span>
        <span className="wvm-fx-dot" />
      </button>
      <button className="wvm-fx-settings" onClick={onSettings} aria-label={`Réglages ${EFFECT_KIND_LABEL[kind]}`}>
        <SlidersHorizontal size={12} strokeWidth={2.6} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fiche réglages d'effet — WaveVocalEffectDetailSheet (autotune complet)
// ---------------------------------------------------------------------------

function AutotuneEditor({
  settings,
  onChange,
}: {
  settings: AutotuneSettings;
  onChange: (s: AutotuneSettings) => void;
}) {
  return (
    <div className="wvm-tune">
      <div className="wvm-tune-row">
        <span className="wvm-tune-label">Clé</span>
        <div className="wvm-keys">
          {AUTOTUNE_KEYS.map((k) => (
            <button
              key={k}
              className={`wvm-key${settings.key === k ? " is-active" : ""}`}
              onClick={() => onChange({ ...settings, key: k })}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="wvm-tune-row">
        <span className="wvm-tune-label">Gamme</span>
        <div className="wvs-seg">
          {AUTOTUNE_SCALES.map((s) => (
            <button
              key={s.id}
              className={`wvs-seg-btn${settings.scale === s.id ? " is-active" : ""}`}
              onClick={() => onChange({ ...settings, scale: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="wvm-tune-row">
        <span className="wvm-tune-label">Registre</span>
        <div className="wvs-seg">
          {AUTOTUNE_RANGES.map((r) => (
            <button
              key={r.id}
              className={`wvs-seg-btn${settings.range === r.id ? " is-active" : ""}`}
              onClick={() => onChange({ ...settings, range: r.id })}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="wvm-tune-row">
        <span className="wvm-tune-label">Vitesse</span>
        <div className="wvs-seg">
          {AUTOTUNE_SPEEDS.map((s) => (
            <button
              key={s.id}
              className={`wvs-seg-btn${settings.speed === s.id ? " is-active" : ""}`}
              onClick={() => onChange({ ...settings, speed: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="wvm-tune-row">
        <span className="wvm-tune-label">Clamp</span>
        <div className="wvs-seg">
          {AUTOTUNE_CLAMPS.map((c) => (
            <button
              key={c.id}
              className={`wvs-seg-btn${settings.clamp === c.id ? " is-active" : ""}`}
              onClick={() => onChange({ ...settings, clamp: c.id })}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="wvm-tune-slider">
        <div className="wvm-tune-slider-head">
          <span>Intensité</span>
          <span>{Math.round(settings.intensity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.intensity * 100)}
          onChange={(e) => onChange({ ...settings, intensity: Number(e.target.value) / 100 })}
        />
      </div>
      <div className="wvm-tune-slider">
        <div className="wvm-tune-slider-head">
          <span>Retune</span>
          <span>{Math.round(settings.retune * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.retune * 100)}
          onChange={(e) => onChange({ ...settings, retune: Number(e.target.value) / 100 })}
        />
      </div>
      <div className="wvm-tune-row">
        <span className="wvm-tune-label">La (A)</span>
        <span className="wvm-tune-value">{settings.frequencyA} Hz</span>
      </div>
    </div>
  );
}

function EffectSheet({
  kind,
  enabled,
  autotune,
  onToggle,
  onAutotune,
  onClose,
}: {
  kind: VocalEffectKind;
  enabled: boolean;
  autotune: AutotuneSettings;
  onToggle: () => void;
  onAutotune: (s: AutotuneSettings) => void;
  onClose: () => void;
}) {
  const color = EFFECT_KIND_COLOR[kind];
  return (
    <div className="wvh-sheet-overlay" onClick={onClose}>
      <div className="wvm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="wvm-sheet-head">
          <span className="wvm-sheet-icon" style={{ color, background: `${color}24` }}>
            {EFFECT_ICONS[kind]}
          </span>
          <div className="wvm-sheet-meta">
            <span className="wvm-sheet-title">{EFFECT_KIND_LABEL[kind].toUpperCase()}</span>
            <span className="wvm-sheet-sub">RÉGLAGES VOIX</span>
          </div>
          <button className="wvh-sheet-close" onClick={onClose} aria-label="Fermer">
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <button className={`wvm-sheet-enable${enabled ? " is-on" : ""}`} onClick={onToggle}>
          <div>
            <span className="wvm-sheet-enable-title">{enabled ? "EFFET ACTIF" : "EFFET INACTIF"}</span>
            <span className="wvm-sheet-enable-sub">
              {enabled
                ? "Ce traitement est appliqué à ta voix."
                : "Active-le pour l'entendre dans la chaîne voix."}
            </span>
          </div>
          <span className={`wvm-switch${enabled ? " is-on" : ""}`} />
        </button>

        {kind === "tune" ? (
          <AutotuneEditor settings={autotune} onChange={onAutotune} />
        ) : (
          <div className="wvm-generic-params">
            {kind === "reverb" && (
              <>
                <div className="wvm-tune-slider">
                  <div className="wvm-tune-slider-head"><span>Espace</span><span>18%</span></div>
                  <input type="range" defaultValue={18} />
                </div>
                <div className="wvm-tune-row">
                  <span className="wvm-tune-label">Taille</span>
                  <div className="wvs-seg">
                    <button className="wvs-seg-btn is-active">Douce</button>
                    <button className="wvs-seg-btn">Large</button>
                  </div>
                </div>
              </>
            )}
            {kind === "eq" && (
              <>
                <div className="wvm-tune-slider"><div className="wvm-tune-slider-head"><span>Présence 3,2 kHz</span><span>+2 dB</span></div><input type="range" defaultValue={60} /></div>
                <div className="wvm-tune-slider"><div className="wvm-tune-slider-head"><span>Grave 120 Hz</span><span>0 dB</span></div><input type="range" defaultValue={50} /></div>
              </>
            )}
            {kind === "comp" && (
              <>
                <div className="wvm-tune-slider"><div className="wvm-tune-slider-head"><span>Seuil</span><span>-24 dB</span></div><input type="range" defaultValue={40} /></div>
                <div className="wvm-tune-slider"><div className="wvm-tune-slider-head"><span>Ratio</span><span>4:1</span></div><input type="range" defaultValue={45} /></div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deck player — WaveMixerDeckPlayer (waveform + play + loop)
// ---------------------------------------------------------------------------

function DeckPlayer({ baseSrc, baseTitle }: { baseSrc: string; baseTitle: string }) {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loopOn, setLoopOn] = useState(true);
  const [prive, setPrive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deck.configure({
      onProgress: (ratio) => setProgress(ratio),
      onEnded: () => setPlaying(false),
    });
    void deck.load(baseSrc).then(() => {
      setLoading(false);
      deck.setLoopRange({ start: 0, end: 0.99 });
    });
    void waveformOf(baseSrc, 56).then(setWaveform).catch(() => setWaveform([]));
    return () => deck.stop();
  }, [baseSrc]);

  const toggle = () => {
    if (playing) {
      deck.pause();
      setPlaying(false);
    } else {
      deck.play();
      setPlaying(true);
    }
  };

  const seekAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    deck.seek((e.clientX - r.left) / r.width);
  };

  const seconds = progress * deck.duration();
  const hasTrack = !loading && waveform.length > 0;

  return (
    <div className="wvm-deck">
      <div className="wvm-deck-transport">
        <button
          className={`wvm-tr-prive${prive ? " is-on" : ""}`}
          onClick={() => setPrive((p) => !p)}
          aria-label="Écoute privée"
        >
          Privé
        </button>
        <button
          className={`wvm-tr-btn${loopOn ? " is-on" : ""}`}
          onClick={() => {
            const next = !loopOn;
            setLoopOn(next);
            deck.setLoopRange(next ? { start: 0, end: 0.99 } : null);
          }}
          aria-label="Lecture en boucle"
        >
          <Repeat size={13} strokeWidth={2.5} />
        </button>
        <button className="wvm-tr-btn" onClick={() => deck.seek(0)} aria-label="Début">
          <SkipBack size={14} strokeWidth={2.5} />
        </button>
        <button className="wvm-tr-btn wvm-tr-btn--play" onClick={toggle} disabled={loading} aria-label={playing ? "Pause" : "Lecture"}>
          {loading ? <Loader2 size={15} className="wv-spin" /> : playing ? <Square size={13} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>
        <button className="wvm-tr-btn" onClick={() => deck.seek(0.999)} aria-label="Fin">
          <SkipForward size={14} strokeWidth={2.5} />
        </button>
        <button className="wvm-tr-btn" aria-label="Importer un audio">
          <Upload size={13} strokeWidth={2.5} />
        </button>
        <button className="wvm-tr-btn" aria-label="Multipiste">
          <Layers size={13} strokeWidth={2.5} />
        </button>
      </div>
      <span className="wvm-deck-label">Piste principale</span>
      <div className="wvm-deck-lane" onPointerDown={hasTrack ? seekAt : undefined}>
        {hasTrack ? (
          <>
            {waveform.map((v, i) => {
              const filled = i / waveform.length <= progress;
              return (
                <span
                  key={i}
                  className={`wvm-deck-bar${filled ? " is-filled" : ""}`}
                  style={{ height: `${Math.max(10, v * 100)}%` }}
                />
              );
            })}
            <div className="wvm-deck-playhead" style={{ left: `${progress * 100}%` }} />
          </>
        ) : (
          <span className="wvm-deck-import">
            <Upload size={13} strokeWidth={2.5} />
            Importer un audio
          </span>
        )}
      </div>
      <div className="wvm-deck-foot">
        <span className="wvm-deck-time">
          {seconds.toFixed(1)}s / {deck.duration().toFixed(1)}s
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Soundboard — page Live
// ---------------------------------------------------------------------------

function SoundboardPage() {
  const [volume, setVolume] = useState(0.72);
  const [hit, setHit] = useState<string | null>(null);
  return (
    <div className="wvm-live">
      <div className="wvm-live-head">
        <span className="wvm-live-title">LIVE</span>
        <span className="wvm-live-sub">LA WAVE</span>
      </div>
      <div className="wvm-board">
        <div className="wvm-pads">
          {SFX_PADS.map((pad) => (
            <button
              key={pad.id}
              className={`wvm-pad${hit === pad.id ? " is-hit" : ""}`}
              style={{ ["--pad" as string]: pad.tint }}
              onClick={() => {
                void playSfx(pad.src);
                setHit(pad.id);
                window.setTimeout(() => setHit((h) => (h === pad.id ? null : h)), 260);
              }}
            >
              <Zap size={16} strokeWidth={2.4} />
              <span>{pad.label}</span>
            </button>
          ))}
        </div>
        <div className="wvm-board-volume">
          <Volume2 size={13} strokeWidth={2.5} />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            aria-label="Volume soundboard"
          />
          <span>{Math.round(volume * 100)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mix principal
// ---------------------------------------------------------------------------

type ConsoleMode = "simple" | "pro";

export default function WaveMixer({
  isViewer,
  baseSrc,
  baseTitle,
}: {
  isViewer: boolean;
  baseSrc: string;
  baseTitle: string;
}) {
  const [page, setPage] = useState<0 | 1>(0);
  const [channels, setChannels] = useState<MixChannel[]>([
    { id: "mic", label: "MIC", kind: "mic", gain: 0.78, muted: false },
    { id: "audio", label: "AUDIO", kind: "audio", gain: 0.86, muted: false },
  ]);
  const [micLevel, setMicLevel] = useState(0);
  const [monitoring, setMonitoring] = useState(false);
  const [preset, setPreset] = useState<VocalPresetId>("clean");
  const [mode, setMode] = useState<ConsoleMode>("simple");
  const [enabledFx, setEnabledFx] = useState<Set<VocalEffectKind>>(new Set(["eq", "comp"]));
  const [autotune, setAutotune] = useState<AutotuneSettings>(DEFAULT_AUTOTUNE);
  const [reverbSpace, setReverbSpace] = useState(0.35);
  const [simpleSelector, setSimpleSelector] = useState<"key" | "scale" | null>(null);
  const [editingFx, setEditingFx] = useState<VocalEffectKind | null>(null);
  const [presetPicker, setPresetPicker] = useState(false);
  const [micReady, setMicReady] = useState<boolean | null>(null);
  const meterTimer = useRef<number | null>(null);

  // Démarre la chaîne voix au premier usage du micro (toggle monitoring ou fx)
  const ensureMic = useCallback(async () => {
    if (micReady) return true;
    const ok = await vocalChain.start();
    setMicReady(ok);
    if (ok) {
      vocalChain.applyAutotune(autotune);
      meterTimer.current = window.setInterval(() => setMicLevel(vocalChain.level()), 90);
    }
    return ok;
  }, [micReady, autotune]);

  useEffect(() => {
    return () => {
      if (meterTimer.current) window.clearInterval(meterTimer.current);
    };
  }, []);

  const toggleMonitoring = async () => {
    if (!monitoring && !(await ensureMic())) return;
    const next = !monitoring;
    setMonitoring(next);
    vocalChain.setMonitoring(next);
  };

  const toggleFx = (kind: VocalEffectKind) => {
    setEnabledFx((set) => {
      const next = new Set(set);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      vocalChain.setEffectEnabled(kind, next.has(kind));
      return next;
    });
  };

  const applyPreset = (id: VocalPresetId) => {
    setPreset(id);
    const p = VOCAL_PRESETS.find((v) => v.id === id);
    if (p) {
      setEnabledFx(new Set(p.effects));
      p.effects.forEach((k) => vocalChain.setEffectEnabled(k, true));
      ["tune", "reverb", "eq", "comp"].forEach((k) => {
        if (!p.effects.includes(k as VocalEffectKind)) vocalChain.setEffectEnabled(k, false);
      });
      vocalChain.setPreset(id);
    }
    setPresetPicker(false);
  };

  const updateAutotune = (s: AutotuneSettings) => {
    setAutotune(s);
    vocalChain.applyAutotune(s);
  };

  const audioLevel = channels[1].muted ? 0 : channels[1].gain * (deck.playing ? 0.7 : 0.15);

  return (
    <div className="wvm">
      {page === 0 ? (
        <div className="wvm-page wvm-page--treatment">
          <div className="wvm-treatment">
            <div className="wvm-strips">
              <ChannelStrip
                channel={channels[0]}
                level={micLevel}
                onMute={() =>
                  setChannels(([m, a]) => [{ ...m, muted: !m.muted }, a])
                }
                onGain={(v) => setChannels(([m, a]) => [{ ...m, gain: v }, a])}
              />
              <ChannelStrip
                channel={channels[1]}
                level={audioLevel}
                onMute={() =>
                  setChannels(([m, a]) => [m, { ...a, muted: !a.muted }])
                }
                onGain={(v) => setChannels(([m, a]) => [m, { ...a, gain: v }])}
              />
            </div>
            <div className="wvm-divider" />
            <div className="wvm-fx">
              <div className="wvm-fx-util">
                <div className="wvm-mode">
                  {(["simple", "pro"] as ConsoleMode[]).map((m) => (
                    <button
                      key={m}
                      className={`wvm-mode-btn${mode === m ? " is-active" : ""}`}
                      onClick={() => setMode(m)}
                    >
                      {m === "simple" ? "Simple" : "Pro"}
                    </button>
                  ))}
                </div>
                <button
                  className={`wvm-util${monitoring ? " is-on" : ""}`}
                  onClick={toggleMonitoring}
                  aria-label="Retour micro"
                >
                  <Headphones size={13} strokeWidth={2.4} />
                </button>
              </div>
              {mode === "simple" ? (
                <div className="wvm-simple">
                  <SimpleEffectCard
                    title="Autotune"
                    icon={<Activity size={11} strokeWidth={2.6} />}
                    enabled={enabledFx.has("tune")}
                    onToggle={() => toggleFx("tune")}
                  >
                    <div className="wvm-tune-fields">
                      <TuneSelectorField
                        title="Clé"
                        value={autotune.key}
                        onOpen={() => setSimpleSelector("key")}
                      />
                      <TuneSelectorField
                        title="Gamme"
                        value={AUTOTUNE_SCALES.find((s) => s.id === autotune.scale)?.label ?? autotune.scale}
                        onOpen={() => setSimpleSelector("scale")}
                      />
                    </div>
                  </SimpleEffectCard>
                  <SimpleEffectCard
                    title="Réverb"
                    icon={<Sparkles size={11} strokeWidth={2.6} />}
                    enabled={enabledFx.has("reverb")}
                    onToggle={() => toggleFx("reverb")}
                  >
                    <ReverbSpaceSlider
                      value={reverbSpace}
                      enabled={enabledFx.has("reverb")}
                      onChange={setReverbSpace}
                    />
                  </SimpleEffectCard>
                </div>
              ) : (
                <div className="wvm-pro">
                  <div className="wvm-fx-head">
                    <span className="wvm-fx-title">Effets voix</span>
                    <span className="wvm-fx-summary">
                      {enabledFx.size ? `${enabledFx.size} actif${enabledFx.size > 1 ? "s" : ""}` : "bypass"}
                    </span>
                  </div>
                  <div className="wvm-fx-list">
                    {(["tune", "eq", "comp", "reverb"] as VocalEffectKind[]).map((k) => (
                      <EffectCard key={k} kind={k} enabled={enabledFx.has(k)} onToggle={() => toggleFx(k)} onSettings={() => setEditingFx(k)} />
                    ))}
                    <button className="wvm-fx-add" onClick={() => setPresetPicker(true)}>
                      + Ajouter un plugin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DeckPlayer baseSrc={baseSrc} baseTitle={baseTitle} />
        </div>
      ) : (
        <div className="wvm-page">
          <SoundboardPage />
        </div>
      )}

      {simpleSelector && (
        <SimpleSelectorPanel
          selector={simpleSelector}
          autotune={autotune}
          onPick={(s) => {
            updateAutotune(s);
            setSimpleSelector(null);
          }}
          onClose={() => setSimpleSelector(null)}
        />
      )}

      <div className="wvm-pagedots">
        {[0, 1].map((i) => (
          <button
            key={i}
            className={`wvm-dot${page === i ? " is-active" : ""}`}
            onClick={() => setPage(i as 0 | 1)}
            aria-label={i === 0 ? "Traitement" : "Live"}
          />
        ))}
      </div>

      {editingFx && (
        <EffectSheet
          kind={editingFx}
          enabled={enabledFx.has(editingFx)}
          autotune={autotune}
          onToggle={() => toggleFx(editingFx)}
          onAutotune={updateAutotune}
          onClose={() => setEditingFx(null)}
        />
      )}

      {presetPicker && (
        <div className="wvh-sheet-overlay" onClick={() => setPresetPicker(false)}>
          <div className="wvm-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="wvm-sheet-head">
              <span className="wvm-sheet-icon wvm-sheet-icon--accent"><Mic size={16} /></span>
              <div className="wvm-sheet-meta">
                <span className="wvm-sheet-title">PRESETS VOIX</span>
                <span className="wvm-sheet-sub">CHAÎNE DE TRAITEMENT</span>
              </div>
              <button className="wvh-sheet-close" onClick={() => setPresetPicker(false)}>
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>
            <div className="wvm-presets">
              {VOCAL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`wvm-preset${preset === p.id ? " is-active" : ""}`}
                  onClick={() => applyPreset(p.id)}
                >
                  <span className="wvm-preset-name">{p.label}</span>
                  <span className="wvm-preset-fx">
                    {p.effects.map((e) => EFFECT_KIND_LABEL[e]).join(" · ")}
                  </span>
                  {preset === p.id && <Check size={14} strokeWidth={2.8} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
