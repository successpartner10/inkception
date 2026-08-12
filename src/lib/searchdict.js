// src/lib/searchdict.js
// Smart action search — hand-rolled synonym dictionary + scoring, 100% local.
// Seed: the natural-language phrasings from the commercial action library
// ("make the gold look richer", "clean the floor"…) mapped to action ids,
// plus everyday words ("thinner" → Slim Body). Results are scored so the
// best match ranks first; the Actions tab uses this instead of plain
// substring matching.

import { ACTIONS } from './actions'

// Intent phrases → action id (from the action library's natural language).
// Multi-word phrases are checked first (longest match wins).
const PHRASES = [
  // shoes & footwear
  ['make the shoes white', 'shoewhite'], ['make the shoes black', 'shoeblack'],
  ['shoes look more luxurious', 'shoeluxe'], ['make the shoes glossy', 'shoegloss'],
  ['make the shoes matte', 'shoematte'], ['clean the shoes', 'shoeclean'],
  ['remove scratches from the shoes', 'shoescuff'], ['make the sole look cleaner', 'solebright'],
  ['make the slippers fluffy', 'fluffsoft'], ['shoe photograph look like an ad', 'shoead'],
  ['make both shoes match', 'shoematch'],
  // clothing & fashion
  ['make the clothes look steamed', 'steampress'], ['remove wrinkles from the outfit', 'ironoutfit'],
  ['remove lint from the outfit', 'lintoff'], ['remove stains from the clothes', 'stainoff'],
  ['make the outfit look more expensive', 'fashionlux'], ['make the fabric look richer', 'fabricrich'],
  ['make the fabric silkier', 'silksheen'], ['make the fabric matte', 'fabricmatte'],
  ['make the denim look better', 'denimpro'], ['make the leather look better', 'leatherrich'],
  ['make the outfit look editorial', 'outfiteditorial'], ['make the outfit symmetrical', 'symmetry'],
  // handbags & accessories
  ['change the handbag color', 'bagrecolor'], ['remove scratches from the handbag', 'bagscuff'],
  ['make the handbag leather look better', 'bagleather'], ['make the hardware shine', 'hardwareshine'],
  ['remove dust from the handbag', 'bagdust'], ['make the handbag look brand new', 'bagbrandnew'],
  // diamonds & gold
  ['make the diamonds sparkle', 'diamond'], ['make the diamonds brighter', 'diamondbright'],
  ['make the gold look richer', 'goldrich'], ['make the gold look more luxurious', 'goldluxe'],
  ['make the jewelry shine', 'jewelshine'], ['remove scratches from the jewelry', 'jewelscuff'],
  ['remove fingerprints from the jewelry', 'fingerprintoff'], ['make the silver brighter', 'silverbright'],
  ['make the platinum look premium', 'platinumshine'], ['make the gemstone color richer', 'gemstone'],
  ['remove unwanted reflections', 'dereflect'], ['make the jewelry look like a luxury ad', 'jewelad'],
  ['make a gold bar look more realistic', 'goldbarreal'], ['make the gold bar shine', 'goldbarshine'],
  ['clean the gold bar', 'goldbarclean'],
  // perfume & cosmetics
  ['make the perfume bottle look luxurious', 'fraglux'], ['make the glass bottle shine', 'glassgloss'],
  ['remove fingerprints from the bottle', 'bottleclean'], ['remove scratches from the bottle', 'bottlescuff'],
  ['make the perfume liquid look richer', 'liquidrich'], ['make the packaging look sharper', 'packsharp'],
  ['make the label perfectly clear', 'labelclear'], ['make the bottle look like a magazine ad', 'fraglux'],
  // watches
  ['make the watch shine', 'watchshine'], ['make the watch face clearer', 'watchface'],
  ['make the metal bracelet look premium', 'braceletpolish'], ['remove scratches from the watch', 'watchcuff'],
  ['make the product look brand new', 'productrestore'], ['make the product look like a catalog photo', 'catalog'],
  ['make the product sharper', 'productsharp'],
  // interiors
  ['make the room brighter', 'interiorbright'], ['make the room look more luxurious', 'interiorlux'],
  ['make the windows brighter', 'windowlight'], ['make the floor look cleaner', 'floorclean'],
  ['add natural sunlight', 'sunlight'], ['make my floor plan look professional', 'plansharp'],
  // cars
  ['make the car paint shine', 'carpaint'], ['make the car interior nicer', 'carinterior'],
  ['make the car look new', 'carbrandnew'], ['car look like an ad', 'carad'],
  // food
  ['make the food look appetizing', 'foodpop'], ['make the drink look richer', 'drinkrich'],
  ['make the bottle condensation', 'condensation'],
]

