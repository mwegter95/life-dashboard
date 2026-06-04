import { addDays, fromISODate, startOfWeek, toISODate } from './dates.js'
import { computeStreak, isDoneFor, isDueOn } from './frequency.js'

function repeatCount(value, first, every = first) {
  const n = Number(value) || 0
  return n < first ? 0 : 1 + Math.floor((n - first) / every)
}

function milestoneProgress(value, first, every, unit) {
  const n = Number(value) || 0
  const earnedCount = repeatCount(n, first, every)
  const previousTarget = earnedCount > 0 ? first + (earnedCount - 1) * every : 0
  const nextTarget = earnedCount > 0 ? first + earnedCount * every : first
  const step = nextTarget - previousTarget
  return {
    current: Math.max(0, n - previousTarget),
    target: step,
    percent: Math.min(100, Math.round((Math.max(0, n - previousTarget) / step) * 100)),
    label: `${n} / ${nextTarget} ${unit}`,
  }
}

function nextWinProgress(earnedCount, label) {
  return {
    current: 0,
    target: 1,
    percent: 0,
    label: `${earnedCount} earned · ${label}`,
  }
}

export const BADGE_DEFS = [
  {
    id: 'first', name: 'First check', glyph: '✦', points: 5,
    description: 'Start, then keep showing up every 25 checks.',
    count: s => repeatCount(s.totalCompletions, 1, 25),
    progress: s => milestoneProgress(s.totalCompletions, 1, 25, 'checks'),
  },
  {
    id: '3day', name: '3-day streak', glyph: '△', points: 8,
    description: 'Earn one for every three days in your longest streak.',
    count: s => repeatCount(s.longestStreak, 3, 3),
    progress: s => milestoneProgress(s.longestStreak, 3, 3, 'streak days'),
  },
  {
    id: 'week', name: '7-day streak', glyph: '◯', points: 15,
    description: 'Earn one for every full week in your longest streak.',
    count: s => repeatCount(s.longestStreak, 7, 7),
    progress: s => milestoneProgress(s.longestStreak, 7, 7, 'streak days'),
  },
  {
    id: 'month', name: '30-day streak', glyph: '✺', points: 40,
    description: 'Earn one for every 30 days in your longest streak.',
    count: s => repeatCount(s.longestStreak, 30, 30),
    progress: s => milestoneProgress(s.longestStreak, 30, 30, 'streak days'),
  },
  {
    id: 'perfect', name: 'Perfect day', glyph: '◆', points: 10,
    description: 'Complete every habit due that day.',
    count: s => s.perfectDays,
    progress: s => nextWinProgress(s.perfectDays, 'finish every due habit for another'),
  },
  {
    id: 'weekperf', name: 'Perfect week', glyph: '✤', points: 75,
    description: 'Complete every habit due in a finished week.',
    count: s => s.perfectWeeks,
    progress: s => nextWinProgress(s.perfectWeeks, 'finish a perfect week for another'),
  },
  {
    id: 'hundred', name: '100 points', glyph: '❋', points: 20,
    description: 'Earn one for every 100 completion points.',
    count: s => repeatCount(s.completionScore, 100, 100),
    progress: s => milestoneProgress(s.completionScore, 100, 100, 'task points'),
  },
  {
    id: 'thousand', name: '1k points', glyph: '❀', points: 100,
    description: 'Earn one for every 1,000 completion points.',
    count: s => repeatCount(s.completionScore, 1000, 1000),
    progress: s => milestoneProgress(s.completionScore, 1000, 1000, 'task points'),
  },
  {
    id: 'ten-checks', name: 'Ten checks', glyph: '✧', points: 8,
    description: 'Earn one for every ten completed habits.',
    count: s => repeatCount(s.totalCompletions, 10, 10),
    progress: s => milestoneProgress(s.totalCompletions, 10, 10, 'checks'),
  },
  {
    id: 'fifty-checks', name: 'Fifty checks', glyph: '◇', points: 25,
    description: 'Earn one for every fifty completed habits.',
    count: s => repeatCount(s.totalCompletions, 50, 50),
    progress: s => milestoneProgress(s.totalCompletions, 50, 50, 'checks'),
  },
  {
    id: 'century-checks', name: 'Century club', glyph: '✹', points: 50,
    description: 'Earn one for every hundred completed habits.',
    count: s => repeatCount(s.totalCompletions, 100, 100),
    progress: s => milestoneProgress(s.totalCompletions, 100, 100, 'checks'),
  },
  {
    id: 'bonus-hunter', name: 'Bonus hunter', glyph: '✷', points: 15,
    description: 'Find five random completion bonuses.',
    count: s => repeatCount(s.bonusCompletions, 5, 5),
    progress: s => milestoneProgress(s.bonusCompletions, 5, 5, 'bonuses'),
  },
  {
    id: 'smart-move', name: 'Smart move', glyph: '◈', points: 15,
    description: 'Complete ten calendar-powered smart reminders.',
    count: s => repeatCount(s.smartCompletions, 10, 10),
    progress: s => milestoneProgress(s.smartCompletions, 10, 10, 'smart reminders'),
  },
  {
    id: 'full-plate', name: 'Full plate', glyph: '✣', points: 20,
    description: 'Complete five habits in a single day.',
    count: s => repeatCount(s.bestDayCompletions, 5, 5),
    progress: s => milestoneProgress(s.bestDayCompletions, 5, 5, 'checks in one day'),
  },
  {
    id: 'habit-garden', name: 'Habit garden', glyph: '❈', points: 15,
    description: 'Build activity across three different habits.',
    count: s => repeatCount(s.activeHabits, 3, 3),
    progress: s => milestoneProgress(s.activeHabits, 3, 3, 'active habits'),
  },
  {
    id: 'consistent-week', name: 'Consistent week', glyph: '⬡', points: 25,
    description: 'Complete something on at least five days in a finished week.',
    count: s => s.consistentWeeks,
    progress: s => nextWinProgress(s.consistentWeeks, 'show up five days in a week for another'),
  },
]

