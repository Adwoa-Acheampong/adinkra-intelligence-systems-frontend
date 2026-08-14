import { useMemo, type ReactNode } from 'react';
import { CalendarDays, ChevronDown, Filter, MapPin, RotateCcw, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { Tenant } from '../../types';

export type DomainPeriod = 'real-time' | 'today' | '7d' | '30d' | 'ytd' | 'custom';
export type DomainCurrency = 'GHS' | 'USD';

export interface DomainFilterState {
  period: DomainPeriod;
  currency: DomainCurrency;
  country: string;
  city: string;
  tenant: string;
  branch: string;
  site: string;
  status: string;
  actor: string;
  facet: string;
  from: string;
  to: string;
}

interface LocationOption { country: string; city: string; branch: string; site: string }

interface DomainFilterBarProps {
  label: string;
  tenants: Tenant[];
  locations: LocationOption[];
  actors: string[];
  facetLabel: string;
  facetOptions: string[];
  filters: DomainFilterState;
  update: (patch: Partial<DomainFilterState>) => void;
  reset: () => void;
}

const defaultState: DomainFilterState = { period: '30d', currency: 'GHS', country: 'all', city: 'all', tenant: 'all', branch: 'all', site: 'all', status: 'all', actor: 'all', facet: 'all', from: '', to: '' };

export const useDomainFilters = (namespace: string) => {
  const [params, setParams] = useSearchParams();
  const filters = useMemo<DomainFilterState>(() => ({
    period: (params.get(`${namespace}.period`) as DomainPeriod) || defaultState.period,
    currency: (params.get(`${namespace}.currency`) as DomainCurrency) || defaultState.currency,
    country: params.get(`${namespace}.country`) || defaultState.country,
    city: params.get(`${namespace}.city`) || defaultState.city,
    tenant: params.get(`${namespace}.tenant`) || defaultState.tenant,
    branch: params.get(`${namespace}.branch`) || defaultState.branch,
    site: params.get(`${namespace}.site`) || defaultState.site,
    status: params.get(`${namespace}.status`) || defaultState.status,
    actor: params.get(`${namespace}.actor`) || defaultState.actor,
    facet: params.get(`${namespace}.facet`) || defaultState.facet,
    from: params.get(`${namespace}.from`) || defaultState.from,
    to: params.get(`${namespace}.to`) || defaultState.to,
  }), [namespace, params]);

  const update = (patch: Partial<DomainFilterState>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      const typedKey = key as keyof DomainFilterState;
      if (!value || value === defaultState[typedKey]) next.delete(`${namespace}.${key}`);
      else next.set(`${namespace}.${key}`, value);
    });
    setParams(next, { replace: true });
  };

  const reset = () => {
    const next = new URLSearchParams(params);
    Object.keys(defaultState).forEach((key) => next.delete(`${namespace}.${key}`));
    setParams(next, { replace: true });
  };

  return { filters, update, reset };
};

const SelectControl = ({ label, value, onChange, options, icon }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; icon?: ReactNode }) => (
  <label className="relative min-w-[132px] flex-1">
    <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.14em] text-gray-600">{icon}{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#090909] px-3 pr-8 text-[9px] text-gray-300 outline-none transition focus:border-vertical-accent">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <ChevronDown size={11} className="pointer-events-none absolute bottom-3.5 right-3 text-gray-600" />
  </label>
);

