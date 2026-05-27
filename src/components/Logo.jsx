/**
 * Life Dashboard logo — Cleptograph 3D wordmark with an italic-L needle.
 *
 * The actual L glyph from the Cleptograph 3D font is rendered as the needle:
 *   • `transform="skewX(-14)"` around its baseline-left anchor leans the top
 *     of the L's stem to the right, reading as an italic-needle pointing at
 *     the speedometer's upper-right.
 *   • The dial arc sweeps from 180° to ~76° (the angle of the skewed L) so
 *     the arc terminates exactly at the needle's tip — no overlap with text.
 *   • Cleptograph 3D bakes the chunky 3D extrusion into every glyph; we use
 *     it for the whole wordmark.
 *
 * The font is uppercase-only — lowercase code maps to uppercase glyphs at
 * render time, which is intentional ("Life Dashboard" reads as "LIFE
 * DASHBOARD" in the mark).
 *
 * Exports:
 *   <Logo />     — 360 × 80 wordmark, single line.
 *   <LogoMark /> — 80 × 80 tile. "L + ife" on row 1, "Dashboard" on row 2.
 */
import React from 'react'

const FONT_STACK = '"Cleptograph 3D", "Bungee", Impact, "Arial Black", sans-serif'
const SKEW_DEG = -14

/* For an italic L at fontSize fs with a skew of α°:
 *   needleLength = capHeight / cos(α)   ≈ fs · 0.7 / 0.97
 * Setting dial radius = needleLength puts the L's tip exactly on the arc.
 * arcEndDx = capHeight · tan(α);  arcEndDy = capHeight.
 */
const CAP_RATIO = 0.7                                  // capHeight / fontSize for Cleptograph
const skewRad = (SKEW_DEG * Math.PI) / 180
const TAN_SKEW = Math.tan(skewRad)                     // ≈ -0.249
const COS_SKEW = Math.cos(skewRad)                     // ≈ 0.970

function dialFor(fontSize) {
  const capHeight = fontSize * CAP_RATIO
  const dx = capHeight * Math.abs(TAN_SKEW)            // horizontal lean at top
  const radius = capHeight / COS_SKEW                  // matches needle length
  return { capHeight, dx, radius }
}

/* Renders the dial arc + tick marks + pivot disc, centred on (cx, cy).
   The arc starts at 180° (cx - r, cy) and ends where the italic-L's tip lies
   on the circle. */
function Dial({ cx, cy, radius, dx, capHeight, tickScale = 1 }) {
  // Arc terminates at the L's tip in user-space units.
  const endX = cx + dx
  const endY = cy - capHeight
  // Major/minor tick angles in the visible arc range (between 180° and the L).
  const majors = [180, 150, 120, 90]
  const minors = [170, 160, 140, 130, 110, 100, 80]
  const pt = (deg, r) => {
    const a = (Math.PI / 180) * deg
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)]
  }
  return (
    <g>
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
        fill="none" stroke="currentColor"
        strokeWidth={1.4 * tickScale}
        strokeLinecap="round" opacity="0.9"
      />
      {majors.map(deg => {
        const [x1, y1] = pt(deg, radius)
        const [x2, y2] = pt(deg, radius - radius * 0.18)
        return <line key={`maj-${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth={1.2 * tickScale}
          strokeLinecap="round" opacity="0.75" />
      })}
      {minors.map(deg => {
        const [x1, y1] = pt(deg, radius)
        const [x2, y2] = pt(deg, radius - radius * 0.09)
        return <line key={`min-${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth={0.7 * tickScale}
          strokeLinecap="round" opacity="0.5" />
      })}
      <circle cx={cx} cy={cy} r={radius * 0.09} fill="currentColor" />
    </g>
  )
}

/* The italic L — the font's L tilted to act as the speedometer needle. */
function ItalicNeedleL({ x, y, fontSize }) {
  return (
    <text
      x={x} y={y}
      fontFamily={FONT_STACK}
      fontSize={fontSize}
      fill="currentColor"
      transform={`translate(${x} ${y}) skewX(${SKEW_DEG}) translate(${-x} ${-y})`}
    >L</text>
  )
}

/* Wide wordmark — single line. */
export function Logo({ height = 26, color, className = '', title = 'Life Dashboard' }) {
  const aspect = 360 / 80
  const FS = 28                                        // tuned to fit "ife Dashboard" in 360
  const { capHeight, dx, radius } = dialFor(FS)
  const PIVOT_X = 40
  const BASELINE = 60
  // "ife" starts past the L's advance width. Cleptograph 3D is wide
  // (≈ 1.06 × fontSize per cap), then a small visual gap.
  const REST_X = PIVOT_X + FS * 1.15
  return (
    <svg
      className={`life-dashboard-logo ${className}`}
      viewBox="0 0 360 80"
      width={height * aspect}
      height={height}
      role="img"
      aria-label={title}
      style={color ? { color } : undefined}
    >
      <Dial cx={PIVOT_X} cy={BASELINE} radius={radius} dx={dx} capHeight={capHeight} />
      <ItalicNeedleL x={PIVOT_X} y={BASELINE} fontSize={FS} />
      <text x={REST_X} y={BASELINE} fontFamily={FONT_STACK} fontSize={FS} fill="currentColor">
        ife Dashboard
      </text>
    </svg>
  )
}

/* Square tile — "L + ife" on row 1, "Dashboard" centred on row 2. */
export function LogoMark({
  size = 64,
  color,
  background,
  className = '',
  title = 'Life Dashboard',
}) {
  const FS1 = 14                                       // row 1 font size
  const FS2 = 8                                        // row 2 font size — DASHBOARD fits in 80 at 8
  const { capHeight, dx, radius } = dialFor(FS1)
  const PIVOT_X = 14
  const PIVOT_Y = 30                                   // row 1 baseline; arc top at y ≈ 20
  const REST_X = PIVOT_X + FS1 * 1.15
  const ROW2_BASELINE = 66
  return (
    <svg
      className={`life-dashboard-logomark ${className}`}
      viewBox="0 0 80 80"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      style={color ? { color } : undefined}
    >
      {background && <rect x="0" y="0" width="80" height="80" rx="10" fill={background} />}
      <Dial cx={PIVOT_X} cy={PIVOT_Y} radius={radius} dx={dx} capHeight={capHeight} tickScale={0.9} />
      <ItalicNeedleL x={PIVOT_X} y={PIVOT_Y} fontSize={FS1} />
      <text x={REST_X} y={PIVOT_Y} fontFamily={FONT_STACK} fontSize={FS1} fill="currentColor">ife</text>
      <text x={40} y={ROW2_BASELINE} fontFamily={FONT_STACK} fontSize={FS2}
            textAnchor="middle" fill="currentColor">Dashboard</text>
    </svg>
  )
}

export default Logo
