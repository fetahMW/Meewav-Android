import { readCagePrograms, saveCageProgram, type CageProgram, type SavedCageProgram } from "../../../../../../shared-ui/cagePrograms";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  ArrowLeft,
  AudioLines,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crown,
  Flag,
  Gavel,
  Headphones,
  ListMusic,
  Lock,
  Mic,
  Music,
  Rocket,
  SlidersHorizontal,
  Swords,
  Timer,
  Trophy,
  Upload,
  UserPlus,
  Users,
  Video,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import GlobeLoading from "../../../../vendor/meewav-vinyl/src/GlobeLoading";
import type { RoomsHomeRoomType } from "../home/roomsHome.types";
import LaunchStudio, { type LaunchLayout, type LaunchStudioConfig } from "./LaunchStudio";

type LaunchRoomSheetProps = {
  initialType?: RoomsHomeRoomType;
  allowSkipCheckup?: boolean;
  closeRef?: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onLaunched?: (roomLabel: string, roomType: RoomsHomeRoomType, program?: CageProgram, studio?: LaunchStudioConfig) => void;
  initialProgram?: CageProgram;
};

type LaunchTab = { id: RoomsHomeRoomType; label: string; accent: string };

/* Ordre identique à l'iOS : Wave, Cage, Scène, Place, Loge, Classe. */
const LAUNCH_TABS: LaunchTab[] = [
  { id: "wave", label: "LA WAVE", accent: "#61d8ff" },
  { id: "cage", label: "LA CAGE", accent: "#e16e78" },
  { id: "scene", label: "LA SCÈNE", accent: "#8d5cff" },
  { id: "place", label: "LA PLACE", accent: "#45dfa8" },
  { id: "loge", label: "LA LOGE", accent: "#f6d381" },
  { id: "classe", label: "LA CLASSE", accent: "#5086ff" },
];
const recommendedLayout = (room: RoomsHomeRoomType): LaunchLayout => ({
  wave: "focus", cage: "duo", scene: "immersive", place: "immersive", loge: "immersive", classe: "presentation",
}[room]);

const GAMME_OPTIONS = [
  "Do majeur", "Do mineur", "Ré majeur", "Ré mineur", "Mi majeur", "Mi mineur",
  "Fa majeur", "Fa mineur", "Sol majeur", "Sol mineur", "La majeur", "La mineur",
  "Si majeur", "Si mineur",
];
const MESURE_OPTIONS = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"];

/* Formats La Cage — parité avec le séquenceur web (features/rooms/launch/cageLaunch.ts). */
type CageFormat = "tournament" | "championship" | "open-mic" | "open-mic-battle";
const CAGE_FORMAT_LABELS: Record<CageFormat, string> = {
  tournament: "Tournoi à élimination",
  championship: "Championnat · classement",
  "open-mic": "Open Mic · duels successifs",
  "open-mic-battle": "Open Mic Battle · le gagnant reste",
};
const CAGE_FORMAT_DESCRIPTIONS: Record<CageFormat, string> = {
  tournament: "Un tableau à élimination : chaque confrontation qualifie un gagnant vers le tour suivant, jusqu'à la finale.",
  championship: "Un calendrier de rencontres et un classement par victoires. Tous les participants conservent leurs rencontres ; les ex æquo restent visibles.",
  "open-mic-battle": "Deux artistes s'affrontent. Le gagnant reste sur scène, le perdant sort et le challenger suivant monte.",
  "open-mic": "Deux artistes par duel, chacun son tour au micro. Une nouvelle paire entre après le vote.",
};
const CAGE_FORMAT_META: Record<CageFormat, { icon: typeof Mic; tint: string; short: string; tagline: string }> = {
  tournament: { icon: Trophy, tint: "#e16e78", short: "Tournoi", tagline: "Élimination directe" },
  championship: { icon: Crown, tint: "#f6d381", short: "Championnat", tagline: "Classement par victoires" },
  "open-mic": { icon: Mic, tint: "#f0b27a", short: "Open Mic", tagline: "Duels successifs" },
  "open-mic-battle": { icon: Swords, tint: "#ff7a3d", short: "Open Mic Battle", tagline: "Le gagnant reste" },
};
const CAGE_FORMAT_ORDER: CageFormat[] = ["tournament", "championship", "open-mic", "open-mic-battle"];
const CAGE_TITLE_LABELS: Record<CageFormat, string> = {
  tournament: "Titre du Tournoi",
  championship: "Titre du Championnat",
  "open-mic": "Titre de l'Open Mic",
  "open-mic-battle": "Titre de l'Open Mic Battle",
};
const CAGE_ROSTER_LABELS = {
  prepared: "Participants du programme",
  "first-eligible": "Premiers inscrits éligibles",
  manual: "Sélection manuelle",
  random: "Tirage parmi les présents",
} as const;
const CAGE_FEEDBACK_LABELS = {
  appreciation: "Appréciation sans classement",
  scored: "Note du public avec classement",
  none: "Sans vote ni classement",
} as const;
const CAGE_FEEDBACK_NOTES: Record<keyof typeof CAGE_FEEDBACK_LABELS, string> = {
  appreciation: "Chaque viewer peut envoyer un soutien au passage. Aucun classement n'est calculé.",
  scored: "Chaque viewer attribue une note de 1 à 5. Le classement indique la moyenne et le nombre de notes ; les ex æquo sont conservés.",
  none: "À la fin du passage, la régie prépare la suite sans vote ni classement.",
};
const CAGE_PARTICIPANT_COUNTS = [2, 4, 8, 12, 16, 24, 32, 64];
const CAGE_PASSAGE_DURATIONS = [60, 90, 120, 180, 240, 300];
const CAGE_ROUND_COUNTS = [1, 2, 3, 5];

