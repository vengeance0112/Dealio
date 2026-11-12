'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  AlertTriangle, ArrowRight, Bot, CheckCircle2, ClipboardCheck, FileCheck2, Gavel, HandCoins,
  History, Layers, MessageSquareWarning, ScanSearch, ShieldCheck, Sparkles, Users, Wallet, XCircle,
} from 'lucide-react'

const Scene3D = dynamic(() => import('./Scene3D'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-3xl bg-blue-50/60" />,
})

const problems = [
  { Icon: HandCoins, title: 'Providers do the work, then chase payment', text: 'Clients delay or refuse payment after delivery, and verbal agreements are hard to prove.' },
  { Icon: XCircle, title: 'Buyers pay for work that is not what they expected', text: 'Without clear completion criteria, it is hard to tell whether a milestone is truly done.' },
  { Icon: MessageSquareWarning, title: 'Scope creeps and records scatter', text: 'Promises live in chats and emails. Nobody can see what was agreed, delivered or when.' },
]
const steps = [
  { Icon: FileCheck2, title: 'Agree', text: 'Turn a brief into milestones and acceptance criteria. Both parties approve the same version.' },
  { Icon: Wallet, title: 'Fund', text: 'The buyer funds one milestone at a time, so the provider knows the next stage is backed.' },
  { Icon: ScanSearch, title: 'Verify', text: 'AI checks the delivery against each approved criterion and shows what is missing.' },
  { Icon: ShieldCheck, title: 'Decide', text: 'The buyer confirms release, requests a revision or opens a dispute. A human always decides.' },
]
const features = [
  { Icon: Sparkles, title: 'AI agreement builder', text: 'Structures a brief into milestones, deliverables and clarifying questions. Never approves terms for you.' },
  { Icon: Users, title: 'Two-sided approval', text: 'Every change creates a new version that both parties review and approve again.' },
  { Icon: ScanSearch, title: 'Delivery verifier', text: 'Criterion-by-criterion verdicts with evidence references, confidence and a release-readiness meter.' },
  { Icon: Layers, title: 'Two separate status tracks', text: 'Work status and payment status never get mixed up, so everyone sees where things stand.' },
  { Icon: ClipboardCheck, title: 'Human-confirmed release', text: 'AI recommends. Funds move only after the buyer gives an explicit confirmation.' },
  { Icon: Gavel, title: 'Neutral dispute summary', text: 'A balanced summary of the agreement, evidence and timeline. Outcomes need both parties.' },
  { Icon: Bot, title: 'Proposing agent', text: 'Ask what is next. The agent proposes actions as confirmation cards and cannot move money.' },
  { Icon: History, title: 'Full audit timeline', text: 'An append-only record of approvals, submissions, verifications and payment events.' },
]
const demoStats = [
  { n: 4, label: 'sample deals' },
  { n: 9, label: 'milestones' },
  { n: 3, label: 'perspectives' },
  { n: 0, label: 'real dollars moved', suffix: '' },
]

