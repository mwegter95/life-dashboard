/* Habit frequency model + due/streak math.
   freq is one of:
     { kind: 'daily' }
     { kind: 'weekdays', days: number[] }   // 0=Sun … 6=Sat
     { kind: 'every_n', n: number, anchor: ISO }
     { kind: 'date', date: ISO }
     { kind: 'one_off' } */

import {
  DOW_SHORT, MONTH_SHORT,
  fromISODate, addDays, toISODate, daysBetween,
} from './dates.js'

export function isDueOn(habit, dateISO) {
  const f = habit.freq
  if (!f) return false
  const d = fromISODate(dateISO)
  if (f.kind === 'daily') return true
  if (f.kind === 'weekdays') return Array.isArray(f.days) && f.days.includes(d.getDay())
  if (f.kind === 'every_n') {
    const diff = daysBetween(f.anchor || habit.created || dateISO, dateISO)
    return diff >= 0 && diff % f.n === 0
  }
  if (f.kind === 'date') return f.date === dateISO
  if (f.kind === 'one_off') return true
  return false
}

export function freqLabel(f) {
  if (!f) return ''
  if (f.kind === 'daily') return 'Every day'
  if (f.kind === 'weekdays') {
    if (f.days.length === 7) return 'Every day'
    if (f.days.length === 5 && f.days.every(d => d >= 1 && d <= 5)) return 'Weekdays'
    if (f.days.length === 2 && f.days.includes(0) && f.days.includes(6)) return 'Weekends'
    return f.days.map(d => DOW_SHORT[d]).join(' · ')
  }
  if (f.kind === 'every_n') return `Every ${f.n} days`
  if (f.kind === 'date') {
    const d = fromISODate(f.date)
    return `On ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
  }
  if (f.kind === 'one_off') return 'One-off'
  return ''
}

export function isDoneFor(habit, dateISO, completions) {
  return (completions[habit.id] || []).some(c =>
    (typeof c === 'string' ? c : c.date) === dateISO
  )
}

export function getCompletion(habit, dateISO, completions) {
  return (completions[habit.id] || []).find(c =>
    (typeof c === 'string' ? c : c.date) === dateISO
  )
}

/* Walk backward from `asOfISO`. A day breaks the streak only if the habit
   was DUE that day and NOT completed. Today (asOfISO) is a grace day —
   not-yet-completed today doesn't break the streak. */
export function computeStreak(habit, completions, asOfISO) {
  const set = new Set(
    (completions[habit.id] || []).map(c => (typeof c === 'string' ? c : c.date))
  )
  let streak = 0
  let cur = fromISODate(asOfISO)
  for (let safety = 0; safety < 365; safety++) {
    const iso = toISODate(cur)
    if (!isDueOn(habit, iso)) {
      cur = addDays(cur, -1)
      continue
    }
    if (set.has(iso)) {
      streak++
      cur = addDays(cur, -1)
    } else {
      if (iso === asOfISO) {
        cur = addDays(cur, -1)
        continue
      }
      break
    }
  }
  return streak
}
