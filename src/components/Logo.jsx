/**
 * Life Dashboard logo — speedometer + needle-L + retro blocky wordmark.
 *
 *   • There is ONE L in the entire mark — the L of "Life Dashboard".
 *     Its tall vertical stroke IS the speedometer needle. The L's foot is
 *     a short horizontal at the dial's pivot height, and "ife Dashboard"
 *     continues right of it on the same baseline.
 *   • The dial arc sweeps CCW from 180° to ~71° and stops exactly where the
 *     needle-stem crosses it — so the arc never overlaps the wordmark text.
 *   • The "ife Dashboard" text uses Bungee (loaded via Google Fonts) which
 *     gives the heavy, retro-blocky character of the reference font. A
 *     three-layer depth-shadow stack behind the front face reads as a clean
 *     3D extrusion (perspective "into the page").
 *
 * Two exports:
 *   <Logo />     — wide wordmark for the topbar (360 × 80).
 *   <LogoMark /> — square app-tile (80 × 80). Same geometry, but "ife" sits
 *                  on the L's baseline and "Dashboard" wraps to a second
 *                  line, so the FULL wordmark fits inside the square.
 */
import React from 'react'

const DIAL_CX = 40
const DIAL_CY = 62
const DIAL_R  = 30

/* Where the L's stem crosses the dial circle (angle ≈ 71° from +x, y inverted). */
const ARC_END_X = DIAL_CX + 9.7   // 30 · cos(71°)
const ARC_END_Y = DIAL_CY - 28.4  // 30 · sin(71°)

const MAJOR_TICKS = [180, 150, 120, 90]
const MINOR_TICKS = [170, 160, 140, 130, 110, 100, 80]

function pointOnArc(angleDeg, radius) {
  const a = (Math.PI / 180) * angleDeg
  return [DIAL_CX + radius * Math.cos(a), DIAL_CY - radius * Math.sin(a)]
}

/* Speedometer dial + the letter L — where L's stem doubles as the needle.
   Geometry is in the source units of the wordmark viewBox; consumers wrap
   this in a <g transform="…"> to scale / translate it. */
function DialAndNeedleL() {
  return (
    <g>
      {/* Arc — stops at the needle. */}
      <path
        d={`M ${DIAL_CX - DIAL_R} ${DIAL_CY} A ${DIAL_R} ${DIAL_R} 0 0 1 ${ARC_END_X} ${ARC_END_Y}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />

      {MAJOR_TICKS.map(deg => {
        const [x1, y1] = pointOnArc(deg, DIAL_R)
        const [x2, y2] = pointOnArc(deg, DIAL_R - 5)
        return (
          <line key={`maj-${deg}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" opacity="0.75" />
        )
      })}

      {MINOR_TICKS.map(deg => {
        const [x1, y1] = pointOnArc(deg, DIAL_R)
        const [x2, y2] = pointOnArc(deg, DIAL_R - 2.5)
        return (
          <line key={`min-${deg}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor" strokeWidth="0.8"
            strokeLinecap="round" opacity="0.5" />
        )
      })}

      {/* The letter L — foot + needle-stem. The stem rises from the pivot
          to (~52, 28) at ~71° and is tapered, so it reads as a needle while
          remaining the recognisable vertical of an L. */}
      <g fill="currentColor">
        <path d="M 40 62 L 62 62 L 62 65 L 43.2 65 Z" />
        <path d="M 40 62 L 44 62 L 53.2 30 L 52.4 28 L 51.6 28 L 50.8 30 Z" />
        <circle cx={DIAL_CX} cy={DIAL_CY} r="2.6" />
      </g>
    </g>
  )
}

/* Block-text renderer: front face on top, three darker offset clones behind
   it. The offset is +1/+2/+3 down-and-right → reads as extrusion into the
   page. Letter-spacing slightly negative tightens the line so the depth
   shadows of adjacent letters don't visually merge. */
function BlockyText({ x, y, fontSize, children, anchor = 'start', shadow = 'rgba(0,0,0,0.55)' }) {
  const common = {
    fontFamily: '"Bungee", Impact, "Arial Black", sans-serif',
    fontWeight: 400, // Bungee ships at 400; weight does nothing for it
    fontSize,
    letterSpacing: '-0.01em',
    textAnchor: anchor,
  }
  return (
    <g>
      <text x={x + 3} y={y + 3} fill={shadow} opacity="0.55" {...common}>{children}</text>
      <text x={x + 2} y={y + 2} fill={shadow} opacity="0.75" {...common}>{children}</text>
      <text x={x + 1} y={y + 1} fill={shadow} opacity="0.90" {...common}>{children}</text>
      <text x={x}     y={y}     fill="currentColor"          {...common}>{children}</text>
    </g>
  )
}

/* Wordmark: dial + L + "ife Dashboard". L IS the needle. */
export function Logo({ height = 26, color, className = '', title = 'Life Dashboard' }) {
  const aspect = 360 / 80
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
      <DialAndNeedleL />
      <BlockyText x={70} y={64} fontSize={34}>ife Dashboard</BlockyText>
    </svg>
  )
}

/* Square mark — holds the FULL wordmark by wrapping after "ife".
   Layout:
     row 1 (y=46 baseline): [dial+L]  ife
     row 2 (y=70 baseline): Dashboard
   The dial is scaled 0.6 and translated so the L's foot sits on row 1's
   baseline. "ife" continues right of the L's foot. "Dashboard" wraps and
   is centred horizontally on row 2. */
export function LogoMark({
  size = 64,
  color,
  background,
  className = '',
  title = 'Life Dashboard',
}) {
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
      {background && (
        <rect x="0" y="0" width="80" height="80" rx="10" fill={background} />
      )}

      {/* Scale-0.6 places pivot at (24, 37.2), arc ends at (29.8, 17), foot ends at (37.2, 37.2). */}
      <g transform="translate(0, 9) scale(0.6)">
        <DialAndNeedleL />
      </g>

      {/* "ife" — right of the L's foot, sharing its baseline (y≈46.2). */}
      <BlockyText x={39} y={46} fontSize={11}>ife</BlockyText>
      {/* "Dashboard" — second line, centred under the whole mark. */}
      <BlockyText x={40} y={70} fontSize={11} anchor="middle">Dashboard</BlockyText>
    </svg>
  )
}

export default Logo
