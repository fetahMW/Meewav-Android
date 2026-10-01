import React, { useSyncExternalStore } from 'react';
import { MemoryRouter } from 'react-router-dom';
import FeatureDock from '../shared-ui/FeatureDock';
import GlobeNavigationPole from './vendor/globe-vinyle/shared/src/GlobeNavigationPole';
import { getGlobeOrientation, subscribeGlobeOrientation } from './globe-layout';

const routes: Record<string, string> = {
  messages: '/messages', profile: '/profile', rooms: '/rooms/home',
  scene: '/scene', market: '/market', tremplin: '/tremplin',
};

/** Portrait uses the shared feature dock; landscape keeps its original pole. */
export default function AndroidGlobeNavigation({ onGlobe, onNavigate }: {
  onGlobe: () => void; onNavigate: (path: string) => void;
}) {
  const orientation = useSyncExternalStore(subscribeGlobeOrientation, getGlobeOrientation);
  if (orientation === 'landscape') return <GlobeNavigationPole onGlobe={onGlobe} onNavigate={onNavigate} />;
  return <MemoryRouter><FeatureDock active="globe" layout="globe" onSelect={id => {
    if (id === 'globe') onGlobe();
    else if (routes[id]) onNavigate(routes[id]);
  }} /></MemoryRouter>;
}
