import { createRoot } from 'react-dom/client';
import { ArtistProfileCard } from './vendor/globe-vinyle/shared/src/RingArtistPreProfile';
import './guest-preprofile.css';

const root = createRoot(document.getElementById('root')!);
window.addEventListener('meewav:navigate', () => { location.href = '/native/contact'; });
window.addEventListener('meewav:guest-profile', (event) => {
const guest = (event as CustomEvent<{id: string; name: string; grade: number}>).detail;
const selection = {
  instanceId: 0, slug: guest.id, name: guest.name,
  portraitUrl: '/guest-portrait', gradeLevel: guest.grade,
  anchor: { x: 0, y: 0, clearance: 0, viewportWidth: innerWidth, viewportHeight: innerHeight },
};
root.render(
  <div className="ring-artist-preprofile" role="dialog" aria-label={`Pré-profil de ${selection.name}`}>
    <ArtistProfileCard selection={selection} onClose={() => { location.href = '/native/close'; }} />
  </div>
);
});
