import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthProvider, useAuth } from './state/AuthProvider.jsx'
import { AppStateProvider, useAppState } from './state/AppState.jsx'
import { Topbar } from './components/Topbar.jsx'
import { TodayPanel } from './components/TodayPanel.jsx'
import { WeekGrid } from './components/WeekGrid.jsx'
import { RemindersStrip } from './components/RemindersStrip.jsx'
import { StatsPanel } from './components/StatsPanel.jsx'
import { BadgesPanel } from './components/BadgesPanel.jsx'
import { ReflectionCard } from './components/ReflectionCard.jsx'
import { AddHabitModal } from './components/AddHabitModal.jsx'
import { ConfirmModal } from './components/ConfirmModal.jsx'
import { MantraCard } from './components/MantraCard.jsx'
import { CalendarPanel } from './components/CalendarPanel.jsx'
import { Toasts } from './components/Toasts.jsx'
import { FxCanvas } from './components/FxCanvas.jsx'
import { AuthChip, AuthModal } from './components/AuthModal.jsx'
import {
  toISODate, fromISODate, addDays, startOfWeek, fmtDateStr,
} from './lib/dates.js'
import {
  isDueOn, isDoneFor, getCompletion, computeStreak,
} from './lib/frequency.js'
import {
  scoreCompletion, dayScore, possibleForDay, BONUS_ROLL_CHANCE,
} from './lib/scoring.js'
import { levelFor } from './lib/levels.js'

const TOAST_TTL = 2200
const MAX_TOASTS = 4

function ToastHost({ children }) {
  // Provides a pushToast function via context-less prop drilling — App owns the list
  return children
}

function AppShell() {
  const { bootstrapping } = useAuth()
  const [toasts, setToasts] = useState([])
  const pushToast = useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(ts => [...ts.slice(-MAX_TOASTS + 1), { id, msg, ...opts }])
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), TOAST_TTL)
  }, [])

  if (bootstrapping) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        color: 'var(--muted)', fontFamily: 'Geist Mono, monospace', fontSize: 13,
      }}>Loading…</div>
    )
  }

  return (
    <AppStateProvider onError={(msg) => pushToast(msg)}>
      <Dashboard toasts={toasts} pushToast={pushToast} />
    </AppStateProvider>
  )
}

