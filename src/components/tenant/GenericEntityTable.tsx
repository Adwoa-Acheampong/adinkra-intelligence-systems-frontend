import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Database, Search, ShieldCheck, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { GlassPanel } from '../ui/GlassPanel';

interface TenantRecord {
  id: string;
  subject: string;
  owner: string;
  state: 'Ready' | 'In progress' | 'Review' | 'Blocked';
  updated: string;
  evidence: string;
  value: string;
  event: string;
}

interface RecordProfile {
  title: string;
  capability: string;
  decision: string;
  subjects: string[];
  owners: string[];
  evidence: string[];
  values: string[];
}

const profiles: Record<string, RecordProfile> = {
  inventory: {
    title: 'Inventory control',
    capability: 'Verified supply',
    decision: 'Replenish, transfer, publish or restrict',
    subjects: ['Toyota brake pad · genuine', 'NPK 15:15:15 batch', 'Two-bedroom listing', 'Drop 06 finished goods', 'Alternator assembly', 'Cold-store maize lot', 'Verified storefront SKU'],
    owners: ['Stock Control', 'Warehouse Quality', 'Listing Desk', 'Collection Control'],
    evidence: ['Count + location + media', 'Batch + supplier + grade', 'Title + mandate + media', 'SKU + variant + approval'],
    values: ['GHS 72K', 'GHS 84K', 'GHS 420K', 'GHS 118K', 'GHS 36K', '18.4 t', '84 SKUs'],
  },
  orders: {
    title: 'BLKK orders',
    capability: 'Controlled commerce',
    decision: 'Confirm, recover, fulfil or cancel',
    subjects: ['Fleet request · 12 pickups', 'Vehicle order · Civic 2019', 'Secure-part order · brake pads', 'Diagnostic booking · transmission', 'Produce allocation · maize', 'Property deposit order', 'Collection drop order'],
    owners: ['Advisor Pod', 'Order Control', 'Merchant Fulfilment', 'Escrow Desk'],
    evidence: ['Intent + advisor thread', 'Inspection + controlled terms', 'Fitment + stock hold', 'Booking + symptom notes'],
    values: ['GHS 418K', 'GHS 146K', 'GHS 4.8K', 'GHS 250', 'GHS 126K', 'GHS 240K', 'GHS 18K'],
  },
  finance: {
    title: 'Finance and settlement',
    capability: 'Cash and ledger control',
    decision: 'Release, collect, reconcile or investigate',
    subjects: ['MTN MoMo settlement 726B', 'Escrow release ER-221', 'Payout cycle 30', 'Card settlement CB-88', 'Receivable · fleet account', 'Refund case RF-114', 'Fee variance · order batch'],
    owners: ['Reconciliation Desk', 'Treasury Control', 'Credit Control', 'Finance Review'],
    evidence: ['Provider file + callbacks', 'Completion proof + approval', 'Order fees + payout rules', 'Invoice + ledger events'],
    values: ['GHS 92K', 'GHS 240K', 'GHS 45K', 'GHS 31K', 'GHS 184K', 'GHS 12K', 'GHS 8.6K'],
  },
  workforce: {
    title: 'Workforce operations',
    capability: 'Quality-adjusted capacity',
    decision: 'Assign, rebalance, coach or certify',
    subjects: ['Ashanti verification shift', 'Bono East harvest surge', 'Advisor response pod B', 'Northern spare capacity', 'Inspector certification', 'Warehouse night shift', 'Dispatch coverage plan'],
    owners: ['Regional Lead', 'People Operations', 'Training Desk', 'Process Owner'],
    evidence: ['Roster + attendance', 'Assignment + acceptance', 'Certification + assessment', 'Shift + output events'],
    values: ['28 jobs', '41 farms', '17 intents', '26 hours', '3 inspectors', '11 workers', '8 routes'],
  },
  risk: {
    title: 'Trust and controls',
    capability: 'Institutional verification',
    decision: 'Accept, restrict, remediate or escalate',
    subjects: ['Owner mandate · Airport Hills', 'Parts authenticity · batch AB-19', 'MoMo callback replay cluster', 'Gold lot custody media', 'Supplier licence renewal', 'Agent evidence anomaly', 'Escrow release control'],
    owners: ['Trust Control', 'Verification Desk', 'Compliance Review', 'Risk Operations'],
    evidence: ['Identity + authority', 'Supplier + provenance', 'Event lineage + reconciliation', 'GPS + time + media hash'],
    values: ['GHS 420K', 'GHS 186K', 'GHS 92K', '1.8 kg', '4 lots', '31 records', 'GHS 240K'],
  },
  default: {
    title: 'Operational records',
    capability: 'Verified operations',
    decision: 'Complete, review or escalate',
    subjects: ['Priority work item', 'Customer recovery case', 'Verification follow-up', 'Scheduled operating task', 'Evidence correction', 'Cross-team dependency', 'Completed outcome'],
    owners: ['Operations Control', 'Regional Lead', 'Quality Desk', 'Service Recovery'],
    evidence: ['Owner + state + timestamp', 'Required evidence complete', 'Control decision recorded', 'Outcome proof linked'],
    values: ['GHS 42K', 'GHS 18K', '12 records', '8 jobs', 'GHS 9K', '4 teams', '31 outcomes'],
  },
};

