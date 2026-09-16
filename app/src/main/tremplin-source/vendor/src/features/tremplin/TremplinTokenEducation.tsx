import { ArrowDownUp, ArrowRight, ChevronRight, Heart, Info, PlayCircle, Radio, Clapperboard, Globe2, Sparkles, ShieldCheck } from "lucide-react";
import { useId, useMemo, useState, type CSSProperties } from "react";
import TremplinGradeProgression from "./TremplinGradeProgression";
import { SCENE_ROUTE } from "../shorts/sceneContract";
import { trackTremplinEvent } from "./tremplinAnalytics";
import { tremplinArtists } from "./tremplinArtistData";
import {
  TREMPLIN_EDUCATIONAL_SUMMARY_FIXTURE,
} from "./tremplinProductModel";
import "./tremplin-curve-explainer.css";
import "./tremplin-token-education.css";
import "./tremplin-discovery-guide.css";
import "./tremplin-follow-guide.css";
import "./tremplin-token-guide.css";
import "./tremplin-education-surfaces.css";

type EducationalOperation = "buy" | "sell";
const euros = (value: number) => new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

const tokens = (value: number) => new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: value < 10 ? 2 : 1,
  maximumFractionDigits: 2,
}).format(value);

const EDUCATIONAL_CURVE = {
  floorPriceEur: 1.02,
  slopeEurPerToken: 0.002,
  circulatingSupply: 1_200,
  heldTokens: 48,
  buyFeeRate: 0.025,
  resaleFeeRate: 0.035,
} as const;

const curvePrice = (supply: number) => (
  EDUCATIONAL_CURVE.floorPriceEur + EDUCATIONAL_CURVE.slopeEurPerToken * Math.max(0, supply)
);

const curveIntegral = (fromSupply: number, toSupply: number) => {
  const lower = Math.max(0, Math.min(fromSupply, toSupply));
  const upper = Math.max(0, Math.max(fromSupply, toSupply));
  return (
    EDUCATIONAL_CURVE.floorPriceEur * (upper - lower)
    + (EDUCATIONAL_CURVE.slopeEurPerToken / 2) * (upper ** 2 - lower ** 2)
  );
};

const quantityForBudget = (budgetEur: number, supply: number) => {
  const priceNow = curvePrice(supply);
  return Math.max(0, (
    -priceNow
    + Math.sqrt(priceNow ** 2 + 2 * EDUCATIONAL_CURVE.slopeEurPerToken * Math.max(0, budgetEur))
  ) / EDUCATIONAL_CURVE.slopeEurPerToken);
};

const markerPosition = (position: number): CSSProperties => ({
  left: `${position}%`,
  bottom: `${7 + 87 * (position / 100) ** 2.1}%`,
});

