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
  if (has('open') && (has('quick') || has('quick menu'))) return { action: 'nav', payload: { tab: 'actions' } }
  if (has('open') && (has('ai menu') || has('ai tools') || has('ai panel') || (has('ai') && has('menu')))) return { action: 'nav', payload: { tab: 'ai' } }
  if (has('open') && (has('adjust') || has('adjustments'))) return { action: 'nav', payload: { tab: 'adjust' } }
  if (has('open') && has('layer')) return { action: 'nav', payload: { tab: 'layers' } }
  if (has('open') && (has('more') || has('advanced'))) return { action: 'nav', payload: { tab: 'actions' } }
  if (has('open') && (has('export') || has('export menu'))) return { action: 'nav', payload: { tab: 'export' } }

  // ---- open a specific tool ----
  for (const [tool, keys] of Object.entries(TOOL_OPEN)) {
    if (keys.some((k) => t.includes(k))) return { action: 'opentool', payload: { tool } }
  }

  // ---- zoom ----
  if (has('zoom in')) return { action: 'zoom', payload: { dir: 'in' } }
  if (has('zoom out')) return { action: 'zoom', payload: { dir: 'out' } }
  if (has('fit') && has('screen')) return { action: 'zoom', payload: { dir: 'fit' } }

  // ---- run a saved recipe (one-click custom task) ----
  if (has('recipe') && (has('run') || has('use') || has('apply') || has('execute')))
    return { action: 'runrecipe', payload: { phrase: raw } }
  if ((has('run') || has('do')) && has('my') && (has('edit') || has('look') || has('task') || has('action')))
    return { action: 'runrecipe', payload: { phrase: raw } }

  // ---- diagonal crop ----
  if (has('crop') && (has('diagonal') || has('diag') || has('corner'))) {
    if (has('bottom') && has('left') || has('bl')) return { action: 'diagcrop', payload: { corner: 'bl' } }
    if (has('bottom') && has('right') || has('br')) return { action: 'diagcrop', payload: { corner: 'br' } }
    if (has('top') && has('left') || has('tl')) return { action: 'diagcrop', payload: { corner: 'tl' } }
    return { action: 'diagcrop', payload: { corner: 'tr' } }
  }
  if (has('diagonal') && has('crop')) return { action: 'diagcrop', payload: { corner: 'tr' } }
  if (has('refine') && has('edge')) return { action: 'refineedge' }
  if ((has('clean') || has('improve') || has('fix')) && has('edge')) return { action: 'refineedge' }

  // ---- crop amounts ----
  if (has('crop') && has('square')) return { action: 'cropsquare' }
  if (has('crop') && has('portrait')) return { action: 'cropportrait' }
  if (has('crop') && (has('slightly smaller') || has('a little smaller') || has('less crop') || has('smaller')))
    return { action: 'cropamt', payload: { amt: -25 } }
  if (has('crop') && (has('more') || has('bigger') || has('a lot')))
    return { action: 'cropamt', payload: { amt: -50 } }
  if (has('crop') && has('less')) return { action: 'cropamt', payload: { amt: -15 } }
  if (has('crop')) return { action: 'opentool', payload: { tool: 'crop' } }

  // ---- beauty / glamour / motion / sparkle ----
  if ((has('white') || has('whiten') || has('brighten')) && has('teeth')) return { action: 'teeth' }
  if (has('teeth')) return { action: 'teeth' }
  if (has('wrinkle') || (has('reduce') && has('wrinkle'))) return { action: 'wrinkles' }
  if (has('pimple') || has('acne') || has('spot') && has('remove')) return { action: 'pimples' }
  if (has('glamour') || (has('glam') && has('look'))) return { action: 'glamour' }
  if (has('bald') || has('baldness') || has('more hair')) return { action: 'genonly', payload: { phrase: 'add hair' } }
  if (has('sparkle') || (has('glint') || has('shine')) && (has('glass') || has('jewel') || has('ring'))) return { action: 'sparkle' }
  if ((has('car') || has('motion') || has('moving')) && has('background')) return { action: 'motionbg' }

  // ---- restore / repair ----
  if ((has('restore') || has('repair')) && (has('photo') || has('old') || has('crease') || has('scratch') || has('damage')))
    return { action: 'restore' }
  if (has('crease') || has('scratch') || has('fold')) return { action: 'crease' }
  if (has('colorize') || (has('black') && has('white') && has('color')) || (has('color') && has('bw')))
    return { action: 'bwcolor' }
  if (has('bw') && has('color')) return { action: 'bwcolor' }

  // ---- intelligent region select + enhance ----
  if (has('select') && (has('region') || has('area') || has('inset') || has('part'))) return { action: 'regionselect' }
  if (has('enhance') && (has('region') || has('area') || has('inset') || has('part') || has('portion')))
    return { action: 'enhanceregion' }

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
    [[['sharp', 'sharpen', 'crisp', 'focused'], 'Sharpen', 'actions', 'focus', 'sharpen']],
    [[['red eye', 'redeye', 'red eyes'], 'Red Eye', 'actions', 'eye', 'redeye']],
    [[['blur', 'blurry', 'background blur'], 'Blur Brush', 'actions', 'wind', 'blur']],
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

  // ---- named looks (v0.17.2) ----
  if (has('cyanotype')) return { action: 'runaction', payload: { key: 'cyanotype' } }
  if (has('teal') && (has('orange') || has('orange grade'))) return { action: 'runaction', payload: { key: 'tealorange' } }
  if (has('cross process') || has('crossprocess')) return { action: 'runaction', payload: { key: 'crossprocess' } }
  if (has('infrared') || has('ir look')) return { action: 'runaction', payload: { key: 'infrared' } }
  if (has('color pop') || has('red pop') || (has('selective') && has('color')) || (has('keep') && has('red'))) return { action: 'runaction', payload: { key: 'colorpop' } }
  if (has('ice') || has('icy') || (has('cool') && has('blue'))) return { action: 'runaction', payload: { key: 'ice' } }
  if (has('sunset') && (has('glow') || has('warm') || has('look'))) return { action: 'runaction', payload: { key: 'sunset' } }
  if (has('flat matte') || (has('matte') && has('film')) || (has('film') && has('still'))) return { action: 'runaction', payload: { key: 'matte' } }
  if (has('noir') || has('film noir')) return { action: 'runaction', payload: { key: 'noir' } }
  if (has('bleach bypass') || (has('bleach') && has('look'))) return { action: 'runaction', payload: { key: 'bleach' } }
  if (has('lomo') || (has('toy') && has('camera'))) return { action: 'runaction', payload: { key: 'lomo' } }
  if (has('pastel')) return { action: 'runaction', payload: { key: 'pastel' } }
  if (has('scanline') || (has('crt') || has('retro screen'))) return { action: 'runaction', payload: { key: 'scanlines' } }
  if (has('dither') || has('dithered')) return { action: 'runaction', payload: { key: 'dither' } }
  if (has('blueprint')) return { action: 'runaction', payload: { key: 'blueprint' } }
  // ---- commercial / product / interior (v0.17.8) ----
  if ((has('luxurious') || has('luxury')) && (has('look') || has('grade') || has('feel'))) return { action: 'runaction', payload: { key: 'luxury' } }
  if (has('catalog') || (has('ad') && has('look')) || (has('commercial') && has('look'))) return { action: 'runaction', payload: { key: 'catalog' } }
  if ((has('brand') && has('new')) || (has('make it') && has('new'))) return { action: 'runaction', payload: { key: 'brandnew' } }
  if (has('product') && (has('sharpen') || has('crisp') || has('sharper'))) return { action: 'runaction', payload: { key: 'productsharp' } }
  if ((has('matte') && (has('finish') || has('look'))) || has('reduce') && has('glare')) return { action: 'runaction', payload: { key: 'mattefinish' } }
  if (has('diamond') || has('sparkle')) return { action: 'runaction', payload: { key: 'diamond' } }
  if (has('gold') && (has('rich') || has('richer'))) return { action: 'runaction', payload: { key: 'goldrich' } }
  if (has('silver') && (has('bright') || has('brighter'))) return { action: 'runaction', payload: { key: 'silverbright' } }
  if (has('gem') || (has('stone') && has('color'))) return { action: 'runaction', payload: { key: 'gemstone' } }
  if ((has('metal') || has('hardware')) && (has('shine') || has('shiny'))) return { action: 'runaction', payload: { key: 'metalshine' } }
  if ((has('glass') || has('bottle')) && has('shine')) return { action: 'runaction', payload: { key: 'glassgloss' } }
  if (has('fabric') && (has('rich') || has('better') || has('texture'))) return { action: 'runaction', payload: { key: 'fabricrich' } }
  if (has('denim')) return { action: 'runaction', payload: { key: 'denim' } }
  if (has('silk')) return { action: 'runaction', payload: { key: 'silksheen' } }
  if ((has('wrinkle') || has('crease')) && (has('cloth') || has('fabric') || has('shirt') || has('outfit'))) return { action: 'runaction', payload: { key: 'dewrinkle' } }
  if (has('scratch') && (has('remove') || has('repair') || has('fix'))) return { action: 'runaction', payload: { key: 'scratchoff' } }
  if ((has('spot') || has('stain') || has('lint') || has('dust')) && has('remove')) return { action: 'runaction', payload: { key: 'spotclean' } }
  if ((has('room') || has('interior')) && (has('bright') || has('brighter') || has('dark'))) return { action: 'runaction', payload: { key: 'interiorbright' } }
  if ((has('interior') || has('room')) && has('luxury')) return { action: 'runaction', payload: { key: 'interiorlux' } }
  if (has('window') && (has('light') || has('bright'))) return { action: 'runaction', payload: { key: 'windowlight' } }
  if (has('floor') && (has('clean') || has('cleaner'))) return { action: 'runaction', payload: { key: 'floorclean' } }
  // ---- fashion / luxury / fragrance (v0.17.9) ----
  if (has('shoe') && (has('gloss') || has('shiny'))) return { action: 'runaction', payload: { key: 'shoegloss' } }
  if (has('shoe') && (has('lux') || has('luxurious') || has('expensive'))) return { action: 'runaction', payload: { key: 'shoeluxe' } }
  if (has('shoe') && (has('matte') || has('not shiny'))) return { action: 'runaction', payload: { key: 'shoematte' } }
  if (has('shoe') && (has('clean') || has('dirty'))) return { action: 'runaction', payload: { key: 'shoeclean' } }
  if (has('shoe') && (has('scratch') || has('scuff'))) return { action: 'runaction', payload: { key: 'shoescuff' } }
  if (has('sole') && (has('clean') || has('bright'))) return { action: 'runaction', payload: { key: 'solebright' } }
  if (has('leather') && (has('rich') || has('better'))) return { action: 'runaction', payload: { key: 'leatherrich' } }
  if (has('slipper') || (has('fluffy') || has('fluff'))) return { action: 'runaction', payload: { key: 'fluffsoft' } }
  if ((has('outfit') || has('shirt') || has('cloth')) && (has('wrinkle') || has('crease') || has('iron') || has('steam'))) return { action: 'runaction', payload: { key: 'ironoutfit' } }
  if ((has('lint') || has('dust')) && has('cloth')) return { action: 'runaction', payload: { key: 'lintoff' } }
  if (has('stain') && (has('remove') || has('clean'))) return { action: 'runaction', payload: { key: 'stainoff' } }
  if ((has('fabric') || has('silk')) && has('silkier')) return { action: 'runaction', payload: { key: 'silkier' } }
  if (has('denim')) return { action: 'runaction', payload: { key: 'denimpro' } }
  if ((has('handbag') || has('bag')) && has('scratch')) return { action: 'runaction', payload: { key: 'bagscuff' } }
  if ((has('handbag') || has('bag')) && has('leather')) return { action: 'runaction', payload: { key: 'bagleather' } }
  if ((has('hardware') || has('zipper') || has('buckle')) && (has('shine') || has('shiny'))) return { action: 'runaction', payload: { key: 'hardwareshine' } }
  if ((has('handbag') || has('bag')) && (has('dust') || has('dirty'))) return { action: 'runaction', payload: { key: 'bagdust' } }
  if ((has('handbag') || has('bag')) && has('brand new')) return { action: 'runaction', payload: { key: 'bagbrandnew' } }
  if (has('diamond') && (has('bright') || has('brighter'))) return { action: 'runaction', payload: { key: 'diamondbright' } }
  if ((has('jewelry') || has('ring') || has('necklace')) && has('shine')) return { action: 'runaction', payload: { key: 'jewelshine' } }
  if ((has('jewelry') || has('ring')) && has('scratch')) return { action: 'runaction', payload: { key: 'jewelscuff' } }
  if ((has('fingerprint') || has('smudge')) && has('remove')) return { action: 'runaction', payload: { key: 'fingerprintoff' } }
  if (has('reflection') && (has('remove') || has('reduce'))) return { action: 'runaction', payload: { key: 'dereflect' } }
  if (has('gold') && has('bar')) return { action: 'runaction', payload: { key: 'goldbarreal' } }
  if ((has('watch') || has('bracelet')) && has('shine')) return { action: 'runaction', payload: { key: 'watchshine' } }
  if (has('watch') && (has('face') || has('dial')) && (has('clear') || has('sharp'))) return { action: 'runaction', payload: { key: 'watchface' } }
  if (has('perfume') && (has('lux') || has('luxurious'))) return { action: 'runaction', payload: { key: 'fraglux' } }
  if ((has('bottle') || has('glass')) && (has('fingerprint') || has('dirty'))) return { action: 'runaction', payload: { key: 'bottleclean' } }
  if (has('liquid') && (has('rich') || has('deeper') || has('color'))) return { action: 'runaction', payload: { key: 'liquidrich' } }
  if ((has('packaging') || has('package')) && (has('sharp') || has('clear'))) return { action: 'runaction', payload: { key: 'packsharp' } }
  if ((has('label') || has('text')) && (has('clear') || has('readable'))) return { action: 'runaction', payload: { key: 'labelclear' } }
  if ((has('floor plan') || has('blueprint') && has('sharp')) || (has('plan') && has('sharp'))) return { action: 'runaction', payload: { key: 'plansharp' } }
  if ((has('document') || has('scan') || has('receipt')) && (has('clean') || has('sharp') || has('readable'))) return { action: 'runaction', payload: { key: 'docscan' } }
  if ((has('catalog') || has('ecommerce') || has('ad')) && has('look')) return { action: 'runaction', payload: { key: 'catalog' } }
  // ---- eyewear / electronics / food / home / auto / real estate / art (v0.17.10) ----
  if ((has('glasses') || has('sunglasses') || has('lens')) && (has('clean') || has('smudge'))) return { action: 'runaction', payload: { key: 'glassclean' } }
  if ((has('glasses') || has('sunglasses')) && (has('shine') || has('gloss'))) return { action: 'runaction', payload: { key: 'lensshine' } }
  if ((has('frame') && has('polish')) || (has('glasses') && has('frame'))) return { action: 'runaction', payload: { key: 'framepolish' } }
  if ((has('screen') || has('phone') || has('laptop')) && (has('clean') || has('fingerprint'))) return { action: 'runaction', payload: { key: 'screenclean' } }
  if ((has('phone') || has('laptop') || has('device') || has('gadget')) && (has('shine') || has('gloss'))) return { action: 'runaction', payload: { key: 'deviceshine' } }
  if ((has('phone') || has('laptop') || has('device')) && has('brand new')) return { action: 'runaction', payload: { key: 'devicebrandnew' } }
  if ((has('food') || has('dish') || has('plate')) && (has('appetizing') || has('mouth') || has('pop') || has('better'))) return { action: 'runaction', payload: { key: 'foodpop' } }
  if ((has('food') || has('ingredient') || has('salad')) && (has('vibrant') || has('colorful') || has('rich'))) return { action: 'runaction', payload: { key: 'foodvibrant' } }
  if ((has('drink') || has('cocktail') || has('coffee')) && (has('rich') || has('deeper') || has('color'))) return { action: 'runaction', payload: { key: 'drinkrich' } }
  if ((has('bottle') || has('can')) && has('condensation')) return { action: 'runaction', payload: { key: 'condensation' } }
  if ((has('candle') || has('soap')) && has('clean')) return { action: 'runaction', payload: { key: 'candleclean' } }
  if (has('car') && (has('paint') || has('shine') || has('gloss') || has('showroom'))) return { action: 'runaction', payload: { key: 'carpaint' } }
  if ((has('car') || has('vehicle')) && has('interior')) return { action: 'runaction', payload: { key: 'carinterior' } }
  if ((has('sky') && (has('pop') || has('richer') || has('blue'))) || (has('exterior') && has('sky'))) return { action: 'runaction', payload: { key: 'skypop' } }
  if (has('real estate') && (has('lux') || has('premium') || has('better'))) return { action: 'runaction', payload: { key: 'realtorlux' } }
  if ((has('poster') || has('artwork') || has('print')) && (has('clean') || has('restore') || has('faded'))) return { action: 'runaction', payload: { key: 'posterclean' } }
  if ((has('painting') || has('art')) && (has('vibrant') || has('rich') || has('color'))) return { action: 'runaction', payload: { key: 'artvibrant' } }
  if ((has('canvas') || has('artwork')) && (has('bright') || has('faded'))) return { action: 'runaction', payload: { key: 'canvasbright' } }
  // ---- apparel / luggage / accessories / beauty / docs (v0.17.11) ----
  if ((has('shirt') || has('blouse')) && (has('wrinkle') || has('crease') || has('iron') || has('crisp'))) return { action: 'runaction', payload: { key: 'shirtcrisp' } }
  if ((has('suit') || has('blazer')) && (has('press') || has('crease') || has('polish'))) return { action: 'runaction', payload: { key: 'suitpressed' } }
  if ((has('tie') || has('bowtie')) && (has('shine') || has('silky'))) return { action: 'runaction', payload: { key: 'tieshine' } }
  if ((has('scarf') || has('knit') || has('sweater')) && (has('soft') || has('fluffy'))) return { action: 'runaction', payload: { key: 'scarfsoft' } }
  if ((has('hat') || has('cap') || has('beanie')) && (has('clean') || has('fresh'))) return { action: 'runaction', payload: { key: 'hatfresh' } }
  if ((has('sportswear') || has('activewear') || has('jersey')) && (has('pro') || has('better') || has('punch'))) return { action: 'runaction', payload: { key: 'sportpro' } }
  if (has('swimwear') || (has('swimsuit') && has('vibrant'))) return { action: 'runaction', payload: { key: 'swimvibrant' } }
  if ((has('pattern') || has('print') || has('plaid')) && (has('pop') || has('vivid') || has('colorful'))) return { action: 'runaction', payload: { key: 'patternpop' } }
  if ((has('luggage') || has('suitcase') || has('case')) && (has('scratch') || has('scuff'))) return { action: 'runaction', payload: { key: 'lugscuff' } }
  if ((has('luggage') || has('suitcase') || has('backpack')) && (has('clean') || has('dirty'))) return { action: 'runaction', payload: { key: 'lugclean' } }
  if ((has('belt') && has('leather')) || (has('wallet') && has('leather'))) return { action: 'runaction', payload: { key: 'beltleather' } }
  if ((has('belt') || has('buckle')) && (has('shine') || has('polish'))) return { action: 'runaction', payload: { key: 'beltbuckle' } }
  if (has('wallet') && (has('clean') || has('worn'))) return { action: 'runaction', payload: { key: 'walletclean' } }
  if ((has('makeup') || has('glam')) && has('look')) return { action: 'runaction', payload: { key: 'makeuplook' } }
  if (has('skincare') || (has('serum') && has('gloss'))) return { action: 'runaction', payload: { key: 'serumgloss' } }
  if ((has('receipt') || has('invoice')) && (has('clear') || has('readable'))) return { action: 'runaction', payload: { key: 'receiptclear' } }
  if (has('drawing') && (has('clean') || has('sharp'))) return { action: 'runaction', payload: { key: 'drawingclean' } }
  if (has('magazine') && (has('cover') || has('grade'))) return { action: 'runaction', payload: { key: 'magcover' } }
  if (has('editorial') && (has('grade') || has('look'))) return { action: 'runaction', payload: { key: 'editorialgrade' } }
  if (has('motorcycle') && (has('shine') || has('gloss') || has('paint'))) return { action: 'runaction', payload: { key: 'motoshine' } }

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
  'Open Actions menu',
  'Run my recipe',
  'Undo last',
]
