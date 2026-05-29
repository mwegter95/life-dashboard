/* Theme (light / dark) persistence + application.
   The `.dark` class on <html> flips the token palette defined in tokens.css.
   Applied once in main.jsx before first paint (no flash), then toggled live
   from the Topbar. */

const KEY = 'ld-theme'

export function getStoredTheme() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

/* Saved choice wins; otherwise follow the OS preference. */
export function getInitialTheme() {
  const stored = getStoredTheme()
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

/* Reflect a theme into the DOM (class + native color-scheme) without persisting. */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

/* Apply + persist (used by the toggle). */
export function setTheme(theme) {
  applyTheme(theme)
  try { localStorage.setItem(KEY, theme) } catch { /* ignore quota / privacy mode */ }
}