function Dashboard({ toasts, pushToast }) {
  const state = useAppState()
  const { habits, completions, reflections, mantra, loading, error } = state

  const [todayISO, setTodayISO] = useState(() => toISODate(new Date()))
  const [modal, setModal] = useState(null)        // null | { mode, habit? }
  const [confirmDelete, setConfirmDelete] = useState(null) // null | habit
  const [authOpen, setAuthOpen] = useState(false)
  const [fx, setFx] = useState(null)

  /* Update todayISO at midnight without requiring a reload. */
  useEffect(() => {
    const tick = () => setTodayISO(toISODate(new Date()))
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  /* Handle the Google Calendar OAuth return (?gcal=connected|error). */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gcal = params.get('gcal')
    if (!gcal) return
    if (gcal === 'connected') {
      pushToast('Google Calendar connected — generating smart reminders…')
      // The first generation runs server-side; pull it in shortly.
      setTimeout(() => state.refresh(), 6000)
    } else if (gcal === 'error') {
      pushToast("Couldn't connect Google Calendar — please try again")
    }
    params.delete('gcal')
    const qs = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash)
  }, [])

  /* Derived stats */
  const possibleToday = possibleForDay(habits, todayISO)
  const scoreToday    = dayScore(habits, completions, todayISO)
  const scoreYesterday = dayScore(habits, completions, toISODate(addDays(fromISODate(todayISO), -1)))
  const weekStartISO   = toISODate(startOfWeek(fromISODate(todayISO), true))
  const lastWeekStartISO = toISODate(addDays(fromISODate(weekStartISO), -7))

  const scoreThisWeek = useMemo(() => {
    let s = 0
    for (let i = 0; i < 7; i++) {
      s += dayScore(habits, completions, toISODate(addDays(fromISODate(weekStartISO), i)))
    }
    return s
  }, [habits, completions, weekStartISO])

  const scoreLastWeek = useMemo(() => {
    let s = 0
    for (let i = 0; i < 7; i++) {
      s += dayScore(habits, completions, toISODate(addDays(fromISODate(lastWeekStartISO), i)))
    }
    return s
  }, [habits, completions, lastWeekStartISO])

  const totalScore = useMemo(() => {
    let s = 0
    Object.values(completions).forEach(arr =>
      arr.forEach(c => s += (typeof c === 'object' ? c.scored : 0))
    )
    return s
  }, [completions])

  const bestDay = useMemo(() => {
    const m = new Map()
    Object.entries(completions).forEach(([hid, arr]) => {
      const habit = habits.find(h => h.id === hid)
      if (!habit) return
      arr.forEach(c => {
        const date = typeof c === 'string' ? c : c.date
        const pts = typeof c === 'object' ? c.scored : habit.points
        m.set(date, (m.get(date) || 0) + pts)
      })
    })
    return [...m.values()].reduce((a, b) => Math.max(a, b), 0)
  }, [completions, habits])

  const longestStreak = useMemo(() => (
    habits.reduce((m, h) => Math.max(m, computeStreak(h, completions, todayISO)), 0)
  ), [habits, completions, todayISO])

  const totalCompletions = useMemo(() => (
    Object.values(completions).reduce((s, a) => s + a.length, 0)
  ), [completions])

  const perfectDays = useMemo(() => {
    let n = 0
    for (let i = 0; i < 60; i++) {
      const iso = toISODate(addDays(new Date(), -i))
      const due = habits.filter(h => isDueOn(h, iso))
      if (due.length === 0) continue
      if (due.every(h => isDoneFor(h, iso, completions))) n++
    }
    return n
  }, [habits, completions])

  const stats = {
    totalScore, totalCompletions, longestStreak,
    perfectDays, perfectWeeks: 0,
  }
  const lvl = levelFor(totalScore)
  const dateStr = fmtDateStr(fromISODate(todayISO))

  /* ── interactions ── */
  const toggleHabit = useCallback(async (habit, dateISO, evt) => {
    const existing = getCompletion(habit, dateISO, completions)
    if (existing) {
      state.removeCompletion(habit.id, existing)
      return
    }
    const streakBefore = computeStreak(
      habit, completions,
      toISODate(addDays(fromISODate(dateISO), -1))
    )
    const bonus = Math.random() < BONUS_ROLL_CHANCE
    const scored = scoreCompletion(habit, streakBefore, bonus)
    const completion = { date: dateISO, scored, bonus }

    const lvlBefore = levelFor(totalScore)
    const lvlAfter  = levelFor(totalScore + scored)
    const leveled = lvlAfter.idx > lvlBefore.idx

    pushToast(
      leveled ? `Level up! ${lvlAfter.cur.name}` :
      bonus   ? `Bonus! ${habit.name}` :
                `Nice — ${habit.name}`,
      { pts: scored, bonus: bonus || leveled }
    )

    const rect = evt?.currentTarget?.getBoundingClientRect?.()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    setFx({ x, y, heavy: bonus || leveled, t: Date.now() })

    state.addCompletion(habit.id, completion)
  }, [state, completions, totalScore, pushToast])

  const saveHabit = useCallback((h) => {
    state.upsertHabit(h)
    setModal(null)
    pushToast('Saved')
  }, [state, pushToast])

  // Ask first — a styled confirmation modal replaces the native confirm().
  const requestDelete = useCallback((h) => setConfirmDelete(h), [])
  const confirmDeleteHabit = useCallback(() => {
    if (!confirmDelete) return
    state.deleteHabit(confirmDelete.id)
    setConfirmDelete(null)
    setModal(null)       // also close the edit modal if delete came from there
    pushToast('Deleted')
  }, [state, confirmDelete, pushToast])

  /* Keyboard: 'n' to add, Esc to close modal. */
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !typing) {
        e.preventDefault()
        setModal({ mode: 'add' })
      }
      if (e.key === 'Escape') {
        if (confirmDelete) setConfirmDelete(null)
        else if (modal) setModal(null)
        else if (authOpen) setAuthOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, authOpen, confirmDelete])

  if (loading && habits.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        color: 'var(--muted)', fontFamily: 'Geist Mono, monospace', fontSize: 13,
      }}>Loading your dashboard…</div>
    )
  }

  return (
    <div className="app">
      <Topbar
        dateStr={dateStr}
        scoreToday={scoreToday}
        possibleToday={possibleToday}
        totalScore={totalScore}
        currentStreak={longestStreak}
        level={lvl}
        onAdd={() => setModal({ mode: 'add' })}
        authSlot={<AuthChip onOpenAuth={() => setAuthOpen(true)} />}
      />

      <main className="main">
        <MantraCard mantra={mantra} onSave={state.setMantra} />
        <TodayPanel
          habits={habits}
          completions={completions}
          todayISO={todayISO}
          dateStr={dateStr}
          onToggle={toggleHabit}
          starStyle="star"
          scoreToday={scoreToday}
          possibleToday={possibleToday}
        />

        <div>
          <RemindersStrip
            habits={habits}
            completions={completions}
            todayISO={todayISO}
            onToggle={toggleHabit}
          />
          <WeekGrid
            habits={habits}
            completions={completions}
            weekStartISO={weekStartISO}
            todayISO={todayISO}
            onToggle={toggleHabit}
            onEdit={(h) => setModal({ mode: 'edit', habit: h })}
            onDelete={requestDelete}
          />
          <div style={{
            padding: '14px 4px 0',
            display: 'flex',
            justifyContent: 'space-between',
            color: 'var(--muted)',
            fontSize: 11.5,
          }}>
            <div className="help-row">
              <span><span className="kbd">Tap</span> to check off</span>
              <span><span className="kbd">+</span> add habit</span>
              <span><span className="kbd">Edit rows</span> to change or remove</span>
            </div>
            <span style={{ fontFamily: 'Geist Mono, monospace' }}>
              press <span className="kbd">N</span> to add
            </span>
          </div>
          {error && (
            <div className="error-line" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <CalendarPanel pushToast={pushToast} onGenerated={state.refresh} />
          <StatsPanel
            scoreToday={scoreToday}
            scoreYesterday={scoreYesterday}
            scoreThisWeek={scoreThisWeek}
            scoreLastWeek={scoreLastWeek}
            totalScore={totalScore}
            bestDay={bestDay}
            longestStreak={longestStreak}
            possibleToday={possibleToday}
          />
          <BadgesPanel stats={stats} />
          <div className="panel">
            <div className="panel-hd">
              <h2>Reflect</h2>
              <span className="sub">end of day</span>
            </div>
            <ReflectionCard
              value={reflections[todayISO] || ''}
              onChange={(text) => state.setReflection(todayISO, text)}
              todayISO={todayISO}
            />
          </div>
        </div>
      </main>

      {modal && (
        <AddHabitModal
          initial={modal.habit}
          onSave={saveHabit}
          onClose={() => setModal(null)}
          onDelete={requestDelete}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Are you sure you want to delete?"
          message={`"${confirmDelete.name}" and its history will be permanently removed. This can't be undone.`}
          confirmLabel="Delete habit"
          onConfirm={confirmDeleteHabit}
          onClose={() => setConfirmDelete(null)}
        />
      )}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          defaultMode="login"
        />
      )}

      <Toasts items={toasts} />
      <FxCanvas trigger={fx} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
