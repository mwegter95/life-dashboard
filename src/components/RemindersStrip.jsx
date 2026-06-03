import { useMemo } from 'react'
import { daysBetween } from '../lib/dates.js'
import { isDoneFor } from '../lib/frequency.js'

export function RemindersStrip({ habits, completions, todayISO, onToggle }) {
  const upcoming = useMemo(() => {
    const list = []
    habits.forEach(h => {
      if (h.hidden) return   // hidden smart reminders drop out of the strip too
      if (h.freq?.kind === 'date') {
        const days = daysBetween(todayISO, h.freq.date)
        if (days >= -1 && days <= 21 && !isDoneFor(h, h.freq.date, completions)) {
          list.push({ h, days })
        }
      }
      if (h.freq?.kind === 'one_off' && !((completions[h.id] || []).length)) {
        list.push({ h, days: 0, oneoff: true })
      }
    })
    return list.sort((a, b) => a.days - b.days)
  }, [habits, completions, todayISO])

  if (upcoming.length === 0) return null

  return (
    <div className="reminders">
      {upcoming.slice(0, 6).map(({ h, days, oneoff }) => {
        const soon = days <= 3 && !oneoff
        let whenLabel
        if (oneoff) whenLabel = 'Whenever'
        else if (days < 0) whenLabel = 'Overdue'
        else if (days === 0) whenLabel = 'Today'
        else if (days === 1) whenLabel = 'Tomorrow'
        else whenLabel = `In ${days} days`
        return (
          <div key={h.id} className={'reminder' + (soon ? ' soon' : '')}>
            <div className={'when' + (soon ? ' soon' : '')}>{whenLabel}</div>
            <div className="what">{h.name}</div>
            <div className="meta">{h.points}pt · {h.category || 'General'}</div>
            <div className="action">
              <button
                className="btn tiny"
                onClick={(e) => onToggle(h, h.freq?.date || todayISO, e)}
              >Mark done</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
