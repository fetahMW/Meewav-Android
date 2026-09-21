import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cageChampionshipStandings } from "../cageCompetition";
import { Trophy, Users, X, SquareCheck, HeartHandshake, Network } from "lucide-react";
import type { RoomToolsState, RoomPerson } from "../roomTools.types";
import WaveProfileButton from "../panels/WaveProfileButton";
import { MeewavGradeBadge } from "../../../grades/MeewavGradeBadge";
import "./cage-broadcast.css";
import "./cage-viewer-mobile.css";

type Props = { format: import("../cageViewerSimulation").CageSimulationFormat; suppressed:boolean; state: RoomToolsState; paused: boolean; remaining: number; error?: string; onStart:()=>void; onPause:()=>void; onRestart:()=>void; onNext:()=>void; onClose:()=>void; onVote:(side:"A"|"B")=>void };

export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
 const ref=useRef<HTMLDivElement>(null);
 const [portalTarget,setPortalTarget]=useState<Element>(()=>document.fullscreenElement ?? document.body);
 useEffect(()=>{const sync=()=>setPortalTarget(document.fullscreenElement ?? document.body);document.addEventListener("fullscreenchange",sync);return()=>document.removeEventListener("fullscreenchange",sync);},[]);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;ref.current?.focus();return()=>previous?.focus();},[]);
 return createPortal(<div className="cage-viewer-modal"><div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}if(e.key==='Tab'){const nodes=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus();}}}}><header><strong>{title}</strong><button aria-label="Fermer la fenêtre" onClick={onClose}><X/></button></header>{children}</div></div>,portalTarget);
}
export default function CageBroadcast({state,paused,remaining,error,onStart,onVote,format,suppressed}:Props) {
 const runtime=state.cage!.runtime!;
 const roundCount=Math.max(...runtime.matches.map(m=>m.round));
 const rounds=Array.from({length:roundCount},(_,i)=>format==="tournament"?["Quarts","Demies","Finale"][i]:format==="championship"?`Journée ${i+1}`:`Duel ${i+1}`);
 const active=runtime.matches.find(m=>m.id===runtime.activeMatchId)!;
 const [tab,setTab]=useState('live'),[intro,setIntro]=useState(true),[bracket,setBracket]=useState(false);
 const [dismissed,setDismissed]=useState(''),[round,setRound]=useState(1);
 const [donate,setDonate]=useState(false),[amount,setAmount]=useState(5),[total,setTotal]=useState(125),[sent,setSent]=useState(false);
 const person=(id:string|null)=>runtime.participants.find(p=>p.id===id)?.person;
 const completed=runtime.status==='COMPLETED';
 const resolved=active.status==='RESOLVED'||active.status==='CLOSED',voting=active.status==='VOTING';
 const phaseKey=active.id+':'+active.status;
 const ballot=active.vote?.ballots['preview-viewer'];
 const ballots=Object.values(active.vote?.ballots??{});
 const winner=person(active.winnerId);
 const leaders=completed&&format==="championship"?cageChampionshipStandings(runtime).filter(r=>r.rank===1):[];
 const closeIntro=()=>{setIntro(false);onStart();};
 useEffect(()=>{if(!intro||suppressed)return;const timer=setTimeout(closeIntro,3500);return()=>clearTimeout(timer);},[intro,suppressed]);
 const portrait=(p:RoomPerson|undefined,compact=false)=><WaveProfileButton person={p} source="demo" className={compact?'cvm-mini-person':'cb-photo'}>{p?.avatarUrl?<img src={p.avatarUrl} alt=""/>:<Users/>}{compact?<span>{p?.name??'À définir'}</span>:null}</WaveProfileButton>;
 const identity=(p:RoomPerson|undefined)=><WaveProfileButton person={p} source="demo" className="cb-person cb-artist-card">{p?.avatarUrl?<img className="cb-artist-image" src={p.avatarUrl} alt=""/>:<Users/>}<span className="cb-artist-caption"><strong>{p?.name??'À définir'}</strong><small>{p?.role??''}</small></span>{p?.gradeLevel?<span className="cb-artist-grade"><MeewavGradeBadge level={p.gradeLevel} size="xs" variant="icon"/></span>:null}</WaveProfileButton>;
 const overview=format!=="tournament"?<div className="cvm-program-overview"><h3>{format==="championship"?"Classement du championnat":format==="open-mic"?"Quatre duels · huit artistes":"Le gagnant reste sur scène"}</h3>{runtime.participants.map(p=><div key={p.id}>{portrait(p.person,true)}<span>{runtime.matches.filter(m=>m.winnerId===p.id).length} victoire(s)</span></div>)}</div>:<div className="cvm-bracket" aria-label="Tableau complet du tournoi">{rounds.map((label,i)=><section key={label}><h3>{label}</h3><div>{runtime.matches.filter(m=>m.round===i+1).map(m=><article key={m.id} className={m.id===active.id?'is-current':''}>{[m.participantAId,m.participantBId].map((id,n)=><div key={n} className={id&&id===m.winnerId?'is-winner':''}>{portrait(person(id),true)}</div>)}</article>)}</div></section>)}</div>;
 const voteContent=<><p className="cvm-note">Qui remporte ce battle ? {remaining} s pour voter.</p><div className="cvm-duel">{identity(person(active.participantAId))}<b>VS</b>{identity(person(active.participantBId))}</div><div className="cb-votes">{(['A','B'] as const).map(side=><button key={side} disabled={!!ballot||!voting} aria-pressed={ballot===side} onClick={()=>onVote(side)}><SquareCheck/>{ballot===side?'Votre choix':'Je valide'}</button>)}</div><p className="cvm-note">{ballot?'Vote enregistré dans la démo.':'Un seul vote par personne.'}</p></>;
 const eliminationFormat=format==='tournament'||format==='open-mic-battle';
 const wins=(id:string)=>runtime.matches.filter(m=>m.winnerId===id&&m.participantBId).length;
 const rankedIds=eliminationFormat?[...new Set([runtime.matches.at(-1)?.winnerId,...[...runtime.matches].reverse().flatMap(m=>[m.participantAId,m.participantBId].filter(id=>id&&id!==m.winnerId))].filter((id):id is string=>!!id))]:runtime.participants.map(p=>p.id).sort((a,b)=>wins(b)-wins(a));
 const podium=<section className="cvm-palmares"><p className="cvm-note">PALMARÈS · {format==='tournament'?'TOURNOI':format==='championship'?'CHAMPIONNAT':format==='open-mic-battle'?'OPEN MIC BATTLE':'OPEN MIC'}</p><div className="cvm-podium">{[2,1,3].map(place=>{const p=person(rankedIds[place-1]);return <div key={place} className={`cvm-podium-place place-${place}`}><small>{place===1?'VAINQUEUR':`${place}ᵉ PLACE`}</small>{portrait(p)}<strong>{p?.name??'Non attribuée'}</strong><div className="cvm-podium-step">{place}</div></div>})}</div><p className="cvm-note">{eliminationFormat?'Dernier vainqueur, puis ordre inverse des éliminations.':'Nombre de victoires · à égalité, ordre du programme.'}</p><h3>La suite du classement</h3><div className="cvm-ranking">{rankedIds.slice(3).map((id,i)=><div key={id}><b>{i+4}ᵉ</b>{portrait(person(id),true)}<span>{wins(id)} V</span></div>)}</div></section>;
 const resultContent=completed?podium:<><div className="cvm-winner"><Trophy/>{identity(winner)}<strong>{completed?(format==='open-mic'?'Dernier duel terminé':'Champion de la compétition'):'Victoire du battle'}</strong></div><div className="cvm-scores">{(['A','B'] as const).map(side=><span key={side}>{person(side==='A'?active.participantAId:active.participantBId)?.name}<b>{ballots.filter(v=>v===side).length} voix</b></span>)}</div></>;

 return <div className="cb-board cvm-board">
  <nav className="cvm-tabs" aria-label="Outils de La Cage">{[['live','Direct'],['competition','Compétition'],['fund','Cagnotte']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  {tab==='live'?<section className="cb-battle"><header><strong>{completed?'TOURNOI TERMINÉ':resolved?'RÉSULTAT':voting?'VOTE DU PUBLIC':'BATTLE EN COURS'}</strong><time>{paused?'Départ imminent':`${remaining} s`}</time></header><div className="cvm-duel">{identity(person(active.participantAId))}<b>VS</b>{identity(person(active.participantBId))}</div><p className="cb-match-context"><span>{format==="tournament"?"Tournoi":format==="championship"?"Championnat":format==="open-mic-battle"?"Open Mic Battle":"Open Mic"}</span><span>{rounds[active.round-1]} · Match {active.order}</span></p>{voting?<button className="cvm-primary" onClick={()=>setDismissed('')}>{ballot?'Voir mon vote':'Voter pour ce battle'}</button>:null}{resolved?resultContent:null}<button className="cvm-primary" onClick={()=>setBracket(true)}><Network/>Voir le tableau complet</button></section>:null}
  {tab==='competition'?<><button className="cvm-primary" onClick={()=>setBracket(true)}><Network/>Tout le bracket en un coup d’œil</button><nav className="cb-rounds" aria-label="Tour du tournoi">{rounds.map((label,i)=><button key={label} aria-pressed={round===i+1} onClick={()=>setRound(i+1)}>{label}</button>)}</nav><div className="cvm-matches">{runtime.matches.filter(m=>m.round===round).map(m=><article key={m.id}><small className="cb-match-context">{rounds[m.round-1]} · {m.winnerId?'Terminé':m.id===active.id?'En direct':'À venir'} · Match {m.order}</small><div className="cvm-duel">{identity(person(m.participantAId))}<b>VS</b>{identity(person(m.participantBId))}</div>{m.winnerId?<p>{person(m.winnerId)?.name} se qualifie</p>:null}</article>)}</div></>:null}
  {tab==='fund'?<section className="cvm-fund"><HeartHandshake/><h2>Soutenez les artistes</h2><p>La cagnotte de ce tournoi récompense les prestations de la soirée.</p><strong>{total} € <small>/ 500 €</small></strong><progress max={500} value={total}/><button className="cvm-primary" onClick={()=>{setSent(false);setDonate(true);}}>Faire un don</button><small>Cagnotte de démonstration · aucun débit réel.</small></section>:null}
  {error?<p role="alert">{error}</p>:null}
  {!suppressed&&(intro||bracket)?<Modal title={intro?'Le tournoi commence':'Tableau de la compétition'} onClose={intro?closeIntro:()=>setBracket(false)}><p className="cvm-note">8 artistes · compétition · touchez un portrait pour son pré-profil.</p>{overview}<button className="cvm-primary" onClick={intro?closeIntro:()=>setBracket(false)}>{intro?'Suivre le premier battle':'Revenir au direct'}</button></Modal>:null}
  {!suppressed&&!intro&&!bracket&&!donate&&voting&&dismissed!==phaseKey?<Modal title="Le public vote" onClose={()=>setDismissed(phaseKey)}>{voteContent}</Modal>:null}
  {!suppressed&&!intro&&!bracket&&!donate&&resolved&&dismissed!==phaseKey?<Modal title={completed?'Podium et classement':'Résultat du battle'} onClose={()=>setDismissed(phaseKey)}>{resultContent}</Modal>:null}
  {donate?<Modal title="Soutenir la cagnotte" onClose={()=>setDonate(false)}>{sent?<p role="status">Merci ! Don simulé de {amount} € ajouté. Aucun débit réel.</p>:<><p>Choisissez votre contribution de démonstration.</p><div className="cvm-amounts">{[2,5,10,20].map(n=><button key={n} aria-pressed={amount===n} onClick={()=>setAmount(n)}>{n} €</button>)}</div><button className="cvm-primary" onClick={()=>{setTotal(v=>v+amount);setSent(true);}}>Simuler le don de {amount} €</button></>}</Modal>:null}
 </div>;
}