// Everyday synonyms → action id (when you don't know the action's name).
const SYNONYMS = {
  thinner: 'slim', slim: 'slim', slimmer: 'slim', skinny: 'slim', lose: 'slim', weight: 'slim',
  face: 'chin', jaw: 'chin', chin: 'chin', doublechin: 'chin',
  teeth: 'teeth', tooth: 'teeth', smile: 'teeth',
  pimple: 'pimples', acne: 'pimples', blemish: 'pimples', spot: 'spotclean', zit: 'pimples',
  wrinkle: 'wrinkles', skin: 'glamour', smoothskin: 'glamour', pores: 'glamour',
  eyes: 'eyes', iris: 'eyes', darkcircle: 'eyes',
  lips: 'lipcolor', lipstick: 'lipcolor',
  white: 'bw', blackwhite: 'bw', monochrome: 'bw', grayscale: 'bw', greyscale: 'bw',
  vintage: 'vintagebw', old: 'restore', oldphoto: 'restore', damaged: 'restore', faded: 'restore',
  sharp: 'productsharp', sharpen: 'sharpen', crisp: 'productsharp', detail: 'productsharp', clear: 'labelclear',
  blur: 'blur', backgroundblur: 'blur',
  pop: 'pop', vivid: 'saturate', punch: 'hdr', vibrant: 'saturate', saturated: 'saturate',
  dark: 'noir', moody: 'noir', dramatic: 'noir',
  warm: 'warm', cozy: 'warm', golden: 'goldenhour', sunset: 'sunset', cold: 'ice', cool: 'ice',
  gold: 'goldrich', golden: 'goldrich', luxury: 'luxury', luxurious: 'luxury', expensive: 'luxury', premium: 'luxury',
  shine: 'metalshine', shiny: 'metalshine', gloss: 'glassgloss', glossy: 'glassgloss', sparkle: 'diamond', sparkly: 'diamond', glitter: 'diamond',
  scratch: 'scratchoff', scratched: 'scratchoff', scuff: 'shoescuff', damage: 'scratchoff',
  dust: 'spotclean', dirty: 'spotclean', clean: 'spotclean', stain: 'spotclean', lint: 'lintoff', smudge: 'fingerprintoff', fingerprint: 'fingerprintoff',
  background: 'remove-bg', cutout: 'remove-bg', cutout: 'remove-bg', isolate: 'remove-bg', removebackground: 'remove-bg', transparent: 'remove-bg',
  replacebackground: 'replace-bg', backdrop: 'replace-bg',
  enhance: 'enhance', better: 'enhance', improve: 'enhance', fix: 'enhance',
  upscale: 'upscale', enlarge: 'upscale', resolution: 'upscale', '4k': 'upscale', hires: 'upscale',
  crop: 'crop-square', square: 'crop-square', portraitcrop: 'crop-portrait',
  fabric: 'fabricrich', textile: 'fabricrich', cloth: 'ironoutfit', denim: 'denimpro', jeans: 'denimpro',
  leather: 'leatherrich', silk: 'silksheen', satin: 'silksheen', knit: 'knitsoft', wool: 'jacketrich',
  shoe: 'shoegloss', sneaker: 'shoegloss', boots: 'shoegloss', sole: 'solebright',
  bag: 'bagleather', handbag: 'bagleather', purse: 'bagleather', wallet: 'walletrich', belt: 'beltleather', buckle: 'beltbuckle',
  watch: 'watchshine', bracelet: 'braceletpolish', ring: 'jewelshine', necklace: 'jewelshine', jewelry: 'jewelshine', jewellery: 'jewelshine', diamond: 'diamond',
  perfume: 'fraglux', fragrance: 'fraglux', bottle: 'glassgloss', glass: 'glassgloss', liquid: 'liquidrich',
  car: 'carpaint', vehicle: 'carpaint', motorcycle: 'motoshine', bike: 'motoshine', auto: 'carpaint',
  room: 'interiorbright', interior: 'interiorlux', wall: 'interiorlux', floor: 'floorclean', window: 'windowlight', sky: 'skypop', exterior: 'exteriorbright', realestate: 'realtorlux',
  food: 'foodpop', meal: 'foodpop', dish: 'foodpop', recipe: 'foodpop', drink: 'drinkrich', coffee: 'drinkrich', cocktail: 'drinkrich',
  candle: 'candleclean', soap: 'soappro', skincare: 'skinclear', serum: 'serumgloss', makeup: 'makeuplook', lipstick: 'lipboost', glam: 'makeuplook',
  poster: 'posterclean', artwork: 'posterclean', art: 'artvibrant', painting: 'artvibrant', print: 'posterclean', canvas: 'canvasbright', frame: 'frameshine',
  receipt: 'receiptclear', invoice: 'invoicebright', document: 'docscan', scan: 'docscan', plan: 'plansharp', blueprint: 'plansharp', drawing: 'drawingclean', floorplan: 'plansharp',
  glasses: 'glassclean', sunglasses: 'glassclean', lens: 'lensshine', frames: 'framepolish', eyewear: 'glassclean',
  phone: 'screenclean', laptop: 'screenclean', screen: 'screenclean', tv: 'screenclean', device: 'deviceshine', gadget: 'deviceshine', electronics: 'techsharp',
  roombright: 'interiorbright', natural: 'sunlight', sunlight: 'sunlight', magazine: 'magcover', editorial: 'editorialgrade', catalog: 'catalog', ecommerce: 'catalog', shopify: 'catalog', marketplace: 'catalog',
  color: 'saturate', colorful: 'saturate', colour: 'saturate', grey: 'noir', gray: 'noir',
  red: 'colorpop', blue: 'ice', green: 'saturate', sepia: 'sepia', brown: 'sepia', monobw: 'bw',
}

