// Command bar (AI) — parses plain-English phrases into concrete actions.
// Runs 100% locally. The "front door" for the whole app: tools, crop,
// zoom, filters, More items, export, chains, undo — everything.

/** Split a multi-step command into individual phrases. */
export function splitCommandChain(text) {
  return String(text || '')
    .split(/\s*(?:,|\bthen\b|\bnow\b|\band\b|\bafter that\b|\bnext\b|\b\.\s*)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)
}

const TOOL_OPEN = {
  select: ['select tool', 'move tool', 'open select'],
  rect: ['rectangle tool', 'open rect'],
  ellipse: ['ellipse tool', 'open ellipse', 'circle tool'],
  line: ['line tool', 'open line'],
  text: ['text tool', 'open text tool', 'type tool'],
  brush: ['brush tool', 'open brush', 'paintbrush'],
  crop: ['crop tool', 'open crop'],
  dropper: ['eyedropper', 'dropper tool', 'color picker tool'],
  wand: ['magic wand'],
  lasso: ['lasso tool', 'open lasso'],
  marquee: ['marquee', 'selection tool'],
}

const MORE_FILTERS = {
  pinch: ['pinch'], twirl: ['twirl'], ripple: ['ripple'], zigzag: ['zigzag'],
  glass: ['glass filter'], spherical: ['spherical', 'fisheye', 'fish eye'],
  emboss: ['emboss'], findEdges: ['find edges'], glowingEdges: ['glowing edges'],
  solarize: ['solarize'], sharpenMore: ['sharpen more', 'sharpen more'],
  sharpenEdges: ['sharpen edges'], median: ['median filter'],
  addNoise: ['add noise', 'add noise'], filmGrain: ['film grain'],
  graphicPen: ['graphic pen', 'sketch lines'], halftone: ['halftone'],
  tiltShift: ['tilt shift', 'tilt-shift', 'miniature'],
}

const MORE_TOOLS = {
  clone: ['clone stamp', 'clone tool', 'stamp'],
  heal: ['healing brush', 'heal brush'],
  redeye: ['red eye', 'redeye'],
  bucket: ['paint bucket', 'bucket fill', 'flood fill'],
  gradient: ['gradient tool'],
  curves: ['curves'],
  levels: ['levels'],
  polygon: ['polygon tool', 'open polygon'],
  triangle: ['triangle tool', 'open triangle'],
  star: ['star tool', 'open star'],
  warp: ['warp tool', 'open warp'],
}

