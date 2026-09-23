import {getSessionUser,previewEnabled,supabase} from '../profile-source/runtime';
import {listLiveRooms,createLiveRoom} from './liveRooms';
import type { CageProgram } from '../shared-ui/cagePrograms';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DoorOpen, GraduationCap, Home, MapPin, Mic, Play, Plus, Waves, X } from 'lucide-react';
import MeewavPillarBrand from '../market-source/vendor/src/components/navigation/MeewavPillarBrand';
import MeewavPillarTabs, { type MeewavPillarTabItem } from '../market-source/vendor/src/components/navigation/MeewavPillarTabs';
import RoomsHome from './vendor/src/features/rooms/home/RoomsHome';
import LaunchRoomSheet from './vendor/src/features/rooms/launch/LaunchRoomSheet';
import type { LaunchStudioConfig } from './vendor/src/features/rooms/launch/LaunchStudio';

import type { RoomsHomeRoom, RoomsHomeRoomType } from './vendor/src/features/rooms/home/roomsHome.types';

const ROOMS = [
  { id: 'scene', name: 'La Scène', Icon: Play, accent: '#8d5cff' },
  { id: 'cage', name: 'La Cage', Icon: Mic, accent: '#e16e78' },
  { id: 'wave', name: 'La Wave', Icon: Waves, accent: '#61d8ff' },
  { id: 'classe', name: 'La Classe', Icon: GraduationCap, accent: '#5086ff' },
  { id: 'place', name: 'La Place', Icon: MapPin, accent: '#45dfa8' },
  { id: 'loge', name: 'La Loge', Icon: DoorOpen, accent: '#f6d381' },
] as const;

const RoomViewer=lazy(()=>import('./RoomViewer'));

type RoomTab = 'home' | (typeof ROOMS)[number]['id'];

