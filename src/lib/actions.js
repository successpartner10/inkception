// src/lib/actions.js
import { GEN_ACTIONS } from './actions.gen'

// src/lib/actions.js
// The Actions catalog — one-click effects gathered from the techniques docs.
// Each action: name (brand-free), category, description, "when to use",
// feasibility: 'local' (deterministic, free) | 'ai' (needs model/API) |
// 'composite' (needs multi-layer ops) — so the UI can hide/discard the rest.
// fnKey maps to a handler in the Editor; null = not implemented yet (hidden).

const CURATED = [
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
  { id: 'motionbg', name: 'Motion Blur BG', cat: 'Motion', applies: '*', desc: 'Streak background, subject sharp', when: 'Car/action shots', fe: 'local', icon: 'wind' },
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
  /* ---- Fashion — Shoes & Footwear ---- */
  { id: 'shoeluxe', name: 'Shoe Luxe', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Premium contrast, texture & lighting for footwear', when: 'Luxury shoe shots', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'shoegloss', name: 'Shoe Gloss', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Controlled glossy shine', when: 'Leather shoes, boots', fe: 'local', icon: 'sun', fx: 'Shoe Gloss', def: 0.6 },
  { id: 'shoematte', name: 'Shoe Matte', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Reduce reflections, flat finish', when: 'Matte sneakers, suede', fe: 'local', icon: 'moon', fx: 'Matte Finish', def: 0.6 },
  { id: 'shoeclean', name: 'Shoe Cleaner', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Remove dirt, dust and stains', when: 'Worn footwear', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'shoescuff', name: 'Shoe Scuff Repair', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Erase fine scratches and scuffs', when: 'Scuffed shoes', fe: 'local', icon: 'refresh', fx: 'Scratch Remover', def: 0.6 },
  { id: 'leatherrich', name: 'Leather Rich', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Enhance leather grain and finish', when: 'Leather goods, jackets', fe: 'local', icon: 'layers', fx: 'Fabric Rich', def: 0.6 },
  { id: 'solebright', name: 'Sole Brighten', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Brighten and clean the sole band', when: 'Shoes, sneakers', fe: 'local', icon: 'sun', fx: 'Sole Brighten', def: 0.6 },
  { id: 'fluffsoft', name: 'Fluff Soften', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Soft-focus softness for fluffy textures', when: 'Slippers, knitwear, towels', fe: 'local', icon: 'wind', fx: 'Fluff Soften', def: 0.6 },
  { id: 'shoead', name: 'Shoe Ad Look', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Luxury footwear advertising finish', when: 'Campaign shots', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },
  { id: 'shoecutout', name: 'Shoe Cutout', cat: 'Fashion', applies: ['product', 'portrait'], desc: 'Clean product isolation', when: 'Catalog, e-commerce', fe: 'local', alias: 'remove-bg' },

  /* ---- Fashion — Clothing ---- */
  { id: 'ironoutfit', name: 'Iron Outfit', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Steam/smooth garment wrinkles', when: 'Wrinkled clothes', fe: 'local', icon: 'wind', fx: 'Smooth Fabric', def: 0.6 },
  { id: 'steampress', name: 'Steam Press', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Polished, crease-free finish', when: 'Formal wear', fe: 'local', icon: 'wind', fx: 'Smooth Fabric', def: 0.7 },
  { id: 'lintoff', name: 'Lint & Dust Off', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Remove lint, dust and fibers', when: 'Fabrics, dark clothing', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'stainoff', name: 'Stain Remover', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Clean garment stains and spots', when: 'Spots, marks', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.65 },
  { id: 'fashionlux', name: 'Luxury Fashion', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'High-end fashion retouching', when: 'Premium outfits', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'silkier', name: 'Silkier', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Silk/satin highlight enhancement', when: 'Silk, satin, premium fabric', fe: 'local', icon: 'wind', fx: 'Silk Sheen', def: 0.6 },
  { id: 'fabricmatte', name: 'Fabric Matte', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Reduce unwanted fabric reflections', when: 'Shiny synthetics', fe: 'local', icon: 'moon', fx: 'Matte Finish', def: 0.6 },
  { id: 'denimpro', name: 'Denim Pro', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Enhanced denim texture and contrast', when: 'Jeans, denim jackets', fe: 'local', icon: 'layers', fx: 'Denim Pop', def: 0.6 },
  { id: 'premiumleather', name: 'Premium Leather', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Leather grain + highlights', when: 'Jackets, bags, boots', fe: 'local', icon: 'layers', fx: 'Fabric Rich', def: 0.6 },
  { id: 'editorialfit', name: 'Editorial Fashion', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'High-fashion magazine finish', when: 'Editorial shoots', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },
  { id: 'outfitbg', name: 'Outfit Background', cat: 'Fashion', applies: ['portrait', 'product'], desc: 'Clean studio backdrop', when: 'E-commerce outfits', fe: 'local', alias: 'replace-bg' },

  /* ---- Fashion — Handbags & Accessories ---- */
  { id: 'bagscuff', name: 'Bag Scratch Repair', cat: 'Fashion', applies: ['product'], desc: 'Repair surface damage', when: 'Scratched handbags', fe: 'local', icon: 'refresh', fx: 'Scratch Remover', def: 0.6 },
  { id: 'bagleather', name: 'Bag Leather', cat: 'Fashion', applies: ['product'], desc: 'Enhance handbag leather', when: 'Leather bags', fe: 'local', icon: 'layers', fx: 'Fabric Rich', def: 0.6 },
  { id: 'hardwareshine', name: 'Hardware Shine', cat: 'Fashion', applies: ['product'], desc: 'Enhance metal hardware', when: 'Zips, buckles, clasps', fe: 'local', icon: 'focus', fx: 'Metal Shine', def: 0.6 },
  { id: 'bagdust', name: 'Bag Dust Off', cat: 'Fashion', applies: ['product'], desc: 'Clean dust and grime', when: 'Used handbags', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'bagbrandnew', name: 'Brand New Bag', cat: 'Fashion', applies: ['product'], desc: 'Full luxury product cleanup', when: 'Pre-owned bags', fe: 'local', icon: 'refresh', fx: 'Brand New', def: 0.6 },
  { id: 'bagcutout', name: 'Bag Cutout', cat: 'Fashion', applies: ['product'], desc: 'Clean product isolation', when: 'Listings', fe: 'local', alias: 'remove-bg' },

  /* ---- Luxury — Jewelry & Diamonds ---- */
  { id: 'diamondbright', name: 'Diamond Bright', cat: 'Luxury', applies: ['product'], desc: 'Increase controlled highlights', when: 'Diamond close-ups', fe: 'local', icon: 'sun', fx: 'Crystal Bright', def: 0.6 },
  { id: 'goldluxe', name: 'Gold Luxe', cat: 'Luxury', applies: ['product'], desc: 'Premium gold treatment', when: 'High-end gold', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'jewelshine', name: 'Jewelry Shine', cat: 'Luxury', applies: ['product'], desc: 'Enhance jewelry highlights', when: 'Rings, necklaces', fe: 'local', icon: 'focus', fx: 'Metal Shine', def: 0.6 },
  { id: 'jewelscuff', name: 'Jewelry Scratch Repair', cat: 'Luxury', applies: ['product'], desc: 'Jewelry surface restoration', when: 'Worn pieces', fe: 'local', icon: 'refresh', fx: 'Scratch Remover', def: 0.6 },
  { id: 'fingerprintoff', name: 'Fingerprint Off', cat: 'Luxury', applies: ['product'], desc: 'Clean reflective surfaces', when: 'Jewelry, screens, glass', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'platinumshine', name: 'Platinum Shine', cat: 'Luxury', applies: ['product'], desc: 'Enhance platinum reflections', when: 'Platinum pieces', fe: 'local', icon: 'moon', fx: 'Metal Shine', def: 0.6 },
  { id: 'dereflect', name: 'De-Reflect', cat: 'Luxury', applies: ['product'], desc: 'Reduce distracting reflections', when: 'Glassy jewelry, cases', fe: 'local', icon: 'moon', fx: 'De-Reflect', def: 0.6 },
  { id: 'jewelad', name: 'Jewelry Ad Look', cat: 'Luxury', applies: ['product'], desc: 'High-end jewelry retouch', when: 'Campaign shots', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },
  { id: 'goldbarreal', name: 'Gold Bar Real', cat: 'Luxury', applies: ['product'], desc: 'Metallic texture + reflections', when: 'Gold bars, ingots', fe: 'local', icon: 'sun', fx: 'Gold Bar', def: 0.6 },
  { id: 'goldbarshine', name: 'Gold Bar Shine', cat: 'Luxury', applies: ['product'], desc: 'Premium gold reflection boost', when: 'Bullion shots', fe: 'local', icon: 'sun', fx: 'Rich Gold', def: 0.6 },
  { id: 'goldbarclean', name: 'Gold Bar Clean', cat: 'Luxury', applies: ['product'], desc: 'Remove scratches, dust, marks', when: 'Refined bars', fe: 'local', icon: 'refresh', fx: 'Brand New', def: 0.6 },
  { id: 'jewelcutout', name: 'Jewelry Cutout', cat: 'Luxury', applies: ['product'], desc: 'Precision jewelry isolation', when: 'E-commerce', fe: 'local', alias: 'remove-bg' },

  /* ---- Luxury — Watches & Small Goods ---- */
  { id: 'watchshine', name: 'Watch Shine', cat: 'Luxury', applies: ['product'], desc: 'Enhance watch reflections', when: 'Steel, gold watches', fe: 'local', icon: 'focus', fx: 'Metal Shine', def: 0.6 },
  { id: 'watchface', name: 'Watch Face Sharp', cat: 'Luxury', applies: ['product'], desc: 'Improve dial clarity', when: 'Dial close-ups', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },
  { id: 'braceletpolish', name: 'Bracelet Polish', cat: 'Luxury', applies: ['product'], desc: 'Enhance metal finish', when: 'Watch bracelets, chains', fe: 'local', icon: 'layers', fx: 'Metal Shine', def: 0.6 },
  { id: 'watchcuff', name: 'Watch Scratch Repair', cat: 'Luxury', applies: ['product'], desc: 'Restore watch surface', when: 'Worn watches', fe: 'local', icon: 'refresh', fx: 'Scratch Remover', def: 0.6 },
  { id: 'productrestore', name: 'Product Restore', cat: 'Luxury', applies: ['product'], desc: 'Full product restoration', when: 'Any small product', fe: 'local', icon: 'refresh', fx: 'Brand New', def: 0.6 },

  /* ---- Fragrance & Beauty ---- */
  { id: 'fraglux', name: 'Fragrance Luxe', cat: 'Luxury', applies: ['product'], desc: 'Luxury fragrance retouch', when: 'Perfume bottles', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'bottleclean', name: 'Bottle Clean', cat: 'Luxury', applies: ['product'], desc: 'Clean glass surface', when: 'Bottles, jars', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'bottlescuff', name: 'Bottle Scratch Repair', cat: 'Luxury', applies: ['product'], desc: 'Repair bottle surface', when: 'Scratched glass', fe: 'local', icon: 'refresh', fx: 'Scratch Remover', def: 0.6 },
  { id: 'liquidrich', name: 'Liquid Rich', cat: 'Luxury', applies: ['product'], desc: 'Enhance liquid color depth', when: 'Perfume, drinks, oil', fe: 'local', icon: 'droplet', fx: 'Liquid Rich', def: 0.6 },
  { id: 'packsharp', name: 'Packaging Sharp', cat: 'Luxury', applies: ['product'], desc: 'Enhance packaging details', when: 'Boxes, cartons', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },
  { id: 'labelclear', name: 'Label Clarity', cat: 'Luxury', applies: ['product'], desc: 'Crisp label readability', when: 'Bottle labels', fe: 'local', icon: 'text', fx: 'Product Sharpen', def: 0.65 },
  { id: 'beautyad', name: 'Beauty Ad Look', cat: 'Luxury', applies: ['product', 'portrait'], desc: 'Premium cosmetics advertising', when: 'Cosmetic campaigns', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },
  { id: 'fragcutout', name: 'Fragrance Cutout', cat: 'Luxury', applies: ['product'], desc: 'Product isolation', when: 'Perfume listings', fe: 'local', alias: 'remove-bg' },

  /* ---- Interior & Documents ---- */
  { id: 'sunlight', name: 'Natural Sunlight', cat: 'Interior', applies: ['landscape'], desc: 'Warm directional daylight', when: 'Rooms with windows', fe: 'local', icon: 'sun', fx: 'Window Light', def: 0.6 },
  { id: 'plansharp', name: 'Plan Sharp', cat: 'Interior', applies: ['document'], desc: 'Crisp lines for plans and drawings', when: 'Floor plans, blueprints', fe: 'local', icon: 'penTool', fx: 'Plan Sharp', def: 0.6 },
  { id: 'docscan', name: 'Document Scan Clean', cat: 'Interior', applies: ['document'], desc: 'Clean, sharp, readable scan', when: 'Receipts, docs, pages', fe: 'local', icon: 'image', fx: 'Plan Sharp', def: 0.6 },
  /* ---- Eyewear ---- */
  { id: 'glassclean', name: 'Glasses Clean', cat: 'Eyewear', applies: ['product', 'portrait'], desc: 'Clear lenses, remove smudges', when: 'Sunglasses, glasses', fe: 'local', icon: 'droplet', fx: 'Screen Clean', def: 0.6 },
  { id: 'lensshine', name: 'Lens Shine', cat: 'Eyewear', applies: ['product', 'portrait'], desc: 'Bright reflective lenses', when: 'Sunglasses', fe: 'local', icon: 'sun', fx: 'Glass Gloss', def: 0.6 },
  { id: 'framepolish', name: 'Frame Polish', cat: 'Eyewear', applies: ['product', 'portrait'], desc: 'Metal/acetate frame shine', when: 'Glasses frames', fe: 'local', icon: 'focus', fx: 'Metal Shine', def: 0.6 },

  /* ---- Electronics ---- */
  { id: 'screenclean', name: 'Screen Clean', cat: 'Electronics', applies: ['product'], desc: 'Crisp, de-reflected display', when: 'Phones, laptops, TVs', fe: 'local', icon: 'droplet', fx: 'Screen Clean', def: 0.6 },
  { id: 'deviceshine', name: 'Device Shine', cat: 'Electronics', applies: ['product'], desc: 'Glossy premium hardware', when: 'Gadgets, tech products', fe: 'local', icon: 'sun', fx: 'Glass Gloss', def: 0.6 },
  { id: 'devicebrandnew', name: 'Device Brand New', cat: 'Electronics', applies: ['product'], desc: 'Full tech product cleanup', when: 'Used electronics', fe: 'local', icon: 'refresh', fx: 'Brand New', def: 0.6 },
  { id: 'techsharp', name: 'Tech Sharp', cat: 'Electronics', applies: ['product'], desc: 'Crisp product detail', when: 'Tech catalog shots', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },
  { id: 'techad', name: 'Tech Ad Look', cat: 'Electronics', applies: ['product'], desc: 'Premium electronics advertising', when: 'Launch campaigns', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },

  /* ---- Food & Beverage ---- */
  { id: 'foodpop', name: 'Food Appetize', cat: 'Food', applies: ['product'], desc: 'Warm, bright, mouth-watering', when: 'Food photography', fe: 'local', icon: 'sun', fx: 'Food Appetize', def: 0.6 },
  { id: 'foodvibrant', name: 'Food Vibrant', cat: 'Food', applies: ['product'], desc: 'Rich saturated ingredients', when: 'Salads, produce', fe: 'local', icon: 'droplet', fx: 'Gemstone Vibrance', def: 0.6 },
  { id: 'plateclean', name: 'Plate Clean', cat: 'Food', applies: ['product'], desc: 'Clean spots and crumbs', when: 'Food styling', fe: 'local', icon: 'refresh', fx: 'Spot Clean', def: 0.6 },
  { id: 'drinkrich', name: 'Drink Rich', cat: 'Food', applies: ['product'], desc: 'Deep beverage color', when: 'Cocktails, juice, coffee', fe: 'local', icon: 'droplet', fx: 'Liquid Rich', def: 0.6 },
  { id: 'beveragead', name: 'Beverage Ad', cat: 'Food', applies: ['product'], desc: 'Commercial drink finish', when: 'Beverage campaigns', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },
  { id: 'condensation', name: 'Condensation Pop', cat: 'Food', applies: ['product'], desc: 'Crisp cold-drink droplets', when: 'Chilled bottles, cans', fe: 'local', icon: 'sparkle', fx: 'Add Sparkle', def: 0.6 },

  /* ---- Candles, Soap & Bath ---- */
  { id: 'candleclean', name: 'Candle Clean', cat: 'Home', applies: ['product'], desc: 'Clean wax and packaging', when: 'Candles', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'soappro', name: 'Soap Pro', cat: 'Home', applies: ['product'], desc: 'Crisp clean product shot', when: 'Soap, skincare', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },
  { id: 'bathlux', name: 'Bath Luxe', cat: 'Home', applies: ['product'], desc: 'Premium spa-grade finish', when: 'Bathroom products', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'homead', name: 'Home Ad Look', cat: 'Home', applies: ['product', 'landscape'], desc: 'Commercial home-product finish', when: 'Home brand campaigns', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },

  /* ---- Cars & Automotive ---- */
  { id: 'carpaint', name: 'Car Paint Shine', cat: 'Auto', applies: ['landscape', 'product'], desc: 'Glossy showroom paint', when: 'Cars, motorcycles', fe: 'local', icon: 'sun', fx: 'Car Shine', def: 0.6 },
  { id: 'carinterior', name: 'Interior Luxe', cat: 'Auto', applies: ['landscape'], desc: 'Premium cabin finish', when: 'Car interiors', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'cardetail', name: 'Detail Sharp', cat: 'Auto', applies: ['landscape', 'product'], desc: 'Crisp bodywork detail', when: 'Car close-ups', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },
  { id: 'carbrandnew', name: 'Showroom New', cat: 'Auto', applies: ['landscape', 'product'], desc: 'Dealer-fresh cleanup', when: 'Used cars, listings', fe: 'local', icon: 'refresh', fx: 'Brand New', def: 0.6 },
  { id: 'carad', name: 'Car Ad Look', cat: 'Auto', applies: ['landscape', 'product'], desc: 'Automotive campaign grade', when: 'Car advertising', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },

  /* ---- Real Estate & Architecture ---- */
  { id: 'skypop', name: 'Sky Pop', cat: 'Real Estate', applies: ['landscape'], desc: 'Richer blue sky, warm ground', when: 'Exteriors, architecture', fe: 'local', icon: 'sun', fx: 'Sky Pop', def: 0.6 },
  { id: 'exteriorbright', name: 'Exterior Bright', cat: 'Real Estate', applies: ['landscape'], desc: 'Brighten facade', when: 'House exteriors', fe: 'local', icon: 'sun', fx: 'Room Brighten', def: 0.6 },
  { id: 'realtorlux', name: 'Listing Luxe', cat: 'Real Estate', applies: ['landscape'], desc: 'Premium listing grade', when: 'Real estate photos', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'listingsharp', name: 'Listing Sharp', cat: 'Real Estate', applies: ['landscape'], desc: 'Crisp property detail', when: 'Listing galleries', fe: 'local', icon: 'focus', fx: 'Plan Sharp', def: 0.6 },

  /* ---- Artwork & Posters ---- */
  { id: 'posterclean', name: 'Poster Clean', cat: 'Artwork', applies: ['document', 'product'], desc: 'De-haze + sharpen artwork', when: 'Posters, prints', fe: 'local', icon: 'image', fx: 'Poster Clean', def: 0.6 },
  { id: 'artvibrant', name: 'Art Vibrant', cat: 'Artwork', applies: ['document', 'product'], desc: 'Rich gallery colors', when: 'Paintings, prints', fe: 'local', icon: 'droplet', fx: 'Gemstone Vibrance', def: 0.6 },
  { id: 'canvasbright', name: 'Canvas Bright', cat: 'Artwork', applies: ['document', 'product'], desc: 'Brighten faded artwork', when: 'Old posters, canvas', fe: 'local', icon: 'sun', fx: 'Room Brighten', def: 0.6 },
  { id: 'frameshine', name: 'Frame Shine', cat: 'Artwork', applies: ['document', 'product'], desc: 'Polish frame + glass', when: 'Framed art', fe: 'local', icon: 'focus', fx: 'Glass Gloss', def: 0.6 },
  /* ---- Apparel — Shirts, Suits & Sportswear ---- */
  { id: 'shirtcrisp', name: 'Crisp Shirt', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Steam-press shirt creases', when: 'Wrinkled shirts', fe: 'local', icon: 'wind', fx: 'Smooth Fabric', def: 0.6 },
  { id: 'suitpressed', name: 'Pressed Suit', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Polished formal wear', when: 'Suits, blazers', fe: 'local', icon: 'wind', fx: 'Smooth Fabric', def: 0.7 },
  { id: 'jacketrich', name: 'Jacket Rich', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Leather/wool texture depth', when: 'Jackets, coats', fe: 'local', icon: 'layers', fx: 'Fabric Rich', def: 0.6 },
  { id: 'tieshine', name: 'Tie Shine', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Silk tie luster', when: 'Ties, bowties', fe: 'local', icon: 'wind', fx: 'Silk Sheen', def: 0.6 },
  { id: 'scarfsoft', name: 'Scarf Soft', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Soft knit/scarf texture', when: 'Scarves, knitwear', fe: 'local', icon: 'wind', fx: 'Fluff Soften', def: 0.6 },
  { id: 'hatfresh', name: 'Hat Fresh', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Clean caps and hats', when: 'Caps, beanies, fedoras', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'sportpro', name: 'Sportswear Pro', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'High-energy sport finish', when: 'Activewear, kits', fe: 'local', icon: 'sparkle', fx: 'Denim Pop', def: 0.6 },
  { id: 'swimvibrant', name: 'Swimwear Vibrant', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Rich saturated swim fabrics', when: 'Swimwear, rash guards', fe: 'local', icon: 'droplet', fx: 'Gemstone Vibrance', def: 0.6 },
  { id: 'knitsoft', name: 'Knit Soft', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Soft focus for knits', when: 'Sweaters, knits', fe: 'local', icon: 'wind', fx: 'Fluff Soften', def: 0.6 },
  { id: 'sockcrisp', name: 'Sock Crisp', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Crisp sock detail', when: 'Socks, hosiery', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },
  { id: 'patternpop', name: 'Pattern Pop', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Vivid printed fabric', when: 'Prints, plaids, logos', fe: 'local', icon: 'grid', fx: 'Pattern Pop', def: 0.6 },
  { id: 'outfiteditorial', name: 'Outfit Editorial', cat: 'Apparel', applies: ['portrait', 'product'], desc: 'Magazine-worthy outfit', when: 'Fashion spreads', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },

  /* ---- Luggage & Travel ---- */
  { id: 'lugscuff', name: 'Luggage Scratch Repair', cat: 'Travel', applies: ['product'], desc: 'Repair scuffed cases', when: 'Suitcases, hard shells', fe: 'local', icon: 'refresh', fx: 'Scratch Remover', def: 0.6 },
  { id: 'lugclean', name: 'Luggage Clean', cat: 'Travel', applies: ['product'], desc: 'Clean dust and grime', when: 'Used luggage', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },
  { id: 'lugleather', name: 'Luggage Leather', cat: 'Travel', applies: ['product'], desc: 'Premium bag leather', when: 'Leather luggage', fe: 'local', icon: 'layers', fx: 'Fabric Rich', def: 0.6 },
  { id: 'backpackpro', name: 'Backpack Pro', cat: 'Travel', applies: ['product'], desc: 'Clean structured backpack', when: 'Backpacks, duffels', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },
  { id: 'lugbrandnew', name: 'Luggage Brand New', cat: 'Travel', applies: ['product'], desc: 'Full travel cleanup', when: 'Pre-owned cases', fe: 'local', icon: 'refresh', fx: 'Brand New', def: 0.6 },

  /* ---- Accessories — Belts & Wallets ---- */
  { id: 'beltleather', name: 'Belt Leather', cat: 'Accessories', applies: ['product', 'portrait'], desc: 'Rich belt leather', when: 'Leather belts', fe: 'local', icon: 'layers', fx: 'Fabric Rich', def: 0.6 },
  { id: 'beltbuckle', name: 'Buckle Shine', cat: 'Accessories', applies: ['product', 'portrait'], desc: 'Polished metal buckle', when: 'Belts, straps', fe: 'local', icon: 'focus', fx: 'Metal Shine', def: 0.6 },
  { id: 'walletrich', name: 'Wallet Rich', cat: 'Accessories', applies: ['product'], desc: 'Premium wallet finish', when: 'Leather wallets', fe: 'local', icon: 'sparkle', fx: 'Luxury Grade', def: 0.6 },
  { id: 'walletclean', name: 'Wallet Clean', cat: 'Accessories', applies: ['product'], desc: 'Clean worn wallets', when: 'Used wallets', fe: 'local', icon: 'droplet', fx: 'Spot Clean', def: 0.6 },

  /* ---- Beauty & Makeup ---- */
  { id: 'makeuplook', name: 'Makeup Look', cat: 'Beauty', applies: ['portrait'], desc: 'Soft glam + boosted color', when: 'Beauty portraits', fe: 'local', icon: 'sparkle', fx: 'Makeup Pop', def: 0.6 },
  { id: 'lipboost', name: 'Lip Color Pop', cat: 'Beauty', applies: ['portrait'], desc: 'Rich lip color', when: 'Beauty retouch', fe: 'local', icon: 'droplet', alias: 'lipcolor' },
  { id: 'skinclear', name: 'Skincare Bottle Clear', cat: 'Beauty', applies: ['product'], desc: 'Crisp clear skincare glass', when: 'Serums, creams', fe: 'local', icon: 'droplet', fx: 'Glass Gloss', def: 0.6 },
  { id: 'serumgloss', name: 'Serum Gloss', cat: 'Beauty', applies: ['product'], desc: 'Glossy serum vials', when: 'Serum bottles', fe: 'local', icon: 'sun', fx: 'Glass Gloss', def: 0.6 },
  { id: 'creamclean', name: 'Cream Jar Clean', cat: 'Beauty', applies: ['product'], desc: 'Clean jar packaging', when: 'Moisturizers, jars', fe: 'local', icon: 'refresh', fx: 'Spot Clean', def: 0.6 },
  { id: 'beautypro', name: 'Beauty Product Pro', cat: 'Beauty', applies: ['product'], desc: 'Crisp cosmetic packaging', when: 'Cosmetic listings', fe: 'local', icon: 'focus', fx: 'Product Sharpen', def: 0.6 },

  /* ---- Documents & Editorial ---- */
  { id: 'drawingclean', name: 'Drawing Clean', cat: 'Docs', applies: ['document'], desc: 'Clean construction drawings', when: 'Blueprints, CAD', fe: 'local', icon: 'penTool', fx: 'Poster Clean', def: 0.6 },
  { id: 'receiptclear', name: 'Receipt Clear', cat: 'Docs', applies: ['document'], desc: 'Readable receipt scan', when: 'Receipts, invoices', fe: 'local', icon: 'text', fx: 'Plan Sharp', def: 0.6 },
  { id: 'invoicebright', name: 'Invoice Bright', cat: 'Docs', applies: ['document'], desc: 'Bright, crisp document', when: 'Invoices, forms', fe: 'local', icon: 'sun', fx: 'Poster Clean', def: 0.6 },
  { id: 'magcover', name: 'Magazine Cover', cat: 'Docs', applies: ['portrait', 'product', 'landscape'], desc: 'Cover-grade punch', when: 'Covers, banners', fe: 'local', icon: 'image', fx: 'Catalog Look', def: 0.6 },
  { id: 'editorialgrade', name: 'Editorial Grade', cat: 'Docs', applies: ['portrait', 'product', 'landscape'], desc: 'Editorial magazine finish', when: 'Feature images', fe: 'local', icon: 'sparkle', fx: 'Catalog Look', def: 0.65 },
  { id: 'motoshine', name: 'Motorcycle Shine', cat: 'Auto', applies: ['landscape', 'product'], desc: 'Glossy bike paint', when: 'Motorcycles, scooters', fe: 'local', icon: 'sun', fx: 'Car Shine', def: 0.6 },
]

export const ACTIONS = [...CURATED, ...GEN_ACTIONS]

export const ACTION_CATS = ['Artistic', 'Portrait', 'Color', 'Vintage', 'Texture', 'Restore', 'Creative', 'Digital', 'Motion', 'Commercial', 'Fashion', 'Luxury', 'Eyewear', 'Electronics', 'Food', 'Home', 'Auto', 'Real Estate', 'Artwork', 'Interior', 'Apparel', 'Travel', 'Accessories', 'Beauty', 'Docs']
