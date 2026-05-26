/* Timezone-naive ISO-day date utilities, ported from the prototype.
   All dates flow as "yyyy-mm-dd" strings — habits live in day buckets. */

export const DOW_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DOW_INITIAL = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function daysBetween(a, b) {
  const ms = fromISODate(b) - fromISODate(a)
  return Math.round(ms / 86400000)
}

// Monday-start week by default.
export function startOfWeek(d, startMon = true) {
  const x = new Date(d)
  const dow = x.getDay()
  const offset = startMon ? (dow + 6) % 7 : dow
  x.setDate(x.getDate() - offset)
  return x
}

export function fmtWeekRange(iso) {
  const s = fromISODate(iso)
  const e = addDays(s, 6)
  return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} — ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}`
}

export function fmtDateStr(d) {
  return `${DOW_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}
