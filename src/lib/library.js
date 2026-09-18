/* Task library — everything you've tracked before, ready to be picked up again.

   Nothing here is stored separately. The library is derived on the fly from the
   habits the backend already holds, in three flavours:

     retired   one-time tasks that have been checked off and aged out of the
               calendar (see `retirementDate` in frequency.js)
     archived  habits you removed from your plan — archiving keeps the row (and
               therefore the points) instead of destroying it
     dismissed AI calendar reminders you soft-deleted

   Entries are deduped by name, so completing "Change the furnace filter" four
   times over a year shows up as one card that knows it's been done 4×. Re-adding
   from the library always creates a *new* habit: the old one keeps its history
   (and its points), the new one starts clean. */

import { isOneTime, isRetiredOn, lastCompletionDate } from './frequency.js'
import { fromISODate, MONTH_SHORT } from './dates.js'

export const ORIGIN_LABEL = {
  retired:   'Completed',
  archived:  'Removed',
  dismissed: 'Dismissed',
}

function normKey(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function completionCount(habit, completions) {
  return (completions[habit.id] || []).length
}

function originFor(habit, completions, todayISO) {
  if (habit.archived) return 'archived'
  if (habit.source === 'gcal-ai' && habit.deleted) return 'dismissed'
  if (isRetiredOn(habit, completions, todayISO)) return 'retired'
  return null
}

/* One card per distinct task name. `habits` is the live list, `archivedHabits`
   the put-away ones; both are scanned because a name can appear in either. */
export function buildLibrary({ habits = [], archivedHabits = [], completions = {}, todayISO }) {
  // Names that are on the plan right now — those get a "tracking" flag rather
  // than an invitation to add a duplicate.
  const activeNames = new Set(
    habits
      .filter(h => !h.archived && !h.deleted && !isRetiredOn(h, completions, todayISO))
      .map(h => normKey(h.name))
  )

  const byName = new Map()
  for (const habit of [...habits, ...archivedHabits]) {
    const origin = originFor(habit, completions, todayISO)
    if (!origin) continue
    const key = normKey(habit.name)
    if (!key) continue

    const done = completionCount(habit, completions)
    const last = lastCompletionDate(habit, completions)
    const seen = byName.get(key)

    if (!seen) {
      byName.set(key, {
        key,
        name: (habit.name || '').trim(),
        category: habit.category || 'General',
        points: habit.points ?? 2,
        notes: habit.notes || '',
        freq: habit.freq || { kind: 'one_off' },
        oneTime: isOneTime(habit),
        origin,
        timesCompleted: done,
        lastDone: last,
        // Prefer the shape of the most recently touched instance when merging.
        touchedAt: last || habit.archivedAt || habit.created || '',
        tracking: activeNames.has(key),
      })
      continue
    }

    seen.timesCompleted += done
    if (last && (!seen.lastDone || last > seen.lastDone)) seen.lastDone = last
    const touched = last || habit.archivedAt || habit.created || ''
    if (touched > seen.touchedAt) {
      seen.touchedAt = touched
      seen.category = habit.category || seen.category
      seen.points = habit.points ?? seen.points
      seen.notes = habit.notes || seen.notes
      seen.freq = habit.freq || seen.freq
      seen.origin = origin
    }
  }

  return [...byName.values()]
}

export const SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'most',   label: 'Most done' },
  { id: 'az',     label: 'A–Z' },
]

export function sortLibrary(entries, sort) {
  const out = [...entries]
  if (sort === 'most') {
    out.sort((a, b) =>
      b.timesCompleted - a.timesCompleted || a.name.localeCompare(b.name))
  } else if (sort === 'az') {
    out.sort((a, b) => a.name.localeCompare(b.name))
  } else {
    out.sort((a, b) =>
      (b.touchedAt || '').localeCompare(a.touchedAt || '') || a.name.localeCompare(b.name))
  }
  return out
}

export function filterLibrary(entries, { query = '', category = 'All' } = {}) {
  const q = query.trim().toLowerCase()
  return entries.filter(e => {
    if (category !== 'All' && (e.category || 'General') !== category) return false
    if (!q) return true
    return (
      e.name.toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q)
    )
  })
}

/* Categories actually present, so the filter row never offers a dead chip. */
export function libraryCategories(entries) {
  const set = new Set(entries.map(e => e.category || 'General'))
  return ['All', ...[...set].sort()]
}

export function fmtLastDone(iso) {
  if (!iso) return 'never finished'
  const d = fromISODate(iso)
  if (isNaN(d)) return iso
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}
