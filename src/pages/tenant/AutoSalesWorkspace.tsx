import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CircleDollarSign,
  CreditCard,
  FileCheck2,
  Link2,
  PackageCheck,
  ReceiptText,
  Search,
  ShieldAlert,
  Smartphone,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import type {
  AutoSaleTransaction,
  AutoSalesSnapshot,
  SalePaymentState,
  SalesEvidenceState,
} from '../../contracts/autoSalesOperations';
import type { Tenant } from '../../types';
import { fixtureAutoSalesOperationsPort } from '../../data/autoSalesFixtures';
import { GlassPanel } from '../../components/ui/GlassPanel';

const money = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

const paymentTone: Record<SalePaymentState, string> = {
  Paid: 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300',
  'Pending payment': 'border-red-400/25 bg-red-400/[0.08] text-red-300',
  'Part paid': 'border-amber-400/20 bg-amber-400/[0.07] text-amber-300',
  'Refund review': 'border-violet-400/20 bg-violet-400/[0.07] text-violet-300',
};

const evidenceTone: Record<SalesEvidenceState, string> = {
  Accepted: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300',
  Pending: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-300',
  Missing: 'border-red-400/20 bg-red-400/[0.06] text-red-300',
};

const tenderIcon = {
  MoMo: Smartphone,
  Cash: Banknote,
  POS: CreditCard,
  'Bank transfer': WalletCards,
  Credit: CircleDollarSign,
};

