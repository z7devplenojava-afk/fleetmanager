// Polyfill para 'global' no browser
if (typeof global === 'undefined') {
  // @ts-ignore
  window.global = window;
}

// Dev: desregistra Service Workers antigos (PWA) que podem interceptar /api e gerar ERR_SSL / login quebrado
if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => {
      void r.unregister();
    });
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
