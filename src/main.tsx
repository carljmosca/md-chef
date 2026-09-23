import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker (works in both dev with devOptions and production)
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      console.log('PWA Service Worker registered successfully:', r.scope);
    }
  },
  onRegisterError(error) {
    console.warn('PWA Service Worker registration failed:', error);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

