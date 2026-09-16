import React from 'react';
import { Mail, UserRound, Box, Play, Store, Rocket } from 'lucide-react';
import NavGlobeTexture from '../globe-source/full-globe-nav-texture';
import { NAVBAR_GLOBE_PALETTE } from '../globe-source/vendor/globe-vinyle/shared/src/globe-palette.mjs';

export const featureItems = [
  { id: 'messages', label: 'Messagerie', Icon: Mail },
  { id: 'profile', label: 'Profil', Icon: UserRound },
  { id: 'rooms', label: 'Rooms', Icon: Box },
  { id: 'scene', label: 'La Scène', Icon: Play },
  { id: 'market', label: 'Marketplace', Icon: Store },
  { id: 'tremplin', label: 'Tremplin', Icon: Rocket },
] as const;

/** Shared Profile/Tremplin geometry and material, sourced from profile mobile.css. */
export default function FeatureDock({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  const item = ({ id, label, Icon }: typeof featureItems[number]) => <button key={id} type="button"
    aria-label={label} aria-current={id === active ? 'page' : undefined} onClick={() => onSelect(id)}>
    <Icon /><span>{label}</span>
  </button>;
  return <nav className="profile-bottom-dock" aria-label="Navigation principale Meewav">
    <div className="profile-bottom-dock__surface" />
    <div className="profile-bottom-dock__side">{featureItems.slice(0, 3).map(item)}</div>
    <button type="button" className="profile-bottom-dock__globe" aria-label="Retour au globe" onClick={() => onSelect('globe')}
      style={{ '--nav-globe-ocean': NAVBAR_GLOBE_PALETTE.ocean } as React.CSSProperties}>
      <NavGlobeTexture landColor={NAVBAR_GLOBE_PALETTE.land} size={56} rotationSeconds={40} />
      <span className="profile-bottom-dock__globe-light" />
    </button>
    <div className="profile-bottom-dock__side">{featureItems.slice(3).map(item)}</div>
  </nav>;
}
