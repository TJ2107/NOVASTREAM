import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

// Sécurité supplémentaire : intercepter les rejections WebSocket tôt et les erreurs de chargement dynamique
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason || '');
  if (reasonStr.includes('WebSocket')) {
    event.preventDefault();
  }
});

// Recharger automatiquement en cas de désynchronisation de chunk Vite / cache PWA
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error intercepted, refreshing application assets:', event);
  const reloadKey = 'nova_vite_preload_reload';
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1');
    window.location.reload();
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
