import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Link } from '@/demo/lib/router';
import { money, useStore, type Payment } from '@/demo/lib/store';
import { Card, Empty, LinkButton, MoneyFlow, PageHeader, PayBadge, Stat, Timeline, inputCls } from '@/demo/components/ui';

type Key = 'id' | 'amount' | 'status' | 'updated';

export function PaymentsPage() {
  const { payments, milestones, transactions } = useStore();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: 'updated', dir: -1 });
  const rows = useMemo(() => {
    const r = payments.filter(
      (p) =>
        (status === 'All' || p.status === status) &&
        (p.id + p.order + (transactions.find((t) => t.id === p.txId)?.title ?? '')).toLowerCase().includes(q.toLowerCase()),
    );
    return [...r].sort((a: Payment, b: Payment) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.dir);
  }, [payments, q, status, sort, transactions]);
  const total = (s: string) => payments.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  const th = (k: Key, label: string) => (
    <th className="px-4 py-3 font-semibold">
      <button className="flex cursor-pointer items-center gap-1 uppercase" onClick={() => setSort({ k, dir: sort.k === k ? (-sort.dir as 1 | -1) : 1 })}>
        {label} {sort.k === k && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
  return (
    <>
      <PageHeader title="Payments ledger" sub="One PayPal order per milestone. Payment status is tracked separately from workflow status." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Held" value={money(total('Captured – Held'))} />
        <Stat label="Released" value={money(total('Released'))} />
        <Stat label="Refunded" value={money(total('Refunded'))} />
        <Stat label="Records" value={payments.length} />
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search payments" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[200px]`} value={status} onChange={(e) => setStatus(e.target.value)}>
          {['All', 'Order Created', 'Captured – Held', 'Released', 'Refunded'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-muted"><tr>{th('id', 'Payment')}<th className="px-4 py-3 font-semibold uppercase">Deal / milestone</th><th className="px-4 py-3 font-semibold uppercase">PayPal order</th>{th('amount', 'Amount')}{th('status', 'Status')}{th('updated', 'Updated')}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-3"><Link to={`/payments/${p.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">{p.id}</Link></td>
                  <td className="px-4 py-3"><div className="font-semibold">{transactions.find((t) => t.id === p.txId)?.title}</div><div className="text-xs text-muted">{milestones.find((m) => m.id === p.mid)?.title}</div></td>
                  <td className="px-4 py-3 font-mono text-xs">{p.order}</td>
                  <td className="px-4 py-3 font-bold">{money(p.amount)}</td>
                  <td className="px-4 py-3"><PayBadge s={p.status} /></td>
                  <td className="px-4 py-3 text-muted">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <Empty text="No payments match your filters." />}
        </div>
      </Card>
    </>
  );
}

export function PaymentDetail({ pid }: { pid: string }) {
  const { payments, milestones, transactions } = useStore();
  const p = payments.find((x) => x.id === pid);
  if (!p) return <Empty text="Payment not found." />;
  const m = milestones.find((x) => x.id === p.mid);
  const t = transactions.find((x) => x.id === p.txId);
  return (
    <>
      <PageHeader back={{ to: '/payments', label: 'Payments' }} title={`Payment ${p.id}`} sub={`${t?.title} · ${m?.title}`} action={<PayBadge s={p.status} />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Details">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[
                ['Amount', money(p.amount) + ' USD'],
                ['PayPal order ID (sandbox)', p.order],
                ['Capture ID (sandbox)', p.capture],
                ['Created', p.created],
                ['Last updated', p.updated],
                ['Idempotency key', `dealio-${p.id.toLowerCase()}`],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title="Payment history"><Timeline items={p.history.map((h) => ({ ...h, by: 'PayPal Sandbox' }))} /></Card>
        </div>
        <div className="space-y-4">
          <LinkButton to={`/m/${p.mid}`} variant="secondary" className="w-full">Open milestone</LinkButton>
          <MoneyFlow />
        </div>
      </div>
    </>
  );
}
