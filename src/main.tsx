import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

// Sécurité supplémentaire : intercepter les rejections WebSocket tôt
window.addEventListener('unhandledrejection', (event) => {
  if (String(event.reason || '').includes('WebSocket')) {
    event.preventDefault();
  }
});

import App from './App.tsx';
import './index.css';

// Register PWA Service Worker via vite-plugin-pwa for both dev and prod preview
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('Nouvelle version de NOVASTREAM disponible. Recharger ?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('Application NOVASTREAM prête pour une utilisation hors-ligne.');
    },
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
