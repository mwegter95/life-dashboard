import { useEffect, useState } from 'react'
import { Icon } from './Icons.jsx'
import { TaskLibrary } from './TaskLibrary.jsx'
import { CATEGORIES, POINT_SUGGEST } from '../lib/categories.js'
import { DOW_SHORT, toISODate } from '../lib/dates.js'
import { useAppState } from '../state/AppState.jsx'

export function AddHabitModal({
  initial, onSave, onClose, onDelete, defaultTab = 'new', todayISO,
}) {
  const isEdit = !!initial?.id
  const { habits, archivedHabits, completions, setHabitArchived } = useAppState()

  const [name, setName] = useState(initial?.name || '')
  const [category, setCategory] = useState(initial?.category || 'Home')
  const [points, setPoints] = useState(initial?.points ?? 2)
  const [kind, setKind] = useState(initial?.freq?.kind || 'daily')
  const [days, setDays] = useState(initial?.freq?.days || [1, 2, 3, 4, 5])
  const [n, setN] = useState(initial?.freq?.n || 3)
  const [date, setDate] = useState(initial?.freq?.date || toISODate(new Date()))
  const [notes, setNotes] = useState(initial?.notes || '')
  // Editing an existing habit is always the form; only "add" gets the library.
  const [tab, setTab] = useState(isEdit ? 'new' : defaultTab)
  const [fromLibrary, setFromLibrary] = useState(null)

  // Esc inside the library should step back to the form rather than nuking the
  // whole modal — App handles the outer Esc, so only intercept when useful.
  useEffect(() => {
    if (tab !== 'library') return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); setTab('new') }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [tab])

  function applyEntry(entry) {
    setName(entry.name)
    setCategory(CATEGORIES.includes(entry.category) ? entry.category : 'Home')
    setPoints(entry.points ?? 2)
    setNotes(entry.notes || '')
    const k = entry.freq?.kind || 'one_off'
    setKind(k)
    if (k === 'weekdays' && Array.isArray(entry.freq?.days)) setDays(entry.freq.days)
    if (k === 'every_n' && entry.freq?.n) setN(entry.freq.n)
    // A past date would be immediately overdue; start a fresh dated task today.
    if (k === 'date') setDate(toISODate(new Date()))
    setFromLibrary(entry)
    setTab('new')
  }

  function clearLibrarySource() {
    setFromLibrary(null)
  }

  function handleSubmit() {
    if (!name.trim()) return
    let freq
    if (kind === 'daily')        freq = { kind: 'daily' }
    else if (kind === 'weekdays') freq = { kind: 'weekdays', days: [...days].sort() }
    else if (kind === 'every_n')  freq = { kind: 'every_n', n: Math.max(1, +n), anchor: toISODate(new Date()) }
    else if (kind === 'date')     freq = { kind: 'date', date }
    else if (kind === 'one_off')  freq = { kind: 'one_off' }
    onSave({
      id: initial?.id || ('h_' + Math.random().toString(36).slice(2, 9)),
      name: name.trim(),
      category, points: +points, freq, notes,
      created: initial?.created || toISODate(new Date()),
    })
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (tab === 'library' ? ' modal--library' : '')} role="dialog">
        <div className="modal-hd">
          <h3>{isEdit ? 'Edit habit' : 'Add a habit or to-do'}</h3>
          <button className="x" onClick={onClose}><Icon.X /></button>
        </div>

        {!isEdit && (
          <div className="modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'new'}
              className={tab === 'new' ? 'active' : ''}
              onClick={() => setTab('new')}
            ><Icon.Plus /> New</button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'library'}
              className={tab === 'library' ? 'active' : ''}
              onClick={() => setTab('library')}
            ><Icon.Library /> Library</button>
          </div>
        )}

        {tab === 'library' ? (
          <div className="modal-body modal-body--library">
            <TaskLibrary
              habits={habits}
              archivedHabits={archivedHabits}
              completions={completions}
              todayISO={todayISO || toISODate(new Date())}
              onPick={applyEntry}
              onRestore={(entry) => {
                const habit = archivedHabits.find(
                  h => (h.name || '').trim().toLowerCase() === entry.key
                )
                if (habit) { setHabitArchived(habit, false); onClose() }
              }}
            />
          </div>
        ) : (
        <div className="modal-body">
          {fromLibrary && (
            <div className="from-library">
              <Icon.Library />
              <span>From your library · <strong>{fromLibrary.name}</strong></span>
              <button type="button" onClick={clearLibrarySource} aria-label="Clear library source">
                <Icon.X />
              </button>
            </div>
          )}
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. Water the plants"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="row-2">
            <div className="field">
              <label>Category</label>
              <div className="cat-pick">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    className={category === c ? 'on' : ''}
                    onClick={() => setCategory(c)}
                  >{c}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Points · stuff-done score</label>
              <div className="pts-suggest">
                {POINT_SUGGEST.map(p => (
                  <button
                    key={p.v}
                    className={points === p.v ? 'on' : ''}
                    onClick={() => setPoints(p.v)}
                    title={p.label}
                  >{p.v}</button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={points}
                  onChange={e => setPoints(+e.target.value || 1)}
                />
                <span className="label-inline">streak adds multiplier</span>
              </div>
            </div>
          </div>

          <div className="field">
            <label>How often</label>
            <div className="freq-tabs">
              {[
                ['daily',    'Every day'],
                ['weekdays', 'Specific days'],
                ['every_n',  'Every N days'],
                ['date',     'On a date'],
                ['one_off',  'One-off'],
              ].map(([k, l]) => (
                <button
                  key={k}
                  className={kind === k ? 'active' : ''}
                  onClick={() => setKind(k)}
                >{l}</button>
              ))}
            </div>
            {kind === 'weekdays' && (
              <div className="dow" style={{ marginTop: 10 }}>
                {DOW_SHORT.map((d, i) => (
                  <button
                    key={i}
                    className={days.includes(i) ? 'on' : ''}
                    onClick={() =>
                      setDays(days.includes(i) ? days.filter(x => x !== i) : [...days, i])
                    }
                  >{d.slice(0, 2)}</button>
                ))}
              </div>
            )}
            {kind === 'every_n' && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Every</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={n}
                  onChange={e => setN(+e.target.value || 1)}
                  style={{ width: 70 }}
                />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>days, starting today</span>
              </div>
            )}
            {kind === 'date' && (
              <div style={{ marginTop: 10 }}>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
                <div className="hint" style={{ marginTop: 6 }}>
                  Great for birthdays, anniversaries, appointments. We'll surface a reminder 21 days out.
                  Once you check it off it retires to your library the next day.
                </div>
              </div>
            )}
            {kind === 'one_off' && (
              <div className="hint" style={{ marginTop: 10 }}>
                Stays in your reminders until done. No streak penalty. The day
                after you check it off it leaves the calendar and lands in your
                library — the points stay on your score.
              </div>
            )}
          </div>

          <div className="field">
            <label>
              Notes <span style={{ color: 'var(--muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>· optional</span>
            </label>
            <textarea
              rows="2"
              placeholder="When and where? Any cue or context?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        )}

        <div className="modal-foot">
          <div>
            {isEdit && (
              <button
                className="btn ghost"
                onClick={() => onDelete(initial)}
                style={{ color: 'var(--fire)' }}
              >
                <Icon.Trash /> Remove
              </button>
            )}
          </div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            {tab === 'library' ? (
              <button className="btn primary" onClick={() => setTab('new')}>
                Build one from scratch
              </button>
            ) : (
              <button className="btn primary" onClick={handleSubmit} disabled={!name.trim()}>
                {isEdit ? 'Save' : 'Add habit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
