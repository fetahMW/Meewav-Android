import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { DoorOpen, GraduationCap, Home, MapPin, Mic, Play, Plus, Waves, X } from 'lucide-react';
import MeewavPillarBrand from '../market-source/vendor/src/components/navigation/MeewavPillarBrand';
import MeewavPillarTabs, { type MeewavPillarTabItem } from '../market-source/vendor/src/components/navigation/MeewavPillarTabs';
import RoomsHome from './vendor/src/features/rooms/home/RoomsHome';
import LaunchRoomSheet from './vendor/src/features/rooms/launch/LaunchRoomSheet';
import WaveRoom from './vendor/src/features/rooms/wave/WaveRoom';
import type { RoomsHomeRoom, RoomsHomeRoomType } from './vendor/src/features/rooms/home/roomsHome.types';

const ROOMS = [
  { id: 'scene', name: 'La Scène', Icon: Play, accent: '#8d5cff' },
  { id: 'cage', name: 'La Cage', Icon: Mic, accent: '#e16e78' },
  { id: 'wave', name: 'La Wave', Icon: Waves, accent: '#61d8ff' },
  { id: 'classe', name: 'La Classe', Icon: GraduationCap, accent: '#5086ff' },
  { id: 'place', name: 'La Place', Icon: MapPin, accent: '#45dfa8' },
  { id: 'loge', name: 'La Loge', Icon: DoorOpen, accent: '#f6d381' },
] as const;

type RoomTab = 'home' | (typeof ROOMS)[number]['id'];

export default function RoomsPage() {
  const location = useLocation();
  const [tab, setTab] = useState<RoomTab>('home');
  const [sequencerOpen, setSequencerOpen] = useState(false);
  const [roomNotice, setRoomNotice] = useState('');
  const [waveLive, setWaveLive] = useState<null | { isViewer: boolean; title?: string }>(null);
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
  const openRoom = (room: RoomsHomeRoom) => {
    if (room.roomType === 'wave') {
      setWaveLive({ isViewer: true, title: room.title });
      return;
    }
    notice(`« ${room.title} » — le live arrive bientôt sur Android.`);
  };
  return <div className="rooms-page">
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
        onClick={() => setSequencerOpen(true)}
      >
        <Plus aria-hidden="true" />
      </button>
    ) : null}
    {sequencerOpen ? createPortal((
      <div className="rooms-home-launch-dialog" role="presentation"
        onMouseDown={(event) => { if (event.target === event.currentTarget) setSequencerOpen(false); }}>
        <LaunchRoomSheet
          initialType={tab === 'home' ? undefined : (tab as RoomsHomeRoomType)}
          onClose={() => setSequencerOpen(false)}
          onLaunched={(label, roomType) => {
            if (roomType === 'wave') { setWaveLive({ isViewer: false, title: label }); return; }
            notice(`${label} — ta Room est prête, le live arrive bientôt sur Android.`);
          }}
        />
      </div>
    ), document.body) : null}
    {waveLive ? <WaveRoom isViewer={waveLive.isViewer} roomTitle={waveLive.title} onClose={() => setWaveLive(null)} /> : null}
    {roomNotice ? <aside className="rooms-page__notice" role="status"><span>{roomNotice}</span><button aria-label="Fermer" onClick={() => setRoomNotice('')}><X size={16} /></button></aside> : null}
  </div>;
}