// Material / surface / condition vocabulary (from the shopping taxonomy) →
// the action that improves THAT material. So "make the wood nicer" works
// even though no action name contains "wood".
const MATERIAL_TERMS = {
  // materials
  wood: 'fabricrich', oak: 'fabricrich', walnut: 'fabricrich', wooden: 'fabricrich',
  marble: 'luxury', granite: 'luxury', stone: 'mattefinish', concrete: 'mattefinish', ceramic: 'glassgloss', porcelain: 'glassgloss',
  steel: 'metalshine', stainless: 'metalshine', aluminum: 'metalshine', aluminium: 'metalshine', titanium: 'metalshine', copper: 'goldrich', brass: 'goldrich', bronze: 'goldrich',
  gold: 'goldrich', silver: 'silverbright', platinum: 'platinumshine', chrome: 'metalshine', metal: 'metalshine', metallic: 'metalshine',
  carbon: 'mattefinish', carbonfiber: 'mattefinish', nylon: 'fabricrich', polyester: 'fabricrich', cotton: 'fabricrich', linen: 'fabricrich', velvet: 'luxury', suede: 'fluffsoft', fur: 'fluffsoft', fleece: 'fluffsoft',
  glass: 'glassgloss', crystal: 'diamondbright', diamond: 'diamond', gem: 'gemstone', gemstone: 'gemstone', pearl: 'glassgloss', stone: 'mattefinish',
  leather: 'leatherrich', fakeleather: 'fabricrich', patent: 'shoegloss', suede: 'fluffsoft', rubber: 'mattefinish', silicone: 'mattefinish', plastic: 'productsharp', foam: 'fluffsoft',
  paper: 'posterclean', cardboard: 'posterclean', canvas: 'canvasbright', ceramic: 'glassgloss',
  // surfaces & finishes
  matte: 'mattefinish', flat: 'mattefinish', glossy: 'glassgloss', polished: 'metalshine', brushed: 'metalshine', reflective: 'dereflect', reflection: 'dereflect', glare: 'dereflect',
  frosted: 'glassgloss', weathered: 'restore', distressed: 'restore', aged: 'aged', patina: 'luxury', tarnish: 'silverbright', rust: 'scratchoff',
  grainy: 'filmgrain', textured: 'fabricrich', smooth: 'clothSmooth', smooth: 'clothSmooth',
  // condition
  scratched: 'scratchoff', scuffed: 'shoescuff', stained: 'spotclean', cracked: 'scratchoff', faded: 'restore', worn: 'restore', wrinkled: 'ironoutfit', creased: 'ironoutfit', creases: 'ironoutfit', dented: 'brandnew',
  chipped: 'scratchoff', tarnished: 'silverbright', rusty: 'scratchoff', fingerprinted: 'fingerprintoff', smudged: 'fingerprintoff', dusty: 'spotclean', dirty: 'spotclean', messy: 'spotclean',
  blurry: 'productsharp', noisy: 'despeckle', overexposed: 'interiorbright', underexposed: 'roombrighten', dark: 'roombrighten', shadowed: 'roombrighten',
  // lighting
  bright: 'brighten', brighter: 'brighten', light: 'brighten', darken: 'darken', darker: 'darken',
  warm: 'warm', warmer: 'warm', cool: 'cool', cooler: 'cool', golden: 'goldenhour', glow: 'sunset', sparkle: 'diamond', sunlight: 'sunlight', daylight: 'sunlight', studio: 'luxury', cinematic: 'tealorange', dramatic: 'noir',
  // shape & geometry
  slim: 'slim', slimmer: 'slim', wider: 'mirror', narrow: 'crop-square', symmetrical: 'mirror', straighten: 'plansharp', angle: 'rotateCw', rotate: 'rotateCw', flip: 'mirror',
  // color actions
  color: 'saturate', colourful: 'saturate', colorful: 'saturate', saturation: 'saturate', desaturate: 'desaturate', blackandwhite: 'bw', sepia: 'sepia', pop: 'pop', hdr: 'hdr',
  // action families (taxonomy §Action)
  recolor: 'saturate', recolour: 'saturate', remove: 'remove-bg', clean: 'spotclean', restore: 'restore', enhance: 'enhance', sharpen: 'sharpen', soften: 'fluffsoft', resize: 'upscale', relight: 'interiorbright',
  relight: 'interiorbright', retouch: 'glamour', texture: 'fabricrich', detail: 'productsharp', improve: 'enhance', fix: 'enhance', polish: 'metalshine', wax: 'shoegloss', buff: 'shoegloss',
}

