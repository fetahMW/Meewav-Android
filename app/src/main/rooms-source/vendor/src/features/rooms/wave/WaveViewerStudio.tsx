// ============================================================================
// LA WAVE — onglet Wave du Viewer (parité iOS WaveViewerStudioPanel)
// Studio privé local : rien ne sort de l'appareil tant que la proposition
// n'est pas soumise. Référence Host, capture 4-32 mesures avec count-in,
// import de bounce, FX/preset, review base/ensemble/stem, soumission privée.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileAudio,
  Headphones,
  Loader2,
  Mic,
  Pause,
  Play,
  ShieldCheck,
  Square,
  Upload,
  X,
} from "lucide-react";
import { studio, vocalChain } from "./waveAudio";
import {
  CLIP_KIND_LABEL,
  CONTRIBUTION_STATUS_LABEL,
  REVIEW_MODE_LABEL,
  STUDIO_PRESETS,
  STUDIO_TAKE_BARS,
  WAVE_ACT_BASE_SRC,
  WAVE_ACT_BASE_TITLE,
  WAVE_ACT_BASE_SECONDS,
  WAVE_HOST,
  WAVE_SESSION_BPM,
  WAVE_SESSION_KEY,
  barDuration,
  type StudioPhase,
  type StudioReviewMode,
  type StudioTakeBars,
  type VocalPresetId,
  type WaveClipKind,
  type WaveProposal,
} from "./waveData";
import { WaveAvatar } from "./WavePanels";

// ---------------------------------------------------------------------------
// En-tête vie privée
// ---------------------------------------------------------------------------

