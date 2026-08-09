// Command bar (AI audit capability #2) — parses plain-English phrases into
// concrete tool actions. Runs 100% locally; this is the "front door" for the
// AI suite: "Design with words, not menus."

// Returns one of:
//   { action: 'removebg' | 'replacebg' | 'enhance' | 'upscale' | 'vectorize'
//           | 'undo' | 'redo' | 'reset' }
//   { action: 'fx',      payload: Partial<quick-fx state> }
//   { action: 'filters', payload: Partial<filter state> }
//   { action: 'unknown' }
export function matchPrompt(raw) {
  const t = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9×+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return null
  const has = (...ks) => ks.some((k) => t.includes(k))

  // background ops (check "remove" before "replace")
  if (has('remove') && has('background')) return { action: 'removebg' }
  if (has('removebg') || has('cut out') || has('cutout') || has('isolate')) return { action: 'removebg' }
  if (has('background') && (has('replace') || has('change') || has('swap'))) return { action: 'replacebg' }

  // resolution
  if (has('upscale') || has('4x') || has('4×') || has('higher res') || has('enlarge')) return { action: 'upscale' }

  // vector
  if (has('vector') || has('svg') || has('trace')) return { action: 'vectorize' }

  // enhance
  if (has('enhance') || has('make it pop') || has('fix lighting') || has('auto')) return { action: 'enhance' }

  // color / fx
  if (has('black') && has('white')) return { action: 'fx', payload: { bw: true } }
  if (has('monochrome') || has('grayscale') || has('b&w') || has('b w')) return { action: 'fx', payload: { bw: true } }
  if (has('sepia')) return { action: 'fx', payload: { sepia: true } }
  if (has('vintage')) return { action: 'fx', payload: { vintage: true } }
  if (has('invert') || has('negative')) return { action: 'fx', payload: { invert: true } }
  if (has('noise') || has('grain')) return { action: 'fx', payload: { noise: 50 } }
  if (has('pixelate') || has('pixel')) return { action: 'fx', payload: { pixelate: 8 } }
  if (has('sharpen')) return { action: 'fx', payload: { sharpen: true } }
  if (has('blur') || has('soften')) return { action: 'fx', payload: { blur: 0.35 } }
  if (has('flip') || has('mirror')) return { action: 'fx', payload: { flipX: true } }
  if (has('rotate')) return { action: 'fx', payload: { angle: 90 } }

  // adjust
  if (has('warm')) return { action: 'filters', payload: { temperature: 45 } }
  if (has('cool') || has('cold')) return { action: 'filters', payload: { temperature: -45 } }
  if (has('bright') || has('lighten') || has('lighter')) return { action: 'filters', payload: { brightness: 112 } }
  if (has('dark') || has('darken') || has('dimmer')) return { action: 'filters', payload: { brightness: 88 } }
  if (has('contrast')) return { action: 'filters', payload: { contrast: 115 } }
  if (has('saturate') || has('vivid')) return { action: 'filters', payload: { saturation: 120 } }
  if (has('desaturate') || has('muted')) return { action: 'filters', payload: { saturation: 60 } }

  // history
  if (has('undo') || has('revert')) return { action: 'undo' }
  if (has('redo')) return { action: 'redo' }
  if (has('reset')) return { action: 'reset' }

  return { action: 'unknown' }
}

export const PROMPT_SUGGESTIONS = [
  'Remove background',
  'Replace background',
  'Make it warmer',
  'Black & white',
  'Upscale 4×',
  'Reset',
]
