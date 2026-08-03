import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  CircleDollarSign,
  Pause,
  Play,
  Plus,
  Repeat2,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { aglCustomerWorkflow, type SubscriptionEnrollmentInput, type SubscriptionPlanInput } from '../../erp/agl/customerWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

export const AglSubscriptionsWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [revision, setRevision] = useState(0);
  const [planOpen, setPlanOpen] = useState(false);
  const [enrolmentOpen, setEnrolmentOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const plans = useMemo(() => aglCustomerWorkflow.subscriptionPlans(), [revision]);
  const subscriptions = useMemo(() => aglCustomerWorkflow.subscriptions(), [revision]);
  const customers = useMemo(() => aglCustomerWorkflow.customers(), [revision]);
  const vehicles = useMemo(() => aglCustomerWorkflow.vehicles(), [revision]);
  const active = subscriptions.filter((item) => item.status === 'Active');
  const mrr = active.reduce((sum, item) => sum + monthlyEquivalent(item), 0);
  const dueSoon = active.filter((item) => {
    const when = new Date(String(item.nextBillingDate ?? item.endDate ?? ''));
    const distance = when.getTime() - Date.now();
    return !Number.isNaN(when.getTime()) && distance >= 0 && distance <= 30 * 86400000;
  });
  const filtered = subscriptions.filter((item) => {
    const matchesStatus = status === 'All' || item.status === status;
    const matchesQuery = !query.trim() || JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      operation();
      setNotice(confirmation);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The subscription operation could not be completed.');
      return false;
    }
  };

  const moveStatus = (recordId: string, nextStatus: string) => run(() => {
    aglErpRepository.changeStatus({
      moduleId: 'subscriptions',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      status: nextStatus,
      values: { statusChangedAt: new Date().toISOString() },
    });
  }, `${recordId} moved to ${nextStatus}.`);

  return (
    <div className="mx-auto max-w-[1700px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><Repeat2 size={13} /> {tenant.id.toUpperCase()} ERP / SALES / SUBSCRIPTIONS</div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Service subscriptions</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Create reusable service plans, enrol a customer and vehicle, control renewals, and preserve every recurring-revenue state change.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setEnrolmentOpen(true)} disabled={!plans.some((plan) => plan.status === 'Active')} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-35"><UserPlus size={14} /> Subscribe customer</button>
          <button onClick={() => setPlanOpen(true)} className="flex min-h-11 items-center gap-2 rounded-lg bg-cyan-300 px-5 text-xs font-semibold text-black"><Plus size={14} /> Create plan</button>
        </div>
      </header>

      {(notice || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-300/20 bg-red-300/[0.05] text-red-200' : 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200'}`}><span className="flex items-center gap-2">{error ? <X size={14} /> : <Check size={14} />}{error || notice}</span><button onClick={() => { setNotice(''); setError(''); }} aria-label="Dismiss"><X size={13} /></button></div>}

      <section aria-label="Subscription summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<UsersRound size={15} />} label="Active subscribers" value={active.length.toLocaleString()} detail={`${subscriptions.length} total enrolments`} />
        <Metric icon={<CircleDollarSign size={15} />} label="Monthly recurring revenue" value={money.format(mrr)} detail="Active plans, normalized to monthly" />
        <Metric icon={<Repeat2 size={15} />} label="Annual run rate" value={money.format(mrr * 12)} detail="Current active portfolio" />
        <Metric icon={<CalendarClock size={15} />} label="Billing due in 30 days" value={dueSoon.length.toLocaleString()} detail="Renewal action queue" warning={dueSoon.length > 0} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm text-white">Plan catalogue</h2><p className="mt-1 text-[9px] text-gray-600">Reusable products; prices are not copied from the AGL prototype dataset.</p></div><span className="font-mono text-[8px] uppercase text-gray-600">{plans.filter((plan) => plan.status === 'Active').length} open for enrolment</span></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => <article key={plan.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
            <div className="flex items-start justify-between gap-4"><div><div className="font-mono text-[8px] text-cyan-300">{plan.reference ?? plan.id}</div><h3 className="mt-2 text-base text-white">{String(plan.name)}</h3></div><Status value={plan.status} /></div>
            <div className="mt-5 flex items-baseline gap-2"><strong className="text-2xl font-display text-white">{money.format(Number(plan.monthlyPrice ?? plan.amount ?? 0))}</strong><span className="text-[9px] text-gray-600">/ month</span></div>
            <div className="mt-1 text-[9px] text-gray-600">{money.format(Number(plan.yearlyPrice ?? 0))} / year</div>
            <ul className="mt-5 space-y-2 border-t border-white/[0.07] pt-4">{parseBenefits(plan.benefits).map((benefit) => <li key={benefit} className="flex gap-2 text-[10px] leading-4 text-gray-400"><ShieldCheck size={12} className="mt-0.5 shrink-0 text-emerald-300" />{benefit}</li>)}</ul>
          </article>)}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm text-white">Subscription ledger</h2><p className="mt-1 text-[9px] text-gray-600">Customer, vehicle, billing, renewal, owner, and lifecycle in one retained row.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, vehicle or plan…" className="h-10 min-w-[260px] rounded-lg border border-white/[0.08] bg-black/25 pl-9 pr-3 text-[10px] text-white" /></label>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#050505] px-3 text-[10px] text-white"><option>All</option><option>Active</option><option>Paused</option><option>Cancelled</option><option>Expired</option></select>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#090909]">
          <table className="w-full min-w-[1180px] text-left text-[10px]">
            <thead className="border-b border-white/[0.08] bg-black/30 text-gray-600"><tr>{['Plan / enrolment', 'Customer', 'Vehicle', 'Monthly', 'Coverage', 'Next bill', 'Auto-renew', 'Owner', 'State', 'Action'].map((head) => <th key={head} className="px-4 py-3 font-normal uppercase tracking-wider">{head}</th>)}</tr></thead>
            <tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-white/[0.06] text-gray-300">
              <td className="px-4 py-4"><strong className="block text-white">{String(item.plan ?? item.name)}</strong><span className="font-mono text-[8px] text-cyan-300/70">{item.id}</span></td>
              <td className="px-4 py-4">{String(item.customer ?? '—')}</td><td className="px-4 py-4">{String(item.reference ?? item.vehicle ?? '—')}</td><td className="px-4 py-4 text-white">{money.format(monthlyEquivalent(item))}</td>
              <td className="px-4 py-4">{String(item.startDate ?? '—')} → {String(item.endDate ?? 'open')}</td><td className="px-4 py-4">{String(item.nextBillingDate ?? '—')}</td><td className="px-4 py-4">{item.autoRenew === false ? 'Off' : 'On'}</td><td className="px-4 py-4">{String(item.owner ?? '—')}</td><td className="px-4 py-4"><Status value={item.status} /></td>
              <td className="px-4 py-4"><div className="flex gap-1">{item.status === 'Active' ? <button onClick={() => moveStatus(item.id, 'Paused')} className="flex items-center gap-1 rounded border border-amber-300/20 px-2 py-1 text-[8px] text-amber-200"><Pause size={9} /> Pause</button> : item.status === 'Paused' ? <button onClick={() => moveStatus(item.id, 'Active')} className="flex items-center gap-1 rounded border border-emerald-300/20 px-2 py-1 text-[8px] text-emerald-200"><Play size={9} /> Resume</button> : null}{!['Cancelled', 'Expired'].includes(item.status) && <button onClick={() => moveStatus(item.id, 'Cancelled')} className="rounded border border-red-300/15 px-2 py-1 text-[8px] text-red-300">Cancel</button>}</div></td>
            </tr>)}{!filtered.length && <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-700">No subscriptions match this view.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      {planOpen && <PlanDialog onClose={() => setPlanOpen(false)} onSave={(values) => { if (run(() => aglCustomerWorkflow.createSubscriptionPlan(actor, values), `${values.name} created.`)) setPlanOpen(false); }} />}
      {enrolmentOpen && <EnrolmentDialog customers={customers} vehicles={vehicles} plans={plans.filter((plan) => plan.status === 'Active')} onClose={() => setEnrolmentOpen(false)} onSave={(values) => { if (run(() => aglCustomerWorkflow.enrollSubscription(actor, values), 'Customer enrolled; billing and audit records created.')) setEnrolmentOpen(false); }} />}
    </div>
  );
};

const PlanDialog = ({ onClose, onSave }: { onClose: () => void; onSave: (values: SubscriptionPlanInput) => void }) => {
  const [values, setValues] = useState<SubscriptionPlanInput>({ name: '', monthlyPrice: 0, yearlyPrice: 0, benefits: ['', '', ''], isActive: true, owner: actor.name });
  return <Dialog title="Create service plan" eyebrow="Reusable revenue product" onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); onSave(values); }} className="grid gap-4">
    <Field label="Plan name"><input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="e.g. Executive Fleet Care" required /></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Monthly price (GHS)"><input type="number" min="0" step="0.01" value={values.monthlyPrice || ''} onChange={(event) => setValues({ ...values, monthlyPrice: Number(event.target.value) })} required /></Field><Field label="Yearly price (GHS)"><input type="number" min="0" step="0.01" value={values.yearlyPrice || ''} onChange={(event) => setValues({ ...values, yearlyPrice: Number(event.target.value) })} required /></Field></div>
    <div><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Included benefits</div><div className="mt-2 space-y-2">{values.benefits.map((benefit, index) => <input key={index} value={benefit} onChange={(event) => setValues({ ...values, benefits: values.benefits.map((item, position) => position === index ? event.target.value : item) })} placeholder={`Benefit ${index + 1}`} className="h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" />)}</div></div>
    <Field label="Plan owner"><input value={values.owner} onChange={(event) => setValues({ ...values, owner: event.target.value })} /></Field>
    <label className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-[10px] text-gray-300"><input type="checkbox" checked={values.isActive} onChange={(event) => setValues({ ...values, isActive: event.target.checked })} /> Open this plan for enrolment immediately</label>
    <button className="min-h-11 rounded-lg bg-cyan-300 text-xs font-semibold text-black">Save plan</button>
  </form></Dialog>;
};

const EnrolmentDialog = ({ customers, vehicles, plans, onClose, onSave }: { customers: ReturnType<typeof aglCustomerWorkflow.customers>; vehicles: ReturnType<typeof aglCustomerWorkflow.vehicles>; plans: ReturnType<typeof aglCustomerWorkflow.subscriptionPlans>; onClose: () => void; onSave: (values: SubscriptionEnrollmentInput) => void }) => {
  const [values, setValues] = useState<SubscriptionEnrollmentInput>({ customerId: customers[0]?.id ?? '', vehicleId: '', planId: plans[0]?.id ?? '', startDate: today(), autoRenew: true, owner: actor.name });
  const eligibleVehicles = vehicles.filter((vehicle) => !values.customerId || vehicle.customerId === values.customerId || String(vehicle.customer) === String(customers.find((customer) => customer.id === values.customerId)?.name));
  useEffect(() => { if (!eligibleVehicles.some((vehicle) => vehicle.id === values.vehicleId)) setValues((current) => ({ ...current, vehicleId: eligibleVehicles[0]?.id ?? '' })); }, [eligibleVehicles, values.vehicleId]);
  const plan = plans.find((item) => item.id === values.planId);
  return <Dialog title="Subscribe customer" eyebrow="New recurring service enrolment" onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); onSave(values); }} className="grid gap-4">
    <Field label="Customer"><select value={values.customerId} onChange={(event) => setValues({ ...values, customerId: event.target.value })}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{String(customer.name)} · {String(customer.phone ?? '')}</option>)}</select></Field>
    <Field label="Vehicle"><select value={values.vehicleId} onChange={(event) => setValues({ ...values, vehicleId: event.target.value })}>{eligibleVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{String(vehicle.registration)} · {String(vehicle.vehicle)}</option>)}</select></Field>
    <Field label="Plan"><select value={values.planId} onChange={(event) => setValues({ ...values, planId: event.target.value })}>{plans.map((item) => <option key={item.id} value={item.id}>{String(item.name)} · {money.format(Number(item.monthlyPrice ?? item.amount ?? 0))}/mo</option>)}</select></Field>
    {plan && <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] p-4"><div className="font-mono text-[8px] uppercase text-cyan-300">Selected plan</div><div className="mt-2 text-lg text-white">{money.format(Number(plan.monthlyPrice ?? plan.amount ?? 0))} monthly</div><p className="mt-1 text-[9px] text-gray-500">{parseBenefits(plan.benefits).join(' · ')}</p></div>}
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Start date"><input type="date" value={values.startDate} onChange={(event) => setValues({ ...values, startDate: event.target.value })} /></Field><Field label="Account owner"><input value={values.owner} onChange={(event) => setValues({ ...values, owner: event.target.value })} /></Field></div>
    <label className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-[10px] text-gray-300"><input type="checkbox" checked={values.autoRenew} onChange={(event) => setValues({ ...values, autoRenew: event.target.checked })} /> Auto-renew at the end of each billing period</label>
    <button className="min-h-11 rounded-lg bg-cyan-300 text-xs font-semibold text-black">Enrol customer</button>
  </form></Dialog>;
};

const Dialog = ({ eyebrow, title, onClose, children }: { eyebrow: string; title: string; onClose: () => void; children: React.ReactNode }) => <div role="dialog" aria-modal="true" className="custom-scrollbar fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="my-4 w-full max-w-2xl rounded-xl border border-white/[0.12] bg-[#090909] shadow-2xl"><header className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.08] bg-[#090909] p-5"><div><div className="font-mono text-[8px] uppercase tracking-wider text-cyan-300">{eyebrow}</div><h2 className="mt-2 text-xl text-white">{title}</h2></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={14} /></button></header><div className="p-5">{children}</div></section></div>;
const Field = ({ label, children }: { label: string; children: React.ReactElement }) => <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><div className="mt-2 [&>input]:h-11 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-white/[0.08] [&>input]:bg-black/25 [&>input]:px-3 [&>input]:text-xs [&>input]:text-white [&>select]:h-11 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-white/[0.08] [&>select]:bg-[#050505] [&>select]:px-3 [&>select]:text-xs [&>select]:text-white">{children}</div></label>;
const Metric = ({ icon, label, value, detail, warning = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; detail: string; warning?: boolean }) => <article className="rounded-xl border border-white/[0.08] bg-[#090909] p-4"><div className={`flex items-center gap-2 ${warning ? 'text-amber-300' : 'text-cyan-300'}`}>{icon}<span className="font-mono text-[8px] uppercase tracking-wider">{label}</span></div><div className={`mt-3 text-xl font-display ${warning ? 'text-amber-200' : 'text-white'}`}>{value}</div><p className="mt-1 text-[9px] text-gray-600">{detail}</p></article>;
const Status = ({ value }: { value: unknown }) => <span className={`rounded-full border px-2 py-1 font-mono text-[8px] uppercase ${value === 'Active' ? 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200' : value === 'Paused' ? 'border-amber-300/20 bg-amber-300/[0.05] text-amber-200' : 'border-white/[0.08] text-gray-500'}`}>{String(value)}</span>;
const monthlyEquivalent = (record: Record<string, unknown>) => String(record.billingCycle ?? 'Monthly') === 'Annual' ? Number(record.amount ?? 0) / 12 : String(record.billingCycle) === 'Quarterly' ? Number(record.amount ?? 0) / 3 : Number(record.amount ?? 0);
const parseBenefits = (value: unknown) => { try { const parsed = JSON.parse(String(value ?? '[]')); return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []; } catch { return String(value ?? '').split('\n').map((item) => item.trim()).filter(Boolean); } };
