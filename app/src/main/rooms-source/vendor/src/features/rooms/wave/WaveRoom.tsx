// ============================================================================
// LA WAVE — shell du live room (parité iOS WaveLiveHostRoomView /
// WaveReferenceViewerRoomView / WaveLiveViewerRoomView)
//
// Fond #0E0E10 · header 39pt · vidéo 16:9 · creator row (viewer) ·
// WaveTabBar Chat/Mix/Wave/Coulisses · panneaux par rôle.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronLeft,
  Drama,
  Eye,
  Maximize2,
  MessageCircle,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Users,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import WaveMixer from "./WaveMixer";
import { WaveChatPanel, WaveCoulissesPanel } from "./WavePanels";
import WaveHostSet from "./WaveHostSet";
import WaveViewerStudio from "./WaveViewerStudio";
import { liveSet } from "./waveAudio";
import {
  WAVE_ACT_BASE_SRC,
  WAVE_CHAT_SEED,
  WAVE_CONTRIBUTORS,
  WAVE_HOST_SEED_CLIPS,
  WAVE_INBOX_PROPOSALS,
  WAVE_ROOM,
  WAVE_TABS,
  barAt,
  beatAt,
  nextRepeat,
  repeatExtends,
  playbackIsActive,
  type WaveChatMessage,
  type WaveContributionStatus,
  type WaveLiveClip,
  type WavePlaybackState,
  type WaveProposal,
  type WaveTab,
} from "./waveData";

// ---------------------------------------------------------------------------
// Contrôleur live set — port de WaveHostLiveSetController (état + actions)
// ---------------------------------------------------------------------------

export interface LiveSetState {
  bpm: number;
  keyLabel: string | null;
  clips: WaveLiveClip[];
  clockRunning: boolean;
  elapsed: number;
  bar: number;
  beat: number;
  privatePreview: { id: string; title: string; phase: "loading" | "playing" } | null;
  message: string | null;
}

const initialLiveSet = (): LiveSetState => ({
  bpm: 120,
  keyLabel: "La min",
  clips: WAVE_HOST_SEED_CLIPS.map((c) => ({ ...c, playbackState: { kind: "loading" } })),
  clockRunning: false,
  elapsed: 0,
  bar: 1,
  beat: 1,
  privatePreview: null,
  message: null,
});

