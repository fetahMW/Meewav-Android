import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { configure, updateToken, type MobileConfig } from './runtime';
import FeatureDock, { featureItems } from '../shared-ui/FeatureDock';

const native = (destination: string, route?: string) => location.assign(`https://appassets.androidplatform.net/native/${destination}${route ? `?route=${encodeURIComponent(route)}` : ""}`);
function Shell({ Page }: { Page: React.ComponentType }) {
  const route = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (route.pathname.startsWith('/profile')) return;
    if (['messages','tremplin','market','scene','rooms'].includes(route.pathname.split('/')[1])) native(route.pathname.split('/')[1], route.pathname + route.search + route.hash);
    else if (['/globe','/mon-globe'].includes(route.pathname)) native('globe');
    navigate(-1);
  }, [route.pathname]);
  useEffect(() => {
    (window as any).meewavMessaging.back = () => {
      const close = document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label^="Fermer"]');
      if (close) close.click();
      else if (route.key !== 'default') navigate(-1);
      else if (route.pathname !== '/profile') navigate('/profile', { replace: true });
      else native('back');
    };
  }, [route, navigate]);
  return <div className="mobile-profile">
    <button className="mobile-profile-close" aria-label="Fermer l’application" onClick={() => native('close-app')}><X /></button>
    <Page />
    <FeatureDock active="profile" onSelect={id => {
      if (id === 'profile') navigate('/profile');
      else if (['messages','tremplin','market','scene','rooms','globe'].includes(id)) native(id);
      else setNotice(`${featureItems.find(item => item.id === id)?.label} n’est pas encore disponible dans cette version Android.`);
    }} />
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
  back: () => native('back'),
  async configure(config: MobileConfig) {
    if (started) return;
    started = true; configure(config);
    try {
      const { default: Page } = await import('./vendor/src/features/profile/ProfilePage');
      root.render(<Boundary><MemoryRouter initialEntries={[config.route || '/profile']}><Shell Page={Page}/></MemoryRouter></Boundary>);
    } catch { root.render(<div className="mobile-profile-error">Profil indisponible.<button onClick={() => native('globe')}>Retour au globe</button></div>); }
  },
  updateToken,
  setActive(active: boolean) {
    document.documentElement.toggleAttribute('data-profile-inactive', !active);
    if (!active) document.querySelectorAll('audio,video').forEach(media => (media as HTMLMediaElement).pause());
  },
};
window.addEventListener('pagehide', () => { root.unmount(); updateToken(null); });
