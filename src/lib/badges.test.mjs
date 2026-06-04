import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BADGE_DEFS, badgeAwards, badgeBonusScore, computeBadgeStats, newBadgeAwards,
} from './badges.js'

const emptyStats = {
  completionScore: 0,
  totalCompletions: 0,
  longestStreak: 0,
  perfectDays: 0,
  perfectWeeks: 0,
  bonusCompletions: 0,
  smartCompletions: 0,
  bestDayCompletions: 0,
  activeHabits: 0,
  consistentWeeks: 0,
}

test('defines sixteen repeatable badges', () => {
  assert.equal(BADGE_DEFS.length, 16)
  assert.ok(BADGE_DEFS.every(badge => badge.points >= 5 && badge.points <= 100))
})

test('badges repeat and add their reward points each time', () => {
  const stats = { ...emptyStats, totalCompletions: 26 }
  const first = badgeAwards(stats).find(badge => badge.id === 'first')
  const tens = badgeAwards(stats).find(badge => badge.id === 'ten-checks')

  assert.equal(first.earnedCount, 2)
  assert.equal(tens.earnedCount, 2)
  assert.equal(badgeBonusScore(stats), 26)
})

test('one completion can earn several badges in one celebration', () => {
  const before = { ...emptyStats, totalCompletions: 9, completionScore: 98 }
  const after = { ...before, totalCompletions: 10, completionScore: 101 }
  const awards = newBadgeAwards(before, after)

  assert.deepEqual(awards.map(award => award.id), ['hundred', 'ten-checks'])
  assert.equal(awards.reduce((sum, award) => sum + award.pointsEarned, 0), 28)
})

test('perfect-day badge counts stay in lifetime history', () => {
  const habits = [{
    id: 'daily',
    points: 2,
    created: '2025-01-01',
    freq: { kind: 'daily' },
  }]
  const completions = {
    daily: [{ date: '2025-01-01', scored: 2, bonus: false }],
  }

  assert.equal(computeBadgeStats(habits, completions, '2026-06-04').perfectDays, 1)
})
