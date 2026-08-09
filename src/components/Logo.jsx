// Inkception brand — monogram + wordmark lockup.
// Geometry sourced verbatim from the official brand assets
// (public/brand/monogram.svg + public/brand/logo.svg).
//
// <Monogram/> renders the ik mark as a single inline SVG.
// <Logo/> is the horizontal lockup: monogram + INKCEPTION wordmark
// (HTML text for crispness, tracking -0.05em per brand).

import { cn } from '../lib/utils'

export function Monogram({ size = 28, bg = '#ffffff', fg = '#000000', className, style }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      style={style}
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="100" fill={bg} />
      <g
        transform="translate(130 130)"
        fill="none"
        stroke={fg}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="30" cy="10" r="10" fill={fg} stroke="none" />
        <path d="M20 30V110C20 121.046 28.9543 130 40 130H60C71.0457 130 80 121.046 80 110V30" />
        <path d="M80 60L140 120" />
        <path d="M80 90L140 30" />
      </g>
    </svg>
  )
}

export function Logo({ size = 26, bg = '#ffffff', fg = '#000000', className }) {
  return (
    <div className={cn('flex shrink-0 items-center gap-2.5', className)}>
      <Monogram size={size} bg={bg} fg={fg} />
      <span
        className="text-sm font-bold uppercase leading-none text-white"
        style={{ letterSpacing: '-0.05em' }}
      >
        Inkception
      </span>
    </div>
  )
}
