import { loadImageElement } from './utils'
import { cssFilterString } from './filters'

/** Render the current image + filter stack into an offscreen canvas at a target size (cover-crop). */
export async function renderExport(src, { w, h, filterString }) {
  const img = await loadImageElement(src)
  const cv = document.createElement('canvas')
  cv.width = Math.round(w)
  cv.height = Math.round(h)
  const ctx = cv.getContext('2d')
  if (filterString) {
    try {
      ctx.filter = filterString
    } catch {
      /* filter unsupported — render unfiltered */
    }
  }
  const s = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight)
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  ctx.drawImage(img, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh)
  try {
    ctx.filter = 'none'
  } catch {
    /* noop */
  }
  return cv.toDataURL('image/png')
}

/** Platform export matrix — the complete size reference.
 *  "Use these only for export/download." All dimensions exact, cover-cropped. */
export const EXPORT_PRESETS = [
  // Web
  { id: 'web-hero', platform: 'Web', name: 'Website Hero Banner', w: 1920, h: 800, ratio: '2.4:1', use: 'Homepage banner' },
  { id: 'web-collection', platform: 'Web', name: 'Website Collection Banner', w: 1600, h: 600, ratio: '2.7:1', use: 'Category headers' },

  // Instagram
  { id: 'ig-square', platform: 'Instagram', name: 'Feed Square', w: 1080, h: 1080, ratio: '1:1', use: 'Feed posts, product images' },
  { id: 'ig-portrait', platform: 'Instagram', name: 'Feed Portrait', w: 1080, h: 1350, ratio: '4:5', use: 'Portrait feed posts' },
  { id: 'ig-story', platform: 'Instagram', name: 'Story / Reel', w: 1080, h: 1920, ratio: '9:16', use: 'Stories, reels, vertical video' },

  // WhatsApp
  { id: 'wa-status', platform: 'WhatsApp', name: 'Business Status', w: 1080, h: 1920, ratio: '9:16', use: 'Daily offers, stories, launches' },
  { id: 'wa-catalog', platform: 'WhatsApp', name: 'Catalog Product Image', w: 800, h: 800, ratio: '1:1', use: 'Product listings' },
  { id: 'wa-profile', platform: 'WhatsApp', name: 'Profile Photo', w: 640, h: 640, ratio: '1:1', use: 'Business logo' },

  // Google Business
  { id: 'gb-post', platform: 'Google Business', name: 'Profile Post', w: 1200, h: 900, ratio: '4:3', use: 'Offers & updates' },
  { id: 'gb-product', platform: 'Google Business', name: 'Product Image', w: 1200, h: 900, ratio: '4:3', use: 'Product listings' },
  { id: 'gb-cover', platform: 'Google Business', name: 'Cover Photo', w: 1024, h: 576, ratio: '16:9', use: 'Main business image' },

  // Facebook
  { id: 'fb-feed', platform: 'Facebook', name: 'Feed Post', w: 1080, h: 1350, ratio: '4:5', use: 'Promotions' },
  { id: 'fb-square', platform: 'Facebook', name: 'Square Post', w: 1080, h: 1080, ratio: '1:1', use: 'Product images' },
  { id: 'fb-story', platform: 'Facebook', name: 'Story', w: 1080, h: 1920, ratio: '9:16', use: 'Stories' },
  { id: 'fb-cover', platform: 'Facebook', name: 'Cover Banner', w: 1640, h: 720, ratio: '2.3:1', use: 'Business page header' },
  { id: 'fb-event', platform: 'Facebook', name: 'Event Cover', w: 1920, h: 1005, ratio: '1.91:1', use: 'Events' },
  { id: 'fb-group', platform: 'Facebook', name: 'Group Cover', w: 1640, h: 856, ratio: '1.91:1', use: 'Community pages' },

  // Pinterest
  { id: 'pin-standard', platform: 'Pinterest', name: 'Standard Pin', w: 1000, h: 1500, ratio: '2:3', use: 'Best-performing pins' },
  { id: 'pin-long', platform: 'Pinterest', name: 'Long Pin', w: 1000, h: 2100, ratio: '1:2.1', use: 'Tutorials, infographics' },
  { id: 'pin-board', platform: 'Pinterest', name: 'Board Cover', w: 1000, h: 1000, ratio: '1:1', use: 'Board branding' },
  { id: 'pin-idea', platform: 'Pinterest', name: 'Idea Pin', w: 1080, h: 1920, ratio: '9:16', use: 'Multi-page stories' },

  // YouTube
  { id: 'yt-thumb', platform: 'YouTube', name: 'Thumbnail', w: 1280, h: 720, ratio: '16:9', use: 'Video thumbnails' },
  { id: 'yt-shorts', platform: 'YouTube', name: 'Shorts', w: 1080, h: 1920, ratio: '9:16', use: 'Shorts' },
  { id: 'yt-banner', platform: 'YouTube', name: 'Banner (Channel Art)', w: 2560, h: 1440, ratio: '16:9', use: 'Channel header' },
  { id: 'yt-post', platform: 'YouTube', name: 'Community Post', w: 1080, h: 1080, ratio: '1:1', use: 'Community updates' },

  // Email
  { id: 'em-news', platform: 'Email', name: 'Newsletter Header', w: 1200, h: 600, ratio: '2:1', use: 'Mailchimp, Klaviyo' },
  { id: 'em-hero', platform: 'Email', name: 'Hero Banner', w: 1200, h: 800, ratio: '3:2', use: 'Promotional emails' },
]

export const EXPORT_GROUPS = ['Web', 'WhatsApp', 'Google Business', 'Facebook', 'Pinterest', 'YouTube', 'Email']

export const PLATFORM_ICONS = {
  Web: 'globe',
  WhatsApp: 'message',
  'Google Business': 'store',
  Facebook: 'users',
  Pinterest: 'pin',
  YouTube: 'play',
  Email: 'mail',
}