export const AutoSalesWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [snapshot, setSnapshot] = useState<AutoSalesSnapshot | null>(null);
  const [query, setQuery] = useState('');
  const [paymentState, setPaymentState] = useState<SalePaymentState | 'All'>('All');
  const [selected, setSelected] = useState<AutoSaleTransaction | null>(null);
  const [settledIds, setSettledIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    fixtureAutoSalesOperationsPort.loadSalesSnapshot({ tenantId: tenant.id, period: '30d' }).then((data) => {
      if (active) setSnapshot(data);
    });
    return () => {
      active = false;
    };
  }, [tenant.id]);

  const visibleTransactions = useMemo(() => {
    if (!snapshot) return [];
    const normalized = query.trim().toLowerCase();
    return snapshot.transactions.filter((transaction) => {
      const effectiveState = settledIds.includes(transaction.id) ? 'Paid' : transaction.paymentState;
      return (
        (paymentState === 'All' || effectiveState === paymentState)
        && (!normalized || `${transaction.id} ${transaction.customer} ${transaction.registration} ${transaction.vehicle} ${transaction.receiptId} ${transaction.jobId ?? ''}`.toLowerCase().includes(normalized))
      );
    });
  }, [paymentState, query, settledIds, snapshot]);

  if (!snapshot) {
    return <div className="flex min-h-[420px] items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-gray-600">Loading sales contract…</div>;
  }

  const realization = Math.round((snapshot.collectedGhs / snapshot.periodRevenueGhs) * 1000) / 10;
  const reconciliationVariance = snapshot.tenders.reduce((sum, tender) => sum + Math.abs(tender.expectedGhs - tender.declaredGhs), 0);
  const openReceivables = snapshot.transactions.filter((transaction) => transaction.collectedGhs < transaction.amountGhs);

  const recordSettlement = (transaction: AutoSaleTransaction) => {
    setSettledIds((current) => current.includes(transaction.id) ? current : [...current, transaction.id]);
    setFeedback(`${transaction.receiptId} marked settled in this frontend session.`);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-10">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">
            <ReceiptText size={13} /> {tenant.name} / Sale to settlement
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Sales &amp; POS control</h1>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-wider text-gray-500">
            <span className="rounded border border-white/[0.08] px-2 py-1">{snapshot.periodOrders} orders</span>
            <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 text-emerald-300">{realization}% cash realized</span>
            <span className="rounded border border-red-400/20 bg-red-400/[0.05] px-2 py-1 text-red-300">{money.format(snapshot.outstandingCreditGhs)} credit exposed</span>
            <span className="rounded border border-amber-400/20 bg-amber-400/[0.05] px-2 py-1 text-amber-300">{money.format(reconciliationVariance)} unreconciled</span>
          </div>
        </div>
        <div className="text-left xl:text-right">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">As of</div>
          <div className="mt-1 text-xs text-gray-300">{snapshot.asOf}</div>
          <div className="mt-1 max-w-md text-[10px] text-gray-600">{snapshot.source}</div>
        </div>
      </header>

      <section aria-label="Sales decision state" className="grid overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909] xl:grid-cols-[0.85fr_1.3fr_0.85fr]">
        <div className="border-b border-white/[0.07] p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">Revenue realized</div>
            <CircleDollarSign size={16} className="text-vertical-accent" />
          </div>
          <div className="mt-5 text-4xl font-display font-medium tracking-tight text-white">{money.format(snapshot.collectedGhs)}</div>
          <div className="mt-2 text-[10px] text-gray-500">of {money.format(snapshot.periodRevenueGhs)} billed this period</div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-vertical-accent" style={{ width: `${realization}%` }} />
          </div>
          <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-[10px]">
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Average sale</dt><dd className="font-mono text-gray-200">{money.format(snapshot.averageSaleGhs)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Gross margin</dt><dd className="font-mono text-gray-200">{snapshot.grossMarginPct}%</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-gray-500">Still outstanding</dt><dd className="font-mono text-red-300">{money.format(snapshot.outstandingCreditGhs)}</dd></div>
          </dl>
        </div>

        <div className="border-b border-white/[0.07] p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">Tender reconciliation tape</div>
              <div className="mt-1 text-[10px] text-gray-600">Expected sales against declared settlement evidence</div>
            </div>
            <WalletCards size={16} className="text-vertical-accent" />
          </div>
          <div className="mt-4 divide-y divide-dashed divide-white/[0.08] border-y border-dashed border-white/[0.08]">
            {snapshot.tenders.map((tender) => {
              const Icon = tenderIcon[tender.method];
              const variance = tender.declaredGhs - tender.expectedGhs;
              return (
                <div key={tender.method} className="grid grid-cols-[1.1fr_0.85fr_0.85fr_0.7fr] items-center gap-3 py-3 text-[10px]">
                  <div className="flex items-center gap-2 text-gray-300"><Icon size={13} className="text-gray-600" />{tender.method}</div>
                  <div className="text-right font-mono text-gray-500">{money.format(tender.expectedGhs)}</div>
                  <div className="text-right font-mono text-gray-200">{money.format(tender.declaredGhs)}</div>
                  <div className={`text-right font-mono ${variance === 0 ? 'text-emerald-300' : 'text-red-300'}`}>{variance === 0 ? 'Matched' : money.format(variance)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-[1.1fr_0.85fr_0.85fr_0.7fr] gap-3 font-mono text-[8px] uppercase tracking-wider text-gray-700">
            <span>Tender</span><span className="text-right">Expected</span><span className="text-right">Declared</span><span className="text-right">Variance</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">Cross-ledger trace</div>
            <Link2 size={16} className="text-vertical-accent" />
          </div>
          <div className="mt-5 space-y-5">
            {[
              { label: 'Sales linked to job cards', value: snapshot.linkedJobCoveragePct, detail: 'service origin and mechanic attribution', Icon: UsersRound },
              { label: 'Part lines linked to issues', value: snapshot.inventoryReferenceCoveragePct, detail: 'stock movement and margin evidence', Icon: PackageCheck },
              { label: 'Payment evidence accepted', value: 91, detail: 'receipt, tender or settlement reference', Icon: FileCheck2 },
            ].map(({ label, value, detail, Icon }) => (
              <div key={label}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10px] text-gray-300"><Icon size={13} className="text-gray-600" />{label}</div>
                  <span className={value < 90 ? 'font-mono text-[10px] text-amber-300' : 'font-mono text-[10px] text-emerald-300'}>{value}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-vertical-accent/80" style={{ width: `${value}%` }} /></div>
                <div className="mt-1 text-[8px] text-gray-700">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div><h2 className="text-sm font-medium text-white">Channel performance ladder</h2><p className="mt-1 text-[10px] text-gray-500">Revenue alone is not enough; compare margin and payment realization.</p></div>
            <UsersRound size={16} className="text-vertical-accent" />
          </div>
          <div className="divide-y divide-white/[0.06]">
            {[...snapshot.channels].sort((a, b) => b.revenueGhs - a.revenueGhs).map((channel, index) => {
              const revenueShare = (channel.revenueGhs / snapshot.periodRevenueGhs) * 100;
              return (
                <div key={channel.channel} className="grid grid-cols-[0.32fr_1fr_0.55fr_0.55fr] items-center gap-4 px-5 py-4">
                  <div className="flex items-center gap-3"><span className="font-mono text-[9px] text-gray-700">{String(index + 1).padStart(2, '0')}</span><span className="text-[11px] text-gray-200">{channel.channel}</span></div>
                  <div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-vertical-accent/75" style={{ width: `${Math.min(100, revenueShare * 1.8)}%` }} /></div>
                    <div className="mt-1 flex justify-between text-[8px] text-gray-700"><span>{channel.orders} orders</span><span>{money.format(channel.revenueGhs)}</span></div>
                  </div>
                  <div className="text-right"><div className="font-mono text-[8px] uppercase text-gray-600">Margin</div><div className={`mt-1 text-xs ${channel.grossMarginPct < 40 ? 'text-amber-300' : 'text-gray-200'}`}>{channel.grossMarginPct}%</div></div>
                  <div className="text-right"><div className="font-mono text-[8px] uppercase text-gray-600">Realized</div><div className={`mt-1 text-xs ${channel.paymentRealizationPct < 85 ? 'text-red-300' : 'text-emerald-300'}`}>{channel.paymentRealizationPct}%</div></div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-medium text-white">Receivables requiring action</h2><p className="mt-1 text-[10px] text-gray-500">Customer exposure joined to the order or job it can block.</p></div>
            <ShieldAlert size={16} className="text-red-300" />
          </div>
          <div className="mt-4 space-y-3">
            {openReceivables.map((transaction) => {
              const settled = settledIds.includes(transaction.id);
              return (
                <button
                  key={transaction.id}
                  onClick={() => setSelected(transaction)}
                  className="w-full cursor-pointer rounded-lg border border-white/[0.07] bg-black/20 p-4 text-left transition hover:border-vertical-accent/30 hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="font-mono text-[8px] text-vertical-accent">{transaction.receiptId} · {transaction.jobId ?? transaction.channel}</div><div className="mt-1 text-[11px] font-medium text-gray-200">{transaction.customer}</div></div>
                    <span className={`font-mono text-[8px] uppercase ${settled ? 'text-emerald-300' : 'text-red-300'}`}>{settled ? 'Settled' : money.format(transaction.amountGhs - transaction.collectedGhs)}</span>
                  </div>
                  <div className="mt-3 line-clamp-2 text-[9px] leading-4 text-gray-600">{settled ? 'Settlement recorded in this frontend session.' : transaction.nextDecision}</div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-medium text-white">Transaction and fulfilment ledger</h2>
            <p className="mt-1 text-[10px] text-gray-500">{visibleTransactions.length} recent fixture transactions shown · full-period totals remain in the control strip.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search transactions</span>
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sale, customer, vehicle, receipt…" className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent sm:w-72" />
            </label>
            <label>
              <span className="sr-only">Filter by payment state</span>
              <select value={paymentState} onChange={(event) => setPaymentState(event.target.value as SalePaymentState | 'All')} className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 text-xs text-gray-300 outline-none focus:border-vertical-accent">
                <option value="All">All payment states</option>
                <option value="Paid">Paid</option>
                <option value="Pending payment">Pending payment</option>
                <option value="Part paid">Part paid</option>
                <option value="Refund review">Refund review</option>
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left">
            <thead className="bg-black/20 font-mono text-[9px] uppercase tracking-wider text-gray-500">
              <tr>
                {['Sale / time', 'Customer', 'Vehicle', 'Channel', 'Job / receipt', 'Lines', 'Amount', 'Tender', 'Payment', 'Owner', 'Next controlled decision'].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {visibleTransactions.map((transaction) => {
                const settled = settledIds.includes(transaction.id);
                const effectiveState: SalePaymentState = settled ? 'Paid' : transaction.paymentState;
                return (
                  <tr key={transaction.id} className="hover:bg-white/[0.025]">
                    <td className="px-5 py-3"><button onClick={() => setSelected(transaction)} className="cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-vertical-accent"><span className="block font-mono text-[10px] text-vertical-accent">{transaction.id}</span><span className="mt-1 block text-[9px] text-gray-600">{transaction.soldAt}</span></button></td>
                    <td className="px-5 py-3"><div className="text-gray-200">{transaction.customer}</div><div className="mt-1 font-mono text-[9px] text-gray-600">{transaction.phone}</div></td>
                    <td className="max-w-48 px-5 py-3"><div className="truncate text-gray-300">{transaction.vehicle}</div><div className="mt-1 font-mono text-[9px] text-gray-600">{transaction.registration}</div></td>
                    <td className="px-5 py-3 text-gray-400">{transaction.channel}</td>
                    <td className="px-5 py-3"><div className="font-mono text-[9px] text-gray-300">{transaction.jobId ?? 'No job card'}</div><div className="mt-1 font-mono text-[9px] text-gray-600">{transaction.receiptId}</div></td>
                    <td className="px-5 py-3 text-gray-400">{transaction.lines.length}</td>
                    <td className="px-5 py-3 font-mono text-gray-200">{money.format(transaction.amountGhs)}</td>
                    <td className="px-5 py-3 text-gray-400">{transaction.paymentMethod}</td>
                    <td className="px-5 py-3"><span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${paymentTone[effectiveState]}`}>{effectiveState}</span></td>
                    <td className="px-5 py-3"><div className="text-gray-300">{transaction.salesRep}</div><div className="mt-1 text-[9px] text-gray-600">{transaction.mechanic ?? 'Parts counter'}</div></td>
                    <td className="max-w-72 px-5 py-3"><button onClick={() => setSelected(transaction)} className="flex cursor-pointer items-center gap-2 text-left text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><span className="line-clamp-2">{settled ? 'Settlement recorded; complete evidence review.' : transaction.nextDecision}</span><ArrowRight size={12} className="shrink-0 text-vertical-accent" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <div aria-live="polite" className="sr-only">{feedback}</div>
      {createPortal(
        <AnimatePresence>
          {selected && (
            <SaleTransactionDrawer
              transaction={selected}
              settled={settledIds.includes(selected.id)}
              feedback={feedback}
              onSettle={() => recordSettlement(selected)}
              onClose={() => {
                setSelected(null);
                setFeedback('');
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
};

const SaleTransactionDrawer = ({
  transaction,
  settled,
  feedback,
  onSettle,
  onClose,
}: {
  transaction: AutoSaleTransaction;
  settled: boolean;
  feedback: string;
  onSettle: () => void;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const cost = transaction.lines.reduce((sum, line) => sum + line.unitCostGhs * line.quantity, 0);
  const margin = transaction.amountGhs ? Math.round(((transaction.amountGhs - cost) / transaction.amountGhs) * 1000) / 10 : 0;
  const outstanding = settled ? 0 : transaction.amountGhs - transaction.collectedGhs;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <motion.aside
        initial={{ x: 620 }}
        animate={{ x: 0 }}
        exit={{ x: 620 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-transaction-title"
        onClick={(event) => event.stopPropagation()}
        className="custom-scrollbar h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-vertical-accent">{transaction.id} · {transaction.receiptId}</div>
            <h2 id="sale-transaction-title" className="mt-2 text-xl font-medium text-white">{transaction.customer}</h2>
            <p className="mt-1 text-xs text-gray-500">{transaction.vehicle} · {transaction.registration} · {transaction.channel}</p>
          </div>
          <button onClick={onClose} aria-label="Close sale detail" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><X size={17} /></button>
        </div>

        <section className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ['Billed', money.format(transaction.amountGhs)],
            ['Collected', money.format(settled ? transaction.amountGhs : transaction.collectedGhs)],
            ['Outstanding', money.format(outstanding)],
            ['Gross margin', `${margin}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div>
              <div className="mt-2 text-xs text-gray-200">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-vertical-accent/20 bg-vertical-accent-glow p-4">
          <div className="font-mono text-[8px] uppercase tracking-wider text-vertical-accent">Controlled decision</div>
          <p className="mt-2 text-xs leading-5 text-gray-200">{settled ? 'Settlement is recorded. Confirm the evidence reference and complete any linked fulfilment action.' : transaction.nextDecision}</p>
          {outstanding > 0 && (
            <button onClick={onSettle} disabled={settled} className="mt-4 flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-vertical-accent px-4 text-[10px] font-medium text-black transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-default disabled:opacity-60">
              {settled ? <Check size={14} /> : <CircleDollarSign size={14} />}{settled ? 'Settlement recorded' : `Record settlement · ${money.format(outstanding)}`}
            </button>
          )}
          {feedback && <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[10px] text-emerald-300">{feedback}</div>}
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2"><ReceiptText size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Sale lines and margin source</h3></div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]">
            <div className="grid grid-cols-[1.3fr_0.45fr_0.65fr_0.65fr] gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-3 font-mono text-[8px] uppercase text-gray-600">
              <span>Line</span><span className="text-right">Qty</span><span className="text-right">Cost</span><span className="text-right">Sell</span>
            </div>
            {transaction.lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[1.3fr_0.45fr_0.65fr_0.65fr] items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-[10px] last:border-b-0">
                <div><div className="text-gray-200">{line.description}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{line.type} · {line.sku}{line.inventoryMovementId ? ` · ${line.inventoryMovementId}` : ''}</div></div>
                <div className="text-right font-mono text-gray-400">{line.quantity}</div>
                <div className="text-right font-mono text-gray-500">{money.format(line.unitCostGhs)}</div>
                <div className="text-right font-mono text-gray-200">{money.format(line.unitPriceGhs)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2"><BadgeCheck size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Cross-ledger evidence</h3></div>
          <div className="mt-3 space-y-2">
            {transaction.evidence.map((evidence) => (
              <div key={evidence.label} className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                <div><div className="text-[10px] text-gray-300">{evidence.label}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{evidence.reference ?? 'No reference attached'}</div></div>
                <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${evidenceTone[evidence.state]}`}>{evidence.state}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-white/[0.08] bg-black/25 p-4">
          <div className="grid gap-4 text-xs sm:grid-cols-2">
            <div><div className="font-mono text-[8px] uppercase text-gray-600">Sales owner</div><div className="mt-2 text-gray-200">{transaction.salesRep}</div></div>
            <div><div className="font-mono text-[8px] uppercase text-gray-600">Workshop owner</div><div className="mt-2 text-gray-200">{transaction.mechanic ?? 'Not applicable'}</div></div>
            <div><div className="font-mono text-[8px] uppercase text-gray-600">Job card</div><div className="mt-2 font-mono text-gray-200">{transaction.jobId ?? 'Not linked'}</div></div>
            <div><div className="font-mono text-[8px] uppercase text-gray-600">Tender</div><div className="mt-2 text-gray-200">{transaction.paymentMethod} · {settled ? 'Paid' : transaction.paymentState}</div></div>
          </div>
        </section>
      </motion.aside>
    </motion.div>
  );
};
