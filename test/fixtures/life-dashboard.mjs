export const emptyBadgeStats = Object.freeze({
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
})

export function makeHabit(overrides = {}) {
  return {
    id: 'daily',
    name: 'Test habit',
    points: 2,
    created: '2025-01-01',
    freq: { kind: 'daily' },
    ...overrides,
  }
}

export function completion(date, overrides = {}) {
  return {
    date,
    scored: 2,
    bonus: false,
    ...overrides,
  }
}

export function completionMap(habitId, dates, overrides = {}) {
  return {
    [habitId]: dates.map(date => completion(date, overrides)),
  }
}

function addDaysISO(iso, amount) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + amount)
  return d.toISOString().slice(0, 10)
}

export function createMockLifeState(todayISO) {
  const habits = [
    makeHabit({ id: 'emails', name: 'Check emails', points: 15 }),
    makeHabit({
      id: 'plants',
      name: 'Water the indoor plants',
      points: 10,
      freq: { kind: 'weekdays', days: [0] },
    }),
    makeHabit({
      id: 'ride',
      name: 'Ride Peloton',
      points: 50,
      freq: { kind: 'weekdays', days: [0, 5] },
    }),
    makeHabit({
      id: 'smart-event',
      name: 'Choose outfit for a wedding',
      points: 2,
      source: 'gcal-ai',
      freq: { kind: 'date', date: todayISO },
    }),
  ]
  const completions = {
    emails: [-3, -2, -1, 0].map((offset, i) =>
      completion(addDaysISO(todayISO, offset), { scored: 15 + i, bonus: i === 2 })
    ),
    plants: [],
    ride: [],
    'smart-event': [],
  }

  return {
    habits,
    completions,
    reflections: {},
    mantra: 'Make the next useful move.',
  }
}
