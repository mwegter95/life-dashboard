import { useEffect, useRef } from 'react'

/* Confetti + star burst overlay. Triggered with {x, y, heavy, t} — the `t`
   timestamp is changed by callers to re-trigger the effect even if the
   click coordinates repeat. */
export function FxCanvas({ trigger }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!trigger) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.width = window.innerWidth * dpr
    const H = canvas.height = window.innerHeight * dpr
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'

    const cx = trigger.x * dpr
    const cy = trigger.y * dpr
    const heavy = !!trigger.heavy
    const N = heavy ? 90 : 36
    const palette = ['#e6b829', '#d97757', '#67a98a', '#5a8bd1', '#c47c4d', '#f1d27a', '#2a261b']

    const parts = Array.from({ length: N }).map(() => {
      const ang = Math.random() * Math.PI * 2
      const spd = (4 + Math.random() * 6) * dpr * (heavy ? 1.4 : 1)
      return {
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 3 * dpr,
        size: (3 + Math.random() * 4) * dpr,
        color: palette[(Math.random() * palette.length) | 0],
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        life: 0,
        max: 50 + ((Math.random() * 30) | 0),
        shape: Math.random() < (heavy ? 0.5 : 0.3) ? 'star' : 'rect',
      }
    })

    let raf
    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of parts) {
        if (p.life >= p.max) continue
        alive = true
        p.vy += 0.3 * dpr
        p.vx *= 0.99
        p.x += p.vx; p.y += p.vy; p.rot += p.spin
        p.life++
        const t = p.life / p.max
        ctx.save()
        ctx.globalAlpha = 1 - t * t
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'star') {
          drawStar(ctx, 0, 0, p.size * 1.3, p.size * 0.55, 5)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8)
        }
        ctx.restore()
      }
      if (alive) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ctx && ctx.clearRect(0, 0, W, H)
    }
  }, [trigger])

  return <canvas ref={ref} className="fx-canvas" />
}

function drawStar(ctx, cx, cy, R, r, n) {
  ctx.beginPath()
  for (let i = 0; i < n * 2; i++) {
    const radius = i % 2 === 0 ? R : r
    const a = (Math.PI / n) * i - Math.PI / 2
    const x = cx + Math.cos(a) * radius
    const y = cy + Math.sin(a) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}
