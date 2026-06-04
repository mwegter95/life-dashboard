import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BADGE_DEFS, badgeAwards, badgeBonusScore, computeBadgeStats, newBadgeAwards,
} from './badges.js'
import {
  completionMap, emptyBadgeStats, makeHabit,
} from '../../test/fixtures/life-dashboard.mjs'

test('defines sixteen repeatable badges', () => {
  assert.equal(BADGE_DEFS.length, 16)
  assert.ok(BADGE_DEFS.every(badge => badge.points >= 5 && badge.points <= 100))
})

test('badges repeat and add their reward points each time', () => {
  const stats = { ...emptyBadgeStats, totalCompletions: 26 }
  const first = badgeAwards(stats).find(badge => badge.id === 'first')
  const tens = badgeAwards(stats).find(badge => badge.id === 'ten-checks')

  assert.equal(first.earnedCount, 2)
  assert.equal(tens.earnedCount, 2)
  assert.equal(badgeBonusScore(stats), 26)
})

test('one completion can earn several badges in one celebration', () => {
  const before = { ...emptyBadgeStats, totalCompletions: 9, completionScore: 98 }
  const after = { ...before, totalCompletions: 10, completionScore: 101 }
  const awards = newBadgeAwards(before, after)

  assert.deepEqual(awards.map(award => award.id), ['hundred', 'ten-checks'])
  assert.equal(awards.reduce((sum, award) => sum + award.pointsEarned, 0), 28)
})

test('perfect-day badge counts stay in lifetime history', () => {
  const habits = [makeHabit()]
  const completions = completionMap('daily', ['2025-01-01'])

  assert.equal(computeBadgeStats(habits, completions, '2026-06-04').perfectDays, 1)
})

test('badge progress resets toward the next repeatable award', () => {
  const badges = badgeAwards({ ...emptyBadgeStats, totalCompletions: 26 })
  const first = badges.find(badge => badge.id === 'first')
  const tens = badges.find(badge => badge.id === 'ten-checks')

  assert.deepEqual(first.progress, {
    current: 0,
    target: 25,
    percent: 0,
    label: '26 / 51 checks',
  })
  assert.equal(tens.progress.label, '26 / 30 checks')
  assert.equal(tens.progress.percent, 60)
})
