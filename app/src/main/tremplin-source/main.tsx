import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { Coins, Heart, Menu, ReceiptText, Sparkles, Store, Wallet, X } from 'lucide-react';
import FeatureDock, { featureItems } from '../shared-ui/FeatureDock';
import { configure, updateToken, type MobileConfig } from './runtime';
import './home-mobile.css';
import './discover-mobile.css';
import './education-mobile.css';
import './artists-mobile.css';

const native = (destination: string, route?: string) => location.assign(`https://appassets.androidplatform.net/native/${destination}${route ? `?route=${encodeURIComponent(route)}` : ''}`);
function Shell({ Page }: { Page: React.ComponentType }) {
  const route = useLocation(), navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const select = (id: string) => {
    if (id === 'tremplin') navigate('/tremplin');
    else if (['profile', 'messages', 'market', 'scene', 'globe'].includes(id)) native(id);
    else setNotice(`${featureItems.find(item => item.id === id)?.label ?? 'Cette destination'} n’est pas encore disponible dans cette version Android.`);
  };
  useEffect(() => {
    if (route.pathname.startsWith('/tremplin')) return;
    const destination = route.pathname.split('/')[1];
    if (['messages', 'profile', 'market', 'scene'].includes(destination)) native(destination, route.pathname + route.search);
    else if (['globe', 'mon-globe'].includes(destination)) native('globe');
    else setNotice(`${featureItems.find(item => item.id === destination)?.label ?? 'Cette destination'} n’est pas encore disponible dans cette version Android.`);
    navigate(-1);
  }, [route.pathname, route.search, navigate]);
  const back = () => {
    const close = document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label^="Fermer"]');
    if (close) close.click();
    else if (route.pathname !== '/tremplin' || route.search) {
      if (route.key === 'default') navigate('/tremplin', { replace: true }); else navigate(-1);
    } else if (route.key !== 'default') navigate(-1);
    else native('back');
  };
  useEffect(() => { (window as any).meewavMessaging.back = back; }, [route]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const current = route.pathname + route.search;
  const menu = [
    { label: 'Mon jeton', icon: Coins, path: '/tremplin/mon-jeton' },
    { label: 'Mon solde', icon: Wallet, path: '/tremplin/mes-artistes?tab=tokens' },
    { label: 'Dernières opérations', icon: ReceiptText, path: '/tremplin/mes-artistes?tab=tokens&section=history' },
    { label: 'Mes artistes', icon: Heart, path: '/tremplin/mes-artistes' },
  ];
  return <div className="mobile-profile mobile-tremplin">
    <button className="mobile-tremplin-back" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}><Menu /></button>
    {menuOpen && <>
      <button className="mobile-tremplin-menu-overlay" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />
      <nav className="mobile-tremplin-menu" aria-label="Menu Tremplin">
        {menu.map(({ label, icon: Icon, path }) => <button key={path} aria-current={current === path ? 'page' : undefined} onClick={() => { setMenuOpen(false); navigate(path); }}><Icon size={17} /> {label}</button>)}
        <hr />
        <button onClick={() => { setMenuOpen(false); navigate('/tremplin/decouvrir'); }}><Sparkles size={17} /> Découvrir les talents</button>
        <button onClick={() => { setMenuOpen(false); native('market'); }}><Store size={17} /> Marketplace</button>
        <button onClick={() => native('close-app')}><X size={17} /> Quitter le Tremplin</button>
      </nav>
    </>}
    <button className="mobile-profile-close" aria-label="Fermer l’application" onClick={() => native('close-app')}><X /></button>
    <Page />
    <FeatureDock active="tremplin" onSelect={select} />
    {notice && <aside className="mobile-profile-notice" role="status">{notice}<button aria-label="Fermer" onClick={() => setNotice('')}><X size={18} /></button></aside>}
  </div>;
}
class Boundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="mobile-profile-error"><p>Le Tremplin ne peut pas s’ouvrir.</p><button onClick={() => location.reload()}>Réessayer</button><button onClick={() => native('globe')}>Retour au globe</button></div> : this.props.children; }
}
const root = createRoot(document.getElementById('root')!);
let started = false;
(window as any).meewavMessaging = {
  back: () => native('back'),
  async configure(config: MobileConfig) {
    if (started) return;
    started = true; configure(config);
    try {
      const { default: Page } = await import('./vendor/src/features/tremplin/TremplinPage');
      root.render(<Boundary><MemoryRouter initialEntries={[config.route || '/tremplin']}><Shell Page={Page} /></MemoryRouter></Boundary>);
    } catch { root.render(<div className="mobile-profile-error">Tremplin indisponible.<button onClick={() => location.reload()}>Réessayer</button><button onClick={() => native('globe')}>Retour au globe</button></div>); }
  },
  updateToken,
  setActive(active: boolean) {
    document.documentElement.toggleAttribute('data-profile-inactive', !active);
    window.dispatchEvent(new CustomEvent('meewav:tremplin-active', { detail: active }));
    if (!active) document.querySelectorAll('audio,video').forEach(media => (media as HTMLMediaElement).pause());
  },
};
window.addEventListener('pagehide', () => { root.unmount(); updateToken(null); });
