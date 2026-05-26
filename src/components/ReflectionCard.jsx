import { useEffect, useRef, useState } from 'react'

/* Reflection text is debounced to the backend — typing rapidly should not
   thrash /api/life/reflections/<date>. */
const SAVE_DEBOUNCE_MS = 600

export function ReflectionCard({ value, onChange, todayISO }) {
  const [local, setLocal] = useState(value || '')
  const timerRef = useRef(null)

  useEffect(() => { setLocal(value || '') }, [todayISO, value])

  function handleChange(e) {
    const v = e.target.value
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(v)
      timerRef.current = null
    }, SAVE_DEBOUNCE_MS)
  }

  return (
    <div className="reflection">
      <div className="prompt">What's one tiny win from today?</div>
      <textarea
        placeholder="A small thing that went right…"
        value={local}
        onChange={handleChange}
      />
    </div>
  )
}
