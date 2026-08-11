// src/lib/recipes.js
// Recipes — save your repeated steps as one-click custom tasks.
// Fully local: everything lives in localStorage, nothing leaves the device.
//
// A recipe is a list of steps: { key, label }. `key` names a runner in the
// Editor's RECIPE_RUNNERS registry (a free/local, deterministic operation
// that needs no extra input). We also track per-key usage stats so the UI
// can surface "most used" actions and later learn patterns.

const RECIPES_KEY = 'inkception.recipes.v1'
const STATS_KEY = 'inkception.stats.v1'

export function loadRecipes() {
  try {
    const v = localStorage.getItem(RECIPES_KEY)
    const a = v ? JSON.parse(v) : []
    return Array.isArray(a) ? a : []
  } catch { return [] }
}

export function saveRecipes(list) {
  try { localStorage.setItem(RECIPES_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

export function loadStats() {
  try {
    const v = localStorage.getItem(STATS_KEY)
    return v ? JSON.parse(v) : {}
  } catch { return {} }
}

export function saveStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch { /* ignore */ }
}

export const uid = () => 'rcp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function defaultRecipe(steps = [], name = '') {
  const now = Date.now()
  return {
    id: uid(),
    name: name || 'My Recipe',
    emoji: suggestEmoji(steps),
    steps,
    created: now,
    updated: now,
    runs: 0,
    lastRun: null,
  }
}

/** Auto-name from step labels: "Enhance + Crop to Square" */
export function suggestName(steps) {
  const names = (steps || []).map((s) => s.label).filter(Boolean)
  if (!names.length) return 'My Recipe'
  const short = names.slice(0, 2)
  const label = short.join(' + ')
  return names.length > 2 ? label + '…' : label
}

/** Pick an emoji from the kinds of steps in the recipe. */
export function suggestEmoji(steps) {
  const txt = (steps || []).map((s) => s.label || '').join(' ').toLowerCase()
  const map = [
    [/face|teeth|skin|eye|lip|portrait|glamour|slim|chin|hair/, '✨'],
    [/crop|square|portrait|size|1080|resize/, '📐'],
    [/(^|[\s.-])old([\s.-]|$)|sepia|vintage|aged|restore|black.?white|b&w|old photo/, '🕰️'],
    [/enhance|hdr|pop|color|saturat|warm|golden|brighten/, '🎨'],
    [/sharpen|sharp|focus|tilt/, '🎯'],
    [/remove|background|cutout|erase|matte/, '✂️'],
    [/blur|glitch|neon|kaleido|pixel|halftone|posterize|noise|grain/, '🌀'],
    [/sketch|charcoal|pencil|draw/, '✏️'],
    [/photo/, '🖼️'],
  ]
  for (const [re, emoji] of map) if (re.test(txt)) return emoji
  return '⭐'
}

/** Bump usage of a runner key (self-learning stats). */
export function bumpUsage(stats, key) {
  if (!key) return stats
  const cur = stats[key] || { n: 0, last: 0 }
  stats[key] = { n: cur.n + 1, last: Date.now() }
  return stats
}

/** Top-N most-used keys by (count desc, recency desc). */
export function mostUsed(stats, limit = 6) {
  return Object.entries(stats || {})
    .filter(([, v]) => v && v.n > 0)
    .sort((a, b) => b[1].n - a[1].n || (b[1].last || 0) - (a[1].last || 0))
    .slice(0, limit)
    .map(([k]) => k)
}

export function stepSummary(steps) {
  const labels = (steps || []).map((s) => s.label || s.key).filter(Boolean).slice(0, 3)
  const s = labels.join(' → ')
  return (steps || []).length > 3 ? s + '…' : s
}
