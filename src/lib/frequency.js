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

/* ── One-time tasks & retirement ─────────────────────────────────────────────
   A one-time task — a one-off, a task pinned to a single date, or an AI
   calendar reminder — is finished for good once it's checked off. Leaving it in
   the grid afterwards just gums up the week, so it *retires*: starting the day
   after its last completion it stops being due, selectable or starrable
   anywhere in the app. It keeps its completions, so every point it earned still
   counts toward the day, the week, the total and the badges.

   Retirement is derived from the completions rather than stored on the habit.
   Two things fall out of that: it applies retroactively to anything completed
   in the past (no migration), and un-starring a task brings it straight back. */

const ONE_TIME_KINDS = new Set(['one_off', 'date'])

export function isOneTime(habit) {
  return !!habit && (habit.source === 'gcal-ai' || ONE_TIME_KINDS.has(habit.freq?.kind))
}

/* Latest date this habit was checked off, or null. */
export function lastCompletionDate(habit, completions) {
  let last = null
  for (const c of completions[habit.id] || []) {
    const d = typeof c === 'string' ? c : c.date
    if (d && (last === null || d > last)) last = d
  }
  return last
}

/* First date on which a one-time task counts as retired — the day after it was
   last checked off. null when it isn't one-time, or isn't done yet. */
export function retirementDate(habit, completions) {
  if (!isOneTime(habit)) return null
  const last = lastCompletionDate(habit, completions)
  return last ? toISODate(addDays(fromISODate(last), 1)) : null
}

export function isRetiredOn(habit, completions, dateISO) {
  const r = retirementDate(habit, completions)
  return !!r && dateISO >= r
}

/* Due *and* not retired — what every "can I star this?" site actually means. */
export function isActionableOn(habit, dateISO, completions) {
  return isDueOn(habit, dateISO) && !isRetiredOn(habit, completions, dateISO)
}

/* Does this habit still deserve a row in the week starting `weekStartISO`?
   A task retired mid-week keeps its row for that week so the star it earned
   stays visible; from the next week on, the row is gone. */
export function isVisibleInWeek(habit, completions, weekStartISO) {
  const r = retirementDate(habit, completions)
  return !r || r > weekStartISO
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

/* ── Occurrence helpers ──────────────────────────────────────────────────────
   An "occurrence" is a date on which the habit is due. Streaks are counted
   over occurrences (not raw calendar days), and each occurrence owns a
   *window* — the span since the previous occurrence — within which a single
   completion satisfies it. This is what lets you do a Sunday-only habit on a
   Thursday and still have it count for that week. */

/* Most recent due date strictly before `iso` (null if none within range). */
export function prevDue(habit, iso) {
  let d = addDays(fromISODate(iso), -1)
  for (let i = 0; i < 800; i++) {
    const cur = toISODate(d)
    if (isDueOn(habit, cur)) return cur
    d = addDays(d, -1)
  }
  return null
}

/* First due date on or after `iso` (null if none within range). */
export function nextOrCurrentDue(habit, iso) {
  let d = fromISODate(iso)
  for (let i = 0; i < 800; i++) {
    const cur = toISODate(d)
    if (isDueOn(habit, cur)) return cur
    d = addDays(d, 1)
  }
  return null
}

/* Is the occurrence at `dueISO` satisfied by any completion in its window
   (prevDue, dueISO]? Used so off-day completions credit the right period and
   so the week grid can show a due day as already covered. */
export function isOccurrenceSatisfied(habit, dueISO, completions) {
  const prev = prevDue(habit, dueISO)
  return (completions[habit.id] || []).some(c => {
    const d = typeof c === 'string' ? c : c.date
    return d <= dueISO && (prev === null || d > prev)
  })
}

/* Walk occurrence windows backward from the current/next occurrence.

   - daily          → each window is a single day (exact-date, as before)
   - weekdays       → window = span since the previous selected weekday
                      (e.g. Sun-only ⇒ a full week; any day that week counts)
   - every_n        → window = the n-day span ending on the occurrence
   - date / one_off → single occurrence; streak is just 1 when ever completed

   The in-progress occurrence (today or the next future due date) is a grace
   period: not-yet-satisfied doesn't break the streak, but satisfying it early
   (an off-day completion) extends the streak. */
export function computeStreak(habit, completions, asOfISO) {
  const f = habit.freq
  if (!f) return 0
  const dates = (completions[habit.id] || []).map(c => (typeof c === 'string' ? c : c.date))

  if (f.kind === 'one_off') return dates.length > 0 ? 1 : 0
  if (f.kind === 'date')    return dates.includes(f.date) ? 1 : 0

  const doneInWindow = (lo, hi) =>
    dates.some(d => d <= hi && (lo === null || d > lo))

  let due = nextOrCurrentDue(habit, asOfISO)
  if (!due) return 0

  let streak = 0
  for (let guard = 0; guard < 1000; guard++) {
    const prev = prevDue(habit, due)
    if (doneInWindow(prev, due)) {
      streak++
    } else if (due >= asOfISO) {
      // In-progress occurrence — grace, don't break.
    } else {
      break
    }
    if (prev === null) break
    due = prev
  }
  return streak
}
