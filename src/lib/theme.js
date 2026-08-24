// src/lib/theme.js
// Interface appearance presets — "Dark" (default, the monochrome studio look),
// "Light" (light chrome, black canvas stays), "Auto" (follow the OS).
// Persisted per device in localStorage; applied via data-theme on <html>.
// No account, no server — it's just a local preference.

const THEME_KEY = 'inkception.theme'

export function getTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark' || v === 'auto') return v
  } catch { /* ignore */ }
  return 'dark' // default
}

export function effectiveTheme(t) {
  const mode = t === 'auto'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : t
  return mode === 'light' ? 'light' : 'dark'
}

export function applyTheme(t) {
  const mode = effectiveTheme(t)
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  // sync the meta theme-color so mobile browser chrome matches
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'light' ? '#f5f5f5' : '#000000')
  return mode
}

export function setTheme(t) {
  try { localStorage.setItem(THEME_KEY, t) } catch { /* ignore */ }
  applyTheme(t)
  window.dispatchEvent(new CustomEvent('inkception-theme', { detail: { theme: t } }))
}

/** Call once before first render to avoid a dark→light flash. */
export function initTheme() {
  applyTheme(getTheme())
  // keep "Auto" in sync when the OS theme changes
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (getTheme() === 'auto') applyTheme('auto')
    })
  } catch { /* older browsers */ }
}

/** Labels shown in the Settings UI. */
export const THEME_OPTIONS = [
  { id: 'dark', label: 'Dark', desc: 'Monochrome studio — default' },
  { id: 'light', label: 'Light', desc: 'Light chrome, black canvas' },
  { id: 'auto', label: 'Auto', desc: 'Follow your device' },
]

/* ------------------------------------------------------------------ */
/* Interface text size — Comfort / Normal / Large (Settings).           */
/* Every size in the app is rem-based, so one class on <html> scales    */
/* the whole UI. Persisted locally, no server.                          */
/* ------------------------------------------------------------------ */
const SCALE_KEY = 'inkception.scale'

export function getScale() {
  try {
    const v = localStorage.getItem(SCALE_KEY)
    if (v === 'comfort' || v === 'normal' || v === 'large') return v
  } catch { /* ignore */ }
  return 'normal'
}

export function applyScale(s) {
  const root = document.documentElement
  root.classList.toggle('ik-scale-comfort', s === 'comfort')
  root.classList.toggle('ik-scale-large', s === 'large')
}

export function setScale(s) {
  try { localStorage.setItem(SCALE_KEY, s) } catch { /* ignore */ }
  applyScale(s)
}

/** Labels shown in the Settings UI. */
export const SCALE_OPTIONS = [
  { id: 'comfort', label: 'Comfort', desc: 'Compact — more canvas' },
  { id: 'normal', label: 'Normal', desc: 'Bigger & bolder — default' },
  { id: 'large', label: 'Large', desc: 'Maximum readability' },
]
