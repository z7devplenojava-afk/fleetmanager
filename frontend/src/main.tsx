// Polyfill para 'global' no browser
if (typeof global === 'undefined') {
  // @ts-ignore
  window.global = window;
}

// Listener oficial do Vite para novos deploys: se um chunk antigo falhar (404), recarrega a página automaticamente
window.addEventListener('vite:preloadError', (event) => {
  console.warn('🔄 Nova versão do FluxBus disponível. Atualizando aplicação...');
  window.location.reload();
});

// Gerenciamento e desregistro automático de Service Workers com cache antigo/quebrado (bad-precaching-response)
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  const safeCleanupWorkers = () => {
    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((r) => {
          void r.unregister().catch(() => {});
        });
      })
      .catch(() => {});
    if ('caches' in window) {
      void caches
        .keys()
        .then((names) => {
          names.forEach((name) => {
            void caches.delete(name).catch(() => {});
          });
        })
        .catch(() => {});
    }
  };

  if (import.meta.env.DEV) {
    safeCleanupWorkers();
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason =
      typeof event.reason === 'string'
        ? event.reason
        : event.reason?.message || String(event.reason || '');
    const str = typeof reason === 'string' ? reason : '';
    if (
      str.includes('bad-precaching-response') ||
      str.includes('workbox') ||
      str.includes('importScripts')
    ) {
      event.preventDefault();
      safeCleanupWorkers();
    } else if (
      str.includes('Failed to fetch dynamically imported module') ||
      str.includes('Importing a module script failed')
    ) {
      event.preventDefault();
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', 'true');
        window.location.reload();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const filename = event.filename || '';
    const message = event.message || '';
    if (
      filename.includes('sw.js') ||
      filename.includes('workbox') ||
      message.includes('workbox') ||
      message.includes('importScripts')
    ) {
      safeCleanupWorkers();
    }
  });
}

// Ignorar rejeições conhecidas de extensões do Chrome (ruído no console, não é bug da app).
window.addEventListener(
  'unhandledrejection',
  (event) => {
    const reason =
      typeof event.reason === 'string'
        ? event.reason
        : event.reason?.message || String(event.reason || '');
    const str = (typeof reason === 'string' ? reason : '').toLowerCase();

    if (
      str.includes('message channel closed before a response was received') ||
      str.includes('asynchronous response by returning true') ||
      str.includes('a listener indicated an asynchronous response') ||
      str.includes('extension context invalidated')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