export const DomainFilterBar = ({ label, tenants, locations, actors, facetLabel, facetOptions, filters, update, reset }: DomainFilterBarProps) => {
  const countries = [...new Set(locations.map((item) => item.country))];
  const cities = [...new Set(locations.filter((item) => filters.country === 'all' || item.country === filters.country).map((item) => item.city))];
  const branches = [...new Set(locations.filter((item) => (filters.country === 'all' || item.country === filters.country) && (filters.city === 'all' || item.city === filters.city)).map((item) => item.branch))];
  const sites = [...new Set(locations.filter((item) => (filters.branch === 'all' || item.branch === filters.branch)).map((item) => item.site))];
  const periods: Array<{ value: DomainPeriod; label: string }> = [{ value: 'real-time', label: 'Real-time' }, { value: 'today', label: 'Today' }, { value: '7d', label: '7D' }, { value: '30d', label: '30D' }, { value: 'ytd', label: 'YTD' }, { value: 'custom', label: 'Custom' }];
  return <section aria-label={`${label} custom filters`} className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-vertical-accent"><Filter size={12} /> Filter this decision</div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.07] bg-[#080808] p-1">{periods.map((item) => <button key={item.value} type="button" onClick={() => update({ period: item.value })} className={`min-h-8 rounded-md px-2.5 text-[8px] ${filters.period === item.value ? 'bg-vertical-accent text-black' : 'text-gray-500 hover:text-gray-200'}`}>{item.label}</button>)}</div>
        <div className="flex rounded-lg border border-white/[0.07] bg-[#080808] p-1">{(['GHS', 'USD'] as DomainCurrency[]).map((currency) => <button key={currency} type="button" onClick={() => update({ currency })} className={`min-h-8 rounded-md px-3 font-mono text-[8px] ${filters.currency === currency ? 'bg-white text-black' : 'text-gray-500'}`}>{currency}</button>)}</div>
        {filters.period === 'custom' && <><label className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[8px] text-gray-500"><CalendarDays size={11} /><span>From</span><input aria-label="Custom period from" type="date" value={filters.from} onChange={(event) => update({ from: event.target.value })} className="h-8 bg-transparent text-gray-300 outline-none" /></label><label className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[8px] text-gray-500"><span>To</span><input aria-label="Custom period to" type="date" value={filters.to} onChange={(event) => update({ to: event.target.value })} className="h-8 bg-transparent text-gray-300 outline-none" /></label></>}
        <button type="button" onClick={reset} className="ml-auto flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-[8px] text-gray-500 hover:text-white"><RotateCcw size={11} /> Reset</button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <SelectControl label="Country" value={filters.country} onChange={(country) => update({ country, city: 'all', branch: 'all', site: 'all' })} icon={<MapPin size={9} />} options={[{ value: 'all', label: 'All countries' }, ...countries.map((value) => ({ value, label: value }))]} />
        <SelectControl label="City" value={filters.city} onChange={(city) => update({ city, branch: 'all', site: 'all' })} options={[{ value: 'all', label: 'All cities' }, ...cities.map((value) => ({ value, label: value }))]} />
        <SelectControl label="Tenant" value={filters.tenant} onChange={(tenant) => update({ tenant })} icon={<Users size={9} />} options={[{ value: 'all', label: 'All tenants' }, ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))]} />
        <SelectControl label="Branch" value={filters.branch} onChange={(branch) => update({ branch, site: 'all' })} options={[{ value: 'all', label: 'All branches' }, ...branches.map((value) => ({ value, label: value }))]} />
        <SelectControl label="Site" value={filters.site} onChange={(site) => update({ site })} options={[{ value: 'all', label: 'All sites' }, ...sites.map((value) => ({ value, label: value }))]} />
        <SelectControl label="Status" value={filters.status} onChange={(status) => update({ status })} options={[{ value: 'all', label: 'All statuses' }, ...['Critical', 'At risk', 'Watch', 'On track'].map((value) => ({ value, label: value }))]} />
        <SelectControl label="Owner" value={filters.actor} onChange={(actor) => update({ actor })} options={[{ value: 'all', label: 'All work centres' }, ...actors.map((value) => ({ value, label: value }))]} />
        <SelectControl label={facetLabel} value={filters.facet} onChange={(facet) => update({ facet })} options={[{ value: 'all', label: `All ${facetLabel.toLowerCase()}` }, ...facetOptions.map((value) => ({ value, label: value }))]} />
      </div>
    </div>
  </section>;
};