export default function Landing() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Hero intro
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.from('[data-hero-badge]', { y: 20, opacity: 0, duration: 0.7 })
        .from('[data-hero-line]', { yPercent: 110, opacity: 0, duration: 1, stagger: 0.12 }, '-=0.4')
        .from('[data-hero-sub]', { y: 24, opacity: 0, duration: 0.8 }, '-=0.6')
        .from('[data-hero-cta] > *', { y: 24, opacity: 0, scale: 0.95, duration: 0.7, stagger: 0.1 }, '-=0.5')
      gsap.from('[data-nav]', { y: -40, opacity: 0, duration: 0.9, ease: 'power3.out' })

      // Section reveals
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      })
      ScrollTrigger.batch('[data-card]', {
        start: 'top 90%', once: true,
        onEnter: (els) => gsap.from(els, { y: 40, opacity: 0, rotateX: -12, duration: 0.8, stagger: 0.09, ease: 'power3.out' }),
      })

      // Solution timeline: draw line + light steps
      const line = root.current?.querySelector('[data-line]')
      if (line) {
        gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', transformOrigin: 'left center',
          scrollTrigger: { trigger: '[data-steps]', start: 'top 70%', end: 'bottom 60%', scrub: true } })
      }
      gsap.utils.toArray<HTMLElement>('[data-step]').forEach((el) => {
        gsap.fromTo(el.querySelector('[data-dot]'), { backgroundColor: '#dfe3e8', scale: 0.8 },
          { backgroundColor: '#003087', scale: 1.1, duration: 0.4, scrollTrigger: { trigger: el, start: 'top 70%', toggleActions: 'play none none reverse' } })
      })

      // Counters
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count)
        const o = { v: 0 }
        gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => { el.textContent = String(Math.round(o.v)) } })
      })

      // Floating blobs parallax
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.to(el, { yPercent: Number(el.dataset.parallax), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      })

      // Marquee
      gsap.to('[data-marquee]', { xPercent: -50, ease: 'none', duration: 28, repeat: -1 })

      // Magnetic buttons
      const cleanups: (() => void)[] = []
      gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
        const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
        const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          x((e.clientX - (r.left + r.width / 2)) * 0.25)
          y((e.clientY - (r.top + r.height / 2)) * 0.35)
        }
        const leave = () => { x(0); y(0) }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) })
      })

      // 3D tilt cards
      gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((el) => {
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power2.out' })
        const ry = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power2.out' })
        gsap.set(el, { transformPerspective: 800 })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          ry(((e.clientX - r.left) / r.width - 0.5) * 12)
          rx(-((e.clientY - r.top) / r.height - 0.5) * 12)
          el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
          el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
        }
        const leave = () => { rx(0); ry(0) }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        cleanups.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) })
      })
      return () => cleanups.forEach((c) => c())
    })
    return () => mm.revert()
  }, [])

  const glass = 'border border-white/80 bg-white/65 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,48,135,0.2)]'

  return (
    <div ref={root} className="overflow-x-clip bg-canvas text-ink">
      {/* background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div data-parallax="-30" className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-sky/20 blur-3xl" />
        <div data-parallax="40" className="absolute -right-24 top-[40vh] h-[28rem] w-[28rem] rounded-full bg-blue/15 blur-3xl" />
      </div>

      <header data-nav className={`sticky top-4 z-40 mx-4 mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 backdrop-saturate-150 sm:px-6 lg:mx-auto ${glass}`}>
        <Link href="/" className="text-3xl font-extrabold italic tracking-tight text-brand">dealio<span className="text-sky">.</span></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 text-sm font-semibold sm:gap-3">
          <a href="#problem" className="hidden rounded-full px-3 py-2 text-brand hover:bg-white/80 md:block">Problem</a>
          <a href="#solution" className="hidden rounded-full px-3 py-2 text-brand hover:bg-white/80 md:block">Solution</a>
          <a href="#features" className="hidden rounded-full px-3 py-2 text-brand hover:bg-white/80 md:block">Features</a>
          <Link href="/explore" className="rounded-full px-3 py-2 text-brand hover:bg-white/80">Explore demo</Link>
          <Link href="/login" className="rounded-full bg-brand px-5 py-2.5 text-white shadow-sm hover:bg-navy sm:px-6">Sign in</Link>
        </nav>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl items-center gap-6 px-6 pb-10 pt-12 lg:grid-cols-2 lg:pt-16">
          <div>
            <span data-hero-badge className="inline-flex items-center gap-2 rounded-full border border-blue/20 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand backdrop-blur"><ShieldCheck size={14} /> Clear terms. Human decisions.</span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.06] tracking-tight text-navy sm:text-6xl">
              <span className="block overflow-hidden"><span data-hero-line className="block">Good work deserves</span></span>
              <span className="block overflow-hidden"><span data-hero-line className="block bg-gradient-to-r from-blue to-sky bg-clip-text text-transparent">a clear deal.</span></span>
            </h1>
            <p data-hero-sub className="mt-6 max-w-lg text-lg leading-relaxed text-muted">Agree on what done looks like. Check the delivery against the promise. Make every payment an informed decision.</p>
            <div data-hero-cta className="mt-8 flex flex-wrap gap-3">
              <Link data-magnetic href="/explore" className="flex items-center gap-3 rounded-full bg-brand px-7 py-4 font-semibold text-white shadow-lg shadow-brand/25 hover:bg-navy">Explore the product <ArrowRight size={18} /></Link>
              <Link data-magnetic href="/signup" className="rounded-full border border-brand bg-white/60 px-7 py-4 font-semibold text-brand backdrop-blur">Create an account</Link>
            </div>
            <p className="mt-4 text-xs text-muted">No login needed to explore · Buyer, provider and operations views</p>
          </div>
          <div className="relative h-[360px] sm:h-[460px] lg:h-[540px]">
            <Scene3D />
            <p className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-white/70 px-3 py-1 text-[11px] text-muted backdrop-blur">Move your cursor · click the core</p>
          </div>
        </section>

        {/* MARQUEE */}
        <div aria-hidden className="overflow-hidden border-y border-line bg-white/60 py-3 backdrop-blur">
          <div data-marquee className="flex w-max gap-10 whitespace-nowrap text-sm font-semibold text-brand/70">
            {[0, 1].map((k) => (
              <div key={k} className="flex gap-10">
                {['Agree clearly', 'Fund by milestone', 'Verify against criteria', 'Release with confirmation', 'Keep a full record', 'Resolve disputes fairly'].map((t) => (
                  <span key={t + k} className="flex items-center gap-10">{t}<span className="text-sky">◆</span></span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* PROBLEM */}
        <section id="problem" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-24">
          <div data-reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-700"><AlertTriangle size={14} /> The problem</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Informal deals have no shared record of promise, proof or payment.</h2>
            <p className="mt-4 text-muted">Freelancers, studios and small businesses agree on work in chats and calls. When something goes wrong, there is nothing everyone can point to.</p>
          </div>
          <div className="mt-12 grid gap-5 [perspective:1000px] md:grid-cols-3">
            {problems.map(({ Icon, title, text }) => (
              <article key={title} data-card data-tilt className={`group relative overflow-hidden rounded-2xl p-6 ${glass}`}>
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(0,112,224,0.12), transparent 70%)' }} />
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-700"><Icon size={22} /></span>
                <h3 className="mt-5 text-lg font-bold text-brand">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* SOLUTION */}
        <section id="solution" className="scroll-mt-28 bg-navy py-24 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <div data-reveal className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky"><CheckCircle2 size={14} /> The solution</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Agree, fund, verify, decide: one traceable flow.</h2>
              <p className="mt-4 text-blue-100/80">Dealio connects the agreement, the evidence and the payment. AI explains whether the work matches what was promised, and a person makes the call.</p>
            </div>
            <div data-steps className="relative mt-16">
              <div aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-0.5 bg-white/15 lg:block"><div data-line className="h-full origin-left bg-sky" /></div>
              <ol className="grid gap-8 lg:grid-cols-4">
                {steps.map(({ Icon, title, text }, i) => (
                  <li key={title} data-step className="relative">
                    <span data-dot className="relative z-10 grid h-11 w-11 place-items-center rounded-full bg-line text-sm font-bold text-white ring-4 ring-navy">{i + 1}</span>
                    <Icon className="mt-5 text-sky" size={26} />
                    <h3 className="mt-3 text-xl font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div data-reveal className="mt-14 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm text-blue-100/90 backdrop-blur">
              <b className="text-white">How your money moves.</b> In this build the buyer funds one milestone at a time through a PayPal Sandbox flow, and release happens only after the buyer confirms. It demonstrates the workflow and is not a licensed escrow. Production use needs PayPal partner approval or a licensed arrangement.
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-28 px-6 py-24">
          <div data-reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue"><Sparkles size={14} /> Features</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">Everything both sides need to trust the process.</h2>
          </div>
          <div className="mt-12 grid gap-5 [perspective:1000px] sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, text }) => (
              <article key={title} data-card data-tilt className={`group relative overflow-hidden rounded-2xl p-6 ${glass}`}>
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(220px circle at var(--mx,50%) var(--my,50%), rgba(0,156,222,0.16), transparent 70%)' }} />
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-sky text-white shadow-md"><Icon size={20} /></span>
                <h3 className="mt-4 font-bold text-brand">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* DEMO CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div data-reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-brand to-blue p-8 text-white sm:p-12">
            <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky/30 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">One deal. Every perspective.</h2>
                <p className="mt-3 max-w-md text-sm text-blue-100">Submit as Priya, review as Daniel, and inspect the operations trail. Everything in the evaluator demo is simulated and resets on reload.</p>
                <Link data-magnetic href="/explore" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-brand shadow-lg">Open evaluator demo <ArrowRight size={17} /></Link>
              </div>
              <dl className="grid grid-cols-2 gap-4">
                {demoStats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-4xl font-extrabold"><span data-count={s.n}>{s.n}</span></dd>
                    <p className="mt-1 text-xs text-blue-100">{s.label}</p>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-6 pb-8 text-xs text-muted">
        <span>Dealio is independent. Not owned or endorsed by PayPal.</span>
        <span>Demo payments only · Not a licensed escrow · <Link href="/privacy" className="underline">Privacy</Link></span>
      </footer>
    </div>
  )
}
