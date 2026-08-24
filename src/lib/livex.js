// src/lib/livex.js
// Live FX — a tiny deterministic particle engine for "alive" images:
// fireworks, sparkles, confetti, rain, snow, fireflies, light leak.
//
// Honest constraints by design:
//  • Deterministic: fxState(seed) + stepFrame(state, n) reproduce the exact
//    same visuals for export — what you see on screen is what exports.
//  • Pure canvas 2D — no WebGL, works everywhere including mobile Safari.
//  • Zero AI, zero network, zero cost. Runs at 60fps for thousands of
//    particles.

/* ---------------------------------- state --------------------------------- */

export const FX_KINDS = [
  { id: 'fireworks', label: 'Fireworks', desc: 'Bursts that explode and fall — great over night skies' },
  { id: 'sparkles', label: 'Sparkles', desc: 'Twinkling glints — magic/product shots' },
  { id: 'confetti', label: 'Confetti', desc: 'Celebration falls — sales & birthdays' },
  { id: 'rain', label: 'Rain', desc: 'Streaks falling with depth' },
  { id: 'snow', label: 'Snow', desc: 'Soft drifting flakes' },
  { id: 'fireflies', label: 'Fireflies', desc: 'Warm floating lights — cozy evening mood' },
  { id: 'leak', label: 'Light Leak', desc: 'Anamorphic light sweep across the frame' },
]

export function fxState(kind, { density = 1, speed = 1, seed = 7 } = {}) {
  let s = seed >>> 0 || 1
  const rnd = () => {
    // xorshift32 — deterministic "random"
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
  const st = { kind, density, speed, t: 0, rnd, parts: [], bursts: [], leaks: [] }
  seedParts(st, 1, 1) // unit space; scaled at draw time by w/h
  return st
}

function seedParts(st) {
  const { kind, rnd } = st
  st.parts = []
  const counts = {
    sparkles: 90, confetti: 80, rain: 160, snow: 120, fireflies: 40,
    fireworks: 0, leak: 0,
  }
  const n = Math.round((counts[kind] || 60) * st.density)
  for (let i = 0; i < n; i++) {
    st.parts.push({
      x: rnd(), y: rnd(),
      vx: (rnd() - 0.5) * 0.02,
      vy: rnd() * 0.02 + 0.004,
      r: rnd() * 0.012 + 0.003,
      p: rnd() * Math.PI * 2, // phase
      sp: rnd() * 0.6 + 0.7, // speed multiplier
      hue: rnd(),
    })
  }
}

/** Advance the simulation by n frames (n can be fractional). */
export function fxStep(st, n = 1) {
  st.t += n
  const { kind } = st
  if (kind === 'fireworks') {
    // spawn bursts over time
    while (st.bursts.length < 3 * st.density && rnd01(st) < 0.12) {
      st.bursts.push({
        x: 0.12 + st.rnd() * 0.76,
        y: 0.08 + st.rnd() * 0.4,
        age: 0,
        n: Math.round(42 + st.rnd() * 30),
        parts: null,
        hue: st.rnd(),
      })
    }
    for (const b of st.bursts) {
      if (!b.parts) {
        b.parts = []
        const an = (Math.PI * 2) / b.n
        for (let i = 0; i < b.n; i++) {
          const a = i * an + st.rnd() * 0.12
          const v = (0.35 + st.rnd() * 0.5) * 0.02
          b.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 })
        }
      }
      for (const p of b.parts) {
        p.x += p.vx * n * st.speed
        p.y += p.vy * n * st.speed
        p.vy += 0.00035 * n
        p.vx *= 0.995
        p.life -= 0.008 * n * st.speed
      }
      b.age += n
    }
    st.bursts = st.bursts.filter((b) => b.age < 190 && b.parts.some((p) => p.life > 0))
  } else if (kind === 'leak') {
    // continuous
  } else {
    for (const p of st.parts) {
      p.p += 0.05 * n * st.speed * p.sp
      if (kind === 'rain') {
        p.y += (p.vy * 2.2) * n * st.speed
        p.x += 0.002 * n
      } else if (kind === 'snow') {
        p.y += p.vy * 0.45 * n * st.speed
        p.x += Math.sin(p.p) * 0.0016 * n
      } else if (kind === 'confetti') {
        p.y += p.vy * 0.6 * n * st.speed
        p.x += Math.sin(p.p * 0.6) * 0.0022 * n
      } else if (kind === 'fireflies') {
        p.x += Math.cos(p.p * 0.4) * 0.0016 * n * st.speed
        p.y += Math.sin(p.p * 0.31) * 0.0013 * n * st.speed
      } else if (kind === 'sparkles') {
        // static positions, twinkle via phase
      }
      if (p.y > 1.05) { p.y = -0.05; p.x = st.rnd() }
      if (p.x > 1.05) p.x = -0.05
      if (p.x < -0.05) p.x = 1.05
    }
  }
}

