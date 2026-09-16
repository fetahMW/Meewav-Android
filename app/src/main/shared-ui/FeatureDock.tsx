import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Mail, UserRound, Box, Play, Store, Rocket, ChevronDown, ChevronUp } from 'lucide-react';
import NavGlobeTexture from '../globe-source/full-globe-nav-texture';
import { NAVBAR_GLOBE_PALETTE } from '../globe-source/vendor/globe-vinyle/shared/src/globe-palette.mjs';
import './feature-dock.css';

export const featureItems = [
  { id: 'messages', label: 'Messagerie', Icon: Mail },
  { id: 'profile', label: 'Profil', Icon: UserRound },
  { id: 'rooms', label: 'Rooms', Icon: Box },
  { id: 'scene', label: 'La Scène', Icon: Play },
  { id: 'market', label: 'Marketplace', Icon: Store },
  { id: 'tremplin', label: 'Tremplin', Icon: Rocket },
] as const;

/** Shared Profile/Tremplin geometry and material, sourced from profile mobile.css. */
export default function FeatureDock({ active, onSelect, compact = false }: { active: string; onSelect: (id: string) => void; compact?: boolean }) {
  const [collapsed, setCollapsed] = useState(compact);
  const [editing, setEditing] = useState(false);
  const [covered, setCovered] = useState(false);
  const manualUntil = useRef(0);
  const route = useLocation();
  useEffect(() => { setCollapsed(compact); }, [compact, route.key]);
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--feature-dock-inset', editing ? '0px' : collapsed ? '28px' : '104px');
    return () => document.documentElement.style.removeProperty('--feature-dock-inset');
  }, [collapsed, editing]);
  useEffect(() => {
    // Sheets belong above the dock even when their feature creates an isolated
    // stacking context. Do not cover a sheet's footer with navigation controls.
    let frame = 0;
    const check = () => {
      frame = 0;
      setCovered([...document.querySelectorAll<HTMLElement>('[role="dialog"], [aria-modal="true"]')]
        .some(dialog => dialog.getClientRects().length > 0 && getComputedStyle(dialog).visibility !== 'hidden'));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'aria-hidden', 'open'] });
    check();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => {
    const editable = () => document.activeElement instanceof HTMLElement
      && document.activeElement.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]),textarea,[contenteditable=true]');
    const focus = () => setEditing(editable());
    const blur = () => queueMicrotask(focus);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', blur);
    return () => { document.removeEventListener('focusin', focus); document.removeEventListener('focusout', blur); };
  }, []);
  useEffect(() => {
    if (compact) return; // Reading a conversation must not move its composer.
    let gestureAt = 0, distance = 0, previousTarget: HTMLElement | null = null, previousY = 0;
    const gesture = () => { gestureAt = performance.now(); };
    const scroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.scrollHeight <= target.clientHeight + 4
        || target.closest('[role=dialog],.market-overlay,.mw-overlay,.feature-dock-host')
        || performance.now() - gestureAt > 700 || performance.now() < manualUntil.current) return;
      const y = Math.max(0, Math.min(target.scrollTop, target.scrollHeight - target.clientHeight));
      if (target !== previousTarget) { previousTarget = target; previousY = y; distance = 0; return; }
      const delta = y - previousY;
      previousY = y;
      if (Math.abs(delta) < 1) return;
      distance = Math.sign(distance) === Math.sign(delta) ? distance + delta : delta;
      if (y < 8 || distance < -28) { setCollapsed(false); distance = 0; }
      else if (distance > 56) { setCollapsed(true); distance = 0; }
    };
    document.addEventListener('touchmove', gesture, { passive: true });
    document.addEventListener('wheel', gesture, { passive: true });
    document.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('touchmove', gesture);
      document.removeEventListener('wheel', gesture);
      document.removeEventListener('scroll', scroll, true);
    };
  }, [compact]);
  const item = ({ id, label, Icon }: typeof featureItems[number]) => <button key={id} type="button"
    aria-label={label} aria-current={id === active ? 'page' : undefined} onClick={() => onSelect(id)}>
    <Icon /><span>{label}</span>
  </button>;
  return createPortal(<div className={`feature-dock-host${collapsed ? ' is-collapsed' : ''}${editing || covered ? ' is-editing' : ''}`}>
    <button type="button" className="feature-dock-toggle" aria-label={collapsed ? 'Afficher la navigation' : 'Replier la navigation'}
      aria-expanded={!collapsed} aria-controls="feature-dock-navigation" onClick={() => {
        manualUntil.current = performance.now() + 1600;
        setCollapsed(value => !value);
      }}>{collapsed ? <ChevronUp /> : <ChevronDown />}</button>
    <nav id="feature-dock-navigation" className="profile-bottom-dock" aria-label="Navigation principale Meewav" inert={collapsed || editing}>
    <div className="profile-bottom-dock__surface" />
    <div className="profile-bottom-dock__side">{featureItems.slice(0, 3).map(item)}</div>
    <button type="button" className="profile-bottom-dock__globe" aria-label="Retour au globe" onClick={() => onSelect('globe')}
      style={{ '--nav-globe-ocean': NAVBAR_GLOBE_PALETTE.ocean } as React.CSSProperties}>
      <NavGlobeTexture landColor={NAVBAR_GLOBE_PALETTE.land} size={56} rotationSeconds={40} />
      <span className="profile-bottom-dock__globe-light" />
    </button>
    <div className="profile-bottom-dock__side">{featureItems.slice(3).map(item)}</div>
    </nav>
  </div>, document.body);
}