export function badgeAwards(stats) {
  return BADGE_DEFS.map(badge => ({
    ...badge,
    earnedCount: badge.count(stats),
    progress: badge.progress(stats),
  }))
}

export function badgeBonusScore(stats) {
  return BADGE_DEFS.reduce((sum, badge) => sum + badge.count(stats) * badge.points, 0)
}

export function newBadgeAwards(before, after) {
  return BADGE_DEFS.flatMap(badge => {
    const previousCount = badge.count(before)
    const earnedCount = badge.count(after)
    if (earnedCount <= previousCount) return []
    const gained = earnedCount - previousCount
    return [{
      ...badge,
      previousCount,
      earnedCount,
      gained,
      pointsEarned: gained * badge.points,
    }]
  })
}

export function computeBadgeStats(habits, completions, todayISO) {
  const habitById = new Map(habits.map(h => [h.id, h]))
  const completionsByDate = new Map()
  let completionScore = 0
  let totalCompletions = 0
  let bonusCompletions = 0
  let smartCompletions = 0
  let activeHabits = 0

  Object.entries(completions).forEach(([habitId, entries]) => {
    if (entries.length) activeHabits++
    const habit = habitById.get(habitId)
    entries.forEach(entry => {
      const date = typeof entry === 'string' ? entry : entry.date
      completionScore += typeof entry === 'object' ? (entry.scored || 0) : (habit?.points || 0)
      totalCompletions++
      if (typeof entry === 'object' && entry.bonus) bonusCompletions++
      if (habit?.source === 'gcal-ai') smartCompletions++
      completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1)
    })
  })

  const longestStreak = habits.reduce(
    (longest, habit) => Math.max(longest, computeStreak(habit, completions, todayISO)),
    0
  )
  const bestDayCompletions = [...completionsByDate.values()].reduce(
    (best, count) => Math.max(best, count),
    0
  )

  let perfectDays = 0
  for (const iso of completionsByDate.keys()) {
    if (iso > todayISO) continue
    const due = habits.filter(h => isDueOn(h, iso))
    if (due.length && due.every(h => isDoneFor(h, iso, completions))) perfectDays++
  }

  let perfectWeeks = 0
  let consistentWeeks = 0
  const thisWeekISO = toISODate(startOfWeek(fromISODate(todayISO), true))
  const completedWeeks = new Set(
    [...completionsByDate.keys()]
      .filter(iso => iso < thisWeekISO)
      .map(iso => toISODate(startOfWeek(fromISODate(iso), true)))
  )
  for (const weekStartISO of completedWeeks) {
    const start = fromISODate(weekStartISO)
    let dueCount = 0
    let allDueDone = true
    let activeDays = 0
    for (let day = 0; day < 7; day++) {
      const iso = toISODate(addDays(start, day))
      const due = habits.filter(h => isDueOn(h, iso))
      dueCount += due.length
      if (due.some(h => !isDoneFor(h, iso, completions))) allDueDone = false
      if ((completionsByDate.get(iso) || 0) > 0) activeDays++
    }
    if (dueCount > 0 && allDueDone) perfectWeeks++
    if (activeDays >= 5) consistentWeeks++
  }

  return {
    completionScore,
    totalCompletions,
    longestStreak,
    perfectDays,
    perfectWeeks,
    bonusCompletions,
    smartCompletions,
    bestDayCompletions,
    activeHabits,
    consistentWeeks,
  }
}
