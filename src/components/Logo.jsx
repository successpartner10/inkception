// Inkception brand wordmark.
// Text-only: no logo square/monogram. All-caps "INKCEPTION" set in Raleway
// (per brand direction), rendered as HTML text for crispness at any size.

import { cn } from '../lib/utils'

const SIZES = {
  sm: 'text-[13px] tracking-[0.12em]',
  md: 'text-base tracking-[0.14em]',
  lg: 'text-3xl tracking-[0.18em]',
}

export function Logo({ size = 'sm', className, color = 'text-white' }) {
  return (
    <span
      className={cn(
        'font-display select-none font-extrabold uppercase leading-none',
        color,
        SIZES[size],
        className,
      )}
    >
      Inkception
    </span>
  )
}
