import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Layers3,
  Filter,
  Monitor,
  MousePointerClick,
  Route as RouteIcon,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Users,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlassPanel } from '../components/ui/GlassPanel';
import { useTenant } from '../context/TenantContext';
import { ERPModulePage } from './ERPModulePage';
import {
  AppScreenMetric,
  getNativeApp,
  getWebsiteRoute,
  NATIVE_APPS,
  WEBSITE_FUNNEL,
  WEBSITE_ROUTES,
} from '../data/platformAnalyticsData';

const compact = new Intl.NumberFormat('en-GH', { notation: 'compact', maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('en-GH');

type ProductPeriod = 'today' | '7d' | '30d' | 'ytd';
type ProductHealth = 'All health' | 'Healthy' | 'Watch' | 'Critical';

interface ProductFilterState {
  period: ProductPeriod;
  market: string;
  platform: string;
  health: ProductHealth;
  vertical: string;
  owner: string;
}

const productDefaults: ProductFilterState = { period: '7d', market: 'Global', platform: 'All platforms', health: 'All health', vertical: 'All verticals', owner: 'All owners' };
const periodMultiplier: Record<ProductPeriod, number> = { today: 0.18, '7d': 1, '30d': 3.86, ytd: 28.4 };
const marketMultiplier: Record<string, number> = { Global: 1, Ghana: 0.58, Nigeria: 0.24, Kenya: 0.07, Rwanda: 0.04, 'South Africa': 0.07 };

const useProductFilters = (namespace: string) => {
  const [params, setParams] = useSearchParams();
  const filters: ProductFilterState = {
    period: (params.get(`${namespace}.period`) as ProductPeriod) || productDefaults.period,
    market: params.get(`${namespace}.market`) || productDefaults.market,
    platform: params.get(`${namespace}.platform`) || productDefaults.platform,
    health: (params.get(`${namespace}.health`) as ProductHealth) || productDefaults.health,
    vertical: params.get(`${namespace}.vertical`) || productDefaults.vertical,
    owner: params.get(`${namespace}.owner`) || productDefaults.owner,
  };
  const update = (patch: Partial<ProductFilterState>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === productDefaults[key as keyof ProductFilterState]) next.delete(`${namespace}.${key}`);
      else next.set(`${namespace}.${key}`, String(value));
    });
    setParams(next, { replace: true });
  };
  const reset = () => {
    const next = new URLSearchParams(params);
    Object.keys(productDefaults).forEach((key) => next.delete(`${namespace}.${key}`));
    setParams(next, { replace: true });
  };
  return { filters, update, reset };
};