function rnd01(st) { return st.rnd() }

/** Draw the current state onto a 2d ctx of size w×h. */
export function fxDraw(st, ctx, w, h) {
  const { kind } = st
  ctx.save()
  ctx.clearRect(0, 0, w, h)
  if (kind === 'fireworks') {
    ctx.globalCompositeOperation = 'lighter'
    for (const b of st.bursts) {
      for (const p of b.parts) {
        if (p.life <= 0) continue
        const a = Math.min(1, p.life)
        const r = Math.max(1, (w * 0.0042) * (0.6 + p.life))
        const hue = 40 + b.hue * 280
        ctx.fillStyle = `hsla(${hue}, 95%, ${62 + a * 20}%, ${a})`
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (kind === 'leak') {
    const t = (st.t * 0.006 * st.speed) % 1.6
    const x = (-0.35 + t) * w * 1.3
    const g = ctx.createLinearGradient(x - w * 0.35, 0, x + w * 0.35, h * 0.4)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.45, 'rgba(255,246,214,0.16)')
    g.addColorStop(0.55, 'rgba(255,255,255,0.30)')
    g.addColorStop(0.6, 'rgba(255,214,160,0.18)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // soft band
    const g2 = ctx.createLinearGradient(0, h * 0.2, 0, h)
    g2.addColorStop(0, 'rgba(255,180,120,0.05)')
    g2.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.globalCompositeOperation = 'lighter'
    for (const p of st.parts) {
      const x = p.x * w
      const y = p.y * h
      if (kind === 'rain') {
        const len = h * 0.035 * (0.5 + p.r * 40)
        ctx.strokeStyle = `rgba(200,220,255,${0.10 + p.r * 6})`
        ctx.lineWidth = Math.max(0.8, w * 0.0012)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - w * 0.002, y + len)
        ctx.stroke()
      } else if (kind === 'snow') {
        ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(p.p) * 0.3})`
        ctx.beginPath()
        ctx.arc(x, y, Math.max(1, w * p.r * 0.5), 0, Math.PI * 2)
        ctx.fill()
      } else if (kind === 'confetti') {
        ctx.globalCompositeOperation = 'source-over'
        const cw = Math.max(2, w * 0.006)
        const ch = Math.max(1, w * 0.003)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(p.p)
        const shades = ['#ffffff', '#dfe6ee', '#c9c9c9', '#f3e9d2', '#9fb4c7']
        ctx.fillStyle = shades[Math.floor(p.hue * shades.length) % shades.length]
        ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
        ctx.restore()
        ctx.globalCompositeOperation = 'lighter'
      } else if (kind === 'fireflies') {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(p.p * 2))
        const r = Math.max(1.5, w * 0.004)
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
        g.addColorStop(0, `rgba(255,238,170,${0.85 * tw})`)
        g.addColorStop(0.4, `rgba(255,220,120,${0.35 * tw})`)
        g.addColorStop(1, 'rgba(255,220,120,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, r * 3, 0, Math.PI * 2)
        ctx.fill()
      } else if (kind === 'sparkles') {
        const tw = Math.max(0, Math.sin(p.p))
        if (tw < 0.05) continue
        const r = Math.max(1, w * p.r * 0.8) * tw
        ctx.strokeStyle = `rgba(255,255,255,${0.85 * tw})`
        ctx.lineWidth = Math.max(0.7, w * 0.0008)
        ctx.beginPath()
        ctx.moveTo(x - r * 2.2, y); ctx.lineTo(x + r * 2.2, y)
        ctx.moveTo(x, y - r * 2.2); ctx.lineTo(x, y + r * 2.2)
        ctx.stroke()
        ctx.fillStyle = `rgba(255,255,255,${tw})`
        ctx.beginPath()
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.restore()
}
