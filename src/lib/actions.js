// src/lib/actions.js
// The Actions catalog — one-click effects gathered from the techniques docs.
// Each action: name (brand-free), category, description, "when to use",
// feasibility: 'local' (deterministic, free) | 'ai' (needs model/API) |
// 'composite' (needs multi-layer ops) — so the UI can hide/discard the rest.
// fnKey maps to a handler in the Editor; null = not implemented yet (hidden).

export const ACTIONS = [
  /* ---- Artistic & Drawing ---- */
  { id: 'sketch', name: 'Pencil Sketch', cat: 'Artistic', desc: 'Turn the photo into a pencil drawing', when: 'Concept art, cards, prints', fe: 'local', icon: 'penTool' },
  { id: 'charcoal', name: 'Charcoal', cat: 'Artistic', desc: 'Rough, smudged charcoal look', when: 'Artistic portraits, posters', fe: 'local', icon: 'brush' },
  { id: 'oil', name: 'Oil Paint', cat: 'Artistic', desc: 'Brushstroke oil-painting feel', when: 'Gallery-style prints', fe: 'ai', icon: 'brush' },
  { id: 'watercolor', name: 'Watercolor', cat: 'Artistic', desc: 'Soft watercolor wash', when: 'Invites, soft art', fe: 'ai', icon: 'droplet' },
  { id: 'posterize', name: 'Posterize', cat: 'Artistic', desc: 'Flatten tones to bold bands', when: 'Pop-art posters', fe: 'local', icon: 'grid' },
  { id: 'cutout', name: 'Cutout', cat: 'Artistic', desc: 'Simplified paper-cut shapes', when: 'Logos, icons', fe: 'local', icon: 'scissors' },

  /* ---- Portrait & Face ---- */
  { id: 'teeth', name: 'Whiten Teeth', cat: 'Portrait', desc: 'Brighten + desaturate teeth only', when: 'Smiles in portraits', fe: 'local', icon: 'sun' },
  { id: 'smooth', name: 'Smooth Skin', cat: 'Portrait', desc: 'Soft-focus skin, keep texture', when: 'Portraits, selfies', fe: 'local', icon: 'droplet' },
  { id: 'pimples', name: 'Remove Pimples', cat: 'Portrait', desc: 'Spot-blend blemishes', when: 'Close-up portraits', fe: 'local', icon: 'focus' },
  { id: 'wrinkles', name: 'Reduce Wrinkles', cat: 'Portrait', desc: 'Gentle skin-mask smoothing', when: 'Aged portraits', fe: 'local', icon: 'wind' },
  { id: 'glamour', name: 'Glamour Look', cat: 'Portrait', desc: 'Soft skin + warm + vignette', when: 'Beauty shots', fe: 'local', icon: 'sparkle' },
  { id: 'chin', name: 'Chin Lift', cat: 'Portrait', desc: 'Subtle jawline lift', when: 'Profile portraits', fe: 'local', icon: 'move' },
  { id: 'slim', name: 'Slim Body', cat: 'Portrait', desc: 'Narrow mid-body, keep head/feet', when: 'Full-body shots', fe: 'local', icon: 'move' },
  { id: 'eyes', name: 'Brighten Eyes', cat: 'Portrait', desc: 'Dodge the iris area', when: 'Portraits, pet shots', fe: 'local', icon: 'eye' },
  { id: 'lipcolor', name: 'Lip Color', cat: 'Portrait', desc: 'Recolor lips via hue map', when: 'Beauty retouch', fe: 'local', icon: 'droplet' },

  /* ---- Color & Light ---- */
  { id: 'duotone', name: 'Duotone', cat: 'Color', desc: 'Two-ink color grade', when: 'Branding, posters', fe: 'local', icon: 'layers' },
  { id: 'splittone', name: 'Split Tone', cat: 'Color', desc: 'Warm highlights, cool shadows', when: 'Cinematic looks', fe: 'local', icon: 'sliders' },
  { id: 'goldenhour', name: 'Golden Hour', cat: 'Color', desc: 'Warm sunset grade', when: 'Outdoor, lifestyle', fe: 'local', icon: 'sun' },
  { id: 'vignette', name: 'Vignette', cat: 'Color', desc: 'Darken edges to focus center', when: 'Portraits, product', fe: 'local', icon: 'focus' },
  { id: 'hdr', name: 'HDR Pop', cat: 'Color', desc: 'Local-contrast punch', when: 'Landscapes, texture', fe: 'local', icon: 'sun' },
  { id: 'filmgrain', name: 'Film Grain', cat: 'Color', desc: 'Add unified grain', when: 'Unify composites', fe: 'local', icon: 'image' },
  { id: 'faded', name: 'Faded Film', cat: 'Color', desc: 'Low-contrast washed look', when: 'Instagram aesthetic', fe: 'local', icon: 'archive' },
  { id: 'bwchannel', name: 'B&W Channel Mix', cat: 'Color', desc: 'Per-channel B&W control', when: 'Dramatic B&W', fe: 'local', icon: 'image' },
  { id: 'colorbw', name: 'B&W → Color (tint)', cat: 'Color', desc: 'Warm/cool tint (not true colorize)', when: 'Approx. old-photo color', fe: 'local', icon: 'droplet' },

  /* ---- Vintage & Retro ---- */
  { id: 'sepia', name: 'Sepia', cat: 'Vintage', desc: 'Classic warm-brown', when: 'Old-photo feel', fe: 'local', icon: 'clock' },
  { id: 'instant', name: 'Instant Photo', cat: 'Vintage', desc: 'Faded instant-camera look', when: 'Polaroid-style', fe: 'local', icon: 'archive' },
  { id: 'aged', name: 'Aged Paper', cat: 'Vintage', desc: 'Yellowed + grain + vignette', when: 'Heritage shots', fe: 'local', icon: 'layers' },
  { id: 'vintagebw', name: 'Vintage B&W', cat: 'Vintage', desc: 'Soft contrast, warm greys', when: 'Classic portraits', fe: 'local', icon: 'image' },

  /* ---- Texture & Pattern ---- */
  { id: 'halftone', name: 'Halftone', cat: 'Texture', desc: 'Dot-screen print look', when: 'Comic, print', fe: 'local', icon: 'grid' },
  { id: 'canvas', name: 'Canvas', cat: 'Texture', desc: 'Canvas-weave texture', when: 'Painting feel', fe: 'local', icon: 'grid' },
  { id: 'glitch', name: 'Glitch', cat: 'Texture', desc: 'Digital glitch bands', when: 'Music, tech art', fe: 'local', icon: 'wind' },
  { id: 'grain2', name: 'Heavy Grain', cat: 'Texture', desc: 'Strong noise texture', when: 'Vintage, moody', fe: 'local', icon: 'sparkle' },

  /* ---- Restore & Repair ---- */
  { id: 'restore', name: 'Restore Old Photo', cat: 'Restore', desc: 'Creases + dust + faded tone', when: 'Scanned old photos', fe: 'local', icon: 'refresh' },
  { id: 'repaircrease', name: 'Repair Creases', cat: 'Restore', desc: 'Detect + inpaint line damage', when: 'Folded/scratched photos', fe: 'local', icon: 'refresh' },
  { id: 'despeckle', name: 'Dust & Scratches', cat: 'Restore', desc: 'Median despeckle', when: 'Scanned prints', fe: 'local', icon: 'wind' },
  { id: 'dehaze', name: 'Dehaze', cat: 'Restore', desc: 'Remove fog/haze', when: 'Landscape, weather', fe: 'local', icon: 'wind' },
  { id: 'colorize', name: 'True Colorize B&W', cat: 'Restore', desc: 'AI recoloring (needs model)', when: 'Real colorization', fe: 'ai', icon: 'sparkle' },

  /* ---- Creative / Composite ---- */
  { id: 'doubleexpo', name: 'Double Exposure', cat: 'Creative', desc: 'Blend a second image', when: 'Artistic composites', fe: 'composite', icon: 'layers' },
  { id: 'kaleido', name: 'Kaleidoscope', cat: 'Creative', desc: 'Mirror symmetry pattern', when: 'Psychedelic, patterns', fe: 'local', icon: 'refresh' },
  { id: 'mirror', name: 'Mirror', cat: 'Creative', desc: 'Fold image horizontally', when: 'Symmetry art', fe: 'local', icon: 'flipH' },
  { id: 'sunrays', name: 'Sunbeams', cat: 'Creative', desc: 'Add light shafts', when: 'Atmosphere', fe: 'composite', icon: 'sun' },
  { id: 'rain', name: 'Rain', cat: 'Creative', desc: 'Add rain streaks', when: 'Moody scenes', fe: 'composite', icon: 'wind' },
  { id: 'sky', name: 'Sky Replacement', cat: 'Creative', desc: 'Swap sky (needs mask+model)', when: 'Landscape', fe: 'ai', icon: 'image' },

  /* ---- Digital Art ---- */
  { id: 'neon', name: 'Neon Glow', cat: 'Digital', desc: 'Glowing edges', when: 'Signs, night', fe: 'local', icon: 'sparkle' },
  { id: 'pop', name: 'Pop Art', cat: 'Digital', desc: 'Bold flat colors', when: 'Posters, merch', fe: 'local', icon: 'grid' },
  { id: 'pixelate', name: 'Pixelate', cat: 'Digital', desc: 'Blocky mosaic', when: 'Censorship, retro', fe: 'local', icon: 'grid' },
  { id: 'sketch3d', name: '3D Sketch Pop', cat: 'Digital', desc: 'Stereoscopic sketch (needs depth)', when: 'Surreal art', fe: 'ai', icon: 'layers' },

  /* ---- Motion ---- */
  { id: 'motionbg', name: 'Motion Blur BG', cat: 'Motion', desc: 'Streak background, subject sharp', when: 'Car/action shots', fe: 'local', icon: 'wind' },
  { id: 'tilt', name: 'Tilt-Shift', cat: 'Motion', desc: 'Miniature focus band', when: 'Toy-town effect', fe: 'local', icon: 'focus' },
  { id: 'zoomblur', name: 'Zoom Blur', cat: 'Motion', desc: 'Radial zoom burst', when: 'Action, focus punch', fe: 'local', icon: 'focus' },
]

export const ACTION_CATS = ['Artistic', 'Portrait', 'Color', 'Vintage', 'Texture', 'Restore', 'Creative', 'Digital', 'Motion']
