// ============================================================================
// LA WAVE — modèle + données (parité iOS natif Meewav/Features/Rooms/Wave)
// Source de vérité : WAVE_SPEC.md, WaveLiveSessionModels, WaveFoundationModels,
// WaveLocalPublicInboxPack, WaveViewerStudioModels, PlaceVocalEffectsModels.
// Session : clock continue · 120 BPM · La min.
// ============================================================================

export const WAVE_ACCENT = "#7E44E3"; // PlaceTheme.accent (violet MeeWav)
export const WAVE_CYAN = "#00E5FF";
export const WAVE_AMBER = "#E8B86D";
export const WAVE_GREEN = "#2FE6A6";
export const WAVE_RED = "#FF2E3B";
export const WAVE_PINK = "#FF2E92";
export const WAVE_GOLD = "#FFD700";
export const WAVE_BG = "#0E0E10";

export const WAVE_SESSION_BPM = 120;
export const WAVE_SESSION_KEY = "La min";
export const WAVE_SESSION_BEATS_PER_BAR = 4;

// ---------------------------------------------------------------------------
// Clock musicale — WaveLiveSessionTiming
// ---------------------------------------------------------------------------

export const beatDuration = (bpm = WAVE_SESSION_BPM) => 60 / bpm;
export const barDuration = (bpm = WAVE_SESSION_BPM, beatsPerBar = WAVE_SESSION_BEATS_PER_BAR) =>
  beatDuration(bpm) * beatsPerBar;

export const barAt = (elapsed: number, bpm = WAVE_SESSION_BPM) =>
  1 + Math.floor(Math.max(0, elapsed) / barDuration(bpm));

export const beatAt = (elapsed: number, bpm = WAVE_SESSION_BPM) =>
  1 + (Math.floor(Math.max(0, elapsed) / beatDuration(bpm)) % WAVE_SESSION_BEATS_PER_BAR);

/** Prochain bord de mesure laissant assez de marge au moteur (iOS: 60 ms). */
export const nextBarLaunch = (elapsed: number, minimumLead = 0.06, bpm = WAVE_SESSION_BPM) => {
  const bd = barDuration(bpm);
  const safe = Math.max(0, elapsed);
  const boundaryIndex = Math.max(1, Math.ceil((safe + Math.max(0, minimumLead)) / bd));
  const boundary = boundaryIndex * bd;
  return { delay: Math.max(minimumLead, boundary - safe), bar: boundaryIndex + 1 };
};

// ---------------------------------------------------------------------------
// Clips — WaveLiveClipKind / WaveLiveRepeatPolicy / WaveLiveClipPlaybackState
// ---------------------------------------------------------------------------

export type WaveClipKind = "loop" | "longTake" | "oneShot";

export const CLIP_KIND_LABEL: Record<WaveClipKind, string> = {
  loop: "LOOP",
  longTake: "PRISE LONGUE",
  oneShot: "ONE-SHOT",
};

export type WaveRepeatPolicy = 1 | 2 | 4 | -1; // -1 = forever (∞)

export const REPEAT_LABEL: Record<WaveRepeatPolicy, string> = {
  "1": "1×",
  "2": "2×",
  "4": "4×",
  "-1": "∞",
};

export const defaultRepeatFor = (kind: WaveClipKind): WaveRepeatPolicy =>
  kind === "loop" ? -1 : 1;

export const nextRepeat = (kind: WaveClipKind, current: WaveRepeatPolicy): WaveRepeatPolicy => {
  if (kind === "oneShot") return 1;
  if (kind === "longTake") {
    return current === 1 ? 2 : current === 2 ? 4 : 1;
  }
  return current === 1 ? 2 : current === 2 ? 4 : current === 4 ? -1 : 1;
};

export const repeatExtends = (next: WaveRepeatPolicy, current: WaveRepeatPolicy) => {
  if (next === current || current === -1) return false;
  return next === -1 || next > current;
};

export const repeatTotalDuration = (policy: WaveRepeatPolicy, singlePass: number) =>
  policy === -1 ? null : Math.max(0, singlePass) * policy;

export type WavePlaybackState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "queuedStart"; bar: number }
  | { kind: "playing" }
  | { kind: "unavailable"; reason: string };

export const playbackIsActive = (s: WavePlaybackState) =>
  s.kind === "queuedStart" || s.kind === "playing";

