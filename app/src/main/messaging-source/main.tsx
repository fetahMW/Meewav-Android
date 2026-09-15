import React, { Component, useEffect, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Plus, X } from 'lucide-react';
import { configure, previewEnabled, updateToken, type MobileConfig } from './runtime';

const root = createRoot(document.getElementById('root')!);
let started = false;
let disposed = false;
const returnToGlobe = () => location.assign('https://appassets.androidplatform.net/native/globe');
const closeApplication = () => location.assign('https://appassets.androidplatform.net/native/close-app');

class ErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <section className="mobile-message-error"><MessageCircle size={32} />
      <h1>Messagerie indisponible</h1><p>Reviens au globe puis réessaie.</p>
      <button onClick={returnToGlobe}>Retour au globe</button></section> : this.props.children;
  }
}

function MobileShell({ Page }: { Page: React.ComponentType }) {
  const current = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(() => {
    const params = new URLSearchParams(current.search);
    return ['mockArtistId', 'conversation', 'request', 'project', 'group'].some(key => params.has(key));
  });
  const [downloadError, setDownloadError] = useState(false);
  useEffect(() => {
    const failed = () => setDownloadError(true);
    window.addEventListener('meewav:download-error', failed);
    return () => window.removeEventListener('meewav:download-error', failed);
  }, []);
  const space = new URLSearchParams(current.search).get('space') || 'messages';
  useLayoutEffect(() => {
    if (!detail) return;
    const timeline = document.querySelector<HTMLElement>('.mw-chat-timeline');
    if (timeline) timeline.scrollTop = space === 'collabs' ? 0 : timeline.scrollHeight;
    const fitKeyboard = () => {
      if (document.activeElement?.closest('.mw-composer') && timeline) timeline.scrollTop = timeline.scrollHeight;
    };
    window.addEventListener('resize', fitKeyboard);
    return () => window.removeEventListener('resize', fitKeyboard);
  }, [detail]);
  useEffect(() => {
    if (!current.pathname.startsWith('/messages')) returnToGlobe();
  }, [current.pathname]);
  useEffect(() => {
    const open = () => setDetail(true);
    const close = () => { setDetail(false); (document.activeElement as HTMLElement)?.blur(); };
    window.addEventListener('meewav:messaging-detail', open);
    window.addEventListener('meewav:messaging-list', close);
    (window as any).meewavMessaging.back = () => {
      // Let the existing dialog handlers close their own panels before leaving.
      const closeButton = document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label^="Fermer"], .mw-overlay button[aria-label^="Fermer"], .mw-conversation-drawer button[aria-label^="Fermer"]');
      if (closeButton) { closeButton.click(); return; }
      if (detail) close(); else returnToGlobe();
    };
    return () => {
      window.removeEventListener('meewav:messaging-detail', open);
      window.removeEventListener('meewav:messaging-list', close);
    };
  }, [detail]);
  return <div className={`mobile-messaging${detail ? ' is-detail' : ''}`}>
    <header className="mobile-messaging-header">
      <button aria-label="Retour à la fonctionnalité précédente" onClick={returnToGlobe}><ChevronLeft /></button>
      <div><strong>Messagerie</strong>{previewEnabled() && <small>Aperçu sans compte</small>}</div>
      <span className="mobile-messaging-header__actions"><button aria-label={space === 'groups' ? 'Créer un groupe' : space === 'projects' ? 'Nouveau projet' : 'Nouvelle conversation'} onClick={() => {
        if (space === 'groups' || space === 'projects') {
          window.dispatchEvent(new CustomEvent('meewav:messaging-new-space', { detail: space }));
          setDetail(true);
        } else {
          navigate('/messages?space=messages');
          window.dispatchEvent(new Event('meewav:messaging-compose'));
        }
      }}><Plus /></button>
      <button aria-label="Fermer l’application et revenir à l’accueil Samsung" onClick={closeApplication}><X /></button></span>
    </header>
    <Page />
    {downloadError && <div className="mobile-download-error" role="alert">Ce fichier n’a pas pu être enregistré.<button aria-label="Fermer" onClick={() => setDownloadError(false)}>Fermer</button></div>}
  </div>;
}

(window as any).meewavMessaging = {
  status: 'loading', back: returnToGlobe,
  async configure(value: MobileConfig) {
    if (started || disposed) return;
    started = true;
    try {
      configure(value);
      const { default: Page } = await import('./vendor/src/features/messaging/MessagingPage');
      if (disposed) return;
      const route = value.route?.startsWith('/messages') ? value.route : '/messages?space=messages';
      root.render(<ErrorBoundary><MemoryRouter initialEntries={[route]}><MobileShell Page={Page} /></MemoryRouter></ErrorBoundary>);
      (window as any).meewavMessaging.status = 'ready';
    } catch {
      (window as any).meewavMessaging.status = 'error';
      root.render(<section className="mobile-message-error"><h1>Messagerie indisponible</h1><button onClick={returnToGlobe}>Retour au globe</button></section>);
    }
  },
  updateToken,
  setActive(active: boolean) {
    if (!active) {
      document.querySelectorAll('audio, video').forEach(item => (item as HTMLMediaElement).pause());
      window.dispatchEvent(new Event('meewav:messaging-suspend'));
    }
    window.dispatchEvent(new Event(active ? 'focus' : 'blur'));
  },
};
window.addEventListener('pagehide', () => { disposed = true; root.unmount(); updateToken(null); });

// Remote placeholder portraits in historical demos never trigger a download.
// Real signed media stays on its authorized service; unavailable portraits get
// the same local generic avatar as the Web, without an image-error loop.
document.addEventListener('error', event => {
  const target = event.target;
  if (target instanceof HTMLImageElement && !target.dataset.fallback && !target.src.includes('meewav-emojis')) {
    target.dataset.fallback = 'true'; target.src = '/avatars/utilisateur.png';
  }
}, true);
