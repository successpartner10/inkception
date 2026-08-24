import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initTheme, applyScale, getScale } from './lib/theme'

// Spec §16 — version tag exposed at runtime for cache-proofing.
window.__INKCEPTION_VERSION__ = __INKCEPTION_VERSION__

// Apply the saved interface theme + text size before first paint (no flash).
initTheme()
applyScale(getScale())

// PWA — register the service worker for offline + installability.
// Only on https/localhost (never on file:// — the standalone offline file
// doesn't need it).
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/file:/.test(location.protocol)) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl).catch(() => { /* offline file / unsupported — fine */ })
  })
}

createRoot(document.getElementById('root')).render(<App />)
