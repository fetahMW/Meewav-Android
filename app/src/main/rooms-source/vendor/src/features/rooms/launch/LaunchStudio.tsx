import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, Copy, FlipHorizontal2, LayoutTemplate, RefreshCw, Smartphone, Monitor, Video } from "lucide-react";

export type LaunchFormat = "portrait" | "landscape";
export type LaunchLayout = "safe" | "immersive" | "split" | "pip" | "duo" | "interview" | "presentation" | "focus";
export type LaunchCamera = "front" | "back";
export type LaunchStudioConfig = {
  format: LaunchFormat;
  camera: LaunchCamera;
  portraitLayout: LaunchLayout;
  landscapeLayout: LaunchLayout;
  secondCamera: boolean;
  reversed: boolean;
};

const PRESETS: { id: LaunchLayout; title: string; detail: string }[] = [
  { id: "safe", title: "Portrait entier", detail: "Image non recadrée" },
  { id: "immersive", title: "Solo + partage", detail: "Sujet principal en grand" },
  { id: "split", title: "Caméra + contenu", detail: "Deux zones côte à côte" },
  { id: "pip", title: "Caméra en coin", detail: "Une source en incrustation" },
  { id: "duo", title: "Duo", detail: "Deux sources à égalité" },
  { id: "interview", title: "Interview", detail: "Une source mise en avant" },
  { id: "presentation", title: "Présentation", detail: "Contenu prioritaire" },
  { id: "focus", title: "Focus caméra", detail: "Caméra prioritaire" },
];

type Props = { value: LaunchStudioConfig; onChange: (next: LaunchStudioConfig) => void };

