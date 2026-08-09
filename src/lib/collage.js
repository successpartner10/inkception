// Collage Studio layout engine (requirements.md §9).
// 12 layouts; computeSlots returns slot rects as fractions (0..1) of the
// canvas, which the caller converts to px and cover-fits photos into.

export const COLLAGE_LAYOUTS = [
  { id: 'grid2', name: 'Grid 2', min: 2, max: 2 },
  { id: 'grid3', name: 'Grid 3', min: 3, max: 3 },
  { id: 'grid4', name: 'Grid 4', min: 4, max: 4 },
  { id: 'diptych', name: 'Diptych', min: 2, max: 2 },
  { id: 'triptych', name: 'Triptych', min: 3, max: 3 },
  { id: 'quad', name: 'Quad', min: 4, max: 4 },
  { id: 'hero', name: 'Hero + Sidekick', min: 2, max: 3 },
  { id: 'horizontal', name: 'Horizontal', min: 2, max: 6 },
  { id: 'vertical', name: 'Vertical', min: 2, max: 6 },
  { id: 'masonry', name: 'Masonry', min: 3, max: 6 },
  { id: 'overlap', name: 'Overlap', min: 2, max: 4 },
  { id: 'polaroid', name: 'Polaroid Spread', min: 2, max: 5 },
]

const GAP = 0.02

export function computeSlots(layoutId, count, W, H) {
  const one = (x, y, w, h) => ({ x, y, w, h })
  switch (layoutId) {
    case 'grid2':
    case 'diptych':
      return [one(0, 0, 0.5, 1), one(0.5, 0, 0.5, 1)]
    case 'grid3':
      return [0, 1, 2].map((i) => one(i / 3, 0, 1 / 3, 1))
    case 'grid4':
      return [
        one(0, 0, 0.5, 0.5), one(0.5, 0, 0.5, 0.5),
        one(0, 0.5, 0.5, 0.5), one(0.5, 0.5, 0.5, 0.5),
      ]
    case 'quad': {
      const m = 0.03
      const w = (1 - 3 * m) / 2
      const h = (1 - 3 * m) / 2
      return [
        one(m, m, w, h), one(2 * m + w, m, w, h),
        one(m, 2 * m + h, w, h), one(2 * m + w, 2 * m + h, w, h),
      ]
    }
    case 'triptych':
      return [0, 1, 2].map((i) => one(0, i / 3, 1, 1 / 3))
    case 'horizontal':
      return Array.from({ length: count }, (_, i) => one(i / count, 0, 1 / count, 1))
    case 'vertical':
      return Array.from({ length: count }, (_, i) => one(0, i / count, 1, 1 / count))
    case 'hero':
      if (count === 2) return [one(0, 0, 0.64, 1), one(0.66, 0.08, 0.32, 0.84)]
      return [one(0, 0, 0.64, 1), one(0.66, 0, 0.32, 0.5), one(0.66, 0.52, 0.32, 0.48)]
    case 'masonry': {
      const slots = []
      let cy = [0, 0]
      const colW = 0.5
      for (let i = 0; i < count; i++) {
        const col = i % 2
        const h = col === 0 ? 0.48 : 0.6
        slots.push(one(col * 0.5, cy[col], colW, h))
        cy[col] += h + GAP
      }
      return slots
    }
    case 'overlap': {
      const s = 0.62
      const base = one((1 - s) / 2, (1 - s) / 2, s, s)
      return Array.from({ length: count }, (_, i) => {
        if (i === 0) return base
        const off = (i % 2 === 0 ? 1 : -1) * 0.06 * i
        return one(base.x + off, base.y + off * 0.6, s, s)
      })
    }
    case 'polaroid': {
      const s = 0.42
      return Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0.5 : i / (count - 1)
        return one(0.08 + t * (1 - s - 0.16), 0.12 + t * (1 - s - 0.24), s, s)
      })
    }
    default:
      return []
  }
}
