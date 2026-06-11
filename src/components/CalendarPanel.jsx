import { useCallback, useEffect, useState } from 'react'
import * as api from '../lib/api.js'

/* Google Calendar connection + upcoming-events list. AI smart reminders are
   generated server-side (on connect + on a daily schedule) and flow into the
   dashboard's normal dated-reminders UI — this panel just connects the account,
   shows what's coming up, and offers a manual "refresh reminders" trigger. */
export function CalendarPanel({ pushToast, onGenerated }) {
  const [status, setStatus] = useState(null)   // null = loading; {} = loaded
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState('')
  const [generating, setGenerating] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const s = await api.gcalStatus()
      setStatus(s)
      return s
    } catch {
      setStatus({ configured: false, connected: false })
      return null
    }
  }, [])

  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const { events: evs } = await api.gcalEvents(90)
      setEvents(evs || [])
      setEventsError('')
    } catch (e) {
      setEvents([])
      setEventsError(e.message || 'Could not fetch Google Calendar events.')
    } finally {
      setEventsLoading(false)
    }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  // After the OAuth tab completes, re-check connection when we regain focus.
  useEffect(() => {
    const onFocus = () => loadStatus()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [loadStatus])

  // Load events whenever we become connected.
  useEffect(() => {
    if (status?.connected) loadEvents()
  }, [status?.connected, loadEvents])

  const connect = async () => {
    try {
      const url = await api.gcalConnectUrl()
      // OAuth must run top-level (Google blocks it in an iframe), so open a tab.
      window.open(url, '_blank', 'noopener,noreferrer')
      pushToast?.('Opening Google sign-in…')
    } catch (e) {
      pushToast?.(e.message || 'Could not start Google connect')
    }
  }

  const disconnect = async () => {
    try {
      await api.gcalDisconnect()
      setEvents([])
      await loadStatus()
      pushToast?.('Disconnected Google Calendar')
    } catch (e) {
      pushToast?.(e.message || 'Disconnect failed')
    }
  }

  const regenerate = async () => {
    setGenerating(true)
    try {
      const res = await api.generateSmartTasks()
      pushToast?.(
        res.skipped
          ? 'No calendar events found — smart reminders left unchanged'
          : `Smart reminders updated (${res.created_or_updated || 0})`
      )
      await Promise.all([loadStatus(), loadEvents()])
      onGenerated?.()   // pull the new dated reminders into the dashboard
    } catch (e) {
      pushToast?.(e.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  if (status === null) {
    return (
      <div className="panel">
        <div className="panel-hd"><h2>Calendar</h2></div>
        <div className="cal-empty">Loading…</div>
      </div>
    )
  }

  if (!status.configured) {
    return (
      <div className="panel">
        <div className="panel-hd"><h2>Calendar</h2></div>
        <div className="cal-empty">Calendar sync isn’t set up on the server yet.</div>
      </div>
    )
  }

  if (!status.connected) {
    return (
      <div className="panel">
        <div className="panel-hd">
          <h2>Calendar</h2>
          <span className="sub">smart reminders</span>
        </div>
        <div className="cal-connect">
          <p className="cal-blurb">
            Connect Google Calendar to see what’s coming up and get AI-suggested
            reminders for birthdays, trips, and milestones.
          </p>
          <button className="btn primary" onClick={connect}>Connect Google Calendar</button>
        </div>
      </div>
    )
  }

  const upcoming = events.slice(0, 8)
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Calendar</h2>
        <span className="sub">{status.email || 'connected'}</span>
      </div>
      <div className="cal-actions">
        <button className="btn tiny primary" onClick={regenerate} disabled={generating}>
          {generating ? 'Thinking…' : '✨ Refresh smart reminders'}
        </button>
        <button className="btn tiny ghost cal-disconnect" onClick={disconnect}>Disconnect</button>
      </div>
      <div className="cal-list">
        {eventsLoading && <div className="cal-empty">Loading events…</div>}
        {!eventsLoading && eventsError && (
          <div className="cal-empty">{eventsError} Try reconnecting Google Calendar.</div>
        )}
        {!eventsLoading && !eventsError && upcoming.length === 0 && (
          <div className="cal-empty">Nothing upcoming in the next 3 months.</div>
        )}
        {upcoming.map(ev => (
          <div key={ev.calendarId + ':' + ev.id} className="cal-event">
            <span className="cal-date">{fmtEventDate(ev)}</span>
            <span className="cal-title">{ev.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function fmtEventDate(ev) {
  // ev.start is YYYY-MM-DD (all-day) or an ISO datetime.
  const d = new Date(ev.allDay ? ev.start + 'T00:00:00' : ev.start)
  if (isNaN(d)) return ev.date
  const opts = ev.allDay
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  return d.toLocaleString(undefined, opts)
}
