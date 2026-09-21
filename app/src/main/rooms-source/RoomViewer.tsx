import {getSessionUser} from "../profile-source/runtime";
import "./viewer-video-controls.css";
import NativeViewerSurfaces from './NativeViewerSurfaces';
import WaveLiveAudio from './WaveLiveAudio';
import {useEffect,useMemo,useState} from 'react';
import AndroidViewerPreProfile from './AndroidViewerPreProfile';
import type {RoomPerson} from './viewer-web/src/features/rooms/tools/roomTools.types';
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
 const [realUserId,setRealUserId]=useState<string|null>(null);
 useEffect(()=>{void getSessionUser().then(({data})=>setRealUserId(data.user?.id??null));},[]);
 const demo=useMemo(()=>createRoomsHomeDemoState(room,PLACE_DEMO_PROFILES.viewerA.id),[room]);
 const [preProfile,setPreProfile]=useState<{person:RoomPerson;trigger:HTMLElement|null}|null>(null);
 const openPreProfile=(id:string)=>{
  const profiles=[demo.host,demo.currentUserProfile,...demo.participants.map(p=>p.profile),...demo.queue.map(p=>p.profile),...Object.values(PLACE_DEMO_PROFILES)];
  const profile=profiles.find(p=>p?.id===id);
  if(!profile)return;
  const show=()=>setPreProfile({person:{id:profile.id,name:profile.displayName,role:profile.role,avatarUrl:profile.avatarUrl,gradeLevel:profile.gradeLevel,microphone:"off",camera:"off"},trigger:document.activeElement as HTMLElement|null});
  if(document.fullscreenElement)void document.exitFullscreen().then(show);else show();
 };
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
  <NativeViewerSurfaces room={room.id} name={demo.currentUserProfile?.displayName ?? "Moi"}/>
  <header className="android-room-viewer__header"><button type="button" aria-label="Retour aux rooms" onClick={onLeave}><ArrowLeft/></button><h1>{room.title}</h1><button type="button" aria-label="Quitter le live" onClick={onLeave}><X/></button></header>
  <AudioEngineProvider><RoomPresentationProvider presentation={LIVE_ROOM_PRESENTATIONS[room.roomType]}>
   {room.source==='live'&&room.roomType==='wave'?<WaveLiveAudio roomId={room.id}/>:null}
   <PlaceRoomExperience initialPanelCollapsed={false} demoRole={room.source==='live'&&room.roomType==='wave'?undefined:'viewer'} demoRoom={room.source==="live"?undefined:demo} requestedRoomId={room.source==="live"?room.id:undefined} currentUserId={room.source==="live"?realUserId:PLACE_DEMO_PROFILES.viewerA.id}
    onLeaveRoom={onLeave} onOpenProfile={openPreProfile}
    onMessageProfile={id=>openMessaging(id,'message')}
    onCollaborateProfile={(id,requestId)=>openMessaging(id,'collaboration',requestId)}/>
  </RoomPresentationProvider></AudioEngineProvider>
  {preProfile?<AndroidViewerPreProfile person={preProfile.person} source="demo" onClose={()=>setPreProfile(null)} returnFocusTo={preProfile.trigger} boundsElement={document.querySelector('.android-room-viewer')} topBoundaryElement={document.querySelector('.place-stage')}/>:null}
 </main>;
}
