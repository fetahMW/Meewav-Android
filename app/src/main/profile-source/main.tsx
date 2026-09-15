import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { Mail, UserRound, Box, Play, Store, Rocket, X } from 'lucide-react';
import { configure, updateToken, type MobileConfig } from './runtime';
import NavGlobeTexture from '../globe-source/full-globe-nav-texture';
import { NAVBAR_GLOBE_PALETTE } from '../globe-source/vendor/globe-vinyle/shared/src/globe-palette.mjs';

const native = (destination: string) => location.assign(`https://appassets.androidplatform.net/native/${destination}`);
const items = [
  { id: 'messages', label: 'Messagerie', Icon: Mail },
  { id: 'profile', label: 'Profil', Icon: UserRound },
  { id: 'rooms', label: 'Rooms', Icon: Box },
  { id: 'scene', label: 'La Scène', Icon: Play },
  { id: 'market', label: 'Marketplace', Icon: Store },
  { id: 'tremplin', label: 'Tremplin', Icon: Rocket },
];
function Shell({ Page }: { Page: React.ComponentType }) {
  const route = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (route.pathname.startsWith('/messages')) native('messages');
    else if (!route.pathname.startsWith('/profile')) native('globe');
  }, [route.pathname]);
  useEffect(() => {
    (window as any).meewavMessaging.back = () => {
      const close = document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label^="Fermer"]');
      if (close) close.click();
      else if (route.pathname !== '/profile') navigate('/profile');
      else native('globe');
    };
  }, [route.pathname, navigate]);
  const renderItem = ({ id, label, Icon }: typeof items[number]) => <button key={id} aria-label={label}
    aria-current={id === 'profile' ? 'page' : undefined} onClick={() => {
      if (id === 'profile') navigate('/profile');
      else if (id === 'messages') native('messages');
      else setNotice(`${label} n’est pas encore disponible dans cette version Android.`);
    }}><Icon /><span>{label}</span></button>;
  return <div className="mobile-profile">
    <button className="mobile-profile-close" aria-label="Fermer l’application" onClick={() => native('close-app')}><X /></button>
    <Page />
    <nav className="profile-bottom-dock" aria-label="Navigation principale Meewav">
      <div className="profile-bottom-dock__surface" />
      <div className="profile-bottom-dock__side">{items.slice(0, 3).map(renderItem)}</div>
      <button className="profile-bottom-dock__globe" aria-label="Retour au globe" onClick={() => native('globe')}
        style={{ '--nav-globe-ocean': NAVBAR_GLOBE_PALETTE.ocean } as React.CSSProperties}>
        <NavGlobeTexture landColor={NAVBAR_GLOBE_PALETTE.land} size={56} /><span className="profile-bottom-dock__globe-light" />
      </button>
      <div className="profile-bottom-dock__side">{items.slice(3).map(renderItem)}</div>
    </nav>
    {notice && <aside className="mobile-profile-notice" role="status">{notice}<button aria-label="Fermer" onClick={() => setNotice('')}><X size={18}/></button></aside>}
  </div>;
}
class Boundary extends Component<{children: React.ReactNode}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="mobile-profile-error"><p>Le profil ne peut pas s’ouvrir.</p><button onClick={() => native('globe')}>Retour au globe</button></div> : this.props.children; }
}
const root = createRoot(document.getElementById('root')!);
let started = false;
(window as any).meewavMessaging = {
  back: () => native('globe'),
  async configure(config: MobileConfig) {
    if (started) return;
    started = true; configure(config);
    try {
      const { default: Page } = await import('./vendor/src/features/profile/ProfilePage');
      root.render(<Boundary><MemoryRouter initialEntries={[config.route || '/profile']}><Shell Page={Page}/></MemoryRouter></Boundary>);
    } catch { root.render(<div className="mobile-profile-error">Profil indisponible.<button onClick={() => native('globe')}>Retour au globe</button></div>); }
  },
  updateToken,
  setActive(active: boolean) { if (!active) document.querySelectorAll('audio,video').forEach(media => (media as HTMLMediaElement).pause()); },
};
window.addEventListener('pagehide', () => { root.unmount(); updateToken(null); });
