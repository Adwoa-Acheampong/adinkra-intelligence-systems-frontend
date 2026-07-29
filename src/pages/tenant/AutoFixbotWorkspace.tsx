import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  GitCompareArrows,
  ScanSearch,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  TableProperties,
  UserRoundCheck,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { AutoFixbotSnapshot, FixbotCase, FixbotRisk } from '../../contracts/autoFixbot';
import { fixtureAutoFixbotPort } from '../../data/autoFixbotFixtures';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';

type Focus =
  | { type: 'all'; label: 'All reviewed cases' }
  | { type: 'family'; value: string; label: string }
  | { type: 'confidence'; value: string; label: string }
  | { type: 'day'; value: string; label: string }
  | { type: 'stage'; value: string; label: string };

const chartTooltip = {
  contentStyle: {
    background: '#090b0b',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 8,
    fontSize: 10,
    color: '#e5e7eb',
  },
  itemStyle: { fontSize: 10 },
  labelStyle: { color: '#9ca3af', marginBottom: 5 },
};

const agreementTone: Record<FixbotCase['agreement'], string> = {
  Accepted: 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300',
  Modified: 'border-blue-400/20 bg-blue-400/[0.07] text-blue-300',
  Overridden: 'border-amber-400/20 bg-amber-400/[0.07] text-amber-200',
  Escalated: 'border-red-400/20 bg-red-400/[0.07] text-red-300',
};

const riskColor: Record<FixbotRisk, string> = {
  Low: '#5ba284',
  Medium: '#6f8fb2',
  High: '#c28f48',
  Critical: '#bb5d5d',
};

const confidenceInBin = (confidence: number, bin: string) => {
  if (bin === '<60') return confidence < 60;
  if (bin === '60–69') return confidence >= 60 && confidence < 70;
  if (bin === '70–79') return confidence >= 70 && confidence < 80;
  if (bin === '80–89') return confidence >= 80 && confidence < 90;
  return confidence >= 90;
};

const stageIncludes = (item: FixbotCase, stage: string) => {
  if (stage === 'Intake with consent') return true;
  if (stage === 'Evidence sufficient') return item.evidenceCoverage >= 75;
  if (stage === 'AI recommendation') return item.aiConfidence >= 70;
  if (stage === 'Technician accepted') return item.agreement === 'Accepted' || item.agreement === 'Modified';
  return item.agreement === 'Accepted' && item.evidenceCoverage === 100;
};

