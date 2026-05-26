import { useMemo } from 'react'
import {
  isDueOn, isDoneFor, getCompletion, freqLabel, computeStreak,
} from '../lib/frequency.js'
import { addDays, fromISODate, toISODate, fmtWeekRange, DOW_INITIAL } from '../lib/dates.js'
import { ChainLink } from './ChainLink.jsx'
import { Icon } from './Icons.jsx'

export function WeekGrid({
  habits, completions, weekStartISO, todayISO, onToggle, onEdit, onDelete,
}) {
  const days = useMemo(() => {
    const out = []
    const start = fromISODate(weekStartISO)
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i)
      out.push({ d, iso: toISODate(d) })
    }
    return out
  }, [weekStartISO])

  const weekTotals = useMemo(() => {
    let earned = 0, possible = 0
    habits.forEach(h => {
      days.forEach(day => {
        if (isDueOn(h, day.iso)) {
          possible += h.points
          if (isDoneFor(h, day.iso, completions)) {
            const c = getCompletion(h, day.iso, completions)
            earned += c?.scored || h.points
          }
        }
      })
    })
    return { earned, possible }
  }, [habits, completions, days])

  return (
    <div className="week">
      <div className="week-hd">
        <div className="title-col">
          <h2>Week</h2>
          <div className="sub">{fmtWeekRange(weekStartISO)}</div>
        </div>
        {days.map(d => (
          <div key={d.iso} className={'day' + (d.iso === todayISO ? ' today' : '')}>
            {DOW_INITIAL[d.d.getDay()]}
            <span className="num">{d.d.getDate()}</span>
          </div>
        ))}
        <div className="total-col">Total</div>
      </div>
      {habits.map(h => (
        <WeekRow
          key={h.id}
          habit={h}
          days={days}
          completions={completions}
          todayISO={todayISO}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <div className="week-foot">
        <span>{habits.length} tracked</span>
        <span>{weekTotals.earned} / {weekTotals.possible} pts</span>
      </div>
    </div>
  )
}

function WeekRow({ habit, days, completions, todayISO, onToggle, onEdit, onDelete }) {
  const rowTotal = useMemo(() => {
    let earned = 0, possible = 0
    days.forEach(d => {
      if (isDueOn(habit, d.iso)) {
        possible += habit.points
        if (isDoneFor(habit, d.iso, completions)) {
          const c = getCompletion(habit, d.iso, completions)
          earned += c?.scored || habit.points
        }
      }
    })
    return { earned, possible }
  }, [habit, days, completions])

  const streak = computeStreak(habit, completions, todayISO)

  return (
    <div className="week-row">
      <div className="label">
        <div className="name">{habit.name}</div>
        <div className="freq-line">
          <span>{freqLabel(habit.freq)}</span>
          <span className="pts-badge">· {habit.points}pt</span>
          {streak > 1 && <span className="streak-badge">· {streak}🔥</span>}
        </div>
      </div>
      {days.map((d, idx) => {
        const due = isDueOn(habit, d.iso)
        const done = due && isDoneFor(habit, d.iso, completions)
        const c = done ? getCompletion(habit, d.iso, completions) : null
        const bonus = c && typeof c === 'object' && c.bonus
        const isFuture = d.iso > todayISO
        const missed = due && !done && d.iso < todayISO
        const isToday = d.iso === todayISO
        const nextIso = days[idx + 1]?.iso
        const nextDone = nextIso && isDoneFor(habit, nextIso, completions)
        const chainToNext = habit.freq?.kind === 'daily' && done && nextDone

        const cls =
          'cell'
          + (!due ? ' not-due' : '')
          + (isFuture ? ' future' : '')
          + (isToday ? ' today' : '')
          + (done ? ' done' : '')
          + (bonus ? ' bonus' : '')
          + (missed ? ' missed' : '')

        return (
          <div key={d.iso} className={cls}>
            {due && !isFuture && (
              <button
                className="cell-btn"
                onClick={(e) => onToggle(habit, d.iso, e)}
                aria-label="toggle completion"
              >
                {done ? <span className="mark">★</span> : <span className="mark">·</span>}
              </button>
            )}
            {due && isFuture && <span className="mark">·</span>}
            {chainToNext && <ChainLink orient={idx % 2 === 0 ? 'hv' : 'vh'} bonus={bonus} />}
          </div>
        )
      })}
      <div className="row-total">
        {rowTotal.earned}<span className="of"> /{rowTotal.possible}</span>
      </div>
      <div className="edit-row">
        <button onClick={() => onEdit(habit)} title="Edit"><Icon.Edit /></button>
        <button onClick={() => onDelete(habit)} title="Delete"><Icon.Trash /></button>
      </div>
    </div>
  )
}
