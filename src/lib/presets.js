// src/lib/presets.js
// Custom export presets — add your own platforms & sizes, persisted per device.
import { EXPORT_PRESETS } from './export'

const KEY = 'inkception.customPresets'

export function loadCustomPresets() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((p) => p && p.w > 0 && p.h > 0) : []
  } catch { return [] }
}

export function saveCustomPresets(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

export function makeCustomPreset({ platform, name, w, h }) {
  const W = Math.max(16, Math.min(8192, Math.round(Number(w) || 0)))
  const H = Math.max(16, Math.min(8192, Math.round(Number(h) || 0)))
  const ratio = (W / H).toFixed(2).replace(/\.?0+$/, '') + ':1'
  return {
    id: 'custom-' + Date.now().toString(36),
    platform: (platform || 'Custom').trim() || 'Custom',
    name: (name || `${W}×${H}`).trim() || `${W}×${H}`,
    w: W,
    h: H,
    ratio,
    use: 'Custom size',
    custom: true,
  }
}

export function allPresets(custom) {
  return [...EXPORT_PRESETS, ...(custom || [])]
}

export function findPreset(id, custom) {
  return allPresets(custom).find((p) => p.id === id) || null
}
