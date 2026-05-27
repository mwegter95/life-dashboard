/**
 * Life Dashboard logo — Cleptograph 3D wordmark.
 *
 *   • Every letter is italicised (synthetic skewX = -14°) so the wordmark
 *     reads as one tilted unit. The L's stem doubles as the speedometer
 *     needle and the dial arc terminates exactly at its tip.
 *   • All glyphs render as white fill + dark stroke (with paint-order so the
 *     fill sits on top of the stroke), plus a tiny drop shadow filter — the
 *     visual style Cleptograph 3D is designed for.
 *   • Both the wide wordmark and the square tile use the same 2-row layout:
 *         row 1   speedometer + L + ife
 *         row 2   Dashboard (centred)
 *     Rows are packed close together so the mark stays compact in narrow
 *     topbars and on mobile.
 */
import React, { useId } from 'react'

const FONT_STACK = '"Cleptograph 3D", "Bungee", Impact, "Arial Black", sans-serif'
const SKEW_DEG = -14
const SKEW_RAD = (SKEW_DEG * Math.PI) / 180
const CAP_RATIO = 0.7                                 // cap-height ÷ fontSize for this font

function dialFor(fontSize) {
  const capHeight = fontSize * CAP_RATIO
  const dx = capHeight * Math.abs(Math.tan(SKEW_RAD)) // top-of-L lean (matches arc end)
  const radius = capHeight / Math.cos(SKEW_RAD)       // dial radius == needle length
  return { capHeight, dx, radius }
}

/* Italic text — fill white, stroke currentColor, drop shadow, skewed -14°.
   Same treatment used for L, "ife", and "Dashboard". */
function ItalicText({ x, y, fontSize, anchor = 'start', filterId, children }) {
  return (
    <text
      x={x} y={y}
      fontFamily={FONT_STACK}
      fontSize={fontSize}
      textAnchor={anchor}
      fill="#ffffff"
      stroke="currentColor"
      strokeWidth={fontSize * 0.045}
      strokeLinejoin="round"
      paintOrder="stroke fill"
      filter={`url(#${filterId})`}
      transform={`translate(${x} ${y}) skewX(${SKEW_DEG}) translate(${-x} ${-y})`}
    >
      {children}
    </text>
  )
}

/* Dial arc + tick marks + pivot. Arc ends at the L's tip. */
function Dial({ cx, cy, radius, dx, capHeight, tickScale = 1 }) {
  const endX = cx + dx
  const endY = cy - capHeight
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
        strokeLinecap="round" opacity="0.85"
      />
      {majors.map(deg => {
        const [x1, y1] = pt(deg, radius)
        const [x2, y2] = pt(deg, radius - radius * 0.18)
        return <line key={`maj-${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth={1.2 * tickScale}
          strokeLinecap="round" opacity="0.7" />
      })}
      {minors.map(deg => {
        const [x1, y1] = pt(deg, radius)
        const [x2, y2] = pt(deg, radius - radius * 0.09)
        return <line key={`min-${deg}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="currentColor" strokeWidth={0.7 * tickScale}
          strokeLinecap="round" opacity="0.45" />
      })}
      <circle cx={cx} cy={cy} r={radius * 0.09} fill="currentColor" />
    </g>
  )
}

function ShadowFilter({ id }) {
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="1.2" dy="1.2" stdDeviation="0.4" floodColor="rgba(0,0,0,0.45)" />
    </filter>
  )
}

/* Wide wordmark — 2-row layout, used in the topbar. */
export function Logo({ height = 44, color, className = '', title = 'Life Dashboard' }) {
  const filterId = useId().replace(/:/g, '')
  const aspect = 220 / 80
  // Row 1: dial + italic L + italic "ife"
  const FS1 = 20
  const { capHeight, dx, radius } = dialFor(FS1)
  const PIVOT_X = 24
  const ROW1_Y = 30
  const REST_X = PIVOT_X + FS1 * 1.15
  // Row 2: italic "Dashboard" — close to row 1 so the mark stays compact.
  const FS2 = 16
  const ROW2_Y = 60
  return (
    <svg
      className={`life-dashboard-logo ${className}`}
      viewBox="0 0 220 80"
      width={height * aspect}
      height={height}
      role="img"
      aria-label={title}
      style={color ? { color } : undefined}
    >
      <defs><ShadowFilter id={filterId} /></defs>
      <Dial cx={PIVOT_X} cy={ROW1_Y} radius={radius} dx={dx} capHeight={capHeight} />
      <ItalicText x={PIVOT_X} y={ROW1_Y} fontSize={FS1} filterId={filterId}>L</ItalicText>
      <ItalicText x={REST_X}  y={ROW1_Y} fontSize={FS1} filterId={filterId}>ife</ItalicText>
      <ItalicText x={110}     y={ROW2_Y} fontSize={FS2} anchor="middle" filterId={filterId}>Dashboard</ItalicText>
    </svg>
  )
}

/* Square mark — same content + style as <Logo>, packed into 80×80 for the
   app-launcher tile (used inside the app and on michaelwegter.com). */
export function LogoMark({
  size = 64,
  color,
  background,
  className = '',
  title = 'Life Dashboard',
}) {
  const filterId = useId().replace(/:/g, '')
  const FS1 = 14
  const FS2 = 8
  const { capHeight, dx, radius } = dialFor(FS1)
  const PIVOT_X = 14
  const ROW1_Y = 26
  const REST_X = PIVOT_X + FS1 * 1.15
  const ROW2_Y = 56
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
      <defs><ShadowFilter id={filterId} /></defs>
      {background && <rect x="0" y="0" width="80" height="80" rx="10" fill={background} />}
      <Dial cx={PIVOT_X} cy={ROW1_Y} radius={radius} dx={dx} capHeight={capHeight} tickScale={0.85} />
      <ItalicText x={PIVOT_X} y={ROW1_Y} fontSize={FS1} filterId={filterId}>L</ItalicText>
      <ItalicText x={REST_X}  y={ROW1_Y} fontSize={FS1} filterId={filterId}>ife</ItalicText>
      <ItalicText x={40}      y={ROW2_Y} fontSize={FS2} anchor="middle" filterId={filterId}>Dashboard</ItalicText>
    </svg>
  )
}

export default Logo