export function TremplinCurveExplainer({ compact = false }: { compact?: boolean }) {
  const chartId = useId().replace(/:/g, "");
  const [operation, setOperation] = useState<EducationalOperation>("buy");
  const [amountEur, setAmountEur] = useState(50);
  const [resaleTokens, setResaleTokens] = useState(12);
  const simulation = useMemo(() => {
    const valueBeforeEur = curvePrice(EDUCATIONAL_CURVE.circulatingSupply);

    if (operation === "buy") {
      const feesEur = amountEur * EDUCATIONAL_CURVE.buyFeeRate;
      const amountAppliedToCurveEur = Math.max(0, amountEur - feesEur);
      const estimatedTokens = quantityForBudget(amountAppliedToCurveEur, EDUCATIONAL_CURVE.circulatingSupply);
      const supplyAfter = EDUCATIONAL_CURVE.circulatingSupply + estimatedTokens;
      return {
        valueBeforeEur,
        valueAfterEur: curvePrice(supplyAfter),
        feesEur,
        estimatedTokens,
        grossEur: amountEur,
        netEur: amountEur,
        resaleShare: 0,
        positionAfter: Math.min(90, 61 + estimatedTokens / 5.8),
      };
    }

    const safeResaleTokens = Math.min(EDUCATIONAL_CURVE.heldTokens, Math.max(0, resaleTokens));
    const supplyAfter = Math.max(0, EDUCATIONAL_CURVE.circulatingSupply - safeResaleTokens);
    const grossEur = curveIntegral(supplyAfter, EDUCATIONAL_CURVE.circulatingSupply);
    const feesEur = grossEur * EDUCATIONAL_CURVE.resaleFeeRate;
    return {
      valueBeforeEur,
      valueAfterEur: curvePrice(supplyAfter),
      feesEur,
      estimatedTokens: safeResaleTokens,
      grossEur,
      netEur: Math.max(0, grossEur - feesEur),
      resaleShare: safeResaleTokens / EDUCATIONAL_CURVE.heldTokens,
      positionAfter: Math.max(35, 61 - safeResaleTokens / 1.85),
    };
  }, [amountEur, operation, resaleTokens]);

  const beforePosition = 61;

  return (
    <section className={`tremplin-curve-explainer is-${operation} ${compact ? "is-compact" : ""}`} aria-labelledby={compact ? undefined : "curve-explainer-title"}>
      <div className="tremplin-curve-explainer__copy">
        <span className="tremplin-kicker">Évolution de la valeur</span>
        <h2 id={compact ? undefined : "curve-explainer-title"}>Comprendre ce qui fait varier la valeur.</h2>
        <p>La valeur dépend des achats et des reventes de jetons selon une formule prédéfinie. Elle ne mesure ni la qualité artistique ni le grade de l’artiste.</p>
        <div className="tremplin-curve-explainer__switch" aria-label="Choisir une opération à simuler">
          <button type="button" className={operation === "buy" ? "is-active" : ""} aria-pressed={operation === "buy"} onClick={() => setOperation("buy")}>Simuler un achat</button>
          <button type="button" className={operation === "sell" ? "is-active" : ""} aria-pressed={operation === "sell"} onClick={() => setOperation("sell")}>Simuler une revente</button>
        </div>
        <label className="tremplin-curve-explainer__range">
          <span>
            <b>{operation === "buy" ? "Montant de l’achat" : "Quantité de jetons revendue"}</b>
            <strong>{operation === "buy" ? euros(amountEur) : `${tokens(resaleTokens)} jetons · ${Math.round((resaleTokens / EDUCATIONAL_CURVE.heldTokens) * 100)} %`}</strong>
          </span>
          {operation === "buy" ? (
            <input aria-label="Montant pédagogique de l’achat en euros" type="range" min="10" max="500" step="5" value={amountEur} onChange={(event) => setAmountEur(Number(event.target.value))} />
          ) : (
            <input aria-label="Quantité pédagogique de jetons revendue" type="range" min="0.5" max={EDUCATIONAL_CURVE.heldTokens} step="0.5" value={resaleTokens} onChange={(event) => setResaleTokens(Number(event.target.value))} />
          )}
          <small>{operation === "buy" ? "Les frais illustratifs sont déduits avant application au mécanisme de calcul." : `Quantité détenue dans cet exemple : ${tokens(EDUCATIONAL_CURVE.heldTokens)} jetons. Aucun euro n’est saisi pour revendre.`}</small>
        </label>
      </div>

      <div className="tremplin-curve-explainer__visual">
        <div className="tremplin-curve-explainer__plot">
          <span className="tremplin-curve-explainer__axis is-y">Valeur d’un jeton</span>
          <svg viewBox="0 0 620 310" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={`${chartId}-curve-fill`} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#6650cf" stopOpacity="0.04" />
                <stop offset="1" stopColor="#9980ff" stopOpacity="0.32" />
              </linearGradient>
              <linearGradient id={`${chartId}-curve-line`} x1="0" x2="1"><stop offset="0" stopColor="#6677dc" stopOpacity=".48" /><stop offset=".62" stopColor="#9d80ff" /><stop offset="1" stopColor={operation === "buy" ? "#98edc2" : "#f29caf"} /></linearGradient>
            </defs>
            <path className="tremplin-curve-explainer__grid" d="M24 76H596 M24 143H596 M24 210H596 M24 276H596" />
            <path className="tremplin-curve-explainer__area" d="M24 276 C160 270 250 238 334 194 C434 142 484 78 596 28 L596 290 L24 290 Z" fill={`url(#${chartId}-curve-fill)`} />
            <path className="tremplin-curve-explainer__curve" d="M24 276 C160 270 250 238 334 194 C434 142 484 78 596 28" stroke={`url(#${chartId}-curve-line)`} />
          </svg>
          <span className="tremplin-curve-explainer__marker is-before" style={markerPosition(beforePosition)}><i />Avant</span>
          <span className={`tremplin-curve-explainer__marker is-after is-${operation}`} style={markerPosition(simulation.positionAfter)}><i />Après</span>
          <span className={`tremplin-curve-explainer__direction is-${operation}`}><ArrowDownUp />{operation === "buy" ? "Achat : la valeur peut augmenter" : "Revente : la valeur peut diminuer"}</span>
          <span className="tremplin-curve-explainer__axis is-x">Jetons en circulation</span>
        </div>
        <dl aria-live="polite">
          <div><dt>Valeur avant</dt><dd>{euros(simulation.valueBeforeEur)}</dd></div>
          <div><dt>Valeur estimée après</dt><dd>{euros(simulation.valueAfterEur)}</dd></div>
          <div><dt>{operation === "buy" ? "Jetons estimés" : "Jetons revendus"}</dt><dd>{operation === "buy" ? tokens(simulation.estimatedTokens) : `${tokens(simulation.estimatedTokens)} · ${Math.round(simulation.resaleShare * 100)} %`}</dd></div>
          <div><dt>Frais illustratifs</dt><dd>{euros(simulation.feesEur)}</dd></div>
          <div><dt>{operation === "buy" ? "Montant saisi" : "Net estimé reçu"}</dt><dd>{euros(simulation.netEur)}</dd></div>
        </dl>
        <small><Info /> Simulation pédagogique uniquement. Le serveur recalcule et vérifie chaque opération réelle. Aucun prix ni gain n’est prédit. Taux illustratifs : {operation === "buy" ? "2,5 %" : "3,5 %"}.</small>
      </div>
    </section>
  );
}