export const AutoFixbotWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [snapshot, setSnapshot] = useState<AutoFixbotSnapshot | null>(null);
  const [focus, setFocus] = useState<Focus>({ type: 'all', label: 'All reviewed cases' });
  const [selected, setSelected] = useState<FixbotCase | null>(null);

  useEffect(() => {
    let active = true;
    fixtureAutoFixbotPort.loadSnapshot({ tenantId: tenant.id, period: '7d' }).then((data) => {
      if (active) setSnapshot(data);
    });
    return () => {
      active = false;
    };
  }, [tenant.id]);

  const visibleCases = useMemo(() => {
    if (!snapshot) return [];
    if (focus.type === 'family') return snapshot.cases.filter((item) => item.faultFamily.includes(focus.value) || focus.value.includes(item.faultFamily));
    if (focus.type === 'confidence') return snapshot.cases.filter((item) => confidenceInBin(item.aiConfidence, focus.value));
    if (focus.type === 'day') return snapshot.cases.filter((item) => item.createdAt.startsWith(focus.value));
    if (focus.type === 'stage') return snapshot.cases.filter((item) => stageIncludes(item, focus.value));
    return snapshot.cases;
  }, [focus, snapshot]);

  if (!snapshot) {
    return <div className="flex min-h-[420px] items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-gray-600">Loading diagnostic intelligence…</div>;
  }

  const histogram = snapshot.confidenceDistribution.map((item) => ({
    ...item,
    cleared: item.cases - item.review,
  }));

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1640px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">
            <BrainCircuit size={13} /> {tenant.name} / Human-governed diagnostic intelligence
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.035em] text-white">FixBot decision control</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Where should a supervisor accept, challenge or escalate AI-assisted diagnostic work before it changes a quote, part issue or vehicle release?
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[8px] uppercase tracking-wider">
          <span className="rounded border border-white/[0.08] px-2 py-1 text-gray-500">7-day decision window</span>
          <span className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-2 py-1 text-emerald-300">Human approval required</span>
          <span className="rounded border border-amber-400/20 bg-amber-400/[0.05] px-2 py-1 text-amber-200">Demonstration data</span>
        </div>
      </header>

      <section aria-label="FixBot analytical basis" className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Population', '148 consented diagnostic intakes'],
          ['Grain', 'Diagnostic case × recommendation'],
          ['As of', snapshot.asOf],
          ['Source', snapshot.source],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#090b0a] px-4 py-3">
            <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-gray-700">{label}</div>
            <div className="mt-1 text-[9px] leading-4 text-gray-400">{value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <ChartFrame
          intent="Compare"
          title="Where does technician judgment diverge from FixBot?"
          detail="Grouped columns compare recommendation volume, technician acceptance and overrides by fault family."
          decision="Prioritise model review and technician calibration where acceptance falls and overrides rise."
          icon={GitCompareArrows}
        >
          <div role="img" aria-label="Grouped column chart comparing FixBot proposals, technician acceptance and overrides by fault family" className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshot.familyComparison} margin={{ top: 14, right: 8, left: -18, bottom: 22 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="family" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 9, color: '#9ca3af' }} />
                <Bar dataKey="aiProposed" name="FixBot proposed" fill="#816a42" radius={[3, 3, 0, 0]} onClick={(point) => {
                  const family = String(point.payload?.family || '');
                  if (family) setFocus({ type: 'family', value: family, label: `${family} cases` });
                }} />
                <Bar dataKey="technicianAccepted" name="Technician accepted" fill="#4f8c83" radius={[3, 3, 0, 0]} onClick={(point) => {
                  const family = String(point.payload?.family || '');
                  if (family) setFocus({ type: 'family', value: family, label: `${family} cases` });
                }} />
                <Bar dataKey="overridden" name="Overridden" fill="#a85e55" radius={[3, 3, 0, 0]} onClick={(point) => {
                  const family = String(point.payload?.family || '');
                  if (family) setFocus({ type: 'family', value: family, label: `${family} cases` });
                }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame
          intent="Composition"
          title="What diagnostic work is FixBot seeing?"
          detail="A donut is used because six stable fault families compose one review population."
          decision="Compare model coverage and specialist capacity with the actual case mix."
          icon={CircleDot}
        >
          <div role="img" aria-label="Donut chart showing FixBot diagnostic case composition" className="relative h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={snapshot.caseMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="76%"
                  paddingAngle={2}
                  onClick={(point) => setFocus({ type: 'family', value: String(point.name).replace(' & chassis', ''), label: `${point.name} cases` })}
                >
                  {snapshot.caseMix.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip {...chartTooltip} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-x-0 top-[42%] text-center">
              <div className="font-display text-2xl font-semibold text-white">148</div>
              <div className="font-mono text-[7px] uppercase tracking-wider text-gray-600">reviewed intakes</div>
            </div>
          </div>
        </ChartFrame>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          intent="Relationship"
          title="Does confidence translate into faster diagnosis?"
          detail="Each bubble is a case: confidence on x, diagnostic minutes on y, avoided workshop hours in bubble size."
          decision="Investigate high-confidence slow cases and low-confidence high-risk cases; association is not causation."
          icon={ScanSearch}
        >
          <div role="img" aria-label="Bubble scatter plot of FixBot confidence, diagnostic time and hours avoided" className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 16, bottom: 14, left: -8 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" />
                <XAxis type="number" dataKey="aiConfidence" name="FixBot confidence" unit="%" domain={[60, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="diagnosticMinutes" name="Diagnostic time" unit=" min" domain={[0, 90]} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="avoidedHours" name="Hours avoided" range={[70, 520]} />
                <ReferenceLine x={85} stroke="rgba(217,168,78,.45)" strokeDasharray="4 4" />
                <ReferenceLine y={55} stroke="rgba(255,255,255,.18)" strokeDasharray="4 4" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} {...chartTooltip} />
                <Scatter data={snapshot.cases} onClick={(point) => {
                  if (point.payload) setSelected(point.payload as FixbotCase);
                }}>
                  {snapshot.cases.map((item) => <Cell key={item.id} fill={riskColor[item.risk]} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame
          intent="Trend"
          title="Is agreement improving without harming first-pass quality?"
          detail="The line shows human agreement; the area preserves the quality context that prevents optimisation for agreement alone."
          decision="Investigate drift when agreement falls below 82% or first-pass quality weakens."
          icon={Activity}
        >
          <div role="img" aria-label="Line and area chart comparing FixBot agreement and first-pass quality over seven days" className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.trend} margin={{ top: 12, right: 16, bottom: 8, left: -12 }} onClick={(state) => {
                const value = state?.activeLabel;
                if (value) setFocus({ type: 'day', value: String(value), label: `${value} cases` });
              }}>
                <defs>
                  <linearGradient id="qualityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f8c83" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#4f8c83" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} unit="%" />
                <ReferenceLine y={82} stroke="#a85e55" strokeDasharray="4 4" />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Area type="monotone" dataKey="firstPass" name="First-pass quality" stroke="#4f8c83" fill="url(#qualityFill)" strokeWidth={1.5} />
                <Line type="monotone" dataKey="aiAgreement" name="Human agreement" stroke="#d3a651" strokeWidth={2} dot={{ r: 3, fill: '#d3a651' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ChartFrame
          intent="Flow"
          title="Where does diagnostic work leave the controlled path?"
          detail="The funnel is valid here because every case progresses through the same ordered stages."
          decision="Reduce evidence and acceptance loss before a diagnostic recommendation reaches vehicle release."
          icon={SlidersHorizontal}
        >
          <div role="img" aria-label="Sequential funnel from consented intake to first-pass release" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip {...chartTooltip} />
                <Funnel
                  dataKey="value"
                  data={snapshot.funnel}
                  isAnimationActive={false}
                  onClick={(point) => setFocus({ type: 'stage', value: String(point.name), label: `${point.name} cases` })}
                >
                  <LabelList position="right" fill="#9ca3af" stroke="none" dataKey="name" fontSize={9} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>

        <ChartFrame
          intent="Distribution"
          title="Where is diagnostic confidence concentrated?"
          detail="The histogram shows the full confidence population and the review subset inside each contiguous bin."
          decision="Set review thresholds from the observed distribution instead of an arbitrary average."
          icon={Sparkles}
        >
          <div role="img" aria-label="Stacked histogram of FixBot confidence with review cases highlighted" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogram} barCategoryGap={2} margin={{ top: 12, right: 12, bottom: 8, left: -18 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="bin" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="cleared" name="No review required" stackId="confidence" fill="#4f8c83" onClick={(point) => {
                  const bin = String(point.payload?.bin || '');
                  if (bin) setFocus({ type: 'confidence', value: bin, label: `${bin}% confidence` });
                }} />
                <Bar dataKey="review" name="Review required" stackId="confidence" fill="#b46c54" radius={[3, 3, 0, 0]} onClick={(point) => {
                  const bin = String(point.payload?.bin || '');
                  if (bin) setFocus({ type: 'confidence', value: bin, label: `${bin}% confidence` });
                }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </section>

      <GlassPanel className="overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-vertical-accent"><TableProperties size={12} /> Investigation</div>
            <h2 className="mt-2 text-sm font-medium text-white">Evidence-bearing case queue</h2>
            <p className="mt-1 text-[10px] text-gray-500">The charts filter this record grain; the table and drawer remain the accessible evidence alternative.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-white/[0.08] bg-black/20 px-2.5 py-1.5 font-mono text-[8px] text-gray-400">{focus.label} · {visibleCases.length}</span>
            {focus.type !== 'all' && (
              <button onClick={() => setFocus({ type: 'all', label: 'All reviewed cases' })} className="rounded border border-white/[0.08] px-2.5 py-1.5 font-mono text-[8px] uppercase text-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent">Clear</button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-black/20 font-mono text-[8px] uppercase tracking-wider text-gray-600">
              <tr>
                {['Case', 'Vehicle', 'Fault family', 'AI / technician', 'Time vs benchmark', 'Agreement', 'Risk', 'Evidence', 'Decision'].map((head) => <th key={head} className="px-5 py-3 font-normal">{head}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {visibleCases.map((item) => (
                <tr key={item.id} className="transition hover:bg-white/[0.025]">
                  <td className="px-5 py-3"><button onClick={() => setSelected(item)} className="font-mono text-vertical-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent">{item.id}</button><div className="mt-1 font-mono text-[8px] text-gray-700">{item.jobCardId}</div></td>
                  <td className="px-5 py-3"><div className="text-gray-200">{item.vehicle}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{item.registration}</div></td>
                  <td className="px-5 py-3 text-gray-400">{item.faultFamily}</td>
                  <td className="px-5 py-3"><div className="font-mono text-gray-200">{item.aiConfidence}% / {item.technicianConfidence}%</div><div className="mt-1 text-[8px] text-gray-600">confidence</div></td>
                  <td className="px-5 py-3"><div className={item.diagnosticMinutes > item.benchmarkMinutes ? 'text-red-300' : 'text-emerald-300'}>{item.diagnosticMinutes} / {item.benchmarkMinutes} min</div><div className="mt-1 text-[8px] text-gray-600">{item.avoidedHours.toFixed(1)} hr avoided</div></td>
                  <td className="px-5 py-3"><span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${agreementTone[item.agreement]}`}>{item.agreement}</span></td>
                  <td className="px-5 py-3"><span className="flex items-center gap-2 text-gray-300"><span className="h-2 w-2 rounded-full" style={{ background: riskColor[item.risk] }} />{item.risk}</span></td>
                  <td className="px-5 py-3 text-gray-400">{item.evidenceCoverage}%</td>
                  <td className="max-w-72 px-5 py-3"><button onClick={() => setSelected(item)} className="flex items-center gap-2 text-left text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><span className="line-clamp-2">{item.nextDecision}</span><ArrowRight size={12} className="shrink-0 text-vertical-accent" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {createPortal(
        <AnimatePresence>
          {selected && <FixbotCaseDrawer item={selected} onClose={() => setSelected(null)} />}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
};

const ChartFrame = ({
  intent,
  title,
  detail,
  decision,
  icon: Icon,
  children,
}: {
  intent: string;
  title: string;
  detail: string;
  decision: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <GlassPanel className="overflow-hidden rounded-xl">
    <div className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-vertical-accent/20 bg-vertical-accent/[0.06] text-vertical-accent"><Icon size={15} /></div>
      <div className="min-w-0">
        <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-vertical-accent">{intent}</div>
        <h2 className="mt-1 text-sm font-medium text-white">{title}</h2>
        <p className="mt-1 text-[10px] leading-4 text-gray-500">{detail}</p>
      </div>
    </div>
    <div className="p-4">{children}</div>
    <div className="flex items-start gap-2 border-t border-white/[0.06] bg-black/20 px-4 py-3 text-[9px] leading-4 text-gray-500">
      <UserRoundCheck size={12} className="mt-0.5 shrink-0 text-vertical-accent" />
      <span><strong className="font-medium text-gray-300">Decision:</strong> {decision}</span>
    </div>
  </GlassPanel>
);

const FixbotCaseDrawer = ({ item, onClose }: { item: FixbotCase; onClose: () => void }) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <motion.aside
        initial={{ x: 620 }}
        animate={{ x: 0 }}
        exit={{ x: 620 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fixbot-case-title"
        onClick={(event) => event.stopPropagation()}
        className="custom-scrollbar h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#080a09] p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-vertical-accent">{item.id} · {item.jobCardId}</div>
            <h2 id="fixbot-case-title" className="mt-2 text-xl font-medium text-white">{item.vehicle}</h2>
            <p className="mt-1 text-xs text-gray-500">{item.registration} · {item.faultFamily} · {item.owner}</p>
          </div>
          <button onClick={onClose} aria-label="Close FixBot case" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-vertical-accent"><X size={17} /></button>
        </div>

        <section className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
          <div className="bg-[#0a0c0b] p-4">
            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-vertical-accent"><Bot size={12} /> FixBot recommendation · {item.aiConfidence}%</div>
            <p className="mt-3 text-xs leading-5 text-gray-300">{item.recommendation}</p>
          </div>
          <div className="bg-[#0a0c0b] p-4">
            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-emerald-300"><UserRoundCheck size={12} /> Technician finding · {item.technicianConfidence}%</div>
            <p className="mt-3 text-xs leading-5 text-gray-300">{item.technicianFinding}</p>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${agreementTone[item.agreement]}`}>{item.agreement}</span>
          <span className="flex items-center gap-2 rounded border border-white/[0.08] px-2 py-1 text-[9px] text-gray-400"><span className="h-2 w-2 rounded-full" style={{ background: riskColor[item.risk] }} /> {item.risk} risk</span>
          <span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-gray-400">{item.diagnosticMinutes} min vs {item.benchmarkMinutes} benchmark</span>
        </div>

        <section className="mt-6">
          <div className="flex items-center gap-2"><ShieldAlert size={14} className="text-vertical-accent" /><h3 className="text-sm font-medium text-white">Original evidence</h3></div>
          <div className="mt-3 space-y-2">
            {item.evidence.map((evidence, index) => (
              <div key={evidence.id} className="grid gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] font-mono text-[8px] text-gray-500">{index + 1}</div>
                <div><div className="text-xs text-gray-200">{evidence.label}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{evidence.id} · {evidence.kind.replace(/_/g, ' ')}{evidence.capturedAt ? ` · ${evidence.capturedAt}` : ''}</div></div>
                <span className={`rounded border px-2 py-1 font-mono text-[8px] uppercase ${evidence.state === 'Accepted' ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300' : evidence.state === 'Review' ? 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200' : 'border-red-400/20 bg-red-400/[0.06] text-red-300'}`}>{evidence.state}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 rounded-xl border border-vertical-accent/20 bg-vertical-accent/[0.05] p-4">
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-vertical-accent"><CheckCircle2 size={12} /> Next controlled decision</div>
          <div className="mt-2 text-xs leading-5 text-white">{item.nextDecision}</div>
        </div>
      </motion.aside>
    </motion.div>
  );
};
