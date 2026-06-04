import http from 'node:http'
import { createMockLifeState } from './fixtures/life-dashboard.mjs'

const port = Number(process.env.PORT || 5050)
const todayISO = new Date().toISOString().slice(0, 10)
const state = createMockLifeState(todayISO)

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  })
  res.end(status === 204 ? '' : JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}) } catch (error) { reject(error) }
    })
  })
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {})
  if (req.method === 'GET' && req.url === '/api/life/state') return send(res, 200, state)
  if (req.method === 'GET' && req.url === '/api/life/gcal/status') {
    return send(res, 200, { configured: false, connected: false })
  }

  const body = await readBody(req)
  if (req.method === 'PUT' && req.url.startsWith('/api/life/habits/')) {
    state.habits = [...state.habits.filter(h => h.id !== body.id), body]
    state.completions[body.id] ||= []
    return send(res, 200, { ok: true, habit: body })
  }
  if (req.method === 'POST' && req.url === '/api/life/completions') {
    const entries = state.completions[body.habit_id] || []
    state.completions[body.habit_id] = [
      ...entries.filter(entry => entry.date !== body.date),
      { date: body.date, scored: body.scored, bonus: !!body.bonus },
    ]
    return send(res, 200, { ok: true })
  }
  if (req.method === 'DELETE' && req.url.startsWith('/api/life/completions/')) {
    const [habitId, date] = req.url.split('/').slice(-2)
    state.completions[habitId] = (state.completions[habitId] || []).filter(entry => entry.date !== date)
    return send(res, 200, { ok: true })
  }
  return send(res, 200, { ok: true })
}).listen(port, '127.0.0.1', () => {
  console.log(`Mock Life Dashboard API listening on http://127.0.0.1:${port}`)
})
