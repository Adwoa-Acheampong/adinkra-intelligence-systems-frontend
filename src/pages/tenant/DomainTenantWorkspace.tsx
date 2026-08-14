import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  Download,
  Edit3,
  FileClock,
  History,
  Search,
  X,
} from 'lucide-react';
import { DomainFilterBar, useDomainFilters } from '../../components/analytics/DomainFilterBar';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { VERTICAL_ERPS } from '../../config/erpWorkspaces';
import {
  VERTICAL_DOMAIN_CONTRACTS,
  familyForModule,
  type DomainFamily,
  type DomainStatus,
  type DomainVerticalId,
} from '../../data/verticalDomainContracts';
import { getDomainModuleProfile } from '../../data/verticalModuleProfiles';
import type { Tenant } from '../../types';
import {
  buildDomainCommandRecords,
  buildDomainModuleRecords,
  DomainPrimaryVisual,
  filterDomainRecords,
  getDomainFacet,
  type DomainRecord,
} from '../vertical/VerticalDomainWorkspace';

interface DomainTenantWorkspaceProps {
  tenant: Tenant;
  mode: 'analytics' | 'erp';
  moduleId: string;
}

interface DraftRecord {
  id?: string;
  subject: string;
  segment: string;
  owner: string;
  channel: string;
  facet: string;
  action: string;
  impact: string;
  value: string;
  status: DomainStatus;
  branch: string;
  site: string;
}

const statuses: DomainStatus[] = ['Critical', 'At risk', 'Watch', 'On track'];
const currencyRate = 15.65;
const integer = new Intl.NumberFormat('en-GH');
const today = () => new Date().toISOString().slice(0, 10);

const storageRead = (key: string, fallback: DomainRecord[]) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as DomainRecord[] : fallback;
  } catch {
    return fallback;
  }
};

const familyForTenantModule = (verticalId: DomainVerticalId, moduleId: string): DomainFamily => {
  if (moduleId === 'overview') return 'operations';
  const moduleProfile = getDomainModuleProfile(verticalId, moduleId);
  if (moduleProfile) return moduleProfile.family;
  if (verticalId === 'label' && moduleId === 'collections') return 'asset';
  return familyForModule(moduleId);
};

const tenantLocationVariants = (tenant: Tenant, verticalId: DomainVerticalId) => {
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const workspaceTenants = buildDomainCommandRecords(verticalId)
    .filter((record, index, records) => records.findIndex((candidate) => candidate.tenantId === record.tenantId) === index);
  const tenantIndex = Math.max(0, workspaceTenants.findIndex((record) => record.tenantId === tenant.id));
  const base = contract.locations[tenantIndex % contract.locations.length];
  return [
    base,
    { ...base, branch: `${base.branch} Operations`, site: `${base.city} Operations Centre` },
    { ...base, branch: `${base.branch} Distribution`, site: `${base.city} Distribution Site` },
  ];
};

const tenantizeRecords = (tenant: Tenant, verticalId: DomainVerticalId, moduleId: string) => {
  const locations = tenantLocationVariants(tenant, verticalId);
  const source = moduleId === 'overview'
    ? buildDomainCommandRecords(verticalId)
    : buildDomainModuleRecords(verticalId, moduleId);
  return source.map((record, index) => ({
    ...record,
    id: `${tenant.id.slice(0, 3).toUpperCase()}-${record.id.split('-').slice(1).join('-')}`,
    tenantId: tenant.id,
    tenant: tenant.name,
    ...locations[index % locations.length],
    route: `/${verticalId}/tenant/${tenant.id}/analytics/${moduleId === 'overview' ? '' : moduleId}`,
  }));
};

