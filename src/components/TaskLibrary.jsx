import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { freqLabel } from '../lib/frequency.js'
import {
  ORIGIN_LABEL, SORTS, buildLibrary, filterLibrary, fmtLastDone,
  libraryCategories, sortLibrary,
} from '../lib/library.js'

/* The library picker: every task you've finished or put away, one card each,
   ready to be pulled back onto the plan. Picking a card doesn't revive the old
   habit — it hands its shape (name, category, points, cadence, notes) to the
   New-task form so you can adjust before adding. */
export function TaskLibrary({
  habits, archivedHabits, completions, todayISO, onPick, onRestore,
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('recent')
  const searchRef = useRef(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  const all = useMemo(
    () => buildLibrary({ habits, archivedHabits, completions, todayISO }),
    [habits, archivedHabits, completions, todayISO]
  )
  const categories = useMemo(() => libraryCategories(all), [all])
  const shown = useMemo(
    () => sortLibrary(filterLibrary(all, { query, category }), sort),
    [all, query, category, sort]
  )

  // A category chip that stops matching anything shouldn't strand the list.
  useEffect(() => {
    if (!categories.includes(category)) setCategory('All')
  }, [categories, category])

  if (all.length === 0) {
    return (
      <div className="lib-empty">
        <div className="lib-empty-glyph">✦</div>
        <p className="lib-empty-title">Your library is empty — for now.</p>
        <p className="lib-empty-sub">
          Finish a one-off task, or remove a habit from your plan, and it lands
          here so you can pick it back up in one tap.
        </p>
      </div>
    )
  }

  return (
    <div className="lib">
      <div className="lib-controls">
        <div className="lib-search">
          <Icon.Search />
          <input
            ref={searchRef}
            type="text"
            value={query}
            placeholder="Search your past tasks…"
            onChange={e => setQuery(e.target.value)}
            aria-label="Search the task library"
          />
          {query && (
            <button
              type="button"
              className="lib-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            ><Icon.X /></button>
          )}
        </div>
        <div className="lib-sort" role="group" aria-label="Sort library">
          {SORTS.map(s => (
            <button
              key={s.id}
              type="button"
              className={sort === s.id ? 'on' : ''}
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {categories.length > 2 && (
        <div className="lib-cats">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              className={category === c ? 'on' : ''}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >{c}</button>
          ))}
        </div>
      )}

      <div className="lib-count">
        {shown.length} {shown.length === 1 ? 'task' : 'tasks'}
        {category !== 'All' && <span> in {category}</span>}
      </div>

      {shown.length === 0 ? (
        <div className="lib-noresults">
          Nothing matches “{query}”.
        </div>
      ) : (
        <div className="lib-grid">
          {shown.map(entry => (
            <LibraryCard
              key={entry.key}
              entry={entry}
              onPick={onPick}
              onRestore={onRestore}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LibraryCard({ entry, onPick, onRestore }) {
  const { name, category, points, timesCompleted, lastDone, origin, tracking } = entry
  const disabled = tracking
  return (
    <div
      className={'lib-card' + (disabled ? ' tracking' : '')}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      onClick={disabled ? undefined : () => onPick(entry)}
      onKeyDown={disabled ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(entry) }
      }}
      title={disabled ? 'Already on your plan' : `Add “${name}” again`}
    >
      <div className="lib-card-top">
        <span className={'lib-origin lib-origin--' + origin}>{ORIGIN_LABEL[origin]}</span>
        <span className="lib-pts">{points}pt</span>
      </div>
      <div className="lib-card-name">{name}</div>
      <div className="lib-card-meta">
        <span className="lib-cat">{category}</span>
        <span className="lib-dot">·</span>
        <span>{freqLabel(entry.freq)}</span>
      </div>
      <div className="lib-card-stats">
        {timesCompleted > 0
          ? <>Done {timesCompleted}× <span className="lib-dot">·</span> last {fmtLastDone(lastDone)}</>
          : <>Never finished</>}
      </div>
      <div className="lib-card-cta">
        {disabled
          ? <span className="lib-tracking">On your plan</span>
          : <span className="lib-use"><Icon.Plus /> Add again</span>}
      </div>
      {origin === 'archived' && onRestore && !disabled && (
        <button
          type="button"
          className="lib-restore"
          onClick={(e) => { e.stopPropagation(); onRestore(entry) }}
          title="Put this habit back exactly as it was, history and all"
        >Restore original</button>
      )}
    </div>
  )
}
