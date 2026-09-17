import { useNavigate } from 'react-router-dom';
import { ChevronRight, DoorOpen, GraduationCap, Home, MapPin, Mic, Play, Waves } from 'lucide-react';

const ROOMS = [
  { id: 'scene', name: 'La Scène', tagline: 'Vidéos, shorts et directs de la communauté', Icon: Play, ready: true },
  { id: 'cage', name: 'La Cage', tagline: 'Studio et sessions d’enregistrement', Icon: Mic },
  { id: 'wave', name: 'La Wave', tagline: 'Création collaborative et jams', Icon: Waves },
  { id: 'classe', name: 'La Classe', tagline: 'Apprendre et progresser ensemble', Icon: GraduationCap },
  { id: 'place', name: 'La Place', tagline: 'Le rendez-vous public de la communauté', Icon: MapPin },
  { id: 'loge', name: 'La Loge', tagline: 'Les coulisses des artistes', Icon: DoorOpen },
] as const;

export default function RoomsPage() {
  const navigate = useNavigate();
  return <div className="rooms-page">
    <div className="rooms-page__background" aria-hidden="true"
      style={{ backgroundImage: `url('/images/meewav-acoustic-violet-background.png')` }} />
    <header className="rooms-page__header">
      <span className="rooms-page__logo" aria-hidden="true"><Home size={22} /></span>
      <div>
        <h1>Rooms</h1>
        <p>Six pièces, une seule maison.</p>
      </div>
    </header>
    <ul className="rooms-page__list">
      {ROOMS.map(({ id, name, tagline, Icon, ready }) => <li key={id}>
        <button type="button" className="rooms-page__room" disabled={!ready}
          aria-label={ready ? `Ouvrir ${name}` : `${name} — bientôt disponible`}
          onClick={() => ready && navigate(`/${id}`)}>
          <span className="rooms-page__room-icon" aria-hidden="true"><Icon size={20} /></span>
          <span className="rooms-page__room-copy"><strong>{name}</strong><small>{tagline}</small></span>
          {ready ? <ChevronRight size={18} aria-hidden="true" /> : <span className="rooms-page__room-soon">Bientôt</span>}
        </button>
      </li>)}
    </ul>
  </div>;
}
