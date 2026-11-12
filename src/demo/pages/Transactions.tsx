import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Link, go } from '@/demo/lib/router';
import { money, useStore } from '@/demo/lib/store';
import {
  Button,
  Card,
  Empty,
  Field,
  LinkButton,
  MoneyFlow,
  PageHeader,
  PayBadge,
  Timeline,
  TxBadge,
  WorkBadge,
  inputCls,
} from '@/demo/components/ui';

export function TxList() {
  const { transactions, milestones } = useStore();
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const rows = transactions.filter(
    (t) => (f === 'All' || t.status === f) && (t.title + t.id).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeader title="Transactions" sub="Every deal, its agreement and its milestones." action={<LinkButton to="/tx/new">New transaction</LinkButton>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search by title or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[200px]`} value={f} onChange={(e) => setF(e.target.value)}>
          {['All', 'Draft', 'Awaiting approval', 'Active', 'Completed', 'Disputed'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                {['ID', 'Title', 'Category', 'Milestones', 'Total', 'Due', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                  <td className="px-4 py-3 font-semibold">
                    <Link to={`/tx/${t.id}`} className="text-brand hover:underline">{t.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{t.category}</td>
                  <td className="px-4 py-3">{milestones.filter((m) => m.txId === t.id).length}</td>
                  <td className="px-4 py-3 font-bold">{money(t.total)}</td>
                  <td className="px-4 py-3">{t.due}</td>
                  <td className="px-4 py-3"><TxBadge s={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty text="No transactions match your filters." />}
        </div>
      </Card>
    </>
  );
}

export function TxNew() {
  const { createTransaction, generateAgreement, user } = useStore();
  const [f, setF] = useState({
    title: '',
    category: 'Web design and development',
    description: '',
    total: '',
    due: '',
    email: 'daniel@whitfieldco.com',
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.title.trim() && Number(f.total) > 0 && f.due.trim() && f.description.trim();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = createTransaction({
      title: f.title,
      category: f.category,
      description: f.description,
      total: Number(f.total),
      due: f.due,
    });
    generateAgreement(id);
    go(`/tx/${id}/agreement`);
  };
  return (
    <>
      <PageHeader back={{ to: '/tx', label: 'Transactions' }} title="New transaction" sub="Describe the deal. Dealio AI will structure it into milestones and acceptance criteria for you to edit." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-white p-6 lg:col-span-2">
          <Field label="Deal title"><input className={inputCls} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Quarterly Marketing Campaign" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className={inputCls} value={f.category} onChange={(e) => set('category', e.target.value)}>
                {['Web design and development', 'Branding and visual identity', 'Software development', 'Photography and content', 'Consulting and advisory'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Counterparty email"><input className={inputCls} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Total amount (USD)"><input className={inputCls} type="number" min={1} value={f.total} onChange={(e) => set('total', e.target.value)} placeholder="6000" /></Field>
            <Field label="Final due date"><input className={inputCls} value={f.due} onChange={(e) => set('due', e.target.value)} placeholder="Jan 30, 2027" /></Field>
          </div>
          <Field label="What has been agreed?" hint="Paste the conversation or write the scope. AI extracts milestones, amounts and criteria.">
            <textarea className={`${inputCls} min-h-32`} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe deliverables, timelines and what done looks like." />
          </Field>
          <Button type="submit" disabled={!valid}>Generate agreement with Dealio AI</Button>
        </form>
        <div className="space-y-4">
          <Card title="You are creating this as">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted">{user.org} · {user.email}</div>
          </Card>
          <MoneyFlow />
        </div>
      </div>
    </>
  );
}

export function TxDetail({ id }: { id: string }) {
  const { transactions, milestones, timeline, acceptInvite, role, payments } = useStore();
  const [copied, setCopied] = useState(false);
  const t = transactions.find((x) => x.id === id);
  if (!t) return <Empty text="Transaction not found." />;
  const ms = milestones.filter((m) => m.txId === id);
  const funded = payments.filter((p) => p.txId === id && ['Captured – Held', 'Released'].includes(p.status)).reduce((a, p) => a + p.amount, 0);
  const released = ms.filter((m) => m.payment === 'Released').reduce((a, m) => a + m.amount, 0);
  return (
    <>
      <PageHeader
        back={{ to: '/tx', label: 'Transactions' }}
        title={<span className="flex flex-wrap items-center gap-3">{t.title} <TxBadge s={t.status} /></span>}
        sub={`${t.id} · ${t.category} · ${t.start} to ${t.due}`}
        action={<LinkButton to={`/tx/${id}/agreement`} variant="secondary">View agreement (v{t.agreementVersion})</LinkButton>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Overview">
            <p className="text-sm">{t.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div><div className="text-xs text-muted">Total</div><div className="font-bold">{money(t.total)}</div></div>
              <div><div className="text-xs text-muted">Funded</div><div className="font-bold">{money(funded)}</div></div>
              <div><div className="text-xs text-muted">Released</div><div className="font-bold">{money(released)}</div></div>
            </div>
          </Card>
          <Card title="Milestones">
            {ms.length === 0 && <Empty text="No milestones yet. Generate the agreement first." />}
            <ul className="divide-y divide-line">
              {ms.map((m, i) => (
                <li key={m.id}>
                  <Link to={`/m/${m.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:opacity-80">
                    <div>
                      <div className="text-sm font-semibold">{i + 1}. {m.title}</div>
                      <div className="text-xs text-muted">Due {m.due} · {m.criteria.length} acceptance criteria</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="mr-1 text-sm font-bold">{money(m.amount)}</span>
                      <WorkBadge s={m.work} />
                      <PayBadge s={m.payment} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Counterparty">
            <div className="text-sm font-semibold">{role === 'provider' ? 'Daniel Whitfield' : 'Priya Raman'}</div>
            <div className="text-xs text-muted">{role === 'provider' ? 'Whitfield & Co. Hospitality' : 'Raman Design Studio'}</div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.invitation === 'Accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                Invitation {t.invitation.toLowerCase()}
              </span>
            </div>
            {t.invitation === 'Pending' && (
              <div className="mt-3 space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => { void navigator.clipboard?.writeText(`${location.origin}/explore#/invite/${t.id}`); setCopied(true); }}>
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Link copied' : 'Copy invite link'}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => acceptInvite(t.id)}>Simulate counterparty accepting</Button>
              </div>
            )}
          </Card>
          <Card title="Timeline"><Timeline items={timeline.filter((x) => x.txId === id)} /></Card>
        </div>
      </div>
    </>
  );
}