const DISCOVERY_CHANNELS = [
  {
    id: "rooms",
    icon: Radio,
    title: "Les 6 Rooms",
    detail: "Six espaces en direct pour voir les artistes jouer, créer et échanger.",
    action: "Voir les prochaines Rooms",
    route: "/rooms",
  },
  {
    id: "scene",
    icon: Clapperboard,
    title: "La Scène",
    detail: "Un flux 100 % musique pour découvrir leurs créations et leurs performances.",
    action: "Explorer La Scène",
    route: SCENE_ROUTE,
  },
  {
    id: "globe",
    icon: Globe2,
    title: "Le Globe",
    detail: "Une carte pour trouver des artistes près de toi ou ailleurs.",
    action: "Ouvrir le Globe",
    route: "/globe",
  },
] as const;

const TOKEN_EDUCATION_DETAILS = [
  {
    id: "purchase",
    title: "Ce que tu achètes réellement",
    copy: "Tu achètes des jetons numériques associés à un artiste. Il ne s’agit pas d’un don classique. Une partie du montant est destinée à l’artiste et la répartition complète est visible avant la confirmation.",
  },
  {
    id: "value",
    title: "Comment la valeur évolue",
    copy: "La valeur dépend des achats et des reventes effectués sur MeeWav. Elle peut monter ou baisser. Une hausse passée ne garantit aucune hausse future.",
  },
  {
    id: "resale",
    title: "Comment fonctionne la revente",
    copy: "Les jetons peuvent être proposés à la revente selon les règles du service. Des délais ou des frais supplémentaires peuvent s’appliquer et la revente peut ne pas être immédiate.",
  },
  {
    id: "rights",
    title: "Ce que le jeton ne donne pas",
    copy: "Le jeton ne donne aucun droit sur l’artiste, son image, ses chansons, ses œuvres ou ses droits d’auteur. Aucun résultat financier n’est garanti.",
  },
] as const;

const MEEWAV_ECOSYSTEM_VIDEO_SRC = "/media/tremplin/ecosysteme-meewav.mp4";

type TremplinTokenEducationProps = {
  onDiscover: () => void;
  onHome: () => void;
  onOpenRoute: (route: string) => void;
};