export default function RoomsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const demoMode = previewEnabled();
  const [catalog,setCatalog]=useState<RoomsHomeRoom[]>([]);
  const [realUserId,setRealUserId]=useState<string|null>(null);
  const [roomToEnd,setRoomToEnd]=useState<RoomsHomeRoom|null>(null);
  const [endingRoom,setEndingRoom]=useState(false);
  const [launching,setLaunching]=useState(false);
  const launchRequest=useRef(crypto.randomUUID());
  useEffect(()=>{if(demoMode)return;let active=true;void getSessionUser().then(({data})=>{if(active)setRealUserId(data.user?.id??null);});return()=>{active=false;};},[demoMode]);
  useEffect(()=>{
    if(demoMode)return;
    let active=true;
    const refresh=async()=>{try{const rooms=await listLiveRooms();if(active)setCatalog(rooms);}catch{if(active)setRoomNotice('Impossible de charger les rooms. Nouvelle tentative en cours.');}};
    void refresh();const timer=window.setInterval(()=>void refresh(),15000);
    const onVisible=()=>{if(document.visibilityState==='visible')void refresh();};
    window.addEventListener('focus',onVisible);
    document.addEventListener('visibilitychange',onVisible);
    return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',onVisible);document.removeEventListener('visibilitychange',onVisible);};
  },[demoMode]);
  const [viewing,setViewing]=useState<RoomsHomeRoom|null>(null);
  const [tab, setTab] = useState<RoomTab>('home');
  const sequencerOpen = location.pathname === '/rooms/create' || new URLSearchParams(location.search).get('launch') === 'cage';
  const [roomNotice, setRoomNotice] = useState('');
  const collectionSlug = location.pathname.startsWith('/rooms/collections/')
    ? decodeURIComponent(location.pathname.split('/')[3] ?? '')
    : null;
  const items: MeewavPillarTabItem<RoomTab>[] = [
    { id: 'home', label: 'Accueil', icon: Home, accent: '#f7f5ff' },
    ...ROOMS.map(({ id, name, Icon, accent }) => ({ id, label: name, icon: Icon, accent })),
  ];
  const notice = (message: string) => {
    setRoomNotice(message);
    window.setTimeout(() => setRoomNotice(''), 4000);
  };
  const openSession = (roomType: RoomsHomeRoomType, title: string, id?: string, program?: CageProgram, studio?: LaunchStudioConfig) => {
    const params = new URLSearchParams({ type: roomType, title, ...(id ? { id, source: "live" } : {}), ...(program ? { program: JSON.stringify(program) } : {}), ...(studio ? { format: studio.format, camera: studio.camera, layout: studio.format === 'portrait' ? studio.portraitLayout : studio.landscapeLayout, secondCamera: String(studio.secondCamera), reversed: String(studio.reversed) } : {}) });
    window.location.assign(`/native/room-session?${params}`);
  };
  const openRoom = (room: RoomsHomeRoom) => setViewing(room);
  const endOwnRoom = async () => {
    if (!roomToEnd || endingRoom || roomToEnd.hostId !== realUserId || roomToEnd.source !== 'live') return;
    setEndingRoom(true);
    try {
      const {error}=await supabase.rpc('rooms_end_room_v1',{p_room_id:roomToEnd.id});
      if(error)throw error;
      setCatalog(current=>current.filter(room=>room.id!==roomToEnd.id));
      setRoomToEnd(null);
      notice('Le live est terminé. Sa carte a été retirée.');
    } catch { notice('La room n’a pas pu être terminée. Réessaie.'); }
    finally { setEndingRoom(false); }
  };
  const viewer=viewing ? <Suspense fallback={<div className="android-room-opening" role="status">Ouverture du live…</div>}><RoomViewer room={viewing} onLeave={()=>setViewing(null)} /></Suspense> : null;
  if (sequencerOpen) return <div className="rooms-home-launch-dialog rooms-launch-page">
    <LaunchRoomSheet
      allowSkipCheckup={demoMode}
      initialProgram={(() => { try { return JSON.parse(new URLSearchParams(location.search).get('program') ?? 'null') ?? undefined; } catch { return undefined; } })()}
      initialType={new URLSearchParams(location.search).get('launch') === 'cage' ? 'cage' : tab === 'home' ? undefined : (tab as RoomsHomeRoomType)}
      onClose={() => navigate('/rooms')}
      onLaunched={async (label, roomType, program, studio) => {
        if (launching) return;
        if (demoMode) { openSession(roomType, label, undefined, program, studio); return; }
        setLaunching(true);
        try { const id = await createLiveRoom(roomType, label, launchRequest.current, studio?.format); openSession(roomType, label, id, program, studio); }
        catch { notice('La room n’a pas été créée. Vérifie ta connexion puis réessaie.'); }
        finally { setLaunching(false); }
      }}
    />
    {roomNotice ? <aside className="rooms-page__notice" role="status"><span>{roomNotice}</span><button aria-label="Fermer" onClick={() => setRoomNotice('')}><X size={16} /></button></aside> : null}
  </div>;
  return <>{viewer}<div className="rooms-page" hidden={!!viewing}>
    <div className="rooms-page__background" aria-hidden="true"
      style={{ backgroundImage: `url('/images/meewav-acoustic-violet-background.png')` }} />
    <header className="rooms-topbar">
      <div className="rooms-brand"><MeewavPillarBrand pillar="Rooms" /></div>
      <MeewavPillarTabs className="rooms-pillar-tabs" items={items} activeId={tab}
        ariaLabel="Pièces de la maison MeeWav" visibleCount={4}
        onSelect={(id) => setTab(id)} />
    </header>
    <div className="rooms-page__home">
      <RoomsHome
        catalog={demoMode ? undefined : catalog}
        roomType={tab === 'home' ? undefined : (tab as RoomsHomeRoomType)}
        collectionSlug={collectionSlug}
        onOpenRoom={openRoom}
        currentUserId={realUserId}
        onEndRoom={setRoomToEnd}
      />
    </div>
      <button
        type="button"
        className="rooms-page__launch-fab"
        aria-label="Créer une Room"
        disabled={launching}
        onClick={() => {launchRequest.current=crypto.randomUUID();navigate('/rooms/create');}}
      >
        <Plus aria-hidden="true" />
      </button>
    {roomNotice ? <aside className="rooms-page__notice" role="status"><span>{roomNotice}</span><button aria-label="Fermer" onClick={() => setRoomNotice('')}><X size={16} /></button></aside> : null}
  </div>{roomToEnd ? <div className="rooms-page__end-backdrop" onClick={()=>{if(!endingRoom)setRoomToEnd(null);}}>
    <section className="rooms-page__end-dialog" role="dialog" aria-modal="true" aria-labelledby="rooms-end-title" onClick={event=>event.stopPropagation()}>
      <small>ROOM EN DIRECT</small>
      <h2 id="rooms-end-title">Terminer « {roomToEnd.title} » ?</h2>
      <p>Le live sera fermé pour tout le monde et sa miniature disparaîtra de l’accueil.</p>
      <div><button type="button" autoFocus disabled={endingRoom} onClick={()=>setRoomToEnd(null)}>Continuer le live</button><button type="button" disabled={endingRoom} onClick={()=>void endOwnRoom()}>{endingRoom?'Fermeture…':'Terminer le live'}</button></div>
    </section>
  </div> : null}</>;
}
