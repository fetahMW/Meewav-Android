import {previewEnabled} from '../profile-source/runtime';
import {listLiveRooms,createLiveRoom} from './liveRooms';
import type { CageProgram } from '../shared-ui/cagePrograms';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { DoorOpen, GraduationCap, Home, MapPin, Mic, Play, Plus, Waves, X } from 'lucide-react';
import MeewavPillarBrand from '../market-source/vendor/src/components/navigation/MeewavPillarBrand';
import MeewavPillarTabs, { type MeewavPillarTabItem } from '../market-source/vendor/src/components/navigation/MeewavPillarTabs';
import RoomsHome from './vendor/src/features/rooms/home/RoomsHome';
import LaunchRoomSheet from './vendor/src/features/rooms/launch/LaunchRoomSheet';

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
  const demoMode = previewEnabled();
  const [catalog,setCatalog]=useState<RoomsHomeRoom[]>([]);
  const [launching,setLaunching]=useState(false);
  const launchRequest=useRef(crypto.randomUUID());
  useEffect(()=>{
    if(demoMode)return;
    let active=true;
    const refresh=async()=>{try{const rooms=await listLiveRooms();if(active)setCatalog(rooms);}catch{if(active)setRoomNotice('Impossible de charger les rooms. Nouvelle tentative en cours.');}};
    void refresh();const timer=window.setInterval(()=>void refresh(),15000);
    return()=>{active=false;window.clearInterval(timer);};
  },[demoMode]);
  const [viewing,setViewing]=useState<RoomsHomeRoom|null>(null);
  const [tab, setTab] = useState<RoomTab>('home');
  const [sequencerOpen, setSequencerOpen] = useState(new URLSearchParams(location.search).get('launch') === 'cage');
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
  const openSession = (roomType: RoomsHomeRoomType, title: string, id?: string, program?: CageProgram) => {
    const params = new URLSearchParams({ type: roomType, title, ...(id ? { id, source: "live" } : {}), ...(program ? { program: JSON.stringify(program) } : {}) });
    window.location.assign(`/native/room-session?${params}`);
  };
  const openRoom = (room: RoomsHomeRoom) => setViewing(room);
  const viewer=viewing ? <Suspense fallback={<div className="android-room-opening" role="status">Ouverture du live…</div>}><RoomViewer room={viewing} onLeave={()=>setViewing(null)} /></Suspense> : null;
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
      />
    </div>
    {!sequencerOpen ? (
      <button
        type="button"
        className="rooms-page__launch-fab"
        aria-label="Créer une Room"
        disabled={launching}
        onClick={() => {launchRequest.current=crypto.randomUUID();setSequencerOpen(true);}}
      >
        <Plus aria-hidden="true" />
      </button>
    ) : null}
    {sequencerOpen ? createPortal((
      <div className="rooms-home-launch-dialog" role="presentation"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setSequencerOpen(false); }}>
        <LaunchRoomSheet
          initialProgram={(() => { try { return JSON.parse(new URLSearchParams(location.search).get("program") ?? "null") ?? undefined; } catch { return undefined; } })()}
          initialType={new URLSearchParams(location.search).get("launch") === "cage" ? "cage" : tab === 'home' ? undefined : (tab as RoomsHomeRoomType)}
          onClose={() => setSequencerOpen(false)}
          onLaunched={async (label, roomType, program) => {
            if(launching)return;
            if(demoMode){setSequencerOpen(false);openSession(roomType,label,undefined,program);return;}
            setLaunching(true);
            try{const id=await createLiveRoom(roomType,label,launchRequest.current);setSequencerOpen(false);openSession(roomType,label,id,program);}
            catch{notice('La room n’a pas été créée. Vérifie ta connexion puis réessaie.');}
            finally{setLaunching(false);}
          }}
        />
      </div>
    ), document.body) : null}
    {roomNotice ? <aside className="rooms-page__notice" role="status"><span>{roomNotice}</span><button aria-label="Fermer" onClick={() => setRoomNotice('')}><X size={16} /></button></aside> : null}
  </div></>;
}