const resolveProfile = (moduleId: string) => {
  if (/(inventory|catalogue|parts|vehicles|properties|lots|plots|collections)/.test(moduleId)) return profiles.inventory;
  if (/(order|commerce|checkout|advisor|offer|customer|marketing|support)/.test(moduleId)) return profiles.orders;
  if (/(finance|payment|payout|escrow|settlement|ledger|wallet|credit)/.test(moduleId)) return profiles.finance;
  if (/(workforce|staff|hr|agent|commission|assignment|visit)/.test(moduleId)) return profiles.workforce;
  if (/(risk|audit|trust|verification|quality|security|compliance|inspection)/.test(moduleId)) return profiles.risk;
  return profiles.default;
};

const stateTone: Record<TenantRecord['state'], string> = {
  Ready: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  'In progress': 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  Review: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  Blocked: 'border-red-400/20 bg-red-400/10 text-red-300',
};

export const GenericEntityTable: React.FC = () => {
  const location = useLocation();
  const { currentTenant } = useTenant();
  const moduleId = location.pathname.split('/').pop() || 'operations';
  const profile = resolveProfile(moduleId);
  const [selected, setSelected] = useState<TenantRecord | null>(null);
  const [query, setQuery] = useState('');

  const records = useMemo<TenantRecord[]>(() => {
    const prefix = moduleId.slice(0, 3).toUpperCase();
    return profile.subjects.map((subject, index) => ({
      id: `${prefix}-${1240 + index * 17}`,
      subject,
      owner: profile.owners[index % profile.owners.length],
      state: (['Blocked', 'Review', 'In progress', 'Ready', 'Review', 'In progress', 'Ready'] as TenantRecord['state'][])[index],
      updated: ['12 min', '38 min', '1 hr', '2 hr', '5 hr', '11 hr', '1 day'][index],
      evidence: profile.evidence[index % profile.evidence.length],
      value: profile.values[index],
      event: `${moduleId.replace(/-/g, '_')}.${index % 2 ? 'evidence_added' : 'status_changed'}`,
    }));
  }, [moduleId, profile]);

  const visible = records.filter((record) => `${record.id} ${record.subject} ${record.owner}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative mx-auto max-w-[1500px] space-y-5 overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-vertical-accent">{currentTenant?.name} / {profile.capability}</div>
          <h1 className="mt-2 text-2xl font-display font-medium text-white">{profile.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[8px] font-mono uppercase tracking-wider text-gray-600">
            <span className="rounded border border-white/[0.08] px-2 py-1">{visible.length} of {records.length} records</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">28 Jul 2026 · 06:00 GMT</span>
            <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 text-emerald-300">96% evidence coverage</span>
            <span className="rounded border border-amber-400/20 bg-amber-400/[0.05] px-2 py-1 text-amber-200">Mock data</span>
          </div>
        </div>
        <label className="relative">
          <span className="sr-only">Search records</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search records"
            className="w-72 rounded-lg border border-white/[0.09] bg-black/30 py-2 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-gray-700 focus:border-vertical-accent"
          />
        </label>
      </div>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="grid gap-px border-b border-white/[0.06] bg-white/[0.06] md:grid-cols-5">
          {[
            ['Objective', 'Verified tenant outcome'],
            ['Capability', profile.capability],
            ['Process', profile.title],
            ['Decision', profile.decision],
            ['Grain', 'Record → event'],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#090909] px-4 py-3">
              <div className="text-[7px] font-mono uppercase tracking-wider text-gray-700">{label}</div>
              <div className="mt-1 text-[10px] text-gray-300">{value}</div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-black/20 text-[9px] font-mono uppercase tracking-wider text-gray-600">
              <tr>{['Record', 'Subject', 'Owner', 'State', 'Updated', 'Evidence', 'Exposure / volume', 'Event', ''].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {visible.map((record) => (
                <tr key={record.id} onClick={() => setSelected(record)} className="cursor-pointer transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3 font-mono">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(record);
                      }}
                      aria-label={`Open record ${record.id}`}
                      className="cursor-pointer text-vertical-accent transition hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"
                    >
                      {record.id}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-200">{record.subject}</td>
                  <td className="px-5 py-3 text-gray-500">{record.owner}</td>
                  <td className="px-5 py-3"><span className={`rounded border px-2 py-1 text-[8px] font-mono uppercase ${stateTone[record.state]}`}>{record.state}</span></td>
                  <td className="px-5 py-3 text-gray-500">{record.updated}</td>
                  <td className="px-5 py-3 text-gray-400">{record.evidence}</td>
                  <td className="px-5 py-3 text-white">{record.value}</td>
                  <td className="px-5 py-3 font-mono text-[9px] text-gray-600">{record.event}</td>
                  <td className="px-5 py-3">
                    <ArrowRight size={12} className="text-gray-700" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.aside
              initial={{ x: 520 }}
              animate={{ x: 0 }}
              exit={{ x: 520 }}
              onClick={(event) => event.stopPropagation()}
              className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-5">
                <div><div className="font-mono text-xs text-vertical-accent">{selected.id}</div><h2 className="mt-2 text-xl text-white">{selected.subject}</h2></div>
                <button onClick={() => setSelected(null)} aria-label="Close record detail" className="cursor-pointer rounded-lg border border-white/10 p-2 text-gray-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><X size={17} /></button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ['State', selected.state],
                  ['Owner', selected.owner],
                  ['Updated', selected.updated],
                  ['Exposure / volume', selected.value],
                  ['Evidence', selected.evidence],
                  ['Event', selected.event],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
                    <div className="text-[8px] font-mono uppercase tracking-wider text-gray-600">{label}</div>
                    <div className="mt-2 text-xs text-gray-200">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-vertical-accent/20 bg-vertical-accent/[0.05] p-4">
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-vertical-accent"><ShieldCheck size={13} /> Evidence lineage</div>
                <div className="mt-4 space-y-3">
                  {[
                    ['Source', `${currentTenant?.name} operating ERP`],
                    ['Capture', selected.evidence],
                    ['Control', `${profile.capability} rules evaluated`],
                    ['Decision', profile.decision],
                    ['Outcome', `${selected.event} recorded`],
                  ].map(([label, value], index) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-vertical-accent/25 bg-black/20 font-mono text-[8px] text-vertical-accent">{index + 1}</div>
                      <div><div className="text-[8px] font-mono uppercase tracking-wider text-gray-600">{label}</div><div className="mt-1 text-xs text-gray-300">{value}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-gray-600">
                <Database size={12} /> Mock event · record-level drill
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
