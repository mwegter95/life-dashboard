/* Scoring math, ported verbatim from the prototype spec.

   streakMultiplier(0)  === 1.0
   streakMultiplier(10) === 2.0  (capped)
   scoreCompletion = round(points * mult) + (bonus ? 1 : 0)
   bonus = 12% chance per completion. */

import { isDueOn, isDoneFor, getCompletion } from './frequency.js'

export const BONUS_ROLL_CHANCE = 0.12

export function streakMultiplier(streakDaysBeforeThis) {
  return 1 + Math.min(streakDaysBeforeThis / 10, 1)
}

export function scoreCompletion(habit, streakBefore, bonus) {
  return Math.round(habit.points * streakMultiplier(streakBefore)) + (bonus ? 1 : 0)
}

export function dayScore(habits, completions, iso) {
  let s = 0
  habits.forEach(h => {
    const c = getCompletion(h, iso, completions)
    if (c) s += (typeof c === 'object' ? c.scored : h.points) || h.points
  })
  return s
}

export function possibleForDay(habits, iso) {
  let s = 0
  habits.forEach(h => {
    if (isDueOn(h, iso)) s += h.points
  })
  return s
}
