import { computeStreak } from './frequency.js'

let pass = 0, fail = 0
const comp = (id, dates) => ({ [id]: dates.map(d => ({ date: d, scored: 1, bonus: false })) })
function eq(label, got, want) {
  if (got === want) { pass++; console.log(`  ok  ${label} => ${got}`) }
  else { fail++; console.log(`  XX  ${label} => got ${got}, want ${want}`) }
}

// ── daily ──
const daily = { id: 'd', freq: { kind: 'daily' }, created: '2026-01-01', points: 1 }
console.log('daily:')
eq('3 consecutive ending today', computeStreak(daily, comp('d', ['2026-06-08','2026-06-09','2026-06-10']), '2026-06-10'), 3)
eq('today grace (done thru yesterday)', computeStreak(daily, comp('d', ['2026-06-08','2026-06-09']), '2026-06-10'), 2)
eq('gap breaks', computeStreak(daily, comp('d', ['2026-06-08','2026-06-10']), '2026-06-10'), 1)
eq('never done', computeStreak(daily, {}, '2026-06-10'), 0)

// ── weekly (single weekday) ── derive the weekday of asOf so we hit real due days
const asOf = '2026-06-14'
const dow = new Date(asOf + 'T00:00:00').getDay()
const weekly = { id: 'w', freq: { kind: 'weekdays', days: [dow] }, created: '2026-01-01', points: 1 }
const wk = (k) => { const d = new Date(asOf + 'T00:00:00'); d.setDate(d.getDate() - 7 * k); return d.toISOString().slice(0,10) }
console.log('weekly (every', asOf, 'weekday):')
eq('3 consecutive weeks', computeStreak(weekly, comp('w', [wk(0), wk(1), wk(2)]), asOf), 3)
eq('missed a week breaks', computeStreak(weekly, comp('w', [wk(0), wk(2)]), asOf), 1)
eq('done any day in the week counts', computeStreak(weekly, comp('w', [ // wk(0) replaced by a mid-week day
  new Date(new Date(asOf+'T00:00:00').getTime() - 2*864e5).toISOString().slice(0,10), wk(1)]), asOf), 2)

// ── every_n ──
const everyN = { id: 'n', freq: { kind: 'every_n', n: 3, anchor: '2026-06-01' }, created: '2026-06-01', points: 1 }
console.log('every 3 days (anchor 2026-06-01):')
eq('3 consecutive periods', computeStreak(everyN, comp('n', ['2026-06-04','2026-06-07','2026-06-10']), '2026-06-10'), 3)
eq('gap breaks', computeStreak(everyN, comp('n', ['2026-06-04','2026-06-10']), '2026-06-10'), 1)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
