/* Anonymous device token — lets the user save habits before signing in.
   Stored in localStorage so it survives reloads. When they later log in,
   the backend migrates the device's rows to their account via /auth/login
   (passing device_token in the login body). */

const KEY = 'life_dashboard_device_token'

function generate() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Fallback: 24 random hex chars
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

export function getDeviceToken() {
  try {
    let tok = localStorage.getItem(KEY)
    if (!tok) {
      tok = `ld_${generate()}`
      localStorage.setItem(KEY, tok)
    }
    return tok
  } catch {
    return `ld_anon_session`
  }
}
