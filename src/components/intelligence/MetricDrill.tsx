import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  Ban,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  Database,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { MetricContributor, RegisteredMetric } from '../../intelligence/contracts';

interface MetricDrillProps {
  metric: RegisteredMetric;
}

const statusClass: Record<MetricContributor['status'], string> = {
  accepted: 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300',
  review: 'border-amber-400/25 bg-amber-400/[0.07] text-amber-200',
  excluded: 'border-red-400/25 bg-red-400/[0.07] text-red-300',
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(value));

export const MetricDrill: React.FC<MetricDrillProps> = ({ metric }) => {
  const [contributorId, setContributorId] = useState(metric.observation.contributors[0]?.id ?? '');

  useEffect(() => {
    setContributorId(metric.observation.contributors[0]?.id ?? '');
  }, [metric.definition.id, metric.observation.contributors]);

  const contributor = useMemo(
    () => metric.observation.contributors.find((item) => item.id === contributorId) ?? metric.observation.contributors[0],
    [contributorId, metric.observation.contributors],
  );

  if (!contributor) return null;

  const evidence = contributor.sourceEvent.evidence[0];

  return (
    <div className="evidence-ledger overflow-hidden rounded-2xl border border-white/[0.09] bg-[#080b0a]">
      <div className="grid border-b border-white/[0.07] xl:grid-cols-[1.15fr_0.85fr]">
        <section className="p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-vertical-accent/25 bg-vertical-accent/[0.08] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-vertical-accent">
              Registered claim
            </span>
            <span className="font-mono text-[9px] text-gray-600">{metric.definition.id}</span>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-gray-400">{metric.definition.question}</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-gray-600">{metric.definition.name}</div>
              <div className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
                {metric.observation.displayValue}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] text-right">
              <div className="bg-[#0a0d0c] px-3 py-2">
                <div className="font-mono text-[7px] uppercase tracking-wider text-gray-600">Comparator</div>
                <div className="mt-1 text-[10px] text-gray-300">{metric.observation.comparator}</div>
              </div>
              <div className="bg-[#0a0d0c] px-3 py-2">
                <div className="font-mono text-[7px] uppercase tracking-wider text-gray-600">Variance</div>
                <div className="mt-1 text-[10px] text-amber-200">{metric.observation.variance}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.07] bg-white/[0.018] p-5 xl:border-l xl:border-t-0">
          <div className="grid h-full content-center gap-3 sm:grid-cols-2">
            {[
              ['As of', formatTime(metric.observation.asOf), CalendarClock],
              ['Scope', metric.observation.scope.name, MapPin],
              ['Confidence', `${metric.observation.confidence}% · ${metric.observation.confidenceBand}`, ShieldCheck],
              ['Coverage', `${metric.observation.coverage}% · ${metric.observation.excludedCount} excluded`, Database],
            ].map(([label, value, Icon]) => {
              const IconComponent = Icon as React.ElementType;
              return (
                <div key={String(label)} className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
                  <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.16em] text-gray-600">
                    <IconComponent size={11} /> {String(label)}
                  </div>
                  <div className="mt-2 text-[10px] text-gray-300">{String(value)}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid xl:grid-cols-[0.86fr_1.14fr]">
        <section className="border-b border-white/[0.07] p-4 md:p-5 xl:border-b-0 xl:border-r">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-gray-600">Contributing records</div>
              <div className="mt-1 text-xs text-gray-300">Select a tenant contribution to inspect its proof.</div>
            </div>
            <span className="rounded-full border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-gray-500">
              {metric.observation.includedCount} included
            </span>
          </div>
          <div className="space-y-1.5">
            {metric.observation.contributors.map((item) => {
              const selected = item.id === contributor.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setContributorId(item.id)}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-lg border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-vertical-accent ${
                    selected
                      ? 'border-vertical-accent/40 bg-vertical-accent/[0.08]'
                      : 'border-white/[0.06] bg-black/20 hover:border-white/[0.14] hover:bg-white/[0.025]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-medium text-gray-200">{item.label}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[8px] text-gray-600">{item.scope[item.scope.length - 2]?.name}</span>
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[7px] uppercase ${statusClass[item.status]}`}>{item.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[10px] text-white">{item.displayValue}</div>
                    <div className="mt-1 font-mono text-[8px] text-gray-600">{item.share.toFixed(1)}% share</div>
                  </div>
                </button>
              );
            })}
          </div>
          <details className="mt-3 rounded-lg border border-white/[0.06] bg-black/20">
            <summary className="cursor-pointer list-none px-3 py-2.5 font-mono text-[8px] uppercase tracking-wider text-gray-500">
              {metric.observation.excludedCount} excluded records and rules
            </summary>
            <div className="border-t border-white/[0.06] px-3 py-3">
              {metric.definition.exclusionRules.map((rule) => (
                <div key={rule} className="flex gap-2 py-1 text-[10px] leading-4 text-gray-500">
                  <Ban size={11} className="mt-0.5 shrink-0 text-red-300/70" /> {rule}
                </div>
              ))}
            </div>
          </details>
        </section>

        <section className="relative p-4 md:p-6">
          <div className="absolute bottom-6 left-[33px] top-[30px] w-px bg-gradient-to-b from-vertical-accent/70 via-white/15 to-emerald-400/40" aria-hidden="true" />
          <div className="mb-5 pl-11">
            <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-vertical-accent">Evidence spine</div>
            <div className="mt-1 text-xs text-gray-400">Claim → record → event → original evidence</div>
          </div>

          <div className="space-y-3">
            <EvidenceStep icon={CircleDot} label="Claim contribution" index="01">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-medium text-white">{contributor.label}</div>
                  <div className="mt-1 text-[10px] leading-4 text-gray-500">{contributor.reason}</div>
                </div>
                <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[8px] uppercase ${statusClass[contributor.status]}`}>{contributor.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1 text-[9px] text-gray-500">
                {contributor.scope.map((scope, index) => (
                  <React.Fragment key={`${scope.level}:${scope.id}`}>
                    {index > 0 && <ChevronRight size={10} className="text-gray-700" />}
                    <span>{scope.name}</span>
                  </React.Fragment>
                ))}
              </div>
            </EvidenceStep>

            <EvidenceStep icon={Database} label="Source record" index="02">
              <div className="grid gap-3 sm:grid-cols-2">
                <LabeledValue label="Record ID" value={contributor.sourceEvent.sourceRecordId} mono />
                <LabeledValue label="Source surface" value={contributor.sourceEvent.sourceSurface} />
              </div>
            </EvidenceStep>

            <EvidenceStep icon={Fingerprint} label="Accepted event" index="03">
              <div className="grid gap-3 sm:grid-cols-2">
                <LabeledValue label="Event" value={contributor.sourceEvent.type} mono />
                <LabeledValue label="Event ID" value={contributor.sourceEvent.id} mono />
                <LabeledValue label="Occurred" value={formatTime(contributor.sourceEvent.occurredAt)} />
                <LabeledValue label="Recorded" value={formatTime(contributor.sourceEvent.recordedAt)} />
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
                <UserRound size={12} /> {contributor.sourceEvent.actor}
              </div>
            </EvidenceStep>

            <EvidenceStep icon={FileCheck2} label="Original evidence" index="04" final>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-medium text-white">{evidence.title}</div>
                  <div className="mt-1 text-[10px] leading-4 text-gray-500">{evidence.note}</div>
                </div>
                <span className={`shrink-0 rounded border px-2 py-1 font-mono text-[8px] uppercase ${evidence.status === 'accepted' ? statusClass.accepted : statusClass.review}`}>
                  {evidence.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <LabeledValue label="Evidence ID" value={evidence.id} mono />
                <LabeledValue label="Captured" value={formatTime(evidence.capturedAt)} />
                <LabeledValue label="Captured by" value={evidence.capturedBy} />
                <LabeledValue label="Location" value={evidence.location} />
              </div>
              <div className="mt-3 flex items-center gap-2 rounded border border-white/[0.06] bg-black/30 px-3 py-2 font-mono text-[8px] text-gray-600">
                <LockKeyhole size={11} /> {evidence.digest}
              </div>
            </EvidenceStep>
          </div>
        </section>
      </div>

      <div className="grid gap-px border-t border-white/[0.07] bg-white/[0.07] md:grid-cols-4">
        {[
          ['Definition', metric.definition.formula],
          ['Grain', metric.definition.grain],
          ['Freshness target', metric.definition.freshnessTarget],
          ['Decision', metric.definition.action],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#080b0a] p-4">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-gray-600">{label}</div>
            <div className="mt-2 text-[10px] leading-4 text-gray-400">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EvidenceStep: React.FC<{
  icon: React.ElementType;
  label: string;
  index: string;
  final?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, label, index, final, children }) => (
  <div className="relative pl-11">
    <div className={`absolute left-[15px] top-3 z-[1] flex h-9 w-9 items-center justify-center rounded-full border bg-[#080b0a] ${final ? 'border-emerald-400/35 text-emerald-300' : 'border-vertical-accent/30 text-vertical-accent'}`}>
      {final ? <Check size={15} /> : <Icon size={14} />}
    </div>
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
        <span className="font-mono text-[8px] text-gray-700">{index}</span>
        <ArrowDown size={10} className="text-gray-700" />
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-gray-500">{label}</span>
      </div>
      {children}
    </div>
  </div>
);

const LabeledValue: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-gray-700">{label}</div>
    <div className={`mt-1 break-words text-[10px] text-gray-400 ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);
