import { createRoot } from 'react-dom/client';
import { ArtistProfileCard } from './vendor/globe-vinyle/shared/src/RingArtistPreProfile';
import './guest-preprofile.css';

const params = new URLSearchParams(location.hash.slice(1));
const selection = {
  instanceId: 0, slug: params.get('id') || 'guest', name: params.get('name') || 'Artiste',
  portraitUrl: '/guest-portrait', gradeLevel: Number(params.get('grade')) || 1,
  anchor: { x: 0, y: 0, clearance: 0, viewportWidth: innerWidth, viewportHeight: innerHeight },
};
window.addEventListener('meewav:navigate', () => { location.href = '/native/contact'; });
createRoot(document.getElementById('root')!).render(
  <div className="ring-artist-preprofile" role="dialog" aria-label={`Pré-profil de ${selection.name}`}>
    <ArtistProfileCard selection={selection} onClose={() => { location.href = '/native/close'; }} />
  </div>
);