/** Score an action for a query. Returns 0 if no match. */
export function scoreAction(a, q) {
  if (!q) return 0
  const name = a.name.toLowerCase()
  const desc = (a.desc || '').toLowerCase()
  const cat = (a.cat || '').toLowerCase()
  const when = (a.when || '').toLowerCase()
  const id = a.id.toLowerCase()
  // exact name match → top
  if (name === q) return 100
  if (name.includes(q)) return 85
  // category / desc / when match
  if (cat.includes(q)) return 60
  if (desc.includes(q)) return 50
  if (when.includes(q)) return 45
  // synonym map
  if (SYNONYMS[q] === id) return 90
  // material / surface / condition vocabulary
  if (MATERIAL_TERMS[q] === id) return 82
  // phrase match (any contained multiword phrase)
  for (const [phrase, target] of PHRASES) {
    if (target === id && phrase.includes(q)) return 80
  }
  return 0
}

// One-touch extras (live in the command bar / recipes but not in the
// ACTIONS catalog) — make them searchable too.
const ONETOUCH = [
  { id: 'enhance', name: 'Auto Enhance', cat: 'One-touch', desc: 'Balance light and color in one step', fe: 'local', applies: '*' },
  { id: 'crop-square', name: 'Crop to Square', cat: 'One-touch', desc: 'Smart-crop to 1:1', fe: 'local', applies: '*' },
  { id: 'crop-portrait', name: 'Crop to Portrait', cat: 'One-touch', desc: 'Smart-crop to 4:5', fe: 'local', applies: '*' },
  { id: 'remove-bg', name: 'Remove Background', cat: 'One-touch', desc: 'Cut out the subject', fe: 'local', applies: '*' },
  { id: 'replace-bg', name: 'Replace Background', cat: 'One-touch', desc: 'New backdrop behind the subject', fe: 'local', applies: '*' },
  { id: 'sharpen', name: 'Sharpen', cat: 'One-touch', desc: 'Crisper detail', fe: 'local', applies: '*' },
  { id: 'text-color', name: 'Auto Text Color', cat: 'One-touch', desc: 'Match text color to the image', fe: 'local', applies: '*' },
  { id: 'bw', name: 'Black & White', cat: 'One-touch', desc: 'Grayscale', fe: 'local', applies: '*' },
  { id: 'warm', name: 'Warm Up', cat: 'One-touch', desc: 'Warmer temperature', fe: 'local', applies: '*' },
  { id: 'cool', name: 'Cool Down', cat: 'One-touch', desc: 'Cooler temperature', fe: 'local', applies: '*' },
  { id: 'brighten', name: 'Brighten', cat: 'One-touch', desc: 'More light', fe: 'local', applies: '*' },
  { id: 'darken', name: 'Darken', cat: 'One-touch', desc: 'Less light', fe: 'local', applies: '*' },
  { id: 'contrast', name: 'More Contrast', cat: 'One-touch', desc: 'Punchier contrast', fe: 'local', applies: '*' },
  { id: 'saturate', name: 'More Color', cat: 'One-touch', desc: 'More saturation', fe: 'local', applies: '*' },
  { id: 'desaturate', name: 'Less Color', cat: 'One-touch', desc: 'Fade the colors', fe: 'local', applies: '*' },
]

