import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Link } from '@/demo/lib/router';
import type { Pay, TxStatus, Verdict, Work } from '@/demo/lib/store';

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'navy';
const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  navy: 'bg-brand text-white',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

const workTone: Record<Work, Tone> = {
  'Not Started': 'gray',
  'In Progress': 'blue',
  Submitted: 'amber',
  'Under Review': 'amber',
  'Revision Requested': 'red',
  Accepted: 'green',
};
const payTone: Record<Pay, Tone> = {
  'Not Created': 'gray',
  'Order Created': 'amber',
  'Captured – Held': 'blue',
  'Release Pending': 'amber',
  Released: 'green',
  Refunded: 'red',
};
const txTone: Record<TxStatus, Tone> = {
  Draft: 'gray',
  'Awaiting approval': 'amber',
  Active: 'blue',
  Completed: 'green',
  Disputed: 'red',
};
const verdictTone: Record<Verdict, Tone> = {
  MET: 'green',
  'PARTIALLY MET': 'amber',
  'NOT MET': 'red',
  'CANNOT VERIFY': 'gray',
};
export const WorkBadge = ({ s }: { s: Work }) => <Badge tone={workTone[s]}>{s}</Badge>;
export const PayBadge = ({ s }: { s: Pay }) => <Badge tone={payTone[s]}>{s}</Badge>;
export const TxBadge = ({ s }: { s: TxStatus }) => <Badge tone={txTone[s]}>{s}</Badge>;
export const VerdictBadge = ({ s }: { s: Verdict }) => <Badge tone={verdictTone[s]}>{s}</Badge>;

type Variant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-navy',
  gold: 'bg-gold text-[#2c2e2f] hover:bg-gold-dark',
  secondary: 'border border-brand text-brand bg-white hover:bg-blue-50',
  ghost: 'text-brand hover:bg-blue-50',
  danger: 'border border-red-300 text-red-700 bg-white hover:bg-red-50',
};

export function Button({
  variant = 'primary',
  className = '',
  ...p
}: { variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}

export function LinkButton({
  to,
  variant = 'primary',
  children,
  className = '',
}: {
  to: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-brand">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  sub,
  action,
  back,
}: {
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link to={back.to} className="mb-2 inline-block text-sm font-semibold text-blue hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">{title}</h1>
          {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20';

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-brand">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const color = value >= 90 ? 'bg-emerald-500' : value >= 50 ? 'bg-gold' : 'bg-red-500';
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex justify-between text-sm font-semibold">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer rounded-full p-1 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}

export function MoneyFlow() {
  return (
    <div className="rounded-2xl border border-blue/20 bg-blue-50/60 p-5">
      <div className="mb-2 flex items-center gap-2 font-bold text-brand">
        <ShieldCheck size={18} /> How your money moves
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-ink/90">
        <li>The buyer funds one milestone at a time into the Dealio PayPal Sandbox merchant account.</li>
        <li>The provider delivers, and AI checks the evidence against the approved criteria.</li>
        <li>The platform releases the milestone to the provider only after the buyer confirms.</li>
      </ol>
      <p className="mt-3 text-xs text-muted">
        This demonstrates the workflow with sandbox funds. It is not a production escrow. Production use needs
        PayPal marketplace or partner approval, or a properly licensed arrangement.
      </p>
    </div>
  );
}

export function Timeline({ items }: { items: { at: string; text: string; by: string }[] }) {
  if (!items.length) return <Empty text="No activity yet." />;
  return (
    <ol className="relative space-y-4 border-l-2 border-line pl-5">
      {[...items].reverse().map((t, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue" />
          <div className="text-sm font-medium">{t.text}</div>
          <div className="text-xs text-muted">
            {t.by} · {t.at}
          </div>
        </li>
      ))}
    </ol>
  );
}