export function matchPrompt(raw) {
  const t = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9×+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return null
  const has = (...ks) => ks.some((k) => t.includes(k))

  // ---- QUESTIONS first: "how do I…", "what is…", "help me…" → show guide ----
  if (/^(how do i|how to|what is|what are|help me|can you show|teach me)/.test(t))
    return { action: 'question', payload: { phrase: raw } }

  // ---- navigation ----
  if (has('open') && (has('quick') || has('quick menu'))) return { action: 'nav', payload: { tab: 'quick' } }
  if (has('open') && (has('ai menu') || has('ai tools') || has('ai panel') || (has('ai') && has('menu')))) return { action: 'nav', payload: { tab: 'ai' } }
  if (has('open') && (has('adjust') || has('adjustments'))) return { action: 'nav', payload: { tab: 'adjust' } }
  if (has('open') && has('layer')) return { action: 'nav', payload: { tab: 'layers' } }
  if (has('open') && (has('more') || has('advanced'))) return { action: 'nav', payload: { tab: 'more' } }
  if (has('open') && (has('export') || has('export menu'))) return { action: 'nav', payload: { tab: 'export' } }

  // ---- open a specific tool ----
  for (const [tool, keys] of Object.entries(TOOL_OPEN)) {
    if (keys.some((k) => t.includes(k))) return { action: 'opentool', payload: { tool } }
  }

  // ---- zoom ----
  if (has('zoom in')) return { action: 'zoom', payload: { dir: 'in' } }
  if (has('zoom out')) return { action: 'zoom', payload: { dir: 'out' } }
  if (has('fit') && has('screen')) return { action: 'zoom', payload: { dir: 'fit' } }

  // ---- crop amounts ----
  if (has('crop') && has('square')) return { action: 'cropsquare' }
  if (has('crop') && has('portrait')) return { action: 'cropportrait' }
  if (has('crop') && (has('slightly smaller') || has('a little smaller') || has('less crop') || has('smaller')))
    return { action: 'cropamt', payload: { amt: -25 } }
  if (has('crop') && (has('more') || has('bigger') || has('a lot')))
    return { action: 'cropamt', payload: { amt: -50 } }
  if (has('crop') && has('less')) return { action: 'cropamt', payload: { amt: -15 } }
  if (has('crop')) return { action: 'opentool', payload: { tool: 'crop' } }

  // ---- body warps (free, local) — before vague goals ----
  if ((has('slim') || has('slimmer') || has('thinner') || has('slim down')) && (has('body') || has('me') || has('down') || has('slightly') || has('a bit')))
    return { action: 'slim' }
  if (has('double chin') || has('chin')) return { action: 'chinlift' }

  // ---- layer reorder / safety — before vague goals (behind/back) ----
  if (has('behind') || has('below') || has('back') || has('front') || has('forward') || has('backward')) {
    if (has('behind') || has('below') || (has('back') && !has('background'))) return { action: 'reorder', payload: { dir: 'back' } }
    if (has('front')) return { action: 'reorder', payload: { dir: 'front' } }
    if (has('backward')) return { action: 'reorder', payload: { dir: 'backward' } }
    if (has('forward')) return { action: 'reorder', payload: { dir: 'forward' } }
  }
  if ((has('duplicate') || has('copy')) && (has('layer') || has('safety'))) return { action: 'duplicate' }
  if (has('safety') && has('copy')) return { action: 'duplicate' }

  // ---- propose ----
  if ((has('improve') || has('better') || has('boost') || has('fix')) && has('color'))
    return { action: 'propose', payload: { label: 'Auto Enhance', tab: 'ai', icon: 'sparkle', fnKey: 'enhance' } }
  if (has('make') && has('pop')) return { action: 'propose', payload: { label: 'Auto Enhance', tab: 'ai', icon: 'sparkle', fnKey: 'enhance' } }
  if ((has('improve') || has('fix')) && has('light')) return { action: 'propose', payload: { label: 'Brightness', tab: 'adjust', icon: 'sliders', fnKey: 'brighten' } }

  // ---- vague goals → navigate + highlight + confirm ----
  const GOALS = [
    // [keys, label, tab, icon, fnKey]
    [[['light', 'lighting', 'exposure', 'brightness', 'darkness'], 'Exposure & light', 'adjust', 'sliders', 'exposure']],
    [[['contrast', 'punch', 'crispness'], 'Contrast', 'adjust', 'sliders', 'contrast']],
    [[['color', 'colors', 'colour', 'saturation', 'vibrancy'], 'Saturation & color', 'adjust', 'sliders', 'saturation']],
    [[['sharp', 'sharpen', 'crisp', 'focused'], 'Sharpen', 'quick', 'focus', 'sharpen']],
    [[['red eye', 'redeye', 'red eyes'], 'Red Eye', 'more', 'eye', 'redeye']],
    [[['blur', 'blurry', 'background blur'], 'Blur Brush', 'quick', 'wind', 'blur']],
    [[['skin', 'portrait', 'face', 'blemish', 'smooth'], 'Retouch', 'ai', 'droplet', 'retouch']],
    [[['background', 'backdrop', 'behind'], 'Background tools', 'ai', 'image', 'bg']],
  ]
  for (const [cfg] of GOALS) {
    const [keys, label, tab, icon, fnKey] = cfg
    if (keys.some((k) => has(k))) return { action: 'propose', payload: { label, tab, icon, fnKey } }
  }

  // explicit "let me adjust X" → navigate to that menu
  if (has('let me adjust') || has('i want to adjust') || has('adjust the'))
    return { action: 'propose', payload: { label: 'Adjust panel', tab: 'adjust', icon: 'sliders', fnKey: 'exposure' } }

  // ---- More-tab filters ----
  for (const [name, keys] of Object.entries(MORE_FILTERS)) {
    if (keys.some((k) => t.includes(k))) return { action: 'filter', payload: { name } }
  }

  // ---- More-tab tools ----
  for (const [key, keys] of Object.entries(MORE_TOOLS)) {
    if (keys.some((k) => t.includes(k))) return { action: 'moretool', payload: { key } }
  }

  // ---- background ----
  if (has('remove') && has('background')) return { action: 'removebg' }
  if (has('removebg') || has('cut out') || has('cutout') || has('isolate')) return { action: 'removebg' }
  if (has('background') && (has('replace') || has('change') || has('swap'))) return { action: 'replacebg' }

  // ---- resolution ----
  if (has('upscale') || has('4x') || has('4×') || has('higher res') || has('enlarge')) return { action: 'upscale' }

  // ---- vector ----
  if (has('vector') || has('svg') || has('trace')) return { action: 'vectorize' }

  // ---- enhance ----
  if (has('enhance') || has('make it pop') || has('fix lighting') || has('auto')) return { action: 'enhance' }

  // ---- export ----
  if (has('export') && (has('png') || has('jpg') || has('jpeg') || has('webp') || has('gif') || has('mp4') || has('pdf') || has('psd') || has('svg')))
    return { action: 'export' }

  // ---- color / fx ----
  if (has('black') && has('white')) return { action: 'fx', payload: { bw: true } }
  if (has('monochrome') || has('grayscale') || has('b&w') || has('b w')) return { action: 'fx', payload: { bw: true } }
  if (has('sepia')) return { action: 'fx', payload: { sepia: true } }
  if (has('vintage')) return { action: 'fx', payload: { vintage: true } }
  if (has('invert') || has('negative')) return { action: 'fx', payload: { invert: true } }
  if (has('noise') || has('grain')) return { action: 'fx', payload: { noise: 50 } }
  if (has('pixelate') || has('pixel')) return { action: 'fx', payload: { pixelate: 8 } }
  if (has('sharpen')) return { action: 'fx', payload: { sharpen: true } }
  if (has('blur')) return { action: 'fx', payload: { blur: 0.35 } }
  if (has('flip') || has('mirror')) return { action: 'fx', payload: { flipX: true } }
  if (has('rotate')) return { action: 'fx', payload: { angle: 90 } }

  // ---- adjust ----
  if (has('warm')) return { action: 'filters', payload: { temperature: 45 } }
  if (has('cool') || has('cold')) return { action: 'filters', payload: { temperature: -45 } }
  if (has('bright') || has('lighten') || has('lighter')) return { action: 'filters', payload: { brightness: 112 } }
  if (has('dark') || has('darken') || has('dimmer')) return { action: 'filters', payload: { brightness: 88 } }
  if (has('contrast')) return { action: 'filters', payload: { contrast: 115 } }
  if (has('saturate') || has('vivid')) return { action: 'filters', payload: { saturation: 120 } }
  if (has('desaturate') || has('muted')) return { action: 'filters', payload: { saturation: 60 } }

  // ---- body warps (free, local) ----
  if ((has('slim') || has('slimmer') || has('thinner')) && (has('body') || has('down') || has('me')))
    return { action: 'slim' }
  if (has('reduce') && has('double chin')) return { action: 'chinlift' }
  if (has('double chin') || has('chin lift') || has('fix my chin')) return { action: 'chinlift' }
  if ((has('slim') || has('slimmer')) && has('face')) return { action: 'chinlift' }

  // ---- generative-only (honest: not available free) ----
  if (has('sunglasses') || (has('take') && has('glasses')) || has('remove') && has('glasses'))
    return { action: 'genonly', payload: { phrase: 'remove sunglasses' } }
  if (has('blue eyes') || (has('eyes') && has('color')) || (has('change') && has('eye')))
    return { action: 'genonly', payload: { phrase: 'change eye color' } }

  // ---- layer reorder / safety ----
  if ((has('move') || has('put')) && has('front')) return { action: 'reorder', payload: { dir: 'front' } }
  if ((has('move') || has('put')) && (has('back') || has('behind'))) return { action: 'reorder', payload: { dir: 'back' } }
  if ((has('move') || has('send')) && has('backward')) return { action: 'reorder', payload: { dir: 'backward' } }
  if ((has('move') || has('bring')) && has('forward')) return { action: 'reorder', payload: { dir: 'forward' } }
  if ((has('behind') || has('below')) && has('text')) return { action: 'reorder', payload: { dir: 'back' } }
  if (has('duplicate') && (has('layer') || has('copy'))) return { action: 'duplicate' }
  if (has('make') && has('safety')) return { action: 'duplicate' }

  // ---- command history control ----
  if (has('undo') && (has('last') || has('command') || has('that') || has('step'))) return { action: 'undocmd' }
  if (has('redo') && (has('last') || has('command'))) return { action: 'redocmd' }

  // ---- collage ----
  if (has('collage') || has('mosaic') || (has('layout') && has('photo'))) return { action: 'collage' }

  // ---- history ----
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
  'Crop to square',
  'Upscale 4×',
  'Open quick menu',
  'Undo last',
]
