import { mountFeature } from '../shared-ui/MobileFeatureShell';
mountFeature('market', 'Le Marketplace', () => import('./vendor/src/features/market/MarketPage'));
