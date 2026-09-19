import { createRoot } from 'react-dom/client';
import { useLayoutEffect } from 'react';
import { ArtistProfileCard } from './vendor/globe-vinyle/shared/src/RingArtistPreProfile';
import './guest-preprofile.css';

const root = createRoot(document.getElementById('root')!);
// Android owns the modal's centering and aspect ratio. Web content starts at (0,0)
// and fits those exact bounds; it never positions itself against the document body.
const fitCard = () => document.documentElement.style.setProperty('--guest-profile-scale',
  String(Math.min(document.documentElement.clientWidth / 413, document.documentElement.clientHeight / 540, 1)));
fitCard();
window.addEventListener('resize', fitCard);
new ResizeObserver(fitCard).observe(document.documentElement);
window.addEventListener('meewav:navigate', () => { location.href = '/native/contact'; });

type Guest = { id: string; name: string; grade: number; portrait: string };
function GuestCard({ guest }: { guest: Guest }) {
  useLayoutEffect(() => {
    fitCard();
    const frame = requestAnimationFrame(() => {
      location.href = `/native/rendered?id=${encodeURIComponent(guest.id)}`;
    });
    return () => cancelAnimationFrame(frame);
  }, [guest]);
  const selection = {
    instanceId: 0, slug: guest.id, name: guest.name,
    portraitUrl: guest.portrait, gradeLevel: guest.grade,
    anchor: { x: 0, y: 0, clearance: 0, viewportWidth: innerWidth, viewportHeight: innerHeight },
  };
  return <div className="ring-artist-preprofile" role="dialog" aria-label={`Pré-profil de ${selection.name}`}>
    <ArtistProfileCard selection={selection} onClose={() => { location.href = '/native/close'; }} />
  </div>;
}
window.addEventListener('meewav:guest-profile', event => {
  const guest = (event as CustomEvent<Guest | null>).detail;
  document.querySelectorAll<HTMLMediaElement>('video,audio').forEach(media => media.pause());
  root.render(guest ? <GuestCard key={guest.id} guest={guest} /> : null);
});
// Notify the native host only after the event receiver and React root exist.
location.href = '/native/ready';
