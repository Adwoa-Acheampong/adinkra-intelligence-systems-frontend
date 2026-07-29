import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Box,
  Boxes,
  BriefcaseBusiness,
  CircleDollarSign,
  Database,
  Fingerprint,
  Globe2,
  Network,
  Search,
  ShieldCheck,
  Signal,
  Users,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { MetricDrill } from '../components/intelligence/MetricDrill';
import { IntelligenceState } from '../components/intelligence/IntelligenceState';
import { useTenant } from '../context/TenantContext';
import type { MetricDomain } from '../intelligence/contracts';
import { getMetricsByDomain, getRegisteredMetric, METRIC_REGISTRY } from '../intelligence/metricRegistry';
import { ONTOLOGY_REGISTRY } from '../intelligence/ontologyRegistry';
import { SCOPE_ORDER } from '../intelligence/scopeRegistry';

type ExplorerMode = 'metrics' | 'ontology';

const domainMeta: Record<MetricDomain | 'all', { label: string; icon: React.ElementType }> = {
  all: { label: 'All claims', icon: Database },
  inventory: { label: 'Inventory', icon: Boxes },
  operations: { label: 'Operations', icon: BriefcaseBusiness },
  sales: { label: 'Sales', icon: Signal },
  finance: { label: 'Finance', icon: CircleDollarSign },
  workforce: { label: 'Workforce', icon: Users },
  trust: { label: 'Trust', icon: ShieldCheck },
  telemetry: { label: 'Telemetry', icon: Fingerprint },
};

