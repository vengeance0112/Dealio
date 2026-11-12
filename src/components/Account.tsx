'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  sendEmailVerification, updateProfile, onIdTokenChanged, signOut, type User } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase-client'

const field = 'w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-blue'
export function AuthForm({ mode }: { mode: 'login' | 'signup' | 'reset' }) {
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');setNotice('');setBusy(true)
    const f=new FormData(e.currentTarget),email=String(f.get('email')),password=String(f.get('password'))
    try {
      const auth=firebaseAuth()
      if(mode==='reset') { await sendPasswordResetEmail(auth,email);setNotice('If an account exists, a reset link will arrive in your inbox.');return }
      if(mode==='signup') {
        const {user}=await createUserWithEmailAndPassword(auth,email,password)
        await updateProfile(user,{displayName:String(f.get('name'))})
        await sendEmailVerification(user)
        await signOut(auth)
        setNotice('Account created. Verify your email using the link in your inbox, then sign in.')
      } else { await signInWithEmailAndPassword(auth,email,password);window.location.assign('/workspace') }
    } catch(e) {
      const code=(e as {code?:string}).code
      setError(code==='auth/operation-not-allowed'?'Enable Email/Password sign-in in Firebase Console → Authentication.':
        code==='auth/invalid-api-key'?'Firebase rejected the supplied web API key. Check the project configuration.':
        code==='auth/too-many-requests'?'Too many attempts. Please wait and try again.':
        code==='auth/weak-password'?'Use a password with at least 8 characters.':'Unable to continue. Check your details and Firebase configuration.')
    } finally {setBusy(false)}
  }
  return <div className="grid min-h-screen place-items-center bg-canvas p-6"><div className="w-full max-w-md">
    <Link href="/" className="text-3xl font-extrabold italic text-brand">dealio.</Link>
    <div className="mt-8 rounded-2xl border border-line bg-white p-8"><h1 className="text-2xl font-bold text-brand">{mode==='signup'?'Create your account':mode==='reset'?'Reset your password':'Welcome back'}</h1>
      <p className="mt-2 text-sm text-muted">Your real workspace is separate from the evaluator demo.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode==='signup'&&<label className="block text-sm">Full name<input name="name" required maxLength={100} className={field}/></label>}
        <label className="block text-sm">Email<input name="email" type="email" autoComplete="email" required className={field}/></label>
        {mode!=='reset'&&<label className="block text-sm">Password<input name="password" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={8} required className={field}/></label>}
        {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="text-sm text-emerald-700">{notice}</p>}
        <button disabled={busy} className="w-full rounded-full bg-brand py-3 font-semibold text-white disabled:opacity-50">{busy?'Please wait…':mode==='signup'?'Create account':mode==='reset'?'Send reset link':'Sign in'}</button>
      </form>
      <div className="mt-5 flex justify-between text-xs text-blue"><Link href={mode==='login'?'/signup':'/login'}>{mode==='login'?'Create account':'Sign in'}</Link><Link href="/forgot-password">Forgot password?</Link></div>
    </div><Link href="/explore" className="mt-5 block text-center text-sm font-semibold text-brand">Just evaluating? Explore the demo →</Link>
  </div></div>
}

type Brief = { id: string | number; title: string; description: string; amountCents: number }
export function Workspace() {
  const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[docs,setDocs]=useState<Brief[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function load(u: User) {
    const res=await fetch('/api/workspace',{headers:{Authorization:`Bearer ${await u.getIdToken()}`}})
    const d=await res.json();if(!res.ok) throw new Error(d.error);setDocs(d.docs)
  }
  useEffect(()=>onIdTokenChanged(firebaseAuth(),u=>{setUser(u);setReady(true);if(u) load(u).catch(e=>setError(e.message));else setDocs([])}),[])
  const [draft, setDraft] = useState<{summary:string;questions:string[];milestones:{title:string;amountCents:number;criteria:string[]}[]}|null>(null)
  async function generate(id:string) {
    if(!user)return;setBusy(true);setError('')
    try {
      const r=await fetch('/api/brief-preview',{method:'POST',headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},body:JSON.stringify({id})})
      const d=await r.json();if(!r.ok)throw new Error(d.error);setDraft(d.draft)
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function save(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!user)return;setBusy(true);setError('')
    const form=e.currentTarget,f=new FormData(form)
    try {
      const res=await fetch('/api/workspace',{method:'POST',headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},
        body:JSON.stringify({title:f.get('title'),description:f.get('description'),amountCents:Math.round(Number(f.get('amount'))*100)})})
      const d=await res.json();if(!res.ok)throw new Error(d.error)
      await load(user);form.reset()
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  if(!ready)return <p className="p-12">Loading your account…</p>
  if(!user)return <div className="p-12 text-center"><p>Please sign in to access your private workspace.</p><Link href="/login" className="mt-4 inline-block text-blue">Sign in →</Link></div>
  return <main className="mx-auto max-w-4xl p-6 sm:p-12">
    <header className="mb-8 flex justify-between"><Link href="/" className="text-2xl font-extrabold italic text-brand">dealio.</Link><button onClick={()=>signOut(firebaseAuth())} className="text-sm text-blue">Sign out</button></header>
    <h1 className="text-3xl font-bold text-brand">Your workspace</h1><p className="mt-2 text-muted">{user.displayName || user.email} · Private deal briefs</p>
    <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Real accounts currently support private briefs. Agreement approvals, AI evidence processing, and real PayPal execution are not enabled here. <Link href="/explore" className="underline">Explore the complete simulated flow</Link>.</div>
    {error&&<p role="alert" className="mb-4 text-red-700">{error}</p>}
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-line bg-white p-6"><h2 className="text-lg font-bold">Create a brief</h2>
      <label className="block text-sm">Title<input name="title" required minLength={3} maxLength={160} className={field}/></label>
      <label className="block text-sm">Scope<textarea name="description" required minLength={20} maxLength={10000} className={field}/></label>
      <label className="block text-sm">Amount (USD)<input name="amount" type="number" required min={1} max={1000000} step=".01" className={field}/></label>
      <button disabled={busy} className="rounded-full bg-brand px-6 py-3 text-white disabled:opacity-50">{busy?'Saving…':'Save private brief'}</button>
    </form>
    <div className="mt-8 space-y-4">{!docs.length?<p className="text-muted">No briefs yet. Only your own records will appear here.</p>:docs.map(d=><article key={d.id} className="rounded-xl border border-line bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-bold">{d.title}</h2><span>${(d.amountCents/100).toFixed(2)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-muted">{d.description}</p><button disabled={busy} onClick={()=>generate(String(d.id))} className="mt-3 text-sm font-semibold text-blue disabled:opacity-50">Generate Gemini draft →</button></article>)}</div>
    {draft&&<section className="mt-6 rounded-2xl border border-line bg-white p-6"><h2 className="font-bold text-brand">Gemini preview · Not approved or binding</h2><p className="mt-3 text-sm">{draft.summary}</p><h3 className="mt-4 font-semibold">Clarifications needed</h3><ul className="list-disc pl-5 text-sm">{draft.questions.map((q,i)=><li key={i}>{q}</li>)}</ul>{draft.milestones.map((m,i)=><div key={i} className="mt-3 border-t border-line pt-3"><b>{m.title} · ${(m.amountCents/100).toFixed(2)}</b><ul className="list-disc pl-5 text-sm">{m.criteria.map((c,j)=><li key={j}>{c}</li>)}</ul></div>)}</section>}
  </main>
}