/* Contacts de la messagerie — miroir de demoContacts (messagingDemoData.ts). */
type JuryContact = { id: string; name: string; role: string; avatar: string; online: boolean };
const JURY_CONTACTS: JuryContact[] = [
  { id: "user_1", name: "Echo Flow", role: "Artiste", avatar: "/avatars/chanteur-rappeur.png", online: true },
  { id: "user_2", name: "Neon Pulse", role: "Beatmaker", avatar: "/avatars/beatmaker.png", online: false },
  { id: "user_3", name: "Stellar Vibe", role: "DJ / Producteur", avatar: "/avatars/dj.png", online: true },
  { id: "user_4", name: "Lisa Music", role: "Mixeur", avatar: "/avatars/ingenieur-son.png", online: false },
  { id: "user_5", name: "The Producer", role: "Producteur", avatar: "/avatars/compositeur.png", online: true },
  { id: "user_6", name: "Vocal Queen", role: "Artiste / Auteur", avatar: "/avatars/chanteuse-rappeuse.png", online: false },
];

const CHECKUP_STORAGE_KEY = "meewav-rooms-last-checkup";

type MicState = "idle" | "requesting" | "granted" | "denied";

function FieldLabel({ icon: Icon, children }: { icon: typeof Mic; children: string }) {
  return (
    <p className="launch-field__label">
      <Icon aria-hidden="true" size={18} />
      <span>{children}</span>
    </p>
  );
}

function DottedSeparator() {
  return <hr className="launch-separator" aria-hidden="true" />;
}

function SectionTitle({ children }: { children: string }) {
  return <p className="launch-section-title">{children}</p>;
}

type LaunchSelectOption = { value: string; label: string; disabled?: boolean };

function LaunchSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: LaunchSelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close, true);
    return () => window.removeEventListener("pointerdown", close, true);
  }, [open]);

  const current = options.find((option) => option.value === value)?.label ?? value;

  return (
    <div ref={rootRef} className={`launch-select launch-select--picker${open ? " is-open" : ""}`}>
      <span>{label}</span>
      <button
        type="button"
        className="launch-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <strong>{current}</strong>
        <ChevronDown aria-hidden="true" size={14} />
      </button>
      {open ? (
        <div className="launch-select__menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={`launch-select__option${option.value === value ? " is-selected" : ""}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              <span>{option.label}</span>
              {option.value === value ? <Check aria-hidden="true" size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function LaunchRoomSheet({ initialType, allowSkipCheckup = false, closeRef, onClose, onLaunched, initialProgram }: LaunchRoomSheetProps) {
  const initialIndex = useMemo(() => {
    const index = LAUNCH_TABS.findIndex((tab) => tab.id === initialType);
    return index >= 0 ? index : 0;
  }, [initialType]);
  const [selectedTab, setSelectedTab] = useState(initialIndex);
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [studio, setStudio] = useState<LaunchStudioConfig>({
    format: "landscape", camera: "front", portraitLayout: recommendedLayout(LAUNCH_TABS[initialIndex].id), landscapeLayout: recommendedLayout(LAUNCH_TABS[initialIndex].id), secondCamera: false, reversed: false,
  });

  /* Paramètres communs */
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [genre, setGenre] = useState("");
  const [gamme, setGamme] = useState("Do majeur");
  const [mesure, setMesure] = useState("4/4");
  const [monetization, setMonetization] = useState(false);
  const [regisseur, setRegisseur] = useState<"none" | "pending" | "confirmed">("none");
  const [juryIds, setJuryIds] = useState<string[]>([]);
  const [juryOpen, setJuryOpen] = useState(false);
  const [juryInvited, setJuryInvited] = useState(false);
  const [juryInviteSent, setJuryInviteSent] = useState(false);
  const [cageCagnotte, setCageCagnotte] = useState(false);
  const [cageCadeau, setCageCadeau] = useState(false);
  const [cageFormat, setCageFormat] = useState<CageFormat>("tournament");
  const [cageParticipants, setCageParticipants] = useState(16);
  const [cageRoster, setCageRoster] = useState<keyof typeof CAGE_ROSTER_LABELS>("manual");
  const [cageFeedback, setCageFeedback] = useState<keyof typeof CAGE_FEEDBACK_LABELS>("appreciation");
  const [cagePerfMode, setCagePerfMode] = useState<"successive" | "alternating" | "simultaneous">("successive");
  const [cageRounds, setCageRounds] = useState(1);
  const [cagePassageDuration, setCagePassageDuration] = useState(90);
  const [cageVoting, setCageVoting] = useState<"public" | "jury" | "mixed">("public");
  const [cageTieBreak, setCageTieBreak] = useState<"sudden-death" | "replay">("sudden-death");
  const [savedPrograms, setSavedPrograms] = useState<SavedCageProgram[]>([]);
  const [programPicker, setProgramPicker] = useState(false);
  const [programBusy, setProgramBusy] = useState(false);
  const [programNotice, setProgramNotice] = useState('');
  const [programId, setProgramId] = useState<string>();
  const [programRoster, setProgramRoster] = useState<string[]>([]);
  const [programMembers, setProgramMembers] = useState<{id: string; name: string}[]>([]);
  const [cageVoteDuration, setCageVoteDuration] = useState(60);
  const configuration = (): CageProgram => ({ version: 1, title: title.trim(), format: cageFormat,
    participantCount: cageParticipants, rosterMode: cageRoster, rosterProfileIds: programRoster, templateId: programId,
    rosterMembers: programMembers, rules: { rounds: cageRounds, passageDurationSeconds: cagePassageDuration,
      performanceMode: cagePerfMode, votingMode: cageVoting, votingDurationSeconds: cageVoteDuration,
      openMicFeedback: cageFeedback, tieBreak: cageTieBreak } });
  const applyProgram = (config: CageProgram, id?: string) => {
    setTitle(config.title); setCageFormat(config.format); setCageParticipants(Math.max(2, config.participantCount));
    setCageRoster(config.rosterMode as keyof typeof CAGE_ROSTER_LABELS); setProgramRoster(config.rosterProfileIds);
    setProgramMembers(config.rosterMembers ?? []); setCageRounds(config.rules.rounds);
    setCagePassageDuration(config.rules.passageDurationSeconds); setCagePerfMode(config.rules.performanceMode as typeof cagePerfMode);
    setCageVoting(config.rules.votingMode as typeof cageVoting); setCageVoteDuration(config.rules.votingDurationSeconds);
    setCageFeedback((config.rules.openMicFeedback ?? 'scored') as typeof cageFeedback);
    setCageTieBreak((config.rules.tieBreak ?? 'sudden-death') as typeof cageTieBreak);
    setProgramId(id ?? config.templateId); setProgramPicker(false); setProgramNotice('Programme chargé. Les présences seront vérifiées dans Invités.');
  };
  useEffect(() => { if (initialProgram) { applyProgram(initialProgram); setSelectedTab(1); } }, []);
  const loadPrograms = async () => {
    setProgramPicker(true); setProgramBusy(true); setProgramNotice('');
    try { setSavedPrograms(await readCagePrograms()); } catch (error) { setProgramNotice(String(error)); }
    finally { setProgramBusy(false); }
  };
  const saveProgram = async () => {
    if (!title.trim()) { setProgramNotice('Donne un nom au programme.'); return; }
    setProgramBusy(true);
    try { const saved = await saveCageProgram({ id: programId, configuration: configuration() }); setProgramId(saved.id); setProgramNotice('Programme enregistré dans Mes Cages sur ce téléphone.'); }
    catch (error) { setProgramNotice(String(error)); } finally { setProgramBusy(false); }
  };
  const [loopExpanded, setLoopExpanded] = useState(false);
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});

  /* Check-up */
  const [micState, setMicState] = useState<MicState>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [micTesting, setMicTesting] = useState(false);
  const [networkOk, setNetworkOk] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  useEffect(() => {
    const sync = () => setNetworkOk(navigator.onLine !== false);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  const [canQuickPass] = useState(() => {
    try { return Boolean(window.sessionStorage.getItem(CHECKUP_STORAGE_KEY)); } catch { return false; }
  });

  const micStreamRef = useRef<MediaStream | null>(null);
  const micRafRef = useRef(0);
  const micContextRef = useRef<AudioContext | null>(null);
  const tabsNavRef = useRef<HTMLElement | null>(null);

  const accent = LAUNCH_TABS[selectedTab].accent;
  const roomLabel = LAUNCH_TABS[selectedTab].label;
  const isReady = micState === "granted" && networkOk;

  const stopMic = useCallback(() => {
    if (micRafRef.current) window.cancelAnimationFrame(micRafRef.current);
    micRafRef.current = 0;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    void micContextRef.current?.close().catch(() => undefined);
    micContextRef.current = null;
    setMicTesting(false);
    setMicLevel(0);
  }, []);

  useEffect(() => () => stopMic(), [stopMic]);

  const startMicTest = useCallback(async () => {
    if (micTesting) { stopMic(); return; }
    setMicState("requesting");
    try {
      // The single check-up must authorize both tracks before the native room takes over.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: { ideal: studio.camera === "front" ? "user" : "environment" } },
      });
      micStreamRef.current = stream;
      const context = new AudioContext();
      micContextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      setMicState("granted");
      setMicTesting(true);
      const tick = () => {
        analyser.getByteTimeDomainData(buffer);
        let peak = 0;
        for (let index = 0; index < buffer.length; index += 1) {
          const value = Math.abs(buffer[index] - 128) / 128;
          if (value > peak) peak = value;
        }
        setMicLevel(Math.min(100, Math.round(peak * 140)));
        micRafRef.current = window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMicState("denied");
      setMicTesting(false);
    }
  }, [micTesting, stopMic, studio.camera]);

  const markCheckupDone = useCallback(() => {
    try { window.sessionStorage.setItem(CHECKUP_STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
  }, []);

  const selectTab = (index: number) => {
    setSelectedTab(index);
    setStudio(current => ({ ...current, portraitLayout: recommendedLayout(LAUNCH_TABS[index].id), landscapeLayout: recommendedLayout(LAUNCH_TABS[index].id), secondCamera: false, reversed: false }));
    setStep(0);
    stopMic();
  };

  /* Rail d'onglets auto-défilant : garde l'onglet précédent visible, révèle les suivants (comme les pill-tabs du Marketplace). */
  useEffect(() => {
    const nav = tabsNavRef.current;
    if (!nav || nav.children.length === 0) return;
    const tabWidth = (nav.children[0] as HTMLElement).offsetWidth || 1;
    const visibleCount = Math.max(1, Math.floor(nav.clientWidth / tabWidth));
    const firstVisible = Math.max(0, Math.min(selectedTab - 1, LAUNCH_TABS.length - visibleCount));
    const target = nav.children[firstVisible] as HTMLElement | undefined;
    if (!target) return;
    nav.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  }, [selectedTab]);


  const cageBracketSlots = cageFormat === "tournament" ? 2 ** Math.ceil(Math.log2(Math.max(cageParticipants, 2))) : cageParticipants;

  const selectCageFormat = (format: CageFormat) => {
    setCageFormat(format);
    setCageParticipants((count) => Math.max(count, 2));
  };

  const goToStep = (next: number) => {
    if (next > 0 && LAUNCH_TABS[selectedTab].id === "cage" && (!title.trim() || programRoster.length > cageParticipants)) { setProgramNotice(!title.trim() ? "Donne un nom au programme." : "La capacité est inférieure au nombre de participants préparés."); setStep(0); return; }
    if (next === 3) markCheckupDone();
    if (next !== 2) stopMic();
    setStep(next);
  };

  const toggleModule = (key: string) => setModuleStates((current) => ({ ...current, [key]: !current[key] }));

  const monetizationRow = (
    <div className="launch-toggle-row">
      <div className="launch-toggle-row__copy">
        <span>Monétisation</span>
        <small>Active les soutiens pendant le live.</small>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={monetization}
        className={`launch-switch${monetization ? " is-on" : ""}`}
        style={monetization ? { background: accent } : undefined}
        onClick={() => setMonetization((value) => !value)}
      >
        <span />
      </button>
    </div>
  );

  const regisseurRow = (
    <>
      <FieldLabel icon={Headphones}>Régisseur</FieldLabel>
      <button
        type="button"
        className={`launch-module launch-module--regisseur${regisseur === "confirmed" ? " is-confirmed" : ""}`}
        onClick={() => setRegisseur((state) => (state === "none" ? "pending" : state === "pending" ? "confirmed" : "none"))}
      >
        <span className="launch-module__icon" style={{ color: accent }}><Headphones aria-hidden="true" size={18} /></span>
        <span className="launch-module__copy">
          <strong>{regisseur === "none" ? "Choisir un régisseur" : regisseur === "pending" ? "Demande envoyée…" : "Régisseur confirmé"}</strong>
          <small>{regisseur === "confirmed" ? "Il pilotera le live avec toi." : "Optionnel — il gère le son et les transitions."}</small>
        </span>
        <ChevronRight aria-hidden="true" size={16} />
      </button>
    </>
  );

  const selectedJuryNames = JURY_CONTACTS.filter((contact) => juryIds.includes(contact.id)).map((contact) => contact.name);
  const juryRow = (
    <>
      <FieldLabel icon={Gavel}>Jury</FieldLabel>
      <button
        type="button"
        className={`launch-module launch-module--jury${juryIds.length > 0 ? " is-confirmed" : ""}`}
        onClick={() => setJuryOpen(true)}
      >
        <span className="launch-module__icon" style={{ color: accent }}><Gavel aria-hidden="true" size={18} /></span>
        <span className="launch-module__copy">
          <strong>{juryIds.length === 0 ? "Choisir un jury" : juryInviteSent ? `Jury invité · ${juryIds.length} membre${juryIds.length > 1 ? "s" : ""}` : `${juryIds.length} juré${juryIds.length > 1 ? "s" : ""} sélectionné${juryIds.length > 1 ? "s" : ""}`}</strong>
          <small>{juryIds.length === 0 ? "Optionnel — des jurés de ta messagerie ou par invitation." : selectedJuryNames.join(", ")}</small>
        </span>
        <ChevronRight aria-hidden="true" size={16} />
      </button>
    </>
  );

  const moduleButton = (key: string, icon: typeof Mic, label: string, hint: string) => (
    <button
      type="button"
      className={`launch-module${moduleStates[key] ? " is-open" : ""}`}
      style={{ borderColor: moduleStates[key] ? `${accent}55` : undefined }}
      onClick={() => toggleModule(key)}
    >
      <span className="launch-module__icon" style={{ color: accent }}>{(() => { const Icon = icon; return <Icon aria-hidden="true" size={18} />; })()}</span>
      <span className="launch-module__copy">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <ChevronRight aria-hidden="true" size={16} style={moduleStates[key] ? { transform: "rotate(90deg)" } : undefined} />
    </button>
  );

  const renderIdentity = () => {
    switch (LAUNCH_TABS[selectedTab].id) {
      case "wave":
        return (
          <>
            <FieldLabel icon={Music}>Titre du morceau</FieldLabel>
            <input className="launch-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex: Sunset Vibes" />
            <FieldLabel icon={AudioLines}>Genre musical</FieldLabel>
            <input className="launch-input" value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="Ex: Lo-Fi Hip Hop" />
            <DottedSeparator />
            <FieldLabel icon={SlidersHorizontal}>Caractéristiques</FieldLabel>
            <div className="launch-selectors">
              <label className="launch-select launch-select--static"><span>BPM</span><strong>120</strong></label>
              <LaunchSelect label="Gamme" value={gamme} options={GAMME_OPTIONS.map((option) => ({ value: option, label: option }))} onChange={setGamme} />
              <LaunchSelect label="Mesure" value={mesure} options={MESURE_OPTIONS.map((option) => ({ value: option, label: option }))} onChange={setMesure} />
            </div>
            <DottedSeparator />
            {monetizationRow}
            <DottedSeparator />
            {regisseurRow}
            <DottedSeparator />
            {juryRow}
            <DottedSeparator />
            <FieldLabel icon={Zap}>Boucle d'Amorçage</FieldLabel>
            <button type="button" className="launch-module launch-module--loop" onClick={() => setLoopExpanded((value) => !value)}>
              <span className="launch-module__icon"><Zap aria-hidden="true" size={18} /></span>
              <span className="launch-module__copy"><strong>Boucle d'Amorçage</strong><small>Le fond sonore qui accueille tes auditeurs.</small></span>
              <ChevronRight aria-hidden="true" size={16} style={loopExpanded ? { transform: "rotate(90deg)" } : undefined} />
            </button>
            {loopExpanded ? (
              <div className="launch-module__children">
                <button type="button" className="launch-module__child" onClick={() => undefined}>Choisir une boucle MeeWav</button>
                <button type="button" className="launch-module__child" onClick={() => undefined}><Upload aria-hidden="true" size={14} /> Uploader ma boucle</button>
              </div>
            ) : null}
          </>
        );
      case "cage":
        return (
          <>
            <div className="launch-actions">
              <button type="button" className="launch-btn launch-btn--ghost" onClick={() => void loadPrograms()}>Mes programmes</button>
              <button type="button" disabled={programBusy} className="launch-btn launch-btn--ghost" onClick={() => void saveProgram()}>Enregistrer</button>
            </div>
            <p className="launch-hint">Prépare un nouveau programme ici ou charge celui de ton profil. Les artistes se gèrent ensuite dans Invités.</p>
            {programNotice ? <p className="launch-hint" role="status">{programNotice}</p> : null}
            <FieldLabel icon={Trophy}>{CAGE_TITLE_LABELS[cageFormat]}</FieldLabel>
            <input className="launch-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`${CAGE_TITLE_LABELS[cageFormat]}...`} />
            <DottedSeparator />
            <FieldLabel icon={Trophy}>Format</FieldLabel>
            <div className="launch-format-grid" role="radiogroup" aria-label="Format">
              {CAGE_FORMAT_ORDER.map((format) => {
                const meta = CAGE_FORMAT_META[format];
                const Icon = meta.icon;
                const active = cageFormat === format;
                return (
                  <button
                    key={format}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`launch-format${active ? " is-active" : ""}`}
                    style={active ? { borderColor: `${meta.tint}99`, boxShadow: `0 0 18px ${meta.tint}38, inset 0 0 14px ${meta.tint}12`, background: `${meta.tint}14` } : undefined}
                    onClick={() => selectCageFormat(format)}
                  >
                    <span className="launch-format__icon" style={active ? { color: meta.tint, background: `${meta.tint}1f`, borderColor: `${meta.tint}55` } : undefined}>
                      <Icon aria-hidden="true" size={18} />
                    </span>
                    <span className="launch-format__copy">
                      <strong style={active ? { color: meta.tint } : undefined}>{meta.short}</strong>
                      <small>{meta.tagline}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="launch-hint">{CAGE_FORMAT_LABELS[cageFormat]} — {CAGE_FORMAT_DESCRIPTIONS[cageFormat]}</p>
            <div className="launch-selectors">
              <LaunchSelect
                label="Participants"
                value={String(cageParticipants)}
                options={CAGE_PARTICIPANT_COUNTS.map((count) => ({ value: String(count), label: `${count} participant${count > 1 ? "s" : ""}` }))}
                onChange={(value) => setCageParticipants(Number(value))}
              />
              <LaunchSelect
                label="Choix des participants"
                value={cageRoster}
                options={Object.entries(CAGE_ROSTER_LABELS).map(([value, label]) => ({ value, label }))}
                onChange={(value) => setCageRoster(value as keyof typeof CAGE_ROSTER_LABELS)}
              />
            </div>
            {cageFormat === "tournament" && cageBracketSlots > cageParticipants ? (
              <p className="launch-hint">{cageParticipants} participants · tableau de {cageBracketSlots} places · {cageBracketSlots - cageParticipants} exemptions automatiques au premier tour.</p>
            ) : null}
            <DottedSeparator />
            <>

                <FieldLabel icon={Users}>Règlement des rencontres</FieldLabel>
                <div className="launch-selectors">
                  <LaunchSelect
                    label="Performances"
                    value={cagePerfMode}
                    options={[
                      { value: "successive", label: "Passages successifs" },
                      { value: "alternating", label: "Performances alternées" },
                      { value: "simultaneous", label: "Duel simultané" },
                    ]}
                    onChange={(value) => setCagePerfMode(value as typeof cagePerfMode)}
                  />
                  <LaunchSelect
                    label="Manches par rencontre"
                    value={String(cageRounds)}
                    options={CAGE_ROUND_COUNTS.map((count) => ({ value: String(count), label: `${count} manche${count > 1 ? "s" : ""}` }))}
                    onChange={(value) => setCageRounds(Number(value))}
                  />
                </div>
                <div className="launch-selectors">
                  <LaunchSelect
                    label="Décision des rencontres"
                    value={cageVoting}
                    options={[
                      { value: "public", label: "Vote du public" },
                      { value: "jury", label: "Jury" },
                      { value: "mixed", label: "Public et jury" },
                    ]}
                    onChange={(value) => setCageVoting(value as typeof cageVoting)}
                  />
                  <LaunchSelect
                    label="Égalité"
                    value={cageTieBreak}
                    options={[
                      { value: "sudden-death", label: "Sudden Death · nouvelle manche" },
                      { value: "replay", label: "Rejouer la rencontre" },
                    ]}
                    onChange={(value) => setCageTieBreak(value as typeof cageTieBreak)}
                  />
                </div>
              </>
            <div className="launch-selectors">
              <LaunchSelect
                label="Durée d'un passage"
                value={String(cagePassageDuration)}
                options={[...new Set([...CAGE_PASSAGE_DURATIONS, cagePassageDuration])].sort((a, b) => a - b).map((seconds) => ({ value: String(seconds), label: `${seconds} secondes` }))}
                onChange={(value) => setCagePassageDuration(Number(value))}
              />
              {<LaunchSelect
                label="Durée du vote"
                value={String(cageVoteDuration)}
                options={[...new Set([15, 30, 45, 60, 90, 120, 180, 300, cageVoteDuration])].sort((a, b) => a - b).map(seconds => ({ value: String(seconds), label: `${seconds} secondes` }))}
                onChange={value => setCageVoteDuration(Number(value))}
              />}
            </div>
            <DottedSeparator />
            {regisseurRow}
            <DottedSeparator />
            {cageVoting !== "public" && <p className="launch-hint">Choisis jusqu’à 6 jurés dans Invités → Jury avant d’ouvrir le vote.</p>}
            <FieldLabel icon={SlidersHorizontal}>Options</FieldLabel>
            <div className="launch-checkbox-row">
              <button type="button" role="checkbox" aria-checked={cageCagnotte} className={`launch-checkbox${cageCagnotte ? " is-on" : ""}`} style={cageCagnotte ? { borderColor: accent, color: accent } : undefined} onClick={() => setCageCagnotte((value) => !value)}>Cagnotte</button>
              <button type="button" role="checkbox" aria-checked={cageCadeau} className={`launch-checkbox${cageCadeau ? " is-on" : ""}`} style={cageCadeau ? { borderColor: accent, color: accent } : undefined} onClick={() => setCageCadeau((value) => !value)}>Cadeau</button>
            </div>
            {moduleButton("twists", Zap, "Twists du tournoi", "Ajoute des retournements de situation.")}
          </>
        );
      case "scene":
        return (
          <>
            <FieldLabel icon={Music}>Titre du show</FieldLabel>
            <input className="launch-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre du show" />
            <FieldLabel icon={AudioLines}>Description (Optionnelle)</FieldLabel>
            <input className="launch-input" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Description (Optionnelle)" />
            <DottedSeparator />
            {monetizationRow}
            <DottedSeparator />
            {regisseurRow}
            <DottedSeparator />
            {juryRow}
            <DottedSeparator />
            <SectionTitle>🎬 SCÉNARIO DU LIVE (OPTIONNEL)</SectionTitle>
            <p className="launch-hint">Programme des moments clés avant de monter sur scène.</p>
            {moduleButton("support", Flag, "Programmer un Objectif de Soutien", "Fixe un palier à atteindre pendant le live.")}
          </>
        );
      case "place":
        return (
          <>
            <FieldLabel icon={Music}>Titre de la session</FieldLabel>
            <input className="launch-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre de la session" />
            <FieldLabel icon={AudioLines}>Accroche (optionnel)</FieldLabel>
            <input className="launch-input" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Accroche (optionnel)" />
            <DottedSeparator />
            {monetizationRow}
            <DottedSeparator />
            {regisseurRow}
            <DottedSeparator />
            {juryRow}
            <DottedSeparator />
            <FieldLabel icon={Flag}>Objectif de Soutien</FieldLabel>
            {moduleButton("goal", Flag, "Paramétrer un Objectif de Soutien", "Un palier communautaire pour ta place.")}
          </>
        );
      case "loge":
        return (
          <>
            <FieldLabel icon={Music}>Titre de la session</FieldLabel>
            <input className="launch-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre de la session" />
            <FieldLabel icon={AudioLines}>Thème / Accroche (optionnel)</FieldLabel>
            <input className="launch-input" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Thème / Accroche (optionnel)..." />
            <DottedSeparator />
            {monetizationRow}
            <DottedSeparator />
            {regisseurRow}
            <DottedSeparator />
            {juryRow}
            <DottedSeparator />
            <FieldLabel icon={ListMusic}>Préparation de la Loge</FieldLabel>
            {moduleButton("jukebox", ListMusic, "Charger une Playlist pour le Jukebox", "L'ambiance sonore de ton salon.")}
            {moduleButton("question", Mic, "Question Sans Tabou", "Lance une question à ta communauté.")}
          </>
        );
      case "classe":
        return (
          <>
            <FieldLabel icon={Music}>Titre du cours</FieldLabel>
            <input className="launch-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre du cours" />
            <FieldLabel icon={AudioLines}>Description des objectifs</FieldLabel>
            <textarea className="launch-input launch-input--area" rows={4} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Description des objectifs..." />
            <DottedSeparator />
            {monetizationRow}
            <DottedSeparator />
            {regisseurRow}
            <DottedSeparator />
            {juryRow}
            <DottedSeparator />
            <FieldLabel icon={BookOpen}>Matériel pédagogique</FieldLabel>
            {moduleButton("resource", Upload, "Upload la ressource de référence", "PDF, partition ou fichier audio du cours.")}
          </>
        );
      default:
        return null;
    }
  };

  const networkLabel = networkOk ? "Connecté" : "Hors ligne";
  const micStatusLabel = micState === "denied"
    ? "Accès refusé"
    : micTesting
      ? (micLevel > 85 ? "SATURATION" : micLevel > 8 ? "OK" : "TROP FAIBLE")
      : micState === "granted" ? "OK" : "Non testé";

  const renderCheckup = () => (
    <>
      {allowSkipCheckup && canQuickPass ? (
        <button type="button" className="launch-quick-pass" style={{ borderColor: `${accent}40`, color: accent }} onClick={() => goToStep(3)}>
          <Zap aria-hidden="true" size={18} />
          <span>Entrée rapide — config précédente</span>
          <ChevronRight aria-hidden="true" size={14} />
        </button>
      ) : null}

      <div className={`launch-checkup-status${isReady ? " is-ready" : ""}`}>
        <CheckCircle2 aria-hidden="true" size={20} />
        <div className="launch-checkup-status__copy">
          <strong>{isReady ? "Tout est prêt" : "Vérifie ton installation"}</strong>
          <span>{isReady ? "PRÊT" : "À CORRIGER"}</span>
        </div>
        <span className={`launch-chip${networkOk ? " is-ok" : ""}`}>Réseau</span>
      </div>

      <SectionTitle>CAMÉRA ET MICRO</SectionTitle>
      <div className="launch-mic">
        <div className="launch-mic__row">
          <span>Niveau</span>
          <strong className={micTesting && micLevel > 85 ? "is-hot" : ""}>{micStatusLabel}</strong>
        </div>
        <div className="launch-mic__meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={micLevel}>
          <span style={{ width: `${micLevel}%`, background: micLevel > 85 ? "#ff6d6d" : accent }} />
        </div>
        <button type="button" className="launch-btn launch-btn--ghost" onClick={() => void startMicTest()}>
          {micTesting ? "Arrêter le test" : micState === "requesting" ? "Autorisation…" : "Tester le micro"}
        </button>
        {micState === "denied" ? <p className="launch-hint">Autorise la caméra et le micro dans les réglages du téléphone pour continuer.</p> : null}
        {micTesting ? <p className="launch-hint">{micLevel > 85 ? "Gain automatiquement réduit" : "Gain automatiquement augmenté"}</p> : null}
      </div>

      <SectionTitle>RÉSEAU</SectionTitle>
      <div className="launch-module launch-module--static">
        <span className="launch-module__icon" style={{ color: networkOk ? accent : "#ff6d6d" }}><Wifi aria-hidden="true" size={18} /></span>
        <span className="launch-module__copy"><strong>{networkLabel}</strong><small>{networkOk ? "Connexion stable détectée." : "Reconnecte-toi avant de lancer."}</small></span>
      </div>

      <ul className="launch-checklist">
        <li className={micState === "granted" ? "is-ok" : ""}><CheckCircle2 aria-hidden="true" size={16} /> Image et audio : {micState === "granted" ? "Caméra et micro détectés" : "Non testés"}</li>
        <li className={networkOk ? "is-ok" : ""}><CheckCircle2 aria-hidden="true" size={16} /> Réseau : {networkLabel}</li>
      </ul>

      <div className="launch-actions">
        <button type="button" className="launch-btn launch-btn--ghost" onClick={() => goToStep(1)}>Précédent</button>
        <button type="button" className="launch-btn launch-btn--accent" disabled={!isReady} style={{ background: isReady ? accent : undefined }} onClick={() => goToStep(3)}>Suivant</button>
      </div>
      {allowSkipCheckup && !isReady ? (
        <button type="button" className="launch-btn--skip" onClick={() => goToStep(3)}>Ignorer et continuer</button>
      ) : null}
    </>
  );

  const renderGoLive = () => (
    <div className="launch-golive">
      <div className="launch-golive__hero">
        <CheckCircle2 aria-hidden="true" size={64} style={{ color: accent }} />
        <strong>Prêt à lancer</strong>
        <span style={{ color: accent }}>{roomLabel}</span>
      </div>
      <div className="launch-summary" style={{ borderColor: `${accent}4d` }}>
        <span>Résumé</span>
        <dl>
          <div><dt>Room</dt><dd>{roomLabel}</dd></div>
          {LAUNCH_TABS[selectedTab].id === "cage" ? (
            <>
              <div><dt>Format</dt><dd>{CAGE_FORMAT_LABELS[cageFormat]}</dd></div>
              <div><dt>Participants</dt><dd>{cageParticipants} · {CAGE_ROSTER_LABELS[cageRoster]}</dd></div>
            </>
          ) : null}
          <div><dt>Configuration</dt><dd>{isReady ? "Check-up validé" : "Check-up ignoré"}</dd></div>
          <div><dt>Image</dt><dd>{studio.format === "portrait" ? "Mobile · 9:16" : "Paysage · 16:9"}</dd></div>
          <div><dt>Caméra</dt><dd>{studio.camera === "front" ? "Avant" : "Arrière"}</dd></div>
          {studio.secondCamera ? <div><dt>Caméra 2</dt><dd>Aperçu local uniquement</dd></div> : null}
          <div><dt>Monétisation</dt><dd>{monetization ? "Activée" : "Désactivée"}</dd></div>
        </dl>
      </div>
      <button type="button" className="launch-btn launch-btn--golive" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }} onClick={() => { stopMic(); setLaunching(true); }}>
        Accéder à la room <Rocket aria-hidden="true" size={18} />
      </button>
      <button type="button" className="launch-btn--skip" onClick={() => setStep(2)}>← Retour au Check-up</button>
    </div>
  );

  return (
    <main className="launch-room-sheet" aria-label="Créer une Room" style={{ "--launch-accent": accent } as CSSProperties}>
      <header className="launch-room-sheet__header">
        <button type="button" ref={closeRef} aria-label="Retour aux Rooms" onClick={onClose}>
          <ArrowLeft aria-hidden="true" size={21} />
        </button>
        <strong>Ouvrir une Room</strong>
        <span className="launch-room-sheet__badge" style={{ background: accent }} aria-hidden="true" />
      </header>

      <nav ref={tabsNavRef} className="launch-tabs" aria-label="Type de Room" style={{ scrollbarWidth: "none" }}>
        {LAUNCH_TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            className={index === selectedTab ? "is-active" : ""}
            style={index === selectedTab ? { color: tab.accent, borderColor: `${tab.accent}66` } : undefined}
            onClick={() => selectTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="launch-steps" aria-label={`Étape ${step + 1} sur 4 : ${["Identité", "Studio", "Vérification", "Revue"][step]}`}>
        <span className="launch-steps__current">{["Identité", "Studio", "Vérification", "Revue"][step]}</span>
        <span className="launch-steps__count">{step + 1} / 4</span>
        <i className="launch-steps__track" aria-hidden="true"><b style={{ width: `${(step + 1) * 25}%` }} /></i>
      </div>

      <div className="launch-room-sheet__body">
        {step === 0 ? renderIdentity() : step === 1 ? <LaunchStudio value={studio} onChange={setStudio} /> : step === 2 ? renderCheckup() : renderGoLive()}
        {step === 0 ? (
          <div className="launch-actions">
            <span />
            <button type="button" className="launch-btn launch-btn--accent" style={{ background: accent }} onClick={() => goToStep(1)}>Configurer l’écran</button>
          </div>
        ) : null}
        {step === 1 ? <div className="launch-actions"><button type="button" className="launch-btn launch-btn--ghost" onClick={() => goToStep(0)}>Précédent</button><button type="button" className="launch-btn launch-btn--accent" style={{ background: accent }} onClick={() => goToStep(2)}>Continuer</button></div> : null}
      </div>

      {juryOpen ? (
        <div className="launch-jury" role="dialog" aria-modal="true" aria-label="Choisir un jury">
          <header className="launch-jury__header">
            <strong>Choisir un jury</strong>
            <button type="button" aria-label="Fermer" onClick={() => setJuryOpen(false)} style={{ color: accent }}>
              <X aria-hidden="true" size={18} />
            </button>
          </header>
          <p className="launch-jury__hint">Sélectionne des jurés parmi tes contacts de messagerie, ou envoie-leur une invitation.</p>
          <div className="launch-jury__list">
            {JURY_CONTACTS.map((contact) => {
              const selected = juryIds.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  className={`launch-jury__contact${selected ? " is-selected" : ""}`}
                  style={selected ? { borderColor: `${accent}88`, background: `${accent}12` } : undefined}
                  onClick={() => setJuryIds((current) => current.includes(contact.id) ? current.filter((id) => id !== contact.id) : [...current, contact.id])}
                >
                  <span className="launch-jury__avatar">
                    <img src={contact.avatar} alt="" loading="lazy" />
                    <i className={contact.online ? "is-online" : ""} aria-hidden="true" />
                  </span>
                  <span className="launch-jury__meta">
                    <strong>{contact.name}</strong>
                    <small>{contact.role} · {contact.online ? "en ligne" : "hors ligne"}</small>
                  </span>
                  <span className="launch-jury__check" style={selected ? { background: accent, borderColor: accent } : undefined} aria-hidden="true">
                    {selected ? <Check size={12} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="launch-jury__invite"
            onClick={() => setJuryInvited((value) => !value)}
          >
            <UserPlus aria-hidden="true" size={16} />
            <span>{juryInvited ? "Invitation prête — elle partira à l'ouverture de la room" : "Inviter quelqu'un qui n'est pas dans tes contacts"}</span>
          </button>
          <div className="launch-jury__footer">
            <button
              type="button"
              className="launch-btn launch-btn--accent"
              style={{ background: accent }}
              onClick={() => {
                if (juryIds.length > 0 || juryInvited) setJuryInviteSent(true);
                setJuryOpen(false);
              }}
            >
              {juryIds.length > 0 ? `Envoyer ${juryIds.length} invitation${juryIds.length > 1 ? "s" : ""}` : "Valider"}
            </button>
          </div>
        </div>
      ) : null}

      {programPicker ? <div className="launch-jury" role="dialog" aria-modal="true" aria-label="Mes programmes">
        <header className="launch-jury__header"><strong>Mes programmes</strong><button onClick={() => setProgramPicker(false)} aria-label="Fermer"><X size={18}/></button></header>
        <div className="launch-jury__list">
          {programBusy ? <p>Chargement…</p> : savedPrograms.length === 0 ? <p>Aucun programme enregistré sur ce téléphone.</p> : savedPrograms.map(entry => <button key={entry.id} className="launch-jury__contact" onClick={() => applyProgram(entry.configuration, entry.id)}><span><strong>{entry.configuration.title}</strong><small>{CAGE_FORMAT_LABELS[entry.configuration.format]} · {entry.configuration.participantCount} places</small></span><ChevronRight size={18}/></button>)}
          {programNotice ? <p role="status">{programNotice}</p> : null}
        </div></div> : null}
      {launching ? (
        <LaunchVinylTransition
          roomLabel={roomLabel}
          onCancel={() => setLaunching(false)}
          onComplete={() => {
            setLaunching(false);
            onLaunched?.(title.trim() || roomLabel, LAUNCH_TABS[selectedTab].id, LAUNCH_TABS[selectedTab].id === "cage" ? configuration() : undefined, studio);
          }}
        />
      ) : null}
    </main>
  );
}

const LAUNCH_TRANSITION_MS = 2200;

function LaunchVinylTransition({ roomLabel, onCancel, onComplete }: { roomLabel: string; onCancel: () => void; onComplete: () => void }) {
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = window.setTimeout(() => { if (!cancelledRef.current) onCompleteRef.current(); }, LAUNCH_TRANSITION_MS);
    return () => {
      cancelledRef.current = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="launch-transition" role="alert" aria-live="assertive">
      <GlobeLoading label={`Ouverture de ${roomLabel}…`} />
      <button type="button" className="launch-transition__cancel" onClick={() => { cancelledRef.current = true; onCancel(); }}>
        <X aria-hidden="true" size={14} /> ANNULER
      </button>
    </div>
  );
}
