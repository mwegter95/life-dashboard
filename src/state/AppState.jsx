/* AppState: habits, completions, reflections.
   Owns fetch-on-mount, refresh-on-auth-change, and optimistic writes.
   Mutations update local state immediately and then fire-and-forget to
   the backend; failures roll back and surface a toast. */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react'
import * as api from '../lib/api.js'
import { useAuth } from './AuthProvider.jsx'

const StateCtx = createContext(null)

const initial = {
  loading: true,
  error: null,
  habits: [],
  completions: {},        // { [habitId]: [{date, scored, bonus}] }
  reflections: {},        // { [iso]: text }
  mantra: '',             // single per-user phrase shown atop the dashboard
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null }
    case 'LOAD_OK':
      return {
        ...state,
        loading: false,
        error: null,
        habits: action.habits || [],
        completions: action.completions || {},
        reflections: action.reflections || {},
        mantra: action.mantra || '',
      }
    case 'LOAD_ERR':
      return { ...state, loading: false, error: action.error }

    case 'UPSERT_HABIT': {
      const h = action.habit
      const exists = state.habits.some(x => x.id === h.id)
      const habits = exists
        ? state.habits.map(x => (x.id === h.id ? h : x))
        : [...state.habits, h]
      const completions = state.completions[h.id]
        ? state.completions
        : { ...state.completions, [h.id]: [] }
      return { ...state, habits, completions }
    }

    case 'DELETE_HABIT': {
      const habits = state.habits.filter(x => x.id !== action.habitId)
      const { [action.habitId]: _, ...completions } = state.completions
      return { ...state, habits, completions }
    }

    case 'ADD_COMPLETION': {
      const cur = state.completions[action.habitId] || []
      const completions = {
        ...state.completions,
        [action.habitId]: [
          ...cur.filter(c => (typeof c === 'string' ? c : c.date) !== action.completion.date),
          action.completion,
        ],
      }
      return { ...state, completions }
    }

    case 'REMOVE_COMPLETION': {
      const cur = state.completions[action.habitId] || []
      const completions = {
        ...state.completions,
        [action.habitId]: cur.filter(
          c => (typeof c === 'string' ? c : c.date) !== action.date
        ),
      }
      return { ...state, completions }
    }

    case 'SET_REFLECTION': {
      return {
        ...state,
        reflections: { ...state.reflections, [action.date]: action.text },
      }
    }

    case 'SET_MANTRA':
      return { ...state, mantra: action.text }

    default:
      return state
  }
}

export function AppStateProvider({ children, onError }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const { user, bootstrapping } = useAuth()
  const errRef = useRef(onError)
  errRef.current = onError

  // Refetch whenever the user identity changes (login / logout / claim).
  const userKey = user ? `u:${user.id}` : 'anon'
  useEffect(() => {
    if (bootstrapping) return
    let cancelled = false
    dispatch({ type: 'LOAD_START' })
    api.fetchState()
      .then(data => {
        if (cancelled) return
        dispatch({ type: 'LOAD_OK', ...data })
      })
      .catch(err => {
        if (cancelled) return
        dispatch({ type: 'LOAD_ERR', error: err.message || String(err) })
        errRef.current?.(`Couldn't load your data: ${err.message}`)
      })
    return () => { cancelled = true }
  }, [userKey, bootstrapping])

  const upsertHabit = useCallback(async (habit) => {
    const prev = state.habits.find(h => h.id === habit.id)
    dispatch({ type: 'UPSERT_HABIT', habit })
    try {
      await api.putHabit(habit)
    } catch (err) {
      // Roll back
      if (prev) dispatch({ type: 'UPSERT_HABIT', habit: prev })
      else dispatch({ type: 'DELETE_HABIT', habitId: habit.id })
      errRef.current?.(`Save failed: ${err.message}`)
    }
  }, [state.habits])

  const deleteHabit = useCallback(async (habitId) => {
    const prev = state.habits.find(h => h.id === habitId)
    const prevCompletions = state.completions[habitId]
    dispatch({ type: 'DELETE_HABIT', habitId })
    try {
      await api.deleteHabit(habitId)
    } catch (err) {
      if (prev) dispatch({ type: 'UPSERT_HABIT', habit: prev })
      if (prevCompletions) {
        prevCompletions.forEach(c =>
          dispatch({ type: 'ADD_COMPLETION', habitId, completion: c })
        )
      }
      errRef.current?.(`Delete failed: ${err.message}`)
    }
  }, [state.habits, state.completions])

  const addCompletion = useCallback(async (habitId, completion) => {
    dispatch({ type: 'ADD_COMPLETION', habitId, completion })
    try {
      await api.postCompletion({
        habit_id: habitId,
        date: completion.date,
        scored: completion.scored,
        bonus: !!completion.bonus,
      })
    } catch (err) {
      dispatch({ type: 'REMOVE_COMPLETION', habitId, date: completion.date })
      errRef.current?.(`Save failed: ${err.message}`)
    }
  }, [])

  const removeCompletion = useCallback(async (habitId, completion) => {
    dispatch({ type: 'REMOVE_COMPLETION', habitId, date: completion.date })
    try {
      await api.deleteCompletion(habitId, completion.date)
    } catch (err) {
      dispatch({ type: 'ADD_COMPLETION', habitId, completion })
      errRef.current?.(`Couldn't undo: ${err.message}`)
    }
  }, [])

  const setReflection = useCallback(async (date, text) => {
    const prev = state.reflections[date] || ''
    dispatch({ type: 'SET_REFLECTION', date, text })
    try {
      await api.putReflection(date, text)
    } catch (err) {
      dispatch({ type: 'SET_REFLECTION', date, text: prev })
      // Reflections are background-save; don't toast unless this becomes a pain point
    }
  }, [state.reflections])

  const setMantra = useCallback(async (text) => {
    const prev = state.mantra
    dispatch({ type: 'SET_MANTRA', text })
    try {
      await api.putMantra(text)
    } catch (err) {
      dispatch({ type: 'SET_MANTRA', text: prev })
      errRef.current?.(`Couldn't save mantra: ${err.message}`)
    }
  }, [state.mantra])

  const value = useMemo(() => ({
    ...state,
    upsertHabit,
    deleteHabit,
    addCompletion,
    removeCompletion,
    setReflection,
    setMantra,
  }), [state, upsertHabit, deleteHabit, addCompletion, removeCompletion, setReflection, setMantra])

  return <StateCtx.Provider value={value}>{children}</StateCtx.Provider>
}

export function useAppState() {
  const v = useContext(StateCtx)
  if (!v) throw new Error('useAppState must be used inside <AppStateProvider>')
  return v
}
