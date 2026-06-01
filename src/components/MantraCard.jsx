import { useEffect, useRef, useState } from 'react'

/* A single short personal mantra shown at the very top of the dashboard.
   Click/tap to edit; Enter or blur saves, Esc cancels. Persisted per-user
   through AppState.setMantra (optimistic, rolls back on failure). */
export function MantraCard({ mantra, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(mantra || '')
  const inputRef = useRef(null)

  // Keep the draft in sync if the mantra loads (or changes elsewhere) while
  // we're not actively editing it.
  useEffect(() => { if (!editing) setDraft(mantra || '') }, [mantra, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const next = draft.trim()
    if (next !== (mantra || '')) onSave(next)
    setEditing(false)
  }
  const cancel = () => {
    setDraft(mantra || '')
    setEditing(false)
  }
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    else if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  return (
    <div className={'mantra' + (editing ? ' editing' : '') + (!mantra && !editing ? ' empty' : '')}>
      <span className="mantra-label">Mantra</span>
      {editing ? (
        <input
          ref={inputRef}
          className="mantra-input"
          value={draft}
          maxLength={140}
          placeholder="What are you about today?"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
      ) : (
        <button
          type="button"
          className="mantra-display"
          onClick={() => setEditing(true)}
          title="Edit your mantra"
        >
          {mantra
            ? <span className="mantra-text">“{mantra}”</span>
            : <span className="mantra-placeholder">Set a mantra…</span>}
          <span className="mantra-edit" aria-hidden="true">✎</span>
        </button>
      )}
    </div>
  )
}
