/**
 * Life Dashboard logo — speedometer-with-italic-L wordmark.
 *
 * The "L" of "Life Dashboard" is hand-drawn so the vertical stroke tapers
 * like a real speedometer needle (wide at the pivot, point at the tip).
 * It's italicised about ~15° so the needle points into the upper-right of
 * the dial — the "80 mph" arc. The remaining "ife Dashboard" is rendered
 * in matching italic Instrument Serif so the whole mark reads as one word.
 *
 * Two exports:
 *   <Logo />     — full wordmark (dial + needle-L + "ife Dashboard")
 *   <LogoMark /> — square icon (dial + needle-L only) for app launchers
 *
 * Both honour `currentColor` so they retint with the theme `--ink`.
 */
import React from 'react'

/* Shared geometry: dial pivot at (40, 62), outer radius 30.
   Tick angles measured CCW from positive-X (right):
     0° = far-right (= max mph), 180° = far-left (= 0 mph).
   The needle-L points at ~75° from horizontal — visually the "80" arc. */
const DIAL_CX = 40
const DIAL_CY = 62
const DIAL_R = 30
const DIAL_R_INNER = 24

function pointOnArc(angleDeg, radius) {
  const a = (Math.PI / 180) * angleDeg
  return [DIAL_CX + radius * Math.cos(a), DIAL_CY - radius * Math.sin(a)]
}

const MAJOR_TICKS = [0, 30, 60, 90, 120, 150, 180]
const MINOR_TICKS = [10, 20, 40, 50, 70, 80, 100, 110, 130, 140, 160, 170]

// Shared dial + needle-L group. Rendered with `currentColor` for theming.
function DialAndNeedleL() {
  return (
    <g>
      {/* Outer arc (the dial face) */}
      <path
        d={`M ${DIAL_CX - DIAL_R} ${DIAL_CY} A ${DIAL_R} ${DIAL_R} 0 0 1 ${DIAL_CX + DIAL_R} ${DIAL_CY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Inner subtle arc for depth */}
      <path
        d={`M ${DIAL_CX - DIAL_R_INNER} ${DIAL_CY} A ${DIAL_R_INNER} ${DIAL_R_INNER} 0 0 1 ${DIAL_CX + DIAL_R_INNER} ${DIAL_CY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.35"
      />

      {/* Major ticks */}
      {MAJOR_TICKS.map(deg => {
        const [x1, y1] = pointOnArc(deg, DIAL_R)
        const [x2, y2] = pointOnArc(deg, DIAL_R - 5)
        return (
          <line
            key={`maj-${deg}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.7"
          />
        )
      })}

      {/* Minor ticks */}
      {MINOR_TICKS.map(deg => {
        const [x1, y1] = pointOnArc(deg, DIAL_R)
        const [x2, y2] = pointOnArc(deg, DIAL_R - 2.5)
        return (
          <line
            key={`min-${deg}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.45"
          />
        )
      })}

      {/* "80" callout near where the needle-L points */}
      <text
        x={DIAL_CX + 21}
        y={DIAL_CY - 22}
        fontFamily='"Geist Mono", ui-monospace, monospace'
        fontSize="6.5"
        fontWeight="600"
        fill="currentColor"
        textAnchor="middle"
        opacity="0.85"
      >80</text>

      {/* The needle-L — drawn as a single filled path.
          Foot: thin horizontal bar from the pivot extending right.
          Stem: needle-tapered shape from pivot up to a point, slanted
                ~16° to read as italic and point at the "80" arc.
          Pivot is at (40, 62); stem top is at (~52, 28). */}
      <g fill="currentColor">
        {/* L's foot — has a subtle italic skew to match the wordmark */}
        <path d="M 40 62 L 62 62 L 62 65 L 43.2 65 Z" />
        {/* L's stem — needle-tapered, ~16° italic slant */}
        <path d="
          M 40 62
          L 44 62
          L 53.2 30
          L 52.4 28
          L 51.6 28
          L 50.8 30
          Z" />
        {/* Pivot disc — caps the bottom of the needle */}
        <circle cx={DIAL_CX} cy={DIAL_CY} r="2.6" />
        {/* Tiny inner highlight on the pivot */}
        <circle cx={DIAL_CX - 0.6} cy={DIAL_CY - 0.6} r="0.9" fill="var(--bg, #fff)" opacity="0.75" />
      </g>
    </g>
  )
}

/* Wordmark: dial + needle-L + "ife Dashboard".
   ViewBox is 360×80 (height × ~4.5 aspect). */
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
      {/* "ife Dashboard" — italic Instrument Serif, matches the L's slant */}
      <text
        x="68"
        y="62"
        fontFamily='"Instrument Serif", Georgia, serif'
        fontStyle="italic"
        fontSize="48"
        fontWeight="400"
        letterSpacing="-0.01em"
        fill="currentColor"
      >ife Dashboard</text>
    </svg>
  )
}

/* Square mark for app launchers / favicon-like uses. Just the dial + L.
   Optional rounded background tile via `background` prop. */
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
        <rect x="0" y="0" width="80" height="80" rx="14" fill={background} />
      )}
      <DialAndNeedleL />
    </svg>
  )
}

export default Logo
