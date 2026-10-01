import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import FeatureDock from '../shared-ui/FeatureDock';

const routes: Record<string, string> = {
  messages: '/messages', profile: '/profile', rooms: '/rooms/home',
  scene: '/scene', market: '/market', tremplin: '/tremplin',
};

/** The same dock as every Android feature, retaining the globe's navigation. */
export default function AndroidGlobeNavigation({ onGlobe, onNavigate }: {
  onGlobe: () => void; onNavigate: (path: string) => void;
}) {
  return <MemoryRouter><FeatureDock active="globe" layout="globe" onSelect={id => {
    if (id === 'globe') onGlobe();
    else if (routes[id]) onNavigate(routes[id]);
  }} /></MemoryRouter>;
}
