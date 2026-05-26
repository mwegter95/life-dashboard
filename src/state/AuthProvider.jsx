import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as api from '../lib/api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.authMe().then(u => {
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
