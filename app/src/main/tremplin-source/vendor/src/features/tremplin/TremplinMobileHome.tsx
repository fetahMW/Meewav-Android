import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, ChevronRight, CirclePlay, Heart, Pause, Play, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { TremplinPublicHomeProps } from './TremplinPublicHome';
import { tremplinArtists } from './tremplinArtistData';
import { getTremplinTokenLifecycleStage, isPublicTremplinTalent } from './tremplinProductModel';
import { getTremplinArtistToken } from './tremplinTokenData';
import { formatTremplinTokenPrice } from './tremplinDiscoveryToken';
import { getTremplinProjectSnapshot } from './tremplinProjectData';
import { getTremplinProfessionLabel } from './tremplinRoleData';
import { TREMPLIN_HOME_TOKEN_STATUS_UI } from './tremplinHomeTokenStatus';
import { MeewavGradeBadge } from '../grades/MeewavGradeBadge';
import { getGradeBadgeMeta, type GradeLevel } from '../grades/gradeBadges';
import { trackTremplinEvent } from './tremplinAnalytics';

const artists = tremplinArtists.filter(isPublicTremplinTalent);
const levels: GradeLevel[] = [1, 2, 3, 4, 5, 6];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR');
const steps = [
  ['Repère un talent', 'Écoute ses créations et découvre son univers.'],
  ['Découvre son parcours', 'Projets, collaborations et grade : des repères concrets.'],
  ['Donne-lui de la force', 'Suis-le gratuitement. Le soutien payant reste facultatif.'],
];
const stepIcons = [CirclePlay, Sparkles, Heart];

