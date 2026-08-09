import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Spec §16 — version tag exposed at runtime for cache-proofing.
window.__INKCEPTION_VERSION__ = __INKCEPTION_VERSION__

createRoot(document.getElementById('root')).render(<App />)