export const playbackStatusLabel = (s: WavePlaybackState): string => {
  switch (s.kind) {
    case "loading": return "CHARGEMENT";
    case "ready": return "PRÊT";
    case "queuedStart": return `ENTRE M${s.bar}`;
    case "playing": return "JOUE";
    case "unavailable": return "INDISPONIBLE";
  }
};

// ---------------------------------------------------------------------------
// Identités contributeurs — WaveContributorIdentity
// ---------------------------------------------------------------------------

export interface WaveContributor {
  id: string;
  displayName: string;
  handle: string; // "@pseudo"
  avatar: string | null;
}

export const usernameLabel = (c: WaveContributor) => {
  const h = c.handle.trim().replace(/^@+/, "");
  return h && !h.includes("@") && !/\s/.test(h) ? `@${h}` : "Anonyme";
};

export const WAVE_HOST: WaveContributor = {
  id: "host-ila",
  displayName: "Ila Vert",
  handle: "@ila.vert",
  avatar: "/avatars/wave/host.jpg",
};

export const WAVE_CONTRIBUTORS: WaveContributor[] = [
  { id: "local-viewer-1", displayName: "Maya Keys", handle: "@mayakeys", avatar: "/avatars/wave/MayaKeys.jpg" },
  { id: "local-viewer-2", displayName: "Nox Prime", handle: "@noxprime", avatar: "/avatars/wave/NoxPrime.jpg" },
  { id: "local-viewer-3", displayName: "Luna V", handle: "@lunav", avatar: "/avatars/wave/LunaV.jpg" },
  { id: "local-viewer-4", displayName: "Solis", handle: "@solis", avatar: "/avatars/wave/Solis.jpg" },
  { id: "local-viewer-5", displayName: "Nera Mix", handle: "@neramix", avatar: "/avatars/wave/NeraMix.jpg" },
  { id: "local-viewer-6", displayName: "Sami Low", handle: "@samilow", avatar: "/avatars/wave/SamiLow.jpg" },
  { id: "local-viewer-7", displayName: "Jade R", handle: "@jader", avatar: "/avatars/wave/JadeR.jpg" },
  { id: "local-viewer-8", displayName: "Noé Kit", handle: "@noekit", avatar: "/avatars/wave/NoeKit.jpg" },
];

export const contributorById = (id: string): WaveContributor =>
  WAVE_CONTRIBUTORS.find((c) => c.id === id) ?? WAVE_HOST;

// ---------------------------------------------------------------------------
// Descripteurs de clips — WaveLiveClipDescriptor
// ---------------------------------------------------------------------------

export interface WaveClipDescriptor {
  id: string;
  title: string;
  role: string; // DRUMS / BASSE / HARMONIE / VOIX / SYNTH / LEAD / FX / PERC
  contributor: WaveContributor;
  kind: WaveClipKind;
  durationSeconds: number;
  loopBars?: number;
  src: string; // chemin audio local (résolution privée)
}

export const clipDurationLabel = (d: WaveClipDescriptor) => {
  const t = Math.max(0, Math.round(d.durationSeconds));
  return t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : `${t} s`;
};

export const clipMusicalLength = (d: WaveClipDescriptor) =>
  d.loopBars ? `${d.loopBars} mesures` : clipDurationLabel(d);

export interface WaveLiveClip {
  descriptor: WaveClipDescriptor;
  playbackState: WavePlaybackState;
  repeatPolicy: WaveRepeatPolicy;
  isMuted: boolean;
  isSolo: boolean;
  locked?: boolean; // piste serveur verrouillée
}

// ---------------------------------------------------------------------------
// Propositions — WaveContributionStatus + WaveHostProposalPresentation
// ---------------------------------------------------------------------------

export type WaveContributionStatus =
  | "pending_review"
  | "accepted"
  | "inspiration"
  | "rejected"
  | "failed";

export const CONTRIBUTION_STATUS_LABEL: Record<WaveContributionStatus, string> = {
  pending_review: "À écouter",
  accepted: "Acceptée",
  inspiration: "Inspiration",
  rejected: "Refusée",
  failed: "Échec média",
};

export type WaveOfferMode = "track" | "composition" | "legacyTrack";

export interface WaveProposalComponent {
  descriptor: WaveClipDescriptor;
  hasMedia: boolean;
}