function PrivacyHeader() {
  return (
    <div className="wvs-privacy">
      <span className="wvs-privacy-icon">
        <ShieldCheck size={18} strokeWidth={2.4} />
      </span>
      <div className="wvs-privacy-meta">
        <span className="wvs-privacy-title">
          TON STUDIO PRIVÉ
          <span className="wvs-privacy-chip">LOCAL · HORS RTC</span>
        </span>
        <span className="wvs-privacy-sub">
          Tout reste sur ton appareil : le Host ne reçoit que la proposition que tu soumets.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carte référence (composition Host)
// ---------------------------------------------------------------------------

function ReferenceCard({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <div className="wvs-card">
      <div className="wvs-card-head">
        <span className="wvs-card-kicker">COMPOSITION HOST · V1</span>
        <span className="wvs-card-hint">Référence privée</span>
      </div>
      <div className="wvs-ref">
        <button className="wvs-ref-play" onClick={onToggle} aria-label="Écouter la base">
          {playing ? <Square size={14} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>
        <div className="wvs-ref-meta">
          <span className="wvs-ref-title">{WAVE_ACT_BASE_TITLE}</span>
          <span className="wvs-ref-sub">
            {WAVE_HOST.displayName} · {WAVE_ACT_BASE_SECONDS} s
          </span>
        </div>
        <div className="wvs-ref-chips">
          <span className="wvh-chip">{WAVE_SESSION_BPM} BPM</span>
          <span className="wvh-chip">{WAVE_SESSION_KEY}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Studio principal
// ---------------------------------------------------------------------------

export default function WaveViewerStudio({
  onProposalSubmitted,
}: {
  onProposalSubmitted: (p: WaveProposal) => void;
}) {
  const [phase, setPhase] = useState<StudioPhase>("ready");
  const [takeBars, setTakeBars] = useState<StudioTakeBars>(8);
  const [clipKind, setClipKind] = useState<WaveClipKind>("loop");
  const [preset, setPreset] = useState<VocalPresetId>("clean");
  const [monitoring, setMonitoring] = useState(false);
  const [basePlaying, setBasePlaying] = useState(false);
  const [progress, setProgress] = useState<{ el: number; total: number } | null>(null);
  const [takeDuration, setTakeDuration] = useState(0);
  const [reviewMode, setReviewMode] = useState<StudioReviewMode>("ensemble");
  const [reviewPlaying, setReviewPlaying] = useState(false);
  const [proposalName, setProposalName] = useState("");
  const [proposals, setProposals] = useState<WaveProposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    studio.configure({
      onPhase: (p) => setPhase(p as StudioPhase),
      onProgress: (el, total) => setProgress({ el, total }),
      onRecorded: (_blob, duration) => {
        setTakeDuration(duration);
        setProgress(null);
        setPhase("review");
      },
      onReviewEnded: () => setReviewPlaying(false),
    });
    return () => studio.shutdown();
  }, []);

  const toggleBase = () => {
    if (basePlaying) {
      studio.stopReview();
      setBasePlaying(false);
    } else {
      void studio.playBaseOnce(WAVE_ACT_BASE_SRC).then((ok) => setBasePlaying(ok));
    }
  };

  const startRecording = async () => {
    setError(null);
    setPhase("preparing");
    const ok = await studio.record(takeBars, preset, monitoring);
    if (!ok) {
      setPhase("ready");
      setError("Micro indisponible — autorise l'accès ou importe un bounce à la place.");
    }
  };

  const cancelRecording = () => {
    studio.cancelRecording();
    setProgress(null);
    setPhase("ready");
  };

  const importFile = async (file: File) => {
    setError(null);
    setPhase("rendering");
    try {
      const ab = await file.arrayBuffer();
      const ctx = new AudioContext();
      const buf = await ctx.decodeAudioData(ab);
      (studio as unknown as { takeBuffer: AudioBuffer | null }).takeBuffer = buf;
      setTakeDuration(buf.duration);
      setPhase("review");
    } catch {
      setPhase("ready");
      setError("Fichier illisible — choisis un export audio de ton DAW.");
    }
  };

  const toggleReview = async () => {
    if (reviewPlaying) {
      studio.stopReview();
      setReviewPlaying(false);
      return;
    }
    const ok = await studio.playReview(reviewMode, WAVE_ACT_BASE_SRC);
    setReviewPlaying(ok);
  };

  const discard = () => {
    studio.stopReview();
    setReviewPlaying(false);
    setProposalName("");
    setPhase("ready");
  };

  const submit = () => {
    studio.stopReview();
    setReviewPlaying(false);
    setPhase("submitting");
    const name = proposalName.trim() || "Ma partie";
    const proposal: WaveProposal = {
      id: `viewer-prop-${Date.now()}`,
      title: name,
      contributor: { id: "me", displayName: "Moi", handle: "@moi", avatar: null },
      status: "pending_review",
      offerMode: "track",
      components: [
        {
          descriptor: {
            id: `viewer-stem-${Date.now()}`,
            title: name,
            role: "VOIX",
            contributor: { id: "me", displayName: "Moi", handle: "@moi", avatar: null },
            kind: clipKind,
            durationSeconds: takeDuration,
            loopBars: clipKind === "loop" ? takeBars : undefined,
            src: "",
          },
          hasMedia: true,
        },
      ],
      hasCompleteManifest: true,
      createdAgoMin: 0,
    };
    window.setTimeout(() => {
      setProposals((l) => [proposal, ...l]);
      onProposalSubmitted(proposal);
      setProposalName("");
      setPhase("ready");
    }, 650);
  };

  const total = progress?.total ?? takeBars * barDuration();
  const elapsed = progress?.el ?? 0;
  const inCountIn = phase === "countIn";
  const inRecording = phase === "recording";
  const busy = phase === "preparing" || phase === "rendering" || phase === "submitting";

  return (
    <div className="wvs">
      <PrivacyHeader />
      <ReferenceCard playing={basePlaying} onToggle={toggleBase} />

      <div className="wvs-card">
        <div className="wvs-card-head">
          <span className="wvs-card-kicker">AJOUTE TA PARTIE</span>
          <span className="wvs-card-hint">en privé</span>
        </div>

        {phase !== "review" && (
          <>
            <div className="wvs-row">
              <span className="wvs-label">Durée</span>
              <div className="wvs-seg">
                {STUDIO_TAKE_BARS.map((b) => (
                  <button
                    key={b}
                    className={`wvs-seg-btn${takeBars === b ? " is-active" : ""}`}
                    onClick={() => setTakeBars(b)}
                    disabled={inRecording || inCountIn}
                  >
                    {b}M
                  </button>
                ))}
              </div>
            </div>

            <div className="wvs-row">
              <span className="wvs-label">Type</span>
              <div className="wvs-seg">
                {(["loop", "longTake", "oneShot"] as WaveClipKind[]).map((k) => (
                  <button
                    key={k}
                    className={`wvs-seg-btn${clipKind === k ? " is-active" : ""}`}
                    onClick={() => setClipKind(k)}
                    disabled={inRecording || inCountIn}
                  >
                    {CLIP_KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            </div>

            <div className="wvs-row">
              <span className="wvs-label">Preset</span>
              <div className="wvs-seg">
                {STUDIO_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className={`wvs-seg-btn${preset === p.id ? " is-active" : ""}`}
                    onClick={() => setPreset(p.id)}
                    disabled={inRecording || inCountIn}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="wvs-row wvs-row--monitor">
              <span className="wvs-label">Retour</span>
              <button
                className={`wvs-monitor${monitoring ? " is-on" : ""}`}
                onClick={() => {
                  const next = !monitoring;
                  setMonitoring(next);
                  vocalChain.setMonitoring(next);
                }}
              >
                <Headphones size={12} strokeWidth={2.6} />
                {monitoring ? "Actif" : "Coupé"}
              </button>
            </div>

            {inCountIn || inRecording ? (
              <div className="wvs-recording">
                <div className="wvs-recording-bar">
                  <div
                    className="wvs-recording-fill"
                    style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }}
                  />
                </div>
                <div className="wvs-recording-meta">
                  <span className={`wvs-rec-dot${inRecording ? " is-live" : ""}`} />
                  <span>
                    {inCountIn
                      ? "Count-in — 1 mesure"
                      : `Enregistrement · ${Math.min(total, elapsed).toFixed(1)} / ${total.toFixed(0)} s`}
                  </span>
                  <button className="wvs-cancel" onClick={cancelRecording}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="wvs-actions">
                <button className="wvs-record" onClick={startRecording} disabled={busy}>
                  {busy ? <Loader2 size={15} className="wv-spin" /> : <Mic size={15} strokeWidth={2.5} />}
                  Enregistrer ici
                </button>
                <button className="wvs-import" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <Upload size={14} strokeWidth={2.5} />
                  Importer
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            )}
          </>
        )}

        {phase === "review" && (
          <div className="wvs-review">
            <input
              className="wvs-name"
              value={proposalName}
              onChange={(e) => setProposalName(e.target.value)}
              placeholder="Nomme ta proposition…"
              maxLength={48}
            />
            <div className="wvs-row">
              <span className="wvs-label">Écoute</span>
              <div className="wvs-seg">
                {(["baseOnly", "ensemble", "takeOnly"] as StudioReviewMode[]).map((m) => (
                  <button
                    key={m}
                    className={`wvs-seg-btn${reviewMode === m ? " is-active" : ""}`}
                    onClick={() => {
                      setReviewMode(m);
                      if (reviewPlaying) void studio.playReview(m, WAVE_ACT_BASE_SRC);
                    }}
                  >
                    {REVIEW_MODE_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
            <div className="wvs-review-chips">
              <span className="wvh-tag">{CLIP_KIND_LABEL[clipKind]}</span>
              <span className="wvh-tag">{takeBars} mesures</span>
              <span className="wvh-tag">{takeDuration.toFixed(1)} s</span>
              <span className="wvh-tag">{STUDIO_PRESETS.find((p) => p.id === preset)?.label}</span>
            </div>
            <div className="wvs-actions">
              <button className="wvs-review-play" onClick={toggleReview}>
                {reviewPlaying ? <Square size={14} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                {reviewPlaying ? "Stop" : "Écouter"}
              </button>
              <button className="wvs-discard" onClick={discard}>
                Refaire
              </button>
              <button className="wvs-submit" onClick={submit}>
                <Check size={14} strokeWidth={2.8} />
                Proposer au Host
              </button>
            </div>
            <span className="wvs-review-note">
              La proposition part en privé : stem isolée + preview mixée pour le Host uniquement.
            </span>
          </div>
        )}

        {error && (
          <div className="wvs-error">
            <X size={12} strokeWidth={2.8} />
            {error}
          </div>
        )}
      </div>

      <div className="wvs-card">
        <div className="wvs-card-head">
          <span className="wvs-card-kicker">TES PROPOSITIONS PRIVÉES</span>
          <span className="wvs-card-hint">{proposals.length || "aucune"}</span>
        </div>
        {proposals.length === 0 ? (
          <div className="wvs-proposals-empty">
            <FileAudio size={18} strokeWidth={1.8} />
            <span>Tes envois restent visibles ici — le Host les écoute en privé avant de décider.</span>
          </div>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="wvs-proposal">
              <WaveAvatar contributor={p.contributor} size={30} />
              <div className="wvs-proposal-meta">
                <span className="wvs-proposal-title">{p.title}</span>
                <span className="wvs-proposal-sub">
                  {p.components[0]?.descriptor.kind === "loop" ? "Loop" : "Prise"} ·{" "}
                  {p.createdAgoMin === 0 ? "à l'instant" : `il y a ${p.createdAgoMin} min`}
                </span>
              </div>
              <span className={`wvs-status wvs-status--${p.status}`}>
                {CONTRIBUTION_STATUS_LABEL[p.status]}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
