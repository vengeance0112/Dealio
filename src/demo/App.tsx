'use client';
import type { ReactNode } from 'react';
import { Bell, Bot, CreditCard, FileText, Gavel, LayoutDashboard, MessageSquare, Settings, ShieldCheck } from 'lucide-react';
import { Link, match, usePath } from '@/demo/lib/router';
import { StoreProvider, useStore, users, type Role } from '@/demo/lib/store';
import { Dashboard } from '@/demo/pages/Dashboard';
import { TxList, TxNew, TxDetail } from '@/demo/pages/Transactions';
import { Agreement } from '@/demo/pages/Agreement';
import { MilestonePage, FundPage, SubmitPage, VerifyPage, ReviewPage } from '@/demo/pages/Milestone';
import { PaymentsPage, PaymentDetail } from '@/demo/pages/Payments';
import { DisputeList, DisputeNew, DisputeDetail } from '@/demo/pages/Disputes';
import { AgentPage, MessagesPage, NotificationsPage, SettingsPage, AdminPage } from '@/demo/pages/Other';

const routes: [string, (p: Record<string, string>) => ReactNode][] = [
  ['/invite/:id', (p) => <DemoInvite id={p.id!} />],
  ['/', () => <Dashboard />],
  ['/tx', () => <TxList />],
  ['/tx/new', () => <TxNew />],
  ['/tx/:id', (p) => <TxDetail id={p.id!} />],
  ['/tx/:id/agreement', (p) => <Agreement id={p.id!} />],
  ['/m/:mid', (p) => <MilestonePage mid={p.mid!} />],
  ['/fund/:mid', (p) => <FundPage mid={p.mid!} />],
  ['/submit/:mid', (p) => <SubmitPage mid={p.mid!} />],
  ['/verify/:mid', (p) => <VerifyPage mid={p.mid!} />],
  ['/review/:mid', (p) => <ReviewPage mid={p.mid!} />],
  ['/payments', () => <PaymentsPage />],
  ['/payments/:pid', (p) => <PaymentDetail pid={p.pid!} />],
  ['/disputes', () => <DisputeList />],
  ['/disputes/new', () => <DisputeNew />],
  ['/disputes/:did', (p) => <DisputeDetail did={p.did!} />],
  ['/agent', () => <AgentPage />],
  ['/messages', () => <MessagesPage />],
  ['/notifications', () => <NotificationsPage />],
  ['/settings', () => <SettingsPage />],
  ['/admin', () => <AdminPage />],
];

function DemoInvite({ id }: { id: string }) {
  const { transactions, acceptInvite, setRole } = useStore();
  const t = transactions.find(t => t.id === id);
  return <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-8">
    <h1 className="text-2xl font-bold text-brand">Demo invitation</h1>
    {!t ? <p className="mt-4">This fictional invitation is not available in your current demo session.</p> :
      <><p className="mt-4">You are invited to review {t.title}. This invitation only works in this demo session.</p>
        <button onClick={() => { acceptInvite(id); setRole('buyer'); window.location.hash = `/tx/${id}/agreement`; }} className="mt-5 rounded-full bg-brand px-6 py-3 text-white">Accept as Daniel and review</button></>}
  </div>;
}

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tx', label: 'Transactions', icon: FileText },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/disputes', label: 'Disputes', icon: Gavel },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/agent', label: 'Agent', icon: Bot },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-sky text-lg font-extrabold italic text-white">
        D
      </span>
      <span className="text-xl font-extrabold italic tracking-tight text-brand">Dealio</span>
    </Link>
  );
}

function RoleSwitch() {
  const { role, setRole } = useStore();
  return (
    <div className="flex rounded-full bg-slate-100 p-1" role="group" aria-label="Switch demo user">
      {(['provider', 'buyer'] as Role[]).map((r) => (
        <button
          key={r}
          aria-label={`Switch to ${users[r].name}, ${r}`}
          title={`${users[r].name} · ${r}`}
          onClick={() => setRole(r)}
          className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${role === r ? 'bg-brand text-white' : 'text-muted hover:text-brand'}`}
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-[10px]">{users[r].initials}</span>
          <span className="hidden sm:inline">{users[r].name.split(' ')[0]}</span>
          <span className="hidden text-xs font-medium opacity-80 sm:inline">{r === 'provider' ? 'Provider' : 'Buyer'}</span>
        </button>
      ))}
    </div>
  );
}

function Shell({ children, path }: { children: ReactNode; path: string }) {
  const { notes, role } = useStore();
  const unread = notes.filter((n) => !n.read && (n.to === 'all' || n.to === role)).length;
  const active = (to: string) => (to === '/' ? path === '/' : path.startsWith(to));
  return (
    <div className="flex min-h-full flex-col">
      <div className="bg-navy px-4 py-2 text-center text-xs text-white">EVALUATOR DEMO · Fictional accounts, simulated payments and AI · <a href="/" className="underline">Exit demo</a> · <a href="/login" className="underline">Real account</a></div><header className="sticky top-3 z-40 mx-3 mt-3 rounded-2xl border border-white/80 bg-white/70 shadow-[0_8px_32px_-12px_rgba(0,48,135,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl backdrop-saturate-150 sm:mx-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 xl:flex">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold ${active(n.to) ? 'bg-blue-50 text-brand' : 'text-muted hover:text-brand'}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <RoleSwitch />
            <Link to="/notifications" aria-label="Notifications" className="relative rounded-full p-2 text-brand hover:bg-blue-50">
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
            <Link to="/settings" aria-label="Settings" className="hidden rounded-full p-2 text-brand hover:bg-blue-50 sm:block">
              <Settings size={20} />
            </Link>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/70 px-3 py-2 xl:hidden">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${active(n.to) ? 'bg-blue-50 text-brand' : 'text-muted'}`}
            >
              <n.icon size={15} />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-line bg-white py-5 text-center text-xs text-muted">
        Dealio demo · PayPal Sandbox only, no real money moves · Not a licensed escrow provider
      </footer>
    </div>
  );
}

function Router() {
  const path = usePath();
  let view: ReactNode = null;
  for (const [pattern, render] of routes) {
    const params = match(pattern, path);
    if (params) {
      view = render(params);
      break;
    }
  }
  return (
    <Shell path={path}>
      {view ?? (
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-brand">Page not found</h1>
          <Link to="/" className="mt-3 inline-block font-semibold text-blue">
            Back to dashboard
          </Link>
        </div>
      )}
    </Shell>
  );
}

export default function App({ initialState }: { initialState: any }) {
  return (
    <StoreProvider initialState={initialState}>
      <Router />
    </StoreProvider>
  );
}
