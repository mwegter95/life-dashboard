export const LEVELS = [
  { name: 'Sprout',      threshold: 0 },
  { name: 'Steady',      threshold: 50 },
  { name: 'Reliable',    threshold: 150 },
  { name: 'On a roll',   threshold: 350 },
  { name: 'Streakwise',  threshold: 700 },
  { name: 'Habit-built', threshold: 1200 },
  { name: 'Compounding', threshold: 2000 },
  { name: 'Quiet master', threshold: 3500 },
]

export function levelFor(total) {
  let i = 0
  for (let k = 0; k < LEVELS.length; k++) {
    if (total >= LEVELS[k].threshold) i = k
  }
  const cur = LEVELS[i]
  const next = LEVELS[i + 1]
  const pct = next
    ? Math.round(((total - cur.threshold) / (next.threshold - cur.threshold)) * 100)
    : 100
  return { idx: i, cur, next, pct }
}
