// Command bar (AI audit capability #2) — parses plain-English phrases into
// concrete tool actions. Runs 100% locally; this is the "front door" for the
// AI suite: "Design with words, not menus."

/** Split a multi-step command into individual phrases.
 *  "auto enhance, now crop to square, then black & white"
 *  → ["auto enhance", "crop to square", "black & white"] */
export function splitCommandChain(text) {
  return String(text || '')
    .split(/\s*(?:,|\bthen\b|\bnow\b|\band\b|\bafter that\b|\bnext\b|\b\.\s*)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)
}

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

  // navigation — "open quick menu", "open ai menu", etc. (check early)
  if (has('open') && (has('quick') || has('quick menu'))) return { action: 'nav', payload: { tab: 'quick' } }
  if (has('open') && (has('ai menu') || has('ai tools') || has('ai panel'))) return { action: 'nav', payload: { tab: 'ai' } }
  if (has('open') && (has('adjust') || has('adjustments'))) return { action: 'nav', payload: { tab: 'adjust' } }
  if (has('open') && has('layer')) return { action: 'nav', payload: { tab: 'layers' } }
  if (has('open') && has('text')) return { action: 'nav', payload: { tab: 'text' } }
  if (has('open') && (has('more') || has('advanced'))) return { action: 'nav', payload: { tab: 'more' } }
  if (has('open') && (has('export') || has('export menu'))) return { action: 'nav', payload: { tab: 'export' } }

  // propose — "how do I improve colors" → show menu + highlight + confirm
  if ((has('improve') || has('better') || has('enhance') || has('boost') || has('fix')) && has('color'))
    return { action: 'propose', payload: { label: 'Auto Enhance', tab: 'ai', icon: 'sparkle', fnKey: 'enhance' } }
  if (has('make') && has('pop')) return { action: 'propose', payload: { label: 'Auto Enhance', tab: 'ai', icon: 'sparkle', fnKey: 'enhance' } }
  if ((has('improve') || has('fix') || has('brighten') || has('darken')) && has('light'))
    return { action: 'propose', payload: { label: 'Brightness', tab: 'adjust', icon: 'sliders', fnKey: 'brighten' } }

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

  // collage
  if (has('collage') || has('mosaic') || (has('layout') && has('photo'))) return { action: 'collage' }

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
