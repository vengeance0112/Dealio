'use client'
import { useEffect, useState } from 'react'
import App from '@/demo/App'
import type { State } from '@/demo/lib/store'

export default function Explore() {
  const [state, setState] = useState<State | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setError('')
    fetch('/api/demo', { cache: 'no-store' }).then(async r => {
      if (!r.ok) throw new Error('Unable to load the evaluator scenario.')
      return r.json()
    }).then(d => { if(active) setState(d.state) }).catch(e => { if(active) setError(e.message) })
    return () => { active = false }
  }, [attempt])
  if (error) return <div className="p-12 text-center"><p>{error}</p><button onClick={()=>setAttempt(a=>a+1)} className="mt-4 rounded-full bg-brand px-6 py-3 text-white">Retry</button></div>
  return state ? <App initialState={state}/> : <p className="p-12 text-center text-muted">Loading the Dealio evaluator workspace…</p>
}
