// src/lib/goals.js
// "What do you want to do today?" — the six first-step goals shown in the
// persistent GoalMenu dropdown. Each goal runs an action on the screen that
// renders it (open a file, open Templates, open Export…) and carries a short
// "here's how" so the dropdown shows what is possible.
export const GOALS = [
  {
    id: 'edit',
    icon: 'image',
    title: 'Edit a photo',
    desc: 'Open an image and fix it up',
    action: 'open',
    steps: ['Open / Add Media → pick a photo', 'Run one-click Actions from the Actions tab', 'Type in the search bar: "thinner", "steel", "remove background"…'],
  },
  {
    id: 'fix',
    icon: 'sparkle',
    title: 'Fix / clean an image',
    desc: 'Auto Enhance, Remove BG, retouch, denoise',
    action: 'fix',
    steps: ['Open your photo', 'Use the Quick Pick: Auto Enhance, Remove BG, Denoise…', 'Or search "enhance", "remove background", "denoise"'],
  },
  {
    id: 'collage',
    icon: 'grid',
    title: 'Make a collage',
    desc: 'Grid layouts or copy a reference',
    action: 'collage',
    steps: ['Start from a Template → pick a collage layout', 'Or upload a reference image to copy its layout', 'Add photos → Build Collage → click any photo to Replace/Remove'],
  },
  {
    id: 'template',
    icon: 'shape',
    title: 'Create a template',
    desc: 'Platform size or a custom layout',
    action: 'template',
    steps: ['Start from a Template → platform sizes', 'Add your own size: Export → ＋ Add size', 'Or save a collage layout from a reference image'],
  },
  {
    id: 'export',
    icon: 'export',
    title: 'Export for a platform',
    desc: 'Instagram, YouTube, custom sizes…',
    action: 'export',
    steps: ['Open a template or photo', 'Press ⌘/Ctrl+E or click Export', 'Check the sizes you need → download files or a .zip'],
  },
  {
    id: 'restore',
    icon: 'clock',
    title: 'Restore an old photo',
    desc: 'Creases, scratches, faded tone',
    action: 'restore',
    steps: ['Open the old photo', 'Search "restore" or "old photo" in the search bar', 'Run Restore Old Photo, Repair Creases, Dust & Scratches'],
  },
]