export const IntelligenceExplorer: React.FC = () => {
  const { setCurrentVertical } = useTenant();
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState<ExplorerMode>(params.get('view') === 'ontology' ? 'ontology' : 'metrics');
  const domain = (params.get('domain') as MetricDomain | 'all') || 'all';
  const query = params.get('q') || '';
  const requestedMetric = getRegisteredMetric(params.get('metric'));

  useEffect(() => {
    setCurrentVertical('global');
  }, [setCurrentVertical]);

  const filteredMetrics = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return getMetricsByDomain(domain).filter(({ definition }) =>
      !normalized
      || definition.name.toLowerCase().includes(normalized)
      || definition.question.toLowerCase().includes(normalized)
      || definition.id.toLowerCase().includes(normalized)
      || definition.owner.toLowerCase().includes(normalized),
    );
  }, [domain, query]);
  const selectedMetric = filteredMetrics.find(({ definition }) => definition.id === requestedMetric.definition.id)
    ?? filteredMetrics[0]
    ?? requestedMetric;

  const updateParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  };

  const selectMode = (nextMode: ExplorerMode) => {
    setMode(nextMode);
    updateParams({ view: nextMode === 'ontology' ? 'ontology' : undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-[1700px] pb-12"
    >
      <header className="mb-4 border-b border-white/[0.08] pb-4">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-vertical-accent">
              <Network size={12} /> Intelligence foundation / evidence explorer
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.035em] text-white md:text-3xl">
              Ask the claim. Inspect the proof.
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-500">
              Every number is registered before it appears. Open a claim to see its scope, formula, contributors, source event and original evidence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 font-mono text-[9px] text-gray-400">
              {METRIC_REGISTRY.length} governed metrics
            </span>
            <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 font-mono text-[9px] text-emerald-300">
              Original evidence linked
            </span>
            <span className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 font-mono text-[9px] text-amber-200">
              Demonstration data
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <div className="flex rounded-xl border border-white/[0.08] bg-black/20 p-1">
            <button
              onClick={() => selectMode('metrics')}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-xs transition focus:outline-none focus:ring-2 focus:ring-vertical-accent lg:flex-none ${mode === 'metrics' ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-200'}`}
            >
              <Database size={14} /> Metric registry
            </button>
            <button
              onClick={() => selectMode('ontology')}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-xs transition focus:outline-none focus:ring-2 focus:ring-vertical-accent lg:flex-none ${mode === 'ontology' ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-200'}`}
            >
              <BookOpen size={14} /> Ontology
            </button>
          </div>
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 focus-within:border-vertical-accent/40">
            <Search size={15} className="text-gray-600" />
            <input
              value={query}
              onChange={(event) => updateParams({ q: event.target.value || undefined, domain: undefined, metric: undefined })}
              placeholder="Search a business question, metric, owner or entity…"
              className="w-full bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-700"
            />
            <kbd className="hidden rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-gray-700 sm:block">Evidence first</kbd>
          </label>
        </div>
      </header>

      {mode === 'metrics' ? (
        <div className="grid gap-5 md:grid-cols-[210px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="md:sticky md:top-0 md:self-start">
            <div className="rounded-xl border border-white/[0.08] bg-black/20 p-2">
              <div className="px-3 pb-2 pt-2 font-mono text-[8px] uppercase tracking-[0.18em] text-gray-700">Decision domains</div>
              {(Object.keys(domainMeta) as Array<MetricDomain | 'all'>).map((domainId) => {
                const meta = domainMeta[domainId];
                const Icon = meta.icon;
                const count = getMetricsByDomain(domainId).length;
                return (
                  <button
                    key={domainId}
                    onClick={() => updateParams({ domain: domainId === 'all' ? undefined : domainId, metric: undefined })}
                    className={`flex min-h-9 w-full items-center gap-3 rounded-lg px-3 text-left transition focus:outline-none focus:ring-2 focus:ring-vertical-accent ${domain === domainId ? 'bg-vertical-accent/[0.09] text-vertical-accent' : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-200'}`}
                  >
                    <Icon size={14} />
                    <span className="flex-1 text-xs">{meta.label}</span>
                    <span className="font-mono text-[8px] text-gray-700">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20">
              <div className="border-b border-white/[0.06] px-4 py-3">
                <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-gray-700">{filteredMetrics.length} registered claims</div>
                <div className="mt-1 text-[10px] text-gray-500">{domainMeta[domain].label}</div>
              </div>
              <div className="custom-scrollbar max-h-64 space-y-1 overflow-y-auto p-2">
                {filteredMetrics.map(({ definition, observation }) => (
                  <button
                    key={definition.id}
                    onClick={() => updateParams({ metric: definition.id })}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-vertical-accent ${selectedMetric.definition.id === definition.id ? 'border-vertical-accent/40 bg-vertical-accent/[0.08]' : 'border-transparent hover:border-white/[0.08] hover:bg-white/[0.025]'}`}
                  >
                    <div className="text-[10px] leading-4 text-gray-300">{definition.name}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[7px] uppercase tracking-wider text-gray-700">
                      <span className="truncate">{definition.id}</span>
                      <span className="shrink-0 text-gray-500">{observation.displayValue}</span>
                    </div>
                  </button>
                ))}
                {filteredMetrics.length === 0 && <IntelligenceState kind="empty" compact />}
              </div>
            </div>
            <details className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20">
              <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[8px] uppercase tracking-[0.18em] text-gray-700">Scope grammar</summary>
              <div className="border-t border-white/[0.06] px-4 py-3">
                {SCOPE_ORDER.map((scope, index) => (
                  <div key={scope} className="relative flex items-center gap-3 py-1">
                    {index < SCOPE_ORDER.length - 1 && <div className="absolute left-[5px] top-4 h-3 w-px bg-white/[0.08]" />}
                    <div className={`h-3 w-3 rounded-full border ${index === 0 ? 'border-vertical-accent bg-vertical-accent/20' : index === SCOPE_ORDER.length - 1 ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-white/[0.14] bg-black'}`} />
                    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{scope}</span>
                  </div>
                ))}
              </div>
            </details>
          </aside>

          <main className="min-w-0">
            <MetricDrill metric={selectedMetric} />
          </main>
        </div>
      ) : (
        <OntologyView query={query} />
      )}
    </motion.div>
  );
};

const OntologyView: React.FC<{ query: string }> = ({ query }) => {
  const normalized = query.trim().toLowerCase();
  const entities = ONTOLOGY_REGISTRY.filter((entity) =>
    !normalized
    || entity.label.toLowerCase().includes(normalized)
    || entity.meaning.toLowerCase().includes(normalized)
    || entity.verticalExtensions.some((extension) => extension.includes(normalized)),
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-gray-600">Common ontology kernel v1</div>
          <p className="mt-2 text-xs text-gray-500">Shared meaning at the centre; vertical meaning preserved through explicit extensions.</p>
        </div>
        <div className="hidden items-center gap-2 text-[9px] text-gray-600 md:flex">
          <Globe2 size={13} /> one identity and relationship grammar
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {entities.map((entity) => (
          <article key={entity.id} className="group rounded-xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-vertical-accent/25">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-gray-500 group-hover:text-vertical-accent">
                <Box size={15} />
              </div>
              <span className="rounded border border-white/[0.06] px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-gray-700">{entity.family}</span>
            </div>
            <h2 className="mt-4 text-sm font-medium text-white">{entity.label}</h2>
            <p className="mt-2 min-h-12 text-[10px] leading-4 text-gray-500">{entity.meaning}</p>
            <div className="mt-4 rounded border border-white/[0.06] bg-black/20 px-3 py-2">
              <div className="font-mono text-[7px] uppercase tracking-wider text-gray-700">Stable ID</div>
              <div className="mt-1 font-mono text-[9px] text-gray-400">{entity.stableIdPattern}</div>
            </div>
            <details className="mt-3 border-t border-white/[0.06] pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[8px] uppercase tracking-wider text-gray-600">
                Relationships and extensions <ArrowRight size={10} />
              </summary>
              <div className="mt-3 space-y-2">
                {entity.relationships.map((relationship) => (
                  <div key={relationship} className="text-[9px] text-gray-500">→ {relationship}</div>
                ))}
                <div className="flex flex-wrap gap-1 pt-2">
                  {entity.verticalExtensions.map((extension) => (
                    <span key={extension} className="rounded border border-white/[0.06] px-1.5 py-1 text-[8px] text-gray-600">{extension}</span>
                  ))}
                </div>
              </div>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
};
