// src/lib/howto.js
// "How do I…?" assistant — maps plain-English questions to Inkception tools,
// step-by-step instructions and relevant YouTube tutorial searches.
// Brand-free: answers only reference Inkception's own tools.

export const HOWTOS = [
  {
    id: 'blur-bg',
    keys: ['blur the background', 'blur background', 'background blur', 'blur behind', 'bokeh', 'depth of field'],
    q: 'How do I blur the background?',
    steps: [
      'Use the AI tab → Remove Background to cut out the subject.',
      'Then Quick tab → Blur (or Blur More) applies blur to the whole image.',
      'For a natural look, use the Blur Brush in the tool dock and paint the background areas directly.',
    ],
    tool: 'Blur Brush',
    tab: 'quick',
    action: 'blur',
    yt: 'how to blur background in photo editor',
  },
  {
    id: 'use-blur-more',
    keys: ['use blur more', 'blur more', 'stronger blur', 'more blur'],
    q: 'How do I use Blur More?',
    steps: [
      'Open the Quick tab (right panel).',
      'Under Filter, tap Blur More — it applies a heavier blur than Blur.',
      'Tap it again to toggle off, or use Reset All.',
    ],
    tool: 'Blur More',
    tab: 'quick',
    action: 'blur-more',
    yt: 'how to blur photo editor tutorial',
  },
  {
    id: 'remove-bg',
    keys: ['remove background', 'cut out', 'transparent background', 'isolate subject', 'remove the background'],
    q: 'How do I remove the background?',
    steps: [
      'Open the AI tab.',
      'Tap Remove Background — it runs on-device subject matting.',
      'The cutout stays transparent; toggle the Backdrop layer in Layers to check.',
    ],
    tool: 'Remove Background',
    tab: 'ai',
    action: 'removebg',
    yt: 'how to remove background in photo editor',
  },
  {
    id: 'change-bg',
    keys: ['change background', 'replace background', 'new background', 'swap background'],
    q: 'How do I change the background?',
    steps: [
      'Remove the background first (AI tab → Remove Background).',
      'Then AI tab → Replace Background and pick Black, White, Gradient or Transparent.',
    ],
    tool: 'Replace Background',
    tab: 'ai',
    action: 'replacebg',
    yt: 'how to replace background in photo editor',
  },
  {
    id: 'remove-object',
    keys: ['remove object', 'erase object', 'delete object', 'remove something', 'get rid of'],
    q: 'How do I remove an object from a photo?',
    steps: [
      'AI tab → Magic Eraser.',
      'Paint over the object on the canvas, then tap Apply — it fills the area from the surroundings.',
    ],
    tool: 'Magic Eraser',
    tab: 'ai',
    action: 'eraser',
    yt: 'how to remove object from photo in editor',
  },
  {
    id: 'sharpen',
    keys: ['sharpen', 'make sharper', 'crisp', 'clear photo', 'focus'],
    q: 'How do I sharpen a photo?',
    steps: [
      'Quick tab → Sharpen (one tap).',
      'For more, More tab → Filters → Sharpen More or Sharpen Edges.',
      'Denoise first if the image is noisy, then sharpen.',
    ],
    tool: 'Sharpen',
    tab: 'quick',
    action: 'sharpen',
    yt: 'how to sharpen photo in photo editor',
  },
  {
    id: 'denoise',
    keys: ['denoise', 'remove noise', 'grainy', 'grain', 'fix noise', 'clean up photo'],
    q: 'How do I remove noise / grain?',
    steps: [
      'AI tab → Denoise — it measures the noise level and smooths only the noisy areas.',
      'Or More tab → Filters → Median for a quick reduction.',
    ],
    tool: 'Denoise',
    tab: 'ai',
    action: 'denoise',
    yt: 'how to reduce noise in photo editor',
  },
  {
    id: 'upscale',
    keys: ['upscale', 'make bigger', 'enlarge', 'higher resolution', '4k', 'print size'],
    q: 'How do I make an image bigger without losing quality?',
    steps: [
      'AI tab → Upscale, then pick 2×, 4× or 8×.',
      'Larger exports also get smarter: try it before exporting for print.',
    ],
    tool: 'Upscale',
    tab: 'ai',
    action: 'upscale',
    yt: 'how to upscale image quality photo editor',
  },
  {
    id: 'crop',
    keys: ['crop', 'cut', 'trim photo', 'square', 'resize canvas'],
    q: 'How do I crop the image?',
    steps: [
      'Tool dock → Crop, then drag a box on the image and tap Apply Crop.',
      'For social sizes, use Smart Crop or the Export presets (auto cover-crop).',
    ],
    tool: 'Crop',
    tab: 'adjust',
    action: 'crop',
    yt: 'how to crop photo in photo editor',
  },
  {
    id: 'resize-platform',
    keys: ['instagram size', 'facebook size', 'youtube thumbnail', 'story size', 'whatsapp', 'platform size', 'export size', 'tiktok'],
    q: 'How do I get the right size for social media?',
    steps: [
      'Tap Export (top bar).',
      'Pick the platform (Instagram, Facebook, WhatsApp, YouTube, TikTok…) — 27 exact presets.',
      'Choose a format (PNG/JPG/WebP…) and Export.',
    ],
    tool: 'Export',
    tab: 'adjust',
    action: 'export',
    yt: 'social media image size guide',
  },
  {
    id: 'add-text',
    keys: ['add text', 'write on photo', 'caption', 'headline', 'title text', 'type'],
    q: 'How do I add text to a photo?',
    steps: [
      'Tool dock → Text (T), then click the canvas to place text.',
      'Use the Text tab to change font (15 fonts), size, bold/italic, color, alignment and spacing.',
      'Press Enter inside the text for a new line.',
    ],
    tool: 'Text tool',
    tab: 'text',
    action: 'text',
    yt: 'how to add text to photo in editor',
  },
  {
    id: 'text-color',
    keys: ['text color', 'make text readable', 'text on photo', 'contrast text'],
    q: 'How do I make text readable on a photo?',
    steps: [
      'Add your text, select it, then AI tab → Smart Text Color.',
      'It samples the background under the text and picks black or white automatically.',
    ],
    tool: 'Smart Text Color',
    tab: 'ai',
    action: 'textcolor',
    yt: 'how to make text readable on photo',
  },
  {
    id: 'retouch',
    keys: ['retouch', 'smooth skin', 'remove blemish', 'portrait fix', 'beauty', 'clear skin'],
    q: 'How do I retouch a portrait?',
    steps: [
      'AI tab → Retouch (skin-aware smoothing + blemish reduction).',
      'Adjust Smooth Skin, Blemish Reduction and Brighten, then Apply.',
    ],
    tool: 'Retouch',
    tab: 'ai',
    action: 'retouch',
    yt: 'how to retouch portrait photo editor',
  },
  {
    id: 'color-grade',
    keys: ['color grade', 'match colors', 'same look', 'warm look', 'film look', 'preset look', 'lut'],
    q: 'How do I make my photo look like another one?',
    steps: [
      'AI tab → Color Grade, upload a reference image and set Match Strength.',
      'Or use Quick tab presets (Vintage, Sepia, Black & White).',
      'Temperature/Tint sliders in Adjust warm or cool the tone.',
    ],
    tool: 'Color Grade',
    tab: 'ai',
    action: 'lut',
    yt: 'how to color grade photo tutorial',
  },
  {
    id: 'collage',
    keys: ['collage', 'multiple photos', 'photo grid', 'combine photos', 'montage'],
    q: 'How do I make a collage?',
    steps: [
      'AI tab → Collage Studio.',
      'Pick 2–12 photos and a layout (12 templates).',
      'Choose Current Canvas or New Image, then Build Collage.',
      'Fine-tune each photo with Fit / Fill / Rotate / Swap in Layers.',
    ],
    tool: 'Collage Studio',
    tab: 'ai',
    action: 'collage',
    yt: 'how to make photo collage in editor',
  },
  {
    id: 'warp-can',
    keys: ['warp', 'wrap on can', 'wrap logo', 'bend image', 'cylinder', 'can label', 'curved'],
    q: 'How do I wrap a logo onto a tin can so it looks real?',
    steps: [
      'Open More tab → Warp.',
      'Increase Curvature to bend the image around the cylinder; enable Shine for the highlight.',
      'Apply, then adjust position with the Move tool.',
    ],
    tool: 'Warp',
    tab: 'more',
    action: 'warp',
    yt: 'how to wrap logo on can in photo editor',
  },
  {
    id: 'vectorize',
    keys: ['vector', 'svg', 'logo trace', 'make vector', 'convert to vector', 'raster to svg'],
    q: 'How do I turn an image into a vector (SVG)?',
    steps: [
      'AI tab → Vectorize, tune Detail Threshold and Path Smoothing.',
      'Export SVG from the panel — a standalone vector file.',
    ],
    tool: 'Vectorize',
    tab: 'ai',
    action: 'vectorize',
    yt: 'how to vectorize image to svg',
  },
  {
    id: 'decompose',
    keys: ['separate layers', 'split image', 'decompose', 'extract text', 'extract subject', 'remove text from image', 'face layer', 'person layer', 'clean background', 'photoshop layers'],
    q: 'How do I split my image into separate layers (text, face, person, background)?',
    steps: [
      'Effects panel → Extract Layers.',
      'It reads the image with real AI: person + face detection + OCR text — and creates a Face layer, Person layer, one layer per text block, and a clean background with the holes filled.',
      'Every layer is movable & scalable — and exports as PSD layers too.',
    ],
    tool: 'Extract Layers',
    tab: 'ai',
    action: 'decompose',
    yt: 'how to separate layers in photo editor',
  },
  {
    id: 'pixelstudio',
    keys: ['photoshop', 'photoshop style', 'pixel editor', 'paint', 'clone stamp', 'healing brush', 'smudge', 'dodge', 'burn', 'brush size', 'pixel studio', 'retouch brush'],
    q: 'Where is the Photoshop-style editing?',
    steps: [
      'Top menu → Pixel Studio (or the Pixel Studio button in the header / tool dock).',
      'You get Brush, Erase, Blur, AI Remove, Clone Stamp, Healing Brush, Bucket fill and a size slider — always visible, never hidden behind search.',
    ],
    tool: 'Pixel Studio',
    tab: 'ai',
    action: 'pixel',
    yt: 'photoshop style editing in browser',
  },
  {
    id: 'describe',
    keys: ['describe image', 'image to text', 'prompt from image', 'what is in this photo', 'caption', 'alt text'],
    q: 'How do I get a text prompt from an image?',
    steps: [
      'AI tab → Describe Image (cloud, with a one-time privacy consent).',
      'The AI writes SUBJECT / BACKGROUND / STYLE / TEXT — edit it, copy it, or send it straight to Generate Image.',
    ],
    tool: 'Describe Image',
    tab: 'ai',
    action: 'open',
    yt: 'image to prompt ai',
  },
  {
    id: 'generate',
    keys: ['generate image', 'text to image', 'ai image', 'create background with ai', 'make image from text'],
    q: 'How do I generate an image from text?',
    steps: [
      'AI tab → Generate Image — type what you want and press Generate.',
      'Free lane (no key) for backgrounds & textures; Pro lane (your own Google AI key) for photoreal quality. The result lands on the canvas as a movable layer.',
    ],
    tool: 'Generate Image',
    tab: 'ai',
    action: 'open',
    yt: 'text to image free',
  },
  {
    id: 'animate',
    keys: ['animate', 'animation', 'fireworks', 'live effects', 'make image move', 'video from image', 'image to video'],
    q: 'How do I animate my image?',
    steps: [
      'AI tab → Animate — three ways: Live FX (free), 2.5D Depth (free, uses Extract Layers), AI Video via Veo (paid, ≈$0.15/s with your own key).',
      'Export → GIF or MP4 renders the animation into the file.',
    ],
    tool: 'Animate',
    tab: 'ai',
    action: 'open',
    yt: 'animate still image',
  },
  {
    id: 'faceframe',
    keys: ['face on banner', 'put face on template', 'face frame', 'adjust face', 'show eyes only', 'face zoom', 'template face'],
    q: 'How do I put a face on a banner/template and adjust it?',
    steps: [
      'Start from a Template → pick a banner size → Add Face / Photo.',
      'The photo drops into an adjustable frame — the face is auto-centered. Drag to show just the eyes, use the corner handles to zoom out to the full face.',
      'The white frame bar (Face · Fill · Fit · − ＋ · Release) gives you one-click control.',
    ],
    tool: 'Add Face / Photo',
    tab: 'ai',
    action: 'open',
    yt: 'how to put face on banner template',
  },
  {
    id: 'export-psd',
    keys: ['psd', 'layered file', 'save layers', 'edit later', 'photoshop file'],
    q: 'How do I save my layers so I can edit later?',
    steps: [
      'Export → PSD. Every canvas object becomes an editable layer (name, opacity, blend mode).',
      'Open it in any PSD-compatible editor to continue working.',
    ],
    tool: 'Export PSD',
    tab: 'adjust',
    action: 'export',
    yt: 'how to export layered psd file',
  },
  {
    id: 'animated',
    keys: ['animated', 'gif', 'video', 'mp4', 'motion', 'animate'],
    q: 'How do I export an animated GIF or video?',
    steps: [
      'AI tab → Motion (Slow Zoom / Pan / Light Sweep) to set the animation.',
      'Export → GIF (animated) or MP4 — it renders the motion as real frames.',
    ],
    tool: 'Motion + Export',
    tab: 'ai',
    action: 'motion',
    yt: 'how to make animated gif from photo',
  },
  {
    id: 'compare',
    keys: ['before after', 'compare', 'see changes', 'undo look'],
    q: 'How do I compare before and after?',
    steps: [
      'Tool dock → Compare (or ⌘B).',
      'Drag the divider to slide between original and edited.',
    ],
    tool: 'Compare',
    tab: 'adjust',
    action: 'compare',
    yt: 'before after photo comparison editor',
  },
  {
    id: 'flip-rotate',
    keys: ['flip', 'mirror', 'rotate', 'turn sideways'],
    q: 'How do I flip or rotate the image?',
    steps: [
      'Quick tab → Transform: Flip H, Flip V, or Rotate 90°.',
    ],
    tool: 'Flip / Rotate',
    tab: 'quick',
    action: 'flip',
    yt: 'how to flip rotate photo editor',
  },
  {
    id: 'sunglasses',
    keys: ['sunglasses', 'take glasses off', 'remove glasses', 'take off sunglasses'],
    q: 'How do I remove sunglasses?',
    steps: [
      'Honest note: removing sunglasses requires generative AI to invent the eyes behind them — that needs a paid model, not available free.',
      'Free workaround: if the frames are small/thin, use AI → Magic Eraser and paint over the frame — the diffusion fill blends the surroundings.',
      'For a convincing result you need a generative editor (paid) or a new photo.',
    ],
    tool: 'Magic Eraser',
    tab: 'ai',
    action: 'eraser',
    yt: 'how to remove sunglasses in photo editor',
  },
  {
    id: 'eye-color',
    keys: ['blue eyes', 'eye color', 'change eye color', 'eyes blue'],
    q: 'How do I change eye color (e.g. blue eyes)?',
    steps: [
      'Honest note: truly changing eye color means recoloring the iris — we can approximate it free, not perfect it.',
      'Free way: use Quick tab → Color Grade with a reference image of the eye color you want for the closest match.',
      'A paid generative editor can do this properly; free editors can only approximate.',
    ],
    tool: 'Color Grade',
    tab: 'ai',
    action: 'lut',
    yt: 'how to change eye color in photo editor',
  },
]

/** Match a question to a how-to. Returns the entry or null. */
export function matchHowTo(q) {
  const t = String(q || '').toLowerCase().trim()
  if (!t) return null
  // normalize punctuation
  const norm = t.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')
  let best = null
  let bestScore = 0
  for (const h of HOWTOS) {
    let score = 0
    for (const k of h.keys) {
      if (norm.includes(k)) score += k.split(' ').length
    }
    if (score > bestScore) {
      bestScore = score
      best = h
    }
  }
  return bestScore > 0 ? best : null
}

/** YouTube search URL for a technique (brand-free query). */
export function youTubeSearch(q) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}