const metricMoney = (value: number, currency: 'GHS' | 'USD') => new Intl.NumberFormat(currency === 'GHS' ? 'en-GH' : 'en-US', {
  style: 'currency',
  currency,
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(currency === 'USD' ? value / currencyRate : value);

const Metric = ({ label, value, detail, tone = 'text-white' }: { label: string; value: string; detail: string; tone?: string }) => (
  <GlassPanel className="rounded-xl p-4">
    <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-600">{label}</div>
    <div className={`mt-3 text-xl font-semibold ${tone}`}>{value}</div>
    <div className="mt-2 text-[9px] leading-relaxed text-gray-600">{detail}</div>
  </GlassPanel>
);

const emptyDraft = (owner: string, channel: string, facet: string, branch: string, site: string): DraftRecord => ({
  subject: '',
  segment: '',
  owner,
  channel,
  facet,
  action: '',
  impact: '',
  value: '',
  status: 'Watch',
  branch,
  site,
});

export const DomainTenantWorkspace = ({ tenant, mode, moduleId }: DomainTenantWorkspaceProps) => {
  const verticalId = tenant.verticalId as DomainVerticalId;
  const contract = VERTICAL_DOMAIN_CONTRACTS[verticalId];
  const workspace = VERTICAL_ERPS[verticalId];
  const module = workspace?.sections.flatMap((section) => section.modules).find((item) => item.id === (moduleId === 'overview' ? '' : moduleId));
  const moduleProfile = moduleId === 'overview' ? undefined : getDomainModuleProfile(verticalId, moduleId);
  const label = moduleId === 'overview' ? 'Analytics dashboard' : module?.label || moduleId.replace(/-/g, ' ');
  const description = moduleId === 'overview' ? `Everything material generated by ${tenant.name}'s ${contract.assets}, people, money, customers, controls, and accepted outcomes.` : moduleProfile?.question || module?.description || `Control ${label.toLowerCase()} records.`;
  const family = familyForTenantModule(verticalId, moduleId);
  const [facetLabel, facetOptions] = moduleProfile?.facet ?? getDomainFacet(family);
  const locations = useMemo(() => tenantLocationVariants(tenant, verticalId), [tenant, verticalId]);
  const namespace = `${verticalId}.${tenant.id}.${mode}.${moduleId}`;
  const { filters, update, reset } = useDomainFilters(namespace);
  const storageKey = `adinkra:v2:${verticalId}:${tenant.id}:${moduleId}:records`;
  const initialRecords = useMemo(() => tenantizeRecords(tenant, verticalId, moduleId), [tenant, verticalId, moduleId]);
  const [records, setRecords] = useState<DomainRecord[]>(() => storageRead(storageKey, initialRecords));
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DraftRecord>(() => emptyDraft(contract.actors[0], contract.channels[0], facetOptions[0], locations[0].branch, locations[0].site));
  const [audit, setAudit] = useState<string[]>([]);

  useEffect(() => {
    setRecords(storageRead(storageKey, initialRecords));
    setAudit([]);
  }, [storageKey, initialRecords]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  const scoped = filterDomainRecords(records, filters).filter((record) => {
    const term = search.trim().toLowerCase();
    return !term || [record.id, record.subject, record.segment, record.owner, record.action, record.branch, record.site].some((value) => value.toLowerCase().includes(term));
  });
  const totalValue = scoped.reduce((sum, record) => sum + record.value, 0);
  const intervention = scoped.filter((record) => record.status === 'Critical' || record.status === 'At risk').length;
  const accepted = scoped.filter((record) => record.status === 'On track').length;
  const locationsInScope = new Set(scoped.map((record) => `${record.branch}:${record.site}`)).size;

  const startCreate = () => {
    setDraft(emptyDraft(contract.actors[0], contract.channels[0], facetOptions[0], locations[0].branch, locations[0].site));
    setEditorOpen(true);
  };

  const startEdit = (record: DomainRecord) => {
    setDraft({
      id: record.id,
      subject: record.subject,
      segment: record.segment,
      owner: record.owner,
      channel: record.channel,
      facet: record.facet,
      action: record.action,
      impact: record.impact,
      value: String(record.value),
      status: record.status,
      branch: record.branch,
      site: record.site,
    });
    setEditorOpen(true);
  };

  const saveRecord = () => {
    if (!draft.subject.trim() || !draft.segment.trim() || !draft.action.trim()) return;
    const location = locations.find((item) => item.branch === draft.branch && item.site === draft.site) || locations[0];
    if (draft.id) {
      setRecords((current) => current.map((record) => record.id === draft.id ? {
        ...record,
        ...draft,
        value: Number(draft.value) || 0,
        ...location,
        age: 'just now',
        ageMinutes: 0,
        date: today(),
      } : record));
      setAudit((current) => [`Updated ${draft.id} in ${label}`, ...current].slice(0, 8));
    } else {
      const nextId = `${tenant.id.slice(0, 3).toUpperCase()}-${moduleId.slice(0, 3).toUpperCase()}-${String(900 + records.length + 1)}`;
      setRecords((current) => [{
        id: nextId,
        subject: draft.subject,
        segment: draft.segment,
        owner: draft.owner,
        channel: draft.channel,
        facet: draft.facet,
        action: draft.action,
        impact: draft.impact || 'New controlled operating record',
        value: Number(draft.value) || 0,
        status: draft.status,
        age: 'just now',
        ageMinutes: 0,
        date: today(),
        tenantId: tenant.id,
        tenant: tenant.name,
        ...location,
        route: `/${verticalId}/tenant/${tenant.id}/analytics/${moduleId}`,
      }, ...current]);
      setAudit((current) => [`Created ${nextId} in ${label}`, ...current].slice(0, 8));
    }
    setEditorOpen(false);
  };

  const changeStatus = (id: string, status: DomainStatus) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, status, age: 'just now', ageMinutes: 0, date: today() } : record));
    setAudit((current) => [`Changed ${id} to ${status}`, ...current].slice(0, 8));
  };

  const deleteRecord = () => {
    if (!draft.id) return;
    const recordId = draft.id;
    setRecords((current) => current.filter((record) => record.id !== recordId));
    setAudit((current) => [`Deleted ${recordId} from ${label}`, ...current].slice(0, 8));
    setEditorOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1600px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">{tenant.name} · {mode === 'erp' ? 'operational record control' : 'tenant intelligence'}</div>
          <h1 className="mt-3 text-3xl font-display font-semibold capitalize text-white">{label}</h1>
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-gray-500">{description}</p>
        </div>
        <div className="flex gap-2">
          {mode === 'erp' && <button type="button" onClick={startCreate} className="flex min-h-10 items-center gap-2 rounded-lg bg-vertical-accent px-4 text-[9px] font-semibold text-black"><ClipboardPlus size={13} /> New {moduleProfile?.noun ?? contract.asset}</button>}
          <button type="button" onClick={() => window.print()} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[9px] text-gray-400"><Download size={12} /> Export</button>
        </div>
      </header>

      <DomainFilterBar label={namespace} tenants={[tenant]} locations={locations} actors={contract.actors} facetLabel={facetLabel} facetOptions={facetOptions} filters={filters} update={update} reset={reset} />
      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 px-4">
        <Search size={13} className="text-gray-600" />
        <input aria-label={`Search ${label.toLowerCase()} records`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${label.toLowerCase()} by record, subject, person, branch, site, or action`} className="w-full bg-transparent text-[10px] text-gray-300 outline-none placeholder:text-gray-700" />
      </label>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={moduleProfile?.measures[0] ?? 'Controlled exposure'} value={metricMoney(totalValue, filters.currency)} detail={`${scoped.length} exact records after filters`} />
        <Metric label={moduleProfile?.measures[1] ?? contract.measures[1]} value={`${Math.max(0, 96 - intervention * 4)}%`} detail={`Quality of the ${moduleProfile?.noun ?? contract.outcome}`} tone="text-emerald-300" />
        <Metric label={mode === 'erp' ? 'Records accepted' : moduleProfile?.measures[2] ?? contract.measures[2]} value={integer.format(accepted)} detail={`${locationsInScope} branch or site positions represented`} />
        <Metric label={moduleProfile?.measures[3] ?? 'Needs intervention'} value={integer.format(intervention)} detail="Critical and at-risk records requiring action" tone="text-rose-300" />
      </section>

      {mode === 'analytics' ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <GlassPanel className="rounded-xl p-5">
              <h2 className="text-sm text-white">{label} decision visual</h2>
              <p className="mt-1 text-[9px] text-gray-600">This chart changes with the period, place, status, owner, and {facetLabel.toLowerCase()} controls above.</p>
              <div className="mt-4 h-[340px]"><DomainPrimaryVisual family={family} records={scoped} verticalId={verticalId} pipeline={moduleProfile?.pipeline ?? contract.pipeline} /></div>
            </GlassPanel>
            <GlassPanel className="overflow-hidden rounded-xl">
              <div className="border-b border-white/[0.08] p-5"><h2 className="text-sm text-white">What requires a decision</h2><p className="mt-1 text-[9px] text-gray-600">Highest-exposure records, not a predetermined conclusion.</p></div>
              <div className="divide-y divide-white/[0.06]">{[...scoped].sort((a, b) => b.value - a.value).slice(0, 5).map((record) => <div key={record.id} className="p-5"><div className="flex justify-between gap-4"><div><div className="text-[11px] text-white">{record.subject}</div><div className="mt-1 text-[8px] text-gray-600">{record.branch} · {record.site}</div></div><div className="font-mono text-[9px] text-vertical-accent">{metricMoney(record.value, filters.currency)}</div></div><div className="mt-3 text-[9px] text-gray-400">{record.action}</div></div>)}</div>
            </GlassPanel>
          </section>
          <RecordTable records={scoped} mode="analytics" onEdit={startEdit} onStatus={changeStatus} />
        </>
      ) : (
        <>
          <GlassPanel className="rounded-xl p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm text-white">Live {label} workflow</h2><p className="mt-1 text-[9px] text-gray-600">Operate records here. Analytics is the sibling application that explains their resulting performance.</p></div><div className="flex items-center gap-2 font-mono text-[8px] text-emerald-300"><CheckCircle2 size={12} /> Mutations retained locally for backend adapter merge</div></div>
            <div className="mt-5 grid gap-3 lg:grid-cols-4">{statuses.map((status) => <div key={status} className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><div className="flex justify-between font-mono text-[8px] uppercase text-gray-500"><span>{status}</span><span>{scoped.filter((record) => record.status === status).length}</span></div><div className="mt-3 space-y-2">{scoped.filter((record) => record.status === status).slice(0, 3).map((record) => <button key={record.id} type="button" onClick={() => startEdit(record)} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.025] p-3 text-left hover:border-vertical-accent/30"><div className="font-mono text-[8px] text-vertical-accent">{record.id}</div><div className="mt-2 text-[9px] text-gray-200">{record.subject}</div><div className="mt-2 text-[8px] text-gray-600">{record.owner}</div></button>)}</div></div>)}</div>
          </GlassPanel>
          <RecordTable records={scoped} mode="erp" onEdit={startEdit} onStatus={changeStatus} />
          <GlassPanel className="rounded-xl p-5"><div className="flex items-center gap-2 text-[10px] text-white"><History size={13} className="text-vertical-accent" /> Session mutation trail</div><div className="mt-4 grid gap-2 md:grid-cols-2">{audit.length ? audit.map((entry, index) => <div key={`${entry}:${index}`} className="flex items-center gap-3 rounded-lg border border-white/[0.06] p-3 text-[9px] text-gray-400"><FileClock size={11} className="text-gray-600" /><span>{entry}</span><span className="ml-auto font-mono text-[8px] text-gray-700">now</span></div>) : <div className="text-[9px] text-gray-600">No mutations in this session.</div>}</div></GlassPanel>
        </>
      )}

      {editorOpen && mode === 'erp' && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Edit ${label} record`}>
          <GlassPanel className="mb-12 w-full max-w-4xl rounded-2xl border border-vertical-accent/20 p-5 sm:p-7">
            <div className="flex items-start justify-between"><div><div className="font-mono text-[8px] uppercase tracking-wider text-vertical-accent">{draft.id ? `Edit ${draft.id}` : `Create ${moduleProfile?.noun ?? contract.asset}`}</div><h2 className="mt-2 text-xl text-white">{label} operating record</h2></div><button type="button" aria-label="Close record editor" onClick={() => setEditorOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={15} /></button></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label={`${moduleProfile?.noun ?? contract.asset} / decision subject`}><input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></Field>
              <Field label="Segment / work context"><input value={draft.segment} onChange={(event) => setDraft({ ...draft, segment: event.target.value })} /></Field>
              <Field label="Accountable owner"><select value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })}>{contract.actors.map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label="Channel / intake source"><select value={draft.channel} onChange={(event) => setDraft({ ...draft, channel: event.target.value })}>{contract.channels.map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label={facetLabel}><select value={draft.facet} onChange={(event) => setDraft({ ...draft, facet: event.target.value })}>{facetOptions.map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label="Operating status"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as DomainStatus })}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label="Branch"><select value={draft.branch} onChange={(event) => { const location = locations.find((item) => item.branch === event.target.value) || locations[0]; setDraft({ ...draft, branch: location.branch, site: location.site }); }}>{locations.map((value) => <option key={value.branch}>{value.branch}</option>)}</select></Field>
              <Field label="Site"><select value={draft.site} onChange={(event) => setDraft({ ...draft, site: event.target.value })}>{locations.filter((item) => item.branch === draft.branch).map((value) => <option key={value.site}>{value.site}</option>)}</select></Field>
              <Field label="Controlled value (GHS)"><input type="number" min="0" value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} /></Field>
              <Field label="Impact / promise"><input value={draft.impact} onChange={(event) => setDraft({ ...draft, impact: event.target.value })} /></Field>
              <div className="md:col-span-2"><Field label="Required next action"><textarea rows={4} value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} /></Field></div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-white/[0.08] pt-5">{draft.id && <button type="button" onClick={deleteRecord} className="mr-auto min-h-10 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] px-4 text-[9px] text-rose-300">Delete record</button>}<button type="button" onClick={() => setEditorOpen(false)} className="min-h-10 rounded-lg border border-white/[0.08] px-4 text-[9px] text-gray-500">Cancel</button><button type="button" onClick={saveRecord} className="min-h-10 rounded-lg bg-vertical-accent px-5 text-[9px] font-semibold text-black">Save operating record</button></div>
          </GlassPanel>
        </div>
      )}
    </motion.div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block"><span className="mb-2 block font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="[&_input]:h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.09] [&_input]:bg-[#080808] [&_input]:px-3 [&_input]:text-[10px] [&_input]:text-gray-200 [&_input]:outline-none [&_select]:h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.09] [&_select]:bg-[#080808] [&_select]:px-3 [&_select]:text-[10px] [&_select]:text-gray-200 [&_select]:outline-none [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/[0.09] [&_textarea]:bg-[#080808] [&_textarea]:p-3 [&_textarea]:text-[10px] [&_textarea]:text-gray-200 [&_textarea]:outline-none">{children}</div></label>;

