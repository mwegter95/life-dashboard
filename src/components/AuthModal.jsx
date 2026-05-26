import { useState } from 'react'
import { Icon } from './Icons.jsx'
import { useAuth } from '../state/AuthProvider.jsx'

export function AuthModal({ onClose, defaultMode = 'login' }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setErr('')
    if (!email.trim() || password.length < 8) {
      setErr('Email and a password ≥ 8 chars required.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), password, name.trim())
      onClose()
    } catch (e) {
      setErr(e.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" style={{ maxWidth: 420 }}>
        <div className="modal-hd">
          <h3>{mode === 'login' ? 'Sign in' : 'Create account'}</h3>
          <button className="x" onClick={onClose}><Icon.X /></button>
        </div>
        <div className="modal-body">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
          </div>

          {mode === 'register' && (
            <div className="field">
              <label>Display name</label>
              <input
                type="text"
                placeholder="What should we call you?"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
            <div className="hint">8+ characters. Your anonymous habits will move to your account.</div>
          </div>

          {err && <div className="error-line">{err}</div>}
        </div>
        <div className="modal-foot">
          <div />
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={submit} disabled={busy}>
              {busy ? '…' : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthChip({ onOpenAuth }) {
  const { user, logout } = useAuth()
  if (user) {
    return (
      <span className="auth-chip" title={user.email}>
        <span className="who">{user.display_name || user.email}</span>
        <button onClick={logout}>Sign out</button>
      </span>
    )
  }
  return (
    <button className="auth-chip" onClick={onOpenAuth}>
      <span className="who">Anonymous</span>
      <span style={{ color: 'var(--ink)' }}>Sign in</span>
    </button>
  )
}
