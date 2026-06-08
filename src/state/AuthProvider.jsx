import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as api from '../lib/api.js'
import { whenEmbedTokenReady } from '../lib/embedAuth.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    // Development-only shortcut: if LIFE_DEV_USER is set in localStorage,
    // treat the app as already logged-in with that user object. This lets
    // us reproduce post-login UI without calling the real backend.
    if (import.meta.env.DEV) {
      try {
        const dev = localStorage.getItem('LIFE_DEV_USER')
        if (dev) {
          setUser(JSON.parse(dev))
          setBootstrapping(false)
          return
        }
      } catch (e) {
        // fall through to normal authMe
      }
    }

    let cancelled = false
    // Wait for the embedded-token handshake (no-op / instant when not embedded)
    // so a token recovered from the parent shell is in place before authMe.
    whenEmbedTokenReady()
      .then(() => api.authMe())
      .then(u => {
        if (!cancelled) {
          setUser(u || null)
          setBootstrapping(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email, password) => {
    const u = await api.authLogin(email, password)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (email, password, displayName) => {
    const u = await api.authRegister(email, password, displayName)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    api.authLogout()
    setUser(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ user, bootstrapping, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>')
  return v
}
