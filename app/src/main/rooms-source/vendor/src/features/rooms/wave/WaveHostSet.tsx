// ============================================================================
// LA WAVE — onglet Wave du Host (parité iOS WaveHostLiveSetPanel)
// Section Composition : lanes de clips + transport quantifié à la mesure.
// Section Propositions : inbox privée (À écouter / Prises / Archives), cue
// privé, swipe (De côté / Passer), adoption d'éléments ou de la composition.
// ============================================================================

import { useMemo, useState } from "react";
import {
  Archive,
  Bookmark,
  Check,
  ChevronRight,
  Headphones,
  Layers,
  Loader2,
  Lock,
  Music2,
  Pause,
  Play,
  Repeat,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type { LiveSetController } from "./WaveRoom";
import {
  CLIP_KIND_LABEL,
  CONTRIBUTION_STATUS_LABEL,
  REPEAT_LABEL,
  clipMusicalLength,
  playbackIsActive,
  playbackStatusLabel,
  proposalCanAdoptWhole,
  proposalSummaryLabel,
  usernameLabel,
  WAVE_ACCENT,
  WAVE_AMBER,
  WAVE_CYAN,
  WAVE_GREEN,
  WAVE_RED,
  type WaveContributionStatus,
  type WaveLiveClip,
  type WaveProposal,
  type WaveProposalComponent,
} from "./waveData";
import { WaveAvatar, WaveMessageBanner } from "./WavePanels";

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function TransportHeader({ live }: { live: LiveSetController }) {
  const { state, toggleClock } = live;
  return (
    <div className="wvh-transport">
      <button
        className={`wvh-transport-btn${state.clockRunning ? " is-running" : ""}`}
        onClick={toggleClock}
        aria-label={state.clockRunning ? "Tout arrêter" : "Démarrer la session"}
      >
        {state.clockRunning ? <Square size={15} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="wvh-transport-clock">
        <span className="wvh-transport-bar">
          {state.clockRunning ? `Mesure ${state.bar} · Temps ${state.beat}` : "Session en attente"}
        </span>
        <span className="wvh-transport-sub">
          {state.clockRunning ? "Lancements sur la mesure suivante" : "La clock démarre au premier lancement"}
        </span>
      </div>
      <div className="wvh-transport-chips">
        <span className="wvh-chip">{Math.round(state.bpm)} BPM</span>
        {state.keyLabel && <span className="wvh-chip">{state.keyLabel}</span>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lane de clip de composition
// ---------------------------------------------------------------------------

function ClipLane({ clip, live }: { clip: WaveLiveClip; live: LiveSetController }) {
  const d = clip.descriptor;
  const active = playbackIsActive(clip.playbackState);
  const loading = clip.playbackState.kind === "loading";
  const unavailable = clip.playbackState.kind === "unavailable";
  const effectivelyMuted = clip.isMuted || (live.state.clips.some((c) => c.isSolo) && !clip.isSolo);

  return (
    <div className={`wvh-lane${active ? " is-active" : ""}${effectivelyMuted ? " is-muted" : ""}`}>
      <button
        className={`wvh-lane-play${active ? " is-active" : ""}`}
        disabled={loading || unavailable}
        onClick={() => live.toggleClip(d.id)}
        aria-label={active ? "Stopper" : "Lancer à la mesure"}
      >
        {loading ? (
          <Loader2 size={15} className="wv-spin" />
        ) : active ? (
          <Square size={13} fill="currentColor" />
        ) : (
          <Play size={15} fill="currentColor" />
        )}
      </button>

      <WaveAvatar contributor={d.contributor} size={34} />

      <div className="wvh-lane-meta">
        <span className="wvh-lane-title">
          {clip.locked && <Lock size={10} strokeWidth={2.8} />}
          {d.title}
        </span>
        <span className="wvh-lane-sub">
          {usernameLabel(d.contributor)} · {d.role}
        </span>
        <span className="wvh-lane-tags">
          <span className="wvh-tag">{CLIP_KIND_LABEL[d.kind]}</span>
          <span className="wvh-tag">{clipMusicalLength(d)}</span>
          <span className={`wvh-tag${active ? " is-live" : ""}`}>{playbackStatusLabel(clip.playbackState)}</span>
        </span>
      </div>

      <div className="wvh-lane-actions">
        <button
          className="wvh-lane-repeat"
          onClick={() => live.cycleRepeat(d.id)}
          aria-label="Politique de répétition"
          title="Répétition"
        >
          <Repeat size={10} strokeWidth={2.6} />
          {REPEAT_LABEL[clip.repeatPolicy]}
        </button>
        <button
          className={`wvh-ms${clip.isMuted ? " is-on" : ""}`}
          onClick={() => live.toggleMute(d.id)}
          aria-label="Mute"
        >
          M
        </button>
        <button
          className={`wvh-ms wvh-ms--solo${clip.isSolo ? " is-on" : ""}`}
          onClick={() => live.toggleSolo(d.id)}
          aria-label="Solo"
        >
          S
        </button>
        <button
          className="wvh-lane-remove"
          onClick={() => live.removeClip(d.id)}
          aria-label="Retirer de la composition"
        >
          <Trash2 size={13} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lane de proposition (inbox)
// ---------------------------------------------------------------------------

function ProposalLane({
  proposal,
  live,
  onOpen,
}: {
  proposal: WaveProposal;
  live: LiveSetController;
  onOpen: (p: WaveProposal) => void;
}) {
  const previewing = live.state.privatePreview?.id === proposal.id;
  const previewSrc =
    proposal.previewSrc ?? proposal.components[0]?.descriptor.src;
  const decided = proposal.status !== "pending_review";

  return (
    <div className={`wvh-lane wvh-lane--proposal${previewing ? " is-cue" : ""}`}>
      <button
        className={`wvh-lane-play wvh-lane-play--cue${previewing ? " is-active" : ""}`}
        onClick={() => previewSrc && live.togglePrivatePreview(proposal.id, proposal.title, previewSrc)}
        aria-label={previewing ? "Arrêter la préécoute" : "Préécouter en privé"}
      >
        {previewing && live.state.privatePreview?.phase === "loading" ? (
          <Loader2 size={15} className="wv-spin" />
        ) : previewing ? (
          <Square size={13} fill="currentColor" />
        ) : (
          <Headphones size={15} strokeWidth={2.4} />
        )}
      </button>

      <WaveAvatar contributor={proposal.contributor} size={34} />

      <button className="wvh-lane-meta wvh-lane-meta--btn" onClick={() => onOpen(proposal)}>
        <span className="wvh-lane-title">
          {proposal.offerMode === "composition" && <Layers size={10} strokeWidth={2.8} />}
          {proposal.title}
        </span>
        <span className="wvh-lane-sub">{usernameLabel(proposal.contributor)}</span>
        <span className="wvh-lane-tags">
          <span className="wvh-tag">{proposalSummaryLabel(proposal)}</span>
          {decided && (
            <span className={`wvh-tag wvh-tag--${proposal.status}`}>
              {CONTRIBUTION_STATUS_LABEL[proposal.status]}
            </span>
          )}
        </span>
      </button>

      <ChevronRight size={15} strokeWidth={2.4} className="wvh-lane-chevron" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feuille de détail d'une proposition
// ---------------------------------------------------------------------------

function ProposalSheet({
  proposal,
  live,
  onDecide,
  onClose,
}: {
  proposal: WaveProposal;
  live: LiveSetController;
  onDecide: (id: string, status: WaveContributionStatus) => void;
  onClose: () => void;
}) {
  const preview = live.state.privatePreview;
  const canAdoptWhole = proposalCanAdoptWhole(proposal);
  const adoptable = proposal.status === "pending_review" || proposal.status === "inspiration";

  const previewComponent = (comp: WaveProposalComponent) =>
    live.togglePrivatePreview(comp.descriptor.id, comp.descriptor.title, comp.descriptor.src);

  const takeComponent = async (comp: WaveProposalComponent) => {
    await live.adoptComponents([comp]);
  };

  const takeWhole = async () => {
    await live.adoptComponents(proposal.components);
    onDecide(proposal.id, "accepted");
    live.flashMessage(`« ${proposal.title} » rejoint la composition.`);
    onClose();
  };

  return (
    <div className="wvh-sheet" role="dialog" aria-modal>
      <div className="wvh-sheet-head">
        <WaveAvatar contributor={proposal.contributor} size={40} />
        <div className="wvh-sheet-meta">
          <span className="wvh-sheet-title">{proposal.title}</span>
          <span className="wvh-sheet-sub">
            {usernameLabel(proposal.contributor)} · {proposalSummaryLabel(proposal)}
          </span>
        </div>
        <button className="wvh-sheet-close" onClick={onClose} aria-label="Fermer">
          <X size={17} strokeWidth={2.4} />
        </button>
      </div>

      {preview && (
        <div className="wvh-cue-banner">
          <Headphones size={12} strokeWidth={2.6} />
          <span>Écoute privée — {preview.phase === "loading" ? "chargement…" : preview.title}</span>
        </div>
      )}

      <div className="wvh-sheet-list">
        {proposal.components.map((comp) => {
          const d = comp.descriptor;
          const isPreviewing = preview?.id === d.id;
          return (
            <div key={d.id} className="wvh-lane wvh-lane--component">
              <button
                className={`wvh-lane-play wvh-lane-play--cue${isPreviewing ? " is-active" : ""}`}
                onClick={() => previewComponent(comp)}
                aria-label="Préécouter l'élément"
              >
                {isPreviewing ? <Square size={13} fill="currentColor" /> : <Headphones size={14} />}
              </button>
              <div className="wvh-lane-meta">
                <span className="wvh-lane-title">{d.title}</span>
                <span className="wvh-lane-tags">
                  <span className="wvh-tag">{CLIP_KIND_LABEL[d.kind]}</span>
                  <span className="wvh-tag">{clipMusicalLength(d)}</span>
                  <span className="wvh-tag">{d.role}</span>
                </span>
              </div>
              {adoptable && comp.hasMedia && (
                <button className="wvh-take" onClick={() => takeComponent(comp)}>
                  Prendre
                </button>
              )}
            </div>
          );
        })}
      </div>

      {adoptable && canAdoptWhole && (
        <button className="wvh-adopt" onClick={takeWhole}>
          <Layers size={14} strokeWidth={2.6} />
          Prendre la composition entière
        </button>
      )}

      <div className="wvh-decisions">
        <button
          className="wvh-decision wvh-decision--accept"
          onClick={() => {
            onDecide(proposal.id, "accepted");
            onClose();
          }}
        >
          <Check size={14} strokeWidth={2.8} />
          Accepter
        </button>
        <button
          className="wvh-decision"
          onClick={() => {
            onDecide(proposal.id, "inspiration");
            onClose();
          }}
        >
          <Bookmark size={13} strokeWidth={2.6} />
          De côté
        </button>
        <button
          className="wvh-decision wvh-decision--reject"
          onClick={() => {
            onDecide(proposal.id, "rejected");
            onClose();
          }}
        >
          <X size={14} strokeWidth={2.8} />
          Passer
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau principal
// ---------------------------------------------------------------------------

type Workspace = "live" | "inbox";
type InboxScope = "pending" | "accepted" | "archive";

const scopeIncludes = (scope: InboxScope, p: WaveProposal) => {
  switch (scope) {
    case "pending":
      return p.status === "pending_review";
    case "accepted":
      return p.status === "accepted";
    case "archive":
      return p.status === "inspiration" || p.status === "rejected" || p.status === "failed";
  }
};

export default function WaveHostSet({
  live,
  proposals,
  onDecide,
}: {
  live: LiveSetController;
  proposals: WaveProposal[];
  onDecide: (id: string, status: WaveContributionStatus) => void;
}) {
  const [section, setSection] = useState<Workspace>("live");
  const [scope, setScope] = useState<InboxScope>("pending");
  const [detail, setDetail] = useState<WaveProposal | null>(null);

  const pending = proposals.filter((p) => p.status === "pending_review").length;
  const scoped = useMemo(
    () => proposals.filter((p) => scopeIncludes(scope, p)),
    [proposals, scope],
  );
  const preview = live.state.privatePreview;

  return (
    <div className="wvh">
      <TransportHeader live={live} />
      <WaveMessageBanner message={live.state.message} />

      {preview && (
        <div className="wvh-cue-banner">
          <Headphones size={12} strokeWidth={2.6} />
          <span>
            Écoute privée — {preview.phase === "loading" ? "chargement…" : preview.title}
          </span>
          <button onClick={() => live.stopPrivatePreview()} aria-label="Arrêter">
            <X size={12} strokeWidth={2.8} />
          </button>
        </div>
      )}

      {section === "live" ? (
        <div className="wvh-list">
          {live.state.clips.length === 0 ? (
            <div className="wvh-empty">
              <Music2 size={22} strokeWidth={1.8} />
              <span>Composition vide — adopte des propositions pour construire le live.</span>
            </div>
          ) : (
            live.state.clips.map((clip) => (
              <ClipLane key={clip.descriptor.id} clip={clip} live={live} />
            ))
          )}
        </div>
      ) : (
        <>
          <div className="wvh-scopes">
            {(
              [
                ["pending", `À écouter${pending ? ` · ${pending}` : ""}`],
                ["accepted", "Prises"],
                ["archive", "Archives"],
              ] as [InboxScope, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                className={`wvh-scope${scope === id ? " is-active" : ""}`}
                onClick={() => setScope(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="wvh-list">
            {scoped.length === 0 ? (
              <div className="wvh-empty">
                <Archive size={20} strokeWidth={1.8} />
                <span>
                  {scope === "pending"
                    ? "Aucune proposition en attente — le studio des viewers alimente cette file."
                    : scope === "accepted"
                      ? "Aucune prise acceptée pour l'instant."
                      : "Archives vides."}
                </span>
              </div>
            ) : (
              scoped.map((p) => (
                <div key={p.id} className="wvh-swipe-wrap">
                  <div className="wvh-swipe-actions">
                    {p.status === "pending_review" && (
                      <>
                        <button
                          className="wvh-swipe wvh-swipe--save"
                          onClick={() => onDecide(p.id, "inspiration")}
                        >
                          <Bookmark size={13} strokeWidth={2.6} />
                          De côté
                        </button>
                        <button
                          className="wvh-swipe wvh-swipe--reject"
                          onClick={() => onDecide(p.id, "rejected")}
                        >
                          <X size={13} strokeWidth={2.8} />
                          Passer
                        </button>
                      </>
                    )}
                  </div>
                  <ProposalLane proposal={p} live={live} onOpen={setDetail} />
                </div>
              ))
            )}
          </div>
        </>
      )}

      <footer className="wvh-workspace">
        <button
          className={`wvh-workspace-btn${section === "live" ? " is-active" : ""}`}
          onClick={() => setSection("live")}
        >
          <Music2 size={12} strokeWidth={2.6} />
          Composition · {live.state.clips.length}
        </button>
        <button
          className={`wvh-workspace-btn${section === "inbox" ? " is-active" : ""}`}
          onClick={() => setSection("inbox")}
        >
          <Headphones size={12} strokeWidth={2.6} />
          Propositions{pending ? ` · ${pending}` : ""}
        </button>
      </footer>

      {detail && (
        <div className="wvh-sheet-overlay" onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ProposalSheet
              proposal={proposals.find((p) => p.id === detail.id) ?? detail}
              live={live}
              onDecide={onDecide}
              onClose={() => setDetail(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
