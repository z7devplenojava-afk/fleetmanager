// Polyfill para 'global' no browser
if (typeof global === 'undefined') {
  // @ts-ignore
  window.global = window;
}

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
