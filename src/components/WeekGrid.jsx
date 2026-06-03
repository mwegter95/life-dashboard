import { useMemo, useState } from 'react'
import {
  isDueOn, isDoneFor, getCompletion, freqLabel, computeStreak,
} from '../lib/frequency.js'
import { addDays, fromISODate, toISODate, fmtWeekRange, DOW_INITIAL } from '../lib/dates.js'
import { Icon } from './Icons.jsx'
import { useAppState } from '../state/AppState.jsx'

export function WeekGrid({
  habits, completions, weekStartISO, todayISO, onToggle, onEdit, onDelete,
  onPrevWeek, onNextWeek,
}) {
  const { toggleSmartHidden, setSmartDeleted } = useAppState()
  const [showDeleted, setShowDeleted] = useState(false)              // deleted-list modal
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

  const regularHabits = habits.filter(h => h.source !== 'gcal-ai')
  const smartHabits   = habits.filter(h => h.source === 'gcal-ai' && !h.deleted)
  const visibleSmart  = smartHabits.filter(h => !h.hidden)
  const hiddenSmart   = smartHabits.filter(h => h.hidden)
  const deletedSmart  = habits.filter(h => h.source === 'gcal-ai' && h.deleted)

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
              onClick={() => setShowDeleted(true)}
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
        />
      ))}
      <div className="week-foot">
        <span>{habits.length} tracked</span>
        <span>{weekTotals.earned} / {weekTotals.possible} pts</span>
      </div>
      </div>

      {showDeleted && (
        <DeletedModal
          deleted={deletedSmart}
          onRestore={(h) => setSmartDeleted(h, false)}
          onClose={() => setShowDeleted(false)}
        />
      )}
    </>
  )
}

function DeletedModal({ deleted, onRestore, onClose }) {
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
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

function WeekRow({ habit, days, completions, todayISO, editMode, rowEditMode, onToggle, onEdit, onDelete, onToggleHidden, onDeleteSmart }) {
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
    <div className={'week-row' + (habit.hidden ? ' smart-hidden' : '')}>
      <div className="label">
        <div className="label-text">
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
        const done = due && loggedHere
        // An off-day completion: a day the habit wasn't due but was logged
        // anyway (e.g. a Sunday habit done on Thursday). Show it faintly so
        // the credit is visible in the grid.
        const offDone = !due && loggedHere
        const filled = done || offDone
        const c = filled ? getCompletion(habit, d.iso, completions) : null
        const bonus = c && typeof c === 'object' && c.bonus
        const missed = due && !filled && d.iso < todayISO
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
