import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertOctagon,
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarClock,
  Check,
  ClipboardCheck,
  FileWarning,
  PackageCheck,
  Search,
  ShieldAlert,
  ShoppingCart,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';
import type {
  AutoInventoryItem,
  AutoInventorySnapshot,
  InventoryHealth,
  InventoryReorderDecision,
} from '../../contracts/autoInventoryOperations';
import type { Tenant } from '../../types';
import { fixtureAutoInventoryOperationsPort } from '../../data/autoInventoryFixtures';
import { GlassPanel } from '../../components/ui/GlassPanel';

const money = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

const healthTone: Record<InventoryHealth, string> = {
  Available: 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300',
  'Low cover': 'border-amber-400/20 bg-amber-400/[0.07] text-amber-300',
  Stockout: 'border-red-400/25 bg-red-400/[0.08] text-red-300',
  Quarantined: 'border-violet-400/25 bg-violet-400/[0.08] text-violet-300',
};

const reorderTone: Record<InventoryReorderDecision['state'], string> = {
  Draft: 'text-gray-400',
  'Approval required': 'text-amber-300',
  Ordered: 'text-emerald-300',
};

const healthOrder: InventoryHealth[] = ['Stockout', 'Quarantined', 'Low cover', 'Available'];

export const AutoInventoryWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [snapshot, setSnapshot] = useState<AutoInventorySnapshot | null>(null);
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<InventoryHealth | 'All'>('All');
  const [selected, setSelected] = useState<AutoInventoryItem | null>(null);
  const [draftedSkus, setDraftedSkus] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let active = true;
    fixtureAutoInventoryOperationsPort.loadInventorySnapshot({ tenantId: tenant.id, period: 'today' }).then((data) => {
      if (active) setSnapshot(data);
    });
    return () => {
      active = false;
    };
  }, [tenant.id]);

  const visibleItems = useMemo(() => {
    if (!snapshot) return [];
    const normalized = query.trim().toLowerCase();
    return snapshot.items.filter((item) => (
      (health === 'All' || item.health === health)
      && (!normalized || `${item.sku} ${item.name} ${item.category} ${item.make} ${item.fitment} ${item.supplier}`.toLowerCase().includes(normalized))
    ));
  }, [health, query, snapshot]);

  if (!snapshot) {
    return <div className="flex min-h-[420px] items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-gray-600">Loading inventory contract…</div>;
  }

  const exposedJobs = new Set(snapshot.items.flatMap((item) => item.exposures.map((exposure) => exposure.jobId))).size;
  const approvalValue = snapshot.reorderQueue
    .filter((decision) => decision.state === 'Approval required')
    .reduce((sum, decision) => sum + decision.landedCostGhs, 0);

  const createDraft = (item: AutoInventoryItem) => {
    setDraftedSkus((current) => current.includes(item.sku) ? current : [...current, item.sku]);
    setFeedback(`Purchase-order draft created for ${item.sku}.`);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-10">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">
            <Warehouse size={13} /> {tenant.name} / Stock control
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Inventory control</h1>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-wider text-gray-500">
            <span className="rounded border border-white/[0.08] px-2 py-1">{snapshot.totalSkus} stock-keeping units</span>
            <span className="rounded border border-red-400/20 bg-red-400/[0.05] px-2 py-1 text-red-300">{snapshot.outOfStockSkus} unavailable</span>
            <span className="rounded border border-amber-400/20 bg-amber-400/[0.05] px-2 py-1 text-amber-300">{exposedJobs} workshop promises exposed</span>
            <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 text-emerald-300">{snapshot.countAccuracy}% count accuracy</span>
          </div>
        </div>
        <div className="text-left xl:text-right">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">As of</div>
          <div className="mt-1 text-xs text-gray-300">{snapshot.asOf}</div>
          <div className="mt-1 max-w-md text-[10px] text-gray-600">{snapshot.source}</div>
        </div>
      </header>

      <section aria-label="Inventory decision state" className="grid overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909] xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
        <div className="border-b border-white/[0.07] p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">Service demand covered</div>
            <PackageCheck size={16} className="text-vertical-accent" />
          </div>
          <div className="mt-5 flex items-end gap-3">
            <div className="text-5xl font-display font-medium tracking-tight text-white">{snapshot.serviceDemandCovered}%</div>
            <div className="pb-1 text-[10px] leading-4 text-gray-500">of the next seven days<br />can ship from trusted stock</div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-vertical-accent" style={{ width: `${snapshot.serviceDemandCovered}%` }} />
          </div>
          <div className="mt-3 flex justify-between font-mono text-[8px] uppercase tracking-wider text-gray-600">
            <span>Current</span><span>Target ≥ 92%</span>
          </div>
        </div>

        <div className="border-b border-white/[0.07] p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">Promises at risk</div>
              <div className="mt-1 text-[10px] text-gray-600">Parts constraints joined to live job cards</div>
            </div>
            <AlertOctagon size={16} className="text-red-300" />
          </div>
          <div className="mt-4 space-y-2">
            {snapshot.items.filter((item) => item.exposures.length > 0).slice(0, 3).map((item) => (
              <button
                key={item.sku}
                onClick={() => setSelected(item)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 text-left transition hover:border-vertical-accent/30 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${item.health === 'Stockout' ? 'bg-red-400' : item.health === 'Low cover' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-medium text-gray-200">{item.exposures[0]?.jobId} · {item.name}</span>
                  <span className="mt-1 block truncate text-[9px] text-gray-600">{item.exposures[0]?.vehicle} · promise {item.exposures[0]?.promisedAt}</span>
                </span>
                <ArrowRight size={12} className="shrink-0 text-vertical-accent" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">Valuation trust</div>
            <ShieldAlert size={16} className="text-amber-300" />
          </div>
          <div className="mt-5 text-3xl font-display font-medium text-white">{snapshot.valuationConfidence}%</div>
          <div className="mt-1 text-[10px] text-gray-500">of book value passes current evidence rules</div>
          <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-[10px]">
            <div className="flex items-center justify-between gap-4"><dt className="text-gray-500">Trusted valuation</dt><dd className="font-mono text-gray-200">{money.format(snapshot.trustedBookValueGhs)}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-gray-500">Raw ledger valuation</dt><dd className="font-mono text-red-300">{money.format(snapshot.rawBookValueGhs)}</dd></div>
            <div className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-3 text-red-200">Unit-cost scaling anomalies prevent the raw figure from being used for collateral or purchasing.</div>
          </dl>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div>
              <h2 className="text-sm font-medium text-white">Availability pressure rail</h2>
              <p className="mt-1 text-[10px] text-gray-500">Demand, commitments and replenishment on the same operational line.</p>
            </div>
            <Boxes size={16} className="text-vertical-accent" />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[1.5fr_repeat(5,0.55fr)_0.85fr] gap-3 border-b border-white/[0.06] px-5 py-3 font-mono text-[8px] uppercase tracking-wider text-gray-600">
                <span>Part / decision state</span><span className="text-right">7d use</span><span className="text-right">On hand</span><span className="text-right">Reserved</span><span className="text-right">Free</span><span className="text-right">Incoming</span><span className="text-right">Cover</span>
              </div>
              <div className="divide-y divide-white/[0.055]">
                {[...snapshot.items].sort((a, b) => healthOrder.indexOf(a.health) - healthOrder.indexOf(b.health)).slice(0, 7).map((item) => {
                  const available = Math.max(0, item.onHand - item.reserved);
                  const coverDays = item.weeklyDemand ? Math.round((available / item.weeklyDemand) * 7) : 99;
                  return (
                    <button
                      key={item.sku}
                      onClick={() => setSelected(item)}
                      className="grid w-full cursor-pointer grid-cols-[1.5fr_repeat(5,0.55fr)_0.85fr] items-center gap-3 px-5 py-3 text-left transition hover:bg-white/[0.025] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-vertical-accent"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.health === 'Stockout' ? 'bg-red-400' : item.health === 'Quarantined' ? 'bg-violet-400' : item.health === 'Low cover' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <span className="truncate text-[11px] font-medium text-gray-200">{item.name}</span>
                        </span>
                        <span className="mt-1 block truncate pl-3.5 font-mono text-[8px] text-gray-600">{item.sku} · {item.fitment}</span>
                      </span>
                      <span className="text-right font-mono text-[10px] text-gray-400">{item.weeklyDemand}</span>
                      <span className="text-right font-mono text-[10px] text-gray-300">{item.onHand}</span>
                      <span className="text-right font-mono text-[10px] text-amber-300">{item.reserved}</span>
                      <span className={`text-right font-mono text-[10px] ${available === 0 ? 'text-red-300' : 'text-white'}`}>{available}</span>
                      <span className="text-right font-mono text-[10px] text-cyan-300">{item.incoming}</span>
                      <span className={`text-right font-mono text-[10px] ${coverDays <= item.leadTimeDays ? 'text-red-300' : coverDays < 7 ? 'text-amber-300' : 'text-gray-300'}`}>{coverDays >= 99 ? '—' : `${coverDays}d`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white">Replenishment decisions</h2>
              <p className="mt-1 text-[10px] text-gray-500">{money.format(approvalValue)} awaiting controlled approval.</p>
            </div>
            <ShoppingCart size={16} className="text-vertical-accent" />
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.reorderQueue.map((decision) => {
              const item = snapshot.items.find((candidate) => candidate.sku === decision.sku);
              if (!item) return null;
              const drafted = draftedSkus.includes(item.sku);
              return (
                <button
                  key={decision.id}
                  onClick={() => setSelected(item)}
                  className="w-full cursor-pointer rounded-lg border border-white/[0.07] bg-black/20 p-4 text-left transition hover:border-vertical-accent/30 hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-vertical-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="font-mono text-[8px] text-vertical-accent">{decision.id} · {decision.sku}</div><div className="mt-1 text-[11px] font-medium text-gray-200">{item.name}</div></div>
                    <span className={`font-mono text-[8px] uppercase ${drafted ? 'text-emerald-300' : reorderTone[decision.state]}`}>{drafted ? 'Draft created' : decision.state}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div><div className="font-mono text-[8px] text-gray-600">BUY</div><div className="mt-1 text-xs text-white">{decision.recommendedQuantity}</div></div>
                    <div><div className="font-mono text-[8px] text-gray-600">COVER</div><div className="mt-1 text-xs text-white">{decision.coverBeforeDays}→{decision.coverAfterDays}d</div></div>
                    <div><div className="font-mono text-[8px] text-gray-600">LANDED</div><div className="mt-1 text-xs text-white">{money.format(decision.landedCostGhs)}</div></div>
                  </div>
                  <div className="mt-3 border-t border-white/[0.06] pt-3 text-[9px] text-gray-600">{decision.dueAt}</div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-medium text-white">Controlled stock ledger</h2>
            <p className="mt-1 text-[10px] text-gray-500">{visibleItems.length} fixture records shown · each row opens stock, demand and provenance evidence.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Search stock ledger</span>
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Part, SKU, fitment, supplier…" className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/30 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent sm:w-72" />
            </label>
            <label>
              <span className="sr-only">Filter by inventory health</span>
              <select value={health} onChange={(event) => setHealth(event.target.value as InventoryHealth | 'All')} className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 text-xs text-gray-300 outline-none focus:border-vertical-accent">
                <option value="All">All conditions</option>
                {healthOrder.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-left">
            <thead className="bg-black/20 font-mono text-[9px] uppercase tracking-wider text-gray-500">
              <tr>
                {['SKU / part', 'Fitment', 'On hand', 'Committed', 'Free', 'Reorder', 'Weekly use', 'Unit cost', 'Condition', 'Controlled decision'].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {visibleItems.map((item) => {
                const available = Math.max(0, item.onHand - item.reserved);
                return (
                  <tr key={item.sku} className="hover:bg-white/[0.025]">
                    <td className="px-5 py-3">
                      <button onClick={() => setSelected(item)} className="cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-vertical-accent">
                        <span className="block font-mono text-[10px] text-vertical-accent">{item.sku}</span>
                        <span className="mt-1 block text-[11px] text-gray-200">{item.name}</span>
                      </button>
                    </td>
                    <td className="max-w-56 px-5 py-3"><div className="text-gray-300">{item.make}</div><div className="mt-1 line-clamp-2 text-[9px] text-gray-600">{item.fitment}</div></td>
                    <td className="px-5 py-3 font-mono text-gray-300">{item.onHand}</td>
                    <td className="px-5 py-3 font-mono text-amber-300">{item.reserved}</td>
                    <td className={`px-5 py-3 font-mono ${available === 0 ? 'text-red-300' : 'text-white'}`}>{available}</td>
                    <td className="px-5 py-3 font-mono text-gray-400">{item.reorderPoint}</td>
                    <td className="px-5 py-3 font-mono text-gray-400">{item.weeklyDemand}</td>
                    <td className="px-5 py-3 font-mono text-gray-300">{money.format(item.unitCostGhs)}</td>
                    <td className="px-5 py-3"><span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${healthTone[item.health]}`}>{item.health}</span></td>
                    <td className="max-w-72 px-5 py-3">
                      <button onClick={() => setSelected(item)} className="flex cursor-pointer items-center gap-2 text-left text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent">
                        <span className="line-clamp-2">{item.nextDecision}</span><ArrowRight size={12} className="shrink-0 text-vertical-accent" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div><h2 className="text-sm font-medium text-white">Movement evidence</h2><p className="mt-1 text-[10px] text-gray-500">Receipts, reservations, issues and adjustments retain an actor and reference.</p></div>
            <ArrowDownToLine size={16} className="text-vertical-accent" />
          </div>
          <div className="divide-y divide-white/[0.06]">
            {snapshot.movements.map((movement) => (
              <div key={movement.id} className="grid grid-cols-[0.8fr_0.65fr_1fr_0.55fr] items-center gap-3 px-5 py-3 text-[10px] sm:grid-cols-[0.7fr_0.6fr_0.85fr_1fr_0.55fr]">
                <span className="font-mono text-gray-500">{movement.at}</span>
                <span className={movement.quantity > 0 ? 'text-emerald-300' : movement.type === 'Adjustment' ? 'text-amber-300' : 'text-gray-300'}>{movement.type}</span>
                <span className="font-mono text-vertical-accent">{movement.sku}</span>
                <span className="hidden truncate text-gray-500 sm:block">{movement.reference} · {movement.actor}</span>
                <span className="text-right font-mono text-gray-200">{movement.quantity > 0 ? '+' : ''}{movement.quantity}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="flex items-center gap-2"><FileWarning size={15} className="text-red-300" /><h2 className="text-sm font-medium text-white">Ledger exceptions</h2></div>
          <div className="mt-4 space-y-3">
            {[
              { title: 'Raw valuation is not decision-grade', detail: 'Scaling anomalies create a GHS 5.7B raw value. Use the trusted subset until affected rows are corrected.', tone: 'border-red-400/20 bg-red-400/[0.05]' },
              { title: '403 catalogued parts have no available stock', detail: 'Separate obsolete catalogue records from genuine replenishment demand before issuing purchase orders.', tone: 'border-amber-400/20 bg-amber-400/[0.05]' },
              { title: 'One unverified outhouse batch is quarantined', detail: 'Counterfeit screening and supplier identity evidence must pass before issue.', tone: 'border-violet-400/20 bg-violet-400/[0.05]' },
            ].map((exception) => (
              <div key={exception.title} className={`rounded-lg border p-3 ${exception.tone}`}>
                <div className="text-[10px] font-medium text-gray-200">{exception.title}</div>
                <div className="mt-1 text-[9px] leading-4 text-gray-500">{exception.detail}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div aria-live="polite" className="sr-only">{feedback}</div>
      {createPortal(
        <AnimatePresence>
          {selected && (
            <InventoryItemDrawer
              item={selected}
              movements={snapshot.movements.filter((movement) => movement.sku === selected.sku)}
              reorder={snapshot.reorderQueue.find((decision) => decision.sku === selected.sku)}
              drafted={draftedSkus.includes(selected.sku)}
              feedback={feedback}
              onCreateDraft={() => createDraft(selected)}
              onCycleCount={() => setFeedback(`Cycle count opened for ${selected.sku}.`)}
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

const InventoryItemDrawer = ({
  item,
  movements,
  reorder,
  drafted,
  feedback,
  onCreateDraft,
  onCycleCount,
  onClose,
}: {
  item: AutoInventoryItem;
  movements: AutoInventorySnapshot['movements'];
  reorder?: InventoryReorderDecision;
  drafted: boolean;
  feedback: string;
  onCreateDraft: () => void;
  onCycleCount: () => void;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const available = Math.max(0, item.onHand - item.reserved);
  const coverDays = item.weeklyDemand ? Math.round((available / item.weeklyDemand) * 7) : 99;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <motion.aside
        initial={{ x: 620 }}
        animate={{ x: 0 }}
        exit={{ x: 620 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-item-title"
        onClick={(event) => event.stopPropagation()}
        className="custom-scrollbar h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-vertical-accent">{item.sku} · {item.category}</div>
            <h2 id="inventory-item-title" className="mt-2 text-xl font-medium text-white">{item.name}</h2>
            <p className="mt-1 text-xs text-gray-500">{item.make} · {item.fitment}</p>
          </div>
          <button onClick={onClose} aria-label="Close inventory detail" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><X size={17} /></button>
        </div>

        <section className="mt-5 grid gap-3 sm:grid-cols-5">
          {[
            ['On hand', item.onHand],
            ['Reserved', item.reserved],
            ['Available', available],
            ['Incoming', item.incoming],
            ['Cover', coverDays >= 99 ? '—' : `${coverDays} days`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
              <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div>
              <div className="mt-2 text-xs text-gray-200">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-vertical-accent/20 bg-vertical-accent-glow p-4">
          <div className="font-mono text-[8px] uppercase tracking-wider text-vertical-accent">Controlled decision</div>
          <p className="mt-2 text-xs leading-5 text-gray-200">{item.nextDecision}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {reorder && (
              <button onClick={onCreateDraft} disabled={drafted} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-vertical-accent px-4 text-[10px] font-medium text-black transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-default disabled:opacity-60">
                {drafted ? <Check size={14} /> : <ShoppingCart size={14} />}{drafted ? 'PO draft created' : `Create PO draft · ${reorder.recommendedQuantity} units`}
              </button>
            )}
            <button onClick={onCycleCount} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-4 text-[10px] text-gray-300 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent">
              <ClipboardCheck size={14} /> Start cycle count
            </button>
          </div>
          {feedback && <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-[10px] text-emerald-300">{feedback}</div>}
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2"><Truck size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Supplier and provenance</h3></div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/25 p-4">
            <dl className="grid gap-4 text-xs sm:grid-cols-2">
              <div><dt className="font-mono text-[8px] uppercase text-gray-600">Supplier</dt><dd className="mt-2 text-gray-200">{item.supplier}</dd></div>
              <div><dt className="font-mono text-[8px] uppercase text-gray-600">Lead time</dt><dd className="mt-2 text-gray-200">{item.leadTimeDays} days</dd></div>
              <div><dt className="font-mono text-[8px] uppercase text-gray-600">Batch</dt><dd className="mt-2 font-mono text-gray-200">{item.provenance.batchId}</dd></div>
              <div><dt className="font-mono text-[8px] uppercase text-gray-600">Evidence state</dt><dd className={`mt-2 ${item.provenance.state === 'Verified' ? 'text-emerald-300' : item.provenance.state === 'Failed' ? 'text-red-300' : 'text-amber-300'}`}>{item.provenance.state}</dd></div>
            </dl>
            <div className="mt-4 border-t border-white/[0.07] pt-4 text-[10px] text-gray-500">{item.provenance.supplierDocument} · {item.provenance.receivedAt}</div>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2"><CalendarClock size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Workshop exposure</h3></div>
          <div className="mt-3 space-y-2">
            {item.exposures.length > 0 ? item.exposures.map((exposure) => (
              <div key={exposure.jobId} className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                <div><div className="font-mono text-[9px] text-vertical-accent">{exposure.jobId}</div><div className="mt-1 text-[10px] text-gray-300">{exposure.vehicle}</div></div>
                <div className="text-right"><div className="text-[10px] text-gray-300">{exposure.requiredQuantity} required</div><div className="mt-1 text-[9px] text-gray-600">{exposure.promisedAt}</div></div>
              </div>
            )) : <div className="rounded-lg border border-dashed border-white/[0.08] p-4 text-[10px] text-gray-600">No open job card currently depends on this item.</div>}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2"><BadgeCheck size={15} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Movement lineage</h3></div>
          <div className="mt-3 space-y-2">
            {movements.length > 0 ? movements.map((movement) => (
              <div key={movement.id} className="grid grid-cols-[0.7fr_0.8fr_0.55fr] gap-3 rounded-lg border border-white/[0.07] p-3 text-[10px]">
                <div><div className="font-mono text-gray-400">{movement.id}</div><div className="mt-1 text-gray-600">{movement.at}</div></div>
                <div><div className="text-gray-300">{movement.type} · {movement.reference}</div><div className="mt-1 text-gray-600">{movement.actor}</div></div>
                <div className="text-right"><div className="font-mono text-white">{movement.quantity > 0 ? '+' : ''}{movement.quantity}</div><div className="mt-1 text-gray-600">{movement.evidence}</div></div>
              </div>
            )) : <div className="rounded-lg border border-dashed border-white/[0.08] p-4 text-[10px] text-gray-600">No movement fixture is attached to this item.</div>}
          </div>
        </section>
      </motion.aside>
    </motion.div>
  );
};
