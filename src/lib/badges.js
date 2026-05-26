export const BADGE_DEFS = [
  { id: 'first',    name: 'First check',   glyph: '✦', check: s => s.totalCompletions >= 1 },
  { id: '3day',     name: '3-day streak',  glyph: '△', check: s => s.longestStreak >= 3 },
  { id: 'week',     name: '7-day streak',  glyph: '◯', check: s => s.longestStreak >= 7 },
  { id: 'month',    name: '30-day streak', glyph: '✺', check: s => s.longestStreak >= 30 },
  { id: 'perfect',  name: 'Perfect day',   glyph: '◆', check: s => s.perfectDays >= 1 },
  { id: 'weekperf', name: 'Perfect week',  glyph: '✤', check: s => s.perfectWeeks >= 1 },
  { id: 'hundred',  name: '100 points',    glyph: '❋', check: s => s.totalScore >= 100 },
  { id: 'thousand', name: '1k points',     glyph: '❀', check: s => s.totalScore >= 1000 },
]
