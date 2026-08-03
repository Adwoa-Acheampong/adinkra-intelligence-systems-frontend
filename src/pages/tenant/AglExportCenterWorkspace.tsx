import { useEffect, useMemo, useState } from 'react';
import { Database, Download, FileJson, FileSpreadsheet, ShieldCheck, X } from 'lucide-react';
import type { Tenant } from '../../types';
import { aglExportWorkflow, type AglExportTarget } from '../../erp/agl/exportWorkflow';

export const AglExportCenterWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const targets = useMemo(() => aglExportWorkflow.targets(), [revision]);
  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      operation();
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The export could not be generated.');
    }
  };
  return (
    <div className="mx-auto max-w-[1580px] space-y-5 pb-12">
      <header className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Database size={13} /> {tenant.id.toUpperCase()} ERP / controlled export</div>
        <h1 className="mt-3 text-3xl font-display font-semibold text-white">Export & backup center</h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Transfer individual operating books or the complete frontend ERP state. Each export records the actor, target, format, record count, and timestamp in Admin Audit.</p>
      </header>
      {(notice || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span>{error || notice}</span><button onClick={() => { setNotice(''); setError(''); }}><X size={13} /></button></div>}

      <section className="rounded-xl border border-cyan-300/15 bg-gradient-to-r from-cyan-300/[0.06] to-transparent p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-300"><ShieldCheck size={19} /></span><div><h2 className="text-lg text-white">Full AGL Operational ERP backup</h2><p className="mt-2 max-w-2xl text-[10px] leading-5 text-gray-500">XLSX creates one worksheet per module plus Admin Audit. JSON preserves the full local state for engineering migration and later backend wiring. No environment secrets are included.</p></div></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => run(() => aglExportWorkflow.fullJson(), 'Full JSON backup downloaded.')} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300"><FileJson size={14} /> Full JSON</button>
            <button onClick={() => run(() => aglExportWorkflow.fullWorkbook(), 'Full ERP workbook downloaded.')} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-4 text-xs font-semibold text-black"><FileSpreadsheet size={14} /> Full XLSX</button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909]">
        <div className="border-b border-white/[0.08] px-5 py-4"><h2 className="text-sm text-white">Operational books</h2><p className="mt-1 text-[10px] text-gray-600">CSV produces one flattened data file; XLSX preserves each source module as a separate worksheet.</p></div>
        <div className="divide-y divide-white/[0.06]">
          {targets.map((target) => (
            <ExportRow
              key={target.key}
              target={target}
              records={target.records}
              onCsv={() => run(() => aglExportWorkflow.csv(target), `${target.label} exported as CSV.`)}
              onXlsx={() => run(() => aglExportWorkflow.xlsx(target), `${target.label} exported as XLSX.`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const ExportRow = ({ target, records, onCsv, onXlsx }: { target: AglExportTarget; records: number; onCsv: () => void; onXlsx: () => void }) => (
  <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
    <div>
      <div className="flex flex-wrap items-center gap-3"><h3 className="text-xs font-medium text-gray-200">{target.label}</h3><span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-gray-600">{records} records · {target.modules.length} books</span></div>
      <p className="mt-2 text-[10px] leading-4 text-gray-600">{target.description}</p>
      <p className="mt-2 font-mono text-[8px] text-gray-700">{target.modules.join(' · ')}</p>
    </div>
    <div className="flex gap-2">
      <button onClick={onCsv} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-[10px] text-gray-400"><Download size={13} /> CSV</button>
      <button onClick={onXlsx} className="flex min-h-10 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] px-4 text-[10px] text-cyan-200"><FileSpreadsheet size={13} /> XLSX</button>
    </div>
  </div>
);
