import { useEffect, useRef, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { Link, go } from '@/demo/lib/router';
import { money, other, useStore, users } from '@/demo/lib/store';
import { Badge, Button, Card, Empty, Field, PageHeader, Stat, inputCls } from '@/demo/components/ui';
import { useActions } from '@/demo/pages/Dashboard';

/* ---------------- Agent ---------------- */
interface Proposal {
  id: string;
  label: string;
  detail: string;
  kind: 'navigate' | 'remind';
  to?: string;
  text?: string;
}
interface Turn {
  from: 'user' | 'agent';
  text: string;
  proposals?: Proposal[];
}

export function AgentPage() {
  const s = useStore();
  const actions = useActions(s.role);
  const [turns, setTurns] = useState<Turn[]>([
    { from: 'agent', text: `Hi ${s.user.name.split(' ')[0]}. I can read your deals and propose next steps. I never move money myself. Releases always need your confirmation.` },
  ]);
  const [input, setInput] = useState('');
  const [done, setDone] = useState<string[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns]);

  const reply = (q: string): Turn => {
    const t = q.toLowerCase();
    const held = s.payments.filter((p) => p.status === 'Captured – Held').reduce((a, p) => a + p.amount, 0);
    if (t.includes('next') || t.includes('todo') || t.includes('action'))
      return {
        from: 'agent',
        text: actions.length ? `You have ${actions.length} item${actions.length > 1 ? 's' : ''} waiting. Here are the top ones.` : 'Nothing needs your action right now.',
        proposals: actions.slice(0, 3).map((a, i) => ({ id: `${Date.now()}-${i}`, label: a.text, detail: a.sub, kind: 'navigate', to: a.to })),
      };
    if (t.includes('held') || t.includes('money') || t.includes('fund') || t.includes('paid'))
      return { from: 'agent', text: `${money(held)} is currently held in the PayPal Sandbox across ${s.payments.filter((p) => p.status === 'Captured – Held').length} milestones. ${money(s.payments.filter((p) => p.status === 'Released').reduce((a, p) => a + p.amount, 0))} has been released.` };
    if (t.includes('release'))
      return {
        from: 'agent',
        text: 'I cannot release funds. I can take you to the release decision, where the buyer confirms.',
        proposals: s.milestones.filter((m) => m.work === 'Under Review' && m.payment === 'Captured – Held').map((m) => ({ id: m.id, label: `Open release decision: ${m.title}`, detail: money(m.amount), kind: 'navigate' as const, to: `/review/${m.id}` })),
      };
    if (t.includes('remind') || t.includes('nudge')) {
      const o = other(s.role);
      return { from: 'agent', text: `I can send ${users[o].name.split(' ')[0]} a reminder about open items.`, proposals: [{ id: 'remind-' + Date.now(), label: `Send reminder to ${users[o].name}`, detail: 'Creates an in-app notification', kind: 'remind', text: `${s.user.name} sent a reminder: you have open items on Dealio.` }] };
    }
    if (t.includes('dispute'))
      return { from: 'agent', text: `There ${s.disputes.filter((d) => d.status === 'Open').length === 1 ? 'is 1 open dispute' : `are ${s.disputes.filter((d) => d.status === 'Open').length} open disputes`}.`, proposals: s.disputes.filter((d) => d.status === 'Open').map((d) => ({ id: d.id, label: `Review ${d.id}`, detail: d.reason, kind: 'navigate' as const, to: `/disputes/${d.id}` })) };
    const active = s.transactions.filter((x) => x.status === 'Active');
    return {
      from: 'agent',
      text: `${active.length} active deal${active.length === 1 ? '' : 's'}: ${active.map((x) => x.title).join(', ') || 'none'}. Ask me what is next, where the money is, or to send a reminder.`,
    };
  };
  const ask = (q: string) => {
    if (!q.trim()) return;
    setTurns((p) => [...p, { from: 'user', text: q }, reply(q)]);
    setInput('');
  };
  const confirm = (p: Proposal) => {
    setDone((d) => [...d, p.id]);
    if (p.kind === 'remind') {
      s.notify(p.text!, other(s.role));
      setTurns((t) => [...t, { from: 'agent', text: 'Reminder sent.' }]);
    } else if (p.to) go(p.to);
  };
  return (
    <>
      <PageHeader title="Dealio Agent" sub="Reads your deal state and proposes actions. Every action needs your confirmation, and payments are never executed by the agent." />
      <Card className="flex h-[60vh] flex-col !p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.from === 'user' ? 'justify-end' : ''}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${t.from === 'user' ? 'bg-brand text-white' : 'bg-slate-100'}`}>
                {t.from === 'agent' && <Bot size={14} className="mb-1 text-blue" />}
                <p>{t.text}</p>
                {t.proposals?.map((p) => (
                  <div key={p.id} className="mt-3 rounded-xl border border-line bg-white p-3 text-ink">
                    <div className="text-xs font-semibold uppercase text-muted">Proposed action</div>
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-xs text-muted">{p.detail}</div>
                    <Button className="mt-2 !py-1.5" disabled={done.includes(p.id)} onClick={() => confirm(p)}>{done.includes(p.id) ? 'Confirmed' : 'Confirm'}</Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="border-t border-line p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {['What is next for me?', 'Where is the money?', 'Any disputes?', 'Send a reminder', 'Release a payment'].map((c) => (
              <button key={c} onClick={() => ask(c)} className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-semibold text-brand hover:bg-blue-50">{c}</button>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <input className={inputCls} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the agent" />
            <Button type="submit" aria-label="Send"><Send size={16} /></Button>
          </form>
        </div>
      </Card>
    </>
  );
}

/* ---------------- Messages ---------------- */
export function MessagesPage() {
  const s = useStore();
  const [tx, setTx] = useState('TX-1042');
  const [text, setText] = useState('');
  const thread = s.messages.filter((m) => m.txId === tx);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView(); }, [thread.length, tx]);
  return (
    <>
      <PageHeader title="Messages" sub="Keep every conversation attached to the deal it belongs to." />
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1" title="Deals">
          <ul className="space-y-1">
            {s.transactions.map((t) => (
              <li key={t.id}><button onClick={() => setTx(t.id)} className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm ${tx === t.id ? 'bg-blue-50 font-semibold text-brand' : 'hover:bg-slate-50'}`}>{t.title}<div className="text-xs font-normal text-muted">{t.id}</div></button></li>
            ))}
          </ul>
        </Card>
        <Card className="flex h-[55vh] flex-col !p-0 lg:col-span-3">
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {thread.length === 0 && <Empty text="No messages yet. Say hello." />}
            {thread.map((m) => {
              const mine = m.from === s.role;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : ''}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-brand text-white' : 'bg-slate-100'}`}>
                    <div className={`mb-0.5 text-xs ${mine ? 'text-white/70' : 'text-muted'}`}>{m.from === 'system' ? 'Dealio' : users[m.from].name} · {m.at}</div>
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t border-line p-4" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { s.sendMessage(tx, text.trim()); setText(''); } }}>
            <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message as ${s.user.name.split(' ')[0]}`} />
            <Button type="submit" aria-label="Send"><Send size={16} /></Button>
          </form>
        </Card>
      </div>
    </>
  );
}

/* ---------------- Notifications ---------------- */
export function NotificationsPage() {
  const s = useStore();
  const mine = s.notes.filter((n) => n.to === 'all' || n.to === s.role);
  return (
    <>
      <PageHeader title="Notifications" action={<Button variant="secondary" onClick={() => s.markRead()}>Mark all read</Button>} />
      <Card>
        {mine.length === 0 && <Empty text="You have no notifications." />}
        <ul className="divide-y divide-line">
          {mine.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? 'bg-slate-200' : 'bg-blue'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{n.text}</div>
                <div className="text-xs text-muted">{n.at}</div>
              </div>
              {n.link && <Link to={n.link} onClick={() => s.markRead(n.id)} className="text-sm font-semibold text-blue">Open</Link>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

/* ---------------- Settings ---------------- */
export function SettingsPage() {
  const { user, role, updateProfile } = useStore();
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeader title="Settings" sub="Profile and payout connection for the current demo user." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); updateProfile(String(f.get('name')), String(f.get('org')), String(f.get('email'))); setSaved(true); }}>
            <Field label="Full name"><input className={inputCls} name="name" defaultValue={user.name} key={role + 'n'} /></Field>
            <Field label="Organisation"><input className={inputCls} name="org" defaultValue={user.org} key={role + 'o'} /></Field>
            <Field label="Email"><input className={inputCls} name="email" defaultValue={user.email} key={role + 'e'} /></Field>
            <Button type="submit">Save changes</Button>
            {saved && <span className="ml-3 text-sm text-emerald-700">Saved</span>}
          </form>
        </Card>
        <Card title="PayPal connection">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Environment</span><Badge tone="blue">Sandbox</Badge></div>
            <div className="flex items-center justify-between"><span>{role === 'buyer' ? 'Paying account' : 'Payout account'}</span><b>{user.paypal}</b></div>
            <div className="flex items-center justify-between"><span>API credentials</span><Badge tone="amber">Server-side only</Badge></div>
            <p className="text-xs text-muted">Client ID and secret are never stored in this front end. A real integration reads them from server environment variables.</p>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ---------------- Admin ---------------- */
export function AdminPage() {
  const s = useStore();
  const volume = s.payments.reduce((a, p) => a + p.amount, 0);
  return (
    <>
      <PageHeader title="Admin console" sub="Operations view: payment events, verification quality and audit trail." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Transactions" value={s.transactions.length} />
        <Stat label="Sandbox volume" value={money(volume)} />
        <Stat label="AI verifications" value={s.verifications.length} />
        <Stat label="Open disputes" value={s.disputes.filter((d) => d.status === 'Open').length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Simulated PayPal events">
          <ul className="divide-y divide-line text-sm">
            {s.events.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div><div className="font-mono text-xs font-semibold">{e.type}</div><div className="text-xs text-muted">{e.ref} · {e.at}</div></div>
                <Badge tone="green">{e.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Audit trail">
          <ul className="max-h-96 divide-y divide-line overflow-y-auto text-sm">
            {[...s.timeline].reverse().map((t, i) => (
              <li key={i} className="py-2.5"><div>{t.text}</div><div className="text-xs text-muted">{t.txId} · {t.by} · {t.at}</div></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
