import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Gift} from 'lucide-react';
import {ArtistProfileCard} from '../globe-source/vendor/globe-vinyle/shared/src/RingArtistPreProfile';
import type {PreProfileDemoArtist} from './viewer-web/src/features/globe/components/preProfile/demoPreProfileArtist';
import './cage-artist-profile.css';
/** Reuse the approved Cage/Guests artist card, without rebuilding its composition. */
export default function RoomArtistProfileContent({artist,onOffer,demo,onOpenProfile,onContact,onCollabRequest}:{artist:PreProfileDemoArtist;demo:boolean;onOffer:()=>void;onOpenProfile?:(id:string)=>void;onContact?:(id:string)=>void;onCollabRequest?:(id:string)=>void}) {
 const container=useRef<HTMLDivElement>(null);
 const [footer,setFooter]=useState<Element|null>(null);
 useEffect(()=>setFooter(container.current?.querySelector('.mw-preprofile__footer')??null),[artist.id]);
 const selection={instanceId:0,slug:artist.id,name:artist.name,portraitUrl:artist.portraitUrl,gradeLevel:artist.gradeLevel??1,anchor:{x:0,y:0,clearance:0,viewportWidth:innerWidth,viewportHeight:innerHeight}};
 return <div ref={container} className="cage-profile-content"><div className="ring-artist-preprofile"><ArtistProfileCard selection={selection} profileArtist={artist} demo={demo} onOpenProfile={onOpenProfile} onContact={onContact} onCollabRequest={onCollabRequest} onClose={()=>{}}/>{footer&&createPortal(<button type="button" className="guest-offer" aria-label={`Offrir un cadeau à ${artist.name}`} onClick={onOffer}><Gift/><span>Offrir</span></button>,footer)}</div></div>;
}
