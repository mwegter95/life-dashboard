import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyTheme, getInitialTheme } from './lib/theme.js'

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

/* Apply the saved / system theme before first paint to avoid a light-mode flash. */
applyTheme(getInitialTheme())

/* ── Embed-mode height broadcaster ──────────────────────────────────────────
 * When this app is iframed (e.g. inside michaelwegter.com/apps/life-dashboard),
 * iOS Safari refuses to scroll the iframe smoothly past its visible bounds —
 * users have to stop, pause, then scroll again to reach content near the
 * bottom of the dashboard (the reflection area). Workaround: tell the parent
 * page our actual document height via postMessage so it can size the iframe
 * to fit the content. With no internal iframe scroll, the parent's normal
 * page scroll handles everything and the bug disappears.
 *
 * Only fires when window.parent !== window (i.e. we ARE embedded).
 */
if (typeof window !== 'undefined' && window.parent !== window) {
  // Mark embedded so CSS can drop `.app { min-height: 100vh }`. Otherwise the
  // app is always ≥ the (parent-controlled) iframe height, scrollHeight gets
  // floored at the viewport, and the reported height can only grow — leaving
  // stale blank space and a stretched mantra after collapsing the Hidden list.
  document.documentElement.classList.add('embedded')
  const postHeight = () => {
    // Measure the ACTUAL rendered content height (not documentElement.scrollHeight,
    // which is floored by the iframe viewport) so the height shrinks too.
    const h = Math.ceil(
      document.body?.getBoundingClientRect().height || document.body?.scrollHeight || 0
    )
    if (h) window.parent.postMessage({ type: 'life-dashboard:height', height: h }, '*')
  }
  // Fire often during load (fonts, async data) and any time the DOM resizes.
  const ro = new ResizeObserver(postHeight)
  window.addEventListener('load', postHeight)
  window.addEventListener('resize', postHeight)
  window.addEventListener('message', (e) => {
    const d = e.data
    if (!d || typeof d !== 'object' || d.type !== 'appframe:viewport') return
    const top = Number.isFinite(d.top) ? Math.max(0, d.top) : 0
    const height = Number.isFinite(d.height) && d.height > 0 ? d.height : window.innerHeight
    document.documentElement.style.setProperty('--embed-viewport-top', `${Math.round(top)}px`)
    document.documentElement.style.setProperty('--embed-viewport-height', `${Math.round(height)}px`)
  })
  // Wait for the body to exist (StrictMode mounts after this script tag runs).
  queueMicrotask(() => {
    if (document.body) ro.observe(document.body)
    postHeight()
  })
  // Belt-and-suspenders: a slow tick catches DOM changes ResizeObserver misses
  // (e.g. images / iframes loading async, modals opening).
  setInterval(postHeight, 1000)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
