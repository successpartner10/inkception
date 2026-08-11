import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initTheme } from './lib/theme'

// Spec §16 — version tag exposed at runtime for cache-proofing.
window.__INKCEPTION_VERSION__ = __INKCEPTION_VERSION__

// Apply the saved interface theme before first paint (no flash).
initTheme()

createRoot(document.getElementById('root')).render(<App />)
