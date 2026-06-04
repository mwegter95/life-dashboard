import test from 'node:test'
import assert from 'node:assert/strict'
import { completionMap, makeHabit } from '../../test/fixtures/life-dashboard.mjs'
import { computeStreak } from './frequency.js'

test('daily streak counts consecutive completions and today grace', () => {
  const daily = makeHabit({ id: 'daily' })

  assert.equal(
    computeStreak(daily, completionMap('daily', ['2026-06-08', '2026-06-09', '2026-06-10']), '2026-06-10'),
    3
  )
  assert.equal(
    computeStreak(daily, completionMap('daily', ['2026-06-08', '2026-06-09']), '2026-06-10'),
    2
  )
  assert.equal(
    computeStreak(daily, completionMap('daily', ['2026-06-08', '2026-06-10']), '2026-06-10'),
    1
  )
  assert.equal(computeStreak(daily, {}, '2026-06-10'), 0)
})

test('weekly streak accepts any completion inside each due window', () => {
  const asOf = '2026-06-14'
  const dow = new Date(asOf + 'T00:00:00').getDay()
  const weekly = makeHabit({ id: 'weekly', freq: { kind: 'weekdays', days: [dow] } })
  const weekAgo = (weeks) => {
    const d = new Date(asOf + 'T00:00:00')
    d.setDate(d.getDate() - 7 * weeks)
    return d.toISOString().slice(0, 10)
  }
  const midWeek = new Date(new Date(asOf + 'T00:00:00').getTime() - 2 * 864e5).toISOString().slice(0, 10)

  assert.equal(computeStreak(weekly, completionMap('weekly', [weekAgo(0), weekAgo(1), weekAgo(2)]), asOf), 3)
  assert.equal(computeStreak(weekly, completionMap('weekly', [weekAgo(0), weekAgo(2)]), asOf), 1)
  assert.equal(computeStreak(weekly, completionMap('weekly', [midWeek, weekAgo(1)]), asOf), 2)
})

test('every-N-days streak breaks when a due period is missed', () => {
  const habit = makeHabit({
    id: 'every-n',
    created: '2026-06-01',
    freq: { kind: 'every_n', n: 3, anchor: '2026-06-01' },
  })

  assert.equal(
    computeStreak(habit, completionMap('every-n', ['2026-06-04', '2026-06-07', '2026-06-10']), '2026-06-10'),
    3
  )
  assert.equal(
    computeStreak(habit, completionMap('every-n', ['2026-06-04', '2026-06-10']), '2026-06-10'),
    1
  )
})
