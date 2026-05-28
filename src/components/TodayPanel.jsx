import { useMemo, useState } from 'react'
import { Checkbox } from './Checkbox.jsx'
import {
  isDueOn, isDoneFor, getCompletion, freqLabel, computeStreak,
} from '../lib/frequency.js'

export function TodayPanel({
  habits, completions, todayISO, dateStr, onToggle, starStyle,
  scoreToday, possibleToday,
}) {
  const [showOffSchedule, setShowOffSchedule] = useState(false)

  const dueToday = habits.filter(h =>
    isDueOn(h, todayISO) ||
    (h.freq?.kind === 'date' && h.freq.date < todayISO && !isDoneFor(h, h.freq.date, completions))
  )
  const remaining = dueToday.filter(h => !isDoneFor(h, todayISO, completions))
  const done = dueToday.filter(h => isDoneFor(h, todayISO, completions))

  // Off-schedule habits — recurring habits that aren't due today but can still
  // be logged "I did it anyway" (e.g. watered the plants on a non-Sunday for a
  // Sunday habit). Completing one records it on today's date, awards points,
  // and — thanks to window-based streaks — counts toward the period's streak.
  const dueIds = new Set(dueToday.map(h => h.id))
  const offSchedule = habits
    .filter(h => {
      if (dueIds.has(h.id)) return false
      const k = h.freq?.kind
      if (k === 'daily' || k === 'weekdays' || k === 'every_n') return true
      return isDoneFor(h, todayISO, completions) // surface anything already logged today
    })
    .sort((a, b) =>
      Number(isDoneFor(a, todayISO, completions)) - Number(isDoneFor(b, todayISO, completions))
    )

  const groups = useMemo(() => {
    const m = new Map()
    remaining.forEach(h => {
      const k = h.category || 'General'
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(h)
    })
    return [...m.entries()]
  }, [remaining])

  const pct = possibleToday > 0
    ? Math.min(100, Math.round((scoreToday / possibleToday) * 100))
    : 0

  return (
    <div className="panel today">
      <div className="panel-hd">
        <div><h2>Today</h2></div>
        <div className="sub">{dateStr}</div>
      </div>
      <div className="today-context">
        <div className="today-progress">
          <span>{done.length}/{dueToday.length} done</span>
          <div className="bar">
            <div className={'fill' + (pct === 100 ? ' complete' : '')} style={{ width: pct + '%' }} />
          </div>
          <span>{pct}%</span>
        </div>
      </div>
      <div className="panel-body">
        {dueToday.length === 0 && (
          <div className="task-empty">
            <span className="serif">Nothing on deck.</span>
            Add a habit or take a breath.
          </div>
        )}
        {groups.map(([cat, items]) => (
          <div key={cat}>
            <div className="context-group">{cat}</div>
            {items.map(h => (
              <TaskRow
                key={h.id}
                habit={h}
                dateISO={todayISO}
                completions={completions}
                onToggle={onToggle}
                starStyle={starStyle}
              />
            ))}
          </div>
        ))}
        {done.length > 0 && (
          <div>
            <div className="context-group">Done · {done.length}</div>
            {done.map(h => (
              <TaskRow
                key={h.id}
                habit={h}
                dateISO={todayISO}
                completions={completions}
                onToggle={onToggle}
                starStyle={starStyle}
              />
            ))}
          </div>
        )}

        {offSchedule.length > 0 && (
          <div className="off-schedule">
            <button
              type="button"
              className="off-schedule-toggle"
              aria-expanded={showOffSchedule}
              onClick={() => setShowOffSchedule(v => !v)}
            >
              <span className={'chev' + (showOffSchedule ? ' open' : '')}>›</span>
              Did one anyway? Log an off-day habit
              <span className="count">{offSchedule.length}</span>
            </button>
            {showOffSchedule && (
              <div className="off-schedule-list">
                <div className="off-schedule-hint">
                  Not scheduled today — check it to log it now. You still earn points and keep the streak going.
                </div>
                {offSchedule.map(h => (
                  <TaskRow
                    key={h.id}
                    habit={h}
                    dateISO={todayISO}
                    completions={completions}
                    onToggle={onToggle}
                    starStyle={starStyle}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskRow({ habit, dateISO, completions, onToggle, starStyle }) {
  const c = getCompletion(habit, dateISO, completions)
  const done = !!c
  const bonus = c && typeof c === 'object' && c.bonus
  const streak = computeStreak(habit, completions, dateISO)
  const overdue = habit.freq?.kind === 'date' && habit.freq.date < dateISO && !done
  return (
    <div className={'task' + (done ? ' done' : '') + (overdue ? ' overdue' : '')}>
      <Checkbox
        done={done}
        variant={starStyle}
        showBonus={bonus}
        onClick={(e) => onToggle(habit, dateISO, e)}
      />
      <div className="name">
        {habit.name}
        <div className="meta">
          <span className="freq">{freqLabel(habit.freq)}</span>
          {streak > 1 && <span className="streak">· {streak}🔥</span>}
          <span className="pts">· {habit.points}pt</span>
        </div>
      </div>
      <div className="right-col">
        {done && (
          <span className="serif" style={{ fontSize: 14, color: 'var(--good)' }}>
            +{c?.scored || habit.points}
          </span>
        )}
      </div>
    </div>
  )
}