/** One mobile reading surface; optional details expand in place. */
export default function TremplinTokenEducation({ onDiscover, onOpenRoute }: TremplinTokenEducationProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  return <article className="tremplin-guide" aria-labelledby="tremplin-guide-title">
    <header className="tg-intro">
      <span>LE TREMPLIN, SIMPLEMENT</span>
      <h1 id="tremplin-guide-title">Découvre. Suis. Soutiens.</h1>
      <p>La musique d’abord. Tu choisis jusqu’où tu veux aller.</p>
    </header>
    <figure className="tg-illustration" role="img" aria-label="Jeton de talent MeeWav en verre violet, posé sur la roche" />
    <ol className="tg-steps">
      <li id="tremplin-discovery"><span aria-hidden="true"><Sparkles size={19} /></span><div><h2>Découvre un talent</h2><p>Écoute sa musique et explore son projet.</p></div></li>
      <li id="tremplin-follow"><span aria-hidden="true"><Heart size={19} /></span><div><h2>Suis-le gratuitement</h2><p>Retrouve ses créations et ses rendez-vous dans Mes artistes.</p></div></li>
      <li><span aria-hidden="true"><ShieldCheck size={19} /></span><div><h2>Soutiens si tu le souhaites</h2><p>Certains artistes proposent un jeton de talent payant. L’achat reste facultatif.</p></div></li>
    </ol>
    <p className="tg-essential">Le prix peut baisser. Aucun gain n’est garanti et la revente peut prendre du temps.</p>
    <button type="button" className="tg-primary" onClick={() => { trackTremplinEvent("how_it_works_completed"); onDiscover(); }}>Découvrir les artistes <ArrowRight size={18} /></button>
    <div className="tg-details">
      <details onToggle={event => setVideoOpen(event.currentTarget.open)}>
        <summary><PlayCircle size={18} /><span>En vidéo · 1 min 40</span><ChevronRight size={17} /></summary>
        <div className="tg-answer">{videoOpen && <video controls playsInline preload="metadata" poster={tremplinArtists[0].artwork} aria-label="Présentation de MeeWav"><source src={MEEWAV_ECOSYSTEM_VIDEO_SRC} type="video/mp4" />Ton navigateur ne peut pas lire cette vidéo.</video>}</div>
      </details>
      <details>
        <summary><span>Où trouver les artistes ?</span><ChevronRight size={17} /></summary>
        <div className="tg-answer tg-destinations">{DISCOVERY_CHANNELS.map(({id,icon: Icon,title,detail,route}) => <button key={id} type="button" onClick={() => onOpenRoute(route)}><Icon size={20} /><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={16} /></button>)}</div>
      </details>
      <details id="tremplin-grades" tabIndex={-1}>
        <summary><span>À quoi servent les grades ?</span><ChevronRight size={17} /></summary>
        <div className="tg-answer"><TremplinGradeProgression id="tremplin-grade-explanation">
          <p className="tg-career">Un parcours professionnel antérieur peut être reconnu après vérification. Dès le niveau 2, une demande de jeton est possible ; MeeWav reste libre de l’accepter ou de la refuser.</p>
        </TremplinGradeProgression></div>
      </details>
      <details id="tremplin-token-mw" tabIndex={-1}>
        <summary><span>Comment fonctionnent les jetons ?</span><ChevronRight size={17} /></summary>
        <div className="tg-answer">
          {TOKEN_EDUCATION_DETAILS.map(detail => <section key={detail.id}><h3>{detail.title}</h3><p>{detail.copy}</p></section>)}
          <section className="tg-example"><h3>Avant de confirmer, tout est affiché.</h3><p>Un exemple de récapitulatif, sans transaction :</p><dl>
            <div><dt>Montant choisi</dt><dd>{euros(TREMPLIN_EDUCATIONAL_SUMMARY_FIXTURE.amountCents / 100)}</dd></div>
            <div><dt>Jetons estimés</dt><dd>{new Intl.NumberFormat('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2}).format(TREMPLIN_EDUCATIONAL_SUMMARY_FIXTURE.estimatedTokenHundredths / 100)} jetons</dd></div>
            <div><dt>Frais</dt><dd>{euros(TREMPLIN_EDUCATIONAL_SUMMARY_FIXTURE.feesCents / 100)}</dd></div>
            <div><dt>Part de l’artiste</dt><dd>{euros(TREMPLIN_EDUCATIONAL_SUMMARY_FIXTURE.artistShareCents / 100)}</dd></div>
            <div><dt>Total débité</dt><dd>{euros(TREMPLIN_EDUCATIONAL_SUMMARY_FIXTURE.totalDebitCents / 100)}</dd></div>
            <div><dt>Revente</dt><dd>{TREMPLIN_EDUCATIONAL_SUMMARY_FIXTURE.resaleLabel}</dd></div>
          </dl></section>
        </div>
      </details>
    </div>
  </article>;
}
