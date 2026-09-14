import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './vendor/globe-vinyle/shared/src/App';
import { attachRoot } from './full-globe-bridge';

// The original Web scene owns its camera, sky, geography and controls.
// Android owns orientation, authentication and the back button.
const root = createRoot(document.getElementById('root')!);
attachRoot(root);
root.render(<App />);
