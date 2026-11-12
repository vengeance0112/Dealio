import { useState } from 'react';
import { Check, Plus, Sparkles, Trash2 } from 'lucide-react';
import { go } from '@/demo/lib/router';
import { money, useStore, type Milestone } from '@/demo/lib/store';
import { Badge, Button, Card, Empty, Field, PageHeader, TxBadge, inputCls } from '@/demo/components/ui';

export function Agreement({ id }: { id: string }) {
  const s = useStore();
  const t = s.transactions.find((x) => x.id === id);
  const stored = s.milestones.filter((m) => m.txId === id);
  const [draft, setDraft] = useState<Milestone[] | null>(null);
  const [note, setNote] = useState('');
  if (!t) return <Empty text="Transaction not found." />;

  const editable = t.status === 'Draft' && s.role === 'provider';
  const ms = editable ? (draft ?? stored) : stored;
  const sum = ms.reduce((a, m) => a + m.amount, 0);
  const balanced = sum === t.total;
  const patch = (i: number, p: Partial<Milestone>) => setDraft(ms.map((m, j) => (j === i ? { ...m, ...p } : m)));
  const add = () =>
    setDraft([
      ...ms,
      { id: `m-${id}-${Date.now()}`, txId: id, title: 'New milestone', description: '', amount: 0, due: t.due, deliverables: [], criteria: ['Describe an objectively checkable criterion'], work: 'Not Started', payment: 'Not Created' },
    ]);
  const send = () => {
    s.saveMilestones(id, ms);
    s.sendForApproval(id);
    setDraft(null);
  };
  const needsMine = t.status === 'Awaiting approval' && !t.approvals[s.role];

  return (
    <>
      <PageHeader
        back={{ to: `/tx/${id}`, label: t.title }}
        title={<span className="flex flex-wrap items-center gap-3">Agreement v{t.agreementVersion} <TxBadge s={t.status} /></span>}
        sub={`Structured by Dealio AI for ${t.title}. Both parties must approve before anything can be funded.`}
      />

      {t.status === 'Draft' && t.agreementVersion === 0 && (
        <Card><div className="text-center"><Button onClick={() => s.generateAgreement(id)}><Sparkles size={16} /> Generate agreement</Button></div></Card>
      )}

      {ms.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {t.status === 'Draft' && s.role === 'buyer' && (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">The provider is editing this draft. Switch to Priya to edit the milestones.</div>
            )}
            {ms.map((m, i) => (
              <Card key={m.id} title={editable ? `Milestone ${i + 1}` : `${i + 1}. ${m.title}`} action={editable ? (
                <button className="cursor-pointer text-muted hover:text-red-600" aria-label="Remove milestone" onClick={() => setDraft(ms.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
              ) : <span className="font-bold">{money(m.amount)}</span>}>
                {editable ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2"><Field label="Title"><input className={inputCls} value={m.title} onChange={(e) => patch(i, { title: e.target.value })} /></Field></div>
                      <Field label="Amount (USD)"><input className={inputCls} type="number" min={0} value={m.amount} onChange={(e) => patch(i, { amount: Number(e.target.value) })} /></Field>
                    </div>
                    <Field label="Due date"><input className={inputCls} value={m.due} onChange={(e) => patch(i, { due: e.target.value })} /></Field>
                    <Field label="Deliverables (one per line)"><textarea className={`${inputCls} min-h-20`} value={m.deliverables.join('\n')} onChange={(e) => patch(i, { deliverables: e.target.value.split('\n') })} /></Field>
                    <Field label="Acceptance criteria (one per line)" hint="The AI verifier checks the delivery against each line."><textarea className={`${inputCls} min-h-24`} value={m.criteria.join('\n')} onChange={(e) => patch(i, { criteria: e.target.value.split('\n') })} /></Field>
                  </div>
                ) : (
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-muted">Deliverables</div>
                      <ul className="list-disc space-y-1 pl-4">{m.deliverables.map((d, j) => <li key={j}>{d}</li>)}</ul>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-muted">Acceptance criteria</div>
                      <ul className="space-y-1">{m.criteria.map((c, j) => <li key={j} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-blue" />{c}</li>)}</ul>
                    </div>
                    <div className="text-xs text-muted sm:col-span-2">Due {m.due}</div>
                  </div>
                )}
              </Card>
            ))}
            {editable && <Button variant="secondary" onClick={add}><Plus size={16} /> Add milestone</Button>}
          </div>

          <div className="space-y-4">
            <Card title="Summary">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Deal total</dt><dd className="font-bold">{money(t.total)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Milestone sum</dt><dd className={`font-bold ${balanced ? '' : 'text-red-600'}`}>{money(sum)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Payment</dt><dd>One PayPal order per milestone</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Release</dt><dd>After buyer confirmation</dd></div>
              </dl>
              {editable && !balanced && <p className="mt-3 text-xs text-red-600">Milestone amounts must add up to {money(t.total)}.</p>}
            </Card>
            <Card title="Approvals">
              <ul className="space-y-2 text-sm">
                {(['provider', 'buyer'] as const).map((r) => (
                  <li key={r} className="flex items-center justify-between">
                    <span>{r === 'provider' ? 'Priya Raman (provider)' : 'Daniel Whitfield (buyer)'}</span>
                    {t.approvals[r] ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Pending</Badge>}
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2">
                {editable && (
                  <Button className="w-full" disabled={!balanced || ms.some((m) => !m.title.trim() || m.criteria.filter(Boolean).length === 0)} onClick={send}>
                    Send for approval
                  </Button>
                )}
                {needsMine && (
                  <>
                    <Button className="w-full" onClick={() => s.approve(id)}>Approve agreement</Button>
                    <textarea className={`${inputCls} min-h-16`} placeholder="Describe the changes you need" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button variant="secondary" className="w-full" onClick={() => { s.requestChanges(id, note); go(`/tx/${id}/agreement`); setNote(''); }}>Request changes</Button>
                  </>
                )}
                {t.status === 'Awaiting approval' && !needsMine && <p className="text-xs text-muted">Waiting for the other party. Switch user to approve as them.</p>}
                {t.status === 'Active' && <p className="text-sm font-semibold text-emerald-700">Agreement active. Milestones can be funded.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
