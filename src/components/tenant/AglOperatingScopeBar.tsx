import { useEffect, useState, type ReactNode } from 'react';
import {
  Building2,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crosshair,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { useAglOperatingScope } from '../../context/AglOperatingScopeContext';
import {
  aglScopeLabel,
  getAglSite,
  getAglWriteSite,
  readAglOrgUnits,
  type AglPeriodPreset,
} from '../../erp/agl/operatingScope';

const periods: Array<{ value: AglPeriodPreset; label: string }> = [
  { value: 'all', label: 'All history' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This week' },
  { value: 'this-month', label: 'This month' },
  { value: 'this-quarter', label: 'This quarter' },
  { value: 'this-year', label: 'This year' },
  { value: 'custom', label: 'Custom dates' },
];

export const AglOperatingScopeBar = () => {
  const { scope, patchScope, resetScope } = useAglOperatingScope();
  const [, setRevision] = useState(0);
  const [collapsed, setCollapsed] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem('agl_scope_bar_collapsed') === 'true'
  ));
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  useEffect(() => {
    window.localStorage.setItem('agl_scope_bar_collapsed', String(collapsed));
  }, [collapsed]);
  const units = readAglOrgUnits();
  const countries = units.filter((unit) => unit.level === 'country');
  const cities = units.filter((unit) => (
    unit.level === 'city' && (!scope.countryCode || unit.countryCode === scope.countryCode)
  ));
  const branches = units.filter((unit) => (
    unit.level === 'branch'
    && (!scope.countryCode || unit.countryCode === scope.countryCode)
    && (!scope.city || unit.city === scope.city)
  ));
  const sites = units.filter((unit) => (
    unit.level === 'site'
    && (!scope.countryCode || unit.countryCode === scope.countryCode)
    && (!scope.city || unit.city === scope.city)
    && (!scope.branchId || unit.branchId === scope.branchId)
  ));
  const writeSite = getAglWriteSite(scope);
  const explicitWriteSite = getAglSite(scope.siteId);

  return (
    <section
      aria-label="AGL operating scope"
      className="relative z-20 shrink-0 border-b border-cyan-300/10 bg-[#071012]/95 px-3 py-2.5 backdrop-blur-xl md:px-5"
    >
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex min-h-7 w-full items-center justify-between gap-4 text-left"
          aria-label="Expand operating scope controls"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-300"><Crosshair size={12} /> Operating scope</span>
            <span className="truncate text-[9px] text-cyan-100/55">{aglScopeLabel(scope)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-cyan-300/60">Expand <ChevronDown size={12} /></span>
        </button>
      ) : (
      <>
      <div className="flex min-w-max items-end gap-2 overflow-x-auto pb-0.5">
        <div className="mr-1 hidden min-w-40 self-center xl:block">
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-300">
            <Crosshair size={12} /> Operating scope
          </div>
          <div className="mt-1 truncate text-[9px] text-cyan-100/55" title={aglScopeLabel(scope)}>
            {aglScopeLabel(scope)}
          </div>
        </div>
        <ScopeSelect
          label="Country"
          icon={<Building2 size={11} />}
          value={scope.countryCode}
          onChange={(countryCode) => patchScope({ countryCode, city: '', branchId: '', siteId: '' })}
          options={countries.map((unit) => ({ value: unit.countryCode, label: unit.name }))}
          allLabel="All countries"
        />
        <ChevronRight size={12} className="mb-3 text-cyan-300/25" />
        <ScopeSelect
          label="City"
          icon={<MapPin size={11} />}
          value={scope.city}
          onChange={(city) => patchScope({ city, branchId: '', siteId: '' })}
          options={cities.map((unit) => ({ value: unit.city ?? '', label: unit.name }))}
          allLabel="All cities"
        />
        <ChevronRight size={12} className="mb-3 text-cyan-300/25" />
        <ScopeSelect
          label="Branch"
          icon={<Building2 size={11} />}
          value={scope.branchId}
          onChange={(branchId) => patchScope({ branchId, siteId: '' })}
          options={branches.map((unit) => ({ value: unit.id, label: unit.name }))}
          allLabel="All branches"
        />
        <ChevronRight size={12} className="mb-3 text-cyan-300/25" />
        <ScopeSelect
          label="Site"
          icon={<MapPin size={11} />}
          value={scope.siteId}
          onChange={(siteId) => patchScope({ siteId })}
          options={sites.map((unit) => ({ value: unit.id, label: unit.name }))}
          allLabel="All sites"
        />
        <div className="mx-1 h-9 w-px self-center bg-cyan-300/10" />
        <ScopeSelect
          label="Period"
          icon={<CalendarRange size={11} />}
          value={scope.periodPreset}
          onChange={(periodPreset) => patchScope({ periodPreset: periodPreset as AglPeriodPreset })}
          options={periods}
        />
        {scope.periodPreset === 'custom' && (
          <>
            <ScopeInput label="From" value={scope.dateFrom} onChange={(dateFrom) => patchScope({ dateFrom })} />
            <ScopeInput label="To" value={scope.dateTo} onChange={(dateTo) => patchScope({ dateTo })} />
          </>
        )}
        <div className={`ml-1 min-w-48 rounded-lg border px-3 py-2 ${explicitWriteSite ? 'border-cyan-300/10 bg-cyan-300/[0.035]' : 'border-amber-300/15 bg-amber-300/[0.045]'}`}>
          <div className={`font-mono text-[7px] uppercase tracking-[0.16em] ${explicitWriteSite ? 'text-cyan-300/60' : 'text-amber-300/70'}`}>{explicitWriteSite ? 'New records file to' : 'Aggregate view · read only'}</div>
          <div className={`mt-1 truncate text-[9px] ${explicitWriteSite ? 'text-cyan-50' : 'text-amber-100/75'}`}>{explicitWriteSite ? `${writeSite.branchName} / ${writeSite.siteName}` : 'Choose one site before creating records'}</div>
        </div>
        <button
          onClick={resetScope}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] text-gray-500 transition hover:border-cyan-300/20 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          aria-label="Reset operating scope"
          title="Reset to AGL Accra / East Legon / all history"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="mb-0.5 flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/[0.07] px-2 text-[7px] font-mono uppercase tracking-wider text-gray-500 transition hover:border-cyan-300/20 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          aria-label="Collapse operating scope controls"
          title="Collapse operating scope"
        >
          Hide <ChevronUp size={11} />
        </button>
      </div>
      </>
      )}
    </section>
  );
};

const ScopeSelect = ({
  label,
  icon,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
}) => (
  <label className="block shrink-0">
    <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.16em] text-cyan-300/55">{icon}{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 h-8 min-w-28 rounded-md border border-cyan-300/10 bg-[#081416] px-2 text-[9px] text-cyan-50 outline-none focus:border-cyan-300/40"
    >
      {allLabel && <option value="">{allLabel}</option>}
      {options.map((option) => <option key={`${label}-${option.value}`} value={option.value}>{option.label}</option>)}
    </select>
  </label>
);

const ScopeInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="block shrink-0">
    <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-cyan-300/55">{label}</span>
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 h-8 rounded-md border border-cyan-300/10 bg-[#081416] px-2 text-[9px] text-cyan-50 outline-none focus:border-cyan-300/40"
    />
  </label>
);
