import { createRoot } from 'react-dom/client';
import { useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArtistProfileCard } from './vendor/globe-vinyle/shared/src/RingArtistPreProfile';
import './guest-preprofile.css';

const root = createRoot(document.getElementById('root')!);
// Android owns the single bottom sheet. Fit its width, and allow vertical scrolling
// on short displays rather than shrinking all controls to fit the available height.
const fitCard = () => {
  const scale = Math.min(document.documentElement.clientWidth / 413, 1);
  document.documentElement.style.setProperty('--guest-profile-scale', String(scale));
  document.documentElement.style.setProperty('--guest-profile-height', `${document.documentElement.clientHeight / scale}px`);
};
fitCard();
window.addEventListener('resize', fitCard);
new ResizeObserver(fitCard).observe(document.documentElement);
window.addEventListener('meewav:navigate', () => { location.href = '/native/contact'; });

type Guest = { id: string; name: string; grade: number; portrait: string };
function GuestCard({ guest }: { guest: Guest }) {
  const [footer,setFooter]=useState<Element|null>(null);
  useLayoutEffect(() => {
    fitCard();
    setFooter(document.querySelector('.mw-preprofile__footer'));
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
  return <div className="ring-artist-preprofile" role="region" aria-label={`Pré-profil de ${selection.name}`}
    style={{ '--guest-grade-image': `url("/guest-grade/${Math.max(1, Math.min(6, Math.round(guest.grade)))}")` } as CSSProperties}>
    <ArtistProfileCard selection={selection} onClose={() => { location.href = '/native/close'; }} />
    {footer && createPortal(<button className="guest-offer" type="button" onClick={() => { location.href='/native/gift'; }} aria-label={`Offrir un cadeau à ${guest.name}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/></svg><span>Offrir</span>
    </button>,footer)}
  </div>;
}
window.addEventListener('meewav:guest-profile', event => {
  const guest = (event as CustomEvent<Guest | null>).detail;
  document.querySelectorAll<HTMLMediaElement>('video,audio').forEach(media => media.pause());
  root.render(guest ? <GuestCard key={guest.id} guest={guest} /> : null);
});
// Notify the native host only after the event receiver and React root exist.
location.href = '/native/ready';
