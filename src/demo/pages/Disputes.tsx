import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Link, go } from '@/demo/lib/router';
import { money, useStore } from '@/demo/lib/store';
import { Badge, Button, Card, Empty, Field, LinkButton, PageHeader, inputCls } from '@/demo/components/ui';

export function DisputeList() {
  const { disputes, transactions } = useStore();
  return (
    <>
      <PageHeader title="Disputes" sub="Raise a concern when delivery and agreement do not match. Dealio summarises neutrally; the parties agree the outcome." action={<LinkButton to="/disputes/new">Open dispute</LinkButton>} />
      <Card>
        {disputes.length === 0 && <Empty text="No disputes." />}
        <ul className="divide-y divide-line">
          {disputes.map((d) => (
            <li key={d.id}>
              <Link to={`/disputes/${d.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:opacity-80">
                <div>
                  <div className="text-sm font-semibold">{d.id} · {d.reason}</div>
                  <div className="text-xs text-muted">{transactions.find((t) => t.id === d.txId)?.title} · opened {d.created}</div>
                </div>
                <Badge tone={d.status === 'Open' ? 'red' : 'green'}>{d.status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

export function DisputeNew() {
  const s = useStore();
  const preset = new URLSearchParams((typeof location === 'undefined' ? '' : location.hash).split('?')[1] ?? '').get('mid');
  const eligible = s.milestones.filter((m) => m.payment === 'Captured – Held');
  const [mid, setMid] = useState(preset && eligible.some((m) => m.id === preset) ? preset : (eligible[0]?.id ?? ''));
  const [reason, setReason] = useState('Delivered work does not match agreed scope');
  const [description, setDescription] = useState('');
  const open = s.disputes.some((d) => d.mid === mid && d.status === 'Open');
  return (
    <>
      <PageHeader back={{ to: '/disputes', label: 'Disputes' }} title="Open a dispute" sub="Only milestones with funds currently held can be disputed. Release is blocked while a dispute is open." />
      <form className="max-w-2xl space-y-4 rounded-2xl border border-line bg-white p-6" onSubmit={(e) => { e.preventDefault(); go(`/disputes/${s.openDispute(mid, reason, description)}`); }}>
        <Field label="Milestone">
          <select className={inputCls} value={mid} onChange={(e) => setMid(e.target.value)}>
            {eligible.map((m) => <option key={m.id} value={m.id}>{s.transactions.find((t) => t.id === m.txId)?.title}: {m.title} ({money(m.amount)})</option>)}
          </select>
        </Field>
        <Field label="Reason">
          <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
            {['Delivered work does not match agreed scope', 'Work was not delivered', 'Delivery is late', 'Quality does not meet criteria', 'Other'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="What happened?"><textarea className={`${inputCls} min-h-28`} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        {open && <p className="text-sm text-red-600">A dispute is already open for this milestone.</p>}
        <Button type="submit" disabled={!mid || !description.trim() || open}>Submit dispute</Button>
      </form>
    </>
  );
}

export function DisputeDetail({ did }: { did: string }) {
  const s = useStore();
  const d = s.disputes.find((x) => x.id === did);
  if (!d) return <Empty text="Dispute not found." />;
  const m = s.milestones.find((x) => x.id === d.mid);
  const t = s.transactions.find((x) => x.id === d.txId);
  return (
    <>
      <PageHeader back={{ to: '/disputes', label: 'Disputes' }} title={`${d.id}: ${d.reason}`} sub={`${t?.title} · ${m?.title} · raised by ${d.raisedBy} on ${d.created}`} action={<Badge tone={d.status === 'Open' ? 'red' : 'green'}>{d.status}</Badge>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Description"><p className="text-sm">{d.description}</p></Card>
          <Card title={<span className="flex items-center gap-2"><Sparkles size={16} /> Neutral AI summary</span>}><p className="text-sm">{d.aiSummary}</p></Card>
        </div>
        <Card title="Outcome">
          {d.status === 'Resolved' ? (
            <p className="text-sm font-semibold text-emerald-700">{d.resolution}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted">Both parties agree the outcome. In this demo, either user can record the agreed result.</p>
              <Button className="w-full" onClick={() => s.resolveDispute(d.id, 'release')}>Release to provider</Button>
              <Button variant="secondary" className="w-full" onClick={() => s.resolveDispute(d.id, 'split')}>Split 50/50</Button>
              <Button variant="danger" className="w-full" onClick={() => s.resolveDispute(d.id, 'refund')}>Refund buyer</Button>
            </div>
          )}
          {m && <LinkButton to={`/m/${m.id}`} variant="ghost" className="mt-3 w-full">Open milestone</LinkButton>}
        </Card>
      </div>
    </>
  );
}
