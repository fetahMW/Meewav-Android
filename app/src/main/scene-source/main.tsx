import { mountFeature } from '../shared-ui/MobileFeatureShell';
import { useLocation } from 'react-router-dom';
import { useSceneHeaderScroll } from './useSceneHeaderScroll';

mountFeature('scene', 'La Scène', async () => {
  const { default: ScenePage } = await import('./vendor/src/features/shorts/ShortsPage');
  return { default: function AndroidScenePage() {
    const route = useLocation();
    useSceneHeaderScroll(`${route.key}:${route.pathname}${route.search}`);
    return <ScenePage />;
  } };
});
