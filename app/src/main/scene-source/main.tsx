import { mountFeature } from '../shared-ui/MobileFeatureShell';
mountFeature('scene', 'La Scène', () => import('./vendor/src/features/shorts/ShortsPage'));
