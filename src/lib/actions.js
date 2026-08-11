// src/lib/actions.js
// The Actions catalog — one-click effects gathered from the techniques docs.
// Each action: name (brand-free), category, description, "when to use",
// feasibility: 'local' (deterministic, free) | 'ai' (needs model/API) |
// 'composite' (needs multi-layer ops) — so the UI can hide/discard the rest.
// fnKey maps to a handler in the Editor; null = not implemented yet (hidden).

export const ACTIONS = [
  /* ---- Artistic & Drawing ---- */
  { id: 'sketch', name: 'Pencil Sketch', cat: 'Artistic', applies: '*', desc: 'Turn the photo into a pencil drawing', when: 'Concept art, cards, prints', fe: 'local', icon: 'penTool' },
  { id: 'charcoal', name: 'Charcoal', cat: 'Artistic', applies: '*', desc: 'Rough, smudged charcoal look', when: 'Artistic portraits, posters', fe: 'local', icon: 'brush' },
  { id: 'oil', name: 'Oil Paint', cat: 'Artistic', applies: '*', desc: 'Brushstroke oil-painting feel', when: 'Gallery-style prints', fe: 'ai', icon: 'brush' },
  { id: 'watercolor', name: 'Watercolor', cat: 'Artistic', applies: '*', desc: 'Soft watercolor wash', when: 'Invites, soft art', fe: 'ai', icon: 'droplet' },
  { id: 'posterize', name: 'Posterize', cat: 'Artistic', applies: '*', desc: 'Flatten tones to bold bands', when: 'Pop-art posters', fe: 'local', icon: 'grid' },
  { id: 'cutout', name: 'Cutout', cat: 'Artistic', applies: '*', desc: 'Simplified paper-cut shapes', when: 'Logos, icons', fe: 'local', icon: 'scissors' },

  /* ---- Portrait & Face ---- */
  { id: 'teeth', name: 'Whiten Teeth', cat: 'Portrait', applies: 'portrait', desc: 'Brighten + desaturate teeth only', when: 'Smiles in portraits', fe: 'local', icon: 'sun' },
  { id: 'smooth', name: 'Smooth Skin', cat: 'Portrait', applies: 'portrait', desc: 'Soft-focus skin, keep texture', when: 'Portraits, selfies', fe: 'local', icon: 'droplet' },
  { id: 'pimples', name: 'Remove Pimples', cat: 'Portrait', applies: 'portrait', desc: 'Spot-blend blemishes', when: 'Close-up portraits', fe: 'local', icon: 'focus' },
  { id: 'wrinkles', name: 'Reduce Wrinkles', cat: 'Portrait', applies: 'portrait', desc: 'Gentle skin-mask smoothing', when: 'Aged portraits', fe: 'local', icon: 'wind' },
  { id: 'glamour', name: 'Glamour Look', cat: 'Portrait', applies: 'portrait', desc: 'Soft skin + warm + vignette', when: 'Beauty shots', fe: 'local', icon: 'sparkle' },
  { id: 'chin', name: 'Chin Lift', cat: 'Portrait', applies: 'portrait', desc: 'Subtle jawline lift', when: 'Profile portraits', fe: 'local', icon: 'move' },
  { id: 'slim', name: 'Slim Body', cat: 'Portrait', applies: 'portrait', desc: 'Narrow mid-body, keep head/feet', when: 'Full-body shots', fe: 'local', icon: 'move' },
  { id: 'eyes', name: 'Brighten Eyes', cat: 'Portrait', applies: 'portrait', desc: 'Dodge the iris area', when: 'Portraits, pet shots', fe: 'local', icon: 'eye' },
  { id: 'lipcolor', name: 'Lip Color', cat: 'Portrait', applies: 'portrait', desc: 'Recolor lips via hue map', when: 'Beauty retouch', fe: 'local', icon: 'droplet' },

  /* ---- Color & Light ---- */
  { id: 'duotone', name: 'Duotone', cat: 'Color', applies: '*', desc: 'Two-ink color grade', when: 'Branding, posters', fe: 'local', icon: 'layers' },
  { id: 'splittone', name: 'Split Tone', cat: 'Color', applies: '*', desc: 'Warm highlights, cool shadows', when: 'Cinematic looks', fe: 'local', icon: 'sliders' },
  { id: 'goldenhour', name: 'Golden Hour', cat: 'Color', applies: '*', desc: 'Warm sunset grade', when: 'Outdoor, lifestyle', fe: 'local', icon: 'sun' },
  { id: 'vignette', name: 'Vignette', cat: 'Color', applies: '*', desc: 'Darken edges to focus center', when: 'Portraits, product', fe: 'local', icon: 'focus' },
  { id: 'hdr', name: 'HDR Pop', cat: 'Color', applies: '*', desc: 'Local-contrast punch', when: 'Landscapes, texture', fe: 'local', icon: 'sun' },
  { id: 'filmgrain', name: 'Film Grain', cat: 'Color', applies: '*', desc: 'Add unified grain', when: 'Unify composites', fe: 'local', icon: 'image' },
  { id: 'faded', name: 'Faded Film', cat: 'Color', applies: '*', desc: 'Low-contrast washed look', when: 'Instagram aesthetic', fe: 'local', icon: 'archive' },
  { id: 'bwchannel', name: 'B&W Channel Mix', cat: 'Color', applies: '*', desc: 'Per-channel B&W control', when: 'Dramatic B&W', fe: 'local', icon: 'image' },
  { id: 'colorbw', name: 'B&W → Color (tint)', cat: 'Color', applies: '*', desc: 'Warm/cool tint (not true colorize)', when: 'Approx. old-photo color', fe: 'local', icon: 'droplet' },
  { id: 'cyanotype', name: 'Cyanotype', cat: 'Color', applies: '*', desc: 'Classic blue print process', when: 'Fine-art prints, posters', fe: 'local', icon: 'image' },
  { id: 'tealorange', name: 'Teal & Orange', cat: 'Color', applies: '*', desc: 'Blockbuster cinematic split', when: 'Film stills, drama', fe: 'local', icon: 'layers' },
  { id: 'crossprocess', name: 'Cross Process', cat: 'Color', applies: '*', desc: 'E-6 chemistry remix', when: 'Punchy retro color', fe: 'local', icon: 'layers' },
  { id: 'infrared', name: 'Infrared', cat: 'Color', applies: '*', desc: 'Channel-swap dream look', when: 'Foliage, surreal', fe: 'local', icon: 'eye' },
  { id: 'colorpop', name: 'Red Pop', cat: 'Color', applies: '*', desc: 'B&W except strong reds', when: 'Selective-color shots', fe: 'local', icon: 'droplet' },
  { id: 'ice', name: 'Ice Blue', cat: 'Color', applies: '*', desc: 'Cool arctic grade', when: 'Winter, product, tech', fe: 'local', icon: 'moon' },
  { id: 'sunset', name: 'Sunset Glow', cat: 'Color', applies: '*', desc: 'Warm golden light', when: 'Outdoor, golden hour', fe: 'local', icon: 'sun' },
  { id: 'matte', name: 'Flat Matte', cat: 'Color', applies: '*', desc: 'Lifted blacks, muted tone', when: 'Film stills, fashion', fe: 'local', icon: 'image' },
  { id: 'noir', name: 'Noir', cat: 'Color', applies: '*', desc: 'Hard contrasty B&W', when: 'Dramatic, moody', fe: 'local', icon: 'moon' },
  { id: 'bleach', name: 'Bleach Bypass', cat: 'Color', applies: '*', desc: 'Silver-halide contrast', when: 'Gritty, editorial', fe: 'local', icon: 'sparkle' },
  { id: 'lomo', name: 'Lomo', cat: 'Color', applies: '*', desc: 'Toy-camera saturation + vignette', when: 'Snapshot nostalgia', fe: 'local', icon: 'focus' },
  { id: 'pastel', name: 'Pastel', cat: 'Color', applies: '*', desc: 'Soft light muted wash', when: 'Dreamy, invites', fe: 'local', icon: 'droplet' },

  /* ---- Vintage & Retro ---- */
  { id: 'sepia', name: 'Sepia', cat: 'Vintage', applies: '*', desc: 'Classic warm-brown', when: 'Old-photo feel', fe: 'local', icon: 'clock' },
  { id: 'instant', name: 'Instant Photo', cat: 'Vintage', applies: '*', desc: 'Faded instant-camera look', when: 'Polaroid-style', fe: 'local', icon: 'archive' },
  { id: 'aged', name: 'Aged Paper', cat: 'Vintage', applies: '*', desc: 'Yellowed + grain + vignette', when: 'Heritage shots', fe: 'local', icon: 'layers' },
  { id: 'vintagebw', name: 'Vintage B&W', cat: 'Vintage', applies: '*', desc: 'Soft contrast, warm greys', when: 'Classic portraits', fe: 'local', icon: 'image' },

  /* ---- Texture & Pattern ---- */
  { id: 'halftone', name: 'Halftone', cat: 'Texture', applies: '*', desc: 'Dot-screen print look', when: 'Comic, print', fe: 'local', icon: 'grid' },
  { id: 'canvas', name: 'Canvas', cat: 'Texture', applies: '*', desc: 'Canvas-weave texture', when: 'Painting feel', fe: 'local', icon: 'grid' },
  { id: 'glitch', name: 'Glitch', cat: 'Texture', applies: '*', desc: 'Digital glitch bands', when: 'Music, tech art', fe: 'local', icon: 'wind' },
  { id: 'grain2', name: 'Heavy Grain', cat: 'Texture', applies: '*', desc: 'Strong noise texture', when: 'Vintage, moody', fe: 'local', icon: 'sparkle' },
  { id: 'scanlines', name: 'Scanlines', cat: 'Texture', applies: '*', desc: 'Retro CRT screen', when: 'Retro, screens', fe: 'local', icon: 'grid' },
  { id: 'dither', name: 'Dither', cat: 'Texture', applies: '*', desc: 'Ordered 4-level newsprint', when: 'Print, pixel art', fe: 'local', icon: 'grid' },
  { id: 'blueprint', name: 'Blueprint', cat: 'Texture', applies: '*', desc: 'White edges on deep blue', when: 'Drafts, technical art', fe: 'local', icon: 'penTool' },

  /* ---- Restore & Repair ---- */
  { id: 'restore', name: 'Restore Old Photo', cat: 'Restore', applies: '*', desc: 'Creases + dust + faded tone', when: 'Scanned old photos', fe: 'local', icon: 'refresh' },
  { id: 'repaircrease', name: 'Repair Creases', cat: 'Restore', applies: '*', desc: 'Detect + inpaint line damage', when: 'Folded/scratched photos', fe: 'local', icon: 'refresh' },
  { id: 'despeckle', name: 'Dust & Scratches', cat: 'Restore', applies: '*', desc: 'Median despeckle', when: 'Scanned prints', fe: 'local', icon: 'wind' },
  { id: 'dehaze', name: 'Dehaze', cat: 'Restore', applies: '*', desc: 'Remove fog/haze', when: 'Landscape, weather', fe: 'local', icon: 'wind' },
  { id: 'colorize', name: 'True Colorize B&W', cat: 'Restore', applies: '*', desc: 'AI recoloring (needs model)', when: 'Real colorization', fe: 'ai', icon: 'sparkle' },

  /* ---- Creative / Composite ---- */
  { id: 'doubleexpo', name: 'Double Exposure', cat: 'Creative', applies: '*', desc: 'Blend a second image', when: 'Artistic composites', fe: 'composite', icon: 'layers' },
  { id: 'kaleido', name: 'Kaleidoscope', cat: 'Creative', applies: '*', desc: 'Mirror symmetry pattern', when: 'Psychedelic, patterns', fe: 'local', icon: 'refresh' },
  { id: 'mirror', name: 'Mirror', cat: 'Creative', applies: '*', desc: 'Fold image horizontally', when: 'Symmetry art', fe: 'local', icon: 'flipH' },
  { id: 'sunrays', name: 'Sunbeams', cat: 'Creative', applies: '*', desc: 'Add light shafts', when: 'Atmosphere', fe: 'composite', icon: 'sun' },
  { id: 'rain', name: 'Rain', cat: 'Creative', applies: '*', desc: 'Add rain streaks', when: 'Moody scenes', fe: 'composite', icon: 'wind' },
  { id: 'sky', name: 'Sky Replacement', cat: 'Creative', applies: '*', desc: 'Swap sky (needs mask+model)', when: 'Landscape', fe: 'ai', icon: 'image' },

  /* ---- Digital Art ---- */
  { id: 'neon', name: 'Neon Glow', cat: 'Digital', applies: '*', desc: 'Glowing edges', when: 'Signs, night', fe: 'local', icon: 'sparkle' },
  { id: 'pop', name: 'Pop Art', cat: 'Digital', applies: '*', desc: 'Bold flat colors', when: 'Posters, merch', fe: 'local', icon: 'grid' },
  { id: 'pixelate', name: 'Pixelate', cat: 'Digital', applies: '*', desc: 'Blocky mosaic', when: 'Censorship, retro', fe: 'local', icon: 'grid' },
  { id: 'sketch3d', name: '3D Sketch Pop', cat: 'Digital', applies: '*', desc: 'Stereoscopic sketch (needs depth)', when: 'Surreal art', fe: 'ai', icon: 'layers' },

  /* ---- Motion ---- */
  { id: 'motionbg', name: 'Motion Blur BG', cat: 'Motion', applies: 'portrait', desc: 'Streak background, subject sharp', when: 'Car/action shots', fe: 'local', icon: 'wind' },
  { id: 'tilt', name: 'Tilt-Shift', cat: 'Motion', applies: '*', desc: 'Miniature focus band', when: 'Toy-town effect', fe: 'local', icon: 'focus' },
  { id: 'zoomblur', name: 'Zoom Blur', cat: 'Motion', applies: '*', desc: 'Radial zoom burst', when: 'Action, focus punch', fe: 'local', icon: 'focus' },
  /* ---- Commercial & Product (from the action library) ---- */
  { id: 'luxury', name: 'Luxury Grade', cat: 'Commercial', applies: ['portrait', 'product'], desc: 'Warm, rich, editorial contrast', when: 'Premium product or fashion look', fe: 'local', icon: 'sparkle' },
  { id: 'catalog', name: 'Catalog Look', cat: 'Commercial', applies: ['portrait', 'product'], desc: 'Matte + sharpen + punch (ad finish)', when: 'E-commerce, catalogs', fe: 'local', icon: 'image' },
  { id: 'brandnew', name: 'Brand New', cat: 'Commercial', applies: ['product'], desc: 'Despeckle + dehaze + crisp contrast', when: 'Pre-owned or dusty products', fe: 'local', icon: 'refresh' },
  { id: 'productsharp', name: 'Product Sharpen', cat: 'Commercial', applies: ['product'], desc: 'Crisp detail for catalog shots', when: 'Product photography', fe: 'local', icon: 'focus' },
  { id: 'mattefinish', name: 'Matte Finish', cat: 'Commercial', applies: ['*'], desc: 'Lifted blacks, muted, non-glare', when: 'Soft product or portrait finish', fe: 'local', icon: 'moon' },
  { id: 'diamond', name: 'Diamond Sparkle', cat: 'Commercial', applies: ['product'], desc: 'Sparkle + highlight lift', when: 'Jewelry, gemstones', fe: 'local', icon: 'sparkle' },
  { id: 'goldrich', name: 'Rich Gold', cat: 'Commercial', applies: ['product'], desc: 'Warm metallic gold tone', when: 'Gold jewelry, bars, accents', fe: 'local', icon: 'sun' },
  { id: 'silverbright', name: 'Bright Silver', cat: 'Commercial', applies: ['product'], desc: 'Cool clean silver finish', when: 'Silver, platinum, chrome', fe: 'local', icon: 'moon' },
  { id: 'gemstone', name: 'Gemstone Vibrance', cat: 'Commercial', applies: ['product'], desc: 'Deep, rich gem saturation', when: 'Colored stones, crystals', fe: 'local', icon: 'droplet' },
  { id: 'metalshine', name: 'Metal Shine', cat: 'Commercial', applies: ['product', 'portrait'], desc: 'Punchy contrast + speculars', when: 'Hardware, watches, metal', fe: 'local', icon: 'focus' },
  { id: 'glassgloss', name: 'Glass Gloss', cat: 'Commercial', applies: ['product'], desc: 'Clean specular shine', when: 'Bottles, perfume, glassware', fe: 'local', icon: 'droplet' },
  { id: 'fabricrich', name: 'Fabric Rich', cat: 'Commercial', applies: ['portrait', 'product'], desc: 'Weave texture + depth', when: 'Clothing, textiles', fe: 'local', icon: 'layers' },
  { id: 'denim', name: 'Denim Pop', cat: 'Commercial', applies: ['portrait', 'product'], desc: 'Contrast + saturated denim', when: 'Jeans, jackets', fe: 'local', icon: 'layers' },
  { id: 'silksheen', name: 'Silk Sheen', cat: 'Commercial', applies: ['portrait', 'product'], desc: 'Soft satiny highlights', when: 'Silk, satin, premium fabric', fe: 'local', icon: 'wind' },
  { id: 'dewrinkle', name: 'Smooth Fabric', cat: 'Commercial', applies: ['portrait', 'product'], desc: 'Gently smooths garment creases', when: 'Wrinkled clothing', fe: 'local', icon: 'wind' },
  { id: 'scratchoff', name: 'Scratch Remover', cat: 'Restore', applies: ['*'], desc: 'Strong median — erases fine scratches', when: 'Scratched products, prints', fe: 'local', icon: 'refresh' },
  { id: 'spotclean', name: 'Spot Clean', cat: 'Restore', applies: ['*'], desc: 'Median + soften for stains/dust', when: 'Dirty spots, lint, dust', fe: 'local', icon: 'droplet' },

  /* ---- Interior & Scene ---- */
  { id: 'interiorbright', name: 'Room Brighten', cat: 'Interior', applies: ['landscape', 'product'], desc: 'Lift exposure, clear haze', when: 'Dark rooms, interiors', fe: 'local', icon: 'sun' },
  { id: 'interiorlux', name: 'Luxury Interior', cat: 'Interior', applies: ['landscape'], desc: 'Warm grade + deep vignette', when: 'High-end interiors, hotels', fe: 'local', icon: 'sparkle' },
  { id: 'windowlight', name: 'Window Light', cat: 'Interior', applies: ['landscape'], desc: 'Brightens the upper frame warmly', when: 'Windows, rooms, architecture', fe: 'local', icon: 'sun' },
  { id: 'floorclean', name: 'Floor Clean', cat: 'Interior', applies: ['landscape'], desc: 'Despeckle + brighten surfaces', when: 'Floors, tiles, surfaces', fe: 'local', icon: 'refresh' },
]

export const ACTION_CATS = ['Artistic', 'Portrait', 'Color', 'Vintage', 'Texture', 'Restore', 'Creative', 'Digital', 'Motion', 'Commercial', 'Interior']
