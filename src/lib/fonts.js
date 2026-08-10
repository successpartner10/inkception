// src/lib/fonts.js
// Font catalog for the Text tool. 15 families: 12 sans-serif/display + 3
// serif. All are embedded in the offline standalone build, and loaded from
// Google Fonts on the live site.

export const FONTS = [
  { id: 'plus-jakarta', family: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', sans-serif", kind: 'Sans' },
  { id: 'raleway', family: 'Raleway', stack: "'Raleway', sans-serif", kind: 'Sans' },
  { id: 'montserrat', family: 'Montserrat', stack: "'Montserrat', sans-serif", kind: 'Sans' },
  { id: 'inter', family: 'Inter', stack: "'Inter', sans-serif", kind: 'Sans' },
  { id: 'poppins', family: 'Poppins', stack: "'Poppins', sans-serif", kind: 'Sans' },
  { id: 'open-sans', family: 'Open Sans', stack: "'Open Sans', sans-serif", kind: 'Sans' },
  { id: 'roboto', family: 'Roboto', stack: "'Roboto', sans-serif", kind: 'Sans' },
  { id: 'nunito-sans', family: 'Nunito Sans', stack: "'Nunito Sans', sans-serif", kind: 'Sans' },
  { id: 'work-sans', family: 'Work Sans', stack: "'Work Sans', sans-serif", kind: 'Sans' },
  { id: 'space-grotesk', family: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", kind: 'Sans' },
  { id: 'dm-sans', family: 'DM Sans', stack: "'DM Sans', sans-serif", kind: 'Sans' },
  { id: 'bebas-neue', family: 'Bebas Neue', stack: "'Bebas Neue', sans-serif", kind: 'Display' },
  { id: 'lora', family: 'Lora', stack: "'Lora', Georgia, serif", kind: 'Serif' },
  { id: 'playfair', family: 'Playfair Display', stack: "'Playfair Display', Georgia, serif", kind: 'Serif' },
  { id: 'merriweather', family: 'Merriweather', stack: "'Merriweather', Georgia, serif", kind: 'Serif' },
]

export const DEFAULT_FONT = 'Plus Jakarta Sans'
export const DEFAULT_FONT_SIZE = 26

// Google Fonts family list for the <link> tag.
export const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${[
  'family=Plus+Jakarta+Sans:wght@400;500;600;700;800',
  'family=Raleway:wght@600;700;800;900',
  'family=Montserrat:wght@400;500;600;700;800',
  'family=Inter:wght@400;500;600;700',
  'family=Poppins:wght@400;500;600;700',
  'family=Open+Sans:wght@400;600;700',
  'family=Roboto:wght@400;500;700',
  'family=Nunito+Sans:wght@400;600;700;800',
  'family=Work+Sans:wght@400;500;600;700',
  'family=Space+Grotesk:wght@400;500;600;700',
  'family=DM+Sans:wght@400;500;700',
  'family=Bebas+Neue',
  'family=Lora:wght@400;500;600;700',
  'family=Playfair+Display:wght@600;700;800',
  'family=Merriweather:wght@400;700',
].join('&')}&display=swap`