export function useLiveSet() {
  const [state, setState] = useState<LiveSetState>(initialLiveSet);
  const msgTimer = useRef<number | null>(null);

  const updateClip = useCallback((id: string, fn: (c: WaveLiveClip) => WaveLiveClip) => {
    setState((s) => ({ ...s, clips: s.clips.map((c) => (c.id === id || c.descriptor.id === id ? fn(c) : c)) }));
  }, []);

  const flashMessage = useCallback((message: string | null) => {
    setState((s) => ({ ...s, message }));
    if (msgTimer.current) window.clearTimeout(msgTimer.current);
    if (message) {
      msgTimer.current = window.setTimeout(() => {
        setState((s) => (s.message === message ? { ...s, message: null } : s));
      }, 4200);
    }
  }, []);

  // Câblage moteur → état
  useEffect(() => {
    liveSet.configure({
      onClipState: (id, playbackState) => {
        updateClip(id, (c) => ({ ...c, playbackState }));
      },
      onTick: ({ elapsed, bar, beat }) => {
        setState((s) => (s.clockRunning ? { ...s, elapsed, bar, beat } : s));
      },
      onClockChange: (running) => {
        setState((s) => ({ ...s, clockRunning: running }));
      },
    });
    return () => liveSet.shutdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Préparation des lanes seed (état loading → ready)
  useEffect(() => {
    WAVE_HOST_SEED_CLIPS.forEach((clip) => {
      void liveSet.prepare(clip.descriptor.id, clip.descriptor.src).then((ok) => {
        updateClip(clip.descriptor.id, (c) => ({
          ...c,
          playbackState: ok ? { kind: "ready" } : { kind: "unavailable", reason: "Média illisible" },
        }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setClipState = useCallback((id: string, playbackState: WavePlaybackState) => {
    updateClip(id, (c) => ({ ...c, playbackState }));
  }, [updateClip]);

  const toggleClip = useCallback((id: string) => {
    setState((s) => {
      const clip = s.clips.find((c) => c.descriptor.id === id);
      if (!clip) return s;
      switch (clip.playbackState.kind) {
        case "ready": {
          const bar = liveSet.queueLaunch(clip);
          if (bar == null) return s;
          return {
            ...s,
            clockRunning: true,
            clips: s.clips.map((c) =>
              c.descriptor.id === id ? { ...c, playbackState: { kind: "queuedStart", bar } } : c,
            ),
          };
        }
        case "queuedStart":
        case "playing": {
          liveSet.stopClip(id);
          return {
            ...s,
            clips: s.clips.map((c) =>
              c.descriptor.id === id ? { ...c, playbackState: { kind: "ready" } } : c,
            ),
          };
        }
        default:
          return s;
      }
    });
  }, []);

  const toggleMute = useCallback((id: string) => {
    setState((s) => {
      const clips = s.clips.map((c) =>
        c.descriptor.id === id ? { ...c, isMuted: !c.isMuted, isSolo: c.isMuted ? c.isSolo : false } : c,
      );
      liveSet.syncAudibility(clips);
      return { ...s, clips };
    });
  }, []);

  const toggleSolo = useCallback((id: string) => {
    setState((s) => {
      const enabling = !s.clips.find((c) => c.descriptor.id === id)?.isSolo;
      const clips = s.clips.map((c) => {
        if (c.descriptor.id === id) return { ...c, isSolo: enabling, isMuted: enabling ? false : c.isMuted };
        return enabling ? { ...c, isSolo: false } : c;
      });
      liveSet.syncAudibility(clips);
      return { ...s, clips };
    });
  }, []);

  const cycleRepeat = useCallback((id: string) => {
    setState((s) => {
      const clip = s.clips.find((c) => c.descriptor.id === id);
      if (!clip) return s;
      const next = nextRepeat(clip.descriptor.kind, clip.repeatPolicy);
      if (playbackIsActive(clip.playbackState) && !repeatExtends(next, clip.repeatPolicy)) {
        return {
          ...s,
          message:
            clip.repeatPolicy === -1
              ? "Cette loop tient déjà sans limite. Stoppe-la pour programmer une fin."
              : "La durée peut être allongée en lecture, pas raccourcie. Stoppe le clip pour revenir à 1×.",
        };
      }
      const clips = s.clips.map((c) => (c.descriptor.id === id ? { ...c, repeatPolicy: next } : c));
      const updated = clips.find((c) => c.descriptor.id === id);
      if (updated && playbackIsActive(updated.playbackState)) liveSet.updateActiveRepeat(updated);
      return { ...s, clips };
    });
  }, []);

  const toggleClock = useCallback(() => {
    setState((s) => {
      if (!s.clockRunning) {
        liveSet.startClock();
        return { ...s, clockRunning: true };
      }
      const ids = liveSet.stopAll();
      return {
        ...s,
        clockRunning: false,
        elapsed: 0,
        bar: 1,
        beat: 1,
        clips: s.clips.map((c) =>
          ids.includes(c.descriptor.id) && c.playbackState.kind !== "unavailable" && c.playbackState.kind !== "loading"
            ? { ...c, playbackState: { kind: "ready" } }
            : c,
        ),
      };
    });
  }, []);

  const removeClip = useCallback((id: string) => {
    setState((s) => {
      const clip = s.clips.find((c) => c.descriptor.id === id);
      if (clip?.locked) {
        return { ...s, message: "Cette piste est verrouillée pendant la confirmation de la proposition." };
      }
      liveSet.releaseClip(id);
      return { ...s, clips: s.clips.filter((c) => c.descriptor.id !== id) };
    });
  }, []);

  /** Adoption : un composant de proposition devient une lane de composition. */
  const adoptComponents = useCallback(async (components: { descriptor: WaveLiveClip["descriptor"] }[]) => {
    const added: WaveLiveClip[] = components.map((comp) => ({
      descriptor: comp.descriptor,
      playbackState: { kind: "loading" } as WavePlaybackState,
      repeatPolicy: comp.descriptor.kind === "loop" ? (-1 as const) : (1 as const),
      isMuted: false,
      isSolo: false,
    }));
    setState((s) => ({ ...s, clips: [...s.clips, ...added] }));
    for (const comp of components) {
      const ok = await liveSet.prepare(comp.descriptor.id, comp.descriptor.src);
      updateClip(comp.descriptor.id, (c) => ({
        ...c,
        playbackState: ok ? { kind: "ready" } : { kind: "unavailable", reason: "Média illisible" },
      }));
    }
  }, [updateClip]);

  /** Cue privé : préécoute isolée d'une proposition (hors programme). */
  const togglePrivatePreview = useCallback((id: string, title: string, src: string) => {
    setState((s) => {
      if (s.privatePreview?.id === id) {
        liveSet.stopCue();
        return { ...s, privatePreview: null };
      }
      void liveSet.startCue(id, src).then((ok) => {
        setState((cur) => {
          if (cur.privatePreview?.id !== id) return cur;
          return ok
            ? { ...cur, privatePreview: { id, title, phase: "playing" } }
            : { ...cur, privatePreview: null, message: "Préécoute indisponible pour cette proposition." };
        });
      });
      return { ...s, privatePreview: { id, title, phase: "loading" }, message: null };
    });
  }, []);

  const stopPrivatePreview = useCallback(() => {
    liveSet.stopCue();
    setState((s) => ({ ...s, privatePreview: null }));
  }, []);

  return {
    state,
    toggleClip,
    toggleMute,
    toggleSolo,
    cycleRepeat,
    toggleClock,
    removeClip,
    adoptComponents,
    togglePrivatePreview,
    stopPrivatePreview,
    setClipState,
    flashMessage,
  };
}

export type LiveSetController = ReturnType<typeof useLiveSet>;

// ---------------------------------------------------------------------------
// Chrome — header / vidéo / creator row / tab bar
// ---------------------------------------------------------------------------

function WaveHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className="wv-header">
      <button className="wv-header-btn" onClick={onClose} aria-label="Retour">
        <ChevronLeft size={22} strokeWidth={2.4} />
      </button>
      <div className="wv-header-title">{title}</div>
      <button className="wv-header-btn" onClick={onClose} aria-label="Fermer">
        <X size={20} strokeWidth={2.4} />
      </button>
    </header>
  );
}

/** Chrono live de la metrics pill (red dot + elapsed + eye + viewers). */
function WaveLiveElapsed() {
  const [sec, setSec] = useState(2 * 3600 + 38 * 60 + 14);
  useEffect(() => {
    const t = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    <span className="wv-video-elapsed">
      {h}:{`${m}`.padStart(2, "0")}:{`${s}`.padStart(2, "0")}
    </span>
  );
}

function WaveVideoSection({ isViewer }: { isViewer: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const reveal = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    reveal();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [reveal]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    const tryPlay = () => {
      video.play().catch(() => {
        if (!video.muted) {
          video.muted = true;
          setMuted(true);
          video.play().catch(() => {});
        }
      });
    };
    tryPlay();
    video.addEventListener("canplay", tryPlay);
    return () => video.removeEventListener("canplay", tryPlay);
  }, [muted]);

  return (
    <div className="wv-video" onClick={reveal}>
      <video
        ref={videoRef}
        className="wv-video-el"
        src={WAVE_ROOM.videoSrc}
        autoPlay
        loop
        playsInline
        muted={muted}
      />
      {!isViewer && !camOn && (
        <div className="wv-video-camoff">
          <VideoOff size={30} strokeWidth={1.8} />
          <span className="wv-video-camoff-label">CAMERA COUPÉE</span>
        </div>
      )}
      <div className={`wv-video-overlay${controlsVisible ? " is-visible" : ""}`}>
        <div className="wv-video-top">
          {isViewer ? (
            <span className="wv-video-metrics">
              <span className="wv-video-live-dot" aria-hidden />
              <WaveLiveElapsed />
              <span className="wv-video-sep" aria-hidden />
              <Eye size={9} strokeWidth={2.8} />
              {WAVE_ROOM.viewersCount.toLocaleString("fr-FR")}
            </span>
          ) : (
            <span />
          )}
          <button className="wv-video-icon" aria-label="Plein écran" onClick={(e) => e.stopPropagation()}>
            <Maximize2 size={14} strokeWidth={2.6} />
          </button>
        </div>
        <div className="wv-video-bottom">
          {isViewer ? (
            <>
              <button
                className="wv-video-icon"
                aria-label={muted ? "Réactiver le son" : "Couper le son"}
                onClick={(e) => {
                  e.stopPropagation();
                  setMuted((m) => !m);
                  reveal();
                }}
              >
                {muted ? <VolumeX size={14} strokeWidth={2.6} /> : <Volume2 size={14} strokeWidth={2.6} />}
              </button>
              <button className="wv-video-icon" aria-label="Réglages vidéo" onClick={(e) => e.stopPropagation()}>
                <Settings size={14} strokeWidth={2.6} />
              </button>
            </>
          ) : (
            <div className="wv-video-host-controls" onClick={(e) => e.stopPropagation()}>
              <button className="wv-video-icon" aria-label="Changer de caméra">
                <RefreshCw size={14} strokeWidth={2.6} />
              </button>
              <button
                className={`wv-video-icon${camOn ? "" : " is-off"}`}
                aria-label="Caméra"
                onClick={() => setCamOn((v) => !v)}
              >
                {camOn ? <VideoIcon size={14} strokeWidth={2.6} /> : <VideoOff size={14} strokeWidth={2.6} />}
              </button>
              <button
                className={`wv-video-icon${micOn ? "" : " is-off"}`}
                aria-label="Micro"
                onClick={() => setMicOn((v) => !v)}
              >
                {micOn ? <Mic size={14} strokeWidth={2.6} /> : <MicOff size={14} strokeWidth={2.6} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WaveCreatorRow() {
  const [following, setFollowing] = useState(false);
  const host = WAVE_ROOM.host;
  return (
    <div className="wv-creator">
      <button className="wv-creator-id">
        <span className="wv-avatar wv-avatar--sm">
          {host.avatar ? <img src={host.avatar} alt="" /> : <span>{host.displayName[0]}</span>}
        </span>
        <span className="wv-creator-meta">
          <span className="wv-creator-name">{host.displayName}</span>
          <span className="wv-creator-followers">
            <Users size={9} strokeWidth={2.6} />
            {WAVE_ROOM.followersCount.toLocaleString("fr-FR")} followers
          </span>
        </span>
      </button>
      <button
        className={`wv-follow${following ? " is-following" : ""}`}
        onClick={() => setFollowing((f) => !f)}
      >
        {!following && <Plus size={13} strokeWidth={2.8} />}
        {following ? "Suivi" : "Suivre"}
      </button>
    </div>
  );
}

const WAVE_TAB_ICONS: Record<WaveTab, typeof MessageCircle> = {
  chat: MessageCircle,
  mix: SlidersHorizontal,
  wave: Activity,
  coulisses: Drama,
};

function WaveTabBar({
  active,
  onSelect,
  disabled,
  badges,
}: {
  active: WaveTab;
  onSelect: (t: WaveTab) => void;
  disabled: Set<WaveTab>;
  badges: Partial<Record<WaveTab, number>>;
}) {
  return (
    <nav className="wv-tabs" role="tablist">
      <div className="wv-tabs-capsule">
        {WAVE_TABS.map((tab) => {
          const isActive = tab.id === active;
          const isDisabled = disabled.has(tab.id);
          const badge = badges[tab.id] ?? 0;
          const Icon = WAVE_TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-disabled={isDisabled}
              className={`wv-tab${isActive ? " is-active" : ""}${isDisabled ? " is-disabled" : ""}`}
              onClick={() => !isDisabled && onSelect(tab.id)}
            >
              <Icon size={13} strokeWidth={2.4} />
              <span className="wv-tab-label">{tab.label}</span>
              {badge > 0 && (
                <span className={`wv-tab-badge wv-tab-badge--${tab.id}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export interface WaveRoomProps {
  isViewer?: boolean;
  roomTitle?: string;
  hasRegisseur?: boolean;
  onClose: () => void;
}

export default function WaveRoom({ isViewer = false, roomTitle, onClose }: WaveRoomProps) {
  const live = useLiveSet();
  const [activeTab, setActiveTab] = useState<WaveTab>("chat");
  const [messages, setMessages] = useState<WaveChatMessage[]>(WAVE_CHAT_SEED);
  const [proposals, setProposals] = useState<WaveProposal[]>(WAVE_INBOX_PROPOSALS);
  const [visitedTabs, setVisitedTabs] = useState<Set<WaveTab>>(new Set(["chat"]));

  const selectTab = useCallback((tab: WaveTab) => {
    setActiveTab(tab);
    setVisitedTabs((v) => (v.has(tab) ? v : new Set(v).add(tab)));
  }, []);

  const title = WAVE_ROOM.name;

  // Viewer sans invitation : l'onglet Mix est désactivé (iOS viewerDisabledTabs)
  const [isGuestOnStage] = useState(false);
  const disabledTabs = useMemo<Set<WaveTab>>(
    () => (isViewer && !isGuestOnStage ? new Set<WaveTab>(["mix"]) : new Set()),
    [isViewer, isGuestOnStage],
  );

  const waveAttention = useMemo(
    () => proposals.filter((p) => p.status === "pending_review").length,
    [proposals],
  );

  const decideProposal = useCallback((id: string, status: WaveContributionStatus) => {
    setProposals((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const sendMessage = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      { id: `m-${Date.now()}`, author: "Moi", text: t, agoSec: 0 },
    ]);
  }, []);

  const pendingCount = proposals.filter((p) => p.status === "pending_review").length;

  return (
    <div className="wv-room">
      <WaveHeader title={title} onClose={onClose} />
      <WaveVideoSection isViewer={isViewer} />
      {isViewer && <WaveCreatorRow />}

      <WaveTabBar
        active={activeTab}
        onSelect={selectTab}
        disabled={disabledTabs}
        badges={{
          wave: isViewer ? 0 : waveAttention,
          coulisses: isViewer && isGuestOnStage ? 1 : 0,
        }}
      />

      <main className="wv-panel">
        {activeTab === "chat" && (
          <WaveChatPanel
            messages={messages}
            isHost={!isViewer}
            pendingCount={pendingCount}
            onSend={sendMessage}
            onOpenWave={() => selectTab("wave")}
          />
        )}
        {visitedTabs.has("mix") && (
          <div hidden={activeTab !== "mix"} className="wv-panel-keep">
            <WaveMixer
              isViewer={isViewer}
              baseSrc={WAVE_ACT_BASE_SRC}
              baseTitle="Marée haute"
            />
          </div>
        )}
        {visitedTabs.has("wave") && (
          <div hidden={activeTab !== "wave"} className="wv-panel-keep">
            {isViewer ? (
              <WaveViewerStudio onProposalSubmitted={(p) => setProposals((l) => [p, ...l])} />
            ) : (
              <WaveHostSet
                live={live}
                proposals={proposals}
                onDecide={decideProposal}
              />
            )}
          </div>
        )}
        {activeTab === "coulisses" && <WaveCoulissesPanel isViewer={isViewer} />}
      </main>
    </div>
  );
}
