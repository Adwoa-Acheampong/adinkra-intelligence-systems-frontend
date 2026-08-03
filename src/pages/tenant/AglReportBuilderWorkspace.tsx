import { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  Database,
  Download,
  FileCheck2,
  Filter,
  LockKeyhole,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import {
  AGL_REPORT_FAMILIES,
  AGL_REPORT_SUBJECTS,
  aglReportingWorkflow,
  defaultAglReportConfig,
  type AglReportConfig,
  type AglReportFormat,
  type AglReportResult,
  type AglRetainedReportEnvelope,
} from '../../erp/agl/reportingWorkflow';
import { aglExportWorkflow } from '../../erp/agl/exportWorkflow';
import { AglSignatureCapture } from '../../components/tenant/AglSignatureCapture';

const actor = { name: 'AGL Admin', role: 'Administrator' };
type ReportModule = 'business-reports' | 'managerial-reports';
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const number = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 2 });

export const AglReportBuilderWorkspace = ({
  tenant,
  moduleId,
  revision,
}: {
  tenant: Tenant;
  moduleId: ReportModule;
  revision: number;
}) => {
  const initialSubject = moduleId === 'business-reports' ? 'sales-activity' : 'mechanic-performance';
  const [config, setConfig] = useState<AglReportConfig>(() => defaultAglReportConfig(initialSubject));
  const [selectedId, setSelectedId] = useState('');
  const [drilledGroup, setDrilledGroup] = useState('');
  const [signatory, setSignatory] = useState('Bekoe Adu Benjamin');
  const [signature, setSignature] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const reports = useMemo(() => aglReportingWorkflow.reports(moduleId), [moduleId, revision]);
  const selected = reports.find((report) => report.id === selectedId);
  const retained = selected ? parseRetainedReport(selected.payload) : null;
  const liveResult = useMemo(() => aglReportingWorkflow.buildReport(config), [config, revision]);
  const result = retained?.result ?? liveResult;
  const displayedConfig = retained?.config ?? config;
  const subject = AGL_REPORT_SUBJECTS.find((candidate) => candidate.id === config.subjectId) ?? AGL_REPORT_SUBJECTS[0];
  const family = AGL_REPORT_FAMILIES.find((candidate) => candidate.id === subject.familyId) ?? AGL_REPORT_FAMILIES[0];
  const legacySelection = Boolean(selected && !retained);

  const updateConfig = (patch: Partial<AglReportConfig>) => {
    setSelectedId('');
    setDrilledGroup('');
    setConfig((current) => ({ ...current, ...patch }));
  };
  const chooseSubject = (subjectId: string) => {
    setSelectedId('');
    setDrilledGroup('');
    setConfig(defaultAglReportConfig(subjectId));
  };
  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      const record = operation() as AglOperationalRecord | undefined;
      if (record?.id) setSelectedId(record.id);
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The report operation could not be completed.');
    }
  };
  const filterOptions = (field: string) => field
    ? [...new Set(liveResult.rows.map((row) => String(row[field] ?? '')).filter(Boolean))].sort()
    : [];
  const exportRows = drilledGroup
    ? result.rows.filter((row) => String(row[result.groupBy.key] ?? '').trim() === drilledGroup)
    : result.rows;
  const exportEvidence = () => aglExportWorkflow.xlsxRows({
    key: selected?.id ?? result.subjectId,
    label: String(selected?.name ?? displayedConfig.title),
    rows: exportRows.map((row) => Object.fromEntries(result.columns.map((column) => [column.label, row[column.key] ?? '']))),
  });
  const printReport = () => {
    if (selected) aglReportingWorkflow.recordPrint(actor, moduleId, selected.id);
    window.print();
  };

  return (
    <div className="mx-auto max-w-[1760px] space-y-5 pb-12">
      <header className="agl-no-print flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><FileCheck2 size={13} /> {tenant.id.toUpperCase()} ERP / {moduleId.replace('-', ' ')}</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">{moduleId === 'business-reports' ? 'Business report builder' : 'Managerial report builder'}</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Choose the exact subject, measures, breakdown, filters, and evidence columns. Preview is live; retaining freezes the definition, source population, scope, and results for approval.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportEvidence} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300"><Download size={14} /> Export this evidence</button>
          <button onClick={printReport} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Printer size={14} /> Print / PDF</button>
        </div>
      </header>

      <Message notice={notice} error={error} onClose={() => { setNotice(''); setError(''); }} />

      <div className="agl-no-print grid items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(
                () => aglReportingWorkflow.generateReport(actor, moduleId, config, liveResult),
                `${config.title} retained with ${liveResult.rowCount} evidence records.`,
              );
            }}
            className="space-y-5 rounded-xl border border-cyan-300/15 bg-[#090909] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2 text-sm text-white"><SlidersHorizontal size={14} className="text-cyan-300" /> Define report</div><p className="mt-1 text-[9px] leading-4 text-gray-600">Branch, site, and period come from Operating Scope above.</p></div>
              <button type="button" onClick={() => { setSelectedId(''); setDrilledGroup(''); setConfig(defaultAglReportConfig(initialSubject)); }} className="flex min-h-8 items-center gap-1 rounded border border-white/[0.08] px-2 text-[8px] text-gray-500"><RotateCcw size={11} /> Reset</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <SelectField
                label="Report family"
                value={family.id}
                onChange={(value) => chooseSubject(AGL_REPORT_SUBJECTS.find((candidate) => candidate.familyId === value)?.id ?? AGL_REPORT_SUBJECTS[0].id)}
                options={AGL_REPORT_FAMILIES.map((item) => ({ value: item.id, label: item.label }))}
              />
              <SelectField
                label="Report subject"
                value={subject.id}
                onChange={chooseSubject}
                options={AGL_REPORT_SUBJECTS.filter((candidate) => candidate.familyId === family.id).map((item) => ({ value: item.id, label: item.label }))}
              />
            </div>
            <div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.025] p-3 text-[9px] leading-4 text-gray-500"><span className="text-cyan-200">{subject.label}:</span> {subject.description}</div>
            <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Report title</span><input value={config.title} onChange={(event) => updateConfig({ title: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" /></label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <SelectField label="Break down by" value={config.groupBy} onChange={(value) => updateConfig({ groupBy: value })} options={subject.dimensions.map((item) => ({ value: item.key, label: item.label }))} />
              <SelectField label="Primary measure" value={config.primaryMeasure} onChange={(value) => updateConfig({ primaryMeasure: value })} options={subject.measures.map((item) => ({ value: item.key, label: item.label }))} />
            </div>
            <SelectField label="Starting detail" value={config.detailLevel} onChange={(value) => updateConfig({ detailLevel: value as AglReportConfig['detailLevel'] })} options={[{ value: 'summary', label: 'Summary only' }, { value: 'grouped', label: 'Summary + breakdown' }, { value: 'evidence', label: 'Summary + full evidence' }]} />

            <div className="border-t border-white/[0.07] pt-4">
              <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-cyan-300"><Filter size={11} /> Drill and filter population</div>
              <label className="relative mt-3 block"><Search size={13} className="absolute left-3 top-3.5 text-gray-700" /><input value={config.search} onChange={(event) => updateConfig({ search: event.target.value })} placeholder="Customer, vehicle, item, employee..." className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 pl-9 pr-3 text-[10px] text-white" /></label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <SelectField label="Filter field 1" value={config.filterFieldA} onChange={(value) => updateConfig({ filterFieldA: value, filterValueA: '' })} options={[{ value: '', label: 'No filter' }, ...subject.dimensions.map((item) => ({ value: item.key, label: item.label }))]} />
                <SelectField label="Filter value 1" value={config.filterValueA} onChange={(value) => updateConfig({ filterValueA: value })} disabled={!config.filterFieldA} options={[{ value: '', label: 'All values' }, ...filterOptions(config.filterFieldA).map((value) => ({ value, label: value }))]} />
                <SelectField label="Filter field 2" value={config.filterFieldB} onChange={(value) => updateConfig({ filterFieldB: value, filterValueB: '' })} options={[{ value: '', label: 'No filter' }, ...subject.dimensions.map((item) => ({ value: item.key, label: item.label }))]} />
                <SelectField label="Filter value 2" value={config.filterValueB} onChange={(value) => updateConfig({ filterValueB: value })} disabled={!config.filterFieldB} options={[{ value: '', label: 'All values' }, ...filterOptions(config.filterFieldB).map((value) => ({ value, label: value }))]} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <NumberField label="Minimum primary value" value={config.minimumValue} onChange={(value) => updateConfig({ minimumValue: value })} placeholder="No minimum" />
                <NumberField label="Maximum primary value" value={config.maximumValue} onChange={(value) => updateConfig({ maximumValue: value })} placeholder="No maximum" />
              </div>
            </div>

            <ChoiceGrid label="Summary measures" items={subject.measures.map((measure) => ({ key: measure.key, label: measure.label }))} selected={config.metricKeys} onToggle={(key) => updateConfig({ metricKeys: toggleChoice(config.metricKeys, key) })} />
            <ChoiceGrid label="Evidence columns" items={subject.columns.map((column) => ({ key: column.key, label: column.label }))} selected={config.columns} onToggle={(key) => updateConfig({ columns: toggleChoice(config.columns, key) })} />

            <div className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
              <div className="flex items-center justify-between gap-3"><span className="font-mono text-[8px] uppercase text-gray-600">Live population</span><span className="font-mono text-sm text-white">{liveResult.rowCount}</span></div>
              <div className="mt-1 text-[9px] text-gray-700">{liveResult.sourceModules.join(' + ')} · {liveResult.scopeLabel}</div>
            </div>
            <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 text-[10px] font-semibold text-black"><Plus size={13} /> Freeze this defined report</button>
          </form>

          <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-3">
            <div className="flex items-center justify-between px-2 py-2"><span className="font-mono text-[8px] uppercase text-gray-600">Retained reports</span>{selected && <button onClick={() => { setSelectedId(''); setDrilledGroup(''); }} className="text-[8px] text-cyan-300">Live builder</button>}</div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              {reports.map((report) => (
                <button key={report.id} onClick={() => { setSelectedId(report.id); setSignature(null); setDrilledGroup(''); }} className={`w-full rounded-lg border p-3 text-left ${selected?.id === report.id ? 'border-cyan-300/25 bg-cyan-300/[0.05]' : 'border-white/[0.07] bg-black/20'}`}>
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-[8px] text-cyan-300">{report.id}</span><Status value={report.status} /></div>
                  <div className="mt-2 text-[11px] text-gray-200">{String(report.name)}</div>
                  <div className="mt-1 text-[9px] text-gray-600">{String(report.reference)} · {Number(report.recordCount ?? 0)} records</div>
                </button>
              ))}
              {!reports.length && <div className="p-8 text-center text-[10px] text-gray-700">No retained reports yet.</div>}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {legacySelection && <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 text-[10px] text-amber-100">This is a legacy fixed snapshot created before the report builder. Its original definition has no dimensions or evidence population; use the live builder to regenerate it correctly.</div>}
          <ReportDocument record={selected} config={displayedConfig} result={result} drilledGroup={drilledGroup} onDrill={setDrilledGroup} />
          <aside className="rounded-xl border border-white/[0.08] bg-[#090909] p-4">
            <div className="flex items-center gap-2 text-sm text-white"><LockKeyhole size={14} className="text-cyan-300" /> Approval control</div>
            {selected ? (
              selected.status === 'Approved'
                ? <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.05] p-4 text-[10px] leading-5 text-emerald-200"><ShieldCheck size={15} className="mb-2" />Signed by {String(selected.signatory)} on {new Date(String(selected.signedAt)).toLocaleString()}.</div>
                : (
                  <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_240px] lg:items-end">
                    <label><span className="font-mono text-[8px] uppercase text-gray-600">Signatory</span><input value={signatory} onChange={(event) => setSignatory(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" /></label>
                    <AglSignatureCapture label="Report signature" value={signature} onCapture={setSignature} />
                    <button onClick={() => run(() => aglReportingWorkflow.signReport(actor, moduleId, selected.id, signature ?? '', signatory), `${selected.id} signed and approved.`)} className="min-h-10 w-full rounded-lg bg-emerald-400 text-[10px] font-semibold text-black">Sign and approve report</button>
                  </div>
                )
            ) : <p className="mt-4 text-[10px] leading-4 text-gray-600">The preview is live and cannot be signed. Freeze its report definition and evidence first; the retained record can then be approved.</p>}
          </aside>
        </div>
      </div>

      <div className="hidden print:block"><ReportDocument record={selected} config={displayedConfig} result={result} drilledGroup={drilledGroup} onDrill={() => undefined} print /></div>
    </div>
  );
};

const ReportDocument = ({
  record,
  config,
  result,
  drilledGroup,
  onDrill,
  print = false,
}: {
  record?: AglOperationalRecord;
  config: AglReportConfig;
  result: AglReportResult;
  drilledGroup: string;
  onDrill: (group: string) => void;
  print?: boolean;
}) => {
  const rows = drilledGroup
    ? result.rows.filter((row) => String(row[result.groupBy.key] ?? '').trim() === drilledGroup)
    : result.rows;
  const maxValue = Math.max(...result.groups.map((group) => Math.abs(group.value)), 1);
  const showBreakdown = config.detailLevel !== 'summary' || Boolean(drilledGroup);
  const showEvidence = config.detailLevel === 'evidence' || Boolean(drilledGroup);
  return (
    <article className={`${print ? 'agl-print-root' : ''} overflow-hidden rounded-xl border ${print ? 'border-gray-300 bg-white text-black' : 'border-white/[0.08] bg-[#f8f7f3] text-[#121212]'}`}>
      <div className="border-b border-black/10 p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-red-600"><span>AGL OPS · controlled report</span><span className="rounded border border-red-200 px-2 py-1">{record?.status ?? 'Live preview'}</span></div>
            <h2 className="mt-3 font-serif text-3xl font-bold">{String(record?.name ?? config.title)}</h2>
            <p className="mt-2 text-xs text-gray-500">{result.familyLabel} / {result.subjectLabel} · grouped by {result.groupBy.label}</p>
            <p className="mt-1 max-w-3xl text-[10px] leading-4 text-gray-500">{result.scopeLabel}</p>
          </div>
          <div className="text-left text-[10px] text-gray-500 md:text-right"><div>{String(record?.id ?? 'LIVE-PREVIEW')}</div><div className="mt-1">{new Date(String(record?.generatedAt ?? result.generatedAt)).toLocaleString()}</div><div className="mt-1">{result.rowCount} evidence records</div></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-black/10 lg:grid-cols-4">
        {result.metrics.map((metric) => <PaperMetric key={metric.key} label={metric.label} value={formatReportValue(metric.value, metric.format)} />)}
      </div>

      <div className="space-y-7 p-7">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-3">
            <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500"><BarChart3 size={13} /> {result.primaryMeasure.label} by {result.groupBy.label}</div><p className="mt-1 text-[9px] text-gray-400">Select a bar to drill back to its source records.</p></div>
            {drilledGroup && <button onClick={() => onDrill('')} className="agl-no-print rounded border border-black/10 px-3 py-2 text-[9px] text-gray-600">Clear drill: {drilledGroup}</button>}
          </div>
          {!result.groups.length ? <div className="py-14 text-center text-xs text-gray-400">No ERP evidence matches this report definition and operating scope.</div> : (
            <div className="mt-4 grid gap-2">
              {result.groups.slice(0, 16).map((group) => print ? (
                <div key={group.label} className="grid grid-cols-[1fr_auto] border-b border-black/5 py-2 text-[10px]"><span>{group.label}</span><span className="font-mono">{formatReportValue(group.value, result.primaryMeasure.format)} · {group.count}</span></div>
              ) : (
                <button key={group.label} onClick={() => onDrill(group.label)} className={`group grid grid-cols-[minmax(110px,0.8fr)_minmax(160px,2fr)_auto] items-center gap-3 rounded-lg px-3 py-2 text-left transition ${drilledGroup === group.label ? 'bg-cyan-50 ring-1 ring-cyan-300' : 'hover:bg-black/[0.025]'}`}>
                  <span className="truncate text-[10px] font-semibold">{group.label}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-gray-200"><span className="block h-full rounded-full bg-[#121212] transition-all group-hover:bg-cyan-600" style={{ width: `${Math.max(2, (Math.abs(group.value) / maxValue) * 100)}%` }} /></span>
                  <span className="min-w-24 text-right font-mono text-[10px] font-semibold">{formatReportValue(group.value, result.primaryMeasure.format)} <span className="text-gray-400">· {group.count}</span></span>
                </button>
              ))}
            </div>
          )}
        </section>

        {showBreakdown && result.groups.length > 0 && (
          <section>
            <h3 className="border-b border-black/10 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Grouped result</h3>
            <div className="mt-3 overflow-x-auto rounded-lg border border-black/10">
              <table className="w-full min-w-[560px] text-left text-[10px]">
                <thead className="bg-black/[0.035] text-gray-500"><tr><th className="px-4 py-3">{result.groupBy.label}</th><th className="px-4 py-3 text-right">{result.primaryMeasure.label}</th><th className="px-4 py-3 text-right">Evidence records</th><th className="agl-no-print w-10 px-3 py-3" /></tr></thead>
                <tbody>{result.groups.map((group) => <tr key={group.label} className="border-t border-black/[0.06]"><td className="px-4 py-3 font-semibold">{group.label}</td><td className="px-4 py-3 text-right font-mono">{formatReportValue(group.value, result.primaryMeasure.format)}</td><td className="px-4 py-3 text-right font-mono">{group.count}</td><td className="agl-no-print px-3 py-3"><button onClick={() => onDrill(group.label)} title={`Drill to ${group.label}`}><ChevronRight size={13} /></button></td></tr>)}</tbody>
              </table>
            </div>
          </section>
        )}

        {showEvidence && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-3">
              <div><h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500"><Database size={13} /> Source evidence {drilledGroup ? `· ${drilledGroup}` : ''}</h3><p className="mt-1 text-[9px] text-gray-400">{rows.length} of {result.rowCount} scoped records shown.</p></div>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg border border-black/10">
              <table className="w-full min-w-[760px] text-left text-[9px]">
                <thead className="bg-black/[0.035] text-gray-500"><tr>{result.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-3 py-3">{column.label}</th>)}</tr></thead>
                <tbody>{rows.slice(0, print ? 40 : 100).map((row) => <tr key={`${row.sourceModule}-${row.sourceId}`} className="border-t border-black/[0.06]">{result.columns.map((column) => <td key={column.key} className={`max-w-[240px] px-3 py-3 ${['money', 'number', 'percent'].includes(column.format ?? '') ? 'text-right font-mono' : ''}`}>{formatReportCell(row[column.key], column.format)}</td>)}</tr>)}</tbody>
              </table>
            </div>
            {rows.length > 100 && !print && <p className="mt-2 text-[9px] text-gray-400">Preview limited to 100 rows. Export this evidence for the full population.</p>}
          </section>
        )}

        <section className="grid gap-4 border-t border-black/10 pt-5 text-[9px] leading-4 text-gray-500 lg:grid-cols-2">
          <div><div className="font-bold uppercase tracking-wider text-gray-600">Calculation and population</div><p className="mt-1">{result.methodology}</p></div>
          <div><div className="font-bold uppercase tracking-wider text-gray-600">Evidence lineage</div><p className="mt-1">Sources: {result.sourceModules.join(', ')}. Every displayed row retains its source module and record ID; the retained report freezes this population rather than querying it again later.</p></div>
        </section>
      </div>
      {record?.signature && <div className="border-t border-black/10 p-7"><div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Authorized signature</div><img src={String(record.signature)} alt="Report signature" className="mt-3 max-h-20 max-w-xs" /><p className="mt-2 text-[10px] text-gray-500">{String(record.signatory)}</p></div>}
    </article>
  );
};

const SelectField = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <label className="block">
    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#050505] px-3 text-[10px] text-white disabled:cursor-not-allowed disabled:opacity-35">
      {options.map((option) => <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

const NumberField = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) => (
  <label><span className="font-mono text-[8px] uppercase text-gray-600">{label}</span><input type="number" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-[10px] text-white" /></label>
);

const ChoiceGrid = ({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: Array<{ key: string; label: string }>;
  selected: string[];
  onToggle: (key: string) => void;
}) => (
  <details className="rounded-lg border border-white/[0.07] bg-black/20" open>
    <summary className="cursor-pointer list-none px-3 py-3 font-mono text-[8px] uppercase tracking-wider text-gray-500">{label} · {selected.length} selected</summary>
    <div className="flex flex-wrap gap-2 border-t border-white/[0.06] p-3">
      {items.map((item) => <button key={item.key} type="button" onClick={() => onToggle(item.key)} className={`rounded-md border px-2.5 py-2 text-[8px] transition ${selected.includes(item.key) ? 'border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-200' : 'border-white/[0.07] text-gray-600 hover:text-gray-300'}`}>{item.label}</button>)}
    </div>
  </details>
);

const PaperMetric = ({ label, value }: { label: string; value: string }) => <div className="bg-white p-5"><div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</div><div className="mt-2 font-mono text-base font-bold">{value}</div></div>;
const Status = ({ value }: { value: string }) => <span className="inline-flex rounded border border-current/15 px-2 py-1 font-mono text-[8px] uppercase opacity-75">{value}</span>;
const Message = ({ notice, error, onClose }: { notice: string; error: string; onClose: () => void }) => !notice && !error ? null : <div className={`agl-no-print flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span>{error || notice}</span><button onClick={onClose}><X size={13} /></button></div>;

const toggleChoice = (values: string[], key: string) => values.includes(key) ? values.filter((value) => value !== key) : [...values, key];
const formatReportValue = (value: number, format: Exclude<AglReportFormat, 'text' | 'date'>) => format === 'money' ? money.format(value) : format === 'percent' ? `${number.format(value)}%` : number.format(value);
const formatReportCell = (value: string | number | undefined, format?: AglReportFormat) => {
  if (value === undefined || value === '') return '—';
  if (format === 'money') return money.format(Number(value));
  if (format === 'number') return number.format(Number(value));
  if (format === 'percent') return `${number.format(Number(value))}%`;
  if (format === 'date') {
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
  }
  return String(value);
};
const parseRetainedReport = (value: unknown): AglRetainedReportEnvelope | null => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' && (parsed as AglRetainedReportEnvelope).version === 2
      ? parsed as AglRetainedReportEnvelope
      : null;
  } catch {
    return null;
  }
};
