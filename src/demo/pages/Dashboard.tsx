import { ArrowRight } from 'lucide-react';
import { Link } from '@/demo/lib/router';
import { money, useStore, type Role } from '@/demo/lib/store';
import { Card, LinkButton, MoneyFlow, PageHeader, Stat, TxBadge, Timeline } from '@/demo/components/ui';

export function useActions(role: Role) {
  const { transactions, milestones } = useStore();
  const out: { text: string; sub: string; to: string; cta: string }[] = [];
  for (const t of transactions) {
    if (t.status === 'Awaiting approval' && !t.approvals[role])
      out.push({ text: `Approve agreement: ${t.title}`, sub: `${money(t.total)} · ${t.id}`, to: `/tx/${t.id}/agreement`, cta: 'Review' });
    if (t.status === 'Draft' && t.agreementVersion > 0 && role === 'provider')
      out.push({ text: `Finish agreement: ${t.title}`, sub: t.id, to: `/tx/${t.id}/agreement`, cta: 'Continue' });
    if (t.status !== 'Active') continue;
    const ms = milestones.filter((m) => m.txId === t.id);
    const prevDone = (i: number) => i === 0 || ms[i - 1]!.payment === 'Released';
    ms.forEach((m, i) => {
      if (role === 'buyer') {
        if (m.payment === 'Not Created' && prevDone(i))
          out.push({ text: `Fund milestone: ${m.title}`, sub: `${money(m.amount)} · ${t.title}`, to: `/fund/${m.id}`, cta: 'Fund' });
        if (m.work === 'Submitted') out.push({ text: `Verify delivery: ${m.title}`, sub: t.title, to: `/verify/${m.id}`, cta: 'Verify' });
        if (m.work === 'Under Review' && m.payment === 'Captured – Held')
          out.push({ text: `Confirm release: ${m.title}`, sub: `${money(m.amount)} · ${t.title}`, to: `/review/${m.id}`, cta: 'Review' });
      } else {
        if (m.payment === 'Captured – Held' && m.work === 'Not Started')
          out.push({ text: `Start work: ${m.title}`, sub: t.title, to: `/m/${m.id}`, cta: 'Open' });
        if (m.work === 'In Progress' && m.payment === 'Captured – Held')
          out.push({ text: `Submit delivery: ${m.title}`, sub: `Due ${m.due} · ${t.title}`, to: `/submit/${m.id}`, cta: 'Submit' });
        if (m.work === 'Revision Requested')
          out.push({ text: `Resubmit delivery: ${m.title}`, sub: t.title, to: `/submit/${m.id}`, cta: 'Resubmit' });
      }
    });
  }
  return out;
}

export function Dashboard() {
  const { role, user, transactions, milestones, payments, timeline, disputes } = useStore();
  const actions = useActions(role);
  const held = payments.filter((p) => p.status === 'Captured – Held').reduce((a, p) => a + p.amount, 0);
  const released = payments.filter((p) => p.status === 'Released').reduce((a, p) => a + p.amount, 0);
  const active = transactions.filter((t) => t.status === 'Active' || t.status === 'Awaiting approval');

  return (
    <>
      <PageHeader
        title={`Good morning, ${user.name.split(' ')[0]}`}
        sub={`${user.org} · signed in as ${user.title.toLowerCase()}. Agree clearly. Work confidently. Pay with accountability.`}
        action={<LinkButton to="/tx/new">New transaction</LinkButton>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active deals" value={active.length} sub={`${transactions.length} total`} />
        <Stat label="Held in sandbox" value={money(held)} sub="Awaiting buyer confirmation" />
        <Stat label="Released" value={money(released)} sub="Paid out to provider" />
        <Stat label="Open disputes" value={disputes.filter((d) => d.status === 'Open').length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Needs your action (${actions.length})`}>
            {actions.length === 0 ? (
              <p className="text-sm text-muted">You are all caught up. Switch user to see the other side of the deal.</p>
            ) : (
              <ul className="divide-y divide-line">
                {actions.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <div className="text-sm font-semibold">{a.text}</div>
                      <div className="text-xs text-muted">{a.sub}</div>
                    </div>
                    <LinkButton to={a.to} variant="secondary" className="shrink-0 !py-1.5">
                      {a.cta} <ArrowRight size={14} />
                    </LinkButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Your transactions" action={<Link to="/tx" className="text-sm font-semibold text-blue">View all</Link>}>
            <ul className="divide-y divide-line">
              {transactions.slice(0, 4).map((t) => {
                const ms = milestones.filter((m) => m.txId === t.id);
                const done = ms.filter((m) => m.payment === 'Released').length;
                return (
                  <li key={t.id}>
                    <Link to={`/tx/${t.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                      <div>
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className="text-xs text-muted">
                          {t.id} · {done}/{ms.length} milestones released · Due {t.due}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden text-sm font-bold sm:block">{money(t.total)}</span>
                        <TxBadge s={t.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <MoneyFlow />
          <Card title="Recent activity">
            <Timeline items={timeline.slice(-5)} />
          </Card>
        </div>
      </div>
    </>
  );
}
