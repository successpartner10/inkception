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