export interface WaveProposal {
  id: string;
  title: string;
  contributor: WaveContributor;
  status: WaveContributionStatus;
  offerMode: WaveOfferMode;
  parentVersionLabel?: string;
  revision?: number;
  components: WaveProposalComponent[];
  previewSrc?: string; // mix wet privé — jamais le stem
  hasCompleteManifest: boolean;
  createdAgoMin: number;
}

export const proposalSummaryLabel = (p: WaveProposal): string => {
  if (p.offerMode === "composition") {
    const parts = [
      "Composition",
      `${p.components.length} élément${p.components.length > 1 ? "s" : ""}`,
    ];
    if (p.parentVersionLabel) parts.push(p.parentVersionLabel);
    if (p.revision) parts.push(`R${p.revision}`);
    return parts.join(" · ");
  }
  const d = p.components[0]?.descriptor;
  if (!d) return p.offerMode === "legacyTrack" ? "Piste · format actuel" : "Piste";
  return p.offerMode === "legacyTrack"
    ? `Piste · ${clipMusicalLength(d)} · format actuel`
    : `${CLIP_KIND_LABEL[d.kind][0] + CLIP_KIND_LABEL[d.kind].slice(1).toLowerCase()} · ${clipMusicalLength(d)}`;
};

export const proposalCanAdoptWhole = (p: WaveProposal) =>
  p.offerMode === "composition" &&
  p.hasCompleteManifest &&
  p.components.length > 0 &&
  p.components.every((c) => c.hasMedia);

// ---------------------------------------------------------------------------
// Inbox — miroir de WaveLocalPublicInboxPack (19 items + 2 compositions)
// Fichiers locaux transcodés à 120 BPM ; les WAV Looperman de l'iOS restent
// des fichiers de test machine, le contrat est reproduit à l'identique.
// ---------------------------------------------------------------------------

const INBOX = "/audio/wave/inbox";
const COMP = "/audio/wave/compositions";

type InboxItemSeed = {
  slug: string;
  file: string;
  title: string;
  role: string;
  kind: WaveClipKind;
  bars?: number;
  seconds?: number;
};

const INBOX_SEEDS: InboxItemSeed[] = [
  { slug: "valse-romantique", file: `${INBOX}/valse-romantique.m4a`, title: "Valse romantique", role: "HARMONIE", kind: "loop", bars: 4 },
  { slug: "pad-et-flute", file: `${INBOX}/pad-et-flute.m4a`, title: "Pad et flûte", role: "HARMONIE", kind: "loop", bars: 8 },
  { slug: "pad-glitch", file: `${INBOX}/pad-glitch.m4a`, title: "Pad glitch", role: "HARMONIE", kind: "loop", bars: 8 },
  { slug: "stomper-love", file: `${INBOX}/stomper-love.m4a`, title: "Stomper love", role: "BASSE", kind: "loop", bars: 4 },
  { slug: "pulse-cyber", file: `${INBOX}/pulse-cyber.m4a`, title: "Pulse cyber", role: "SYNTH", kind: "loop", bars: 4 },
  { slug: "celtic-viking", file: `${INBOX}/celtic-viking.m4a`, title: "Celtic viking", role: "LEAD", kind: "loop", bars: 4 },
  { slug: "riff-taiga", file: `${INBOX}/riff-taiga.m4a`, title: "Riff taïga", role: "LEAD", kind: "loop", bars: 8 },
  { slug: "excuse", file: `${INBOX}/excuse.m4a`, title: "Excuse", role: "FX", kind: "loop", bars: 4 },
  { slug: "i-just-do-me", file: `${INBOX}/i-just-do-me.mp3`, title: "I just do me", role: "VOIX", kind: "longTake", seconds: 15 },
  { slug: "i-dont-know", file: `${INBOX}/i-dont-know.m4a`, title: "I don’t know", role: "VOIX", kind: "longTake", seconds: 16 },
  { slug: "in-the-game", file: `${INBOX}/in-the-game.m4a`, title: "In the game", role: "VOIX", kind: "longTake", seconds: 38 },
  { slug: "sati-drums-808", file: `${INBOX}/sati-drums-808.m4a`, title: "Sati drums 808", role: "DRUMS", kind: "loop", bars: 4 },
  { slug: "monzder-drums", file: `${INBOX}/monzder-drums.m4a`, title: "Monzder drums", role: "DRUMS", kind: "loop", bars: 8 },
  { slug: "top-loops-iii", file: `${INBOX}/top-loops-iii.m4a`, title: "Top loops III", role: "DRUMS", kind: "loop", bars: 8 },
  { slug: "trap-hip-hop", file: `${INBOX}/trap-hip-hop.m4a`, title: "Trap hip-hop", role: "DRUMS", kind: "loop", bars: 8 },
  { slug: "haytr-drums", file: `${INBOX}/haytr-drums.m4a`, title: "Haytr drums", role: "DRUMS", kind: "loop", bars: 8 },
  { slug: "percussion", file: `${INBOX}/percussion.m4a`, title: "Percussion", role: "PERC", kind: "loop", bars: 4 },
  { slug: "champion-drums", file: `${INBOX}/champion-drums.m4a`, title: "Champion drums", role: "DRUMS", kind: "loop", bars: 8 },
  { slug: "chillpop-beat", file: `${INBOX}/chillpop-beat.m4a`, title: "Chillpop beat", role: "DRUMS", kind: "loop", bars: 8 },
];

