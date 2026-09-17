import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Heart, History, Menu, Package, Settings, ShoppingCart, Undo2, X } from 'lucide-react';
import FeatureDock from './FeatureDock';
import { configure, updateToken, type MobileConfig } from '../profile-source/runtime';

const native = (destination: string, route?: string) => location.assign(`https://appassets.androidplatform.net/native/${destination}${route ? `?route=${encodeURIComponent(route)}` : ''}`);
const FEATURE_MENU_ITEMS = [
  { action: 'transactions', label: 'Historique des transactions', icon: History },
  { action: 'orders', label: 'Mes commandes', icon: Package },
  { action: 'listings', label: 'Mes annonces', icon: ClipboardList },
  { action: 'favorites', label: 'Mes favoris', icon: Heart },
  { action: 'cart', label: 'Mon panier', icon: ShoppingCart },
  { action: 'settings', label: 'Réglages', icon: Settings },
] as const;
export function mountFeature(id: 'market' | 'scene' | 'rooms', title: string, load: () => Promise<{ default: React.ComponentType }>) {
  function Shell({ Page }: { Page: React.ComponentType }) {
    const route = useLocation(), navigate = useNavigate();
    const [notice, setNotice] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const back = () => {
      if (document.fullscreenElement) { void document.exitFullscreen(); return; }
      const close = [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"]:not([aria-hidden="true"]) button[aria-label^="Fermer"]')]
        .find(button => button.getClientRects().length > 0 && getComputedStyle(button).visibility !== 'hidden');
      if (close) { close.click(); return; }
      if (!window.dispatchEvent(new Event('meewav:feature-back', { cancelable: true }))) return;
      if (route.key !== 'default') navigate(-1);
      else if (route.pathname !== `/${id}` || route.search) navigate(`/${id}`, { replace: true });
      else native('back');
    };
    const menuAction = (action: string) => {
      setMenuOpen(false);
      if (action === 'back') { back(); return; }
      if (window.dispatchEvent(new CustomEvent('meewav:feature-menu', { detail: action, cancelable: true }))) {
        setNotice('Cette section sera disponible dans une prochaine étape.');
      }
    };
    useEffect(() => {
      if (!menuOpen) return;
      const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
      window.addEventListener('keydown', close);
      return () => window.removeEventListener('keydown', close);
    }, [menuOpen]);
    useEffect(() => { (window as any).meewavMessaging.back = back; }, [route]);
    useEffect(() => {
      const destination = route.pathname.split('/')[1];
      if (destination === id) return;
      if (['messages','profile','tremplin','market','scene','rooms'].includes(destination)) native(destination, route.pathname + route.search + route.hash);
      else if (['globe','mon-globe'].includes(destination)) native('globe');
      else setNotice('Cette destination sera disponible dans une prochaine étape.');
      navigate(-1);
    }, [route.pathname, route.search]);
    useEffect(() => {
      if (!notice) return;
      const timer = window.setTimeout(() => setNotice(''), 5000);
      return () => window.clearTimeout(timer);
    }, [notice]);
    return <div className={`mobile-profile mobile-feature mobile-${id}`}>
      <button className="mobile-feature-back" aria-label="Menu" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}><Menu /></button>
      {menuOpen && <>
        <button className="mobile-feature-menu-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
        <nav className="mobile-feature-menu" aria-label="Menu rapide">
          {FEATURE_MENU_ITEMS.map(item => <button key={item.action} type="button" role="menuitem" onClick={() => menuAction(item.action)}><item.icon aria-hidden="true" /><span>{item.label}</span></button>)}
          <button type="button" role="menuitem" className="mobile-feature-menu__back" onClick={() => menuAction('back')}><Undo2 aria-hidden="true" /><span>Retour</span></button>
        </nav>
      </>}
      <button className="mobile-profile-close" aria-label="Fermer l’application" onClick={() => native('close-app')}><X /></button>
      <Page />
      <FeatureDock active={id} onSelect={destination => {
        if (destination === id) navigate(`/${id}`);
        else native(destination);
      }} />
      {notice && <aside className="mobile-profile-notice" role="status">{notice}<button aria-label="Fermer" onClick={() => setNotice('')}><X size={18} /></button></aside>}
    </div>;
  }
  class Boundary extends Component<{children: React.ReactNode}, {failed: boolean}> {
    state = {failed: false};
    static getDerivedStateFromError() { return {failed: true}; }
    render() { return this.state.failed ? <div className="mobile-profile-error"><p>{title} ne peut pas s’ouvrir.</p><button onClick={() => location.reload()}>Réessayer</button><button onClick={() => native('globe')}>Retour au globe</button></div> : this.props.children; }
  }
  const root = createRoot(document.getElementById('root')!);
  let started = false;
  (window as any).meewavMessaging = {
    back: () => native('back'),
    async configure(config: MobileConfig) {
      if (started) return;
      started = true; configure(config);
      try {
        const {default: Page} = await load();
        root.render(<Boundary><MemoryRouter initialEntries={[config.route || `/${id}`]}><Shell Page={Page} /></MemoryRouter></Boundary>);
      } catch { root.render(<div className="mobile-profile-error"><p>{title} indisponible.</p><button onClick={() => location.reload()}>Réessayer</button><button onClick={() => native('globe')}>Retour au globe</button></div>); }
    },
    updateToken,
    setActive(active: boolean) {
      document.documentElement.toggleAttribute('data-profile-inactive', !active);
      if (!active) document.querySelectorAll('audio,video').forEach(media => (media as HTMLMediaElement).pause());
    },
  };
  window.addEventListener('pagehide', () => { root.unmount(); updateToken(null); });
}