export default function LaunchStudio({ value, onChange }: Props) {
  const primaryRef = useRef<HTMLVideoElement>(null);
  const secondaryRef = useRef<HTMLVideoElement>(null);
  const primaryStream = useRef<MediaStream | null>(null);
  const secondaryStream = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [secondReady, setSecondReady] = useState(false);
  const [notice, setNotice] = useState("");
  const layout = value.format === "portrait" ? value.portraitLayout : value.landscapeLayout;
  const update = (patch: Partial<LaunchStudioConfig>) => onChange({ ...value, ...patch });
  const stop = () => {
    primaryStream.current?.getTracks().forEach(track => track.stop());
    secondaryStream.current?.getTracks().forEach(track => track.stop());
    primaryStream.current = null;
    secondaryStream.current = null;
    setPreview(false);
    setSecondReady(false);
  };
  useEffect(() => () => {
    primaryStream.current?.getTracks().forEach(track => track.stop());
    secondaryStream.current?.getTracks().forEach(track => track.stop());
  }, []);
  useEffect(() => {
    if (primaryRef.current) primaryRef.current.srcObject = primaryStream.current;
    if (secondaryRef.current) secondaryRef.current.srcObject = secondaryStream.current;
  }, [preview, secondReady, value.format, layout]);

  const start = async (camera = value.camera, second = value.secondCamera) => {
    stop();
    setBusy(true);
    setNotice("");
    try {
      const first = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: camera === "front" ? "user" : "environment" } }, audio: false });
      primaryStream.current = first;
      setPreview(true);
      if (second) {
        try {
          const other = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: camera === "front" ? "environment" : "user" } }, audio: false });
          const firstId = first.getVideoTracks()[0]?.getSettings().deviceId;
          const otherId = other.getVideoTracks()[0]?.getSettings().deviceId;
          if (firstId && otherId && firstId === otherId) throw new Error("Même caméra");
          secondaryStream.current = other;
          setSecondReady(true);
        } catch {
          secondaryStream.current?.getTracks().forEach(track => track.stop());
          secondaryStream.current = null;
          setSecondReady(false);
          update({ secondCamera: false });
          setNotice("Deux caméras simultanées ne sont pas disponibles sur cet appareil. L’aperçu reste sur une caméra.");
        }
      }
    } catch {
      setNotice("Caméra indisponible. Autorise son accès dans les réglages du téléphone.");
    } finally {
      setBusy(false);
    }
  };
  const changeCamera = (camera: LaunchCamera) => {
    update({ camera });
    if (preview) void start(camera, value.secondCamera);
  };
  const toggleSecond = () => {
    const enabled = !value.secondCamera;
    update({ secondCamera: enabled, ...(enabled && layout === "safe" ? value.format === "portrait" ? { portraitLayout: "pip" as const } : { landscapeLayout: "pip" as const } : {}) });
    if (preview) void start(value.camera, enabled);
  };
  const selectLayout = (selected: LaunchLayout) => update(value.format === "portrait" ? { portraitLayout: selected } : { landscapeLayout: selected });

  return <section className="launch-studio" aria-label="Studio de lancement">
    <div className="launch-studio__intro"><span>STUDIO · APERÇU PRIVÉ</span><h2>Compose ton écran</h2><p>Prépare le cadrage et la disposition avant d’entrer dans la Green Room.</p></div>
    <div className="launch-studio__formats" role="group" aria-label="Format de l’aperçu">
      <button type="button" className={value.format === "portrait" ? "is-active" : ""} onClick={() => update({ format: "portrait" })}><Smartphone size={17} /> Mobile <small>9:16</small></button>
      <button type="button" className={value.format === "landscape" ? "is-active" : ""} onClick={() => update({ format: "landscape" })}><Monitor size={17} /> Paysage <small>16:9</small></button>
    </div>
    <div className={`launch-studio__canvas launch-studio__canvas--${value.format} launch-studio__canvas--${layout}${value.reversed ? " is-reversed" : ""}`}>
      <div className="launch-studio__source launch-studio__source--primary">{preview ? <video ref={primaryRef} autoPlay muted playsInline /> : <Camera size={30} />}<span>CAMÉRA PRINCIPALE</span></div>
      {layout !== "safe" ? <div className="launch-studio__source launch-studio__source--secondary">{secondReady ? <video ref={secondaryRef} autoPlay muted playsInline /> : <Video size={22} />}<span>{secondReady ? "CAMÉRA 2" : "ZONE LIBRE"}</span></div> : null}
      <span className="launch-studio__private">Aperçu local</span>
    </div>
    <div className="launch-studio__preview-actions">
      <button type="button" onClick={() => preview ? stop() : void start()} disabled={busy}>{preview ? <CameraOff size={16} /> : <Camera size={16} />}{busy ? "Ouverture…" : preview ? "Couper l’aperçu" : "Activer l’aperçu"}</button>
      <button type="button" onClick={() => void start()} disabled={!preview || busy} aria-label="Actualiser l’aperçu"><RefreshCw size={16} /></button>
    </div>
    {notice ? <p className="launch-studio__notice" role="status">{notice}</p> : null}
    <div className="launch-studio__section"><LayoutTemplate size={17} /><strong>Mise en page</strong><span>Indépendante pour chaque format</span></div>
    <div className="launch-studio__presets" role="radiogroup" aria-label="Mise en page">
      {PRESETS.map(preset => <button type="button" key={preset.id} role="radio" aria-checked={layout === preset.id} className={layout === preset.id ? "is-active" : ""} onClick={() => selectLayout(preset.id)}><i className={`launch-studio__diagram launch-studio__diagram--${preset.id}`}><b /><b /></i><span><strong>{preset.title}</strong><small>{preset.detail}</small></span>{layout === preset.id ? <Check size={15} /> : null}</button>)}
    </div>
    <div className="launch-studio__tools">
      <button type="button" onClick={() => update({ reversed: !value.reversed })}><FlipHorizontal2 size={17} /> Inverser les zones</button>
      <button type="button" onClick={() => update(value.format === "portrait" ? { landscapeLayout: value.portraitLayout } : { portraitLayout: value.landscapeLayout })}><Copy size={17} /> Copier vers l’autre format</button>
    </div>
    <div className="launch-studio__section"><Camera size={17} /><strong>Sources</strong></div>
    <div className="launch-studio__camera"><span>Caméra principale</span><div><button type="button" className={value.camera === "front" ? "is-active" : ""} onClick={() => changeCamera("front")}>Avant</button><button type="button" className={value.camera === "back" ? "is-active" : ""} onClick={() => changeCamera("back")}>Arrière</button></div></div>
    <button type="button" className={`launch-studio__second${value.secondCamera ? " is-active" : ""}`} aria-pressed={value.secondCamera} onClick={toggleSecond}><span><strong>Deuxième caméra</strong><small>Essai simultané avant le direct</small></span><i aria-hidden="true" /></button>
    {value.secondCamera ? <p className="launch-studio__notice">La deuxième source est prévisualisée ici. Le direct Android diffuse actuellement la caméra principale ; la composition à deux caméras n’est pas encore raccordée au flux RTC.</p> : null}
  </section>;
}