const COMP_SEEDS = [
  {
    slug: "nuit-violette",
    title: "Nuit violette",
    parentVersionLabel: "V1",
    revision: 1,
    preview: `${COMP}/nuit-violette-preview.m4a`,
    itemSlugs: ["pad-glitch", "pulse-cyber", "sati-drums-808"],
  },
  {
    slug: "lueur-nordique",
    title: "Lueur nordique",
    parentVersionLabel: "V1",
    revision: 2,
    preview: `${COMP}/lueur-nordique-preview.m4a`,
    itemSlugs: ["pad-et-flute", "celtic-viking", "percussion"],
  },
];

const itemDescriptor = (seed: InboxItemSeed, contributor: WaveContributor, id?: string): WaveClipDescriptor => ({
  id: id ?? `local-inbox-${seed.slug}`,
  title: seed.title,
  role: seed.role,
  contributor,
  kind: seed.kind,
  durationSeconds: seed.seconds ?? (seed.bars ?? 4) * barDuration(),
  loopBars: seed.kind === "loop" ? seed.bars ?? 4 : undefined,
  src: seed.file,
});

export const WAVE_INBOX_PROPOSALS: WaveProposal[] = [
  ...COMP_SEEDS.map((c, i): WaveProposal => {
    const contributor = WAVE_CONTRIBUTORS[i % WAVE_CONTRIBUTORS.length];
    return {
      id: `local-composition-demo-${c.slug}`,
      title: c.title,
      contributor,
      status: "pending_review",
      offerMode: "composition",
      parentVersionLabel: c.parentVersionLabel,
      revision: c.revision,
      components: c.itemSlugs.map((slug) => {
        const seed = INBOX_SEEDS.find((s) => s.slug === slug)!;
        return {
          descriptor: itemDescriptor(seed, contributor, `local-composition-demo-${c.slug}-component-${slug}`),
          hasMedia: true,
        };
      }),
      previewSrc: c.preview,
      hasCompleteManifest: true,
      createdAgoMin: 30 * (i + 1),
    };
  }),
  ...INBOX_SEEDS.map((seed, i): WaveProposal => {
    const contributor = WAVE_CONTRIBUTORS[i % WAVE_CONTRIBUTORS.length];
    return {
      id: `local-inbox-${seed.slug}`,
      title: seed.title,
      contributor,
      status: "pending_review",
      offerMode: "track",
      components: [{ descriptor: itemDescriptor(seed, contributor), hasMedia: true }],
      hasCompleteManifest: true,
      createdAgoMin: 90 * (INBOX_SEEDS.length - i),
    };
  }),
];

// ---------------------------------------------------------------------------
// Live set initial du Host — composition en cours sur la base House 120 La min
// ---------------------------------------------------------------------------

export const WAVE_ACT_BASE_TITLE = "Marée haute";
export const WAVE_ACT_BASE_SRC = "/audio/wave/base-full-mix.m4a";
export const WAVE_ACT_BASE_SECONDS = 16;

const hostDescriptor = (
  id: string,
  title: string,
  role: string,
  kind: WaveClipKind,
  src: string,
  bars?: number,
  seconds?: number,
): WaveClipDescriptor => ({
  id,
  title,
  role,
  contributor: WAVE_HOST,
  kind,
  durationSeconds: seconds ?? (bars ? bars * barDuration() : 8),
  loopBars: bars,
  src,
});

