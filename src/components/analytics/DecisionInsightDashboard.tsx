import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  Database,
  GitBranch,
  Layers3,
  PackageCheck,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import type {
  ERPInsightDefinition,
  InsightDatum,
  InsightException,
  InsightFamily,
  InsightMatrixCell,
} from '../../data/erpInsightCatalog';

interface DecisionInsightDashboardProps {
  insight: ERPInsightDefinition;
  selected: string;
  onSelect: (value: string) => void;
  compact?: boolean;
}

const familyIcon: Record<InsightFamily, React.ElementType> = {
  portfolio: GitBranch,
  commerce: Target,
  inventory: Boxes,
  logistics: PackageCheck,
  finance: CircleDollarSign,
  workforce: Users,
  risk: ShieldCheck,
  product: Sparkles,
  operations: BriefcaseBusiness,
};

const toneText = {
  positive: 'text-emerald-300',
  warning: 'text-amber-300',
  critical: 'text-red-300',
  neutral: 'text-gray-300',
};

const statusSurface: Record<InsightException['status'], string> = {
  'On track': 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Watch: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  'At risk': 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  Critical: 'border-red-400/20 bg-red-400/10 text-red-300',
};

const selectionButton = (active: boolean) =>
  `w-full rounded-lg border text-left transition focus:outline-none focus:ring-2 focus:ring-vertical-accent ${
    active
      ? 'border-vertical-accent/50 bg-vertical-accent/[0.09]'
      : 'border-white/[0.07] bg-black/20 hover:border-white/20 hover:bg-white/[0.035]'
  }`;

const InsightContract: React.FC<{ insight: ERPInsightDefinition }> = ({ insight }) => {
  const Icon = familyIcon[insight.family];
  const trace: Array<{ label: string; value: string; Icon: React.ElementType }> = [
    { label: 'Objective', value: insight.trace.objective, Icon: Target },
    { label: 'Capability', value: insight.trace.capability, Icon: Layers3 },
    { label: 'Value stream', value: insight.trace.valueStream, Icon: Route },
    { label: 'Process', value: insight.trace.process, Icon: Workflow },
    { label: 'Decision', value: insight.trace.decision, Icon: BadgeCheck },
  ];

  return (
    <GlassPanel className="overflow-hidden rounded-xl">
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-vertical-accent/25 bg-vertical-accent-glow text-vertical-accent">
            <Icon size={15} />
          </div>
          <div>
            <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-gray-600">Analysis frame</div>
            <div className="mt-1 text-xs font-medium text-white">{insight.primaryMeasure}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1.5 rounded border border-white/[0.08] bg-black/20 px-2.5 py-1.5 text-gray-400"><Clock3 size={11} /> {insight.meta.period}</span>
          <span className="flex items-center gap-1.5 rounded border border-white/[0.08] bg-black/20 px-2.5 py-1.5 text-gray-400"><Activity size={11} /> {insight.meta.observations}</span>
          <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1.5 text-emerald-300">{insight.meta.confidence}% confidence</span>
          <span className="rounded border border-amber-400/20 bg-amber-400/[0.05] px-2.5 py-1.5 text-amber-200">Mock data</span>
        </div>
      </div>
      <div className="px-3 py-4 sm:px-5">
        <div className="relative grid grid-cols-5">
          <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-4 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
          {trace.map(({ label, value, Icon: TraceIcon }) => (
            <div
              key={label}
              role="group"
              aria-label={`${label}: ${value}`}
              title={`${label}: ${value}`}
              className="relative z-[1] flex min-w-0 select-none flex-col items-center px-1 text-center"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.09] bg-[#0b0b0b] text-gray-500">
                <TraceIcon size={14} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <span className="mt-2 font-mono text-[7px] uppercase tracking-[0.14em] text-gray-600">{label}</span>
              <span className="mt-1 line-clamp-2 max-w-36 text-[8px] leading-3 text-gray-500 sm:text-[9px]" aria-hidden="true">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-px border-t border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Population', insight.meta.population],
          ['Coverage', `${insight.meta.coverage}%`],
          ['Freshness', insight.meta.freshness],
          ['As of', insight.meta.asOf],
          ['Owner', insight.decisionOwner],
          ['Event', insight.trace.event],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#090909] px-4 py-2.5">
            <div className="text-[7px] font-mono uppercase tracking-wider text-gray-700">{label}</div>
            <div className="mt-1 truncate text-[9px] text-gray-400" title={value}>{value}</div>
          </div>
        ))}
      </div>
      <div className="hidden">
        <span className="flex items-center gap-2 font-mono uppercase tracking-wider"><Database size={12} /> Demonstration dataset · not live operational data</span>
        <span className="text-amber-100/50">{insight.source}</span>
      </div>
      <details className="group border-t border-white/[0.06]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-[9px] font-mono uppercase tracking-wider text-gray-600 transition hover:text-gray-300">
          <span className="flex items-center gap-2"><Database size={11} /> Metric and source definition</span>
          <ArrowRight size={11} className="text-vertical-accent transition group-open:rotate-90" />
        </summary>
        <div className="grid gap-3 border-t border-white/[0.05] bg-black/20 px-4 py-3 text-[10px] leading-relaxed text-gray-500 md:grid-cols-3">
          <div><span className="text-gray-300">Formula:</span> {insight.formula}</div>
          <div><span className="text-gray-300">Grain:</span> {insight.grain}</div>
          <div><span className="text-gray-300">Source:</span> {insight.source}</div>
        </div>
      </details>
    </GlassPanel>
  );
};

