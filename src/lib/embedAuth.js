/* ── Embedded-app auth bridge ────────────────────────────────────────────────
 * This app is embedded in an iframe on michaelwegter.com, but served from a
 * different origin (mwegter95.github.io). Safari treats that iframe's
 * localStorage as third-party storage and evicts it well before the login
 * token's 7-day life is up — so the user gets logged out every day or two.
 *
 * Fix: mirror the login token to/from the FIRST-PARTY parent page (which is
 * not subject to third-party eviction). The parent keeps the token in its own
 * localStorage and hands it back when this app boots. See AppFrame.jsx on
 * michaelwegter.com for the parent half of this protocol.
 *
 * We adopt the recovered token in place and let the normal auth bootstrap use
 * it (the bootstrap waits on whenEmbedTokenReady()) — deliberately NOT a page
 * reload, which could re-fetch state mid-action and revert optimistic edits.
 *
 * Protocol (postMessage):
 *   iframe → parent  { type:'mw-embed-auth', action:'request' }   (no secret)
 *   iframe → parent  { type:'mw-embed-auth', action:'set', token }
 *   iframe → parent  { type:'mw-embed-auth', action:'clear' }
 *   parent → iframe  { type:'mw-embed-auth', action:'token', token }
 */

const NS = 'mw-embed-auth'

// Token-bearing messages are posted ONLY to these first-party parent origins
// (never '*'), so a page that embeds this app can't skim the login token. The
// live parent origin is captured from the handshake below when available.
const PARENT_ORIGINS = ['https://michaelwegter.com', 'https://www.michaelwegter.com']
let knownParentOrigin = null

// Resolves once the parent has answered (or we time out / aren't embedded), so
// the auth bootstrap can wait for a recovered token before deciding logged-out.
let started = false
let resolveReady
const readyPromise = new Promise((res) => { resolveReady = res })

function isEmbedded() {
  try { return window.parent && window.parent !== window } catch { return false }
}

// Only accept downstream messages from the real parent shell.
function parentAllowed(origin) {
  try {
    const h = new URL(origin).hostname
    return h === 'michaelwegter.com' || h === 'www.michaelwegter.com' ||
           h === 'localhost' || h === '127.0.0.1'
  } catch { return false }
}

// Post a token-bearing message to the trusted parent origin(s) only.
function postToParent(msg) {
  if (!isEmbedded()) return
  const targets = knownParentOrigin ? [knownParentOrigin] : PARENT_ORIGINS
  for (const origin of targets) {
    try { window.parent.postMessage(msg, origin) } catch {}
  }
}

/** Mirror a token change up to the parent vault. Pass the new token after a
 *  login, or null after a logout. */
export function syncTokenToParent(token) {
  postToParent(token ? { type: NS, action: 'set', token } : { type: NS, action: 'clear' })
}

/** Resolves when the embedded-token handshake has settled (or immediately when
 *  not embedded). The auth bootstrap awaits this so a token recovered from the
 *  parent is in place before authMe() runs. */
export function whenEmbedTokenReady() {
  return readyPromise
}

/** On embedded boot, ask the parent vault for the token and adopt it locally if
 *  ours was evicted (or is stale). No reload — the bootstrap waits on
 *  whenEmbedTokenReady() and then reads the freshly-stored token. */
export function hydrateTokenFromParent(tokenKey) {
  if (!isEmbedded()) { resolveReady?.(); return }
  if (started) return
  started = true
  let settled = false
  const finish = () => {
    if (settled) return
    settled = true
    window.removeEventListener('message', onMsg)
    resolveReady?.()
  }
  const onMsg = (e) => {
    if (!parentAllowed(e.origin)) return
    const d = e.data
    if (!d || d.type !== NS || d.action !== 'token') return
    knownParentOrigin = e.origin   // trust this origin for future token messages
    let local = null
    try { local = localStorage.getItem(tokenKey) } catch {}
    if (d.token) {
      if (d.token !== local) {
        try { localStorage.setItem(tokenKey, d.token) } catch {}
      }
    } else if (local) {
      // Parent vault is empty but we're logged in here — seed it so the session
      // survives the next eviction.
      syncTokenToParent(local)
    }
    finish()
  }
  window.addEventListener('message', onMsg)
  // The request carries no token, so '*' is fine here; the parent authenticates
  // us by origin + source window, and we only trust origin-validated replies.
  try { window.parent.postMessage({ type: NS, action: 'request' }, '*') } catch {}
  // Don't block boot forever if the parent never answers.
  setTimeout(finish, 1500)
}
