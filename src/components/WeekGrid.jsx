import { useEffect, useMemo, useState } from 'react'
import {
  isDueOn, isDoneFor, getCompletion, freqLabel, computeStreak,
} from '../lib/frequency.js'
import { addDays, fromISODate, toISODate, fmtWeekRange, DOW_INITIAL } from '../lib/dates.js'
import { Icon } from './Icons.jsx'
import * as api from '../lib/api.js'
import { useAppState } from '../state/AppState.jsx'

export function WeekGrid({
  habits, completions, weekStartISO, todayISO, onToggle, onEdit, onDelete,
  onPrevWeek, onNextWeek,
}) {
  const { toggleSmartHidden, setSmartDeleted } = useAppState()
  const [deletedAnchor, setDeletedAnchor] = useState(null)           // deleted-list popover anchor
  const [eventPopover, setEventPopover] = useState(null)             // { habit, anchor } for the event-detail popover
  const [eventsById, setEventsById] = useState({})                   // sourceEventId -> Google event details
  // Edit mode gates star removal. In normal mode a stray tap can only *add* a
  // star (a safe, reversible action); removing one — or adding an off-day star
  // on a non-scheduled day — requires turning on Edit, so nothing gets deleted
  // by accident.
  const [editMode, setEditMode] = useState(false)
  // Row-edit mode gates the per-habit edit/delete buttons the same way, so a
  // stray click can't open the editor or delete a habit. Off by default; the
  // buttons only appear (in the label, clear of the star grid) when it's on.
  const [rowEditMode, setRowEditMode] = useState(false)
  // Hidden smart reminders collapse into a foldable sub-list at the bottom.
  const [showHidden, setShowHidden] = useState(false)

  // Smart reminders sorted by their due date (the reminder's date), so the
  // calendar-reminders list reads chronologically instead of in DB order.
  const byDate = (a, b) => {
    const da = a.freq?.date || '', db = b.freq?.date || ''
    return da < db ? -1 : da > db ? 1 : 0
  }
  const regularHabits = habits.filter(h => h.source !== 'gcal-ai')
  const smartHabits   = habits.filter(h => h.source === 'gcal-ai' && !h.deleted)
  const visibleSmart  = smartHabits.filter(h => !h.hidden).sort(byDate)
  const hiddenSmart   = smartHabits.filter(h => h.hidden).sort(byDate)
  const deletedSmart  = habits.filter(h => h.source === 'gcal-ai' && h.deleted)

  // Pull the underlying Google events so clicking a reminder can show the real
  // event (most importantly its date). Only fetch when smart reminders exist.
  const hasSmart = smartHabits.length > 0 || deletedSmart.length > 0
  useEffect(() => {
    if (!hasSmart) return
    let cancelled = false
    api.gcalEvents(180).then(({ events }) => {
      if (cancelled) return
      const map = {}
      ;(events || []).forEach(ev => { map[ev.id] = ev })
      setEventsById(map)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [hasSmart])

  // Position a popover near the clicked element, clamped to the visible viewport
  // (handles the embedded-in-iframe case via the --embed-viewport-* vars).
  const anchorFor = (e, popoverH) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const root = document.documentElement
    const embedded = root.classList.contains('embedded')
    const styles = getComputedStyle(root)
    const visibleTop = embedded
      ? parseFloat(styles.getPropertyValue('--embed-viewport-top')) || 0
      : 0
    const visibleHeight = embedded
      ? parseFloat(styles.getPropertyValue('--embed-viewport-height')) || window.innerHeight
      : window.innerHeight
    const scrollY = embedded ? window.scrollY : 0
    const popoverW = Math.min(360, window.innerWidth - 24)
    const minTop = visibleTop + 12
    const maxTop = Math.max(minTop, visibleTop + visibleHeight - popoverH - 12)
    return {
      top: Math.max(minTop, Math.min(rect.bottom + scrollY + 8, maxTop)),
      left: Math.max(12, Math.min(rect.left, window.innerWidth - popoverW - 12)),
    }
  }

  const openDeleted = (e) => setDeletedAnchor(anchorFor(e, 360))
  const openEvent = (habit, e) => setEventPopover({ habit, anchor: anchorFor(e, 260) })

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
    <>
      <div className={'week' + (editMode ? ' editing' : '') + (rowEditMode ? ' row-editing' : '')}>
      <div className="week-toolbar">
        <div className="week-title">
          <h2>Week</h2>
          <div className="week-nav">
            <button type="button" className="week-nav-btn" onClick={onPrevWeek} aria-label="Previous week">‹</button>
            <span className="sub">{fmtWeekRange(weekStartISO)}</span>
            <button type="button" className="week-nav-btn" onClick={onNextWeek} aria-label="Next week">›</button>
          </div>
        </div>
        <div className="edit-toggles">
          <button
            type="button"
            className={'edit-toggle' + (editMode ? ' active' : '')}
            onClick={() => setEditMode(v => !v)}
            aria-pressed={editMode}
            title={editMode
              ? 'Finish editing — taps will no longer remove stars'
              : 'Turn on to add or remove stars (incl. off-schedule days)'}
          >
            {editMode ? '✓ Done' : '✎ Edit stars'}
          </button>
          <button
            type="button"
            className={'edit-toggle' + (rowEditMode ? ' active' : '')}
            onClick={() => setRowEditMode(v => !v)}
            aria-pressed={rowEditMode}
            title={rowEditMode
              ? 'Finish editing rows — hides the edit & delete buttons'
              : 'Turn on to edit or delete habits'}
          >
            {rowEditMode ? '✓ Done' : '✎ Edit rows'}
          </button>
        </div>
      </div>
      <div className="week-hd">
        <div className="title-col" />
        {days.map(d => (
          <div key={d.iso} className={'day' + (d.iso === todayISO ? ' today' : '')}>
            {DOW_INITIAL[d.d.getDay()]}
            <span className="num">{d.d.getDate()}</span>
          </div>
        ))}
        <div className="total-col">Total</div>
      </div>
      {regularHabits.map(h => (
        <WeekRow
          key={h.id}
          habit={h}
          days={days}
          completions={completions}
          todayISO={todayISO}
          editMode={editMode}
          rowEditMode={rowEditMode}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {smartHabits.length > 0 && (
        <div className="week-section-divider">
          <span>Calendar reminders</span>
        </div>
      )}
      {visibleSmart.map(h => (
        <WeekRow
          key={h.id}
          habit={h}
          days={days}
          completions={completions}
          todayISO={todayISO}
          editMode={editMode}
          rowEditMode={false}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleHidden={toggleSmartHidden}
          onDeleteSmart={(h) => setSmartDeleted(h, true)}
          onOpenEvent={openEvent}
        />
      ))}
      {(hiddenSmart.length > 0 || deletedSmart.length > 0) && (
        <div className="week-smart-controls">
          {hiddenSmart.length > 0 && (
            <button
              type="button"
              className="week-pill"
              aria-expanded={showHidden}
              onClick={() => setShowHidden(v => !v)}
            >
              <span className={'chev' + (showHidden ? ' open' : '')}>›</span>
              Hidden <span className="count">{hiddenSmart.length}</span>
            </button>
          )}
          {deletedSmart.length > 0 && (
            <button
              type="button"
              className="week-pill"
              onClick={openDeleted}
            >
              <Icon.Trash /> Deleted <span className="count">{deletedSmart.length}</span>
            </button>
          )}
        </div>
      )}
      {showHidden && hiddenSmart.map(h => (
        <WeekRow
          key={h.id}
          habit={h}
          days={days}
          completions={completions}
          todayISO={todayISO}
          editMode={editMode}
          rowEditMode={false}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleHidden={toggleSmartHidden}
          onDeleteSmart={(h) => setSmartDeleted(h, true)}
          onOpenEvent={openEvent}
        />
      ))}
      <div className="week-foot">
        <span>{habits.length} tracked</span>
        <span>{weekTotals.earned} / {weekTotals.possible} pts</span>
      </div>
      </div>

      {deletedAnchor && (
        <DeletedModal
          deleted={deletedSmart}
          anchor={deletedAnchor}
          onRestore={(h) => setSmartDeleted(h, false)}
          onClose={() => setDeletedAnchor(null)}
        />
      )}
      {eventPopover && (
        <EventPopover
          habit={eventPopover.habit}
          event={eventsById[eventPopover.habit.sourceEventId]}
          anchor={eventPopover.anchor}
          onClose={() => setEventPopover(null)}
        />
      )}
    </>
  )
}

/* Formats the underlying event's real date/time (the thing people actually want
   to see — e.g. when the birthday IS, not just when the gift reminder fires). */
function fmtEventWhen(ev) {
  if (!ev || !ev.start) return ''
  const dayOpts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  const start = new Date(ev.allDay ? ev.start.slice(0, 10) + 'T00:00:00' : ev.start)
  if (isNaN(start)) return ev.date || ''
  if (ev.allDay) {
    if (ev.end) {
      // all-day end is exclusive; step back a day for the inclusive last day
      const last = new Date(ev.end.slice(0, 10) + 'T00:00:00')
      last.setDate(last.getDate() - 1)
      if (last > start) {
        return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
          ' – ' + last.toLocaleDateString(undefined, dayOpts)
      }
    }
    return start.toLocaleDateString(undefined, dayOpts)
  }
  return start.toLocaleDateString(undefined, dayOpts) + ' · ' +
    start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function fmtShortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso.slice(0, 10) + 'T00:00:00')
  return isNaN(d) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function EventPopover({ habit, event, anchor, onClose }) {
  return (
    <div className="modal-bg modal-bg--popover" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--event" role="dialog" aria-modal="true" style={anchor}>
        <div className="modal-hd">
          <h3>{event?.title || habit.name}</h3>
          <button className="x" onClick={onClose} aria-label="Close"><Icon.X /></button>
        </div>
        <div className="modal-body">
          {event ? (
            <div className="event-details">
              <div className="event-when">{fmtEventWhen(event)}</div>
              {event.location && <div className="event-loc">{event.location}</div>}
              <div className="event-note">Reminder fires {fmtShortDate(habit.freq?.date)}</div>
            </div>
          ) : (
            <p className="confirm-msg">
              Couldn’t load the calendar event details. This reminder is set for {fmtShortDate(habit.freq?.date)}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DeletedModal({ deleted, anchor, onRestore, onClose }) {
  return (
    <div className="modal-bg modal-bg--popover" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--deleted" role="dialog" aria-modal="true" style={anchor}>
        <div className="modal-hd">
          <h3>Deleted reminders</h3>
          <button className="x" onClick={onClose} aria-label="Close"><Icon.X /></button>
        </div>
        <div className="modal-body">
          {deleted.length === 0 ? (
            <p className="confirm-msg">No deleted reminders.</p>
          ) : (
            <div className="deleted-list">
              {deleted.map(h => (
                <div key={h.id} className="deleted-row">
                  <div className="deleted-name">
                    {h.name}
                    <span className="deleted-meta">{freqLabel(h.freq)}</span>
                  </div>
                  <button type="button" className="btn tiny" onClick={() => onRestore(h)}>Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function WeekRow({ habit, days, completions, todayISO, editMode, rowEditMode, onToggle, onEdit, onDelete, onToggleHidden, onDeleteSmart, onOpenEvent }) {
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
  // Smart reminders are one-time to-dos. A logged day counts as done and shows
  // a solid star (like a regular habit) even though it isn't a scheduled "due"
  // day, and a completed reminder's past due-date shouldn't read as "missed".
  const isSmart = habit.source === 'gcal-ai'
  const smartCompleted = isSmart && (completions[habit.id]?.length > 0)

  return (
    <div
      className={
        'week-row'
        + (habit.source === 'gcal-ai' ? ' smart-reminder' : '')
        + (habit.hidden ? ' smart-hidden' : '')
      }
    >
      <div className="label">
        <div
          className={'label-text' + (onOpenEvent ? ' clickable' : '')}
          onClick={onOpenEvent ? (e) => onOpenEvent(habit, e) : undefined}
          role={onOpenEvent ? 'button' : undefined}
          tabIndex={onOpenEvent ? 0 : undefined}
          title={onOpenEvent ? 'See the event details' : undefined}
          onKeyDown={onOpenEvent ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenEvent(habit, e) } } : undefined}
        >
          <div className="name">{habit.name}</div>
          <div className="freq-line">
            <span>{freqLabel(habit.freq)}</span>
            <span className="pts-badge">· {habit.points}pt</span>
            {streak > 1 && <span className="streak-badge">· {streak}🔥</span>}
          </div>
        </div>
        {onToggleHidden && (
          <div className="smart-row-actions">
            <button
              type="button"
              className="eye-btn"
              onClick={() => onToggleHidden(habit)}
              aria-label={habit.hidden ? 'Show reminder' : 'Hide reminder'}
            >
              {habit.hidden ? <Icon.EyeSlash /> : <Icon.Eye />}
            </button>
            {onDeleteSmart && (
              <button
                type="button"
                className="eye-btn delete"
                onClick={() => onDeleteSmart(habit)}
                aria-label="Delete reminder"
                title="Delete reminder"
              >
                <Icon.Trash />
              </button>
            )}
          </div>
        )}
        {rowEditMode && (
          <div className="edit-row">
            <button
              type="button"
              className="row-btn edit"
              onClick={() => onEdit(habit)}
              aria-label={`Edit ${habit.name}`}
              title="Edit habit"
            >
              <Icon.Edit />
            </button>
            <button
              type="button"
              className="row-btn delete"
              onClick={() => onDelete(habit)}
              aria-label={`Delete ${habit.name}`}
              title="Delete habit"
            >
              <Icon.Trash />
            </button>
          </div>
        )}
      </div>
      {days.map((d, idx) => {
        const due = isDueOn(habit, d.iso)
        const isFuture = d.iso > todayISO
        const loggedHere = isDoneFor(habit, d.iso, completions)
        // A smart reminder logged on any day counts as done and shows a solid
        // star (it's a one-time to-do, not a scheduled day). A regular habit
        // logged off-schedule stays a faint off-day mark.
        const done = loggedHere && (due || isSmart)
        const offDone = loggedHere && !due && !isSmart
        const filled = done || offDone
        const c = filled ? getCompletion(habit, d.iso, completions) : null
        const bonus = c && typeof c === 'object' && c.bonus
        // Don't flag a completed reminder's past due-date as missed.
        const missed = due && !filled && d.iso < todayISO && !smartCompleted
        const isToday = d.iso === todayISO

        // Interactivity contract:
        //  • normal mode → only an empty, *due*, non-future cell is tappable,
        //    and tapping can only ADD a star (safe, reversible). Filled cells
        //    are inert so a stray tap can't delete a completion.
        //  • edit mode → every non-future cell is tappable and toggles freely,
        //    so you can remove a mis-tap or add an off-schedule star.
        const interactive = isFuture ? false : (editMode ? true : (due && !filled))

        const cls =
          'cell'
          + (!due ? ' not-due' : '')
          + (isFuture ? ' future' : '')
          + (isToday ? ' today' : '')
          + (done ? ' done' : '')
          + (offDone ? ' off-done' : '')
          + (bonus ? ' bonus' : '')
          + (missed ? ' missed' : '')

        let mark = null
        if (filled) {
          mark = <span className={'mark' + (offDone ? ' off' : '')}><Icon.Star /></span>
        } else if (due) {
          mark = <span className="mark dot">·</span>          // due, not yet done
        } else if (interactive) {
          mark = <span className="mark add">+</span>          // edit mode: add off-day star
        }

        return (
          <div key={d.iso} className={cls}>
            {interactive ? (
              <button
                className="cell-btn"
                onClick={(e) => onToggle(habit, d.iso, e)}
                aria-label={filled ? 'remove star' : 'add star'}
                title={
                  filled ? 'Tap to remove'
                  : due ? 'Tap to mark done'
                  : 'Tap to log an off-schedule star'
                }
              >
                {mark}
              </button>
            ) : mark}
          </div>
        )
      })}
      <div className="row-total">
        {rowTotal.earned}<span className="of"> /{rowTotal.possible}</span>
      </div>
    </div>
  )
}