const MetricStrip: React.FC<{ insight: ERPInsightDefinition }> = ({ insight }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {insight.metrics.map((item) => {
      const isPositive = item.tone === 'positive';
      return (
        <GlassPanel key={item.label} title={item.definition} className={`rounded-xl border-l-2 p-4 ${item.tone === 'critical' ? 'border-l-red-400' : item.tone === 'warning' ? 'border-l-amber-400' : item.tone === 'positive' ? 'border-l-emerald-400' : 'border-l-vertical-accent'}`}>
          <div className="text-[9px] font-mono uppercase tracking-wider text-gray-500">{item.label}</div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="text-xl font-medium text-white">{item.value}</div>
            <div className={`flex items-center gap-1 text-[10px] font-mono ${toneText[item.tone]}`}>
              {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {item.variance}
            </div>
          </div>
          <div className="mt-3">
            <div className="relative h-1.5 overflow-visible rounded-full bg-white/[0.06]">
              <div className={`h-full rounded-full ${item.tone === 'critical' ? 'bg-red-400/75' : item.tone === 'warning' ? 'bg-amber-400/75' : item.tone === 'positive' ? 'bg-emerald-400/75' : 'bg-vertical-accent/75'}`} style={{ width: `${item.performance}%` }} />
              <div className="absolute -top-1 h-3.5 w-px bg-white/80" style={{ left: `${item.targetPosition}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-gray-600">
              <span className="truncate">{item.comparator}</span>
              <span className="shrink-0 font-mono">target</span>
            </div>
          </div>
        </GlassPanel>
      );
    })}
  </div>
);

const FunnelView: React.FC<{
  stages: InsightDatum[];
  selected: string;
  onSelect: (value: string) => void;
  title?: string;
}> = ({ stages, selected, onSelect, title = 'Stage conversion' }) => {
  const max = Math.max(...stages.map((item) => item.value), 1);

  return (
    <GlassPanel className="rounded-xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <GitBranch size={16} className="text-vertical-accent" />
      </div>
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const width = Math.max(34, (stage.value / max) * 100);
          const previous = stages[index - 1]?.value;
          const loss = previous ? Math.round((1 - stage.value / previous) * 1000) / 10 : 0;
          return (
            <button key={stage.label} onClick={() => onSelect(stage.label)} className={selectionButton(selected === stage.label)}>
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-200">{stage.label}</span>
                  <span className="font-mono text-[10px] text-gray-400">{stage.display}{index > 0 ? ` · −${loss}% stage loss` : ''}</span>
                </div>
                <div className="h-7 overflow-hidden rounded bg-white/[0.035]">
                  <div
                    className="flex h-full items-center rounded bg-gradient-to-r from-vertical-accent/70 to-vertical-accent/25 px-3 transition-all"
                    style={{ width: `${width}%` }}
                  >
                    <span className="truncate text-[9px] font-mono uppercase tracking-wider text-black/75">{stage.detail}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
};

const RankedBars: React.FC<{
  data: InsightDatum[];
  selected: string;
  onSelect: (value: string) => void;
  diverging?: boolean;
}> = ({ data, selected, onSelect, diverging = false }) => {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);

  return (
    <div className="mt-5 space-y-2.5">
      {data.map((item) => (
        <button key={item.label} onClick={() => onSelect(item.label)} className={selectionButton(selected === item.label)}>
          <div className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-200">{item.label}</div>
                <div className="mt-1 text-[10px] text-gray-600">{item.detail}</div>
              </div>
              <div className={`shrink-0 font-mono text-xs ${toneText[item.tone || 'neutral']}`}>{item.display}</div>
            </div>
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              {diverging && <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />}
              <div
                className={`absolute h-full rounded-full ${
                  item.value < 0 ? 'right-1/2 bg-red-400/80' : diverging ? 'left-1/2 bg-emerald-400/80' : 'left-0 bg-vertical-accent/75'
                }`}
                style={{ width: `${diverging ? (Math.abs(item.value) / max) * 48 : (Math.abs(item.value) / max) * 100}%` }}
              />
              {item.comparator !== undefined && !diverging && (
                <div className="absolute top-[-2px] h-2.5 w-px bg-white/70" style={{ left: `${Math.min(100, Math.abs(item.comparator) / max * 100)}%` }} />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const MatrixView: React.FC<{
  cells: InsightMatrixCell[];
  selected: string;
  onSelect: (value: string) => void;
  title: string;
  higherIsBetter?: boolean;
}> = ({ cells, selected, onSelect, title, higherIsBetter = true }) => {
  const rows = [...new Set(cells.map((cell) => cell.row))];
  const columns = [...new Set(cells.map((cell) => cell.column))];

  const cellTone = (value: number) => {
    const effectiveValue = higherIsBetter ? value : 100 - value;
    if (effectiveValue >= 90) return 'border-emerald-400/20 bg-emerald-400/20 text-emerald-200';
    if (effectiveValue >= 70) return 'border-blue-400/20 bg-blue-400/15 text-blue-200';
    if (effectiveValue >= 50) return 'border-amber-400/20 bg-amber-400/15 text-amber-200';
    return 'border-red-400/25 bg-red-400/15 text-red-200';
  };

  return (
    <GlassPanel className="rounded-xl p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <BarChart3 size={16} className="text-vertical-accent" />
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[480px] gap-2" style={{ gridTemplateColumns: `120px repeat(${columns.length}, minmax(110px, 1fr))` }}>
          <div />
          {columns.map((column) => <div key={column} className="px-2 pb-1 text-center text-[8px] font-mono uppercase tracking-wider text-gray-600">{column}</div>)}
          {rows.map((row) => (
            <React.Fragment key={row}>
              <div className="flex items-center text-[10px] text-gray-400">{row}</div>
              {columns.map((column) => {
                const cell = cells.find((candidate) => candidate.row === row && candidate.column === column);
                const key = `${row} · ${column}`;
                return cell ? (
                  <button
                    key={column}
                    onClick={() => onSelect(key)}
                    title={cell.detail}
                    className={`min-h-16 rounded-lg border p-2 text-center transition focus:outline-none focus:ring-2 focus:ring-vertical-accent ${cellTone(cell.value)} ${selected === key ? 'ring-2 ring-vertical-accent' : ''}`}
                  >
                    <div className="font-mono text-sm">{cell.display}</div>
                    <div className="mt-1 line-clamp-2 text-[8px] opacity-65">{cell.detail}</div>
                  </button>
                ) : <div key={column} className="min-h-16 rounded-lg border border-white/[0.04] bg-black/10" />;
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
};

const FinanceBridge: React.FC<{
  data: InsightDatum[];
  selected: string;
  onSelect: (value: string) => void;
}> = ({ data, selected, onSelect }) => {
  const drivers = data.slice(1, -1);
  return (
    <GlassPanel className="rounded-xl p-5">
      <div className="mb-5">
        <h3 className="text-sm font-medium text-white">Cash variance bridge</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_1fr]">
        {[data[0], undefined, data[data.length - 1]].map((item, index) => item ? (
          <button key={item.label} onClick={() => onSelect(item.label)} className={`${selectionButton(selected === item.label)} p-4 text-center`}>
            <div className="text-[9px] font-mono uppercase tracking-wider text-gray-500">{item.label}</div>
            <div className={`mt-2 text-lg ${index === 2 ? 'text-red-300' : 'text-white'}`}>{item.display}</div>
            <div className="mt-2 text-[9px] text-gray-600">{item.detail}</div>
          </button>
        ) : (
          <div key="drivers" className="space-y-2">
            {drivers.map((driver) => (
              <button key={driver.label} onClick={() => onSelect(driver.label)} className={`${selectionButton(selected === driver.label)} p-3`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-gray-300">{driver.label}</span>
                  <span className={`font-mono text-[10px] ${driver.value < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{driver.display}</span>
                </div>
                <div className="mt-2 flex h-1.5 justify-center rounded-full bg-white/[0.04]">
                  <div className={`h-full rounded-full ${driver.value < 0 ? 'bg-red-400/70' : 'bg-emerald-400/70'}`} style={{ width: `${Math.min(100, Math.abs(driver.value) / 2)}%` }} />
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};

const PrimaryView: React.FC<DecisionInsightDashboardProps> = ({ insight, selected, onSelect }) => {
  if (insight.family === 'finance') {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <FinanceBridge data={insight.breakdown} selected={selected} onSelect={onSelect} />
        <FunnelView stages={insight.stages} selected={selected} onSelect={onSelect} title="Receivables ageing" />
      </div>
    );
  }

  if (insight.family === 'commerce' || insight.family === 'operations' || insight.family === 'logistics') {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <FunnelView stages={insight.stages} selected={selected} onSelect={onSelect} title={insight.primaryTitle} />
        <GlassPanel className="rounded-xl p-5">
          <h3 className="text-sm font-medium text-white">{insight.family === 'commerce' ? 'Recoverable loss reasons' : insight.family === 'logistics' ? 'Corridor pressure' : 'Constraint load versus capacity'}</h3>
          <RankedBars data={insight.breakdown} selected={selected} onSelect={onSelect} />
        </GlassPanel>
      </div>
    );
  }

  if (insight.family === 'inventory') {
    return (
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="rounded-xl p-5">
          <h3 className="text-sm font-medium text-white">{insight.primaryTitle}</h3>
          <RankedBars data={insight.breakdown} selected={selected} onSelect={onSelect} />
        </GlassPanel>
        <MatrixView cells={insight.matrix} selected={selected} onSelect={onSelect} title="Availability × demand matrix" />
      </div>
    );
  }

  if (insight.family === 'workforce') {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <MatrixView cells={insight.matrix} selected={selected} onSelect={onSelect} title={insight.primaryTitle} />
        <GlassPanel className="rounded-xl p-5">
          <h3 className="text-sm font-medium text-white">Regional coverage</h3>
          <RankedBars data={insight.breakdown} selected={selected} onSelect={onSelect} />
        </GlassPanel>
      </div>
    );
  }

  if (insight.family === 'risk') {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <MatrixView cells={insight.matrix} selected={selected} onSelect={onSelect} title={insight.primaryTitle} higherIsBetter={false} />
        <GlassPanel className="rounded-xl p-5">
          <h3 className="text-sm font-medium text-white">Exposure by control domain</h3>
          <RankedBars data={insight.breakdown} selected={selected} onSelect={onSelect} />
        </GlassPanel>
      </div>
    );
  }

  if (insight.family === 'product') {
    return (
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="rounded-xl p-5">
          <h3 className="text-sm font-medium text-white">{insight.primaryTitle}</h3>
          <RankedBars data={insight.breakdown} selected={selected} onSelect={onSelect} />
        </GlassPanel>
        <MatrixView cells={insight.matrix} selected={selected} onSelect={onSelect} title="Release × journey quality" />
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <GlassPanel className="rounded-xl p-5">
        <h3 className="text-sm font-medium text-white">{insight.primaryTitle}</h3>
        <RankedBars data={insight.breakdown} selected={selected} onSelect={onSelect} />
      </GlassPanel>
      <div className="space-y-5">
        <FunnelView stages={insight.stages} selected={selected} onSelect={onSelect} title="Cross-ERP outcome flow" />
        <MatrixView cells={insight.matrix} selected={selected} onSelect={onSelect} title="Constraint concentration" higherIsBetter={false} />
      </div>
    </div>
  );
};

const ExceptionsTable: React.FC<{
  insight: ERPInsightDefinition;
  selected: string;
  onSelect: (value: string) => void;
}> = ({ insight, selected, onSelect }) => {
  const normalized = selected.toLowerCase();
  const selectedTokens = normalized
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 4)
    .map((token) => token.slice(0, 5));
  const matching = insight.exceptions.filter((item) =>
    !selected
    || item.segment.toLowerCase().includes(normalized)
    || item.subject.toLowerCase().includes(normalized)
    || selectedTokens.some((token) => `${item.subject} ${item.segment} ${item.nextAction}`.toLowerCase().includes(token))
    || normalized.split(' · ').some((term) => term.length > 2 && item.segment.toLowerCase().includes(term)),
  );
  const records = matching.length > 0 ? matching : insight.exceptions;

  return (
    <GlassPanel className="overflow-hidden rounded-xl">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white">Decision queue</h3>
            <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-[8px] uppercase text-gray-500">{records.length} records</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-gray-600">
          {insight.drillHierarchy.map((level, index) => (
            <React.Fragment key={level}>
              <span className={index === insight.drillHierarchy.length - 1 ? 'text-vertical-accent' : ''}>{level}</span>
              {index < insight.drillHierarchy.length - 1 && <ArrowRight size={9} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selected && (
        <div className="flex flex-col gap-3 border-b border-vertical-accent/15 bg-vertical-accent/[0.04] px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Target size={13} className="text-vertical-accent" />
            <span className="text-gray-600">All</span><ArrowRight size={10} className="text-gray-700" />
            <span className="font-medium text-white">{selected}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[8px] font-mono uppercase tracking-wider text-gray-500">
            <span className="rounded border border-white/[0.08] px-2 py-1">{records.length} linked records</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">{insight.meta.confidence}% confidence</span>
            <span className="rounded border border-white/[0.08] px-2 py-1">{insight.trace.event}</span>
            <button onClick={() => onSelect('')} className="cursor-pointer rounded border border-vertical-accent/20 px-2 py-1 text-vertical-accent transition hover:bg-vertical-accent/[0.08] hover:text-white">Clear</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="bg-black/20 text-[9px] font-mono uppercase tracking-wider text-gray-600">
            <tr>
              {['Record', 'Decision subject', 'Segment', 'Owner', 'Age', 'Impact', 'Next best action', 'Status'].map((head) => (
                <th key={head} className="px-5 py-3 font-normal">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-xs">
            {records.map((record) => (
              <tr key={record.id} className="group hover:bg-white/[0.025]">
                <td className="px-5 py-3 font-mono text-vertical-accent">{record.id}</td>
                <td className="px-5 py-3 text-gray-200">{record.subject}</td>
                <td className="px-5 py-3 text-gray-500">{record.segment}</td>
                <td className="px-5 py-3 text-gray-500">{record.owner}</td>
                <td className="px-5 py-3 text-gray-500">{record.age}</td>
                <td className="px-5 py-3 text-gray-300">{record.impact}</td>
                <td className="px-5 py-3">
                  <button onClick={() => onSelect(record.subject)} className="flex items-center gap-2 text-left text-gray-300 transition group-hover:text-white">
                    {record.nextAction}<ArrowRight size={12} className="text-vertical-accent" />
                  </button>
                </td>
                <td className="px-5 py-3"><span className={`rounded border px-2 py-1 text-[8px] font-mono uppercase ${statusSurface[record.status]}`}>{record.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
};

export const DecisionInsightDashboard: React.FC<DecisionInsightDashboardProps> = ({
  insight,
  selected,
  onSelect,
  compact = false,
}) => (
  <div className="space-y-5">
    {!compact && <InsightContract insight={insight} />}
    <MetricStrip insight={insight} />
    <PrimaryView insight={insight} selected={selected} onSelect={onSelect} compact={compact} />
    <ExceptionsTable insight={insight} selected={selected} onSelect={onSelect} />
  </div>
);
