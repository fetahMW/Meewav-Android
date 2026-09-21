import {useEffect,useMemo} from 'react';
import {ArrowLeft,X} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import PlaceRoomExperience from './viewer-web/src/features/rooms/place/PlaceRoomExperience.tsx';
import {RoomPresentationProvider,LIVE_ROOM_PRESENTATIONS} from './viewer-web/src/features/rooms/roomPresentation.tsx';
import {AudioEngineProvider} from './viewer-web/src/features/rooms/audio-engine/AudioEngineProvider.tsx';
import {createRoomsHomeDemoState} from './viewer-web/src/features/rooms/home/roomsHome.fixtureAdapter.ts';
import {PLACE_DEMO_PROFILES} from './viewer-web/src/features/rooms/place/place.fixtures.ts';
import {buildMessagingRoute,isMessagingUuid} from './viewer-web/src/features/messaging/messaging.route.ts';
import type {RoomsHomeRoom} from './vendor/src/features/rooms/home/roomsHome.types';
import "./viewer-web/src/features/rooms/rooms-page.css";
import "./viewer-web/src/features/rooms/place/place-room.css";
import "./viewer-web/src/features/rooms/place/place-room-premium.css";
import "./viewer-web/src/features/rooms/place/place-room-shell.css";
import "./viewer-web/src/features/rooms/live-themes/place-live-theme.css";
import "./viewer-web/src/features/rooms/live-themes/loge-live-theme.css";
import "./viewer-web/src/features/rooms/live-themes/wave-live-theme.css";
import "./viewer-web/src/features/rooms/live-themes/cage-live-theme.css";
import "./viewer-web/src/features/rooms/live-themes/classe-live-theme.css";
import "./viewer-web/src/features/rooms/live-themes/scene-live-theme.css";
import "./viewer-web/src/features/rooms/place/place-tools-wave-skin.css";
import "./viewer-web/src/features/rooms/tools/panels/loge-premium-tools.css";
import "./viewer-web/src/features/rooms/place/place-studio-chassis.css";
import "./viewer-web/src/features/rooms/place/place-studio-black-lacquer.css";
import "./viewer-web/src/features/rooms/live-themes/classe-chat-finish.css";
import "./viewer-web/src/features/rooms/place/place-mixer-reference.css";
import "./viewer-web/src/features/rooms/place/place-mixer-depth.css";
import "./viewer-web/src/features/rooms/place/place-studio-navigation.css";
import "./viewer-web/src/features/rooms/place/place-chat-composer-glass.css";
import "./viewer-web/src/features/rooms/place/place-chat-typography.css";
import "./viewer-web/src/features/rooms/place/live-glass-material.css";
import "./viewer-web/src/features/rooms/place/place-chat-smoked-glass.css";
import "./viewer-web/src/features/rooms/place/place-guest-reference.css";
export default function RoomViewer({room,onLeave}:{room:RoomsHomeRoom;onLeave:()=>void}) {
 const navigate=useNavigate();
 const demo=useMemo(()=>createRoomsHomeDemoState(room,PLACE_DEMO_PROFILES.viewerA.id),[room]);
 const openMessaging=(profileId:string,intent:'message'|'collaboration',requestId?:string|null)=>{
  const real=isMessagingUuid(profileId);
  navigate(buildMessagingRoute({space:intent==='message'?'messages':'collabs',intent,source:'rooms',mode:real?'real':'demo',profileId:real?profileId:null,mockArtistId:real?null:profileId,requestId}));
 };
 useEffect(()=>{
  document.documentElement.classList.add('android-room-viewer-open');
  const back=(event:Event)=>{event.preventDefault();onLeave();};
  window.addEventListener('meewav:feature-back',back);
  return()=>{document.documentElement.classList.remove('android-room-viewer-open');window.removeEventListener('meewav:feature-back',back);};
 },[onLeave]);
 return <main className="android-room-viewer" data-room-type={room.roomType}>
  <header className="android-room-viewer__header"><button type="button" aria-label="Retour aux rooms" onClick={onLeave}><ArrowLeft/></button><h1>{room.title}</h1><button type="button" aria-label="Quitter le live" onClick={onLeave}><X/></button></header>
  <AudioEngineProvider><RoomPresentationProvider presentation={LIVE_ROOM_PRESENTATIONS[room.roomType]}>
   <PlaceRoomExperience initialPanelCollapsed={false} demoRole="viewer" demoRoom={demo} currentUserId={PLACE_DEMO_PROFILES.viewerA.id}
    onLeaveRoom={onLeave} onOpenProfile={id=>navigate('/profile/view/'+encodeURIComponent(id))}
    onMessageProfile={id=>openMessaging(id,'message')}
    onCollaborateProfile={(id,requestId)=>openMessaging(id,'collaboration',requestId)}/>
  </RoomPresentationProvider></AudioEngineProvider>
 </main>;
}
