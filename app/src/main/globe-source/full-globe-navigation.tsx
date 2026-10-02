import React, { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import FeatureDock from '../shared-ui/FeatureDock';
import { installGlobeDockMotion } from './globe-dock-motion';
import './globe-dock.css';

const routes: Record<string, string> = {
  messages: '/messages', profile: '/profile', rooms: '/rooms/home',
  scene: '/scene', market: '/market', tremplin: '/tremplin',
};

/** One physical chassis survives every orientation, including its folded state. */
export default function AndroidGlobeNavigation({ onGlobe, onNavigate }: {
  onGlobe: () => void; onNavigate: (path: string) => void;
}) {
  useLayoutEffect(installGlobeDockMotion, []);
  return <MemoryRouter><FeatureDock active="globe" layout="globe" deviceFixed onSelect={id => {
    if (id === 'globe') onGlobe();
    else if (routes[id]) onNavigate(routes[id]);
  }} /></MemoryRouter>;
}