export const WAVE_HOST_SEED_CLIPS: WaveLiveClip[] = [
  {
    descriptor: hostDescriptor("host-drums", "Frappe de marée", "DRUMS", "loop", `${INBOX}/monzder-drums.m4a`, 8),
    playbackState: { kind: "ready" },
    repeatPolicy: -1,
    isMuted: false,
    isSolo: false,
  },
  {
    descriptor: hostDescriptor("host-bass", "Courant profond", "BASSE", "loop", `${INBOX}/host-bass-a.m4a`, 8),
    playbackState: { kind: "ready" },
    repeatPolicy: -1,
    isMuted: false,
    isSolo: false,
  },
  {
    descriptor: hostDescriptor("host-melody", "Écume harmonique", "HARMONIE", "loop", `${INBOX}/pad-glitch.m4a`, 8),
    playbackState: { kind: "ready" },
    repeatPolicy: -1,
    isMuted: false,
    isSolo: false,
  },
];

// ---------------------------------------------------------------------------
// Studio viewer — WaveViewerStudioModels
// ---------------------------------------------------------------------------

export const STUDIO_TAKE_BARS = [4, 8, 16, 32] as const;
export type StudioTakeBars = (typeof STUDIO_TAKE_BARS)[number];

export type StudioPhase =
  | "loading"
  | "ready"
  | "preparing"
  | "countIn"
  | "recording"
  | "rendering"
  | "review"
  | "submitting"
  | "failed";

export type StudioReviewMode = "baseOnly" | "ensemble" | "takeOnly";
export type StudioTakeOrigin = "mic" | "imported";

export const REVIEW_MODE_LABEL: Record<StudioReviewMode, string> = {
  baseOnly: "BASE",
  ensemble: "ENSEMBLE",
  takeOnly: "MA STEM",
};

export interface StudioProposal {
  id: string;
  title: string;
  status: WaveContributionStatus;
  createdAgoMin: number;
  takeBars: number;
  kind: WaveClipKind;
}

// ---------------------------------------------------------------------------
// Vocal FX — PlaceVocalEffectsModels (presets + autotune détaillé)
// ---------------------------------------------------------------------------

export type VocalEffectKind = "tune" | "reverb" | "eq" | "comp" | "delay" | "limiter";

export const EFFECT_KIND_LABEL: Record<VocalEffectKind, string> = {
  tune: "Tune",
  reverb: "Réverb",
  eq: "EQ",
  comp: "Comp",
  delay: "Delay",
  limiter: "Limiter",
};

export const EFFECT_KIND_COLOR: Record<VocalEffectKind, string> = {
  tune: "#00E5FF",
  reverb: "#7E44E3",
  eq: "#2FE6A6",
  comp: "#FFAB00",
  delay: "#FF2E92",
  limiter: "#FF2E3B",
};

export type VocalPresetId = "clean" | "warm" | "rap" | "trap" | "radio";

export interface VocalPreset {
  id: VocalPresetId;
  label: string;
  effects: VocalEffectKind[];
}

export const VOCAL_PRESETS: VocalPreset[] = [
  { id: "clean", label: "Clean", effects: ["eq", "comp"] },
  { id: "warm", label: "Warm", effects: ["eq", "comp", "reverb"] },
  { id: "rap", label: "Rap", effects: ["eq", "comp"] },
  { id: "trap", label: "Trap", effects: ["tune", "eq", "comp", "reverb"] },
  { id: "radio", label: "Radio", effects: ["eq", "comp", "reverb"] },
];

export const AUTOTUNE_KEYS = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"] as const;
export const AUTOTUNE_SCALES = [
  { id: "chromatic", label: "Chromatique" },
  { id: "major", label: "Majeure" },
  { id: "minor", label: "Mineur" },
] as const;
export const AUTOTUNE_RANGES = [
  { id: "wide", label: "Large" },
  { id: "bass", label: "Basse" },
  { id: "tenor", label: "Ténor" },
  { id: "alto", label: "Alto" },
  { id: "soprano", label: "Soprano" },
] as const;
export const AUTOTUNE_SPEEDS = [
  { id: "subtle", label: "Subtile" },
  { id: "medium", label: "Moyenne" },
  { id: "extreme", label: "Extrême" },
] as const;
export const AUTOTUNE_CLAMPS = [
  { id: "tight", label: "Serré" },
  { id: "loose", label: "Ample" },
  { id: "off", label: "Off" },
] as const;