const RecordTable = ({ records, mode, onEdit, onStatus }: { records: DomainRecord[]; mode: 'analytics' | 'erp'; onEdit: (record: DomainRecord) => void; onStatus: (id: string, status: DomainStatus) => void }) => (
  <GlassPanel className="overflow-hidden rounded-xl">
    <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="text-sm text-white">{mode === 'erp' ? 'Operational register' : 'Contributing evidence'}</h2><p className="mt-1 text-[9px] text-gray-600">{records.length} records under the active custom filters.</p></div><ArrowRight size={13} className="text-vertical-accent" /></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left"><thead className="border-b border-white/[0.06] bg-white/[0.02] font-mono text-[8px] uppercase text-gray-600"><tr><th scope="col" className="px-5 py-3">Record</th><th scope="col" className="px-3 py-3">Subject</th><th scope="col" className="px-3 py-3">Branch / site</th><th scope="col" className="px-3 py-3">Owner</th><th scope="col" className="px-3 py-3">Impact</th><th scope="col" className="px-3 py-3">Next action</th><th scope="col" className="px-3 py-3">Status</th>{mode === 'erp' && <th scope="col" aria-label="Record actions" className="px-5 py-3" />}</tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-white/[0.05] text-[10px]"><td className="px-5 py-4 font-mono text-vertical-accent">{record.id}</td><td className="px-3 py-4"><div className="text-white">{record.subject}</div><div className="mt-1 text-[8px] text-gray-600">{record.segment} · {record.facet}</div></td><td className="px-3 py-4"><div className="text-gray-300">{record.branch}</div><div className="mt-1 text-[8px] text-gray-600">{record.site}</div></td><td className="px-3 py-4 text-gray-400">{record.owner}</td><td className="px-3 py-4 text-gray-300">{record.impact}</td><td className="px-3 py-4 text-gray-300">{record.action}</td><td className="px-3 py-4">{mode === 'erp' ? <select aria-label={`Status for ${record.id}`} value={record.status} onChange={(event) => onStatus(record.id, event.target.value as DomainStatus)} className="h-9 rounded-lg border border-white/[0.08] bg-[#080808] px-2 text-[9px] text-gray-300">{statuses.map((status) => <option key={status}>{status}</option>)}</select> : <span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-gray-300">{record.status}</span>}</td>{mode === 'erp' && <td className="px-5 py-4"><button type="button" aria-label={`Edit ${record.id} ${record.subject}`} onClick={() => onEdit(record)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 hover:text-vertical-accent"><Edit3 size={12} /></button></td>}</tr>)}</tbody></table></div>
    {records.length === 0 && <div className="p-10 text-center text-[10px] text-gray-600">No records match this exact combination.</div>}
  </GlassPanel>
);
