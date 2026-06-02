/* Backend client for the Life Dashboard slice of mw-backend.
   All requests carry either Authorization: Bearer <jwt> (signed-in) or
   X-Device-Token (anonymous) — the backend's require_owner accepts both
   and namespaces data by (owner_type, owner_id). */

import { getDeviceToken } from './deviceToken.js'

const TOKEN_KEY = 'life_dashboard_auth_token'

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://api.michaelwegter.com'

export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}
export function setAuthToken(tok) {
  try {
    if (tok) localStorage.setItem(TOKEN_KEY, tok)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

function authHeaders() {
  const h = { 'X-Device-Token': getDeviceToken() }
  const tok = getAuthToken()
  if (tok) h['Authorization'] = `Bearer ${tok}`
  return h
}

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) {
    let err
    try { err = await res.json() } catch { err = { error: res.statusText } }
    const e = new Error(err.error || `HTTP ${res.status}`)
    e.status = res.status
    e.detail = err.detail
    throw e
  }
  if (res.status === 204) return null
  return res.json()
}

/* ── Auth ─────────────────────────────────────────────────────────────── */
export async function authRegister(email, password, displayName) {
  const body = {
    email, password,
    display_name: displayName || '',
    device_token: getDeviceToken(),
  }
  const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(body) })
  setAuthToken(data.token)
  return data.user
}

export async function authLogin(email, password) {
  const body = { email, password, device_token: getDeviceToken() }
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(body) })
  setAuthToken(data.token)
  return data.user
}

export async function authMe() {
  if (!getAuthToken()) return null
  try {
    const { user } = await request('/auth/me')
    return user
  } catch (e) {
    if (e.status === 401) setAuthToken('')
    return null
  }
}

export function authLogout() {
  setAuthToken('')
}

/* ── Life Dashboard state ─────────────────────────────────────────────── */
export function fetchState() {
  return request('/api/life/state')
}

export function putHabit(habit) {
  return request(`/api/life/habits/${encodeURIComponent(habit.id)}`, {
    method: 'PUT',
    body: JSON.stringify(habit),
  })
}

export function deleteHabit(habitId) {
  return request(`/api/life/habits/${encodeURIComponent(habitId)}`, {
    method: 'DELETE',
  })
}

export function postCompletion({ habit_id, date, scored, bonus }) {
  return request('/api/life/completions', {
    method: 'POST',
    body: JSON.stringify({ habit_id, date, scored, bonus }),
  })
}

export function deleteCompletion(habitId, date) {
  return request(
    `/api/life/completions/${encodeURIComponent(habitId)}/${encodeURIComponent(date)}`,
    { method: 'DELETE' }
  )
}

export function putReflection(date, text) {
  return request(`/api/life/reflections/${encodeURIComponent(date)}`, {
    method: 'PUT',
    body: JSON.stringify({ text }),
  })
}

export function putMantra(text) {
  return request('/api/life/mantra', {
    method: 'PUT',
    body: JSON.stringify({ mantra: text }),
  })
}

/* ── Google Calendar + AI smart reminders ─────────────────────────────── */
export function gcalStatus() {
  return request('/api/life/gcal/status')
}
export async function gcalConnectUrl() {
  const { auth_url } = await request('/api/life/gcal/connect')
  return auth_url
}
export function gcalDisconnect() {
  return request('/api/life/gcal/disconnect', { method: 'POST' })
}
export function gcalEvents(days = 90) {
  return request(`/api/life/gcal/events?days=${days}`)
}
export function generateSmartTasks() {
  return request('/api/life/smart-tasks/generate', { method: 'POST' })
}

export function patchSmartHidden(habitId, hidden) {
  return request(`/api/life/smart-tasks/${encodeURIComponent(habitId)}/hidden`, {
    method: 'PATCH',
    body: JSON.stringify({ hidden }),
  })
}
