// ============================================================================
// LA WAVE — panneaux transverses (parité iOS WaveChatView / WaveCommandBar /
// WaveChatSocialActionRail / PlaceGuestPanelView / participation dock viewer)
// ============================================================================

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Gift,
  Headphones,
  Heart,
  LineChart,
  Mic,
  Send,
  Share2,
  Star,
  Users,
} from "lucide-react";
import {
  WAVE_AMBER,
  WAVE_GOLD,
  WAVE_HOST,
  WAVE_PINK,
  WAVE_RED,
  WAVE_ROOM,
  type WaveChatMessage,
  type WaveContributor,
} from "./waveData";

// ---------------------------------------------------------------------------
// Avatar contributeur — image iOS ou initiales
// ---------------------------------------------------------------------------

export function WaveAvatar({
  contributor,
  size = 34,
}: {
  contributor: WaveContributor;
  size?: number;
}) {
  return (
    <span className="wv-avatar" style={{ width: size, height: size }}>
      {contributor.avatar ? (
        <img src={contributor.avatar} alt={contributor.displayName} />
      ) : (
        <span className="wv-avatar-initial">{contributor.displayName[0]}</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Bannière de message session (amber, iOS state.message)
// ---------------------------------------------------------------------------

export function WaveMessageBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="wv-banner" role="status">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rail social — WaveChatSocialActionRail : une capsule verticale
// don / dashboard+notif (host) / golden like + like / partage
// ---------------------------------------------------------------------------

const compactCount = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

function SocialRail({ isHost }: { isHost: boolean }) {
  const [liked, setLiked] = useState(false);
  const [goldenLiked, setGoldenLiked] = useState(false);
  const [likes, setLikes] = useState(WAVE_ROOM.likesCount);
  const [goldens, setGoldens] = useState(WAVE_ROOM.goldenLikesCount);
  return (
    <div className="wv-social">
      <button className="wv-social-item wv-social-item--accent" aria-label="Faire un don">
        <Gift size={14} strokeWidth={2.4} />
      </button>
      {isHost && (
        <>
          <span className="wv-social-divider" />
          <button className="wv-social-item" aria-label="Dashboard du live">
            <LineChart size={14} strokeWidth={2.4} />
          </button>
          <button className="wv-social-item" aria-label="Notifications">
            <Bell size={14} strokeWidth={2.4} />
            <span className="wv-social-badge">2</span>
          </button>
          <span className="wv-social-divider" />
        </>
      )}
      <button
        className={`wv-social-item wv-social-metric${goldenLiked ? " is-on" : ""}`}
        style={{ color: WAVE_GOLD }}
        aria-label="Golden Like"
        onClick={() => {
          setGoldenLiked(true);
          setGoldens((n) => n + 1);
        }}
      >
        <Star size={14} strokeWidth={2.4} fill={goldenLiked ? WAVE_GOLD : "none"} />
        <span className="wv-social-count">{compactCount(goldens)}</span>
      </button>
      <button
        className={`wv-social-item wv-social-metric${liked ? " is-on" : ""}`}
        style={{ color: WAVE_PINK }}
        aria-label="Liker le live"
        onClick={() => {
          setLiked((v) => !v);
          setLikes((n) => (liked ? n - 1 : n + 1));
        }}
      >
        <Heart size={14} strokeWidth={2.4} fill={liked ? WAVE_PINK : "none"} />
        <span className="wv-social-count">{compactCount(likes)}</span>
      </button>
      <button className="wv-social-item" aria-label="Partager la room">
        <Share2 size={14} strokeWidth={2.4} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Command bar — WaveCommandBar : capsule dot violet + texte + bouton envoi
// ---------------------------------------------------------------------------

function WaveCommandBar({
  draft,
  onDraft,
  onSend,
}: {
  draft: string;
  onDraft: (v: string) => void;
  onSend: () => void;
}) {
  const empty = !draft.trim();
  return (
    <div className="wv-cmd">
      <div className="wv-cmd-field">
        <span className="wv-cmd-dot" aria-hidden />
        <input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Message..."
          maxLength={240}
          aria-label="Écrire un message"
        />
      </div>
      <button
        className={`wv-cmd-send${empty ? "" : " is-ready"}`}
        onClick={onSend}
        aria-label="Envoyer le message"
      >
        <Send size={13} strokeWidth={2.6} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat — WaveChatView : liste ancrée en bas + rail social + command bar.
// Messages : « auteur: contenu » — host en gold, auteurs en couleur de palette.
// ---------------------------------------------------------------------------

const CHAT_PALETTE = [
  "#FF6B6B", "#FF5DA2", "#C77DFF", "#7E8CFF", "#5EB2FF",
  "#4CC9F0", "#5FE8C8", "#52E07A", "#FFE066", "#FFA94D",
];
const authorColor = (m: WaveChatMessage) => {
  if (m.isHost) return WAVE_GOLD;
  let h = 0;
  for (const ch of m.author) h += ch.codePointAt(0) ?? 0;
  return CHAT_PALETTE[Math.abs(h) % CHAT_PALETTE.length];
};

export function WaveChatPanel({
  messages,
  isHost,
  pendingCount,
  onSend,
  onOpenWave,
}: {
  messages: WaveChatMessage[];
  isHost: boolean;
  pendingCount: number;
  onSend: (text: string) => void;
  onOpenWave: () => void;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <div className="wv-chat">
      <div className="wv-chat-body">
        <div ref={listRef} className="wv-chat-list">
          {isHost && pendingCount > 0 && (
            <button className="wv-chat-notif" onClick={onOpenWave}>
              <Headphones size={12} strokeWidth={2.6} />
              {pendingCount} proposition{pendingCount > 1 ? "s" : ""} à écouter — ouvre l'onglet Wave
            </button>
          )}
          {messages.length === 0 && (
            <div className="wv-chat-empty">
              <span className="wv-chat-empty-title">Chat en direct</span>
              <span className="wv-chat-empty-sub">Les messages du public apparaîtront ici</span>
            </div>
          )}
          {messages.map((m) =>
            m.isAgent ? (
              <div key={m.id} className="wv-msg wv-msg--system">
                {m.author === "Agent Wave" ? "" : `${m.author}: `}
                {m.text}
              </div>
            ) : (
              <div key={m.id} className="wv-msg">
                <span className="wv-msg-author" style={{ color: authorColor(m) }}>
                  {m.author}:
                </span>{" "}
                <span className="wv-msg-text">{m.text}</span>
              </div>
            ),
          )}
        </div>
        <SocialRail isHost={isHost} />
      </div>
      <WaveCommandBar draft={draft} onDraft={setDraft} onSend={submit} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Coulisses — host : cartes invités / viewer : carte host + état participation
// ---------------------------------------------------------------------------

function GuestCard({
  name,
  role,
  status,
  statusTint,
  actions,
}: {
  name: string;
  role: string;
  status: string;
  statusTint: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="wvc-card">
      <span className="wv-avatar" style={{ width: 38, height: 38 }}>
        <span className="wv-avatar-initial">{name[0]}</span>
      </span>
      <div className="wvc-card-meta">
        <span className="wvc-card-name">{name}</span>
        <span className="wvc-card-role">{role}</span>
      </div>
      <span className="wvc-card-status" style={{ color: statusTint, borderColor: `${statusTint}55`, background: `${statusTint}14` }}>
        {status}
      </span>
      {actions}
    </div>
  );
}

export function WaveCoulissesPanel({ isViewer }: { isViewer: boolean }) {
  if (isViewer) {
    return (
      <div className="wvc">
        <div className="wvc-host-card">
          <WaveAvatar contributor={WAVE_HOST} size={36} />
          <div className="wvc-card-meta">
            <span className="wvc-card-name">{WAVE_HOST.displayName}</span>
            <span className="wvc-card-role">Host · en direct</span>
          </div>
        </div>
        <div className="wvc-closed">
          <span className="wvc-closed-title">Coulisses fermées</span>
          <span className="wvc-closed-sub">
            Le Host ouvrira la file lorsqu'il sera prêt à accueillir un artiste.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="wvc">
      <div className="wvc-section">
        <div className="wvc-section-head">
          <span>SUR SCÈNE</span>
          <span className="wvc-count">1</span>
        </div>
        <GuestCard
          name="Ila Vert"
          role="Host · caméra + micro"
          status="EN DIRECT"
          statusTint={WAVE_RED}
          actions={
            <button className="wvc-mini" aria-label="Couper le micro">
              <Mic size={12} strokeWidth={2.6} />
            </button>
          }
        />
      </div>
      <div className="wvc-section">
        <div className="wvc-section-head">
          <span>COULISSES</span>
          <span className="wvc-count">1</span>
        </div>
        <GuestCard
          name="Nox Prime"
          role="Invité · prêt à monter"
          status="EN COULISSES"
          statusTint={WAVE_AMBER}
          actions={<button className="wvc-mini wvc-mini--go">Monter</button>}
        />
      </div>
      <div className="wvc-section">
        <div className="wvc-section-head">
          <span>INVITATIONS</span>
          <span className="wvc-count">1</span>
        </div>
        <GuestCard
          name="Solis"
          role="Invité · préparation"
          status="PRÉPARE"
          statusTint={WAVE_GOLD}
          actions={<button className="wvc-mini">Relancer</button>}
        />
      </div>
      <div className="wvc-section">
        <div className="wvc-section-head">
          <span>FILE D'ATTENTE</span>
          <span className="wvc-count">2</span>
          <button className="wvc-invite">
            <Users size={11} strokeWidth={2.6} />
            Inviter
          </button>
        </div>
        <GuestCard name="Maya Keys" role="Viewer · en file" status="#1" statusTint="#ffffff88" />
        <GuestCard name="Luna V" role="Viewer · en file" status="#2" statusTint="#ffffff88" />
      </div>
    </div>
  );
}
