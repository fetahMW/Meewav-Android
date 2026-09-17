import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  AudioLines,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flag,
  Headphones,
  ListMusic,
  Lock,
  Mic,
  Music,
  Rocket,
  SlidersHorizontal,
  Upload,
  Video,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import type { RoomsHomeRoomType } from "../home/roomsHome.types";

type LaunchRoomSheetProps = {
  initialType?: RoomsHomeRoomType;
  closeRef?: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onLaunched?: (roomLabel: string) => void;
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

const GAMME_OPTIONS = [
  "Do majeur", "Do mineur", "Ré majeur", "Ré mineur", "Mi majeur", "Mi mineur",
  "Fa majeur", "Fa mineur", "Sol majeur", "Sol mineur", "La majeur", "La mineur",
  "Si majeur", "Si mineur",
];
const MESURE_OPTIONS = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"];

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

export default function LaunchRoomSheet({ initialType, closeRef, onClose, onLaunched }: LaunchRoomSheetProps) {
  const initialIndex = useMemo(() => {
    const index = LAUNCH_TABS.findIndex((tab) => tab.id === initialType);
    return index >= 0 ? index : 0;
  }, [initialType]);
  const [selectedTab, setSelectedTab] = useState(initialIndex);
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);

  /* Paramètres communs */
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [genre, setGenre] = useState("");
  const [gamme, setGamme] = useState("Do majeur");
  const [mesure, setMesure] = useState("4/4");
  const [monetization, setMonetization] = useState(false);
  const [regisseur, setRegisseur] = useState<"none" | "pending" | "confirmed">("none");
  const [cageCagnotte, setCageCagnotte] = useState(false);
  const [cageCadeau, setCageCadeau] = useState(false);
  const [loopExpanded, setLoopExpanded] = useState(false);
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({});

  /* Check-up */
  const [micState, setMicState] = useState<MicState>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [micTesting, setMicTesting] = useState(false);
  const [audioMode, setAudioMode] = useState<"Voix" | "Musique">("Voix");
  const [monitoring, setMonitoring] = useState(false);
  const [cameraSource, setCameraSource] = useState("Auto");
  const [videoQuality, setVideoQuality] = useState("Auto");
  const [networkOk] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const [canQuickPass] = useState(() => {
    try { return Boolean(window.sessionStorage.getItem(CHECKUP_STORAGE_KEY)); } catch { return false; }
  });

  const micStreamRef = useRef<MediaStream | null>(null);
  const micRafRef = useRef(0);
  const micContextRef = useRef<AudioContext | null>(null);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
  }, [micTesting, stopMic]);

  const markCheckupDone = useCallback(() => {
    try { window.sessionStorage.setItem(CHECKUP_STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
  }, []);

  const selectTab = (index: number) => {
    setSelectedTab(index);
    setStep(0);
    stopMic();
  };

  const goToStep = (next: number) => {
    if (next === 2) markCheckupDone();
    if (next !== 1) stopMic();
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
              <label className="launch-select"><span>Gamme</span>
                <select value={gamme} onChange={(event) => setGamme(event.target.value)}>
                  {GAMME_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="launch-select"><span>Mesure</span>
                <select value={mesure} onChange={(event) => setMesure(event.target.value)}>
                  {MESURE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <DottedSeparator />
            {monetizationRow}
            <DottedSeparator />
            {regisseurRow}
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
            <FieldLabel icon={Mic}>Titre du Tournoi</FieldLabel>
            <input className="launch-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre du Tournoi ou Championnat..." />
            <DottedSeparator />
            {regisseurRow}
            <DottedSeparator />
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
      {canQuickPass ? (
        <button type="button" className="launch-quick-pass" style={{ borderColor: `${accent}40`, color: accent }} onClick={() => goToStep(2)}>
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
        <span className="launch-chip">Casque</span>
        <span className={`launch-chip${networkOk ? " is-ok" : ""}`}>Réseau</span>
      </div>

      <div className="launch-module launch-module--static">
        <span className="launch-module__icon" style={{ color: accent }}><Headphones aria-hidden="true" size={18} /></span>
        <span className="launch-module__copy">
          <strong>Casque non détecté</strong>
          <small>Branche un casque pour éviter le Larsen.</small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={monitoring}
          className={`launch-switch${monitoring ? " is-on" : ""}`}
          style={monitoring ? { background: accent } : undefined}
          onClick={() => setMonitoring((value) => !value)}
          aria-label="Monitoring"
        >
          <span />
        </button>
      </div>

      <SectionTitle>MODE AUDIO</SectionTitle>
      <div className="launch-mode-grid">
        <button type="button" className={`launch-mode${audioMode === "Voix" ? " is-selected" : ""}`} style={audioMode === "Voix" ? { borderColor: accent } : undefined} onClick={() => setAudioMode("Voix")}>
          <strong>Rap / Voix</strong>
          <small>Filtre passe-haut, compresseur vocal actif</small>
        </button>
        <button type="button" className={`launch-mode${audioMode === "Musique" ? " is-selected" : ""}`} style={audioMode === "Musique" ? { borderColor: accent } : undefined} onClick={() => setAudioMode("Musique")}>
          <strong>Instrument</strong>
          <small>Spectre complet, DSP transparent</small>
        </button>
      </div>

      <SectionTitle>TEST MICRO</SectionTitle>
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
        {micState === "denied" ? <p className="launch-hint">Autorise le micro dans les réglages du site pour continuer.</p> : null}
        {micTesting ? <p className="launch-hint">{micLevel > 85 ? "Gain automatiquement réduit" : "Gain automatiquement augmenté"}</p> : null}
      </div>

      <SectionTitle>RÉSEAU</SectionTitle>
      <div className="launch-module launch-module--static">
        <span className="launch-module__icon" style={{ color: networkOk ? accent : "#ff6d6d" }}><Wifi aria-hidden="true" size={18} /></span>
        <span className="launch-module__copy"><strong>{networkLabel}</strong><small>{networkOk ? "Connexion stable détectée." : "Reconnecte-toi avant de lancer."}</small></span>
      </div>

      <SectionTitle>VIDÉO</SectionTitle>
      <div className="launch-selectors">
        <label className="launch-select"><span>Caméra</span>
          <select value={cameraSource} onChange={(event) => setCameraSource(event.target.value)}>
            <option>Auto</option><option>Avant</option><option>Arrière</option>
          </select>
        </label>
        <label className="launch-select"><span>Qualité</span>
          <select value={videoQuality} onChange={(event) => setVideoQuality(event.target.value)}>
            <option>Auto</option><option>Économie</option><option>Haute</option>
          </select>
        </label>
      </div>

      <ul className="launch-checklist">
        <li className="is-ok"><CheckCircle2 aria-hidden="true" size={16} /> Audio : {micState === "granted" ? "Micro détecté" : "Micro non testé"}</li>
        <li><CheckCircle2 aria-hidden="true" size={16} /> Casque : Non détecté</li>
        <li className={networkOk ? "is-ok" : ""}><CheckCircle2 aria-hidden="true" size={16} /> Réseau : {networkLabel}</li>
      </ul>

      <div className="launch-actions">
        <button type="button" className="launch-btn launch-btn--ghost" onClick={() => goToStep(0)}>Précédent</button>
        <button type="button" className="launch-btn launch-btn--accent" disabled={!isReady} style={{ background: isReady ? accent : undefined }} onClick={() => goToStep(2)}>Suivant</button>
      </div>
      {!isReady ? (
        <button type="button" className="launch-btn--skip" onClick={() => goToStep(2)}>Ignorer et continuer</button>
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
          <div><dt>Configuration</dt><dd>{isReady ? "Check-up validé" : "Check-up ignoré"}</dd></div>
          <div><dt>Monétisation</dt><dd>{monetization ? "Activée" : "Désactivée"}</dd></div>
        </dl>
      </div>
      <button type="button" className="launch-btn launch-btn--golive" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }} onClick={() => setLaunching(true)}>
        GO EN LIVE <Rocket aria-hidden="true" size={18} />
      </button>
      <button type="button" className="launch-btn--skip" onClick={() => setStep(1)}>← Retour au Check-up</button>
    </div>
  );

  return (
    <div className="launch-room-sheet" role="dialog" aria-modal="true" aria-label="Créer une Room">
      <header className="launch-room-sheet__header">
        <span className="launch-room-sheet__badge" style={{ background: accent }} aria-hidden="true" />
        <strong>Créer une Room</strong>
        <button type="button" ref={closeRef} aria-label="Fermer" onClick={onClose} style={{ color: accent }}>
          <X aria-hidden="true" size={20} />
        </button>
      </header>

      <nav className="launch-tabs" aria-label="Type de Room" style={{ scrollbarWidth: "none" }}>
        {LAUNCH_TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            className={index === selectedTab ? "is-active" : ""}
            style={index === selectedTab ? { color: tab.accent, borderColor: tab.accent, boxShadow: `0 0 12px ${tab.accent}55, inset 0 0 10px ${tab.accent}22` } : undefined}
            onClick={() => selectTab(index)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="launch-steps" aria-hidden="true">
        <span className={step === 0 ? "is-active" : ""}>1. IDENTITÉ</span>
        <ChevronRight size={16} />
        <span className={step === 1 ? "is-active" : ""}>2. CHECK-UP</span>
        <ChevronRight size={16} />
        <span className={step === 2 ? "is-active" : ""}>3. ACCÈS</span>
      </div>

      <div className="launch-room-sheet__body">
        {step === 0 ? renderIdentity() : step === 1 ? renderCheckup() : renderGoLive()}
        {step === 0 ? (
          <div className="launch-actions">
            <span />
            <button type="button" className="launch-btn launch-btn--accent" style={{ background: accent }} onClick={() => goToStep(1)}>Suivant</button>
          </div>
        ) : null}
      </div>

      {launching ? (
        <LaunchCountdown
          accent={accent}
          onCancel={() => setLaunching(false)}
          onComplete={() => {
            setLaunching(false);
            onClose();
            onLaunched?.(roomLabel);
          }}
        />
      ) : null}
    </div>
  );
}

function LaunchCountdown({ accent, onCancel, onComplete }: { accent: string; onCancel: () => void; onComplete: () => void }) {
  const [number, setNumber] = useState(3);
  const [showGo, setShowGo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const sfx = new Audio("/audio/3-2-1.aac");
    void sfx.play().catch(() => undefined);
    const vibrate = (pattern: number | number[]) => { try { navigator.vibrate?.(pattern); } catch { /* noop */ } };
    vibrate(40);
    const interval = window.setInterval(() => {
      if (cancelledRef.current) return;
      setNumber((current) => {
        if (current > 1) {
          vibrate(40);
          return current - 1;
        }
        window.clearInterval(interval);
        setShowGo(true);
        vibrate([60, 40, 120]);
        const impact = new Audio("/audio/impact-fx.aac");
        void impact.play().catch(() => undefined);
        window.setTimeout(() => { if (!cancelledRef.current) setFadeOut(true); }, 400);
        window.setTimeout(() => { if (!cancelledRef.current) onComplete(); }, 600);
        return current;
      });
    }, 1000);
    return () => {
      cancelledRef.current = true;
      window.clearInterval(interval);
      sfx.pause();
    };
  }, [onComplete]);

  return (
    <div className={`launch-countdown${fadeOut ? " is-fadeout" : ""}`} role="alert" aria-live="assertive">
      <p className="launch-countdown__init" style={{ color: accent }}>INITIALISATION DU FLUX...</p>
      {!showGo ? <p className="launch-countdown__label" style={{ color: accent }}>DIFFUSION LIVE DANS</p> : null}
      <div className="launch-countdown__center">
        {showGo ? (
          <span className="launch-countdown__go" style={{ color: accent, textShadow: `0 0 40px ${accent}99` }}>GO</span>
        ) : (
          <>
            <span key={number} className="launch-countdown__number" style={{ textShadow: `0 0 30px ${accent}80, 0 0 60px ${accent}4d` }}>{number}</span>
            <span key={`ring-${number}`} className="launch-countdown__ring" style={{ borderColor: `${accent}26` }} />
          </>
        )}
      </div>
      <button type="button" className="launch-countdown__cancel" onClick={() => { cancelledRef.current = true; onCancel(); }}>
        <X aria-hidden="true" size={14} /> ANNULER
      </button>
    </div>
  );
}