const ProductFilterBar = ({ filters, update, reset, verticals, owners, platforms }: { filters: ProductFilterState; update: (patch: Partial<ProductFilterState>) => void; reset: () => void; verticals: string[]; owners: string[]; platforms: string[] }) => (
  <section aria-label="Digital product custom filters" className="rounded-xl border border-white/[0.08] bg-black/25 p-3">
    <div className="flex flex-wrap items-end gap-2">
      <div className="mr-2 self-center font-mono text-[8px] uppercase tracking-[0.18em] text-blue-300"><Filter size={12} className="mr-2 inline" />Filter this product decision</div>
      <div className="flex rounded-lg border border-white/[0.07] p-1">{(['today', '7d', '30d', 'ytd'] as ProductPeriod[]).map((period) => <button type="button" key={period} onClick={() => update({ period })} className={`min-h-8 rounded-md px-3 font-mono text-[8px] uppercase ${filters.period === period ? 'bg-blue-300 text-black' : 'text-gray-500'}`}>{period === 'today' ? 'Today' : period.toUpperCase()}</button>)}</div>
      {[
        ['Market', filters.market, ['Global', 'Ghana', 'Nigeria', 'Kenya', 'Rwanda', 'South Africa'], (value: string) => update({ market: value })],
        ['Platform', filters.platform, platforms, (value: string) => update({ platform: value })],
        ['Health', filters.health, ['All health', 'Healthy', 'Watch', 'Critical'], (value: string) => update({ health: value as ProductHealth })],
        ['Vertical', filters.vertical, ['All verticals', ...verticals], (value: string) => update({ vertical: value })],
        ['Owner', filters.owner, ['All owners', ...owners], (value: string) => update({ owner: value })],
      ].map(([label, value, options, onChange]) => <label key={String(label)} className="min-w-[130px] flex-1"><span className="mb-1.5 block font-mono text-[7px] uppercase tracking-wider text-gray-600">{String(label)}</span><select value={String(value)} onChange={(event) => (onChange as (value: string) => void)(event.target.value)} className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#090909] px-3 text-[9px] text-gray-300">{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}
      <button type="button" onClick={reset} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-3 font-mono text-[8px] uppercase text-gray-500 hover:text-white"><RotateCcw size={11} /> Reset</button>
    </div>
  </section>
);

const routeHealth = (errorRate: number): ProductHealth => errorRate > 0.3 ? 'Critical' : errorRate >= 0.15 ? 'Watch' : 'Healthy';
const appHealth = (crashFree: number): ProductHealth => crashFree < 99.7 ? 'Critical' : crashFree < 99.85 ? 'Watch' : 'Healthy';

export const WebsitesApps: React.FC = () => {
  const { setCurrentVertical } = useTenant();
  useEffect(() => setCurrentVertical('appsWebsite'), [setCurrentVertical]);

  return (
    <Routes>
      <Route index element={<PlatformPortfolio />} />
      <Route path="website/blkk-star-hub" element={<WebsiteDashboard />} />
      <Route path="website/blkk-star-hub/routes/:routeId" element={<WebsiteRouteDetail />} />
      <Route path="website/blkk-star-hub/:moduleId" element={<ERPModulePage />} />
      <Route path="apps/:appId" element={<NativeAppDashboard />} />
      <Route path="apps/:appId/:moduleId" element={<ERPModulePage />} />
      <Route path=":moduleId" element={<ERPModulePage />} />
      <Route path="*" element={<Navigate to="/apps-website" replace />} />
    </Routes>
  );
};

const PlatformHeader: React.FC<{ eyebrow: string; title: React.ReactNode; description: string; backTo?: string; backLabel?: string }> = ({
  eyebrow,
  title,
  description,
  backTo,
  backLabel,
}) => (
  <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
    <div>
      {backTo && (
        <Link to={backTo} className="mb-4 inline-flex items-center gap-2 text-xs text-gray-500 transition hover:text-white">
          <ArrowLeft size={14} /> {backLabel}
        </Link>
      )}
      <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-blue-300"><CircleDot size={12} /> {eyebrow}</div>
      <h1 className="text-3xl font-display font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
      <CheckCircle2 size={13} /> Telemetry current · 42 sec
    </div>
  </div>
);

const MetricCard: React.FC<{ label: string; value: React.ReactNode; detail: string; icon: React.ElementType }> = ({ label, value, detail, icon: Icon }) => (
  <GlassPanel className="rounded-xl p-4">
    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-500"><span>{label}</span><Icon size={14} className="text-vertical-accent" /></div>
    <div className="mt-4 text-2xl font-display text-white">{value}</div>
    <div className="mt-1 text-xs text-gray-600">{detail}</div>
  </GlassPanel>
);

const PlatformPortfolio: React.FC = () => {
  const { filters, update, reset } = useProductFilters('digital.portfolio');
  const volumeFactor = periodMultiplier[filters.period] * marketMultiplier[filters.market];
  const visibleRoutes = WEBSITE_ROUTES.filter((route) => (filters.health === 'All health' || routeHealth(route.errorRate) === filters.health) && (filters.vertical === 'All verticals' || route.vertical === filters.vertical) && (filters.owner === 'All owners' || route.owner === filters.owner));
  const appVertical: Record<string, string> = {
    'blkk-autos': 'Autos',
    merchants: 'Merchants',
    farmers: 'Farmers',
    estate: 'Estate',
    'label-admin': 'BLKK Label',
  };
  const visibleApps = NATIVE_APPS.filter((app) =>
    (filters.health === 'All health' || appHealth(app.crashFree) === filters.health)
    && (filters.vertical === 'All verticals' || appVertical[app.id] === filters.vertical)
  );
  const showWebsite = ['All platforms', 'Responsive web'].includes(filters.platform);
  const showApps = filters.platform !== 'Responsive web';
  const platformFactor = filters.platform === 'Android' ? 0.73 : filters.platform === 'iOS' ? 0.27 : 1;
  const webSessions = visibleRoutes.reduce((sum, route) => sum + route.sessions, 0) * volumeFactor;
  const appMau = visibleApps.reduce((sum, app) => sum + app.mau, 0) * volumeFactor * platformFactor;
  const criticalSignals = visibleRoutes.filter((route) => routeHealth(route.errorRate) !== 'Healthy').length + visibleApps.filter((app) => appHealth(app.crashFree) !== 'Healthy').length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-8">
      <PlatformHeader
        eyebrow="Digital estate portfolio"
        title={<>Websites & <span className="text-vertical-accent">Apps</span></>}
        description="One portfolio index for every customer-facing property. Open the BLKK Star Hub website or any native app to inspect routes, screens, workflows, events, errors, releases and conversion loss."
      />

      <ProductFilterBar filters={filters} update={update} reset={reset} verticals={[...new Set(WEBSITE_ROUTES.map((route) => route.vertical))]} owners={[...new Set(WEBSITE_ROUTES.map((route) => route.owner))]} platforms={['All platforms', 'Responsive web', 'Android', 'iOS']} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tracked properties" value={(showWebsite ? 1 : 0) + (showApps ? visibleApps.length : 0)} detail={`${showWebsite ? '1 website' : 'website excluded'} · ${showApps ? `${visibleApps.length} native apps` : 'apps excluded'}`} icon={Layers3} />
        <MetricCard label={`Website sessions · ${filters.period.toUpperCase()}`} value={showWebsite ? compact.format(webSessions) : 'Excluded'} detail={`${visibleRoutes.length} routes match the exact filters`} icon={Monitor} />
        <MetricCard label={`Native app users · ${filters.period.toUpperCase()}`} value={showApps ? compact.format(appMau) : 'Excluded'} detail={`${filters.market} · ${filters.platform}`} icon={Users} />
        <MetricCard label="Signals in scope" value={criticalSignals} detail={`${filters.health} · ${filters.owner}`} icon={AlertTriangle} />
      </div>

      {showWebsite && <section>
        <div className="mb-4">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Website portfolio</div>
          <p className="mt-1 text-xs text-gray-600">Web properties are first-class portfolio assets, not hidden inside a central aggregate.</p>
        </div>
        <Link
          to="/apps-website/website/blkk-star-hub"
          className="group block rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-400/[0.09] via-white/[0.025] to-transparent p-6 transition hover:-translate-y-0.5 hover:border-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-300"><Monitor size={22} /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-display text-white">BLKK Star Hub</h2>
                  <span className="rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-mono uppercase text-emerald-300">Production</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono uppercase text-gray-400">Responsive web</span>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-gray-400">The single multi-vertical marketplace where BLKK mediates discovery, verification, advisory, orders, escrow, payment and fulfilment.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Autos', 'Merchants', 'Farmers', 'Estate', 'Label', 'Susu', 'Agents'].map((vertical) => <span key={vertical} className="rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[10px] text-gray-500">{vertical}</span>)}
                </div>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div><div className="text-xl text-white">{compact.format(webSessions)}</div><div className="text-[9px] font-mono uppercase text-gray-600">Route sessions</div></div>
              <div><div className="text-xl text-white">1.31s</div><div className="text-[9px] font-mono uppercase text-gray-600">Median LCP</div></div>
              <div><div className="text-xl text-white">5.6%</div><div className="text-[9px] font-mono uppercase text-gray-600">Order intent</div></div>
              <div className="flex items-end justify-end text-blue-300"><span className="mr-2 text-xs">Open website</span><ArrowRight size={17} className="transition group-hover:translate-x-1" /></div>
            </div>
          </div>
        </Link>
      </section>}

      {showApps && <section>
        <div className="mb-4">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Native app portfolio</div>
          <p className="mt-1 text-xs text-gray-600">Each card opens a product-specific micro dashboard; none terminate at this portfolio layer.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {visibleApps.map((app) => (
            <Link
              key={app.id}
              to={`/apps-website/apps/${app.id}`}
              className="group flex min-h-[230px] flex-col rounded-xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.045] focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ ['--app-accent' as string]: app.accent }}
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg border p-2" style={{ color: app.accent, borderColor: `${app.accent}45`, backgroundColor: `${app.accent}12` }}><Smartphone size={18} /></div>
                <ChevronRight size={16} className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-white">{app.name}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-gray-500">{app.purpose}</p>
              <div className="mt-auto grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
                <div><div className="text-base text-white">{compact.format(app.mau * volumeFactor * platformFactor)}</div><div className="text-[9px] font-mono uppercase text-gray-600">Users in scope</div></div>
                <div><div className="text-base text-white">{app.crashFree}%</div><div className="text-[9px] font-mono uppercase text-gray-600">Crash free</div></div>
              </div>
            </Link>
          ))}
        </div>
      </section>}

      <div className="rounded-xl border border-blue-400/20 bg-blue-400/[0.06] p-4 text-xs leading-relaxed text-gray-300">
        <span className="font-medium text-blue-200">Transaction control:</span> every conversion represented here is BLKK-mediated. The website and apps route users through BLKK advisors, BLKK orders, platform payment/escrow and BLKK fulfilment—never direct buyer-to-seller checkout or messaging.
      </div>
    </motion.div>
  );
};

const WebsiteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { filters, update, reset } = useProductFilters('digital.website');
  const verticals = Array.from(new Set(WEBSITE_ROUTES.map((item) => item.vertical)));
  const owners = Array.from(new Set(WEBSITE_ROUTES.map((item) => item.owner)));
  const routes = WEBSITE_ROUTES.filter((route) => (filters.vertical === 'All verticals' || route.vertical === filters.vertical) && (filters.owner === 'All owners' || route.owner === filters.owner) && (filters.health === 'All health' || routeHealth(route.errorRate) === filters.health));
  const volumeFactor = periodMultiplier[filters.period] * marketMultiplier[filters.market] * (filters.platform === 'Mobile web' ? 0.72 : filters.platform === 'Desktop web' ? 0.28 : 1);
  const routeSessions = routes.reduce((sum, route) => sum + route.sessions, 0);
  const sessions = routeSessions * volumeFactor;
  const weightedConversion = routes.reduce((sum, route) => sum + route.sessions * route.conversion, 0) / Math.max(routeSessions, 1);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-7">
      <PlatformHeader
        eyebrow="Website portfolio / property 01"
        title={<>BLKK Star Hub <span className="text-blue-300">Website</span></>}
        description="Route-level product, commerce and runtime analytics for the single BLKK marketplace. Filter the table, then open any route to inspect events and loss points."
        backTo="/apps-website"
        backLabel="All websites & apps"
      />

      <ProductFilterBar filters={filters} update={update} reset={reset} verticals={verticals} owners={owners} platforms={['All platforms', 'Mobile web', 'Desktop web']} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label={`Sessions · ${filters.period.toUpperCase()}`} value={compact.format(sessions)} detail={`${routes.length} routes · ${filters.market} · ${filters.platform}`} icon={Users} />
        <MetricCard label="Weighted conversion" value={`${weightedConversion.toFixed(1)}%`} detail="BLKK action / session" icon={MousePointerClick} />
        <MetricCard label="Order payments" value={compact.format(7142 * volumeFactor)} detail="authorised by platform inside this scope" icon={ShieldCheck} />
        <MetricCard label="Weighted LCP" value={`${(routes.reduce((sum, route) => sum + route.lcp * route.sessions, 0) / Math.max(routeSessions, 1)).toFixed(2)}s`} detail="session-weighted route p75" icon={Zap} />
        <MetricCard label="Affected sessions" value={compact.format(routes.reduce((sum, route) => sum + route.sessions * route.errorRate / 100, 0) * volumeFactor)} detail={`${filters.health} runtime scope`} icon={Code2} />
        <MetricCard label="Zero-result searches" value={compact.format(routes.reduce((sum, route) => sum + route.sessions * route.zeroResult / 100, 0) * volumeFactor)} detail="failed discovery sessions in scope" icon={AlertTriangle} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <GlassPanel className="rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-medium text-white">BLKK-mediated conversion funnel</h2><p className="mt-1 text-xs text-gray-500">Discovery through platform fulfilment</p></div><span className="text-[10px] font-mono text-blue-300">{filters.period.toUpperCase()} COHORT</span></div>
          <div className="space-y-3">
            {WEBSITE_FUNNEL.map((step, index) => {
              const width = (step.users / WEBSITE_FUNNEL[0].users) * 100;
              return (
                <div key={step.step} className="grid grid-cols-[22px_1fr_auto] items-center gap-3">
                  <div className="font-mono text-[10px] text-gray-600">0{index + 1}</div>
                  <div><div className="mb-1.5 flex justify-between text-xs"><span className="text-gray-300">{step.step}</span><span className="text-gray-500">{width.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-blue-400" style={{ width: `${width}%`, opacity: 1 - index * 0.08 }} /></div></div>
                  <div className="w-16 text-right font-mono text-xs text-white">{compact.format(step.users * volumeFactor)}</div>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <h2 className="text-sm font-medium text-white">Active product signals</h2>
          <p className="mt-1 text-xs text-gray-500">Prioritised by affected conversion value</p>
          <div className="mt-4 space-y-2">
            {[
              ['MoMo callback retries', 'Payment', 'P1', '184 sessions'],
              ['Estate image LCP > 2.5s', 'Performance', 'P2', '612 sessions'],
              ['“Gearbox” zero results', 'Search', 'P2', '284 searches'],
              ['Tracking map reconnect', 'Logistics', 'P2', '96 sessions'],
              ['Franchise form step 3 exit', 'Conversion', 'P3', '31.5% exit'],
            ].map(([signal, type, priority, impact]) => (
              <div key={signal} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
                <div className="min-w-0"><div className="truncate text-xs text-white">{signal}</div><div className="mt-1 text-[10px] text-gray-600">{type} · {impact}</div></div>
                <span className={`rounded border px-2 py-0.5 font-mono text-[9px] ${priority === 'P1' ? 'border-red-400/20 bg-red-400/10 text-red-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'}`}>{priority}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 md:flex-row md:items-end md:justify-between">
          <div><h2 className="text-sm font-medium text-white">Instrumented routes</h2><p className="mt-1 text-xs text-gray-500">Click a route for its micro dashboard and raw event anatomy.</p></div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {['All verticals', ...verticals].map((item) => <button key={item} onClick={() => update({ vertical: item })} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] transition ${filters.vertical === item ? 'border-blue-400/40 bg-blue-400/10 text-blue-200' : 'border-white/10 text-gray-500 hover:text-white'}`}>{item}</button>)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-black/20 text-[10px] font-mono uppercase tracking-wider text-gray-500"><tr>{['Route / surface', 'Vertical', 'Sessions', 'Conversion', 'Exit', 'LCP p75', 'JS errors', 'Zero result', 'Owner', ''].map((head) => <th key={head} className="px-4 py-3 font-normal">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {routes.map((route) => (
                <tr key={route.id} onClick={() => navigate(`/apps-website/website/blkk-star-hub/routes/${route.id}`)} className="cursor-pointer hover:bg-blue-400/[0.035]">
                  <td className="px-4 py-3"><div className="font-medium text-white">{route.surface}</div><div className="mt-1 font-mono text-[10px] text-blue-300">{route.route}</div></td>
                  <td className="px-4 py-3 text-gray-400">{route.vertical}</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{whole.format(route.sessions * volumeFactor)}</td>
                  <td className="px-4 py-3 text-emerald-300">{route.conversion}%</td>
                  <td className="px-4 py-3 text-gray-400">{route.exit}%</td>
                  <td className={`px-4 py-3 ${route.lcp > 1.5 ? 'text-amber-300' : 'text-gray-300'}`}>{route.lcp}s</td>
                  <td className={`px-4 py-3 ${route.errorRate > 0.3 ? 'text-red-300' : 'text-gray-400'}`}>{route.errorRate}%</td>
                  <td className="px-4 py-3 text-gray-400">{route.zeroResult ? `${route.zeroResult}%` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{route.owner}</td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </motion.div>
  );
};

const WebsiteRouteDetail: React.FC = () => {
  const { routeId = '' } = useParams();
  const { filters, update, reset } = useProductFilters(`digital.route.${routeId}`);
  const route = getWebsiteRoute(routeId);
  if (!route) return <Navigate to="/apps-website/website/blkk-star-hub" replace />;

  const volumeFactor = periodMultiplier[filters.period] * marketMultiplier[filters.market] * (filters.platform === 'Mobile web' ? 0.72 : filters.platform === 'Desktop web' ? 0.28 : 1);
  const scopedSessions = Math.round(route.sessions * volumeFactor);
  const completedIntents = Math.round(scopedSessions * route.conversion / 100);
  const startedIntents = Math.round(Math.min(scopedSessions * 0.92, completedIntents * 1.35));
  const eventRows = [
    ['page_view', scopedSessions, '100%', '0.02%', 'browser'],
    ['content_impression', Math.round(scopedSessions * 0.86), '86.0%', '0.04%', 'catalogue'],
    ['verified_asset_open', Math.round(scopedSessions * 0.58), '67.4%', '0.06%', 'ontology'],
    ['blkk_intent_started', startedIntents, `${(startedIntents / Math.max(scopedSessions, 1) * 100).toFixed(1)}%`, '0.12%', 'crm'],
    ['blkk_intent_completed', completedIntents, `${route.conversion}%`, `${route.errorRate}%`, 'orders'],
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-7">
      <PlatformHeader
        eyebrow={`Website / ${route.vertical} / route`}
        title={<><span className="text-blue-300">{route.surface}</span> micro dashboard</>}
        description={`${route.route} · Owned by ${route.owner}. This view resolves the website aggregate into route, event, dependency, runtime and conversion signals.`}
        backTo="/apps-website/website/blkk-star-hub"
        backLabel="BLKK Star Hub routes"
      />

      <ProductFilterBar filters={filters} update={update} reset={reset} verticals={[route.vertical]} owners={[route.owner]} platforms={['All platforms', 'Mobile web', 'Desktop web']} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Sessions" value={whole.format(scopedSessions)} detail={`${filters.period.toUpperCase()} · ${filters.market} · ${filters.platform}`} icon={Users} />
        <MetricCard label="BLKK conversion" value={`${route.conversion}%`} detail="completed mediated intent" icon={MousePointerClick} />
        <MetricCard label="Exit rate" value={`${route.exit}%`} detail="route exits" icon={RouteIcon} />
        <MetricCard label="LCP p75" value={`${route.lcp}s`} detail={route.lcp < 1.5 ? 'within target' : 'needs attention'} icon={Zap} />
        <MetricCard label="JS error rate" value={`${route.errorRate}%`} detail="affected sessions" icon={Code2} />
        <MetricCard label="Zero result" value={route.zeroResult ? `${route.zeroResult}%` : 'N/A'} detail="search-bearing sessions" icon={AlertTriangle} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="border-b border-white/10 px-5 py-4"><h2 className="text-sm font-medium text-white">Event anatomy</h2><p className="mt-1 text-xs text-gray-500">Exact events feeding the route roll-up</p></div>
          <table className="w-full text-left">
            <thead className="bg-black/20 text-[10px] font-mono uppercase tracking-wider text-gray-500"><tr>{['Event', 'Count', 'Step rate', 'Error', 'Producer'].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {eventRows.map(([event, count, rate, error, producer]) => <tr key={String(event)}><td className="px-5 py-3 font-mono text-blue-300">{event}</td><td className="px-5 py-3 text-white">{whole.format(Number(count))}</td><td className="px-5 py-3 text-gray-300">{rate}</td><td className="px-5 py-3 text-gray-400">{error}</td><td className="px-5 py-3 text-gray-500">{producer}</td></tr>)}
            </tbody>
          </table>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <h2 className="text-sm font-medium text-white">Runtime dependencies</h2>
          <p className="mt-1 text-xs text-gray-500">p95 latency and availability</p>
          <div className="mt-5 space-y-4">
            {[
              ['Identity & consent', '92 ms', '99.99%'],
              ['Search / ontology', '184 ms', '99.94%'],
              ['Media delivery', '242 ms', '99.97%'],
              ['BLKK CRM', '138 ms', '99.98%'],
              ['Orders / escrow', '166 ms', '99.99%'],
            ].map(([name, latency, uptime]) => <div key={name} className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs"><span className="text-gray-300">{name}</span><span className="font-mono text-gray-500">{latency} · <span className="text-emerald-300">{uptime}</span></span></div>)}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="rounded-xl p-5">
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ['Identity key', 'anonymous_id → account_id'],
            ['Tenant context', 'vertical_id · tenant_id · source'],
            ['Commerce control', 'BLKK advisor → order → escrow'],
            ['Audit lineage', 'event_id · occurred_at · ingested_at'],
          ].map(([label, value]) => <div key={label}><div className="text-[9px] font-mono uppercase tracking-wider text-gray-600">{label}</div><div className="mt-2 text-xs text-gray-300">{value}</div></div>)}
        </div>
      </GlassPanel>
    </motion.div>
  );
};

const NativeAppDashboard: React.FC = () => {
  const { appId = '' } = useParams();
  const { filters, update, reset } = useProductFilters(`digital.app.${appId}`);
  const app = getNativeApp(appId);
  const [selected, setSelected] = useState<AppScreenMetric | null>(null);
  if (!app) return <Navigate to="/apps-website" replace />;

  const volumeFactor = periodMultiplier[filters.period] * marketMultiplier[filters.market] * (filters.platform === 'Android' ? 0.73 : filters.platform === 'iOS' ? 0.27 : 1);
  const visibleScreens = app.screens.filter((screen) => (filters.health === 'All health' || routeHealth(screen.errorRate) === filters.health) && (filters.owner === 'All owners' || screen.workflow === filters.owner));
  const chartData = visibleScreens.map((screen) => ({ name: screen.screen.split(' ')[0], views: Math.round(screen.views * volumeFactor), errors: Math.round(screen.views * volumeFactor * screen.errorRate / 100) }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-7" style={{ ['--product-accent' as string]: app.accent }}>
      <PlatformHeader
        eyebrow={`Native app portfolio / ${app.shortName}`}
        title={<>{app.name} <span style={{ color: app.accent }}>App</span></>}
        description={app.purpose}
        backTo="/apps-website"
        backLabel="All websites & apps"
      />

      <ProductFilterBar filters={filters} update={update} reset={reset} verticals={[app.shortName]} owners={[...new Set(app.screens.map((screen) => screen.workflow))]} platforms={['All platforms', 'Android', 'iOS']} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label={`Active users · ${filters.period.toUpperCase()}`} value={compact.format(app.mau * volumeFactor)} detail={`${filters.market} · ${filters.platform}`} icon={Users} />
        <MetricCard label="Crash-free" value={`${app.crashFree}%`} detail="session-weighted" icon={ShieldCheck} />
        <MetricCard label="API p95" value={`${app.apiMs}ms`} detail="app request latency" icon={Clock3} />
        <MetricCard label="Offline backlog" value={whole.format(app.syncBacklog * (filters.platform === 'iOS' ? 0.27 : filters.platform === 'Android' ? 0.73 : 1))} detail="payloads awaiting sync on selected devices" icon={WifiOff} />
        <MetricCard label="Current release" value={`v${app.version}`} detail={`${app.releaseAdoption}% adoption`} icon={Code2} />
        <MetricCard label="Screens in scope" value={visibleScreens.length} detail={`${filters.health} · tap a row to inspect`} icon={Smartphone} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <GlassPanel className="h-[320px] rounded-xl p-5">
          <div className="mb-4"><h2 className="text-sm font-medium text-white">Screen activity and errors</h2><p className="mt-1 text-xs text-gray-500">Views by product surface; errors are shown in the tooltip</p></div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -18 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => compact.format(value)} />
                <Tooltip contentStyle={{ background: '#090909', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="views" fill={app.accent} radius={[3, 3, 0, 0]} fillOpacity={0.82} />
                <Bar dataKey="errors" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="rounded-xl p-5">
          <div className="mb-4"><h2 className="text-sm font-medium text-white">Primary workflow funnel</h2><p className="mt-1 text-xs text-gray-500">Product-specific outcome, not portfolio averages</p></div>
          <div className="space-y-4">
            {app.funnel.map((step, index) => {
              const pct = (step.users / app.funnel[0].users) * 100;
              return <div key={step.step}><div className="mb-1.5 flex justify-between text-xs"><span className="text-gray-300">{index + 1}. {step.step}</span><span className="font-mono text-gray-500">{whole.format(step.users * volumeFactor)} · {pct.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: app.accent, opacity: 1 - index * 0.1 }} /></div></div>;
            })}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="border-b border-white/10 px-5 py-4"><h2 className="text-sm font-medium text-white">Screen and workflow ledger</h2><p className="mt-1 text-xs text-gray-500">Open a screen to inspect its event instrumentation, runtime and ownership.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-black/20 text-[10px] font-mono uppercase tracking-wider text-gray-500"><tr>{['Screen', 'Workflow', 'Views', 'Completion', 'Median load', 'Error rate', 'Offline pending', ''].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {visibleScreens.map((screen) => (
                <tr key={screen.id} onClick={() => setSelected(screen)} className="cursor-pointer hover:bg-white/[0.035]">
                  <td className="px-5 py-3 font-medium text-white">{screen.screen}<div className="mt-1 font-mono text-[10px]" style={{ color: app.accent }}>{screen.id}</div></td>
                  <td className="px-5 py-3 text-gray-400">{screen.workflow}</td>
                  <td className="px-5 py-3 font-mono text-gray-300">{whole.format(screen.views * volumeFactor)}</td>
                  <td className="px-5 py-3 text-emerald-300">{screen.completion}%</td>
                  <td className={`px-5 py-3 ${screen.medianMs > 1000 ? 'text-amber-300' : 'text-gray-300'}`}>{screen.medianMs}ms</td>
                  <td className={`px-5 py-3 ${screen.errorRate > 0.25 ? 'text-red-300' : 'text-gray-400'}`}>{screen.errorRate}%</td>
                  <td className="px-5 py-3 text-gray-400">{whole.format(screen.offlinePending)}</td>
                  <td className="px-5 py-3"><ChevronRight size={14} className="text-gray-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      <div className="grid gap-5 lg:grid-cols-3">
        <GlassPanel className="rounded-xl p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-white">Release health · v{app.version}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ['Rollout', `${app.releaseAdoption}%`, 'of active devices'],
              ['ANR / frozen UI', '0.06%', '7-day sessions'],
              ['Push delivery', '96.8%', 'within 60 seconds'],
            ].map(([label, value, detail]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-black/20 p-4"><div className="text-[9px] font-mono uppercase text-gray-600">{label}</div><div className="mt-3 text-xl text-white">{value}</div><div className="mt-1 text-xs text-gray-600">{detail}</div></div>)}
          </div>
        </GlassPanel>
        <GlassPanel className="rounded-xl p-5">
          <h2 className="text-sm font-medium text-white">Platform split</h2>
          <div className="mt-5 space-y-4">
            {[['Android', 73], ['iOS', 27]].map(([label, value]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="text-gray-300">{label}</span><span className="text-gray-500">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: app.accent }} /></div></div>)}
          </div>
        </GlassPanel>
      </div>

      {selected && <ScreenDrawer screen={selected} appName={app.name} accent={app.accent} onClose={() => setSelected(null)} />}
    </motion.div>
  );
};

const ScreenDrawer: React.FC<{ screen: AppScreenMetric; appName: string; accent: string; onClose: () => void }> = ({ screen, appName, accent, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
    <motion.aside initial={{ x: 520 }} animate={{ x: 0 }} onClick={(event) => event.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6">
      <div className="flex items-start justify-between border-b border-white/10 pb-5">
        <div><div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: accent }}>{appName} / screen</div><h2 className="mt-2 text-xl text-white">{screen.screen}</h2><p className="mt-1 text-xs text-gray-500">{screen.workflow}</p></div>
        <button onClick={onClose} aria-label="Close screen detail" className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white"><X size={17} /></button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[['Views · 7D', whole.format(screen.views)], ['Completion', `${screen.completion}%`], ['Median load', `${screen.medianMs}ms`], ['Error rate', `${screen.errorRate}%`], ['Offline pending', whole.format(screen.offlinePending)], ['Screen key', screen.id]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><div className="text-[9px] font-mono uppercase tracking-wider text-gray-600">{label}</div><div className="mt-2 text-xs text-gray-200">{value}</div></div>)}
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-medium text-white">Instrumented event chain</h3>
        <div className="mt-4 space-y-3">
          {['screen_view', 'primary_action_started', 'validation_completed', 'blkk_workflow_created', 'outcome_confirmed'].map((event, index) => (
            <div key={event} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[9px]" style={{ color: accent, backgroundColor: `${accent}16` }}>{index + 1}</div>
              <div className="flex-1"><div className="font-mono text-xs text-gray-200">{event}</div><div className="mt-1 text-[10px] text-gray-600">user_id · tenant_id · source_surface · occurred_at · correlation_id</div></div>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-blue-400/20 bg-blue-400/[0.06] p-4 text-xs leading-relaxed text-gray-300">
        This workflow creates or advances a BLKK-owned case/order. Counterparties remain mediated through the platform; the app does not expose a direct buyer-to-seller transaction path.
      </div>
    </motion.aside>
  </div>
);