export interface AutotuneSettings {
  key: (typeof AUTOTUNE_KEYS)[number];
  scale: (typeof AUTOTUNE_SCALES)[number]["id"];
  range: (typeof AUTOTUNE_RANGES)[number]["id"];
  speed: (typeof AUTOTUNE_SPEEDS)[number]["id"];
  clamp: (typeof AUTOTUNE_CLAMPS)[number]["id"];
  frequencyA: number; // Hz, défaut 440
  retune: number; // 0..1
  intensity: number; // 0..1
}

export const DEFAULT_AUTOTUNE: AutotuneSettings = {
  key: "A",
  scale: "minor",
  range: "wide",
  speed: "medium",
  clamp: "loose",
  frequencyA: 440,
  retune: 0.55,
  intensity: 0.6,
};

// Presets studio viewer (nommage iOS du panneau studio)
export const STUDIO_PRESETS = [
  { id: "clean" as VocalPresetId, label: "Clean" },
  { id: "warm" as VocalPresetId, label: "Warm" },
  { id: "rap" as VocalPresetId, label: "Devant", mappedId: "rap" as VocalPresetId },
  { id: "radio" as VocalPresetId, label: "Space", mappedId: "radio" as VocalPresetId },
];

// ---------------------------------------------------------------------------
// Mix — canaux, soundboard, deck
// ---------------------------------------------------------------------------

export interface MixChannel {
  id: string;
  label: string;
  kind: "mic" | "audio";
  gain: number; // 0..1
  muted: boolean;
  hostForcedMuted?: boolean;
}

export const SFX_PADS = [
  { id: "airhorn", label: "AIRHORN", src: "/audio/wave/sfx/airhorn.m4a", tint: "#FF2E3B" },
  { id: "ready", label: "ARE YOU READY", src: "/audio/wave/sfx/are-you-ready.aac", tint: "#FFAB00" },
  { id: "pipe", label: "PIPE", src: "/audio/wave/sfx/pipe.aac", tint: "#00E5FF" },
  { id: "kick", label: "KICK", src: "/audio/wave/loops/kick.m4a", tint: "#7E44E3" },
];

// ---------------------------------------------------------------------------
// Room meta + chat
// ---------------------------------------------------------------------------

export const WAVE_ROOM = {
  id: "room-la-wave",
  name: "La Wave",
  title: "La Wave — Marée haute",
  host: WAVE_HOST,
  viewersCount: 1284,
  followersCount: 3120,
  likesCount: 864,
  goldenLikesCount: 128,
  videoSrc: "/media/wave/wave-session.mp4",
};

export type WaveTab = "chat" | "mix" | "wave" | "coulisses";

export const WAVE_TABS: { id: WaveTab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "mix", label: "Mixeur" },
  { id: "wave", label: "Wave" },
  { id: "coulisses", label: "Invités" },
];

export interface WaveChatMessage {
  id: string;
  author: string;
  handle?: string;
  text: string;
  isHost?: boolean;
  isAgent?: boolean;
  agoSec: number;
}

export const WAVE_CHAT_SEED: WaveChatMessage[] = [
  { id: "c1", author: "Maya Keys", text: "La basse est lourde ce soir", agoSec: 52 },
  { id: "c2", author: "Nox Prime", text: "J’ai envoyé une proposition à l’instant", agoSec: 44 },
  { id: "c3", author: "Ila Vert", text: "Bienvenue dans la Wave — la clock tourne à 120", isHost: true, agoSec: 38 },
  { id: "c4", author: "Luna V", text: "Le pad glitch est incroyable", agoSec: 30 },
  { id: "c5", author: "Agent Wave", text: "Les propositions restent privées jusqu’à l’adoption du Host", isAgent: true, agoSec: 21 },
  { id: "c6", author: "Solis", text: "EN-FEU", agoSec: 12 },
];

export const WAVE_RULES = [
  "Propose des pistes courtes et propres : le Host les préécoute en privé avant de les intégrer.",
  "Tant qu’une proposition n’est pas adoptée, elle reste privée et hors du programme public.",
  "La clock tourne en continu : les lancements se calent sur la mesure suivante.",
];
