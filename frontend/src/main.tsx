// Polyfill para 'global' no browser
if (typeof global === 'undefined') {
  // @ts-ignore
  window.global = window;
}

// Gerenciamento e desregistro automático de Service Workers com cache antigo/quebrado (bad-precaching-response)
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => void r.unregister());
    });
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason = typeof event.reason === 'string' ? event.reason : event.reason?.message;
    const str = typeof reason === 'string' ? reason : '';
    if (str.includes('bad-precaching-response') || str.includes('workbox')) {
      event.preventDefault();
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister());
      });
    }
  });
}

// Ignorar rejeições conhecidas de extensões do Chrome (ruído no console, não é bug da app).
window.addEventListener("unhandledrejection", (event) => {
  const reason =
    typeof event.reason === "string"
      ? event.reason
      : event.reason?.message;
  const str = typeof reason === "string" ? reason : "";

  if (
    str.includes("message channel closed before a response was received") ||
    str.includes("asynchronous response by returning true")
  ) {
    event.preventDefault();
  }
});

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
