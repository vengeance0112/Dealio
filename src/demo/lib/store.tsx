import { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'provider' | 'buyer';
export type Work =
  | 'Not Started'
  | 'In Progress'
  | 'Submitted'
  | 'Under Review'
  | 'Revision Requested'
  | 'Accepted';
export type Pay =
  | 'Not Created'
  | 'Order Created'
  | 'Captured – Held'
  | 'Release Pending'
  | 'Released'
  | 'Refunded';
export type Verdict = 'MET' | 'PARTIALLY MET' | 'NOT MET' | 'CANNOT VERIFY';
export type TxStatus = 'Draft' | 'Awaiting approval' | 'Active' | 'Completed' | 'Disputed';

export const users = {
  provider: {
    name: 'Priya Raman',
    org: 'Raman Design Studio',
    email: 'priya@ramandesign.co',
    title: 'Service Provider',
    initials: 'PR',
    paypal: 'priya-sandbox@business.example.com',
  },
  buyer: {
    name: 'Daniel Whitfield',
    org: 'Whitfield & Co. Hospitality',
    email: 'daniel@whitfieldco.com',
    title: 'Buyer',
    initials: 'DW',
    paypal: 'daniel-sandbox@personal.example.com',
  },
};

export interface Transaction {
  id: string;
  title: string;
  category: string;
  description: string;
  total: number;
  start: string;
  due: string;
  status: TxStatus;
  invitation: 'Pending' | 'Accepted';
  agreementVersion: number;
  approvals: { provider: boolean; buyer: boolean };
}
export interface Milestone {
  id: string;
  txId: string;
  title: string;
  description: string;
  amount: number;
  due: string;
  deliverables: string[];
  criteria: string[];
  work: Work;
  payment: Pay;
  /** Criteria indexes the mock verifier flags as unmet on a first submission. */
  gaps?: number[];
}
export interface Submission {
  id: string;
  mid: string;
  version: number;
  description: string;
  files: string[];
  link: string;
  date: string;
}
export interface CriterionResult {
  criterion: string;
  verdict: Verdict;
  evidence: string;
  explanation: string;
  confidence: number;
}
export interface Verification {
  id: string;
  mid: string;
  version: number;
  results: CriterionResult[];
  score: number;
  recommendation: 'Accept' | 'Request revision' | 'Needs human review';
  summary: string;
  at: string;
}
export interface Payment {
  id: string;
  mid: string;
  txId: string;
  amount: number;
  status: Pay;
  order: string;
  capture: string;
  created: string;
  updated: string;
  history: { at: string; text: string }[];
}
export interface Note {
  id: string;
  text: string;
  at: string;
  read: boolean;
  to: Role | 'all';
  link?: string;
}
export interface Dispute {
  id: string;
  txId: string;
  mid: string;
  reason: string;
  description: string;
  raisedBy: Role;
  status: 'Open' | 'Resolved';
  created: string;
  aiSummary: string;
  resolution?: string;
}
export interface Message {
  id: string;
  txId: string;
  from: Role | 'system';
  text: string;
  at: string;
}
export interface TimelineItem {
  txId: string;
  at: string;
  text: string;
  by: string;
}
export interface WebhookEvent {
  at: string;
  type: string;
  ref: string;
  status: string;
}

const mk = (p: Partial<Milestone> & Pick<Milestone, 'id' | 'txId' | 'title' | 'amount' | 'due'>): Milestone => ({
  description: '', deliverables: [], criteria: [], work: 'Not Started', payment: 'Not Created', ...p,
});

export interface State {
  role: Role;
  transactions: Transaction[];
  milestones: Milestone[];
  submissions: Submission[];
  verifications: Verification[];
  payments: Payment[];
  disputes: Dispute[];
  messages: Message[];
  timeline: TimelineItem[];
  notes: Note[];
  events: WebhookEvent[];
}


const now = () => {
  const d = new Date();
  return `Today, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const rid = (n = 6) =>
  Math.random()
    .toString(36)
    .slice(2, 2 + n)
    .toUpperCase();
export const money = (n: number) => `$${n.toLocaleString('en-US')}`;
export const other = (r: Role): Role => (r === 'provider' ? 'buyer' : 'provider');

export function verify(m: Milestone, sub: Submission): Verification {
  const evidence = [...sub.files, ...(sub.link ? [sub.link] : [])];
  const results: CriterionResult[] = m.criteria.map((criterion, i) => {
    if (evidence.length === 0)
      return {
        criterion,
        verdict: 'CANNOT VERIFY',
        evidence: 'No evidence attached',
        explanation: 'The submission contains no files or links that can be inspected.',
        confidence: 0,
      };
    if (sub.version === 1 && m.gaps?.includes(i))
      return {
        criterion,
        verdict: 'NOT MET',
        evidence: 'No evidence found',
        explanation: 'None of the submitted files or links address this criterion.',
        confidence: 89,
      };
    return {
      criterion,
      verdict: 'MET',
      evidence: evidence[i % evidence.length]!,
      explanation: 'The referenced evidence satisfies the agreed acceptance criterion.',
      confidence: 96 - ((i * 3) % 9),
    };
  });
  const pts = results.reduce(
    (a, r) => a + (r.verdict === 'MET' ? 1 : r.verdict === 'PARTIALLY MET' ? 0.5 : 0),
    0,
  );
  const score = Math.round((pts / Math.max(results.length, 1)) * 100);
  const anyNot = results.some((r) => r.verdict === 'NOT MET');
  const anyUnknown = results.some(
    (r) => r.verdict === 'CANNOT VERIFY' || r.verdict === 'PARTIALLY MET',
  );
  const recommendation = anyNot ? 'Request revision' : anyUnknown ? 'Needs human review' : 'Accept';
  const summary =
    recommendation === 'Accept'
      ? 'Every acceptance criterion is supported by the submitted evidence. Release is recommended, subject to your confirmation.'
      : recommendation === 'Request revision'
        ? 'One or more criteria are not supported by the submitted evidence. A revision is recommended before release.'
        : 'Some criteria could not be fully verified. Please review the evidence yourself before deciding.';
  return { id: 'VER-' + rid(), mid: m.id, version: sub.version, results, score, recommendation, summary, at: now() };
}

interface Ctx extends State {
  updateProfile: (name: string, org: string, email: string) => void;
  user: (typeof users)[Role];
  setRole: (r: Role) => void;
  createTransaction: (
    d: Pick<Transaction, 'title' | 'category' | 'description' | 'total' | 'due'>,
  ) => string;
  acceptInvite: (txId: string) => void;
  generateAgreement: (txId: string) => void;
  saveMilestones: (txId: string, ms: Milestone[]) => void;
  sendForApproval: (txId: string) => void;
  approve: (txId: string) => void;
  requestChanges: (txId: string, note: string) => void;
  createOrder: (mid: string) => void;
  capture: (mid: string) => void;
  startWork: (mid: string) => void;
  submitWork: (mid: string, d: { description: string; files: string[]; link: string }) => void;
  runVerification: (mid: string) => void;
  release: (mid: string) => void;
  requestRevision: (mid: string, note: string) => void;
  openDispute: (mid: string, reason: string, description: string) => string;
  resolveDispute: (id: string, outcome: 'release' | 'refund' | 'split') => void;
  sendMessage: (txId: string, text: string) => void;
  notify: (text: string, to: Role | 'all', link?: string) => void;
  markRead: (id?: string) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children, initialState }: { children: ReactNode; initialState: State }) {
  const [s, setS] = useState<State>(initialState);
  const up = (fn: (p: State) => Partial<State>) => setS((p) => ({ ...p, ...fn(p) }));
  const who = (p: State) => users[p.role].name;
  const log = (p: State, txId: string, text: string, by?: string): TimelineItem[] => [
    ...p.timeline,
    { txId, at: now(), text, by: by ?? who(p) },
  ];
  const mkNote = (text: string, to: Role | 'all', link?: string): Note => ({
    id: rid(),
    text,
    at: now(),
    read: false,
    to,
    link,
  });
  const patchM = (p: State, mid: string, patch: Partial<Milestone>) =>
    p.milestones.map((m) => (m.id === mid ? { ...m, ...patch } : m));
  const patchP = (p: State, mid: string, patch: Partial<Payment>, text: string) =>
    p.payments.map((x) =>
      x.mid === mid ? { ...x, ...patch, updated: now(), history: [...x.history, { at: now(), text }] } : x,
    );
  const complete = (txs: Transaction[], ms: Milestone[], txId: string): Transaction[] =>
    txs.map((t) =>
      t.id === txId &&
      ms.filter((m) => m.txId === txId).every((m) => m.work === 'Accepted' || m.payment === 'Refunded')
        ? { ...t, status: 'Completed' }
        : t,
    );

  const ctx: Ctx = {
    ...s,
    updateProfile: (name, org, email) => { Object.assign(users[s.role], { name, org, email }); setS(p => ({ ...p })); },
    user: users[s.role],
    setRole: (role) => up(() => ({ role })),

    createTransaction: (d) => {
      const id = 'TX-' + (1060 + s.transactions.length);
      up((p) => ({
        transactions: [
          {
            id,
            ...d,
            start: 'Nov 4, 2026',
            status: 'Draft',
            invitation: 'Pending',
            agreementVersion: 0,
            approvals: { provider: false, buyer: false },
          },
          ...p.transactions,
        ],
        timeline: log(p, id, 'Transaction created'),
      }));
      return id;
    },
    acceptInvite: (txId) =>
      up((p) => ({
        transactions: p.transactions.map((t) => (t.id === txId ? { ...t, invitation: 'Accepted' } : t)),
        timeline: log(p, txId, 'Invitation accepted', users.buyer.name),
        notes: [
          mkNote('Daniel accepted your invitation. You can now generate the agreement.', 'provider', `/tx/${txId}`),
          ...p.notes,
        ],
      })),
    generateAgreement: (txId) =>
      up((p) => {
        const t = p.transactions.find((x) => x.id === txId)!;
        const split = [0.3, 0.45, 0.25];
        const names = ['Discovery and Design', 'Core Delivery', 'Launch and Handover'];
        const ms = names.map((n, i) =>
          mk({
            id: `m-${txId}-${i + 1}`,
            txId,
            title: n,
            description: `${n} phase for ${t.title}.`,
            amount: Math.round((t.total * split[i]!) / 10) * 10,
            due: t.due,
            deliverables: [`${n} deliverables as described in the agreement`],
            criteria: [
              `${n} deliverables are complete and match the brief`,
              'Files and access are handed over to the buyer',
            ],
          }),
        );
        ms[ms.length - 1]!.amount += t.total - ms.reduce((a, m) => a + m.amount, 0);
        return {
          milestones: [...p.milestones.filter((m) => m.txId !== txId), ...ms],
          transactions: p.transactions.map((x) =>
            x.id === txId ? { ...x, agreementVersion: Math.max(x.agreementVersion, 0) + 1 } : x,
          ),
          timeline: log(p, txId, `Agreement v${t.agreementVersion + 1} generated`, 'Dealio AI'),
        };
      }),
    saveMilestones: (txId, ms) =>
      up((p) => ({ milestones: [...p.milestones.filter((m) => m.txId !== txId), ...ms] })),
    sendForApproval: (txId) =>
      up((p) => ({
        transactions: p.transactions.map((t) =>
          t.id === txId
            ? {
                ...t,
                status: 'Awaiting approval',
                approvals: { provider: p.role === 'provider', buyer: p.role === 'buyer' },
              }
            : t,
        ),
        timeline: log(p, txId, 'Agreement sent for approval'),
        notes: [mkNote('An agreement is waiting for your approval.', other(p.role), `/tx/${txId}/agreement`), ...p.notes],
      })),
    approve: (txId) =>
      up((p) => {
        const t = p.transactions.find((x) => x.id === txId)!;
        const approvals = { ...t.approvals, [p.role]: true };
        const both = approvals.provider && approvals.buyer;
        return {
          transactions: p.transactions.map((x) =>
            x.id === txId ? { ...x, approvals, status: both ? 'Active' : x.status } : x,
          ),
          timeline: log(p, txId, `Agreement v${t.agreementVersion} approved by ${p.role}`),
          notes: [
            mkNote(
              both ? `Agreement for ${t.title} is now active.` : `${who(p)} approved the agreement.`,
              'all',
              `/tx/${txId}`,
            ),
            ...p.notes,
          ],
        };
      }),
    requestChanges: (txId, note) =>
      up((p) => ({
        transactions: p.transactions.map((t) =>
          t.id === txId
            ? {
                ...t,
                status: 'Draft',
                agreementVersion: t.agreementVersion + 1,
                approvals: { provider: false, buyer: false },
              }
            : t,
        ),
        timeline: log(p, txId, `Changes requested: ${note || 'no comment'}`),
        notes: [mkNote('Changes were requested on the agreement.', other(p.role), `/tx/${txId}/agreement`), ...p.notes],
      })),

    createOrder: (mid) =>
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        return {
          milestones: patchM(p, mid, { payment: 'Order Created' }),
          payments: p.payments.some((x) => x.mid === mid)
            ? patchP(p, mid, { status: 'Order Created' }, 'Order created (sandbox)')
            : [
                ...p.payments,
                {
                  id: 'PAY-' + (3100 + p.payments.length),
                  mid,
                  txId: m.txId,
                  amount: m.amount,
                  status: 'Order Created',
                  order: rid(17),
                  capture: '—',
                  created: now(),
                  updated: now(),
                  history: [{ at: now(), text: 'Order created (sandbox)' }],
                },
              ],
        };
      }),
    capture: (mid) =>
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        const cap = rid(17);
        return {
          milestones: patchM(p, mid, { payment: 'Captured – Held' }),
          payments: patchP(
            p,
            mid,
            { status: 'Captured – Held', capture: cap },
            'Buyer approved in PayPal and payment captured',
          ),
          timeline: log(p, m.txId, `Milestone funded through PayPal Sandbox: ${m.title}`),
          events: [{ at: now(), type: 'PAYMENT.CAPTURE.COMPLETED', ref: cap, status: 'Verified' }, ...p.events],
          notes: [mkNote(`${users.buyer.name} funded "${m.title}". You can start work.`, 'provider', `/m/${mid}`), ...p.notes],
        };
      }),
    startWork: (mid) =>
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        return {
          milestones: patchM(p, mid, { work: 'In Progress' }),
          timeline: log(p, m.txId, `Work started: ${m.title}`),
        };
      }),
    submitWork: (mid, d) =>
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        const version = p.submissions.filter((x) => x.mid === mid).length + 1;
        return {
          submissions: [...p.submissions, { id: 'SUB-' + rid(), mid, version, ...d, date: now() }],
          milestones: patchM(p, mid, { work: 'Submitted' }),
          timeline: log(p, m.txId, `Delivery v${version} submitted: ${m.title}`),
          notes: [mkNote(`Delivery submitted for "${m.title}". Run verification.`, 'buyer', `/verify/${mid}`), ...p.notes],
        };
      }),
    runVerification: (mid) =>
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        const subs = p.submissions.filter((x) => x.mid === mid);
        const sub = subs[subs.length - 1];
        if (!sub) return {};
        const v = verify(m, sub);
        return {
          verifications: [...p.verifications.filter((x) => !(x.mid === mid && x.version === sub.version)), v],
          milestones: patchM(p, mid, { work: 'Under Review' }),
          timeline: log(p, m.txId, `AI verification completed (${v.score}%): ${v.recommendation}`, 'Dealio AI'),
        };
      }),
    release: (mid) =>
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        const ms = patchM(p, mid, { work: 'Accepted', payment: 'Released' });
        return {
          milestones: ms,
          payments: patchP(p, mid, { status: 'Released' }, 'Buyer confirmed release; payout executed by backend'),
          transactions: complete(p.transactions, ms, m.txId),
          timeline: log(p, m.txId, `Payment released: ${m.title}`),
          events: [{ at: now(), type: 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED', ref: rid(17), status: 'Verified' }, ...p.events],
          notes: [
            mkNote(`${money(m.amount)} released for "${m.title}".`, 'provider', `/payments/${p.payments.find((x) => x.mid === mid)?.id ?? ''}`),
            ...p.notes,
          ],
        };
      }),
    requestRevision: (mid, note) =>
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        return {
          milestones: patchM(p, mid, { work: 'Revision Requested' }),
          timeline: log(p, m.txId, `Revision requested: ${note || m.title}`),
          notes: [mkNote(`Revision requested on "${m.title}": ${note || 'see criteria'}`, 'provider', `/submit/${mid}`), ...p.notes],
        };
      }),
    openDispute: (mid, reason, description) => {
      const id = 'DSP-' + (205 + s.disputes.length);
      up((p) => {
        const m = p.milestones.find((x) => x.id === mid)!;
        return {
          disputes: [
            ...p.disputes,
            {
              id,
              txId: m.txId,
              mid,
              reason,
              description,
              raisedBy: p.role,
              status: 'Open',
              created: now(),
              aiSummary: `Agreed: ${m.criteria.length} acceptance criteria for "${m.title}" worth ${money(m.amount)}. Raised concern: ${reason}. Next step: both parties add evidence, then agree on release, refund or a split. Dealio does not decide the outcome.`,
            },
          ],
          transactions: p.transactions.map((t) => (t.id === m.txId ? { ...t, status: 'Disputed' } : t)),
          payments: p.payments.some((x) => x.mid === mid)
            ? patchP(p, mid, {}, `Release blocked: dispute ${id} opened`)
            : p.payments,
          timeline: log(p, m.txId, `Dispute ${id} opened`),
          notes: [mkNote(`Dispute ${id} was opened on "${m.title}".`, other(p.role), `/disputes/${id}`), ...p.notes],
        };
      });
      return id;
    },
    resolveDispute: (id, outcome) =>
      up((p) => {
        const d = p.disputes.find((x) => x.id === id)!;
        const label =
          outcome === 'release'
            ? 'Full release to provider'
            : outcome === 'refund'
              ? 'Full refund to buyer'
              : 'Split 50/50 by agreement';
        const refund = outcome === 'refund';
        const ms = patchM(p, d.mid, {
          work: refund ? 'Revision Requested' : 'Accepted',
          payment: refund ? 'Refunded' : 'Released',
        });
        const txs = p.transactions.map((t) =>
          t.id === d.txId ? { ...t, status: 'Active' as TxStatus } : t,
        );
        return {
          disputes: p.disputes.map((x) => (x.id === id ? { ...x, status: 'Resolved', resolution: label } : x)),
          milestones: ms,
          transactions: complete(txs, ms, d.txId),
          payments: patchP(p, d.mid, { status: refund ? 'Refunded' : 'Released' }, `Dispute ${id} resolved: ${label}`),
          timeline: log(p, d.txId, `Dispute ${id} resolved: ${label}`),
          events: [
            {
              at: now(),
              type: refund ? 'PAYMENT.CAPTURE.REFUNDED' : 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED',
              ref: id,
              status: 'Verified',
            },
            ...p.events,
          ],
        };
      }),
    sendMessage: (txId, text) =>
      up((p) => ({ messages: [...p.messages, { id: rid(), txId, from: p.role, text, at: now() }] })),
    notify: (text, to, link) => up((p) => ({ notes: [mkNote(text, to, link), ...p.notes] })),
    markRead: (id) =>
      up((p) => ({ notes: p.notes.map((n) => (!id || n.id === id ? { ...n, read: true } : n)) })),
  };
  return <StoreCtx.Provider value={ctx}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}