/** Search all actions; returns [{action, score}] sorted desc. */
export function searchActions(q, { localOnly = true } = {}) {
  const query = String(q || '').trim().toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')
  if (!query) return []
  const words = query.split(' ').filter(Boolean)
  const out = []
  const pool = localOnly ? [...ACTIONS.filter((a) => a.fe === 'local'), ...ONETOUCH] : [...ACTIONS, ...ONETOUCH]
  for (const a of pool) {
    // score = best of: full phrase, each word, each material/action term
    let best = scoreAction(a, query)
    for (const w of words) {
      const s = scoreAction(a, w)
      if (s > best) best = s
    }
    // phrase targets: a contained library phrase that points at this id boosts
    for (const [phrase, target] of PHRASES) {
      if (target === a.id && query.includes(phrase)) best = Math.max(best, 95)
    }
    if (best > 0) out.push({ action: a, score: best })
  }
  return out.sort((x, y) => y.score - x.score)
}

/** Suggested search terms shown when the box is empty. */
export const SEARCH_SUGGESTIONS = [
  'slim', 'teeth', 'shine', 'luxury', 'clean', 'gold', 'car', 'food', 'face', 'remove background',
]

/** Generic text scorer for non-action inventory (tools, panels, exports…). */
export function scoreQuery(text, q) {
  if (!q) return 0
  const t = String(text || '').toLowerCase()
  const words = q.split(' ').filter(Boolean)
  if (!words.length) return 0
  let best = 0
  for (const w of words) {
    if (t === w) best = Math.max(best, 100)
    else if (t.includes(w)) best = Math.max(best, 80)
    else if (t.replace(/[^a-z0-9]/g, '').includes(w.replace(/[^a-z0-9]/g, ''))) best = Math.max(best, 60)
  }
  return best
}