/** Mobile composition, using the Web artists, lifecycle rules and route callbacks. */
export default function TremplinMobileHome(props: TremplinPublicHomeProps) {
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState<'steps' | 'rules' | GradeLevel | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const followed = artists.filter(artist => props.followedArtistIds.has(artist.id)).slice(0, 3);
  const featured = [...artists.filter(artist => artist.editorialSelection), ...artists.filter(artist => !artist.editorialSelection)].slice(0, 6);
  const results = query.trim().length < 2 ? [] : artists.filter(artist => normalize([artist.name, artist.city, ...artist.styles, getTremplinArtistToken(artist.id)?.symbol, getTremplinProjectSnapshot(artist).headline].join(' ')).includes(normalize(query.trim()))).slice(0, 5);
  useEffect(() => {
    if (sheet !== null) {
      previousFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
    } else {
      if (dialog.current?.open) dialog.current.close();
      previousFocus.current?.focus({ preventScroll: true });
    }
  }, [sheet]);
  const go = (action: () => void) => { dialog.current?.close(); setSheet(null); action(); };
  const openArtist = (artist: typeof artists[number]) => {
    trackTremplinEvent('artist_path_opened', { artistId: artist.id, source: 'mobile-home' });
    props.onOpenArtist(artist);
  };
  return <div className="tm-home">
    <section className="tm-hero" aria-labelledby="tm-title">
      <img src="/images/tremplin/tremplin-home-talents-v2.png" alt="Des artistes créent leur musique chez eux" fetchPriority="high" />
      <div className="tm-hero-copy">
        <span className="tm-eyebrow"><Sparkles size={13} /> LES TALENTS DE DEMAIN</span>
        <h1 id="tm-title">Le talent se construit.<br /><em>Révèle-le.</em></h1>
        <p>Des artistes à découvrir.<br />Des projets auxquels donner de la force.</p>
        <button className="tm-primary" onClick={() => props.onOpenRoute('/tremplin/decouvrir')}>Explorer les talents <ArrowRight size={18} /></button>
        <button className="tm-hero-link" onClick={() => setSheet('steps')}><CirclePlay size={17} /> Comment ça marche</button>
      </div>
    </section>
    <p className="tm-free"><Heart size={13} /> Découvrir et suivre, c’est gratuit.</p>
    <form className="tm-search" role="search" onSubmit={event => { event.preventDefault(); if (results[0]) openArtist(results[0]); else props.onSearch(query.trim()); }}>
      <Search size={19} />
      <input ref={searchRef} type="search" placeholder="Un artiste, un projet, un jeton…" value={query} onChange={event => setQuery(event.target.value)} aria-label="Rechercher un artiste, un projet ou un jeton" />
      {query && <button type="button" aria-label="Effacer la recherche" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><X size={17} /></button>}
      <button type="submit" aria-label="Rechercher"><ArrowRight size={19} /></button>
    </form>
    {query.trim().length >= 2 && <div className="tm-results" aria-label="Résultats de recherche">
      {results.map(artist => <button key={artist.id} onClick={() => openArtist(artist)}><img src={artist.portrait} alt="" /><span><strong>{artist.name}</strong><small>{getTremplinProfessionLabel(artist)} · {artist.city}</small></span><ChevronRight size={18} /></button>)}
      {!results.length && <p>Aucun résultat dans cette sélection. <button onClick={() => props.onSearch(query.trim())}>Explorer tous les talents</button></p>}
    </div>}

    <section className="tm-section" aria-labelledby="tm-featured">
      <header className="tm-heading"><div><span className="tm-eyebrow">LA SÉLECTION</span><h2 id="tm-featured">À découvrir maintenant</h2></div><button aria-label="Voir tous les projets" onClick={() => props.onOpenRoute('/tremplin/decouvrir?collection=watchlist')}><ArrowRight size={20} /></button></header>
      <div className="tm-artists" aria-label="Projets à découvrir, défilement horizontal">
        {featured.map(artist => {
          const project = getTremplinProjectSnapshot(artist);
          const stage = getTremplinTokenLifecycleStage(artist);
          const status = TREMPLIN_HOME_TOKEN_STATUS_UI[stage];
          const token = getTremplinArtistToken(artist.id);
          const playing = props.playingArtistId === artist.id;
          return <article className="tm-artist" key={artist.id}>
            <div className="tm-artwork"><button aria-label={`Voir le projet de ${artist.name}`} onClick={() => openArtist(artist)}><img src={artist.artwork || artist.portrait} alt="" loading="lazy" /></button><span>{artist.city}</span><button className="tm-preview" aria-label={`${playing ? 'Mettre en pause' : 'Écouter'} ${artist.name}`} onClick={() => props.onToggleArtistAudio(artist.id)}>{playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}</button></div>
            <div className="tm-artist-copy">
              <header><div><h3>{artist.name}</h3><p>{getTremplinProfessionLabel(artist)} · {artist.styles[0]}</p></div><MeewavGradeBadge level={artist.gradeLevel} variant="icon" size="sm" /></header>
              <p className="tm-project">{project.headline}</p>
              <footer><div className="tm-token-info"><span>{status.label}</span>{status.showPrice && token && <strong className="tm-price">{formatTremplinTokenPrice(token.currentValueEur)}<small> / jeton</small></strong>}</div><button aria-label={`Découvrir le projet de ${artist.name}`} onClick={() => openArtist(artist)}>Le projet <ArrowRight size={15} /></button></footer>
            </div>
          </article>;
        })}
      </div>
      <p className="tm-caption">Des projets, pas un classement. Sélection indépendante des achats de jetons.</p>
    </section>

    {followed.length > 0 && <section className="tm-section"><header className="tm-heading"><h2>Tes artistes suivis</h2><button aria-label="Ouvrir Mes artistes" onClick={props.onMyArtists}><ArrowRight size={20} /></button></header><div className="tm-followed">{followed.map(artist => <button key={artist.id} onClick={() => openArtist(artist)}><img src={artist.portrait} alt="" /><span><strong>{artist.name}</strong><small>{getTremplinProjectSnapshot(artist).headline}</small></span><ChevronRight size={18} /></button>)}</div></section>}

    <section className="tm-section tm-path" aria-labelledby="tm-path-title">
      <header className="tm-heading"><div><span className="tm-eyebrow">À TON RYTHME</span><h2 id="tm-path-title">Du talent au soutien</h2></div></header>
      <ol>{steps.map(([title, detail], index) => { const Icon = stepIcons[index]; return <li key={title}><span className="tm-path-marker" aria-hidden="true"><Icon size={18} /></span><div><h3>{title}</h3><p>{detail}</p></div></li>; })}</ol>
      <button className="tm-path-action" onClick={() => setSheet('steps')}><span>Comprendre le parcours</span><ArrowRight size={17} /></button>
    </section>

    <section className="tm-section" aria-labelledby="tm-grades-title"><header className="tm-heading"><div><span className="tm-eyebrow">DES REPÈRES CONCRETS</span><h2 id="tm-grades-title">Six grades, un parcours</h2></div></header><p className="tm-subtitle">Touche un badge pour découvrir ce qu’il représente.</p><div className="tm-grades">{levels.map(level => <button key={level} onClick={() => setSheet(level)} style={{ '--grade-color': getGradeBadgeMeta(level).mainColor } as CSSProperties} aria-label={`Niveau ${level}, ${getGradeBadgeMeta(level).label}`}><MeewavGradeBadge level={level} variant="icon" size="md" /><span>{getGradeBadgeMeta(level).label}</span></button>)}</div><p className="tm-caption">Le grade reflète le parcours, pas la valeur du jeton.</p></section>

    <section className="tm-creator"><img src="/images/tremplin/tremplin-artist-backstage-v1.png" alt="" loading="lazy" /><div><span className="tm-eyebrow">TU CRÉES DE LA MUSIQUE ?</span><h2>Ta prochaine étape<br />commence ici.</h2><p>Fais connaître tes créations.<br />Construis un parcours visible.</p><button className="tm-primary" onClick={props.onArtistAction}>{props.artistActionLabel}<ArrowRight size={17} /></button></div></section>
    <button className="tm-rules" onClick={() => setSheet('rules')}><ShieldCheck size={23} /><span><strong>Tu gardes toujours le choix</strong><small>Jetons, frais et risques : comprendre avant de décider.</small></span><ChevronRight size={19} /></button>
    <p className="tm-demo">Aperçu de démonstration · Projets et jetons simulés.</p>

    <dialog ref={dialog} role="dialog" className="tm-sheet" onCancel={() => setSheet(null)} onClick={event => { if (event.target === event.currentTarget) setSheet(null); }} aria-labelledby="tm-sheet-title">
      <div className="tm-sheet-panel"><span className="tm-sheet-grip" aria-hidden="true" /><header><span className="tm-eyebrow">LE TREMPLIN MEEWAV</span><button aria-label="Fermer" onClick={() => setSheet(null)}><X size={21} /></button></header>
        {sheet === 'steps' ? <><h2 id="tm-sheet-title">Comprendre avant de choisir.</h2><p>Le parcours de l’artiste passe avant son jeton de talent.</p><ol className="tm-sheet-steps">{steps.map(([title, detail], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol><p>Quand un jeton est actif, tu peux consulter le projet, le prix, les frais et les conditions avant de confirmer. Aucun achat n’est nécessaire pour découvrir ou suivre un artiste.</p><button className="tm-primary" onClick={() => go(props.onUnderstand)}>Tous les détails <ArrowRight size={18} /></button></>
        : sheet === 'rules' ? <><h2 id="tm-sheet-title">Un soutien libre et expliqué.</h2><p>Découvrir et suivre les artistes reste gratuit. L’achat de jetons est payant et facultatif.</p><ul><li>Le prix, les frais et la part destinée à l’artiste sont affichés avant confirmation.</li><li>La valeur varie. Une perte est possible et aucun gain n’est garanti.</li><li>La revente peut être différée. Les conditions restent consultables avant de décider.</li></ul><button className="tm-primary" onClick={() => go(props.onUnderstandToken)}>Comprendre le jeton <ArrowRight size={18} /></button></>
        : typeof sheet === 'number' ? <><div className="tm-sheet-badge"><MeewavGradeBadge level={sheet} variant="icon" size="hero" /></div><h2 id="tm-sheet-title">{getGradeBadgeMeta(sheet).label}</h2><span className="tm-eyebrow">NIVEAU {sheet} SUR 6</span><p>{getGradeBadgeMeta(sheet).description}</p><p>Le grade tient compte des créations, de la régularité, des collaborations et des accomplissements documentés. Il ne garantit ni le succès futur, ni le prix du jeton.</p><button className="tm-primary" onClick={() => go(props.onUnderstandGrades)}>Comment est-il attribué ? <ArrowRight size={18} /></button></> : null}
      </div>
    </dialog>
  </div>;
}

