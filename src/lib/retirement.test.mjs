import test from 'node:test'
import assert from 'node:assert/strict'

import {
  isOneTime, retirementDate, isRetiredOn, isActionableOn, isVisibleInWeek,
} from './frequency.js'
import { possibleForDay } from './scoring.js'
import { buildLibrary, filterLibrary, sortLibrary } from './library.js'

const oneOff  = { id: 'a', name: 'Fix the gate', points: 3, category: 'Home',  freq: { kind: 'one_off' } }
const dated   = { id: 'b', name: 'Dentist',      points: 2, category: 'Health', freq: { kind: 'date', date: '2026-09-10' } }
const smart   = { id: 'c', name: 'Gift for Mom', points: 2, source: 'gcal-ai',  freq: { kind: 'date', date: '2026-09-12' } }
const daily   = { id: 'd', name: 'Stretch',      points: 1, category: 'Health', freq: { kind: 'daily' } }

test('one-time detection covers one-offs, dated tasks and AI reminders', () => {
  assert.equal(isOneTime(oneOff), true)
  assert.equal(isOneTime(dated), true)
  assert.equal(isOneTime(smart), true)
  assert.equal(isOneTime(daily), false)
})

test('an unfinished one-time task never retires', () => {
  assert.equal(retirementDate(oneOff, {}), null)
  assert.equal(isRetiredOn(oneOff, {}, '2030-01-01'), false)
})

test('retirement starts the day after the completion, not the day of', () => {
  const completions = { a: [{ date: '2026-09-10', scored: 3 }] }
  assert.equal(retirementDate(oneOff, completions), '2026-09-11')
  assert.equal(isRetiredOn(oneOff, completions, '2026-09-10'), false)  // still undoable
  assert.equal(isRetiredOn(oneOff, completions, '2026-09-11'), true)
  assert.equal(isRetiredOn(oneOff, completions, '2026-12-25'), true)
})

test('the latest completion wins when a task was logged more than once', () => {
  const completions = { c: [{ date: '2026-09-08' }, { date: '2026-09-14' }, { date: '2026-09-11' }] }
  assert.equal(retirementDate(smart, completions), '2026-09-15')
})

test('a recurring habit never retires, however often it is completed', () => {
  const completions = { d: [{ date: '2026-09-10' }, { date: '2026-09-11' }] }
  assert.equal(retirementDate(daily, completions), null)
  assert.equal(isActionableOn(daily, '2026-09-18', completions), true)
})

test('retired tasks stop being actionable but keep their star that day', () => {
  const completions = { b: [{ date: '2026-09-10', scored: 2 }] }
  assert.equal(isActionableOn(dated, '2026-09-10', completions), true)
  assert.equal(isActionableOn(dated, '2026-09-11', completions), false)
})

test('a row stays for the week it was finished in, then disappears', () => {
  const completions = { a: [{ date: '2026-09-10', scored: 3 }] }   // Thursday
  assert.equal(isVisibleInWeek(oneOff, completions, '2026-09-07'), true)   // that week
  assert.equal(isVisibleInWeek(oneOff, completions, '2026-09-14'), false)  // the next
  assert.equal(isVisibleInWeek(oneOff, completions, '2026-08-31'), true)   // an earlier one
})

test('a finished one-off stops inflating the day total, but keeps its points', () => {
  const completions = { a: [{ date: '2026-09-10', scored: 3 }] }
  assert.equal(possibleForDay([oneOff, daily], '2026-09-10', completions), 4)
  assert.equal(possibleForDay([oneOff, daily], '2026-09-18', completions), 1)
  // The completion itself is untouched — that's what the score reads from.
  assert.equal(completions.a[0].scored, 3)
})

test('un-starring a retired task brings it straight back', () => {
  assert.equal(isRetiredOn(oneOff, { a: [{ date: '2026-09-10' }] }, '2026-09-18'), true)
  assert.equal(isRetiredOn(oneOff, { a: [] }, '2026-09-18'), false)
})

/* ── library ─────────────────────────────────────────────────────────────── */

const todayISO = '2026-09-18'

test('the library collects retired, archived and dismissed tasks — not live ones', () => {
  const habits = [
    oneOff,
    daily,
    { ...smart, deleted: true },
  ]
  const archivedHabits = [{ id: 'e', name: 'Old habit', points: 2, category: 'Work', archived: true, archivedAt: '2026-08-01', freq: { kind: 'daily' } }]
  const completions = { a: [{ date: '2026-09-10', scored: 3 }], d: [{ date: '2026-09-18' }] }

  const lib = buildLibrary({ habits, archivedHabits, completions, todayISO })
  const names = lib.map(e => e.name).sort()
  assert.deepEqual(names, ['Fix the gate', 'Gift for Mom', 'Old habit'])
  assert.equal(lib.find(e => e.name === 'Fix the gate').origin, 'retired')
  assert.equal(lib.find(e => e.name === 'Old habit').origin, 'archived')
  assert.equal(lib.find(e => e.name === 'Gift for Mom').origin, 'dismissed')
})

test('repeat instances of the same task merge into one card with a total count', () => {
  const habits = [
    { id: 'f1', name: 'Change furnace filter', points: 3, category: 'Home', freq: { kind: 'one_off' } },
    { id: 'f2', name: 'change  Furnace Filter', points: 4, category: 'Home', freq: { kind: 'one_off' } },
  ]
  const completions = {
    f1: [{ date: '2026-03-02', scored: 3 }],
    f2: [{ date: '2026-06-04', scored: 4 }, { date: '2026-09-01', scored: 4 }],
  }
  const lib = buildLibrary({ habits, archivedHabits: [], completions, todayISO })
  assert.equal(lib.length, 1)
  assert.equal(lib[0].timesCompleted, 3)
  assert.equal(lib[0].lastDone, '2026-09-01')
  assert.equal(lib[0].points, 4)          // most recently touched instance wins
})

test('a name still on the plan is flagged so it cannot be added twice', () => {
  const habits = [
    { id: 'g1', name: 'Wash the car', points: 2, freq: { kind: 'one_off' } },
    { id: 'g2', name: 'Wash the car', points: 2, freq: { kind: 'one_off' } },
  ]
  const completions = { g1: [{ date: '2026-09-01', scored: 2 }] }   // g2 still open
  const lib = buildLibrary({ habits, archivedHabits: [], completions, todayISO })
  assert.equal(lib.length, 1)
  assert.equal(lib[0].tracking, true)
})

test('search and sort behave', () => {
  const entries = [
    { key: 'a', name: 'Alpha', category: 'Home',  notes: '', timesCompleted: 1, touchedAt: '2026-01-01' },
    { key: 'b', name: 'Beta',  category: 'Work',  notes: 'gutters', timesCompleted: 9, touchedAt: '2026-05-01' },
  ]
  assert.deepEqual(filterLibrary(entries, { query: 'gut' }).map(e => e.key), ['b'])
  assert.deepEqual(filterLibrary(entries, { category: 'Home' }).map(e => e.key), ['a'])
  assert.deepEqual(sortLibrary(entries, 'most').map(e => e.key), ['b', 'a'])
  assert.deepEqual(sortLibrary(entries, 'recent').map(e => e.key), ['b', 'a'])
  assert.deepEqual(sortLibrary(entries, 'az').map(e => e.key), ['a', 'b'])
})
