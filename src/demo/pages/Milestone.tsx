import { useState } from 'react';
import { Check, FileUp, Loader2, Sparkles } from 'lucide-react';
import { go } from '@/demo/lib/router';
import { money, useStore, users } from '@/demo/lib/store';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  LinkButton,
  Meter,
  Modal,
  MoneyFlow,
  PageHeader,
  PayBadge,
  VerdictBadge,
  WorkBadge,
  inputCls,
} from '@/demo/components/ui';

function useMilestone(mid: string) {
  const s = useStore();
  const m = s.milestones.find((x) => x.id === mid);
  const t = m && s.transactions.find((x) => x.id === m.txId);
  const subs = s.submissions.filter((x) => x.mid === mid);
  const verifs = s.verifications.filter((x) => x.mid === mid);
  return { s, m, t, subs, verifs, latestV: verifs[verifs.length - 1], latestS: subs[subs.length - 1] };
}

const NotFound = () => <Empty text="Milestone not found." />;

export function VerificationResults({ mid }: { mid: string }) {
  const { latestV } = useMilestone(mid);
  if (!latestV) return null;
  return (
    <Card title={`AI verification, delivery v${latestV.version}`} action={<Badge tone={latestV.recommendation === 'Accept' ? 'green' : latestV.recommendation === 'Request revision' ? 'red' : 'amber'}>Recommends: {latestV.recommendation}</Badge>}>
      <Meter value={latestV.score} label="Release readiness" />
      <p className="mt-3 text-sm text-muted">{latestV.summary}</p>
      <ul className="mt-4 divide-y divide-line">
        {latestV.results.map((r, i) => (
          <li key={i} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">{r.criterion}</span>
              <VerdictBadge s={r.verdict} />
            </div>
            <p className="mt-1 text-sm">{r.explanation}</p>
            <p className="mt-0.5 text-xs text-muted">Evidence: {r.evidence} · Confidence {r.confidence}%</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">AI recommends. A human makes the final call.</p>
    </Card>
  );
}

export function MilestonePage({ mid }: { mid: string }) {
  const { s, m, t, subs } = useMilestone(mid);
  if (!m || !t) return <NotFound />;
  const pay = s.payments.find((p) => p.mid === mid);
  const buyer = s.role === 'buyer';
  const active = t.status === 'Active';
  return (
    <>
      <PageHeader back={{ to: `/tx/${t.id}`, label: t.title }} title={m.title} sub={`${m.description} Due ${m.due}.`} action={<div className="text-right"><div className="text-2xl font-extrabold text-brand">{money(m.amount)}</div></div>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Two separate statuses">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><div className="mb-2 text-xs font-semibold uppercase text-muted">Dealio workflow</div><WorkBadge s={m.work} /></div>
              <div className="rounded-xl bg-slate-50 p-4"><div className="mb-2 text-xs font-semibold uppercase text-muted">PayPal payment</div><PayBadge s={m.payment} /></div>
            </div>
          </Card>
          <Card title="Deliverables and acceptance criteria">
            <div className="grid gap-5 text-sm sm:grid-cols-2">
              <ul className="list-disc space-y-1 pl-4">{m.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul>
              <ul className="space-y-1.5">{m.criteria.map((c, i) => <li key={i} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-blue" />{c}</li>)}</ul>
            </div>
          </Card>
          <VerificationResults mid={mid} />
          <Card title="Delivery history">
            {subs.length === 0 ? <Empty text="Nothing has been submitted yet." /> : (
              <ul className="divide-y divide-line">
                {[...subs].reverse().map((x) => (
                  <li key={x.id} className="py-3 text-sm">
                    <div className="font-semibold">Delivery v{x.version} <span className="font-normal text-muted">· {x.date}</span></div>
                    <p>{x.description}</p>
                    <p className="text-xs text-muted">{[...x.files, x.link].filter(Boolean).join(' · ') || 'No attachments'}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Next step">
            {!active && <p className="text-sm text-muted">The agreement must be active before this milestone can progress.</p>}
            {active && (
              <div className="space-y-3 text-sm">
                {buyer && m.payment === 'Not Created' && <><p>Fund this milestone so the provider can start.</p><LinkButton to={`/fund/${mid}`} variant="gold" className="w-full">Fund with PayPal</LinkButton></>}
                {!buyer && m.payment === 'Not Created' && <p className="text-muted">Waiting for Daniel to fund this milestone.</p>}
                {!buyer && m.payment === 'Captured – Held' && m.work === 'Not Started' && <Button className="w-full" onClick={() => s.startWork(mid)}>Start work</Button>}
                {!buyer && m.payment === 'Captured – Held' && (m.work === 'In Progress' || m.work === 'Revision Requested') && <LinkButton to={`/submit/${mid}`} className="w-full">{m.work === 'Revision Requested' ? 'Submit revision' : 'Submit delivery'}</LinkButton>}
                {buyer && m.work === 'Submitted' && <LinkButton to={`/verify/${mid}`} className="w-full">Run AI verification</LinkButton>}
                {buyer && m.work === 'Under Review' && m.payment === 'Captured – Held' && <LinkButton to={`/review/${mid}`} variant="gold" className="w-full">Review and release</LinkButton>}
                {buyer && ['In Progress', 'Revision Requested'].includes(m.work) && m.payment === 'Captured – Held' && <p className="text-muted">Waiting for Priya to deliver.</p>}
                {!buyer && ['Submitted', 'Under Review'].includes(m.work) && <p className="text-muted">Delivery is with Daniel for review.</p>}
                {m.payment === 'Released' && <p className="font-semibold text-emerald-700">Accepted and released to provider.</p>}
                {m.payment === 'Refunded' && <p className="font-semibold text-red-700">Refunded to buyer.</p>}
              </div>
            )}
            {pay && <LinkButton to={`/payments/${pay.id}`} variant="ghost" className="mt-2 w-full">Payment record {pay.id}</LinkButton>}
          </Card>
          <MoneyFlow />
        </div>
      </div>
    </>
  );
}

export function FundPage({ mid }: { mid: string }) {
  const { s, m, t } = useMilestone(mid);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'idle' | 'order' | 'capture' | 'done'>('idle');
  if (!m || !t) return <NotFound />;
  const fee = Math.round(m.amount * 0.029 * 100) / 100;
  const funded = m.payment !== 'Not Created' && m.payment !== 'Order Created';

  const pay = () => {
    setStep('order');
    s.createOrder(mid);
    setTimeout(() => {
      setStep('capture');
      setTimeout(() => {
        s.capture(mid);
        setStep('done');
      }, 900);
    }, 800);
  };
  return (
    <>
      <PageHeader back={{ to: `/m/${mid}`, label: m.title }} title="Fund milestone" sub="One PayPal order per milestone. Funds are captured now and released only after you confirm delivery." />
      {s.role !== 'buyer' && <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Only the buyer can fund. Switch to Daniel Whitfield to continue.</div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Order summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Deal</dt><dd className="font-semibold">{t.title}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Milestone</dt><dd className="font-semibold">{m.title}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Provider</dt><dd>{users.provider.name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Milestone amount</dt><dd>{money(m.amount)}.00</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Sandbox processing fee (paid by provider)</dt><dd>${fee.toFixed(2)}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">You pay</dt><dd className="font-extrabold text-brand">{money(m.amount)}.00 USD</dd></div>
            </dl>
          </Card>
          {funded ? (
            <Card><div className="text-center"><p className="mb-3 font-semibold text-emerald-700">This milestone is funded.</p><LinkButton to={`/m/${mid}`}>Back to milestone</LinkButton></div></Card>
          ) : (
            <Button variant="gold" className="w-full !py-3.5 text-base" disabled={s.role !== 'buyer' || t.status !== 'Active'} onClick={() => setOpen(true)}>
              Pay with <span className="font-extrabold italic text-brand">Pay</span><span className="-ml-1.5 font-extrabold italic text-sky">Pal</span>
            </Button>
          )}
        </div>
        <MoneyFlow />
      </div>

      <Modal open={open} onClose={() => step === 'idle' && setOpen(false)} title="PayPal Sandbox checkout">
        {step === 'idle' && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs text-muted">Paying from</div>
              <div className="font-semibold">{users.buyer.paypal}</div>
            </div>
            <div className="flex justify-between"><span>Dealio, milestone payment</span><b>{money(m.amount)}.00 USD</b></div>
            <Button variant="gold" className="w-full" onClick={pay}>Complete Purchase</Button>
            <p className="text-center text-xs text-muted">Sandbox account. No real money moves.</p>
          </div>
        )}
        {(step === 'order' || step === 'capture') && (
          <div className="space-y-3 py-4 text-sm">
            <div className="flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Order created</div>
            <div className="flex items-center gap-2">{step === 'capture' ? <Check size={16} className="text-emerald-600" /> : <Loader2 size={16} className="animate-spin text-blue" />} Buyer approval in PayPal</div>
            <div className="flex items-center gap-2">{step === 'capture' ? <Loader2 size={16} className="animate-spin text-blue" /> : <span className="h-4 w-4" />} Capturing payment</div>
          </div>
        )}
        {step === 'done' && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check /></div>
            <div className="font-bold">Payment captured and held</div>
            <p className="text-sm text-muted">{money(m.amount)} is now held for this milestone. Priya can start work.</p>
            <Button className="w-full" onClick={() => { setOpen(false); setStep('idle'); go(`/m/${mid}`); }}>Continue</Button>
          </div>
        )}
      </Modal>
    </>
  );
}

export function SubmitPage({ mid }: { mid: string }) {
  const { s, m, t, subs } = useMilestone(mid);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [link, setLink] = useState('');
  if (!m || !t) return <NotFound />;
  const ok = description.trim().length > 0 && (files.length > 0 || link.trim());
  return (
    <>
      <PageHeader back={{ to: `/m/${mid}`, label: m.title }} title={subs.length ? `Submit revision (v${subs.length + 1})` : 'Submit delivery'} sub="Attach evidence for each acceptance criterion. The AI verifier checks it against the agreement." />
      {s.role !== 'provider' && <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Only the provider submits deliveries. Switch to Priya Raman.</div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <form className="space-y-4 rounded-2xl border border-line bg-white p-6 lg:col-span-2" onSubmit={(e) => { e.preventDefault(); s.submitWork(mid, { description, files, link: link.trim() }); go(`/m/${mid}`); }}>
          <Field label="Delivery notes"><textarea className={`${inputCls} min-h-28`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Summarise what you are delivering and how it meets each criterion." /></Field>
          <Field label="Files">
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-5 text-center">
              <FileUp className="mx-auto mb-2 text-muted" />
              <input type="file" multiple className="text-sm" onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => f.name))} />
              {files.length > 0 && <p className="mt-2 text-xs text-muted">{files.join(', ')}</p>}
            </div>
          </Field>
          <Field label="Demo or repository link"><input className={inputCls} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://staging.example.com" /></Field>
          <Button type="submit" disabled={!ok || s.role !== 'provider'}>Submit for verification</Button>
          <p className="text-xs text-muted">Tip for the demo: attach any file and add a link. On the first delivery, the AI will flag the missing mobile layout so you can try a revision.</p>
        </form>
        <Card title="Criteria to evidence"><ul className="space-y-2 text-sm">{m.criteria.map((c, i) => <li key={i} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-blue" />{c}</li>)}</ul></Card>
      </div>
    </>
  );
}

export function VerifyPage({ mid }: { mid: string }) {
  const { s, m, t, latestS, latestV } = useMilestone(mid);
  const [busy, setBusy] = useState(false);
  if (!m || !t) return <NotFound />;
  const run = () => {
    setBusy(true);
    setTimeout(() => {
      s.runVerification(mid);
      setBusy(false);
    }, 1400);
  };
  const current = latestV && latestS && latestV.version === latestS.version;
  return (
    <>
      <PageHeader back={{ to: `/m/${mid}`, label: m.title }} title="AI delivery verifier" sub="Compares the submitted evidence with each acceptance criterion both parties approved." />
      {!latestS ? <Card><Empty text="No delivery has been submitted yet." /></Card> : (
        <div className="space-y-6">
          <Card title={`Delivery v${latestS.version}`}>
            <p className="text-sm">{latestS.description}</p>
            <p className="mt-1 text-xs text-muted">{[...latestS.files, latestS.link].filter(Boolean).join(' · ')}</p>
            {!current && (
              <Button className="mt-4" onClick={run} disabled={busy}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {busy ? 'Checking evidence' : 'Run verification'}
              </Button>
            )}
          </Card>
          {current && (
            <>
              <VerificationResults mid={mid} />
              <div className="flex justify-end"><LinkButton to={`/review/${mid}`} variant="gold">Continue to release decision</LinkButton></div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export function ReviewPage({ mid }: { mid: string }) {
  const { s, m, t, latestV } = useMilestone(mid);
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  if (!m || !t) return <NotFound />;
  const buyer = s.role === 'buyer';
  const canDecide = buyer && t.status === 'Active' && m.work === 'Under Review' && m.payment === 'Captured – Held';
  return (
    <>
      <PageHeader back={{ to: `/m/${mid}`, label: m.title }} title="Release decision" sub="AI recommends. You decide. Money moves only after your confirmation." />
      {!buyer && <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Only the buyer can release funds. Switch to Daniel Whitfield.</div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {latestV ? <VerificationResults mid={mid} /> : <Card><Empty text="Run AI verification before deciding." /></Card>}
        </div>
        <div className="space-y-6">
          <Card title="Your decision">
            <div className="mb-3 flex justify-between text-sm"><span className="text-muted">Amount held</span><b>{money(m.amount)}</b></div>
            {!canDecide && <p className="text-sm text-muted">{m.payment === 'Released' ? 'This milestone has been released.' : 'A decision is available once the delivery is verified.'}</p>}
            {canDecide && (
              <div className="space-y-3">
                <Button variant="gold" className="w-full" onClick={() => setConfirm(true)}>Release {money(m.amount)} to provider</Button>
                <textarea className={`${inputCls} min-h-16`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to change?" />
                <Button variant="secondary" className="w-full" onClick={() => { s.requestRevision(mid, note); go(`/m/${mid}`); }}>Request revision</Button>
                <LinkButton to={`/disputes/new?mid=${mid}`} variant="danger" className="w-full">Open a dispute</LinkButton>
              </div>
            )}
          </Card>
          <MoneyFlow />
        </div>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirm release">
        <p className="text-sm">You are about to release <b>{money(m.amount)}</b> to {users.provider.name}. This cannot be undone.</p>
        {latestV && latestV.recommendation !== 'Accept' && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">The AI did not recommend release ({latestV.recommendation}). You are overriding that recommendation.</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button className="flex-1" onClick={() => { s.release(mid); setConfirm(false); go(`/m/${mid}`); }}>Confirm release</Button>
        </div>
      </Modal>
    </>
  );
}
