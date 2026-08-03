import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarClock,
  Car,
  CircleDollarSign,
  MapPin,
  Pencil,
  Plus,
  Printer,
  Search,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import {
  aglCustomerWorkflow,
  type CustomerInput,
  type VehicleInput,
} from '../../erp/agl/customerWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';

const actor = { name: 'AGL Admin', role: 'Administrator' };
type CustomerMode = 'customers' | 'vehicles' | 'subscriptions';
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const emptyCustomer: CustomerInput = { name: '', phone: '', alternatePhone: '', email: '', customerType: 'Individual', preferredContact: 'WhatsApp', acquisitionChannel: 'Walk-in', locality: '', address: '', tinOrGhanaCard: '', owner: 'Yvonne Botchway', notes: '' };
const emptyVehicle: VehicleInput = { registration: '', make: '', model: '', year: new Date().getFullYear(), color: '', vin: '', engineNumber: '', engineCapacity: '', fuelType: 'Petrol', transmission: 'Automatic', mileage: 0, insuranceExpiry: '', roadworthyExpiry: '', nextService: '', notes: '' };

export const AglCustomerFleetWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: CustomerMode }) => {
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);
  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      const result = operation();
      setNotice(confirmation);
      return result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The customer operation could not be completed.');
      return undefined;
    }
  };
  const heading = moduleId === 'customers'
    ? ['customer master', 'Customers & relationships', 'Create a customer and their first vehicle together, then retain contact authority, fleet, service, sales, subscription, and follow-up history.']
    : moduleId === 'vehicles'
      ? ['fleet registry', 'Vehicles & service history', 'Maintain VIN-level vehicle records with ownership, documents, mileage, service history, and next-due work.']
      : ['service relationships', 'Service subscriptions', 'Attach a recurring service plan to a governed customer and registered vehicle.'];
  return (
    <div className="mx-auto max-w-[1740px] space-y-5 pb-12">
      <header className="agl-no-print border-b border-white/[0.08] pb-5"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{moduleId === 'vehicles' ? <Car size={13} /> : moduleId === 'subscriptions' ? <CalendarClock size={13} /> : <Users size={13} />} {tenant.id.toUpperCase()} ERP / sales / {heading[0]}</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">{heading[1]}</h1><p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{heading[2]}</p></header>
      <div className="agl-no-print">{(notice || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span>{error || notice}</span><button onClick={() => { setNotice(''); setError(''); }}><X size={13} /></button></div>}</div>
      {moduleId === 'customers' && <CustomersView revision={revision} run={run} />}
      {moduleId === 'vehicles' && <VehiclesView revision={revision} run={run} />}
      {moduleId === 'subscriptions' && <SubscriptionsView revision={revision} run={run} />}
    </div>
  );
};

const CustomersView = ({ revision, run }: { revision: number; run: (operation: () => unknown, confirmation: string) => unknown }) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [editor, setEditor] = useState<'new' | AglOperationalRecord | null>(null);
  const customers = useMemo(() => aglCustomerWorkflow.customers(), [revision]);
  const selected = customers.find((customer) => customer.id === selectedId) ?? customers[0];
  useEffect(() => { if (!selectedId && customers[0]) setSelectedId(customers[0].id); }, [customers, selectedId]);
  const filtered = customers.filter((customer) => !query.trim() || JSON.stringify(customer).toLowerCase().includes(query.toLowerCase()));
  const snapshot = selected ? aglCustomerWorkflow.snapshot(selected.id) : null;
  return (
    <>
      <div className="agl-no-print flex gap-3"><label className="relative max-w-xl flex-1"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, contact, locality, vehicle…" className="h-11 w-full rounded-lg border border-white/[0.1] bg-black/25 pl-9 pr-3 text-xs text-white" /></label><button onClick={() => setEditor('new')} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={14} /> Add customer</button></div>
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="agl-no-print max-h-[calc(100vh-230px)] space-y-2 overflow-y-auto pr-1">{filtered.map((customer) => <button key={customer.id} onClick={() => setSelectedId(customer.id)} className={`w-full rounded-xl border p-4 text-left ${selected?.id === customer.id ? 'border-cyan-300/25 bg-cyan-300/[0.05]' : 'border-white/[0.08] bg-[#090909]'}`}><div className="flex items-start justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-cyan-300"><UserRound size={15} /></span><Status value={customer.status} /></div><h2 className="mt-3 text-sm text-white">{String(customer.name)}</h2><p className="mt-1 text-[10px] text-gray-500">{String(customer.phone)} · {String(customer.customerType ?? 'Individual')}</p><div className="mt-3 flex items-center gap-2 text-[9px] text-gray-600"><MapPin size={11} /> {String(customer.locality ?? 'Location not set')}</div></button>)}</section>
        {snapshot && <CustomerProfile snapshot={snapshot} onEdit={() => setEditor(snapshot.customer)} onRetire={() => {
          const reason = window.prompt('Reason for retiring this customer relationship:');
          if (!reason) return;
          const result = run(() => aglCustomerWorkflow.retireCustomer(actor, snapshot.customer.id, reason), `${String(snapshot.customer.name)} retired with history preserved.`) as ReturnType<typeof aglCustomerWorkflow.retireCustomer> | undefined;
          if (result?.action === 'deleted') setSelectedId('');
        }} />}
      </div>
      {editor && <CustomerEditor record={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSave={(customer, vehicle) => { const result = run(() => editor === 'new' ? aglCustomerWorkflow.createCustomer(actor, customer, vehicle) : aglCustomerWorkflow.updateCustomer(actor, editor.id, customer), `${customer.name} saved.`) as any; if (!result) return; if (result?.customer?.id) setSelectedId(result.customer.id); setEditor(null); }} />}
    </>
  );
};

const CustomerProfile = ({ snapshot, onEdit, onRetire }: { snapshot: ReturnType<typeof aglCustomerWorkflow.snapshot>; onEdit: () => void; onRetire: () => void }) => (
  <article className="rounded-xl border border-white/[0.08] bg-[#090909]">
    <div className="flex flex-col gap-5 border-b border-white/[0.08] p-6 sm:flex-row sm:items-start sm:justify-between">
      <div><div className="font-mono text-[9px] text-cyan-300">{snapshot.customer.id}</div><h2 className="mt-2 text-xl text-white">{String(snapshot.customer.name)}</h2><p className="mt-2 text-xs text-gray-500">{String(snapshot.customer.phone)} · {String(snapshot.customer.email ?? '')}</p><p className="mt-1 text-[10px] text-gray-600">{String(snapshot.customer.address ?? snapshot.customer.locality ?? '')}</p></div>
      <div className="agl-no-print flex flex-wrap gap-2"><button onClick={onEdit} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-3 text-[10px] text-gray-400"><Pencil size={12} /> Edit</button><button onClick={onRetire} className="flex min-h-10 items-center gap-2 rounded-lg border border-amber-300/15 px-3 text-[10px] text-amber-200"><Archive size={12} /> Retire</button><button onClick={() => { aglErpRepository.recordAction({ moduleId: 'customers', recordId: snapshot.customer.id, actorName: actor.name, actorRole: actor.role, action: 'PRINT', summary: `Printed customer relationship file ${snapshot.customer.id}.` }); window.print(); }} className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-3 text-[10px] text-gray-400"><Printer size={12} /> Print / PDF</button></div>
    </div>
    <section className="grid gap-px bg-white/[0.07] sm:grid-cols-4"><Signal label="Registered vehicles" value={snapshot.vehicles.length} /><Signal label="Workshop jobs" value={snapshot.jobs.length} /><Signal label="Sales records" value={snapshot.sales.length} /><Signal label="Lifetime relationship" value={money.format(snapshot.lifetimeSpendGhs)} /></section>
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <section><SectionTitle icon={<Car size={13} />}>Vehicles</SectionTitle><div className="mt-3 space-y-2">{snapshot.vehicles.map((vehicle) => <div key={vehicle.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-[11px] text-gray-200">{String(vehicle.vehicle)}</div><div className="mt-1 font-mono text-[8px] text-cyan-300">{String(vehicle.registration)}</div></div><Status value={vehicle.status} /></div><div className="mt-3 flex justify-between text-[8px] text-gray-600"><span>{Number(vehicle.mileage ?? 0).toLocaleString()} km</span><span>Next: {String(vehicle.nextService ?? 'Not set')}</span></div></div>)}</div></section>
      <section><SectionTitle icon={<Wrench size={13} />}>Service history</SectionTitle><div className="mt-3 space-y-2">{snapshot.jobs.map((job) => <div key={job.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[8px] text-cyan-300">{job.id}</span><Status value={job.status} /></div><div className="mt-2 text-[10px] text-gray-300">{String(job.concern)}</div><div className="mt-2 text-[8px] text-gray-600">{String(job.vehicle)} · {String(job.mechanic)} · {money.format(Number(job.amount ?? 0))}</div></div>)}</div></section>
      <section><SectionTitle icon={<CircleDollarSign size={13} />}>Sales relationship</SectionTitle><div className="mt-3 space-y-2">{snapshot.sales.map((sale) => <div key={sale.id} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/20 p-3"><div><div className="text-[10px] text-gray-300">{String(sale.name ?? sale.item)}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{String(sale.reference)}</div></div><span className="font-mono text-[9px] text-gray-300">{money.format(Number(sale.amount ?? 0))}</span></div>)}</div></section>
      <section><SectionTitle icon={<CalendarClock size={13} />}>Subscriptions</SectionTitle><div className="mt-3 space-y-2">{snapshot.subscriptions.map((subscription) => <div key={subscription.id} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/20 p-3"><div><div className="text-[10px] text-gray-300">{String(subscription.plan ?? subscription.name)}</div><div className="mt-1 text-[8px] text-gray-600">{String(subscription.startDate ?? '—')} → {String(subscription.endDate ?? '—')}</div></div><Status value={subscription.status} /></div>)}</div></section>
    </div>
  </article>
);

const VehiclesView = ({ revision, run }: { revision: number; run: (operation: () => unknown, confirmation: string) => unknown }) => {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const customers = useMemo(() => aglCustomerWorkflow.customers(), [revision]);
  const vehicles = useMemo(() => aglCustomerWorkflow.vehicles(), [revision]);
  const [vehicle, setVehicle] = useState<VehicleInput>(emptyVehicle);
  useEffect(() => { if (!customerId && customers[0]) setCustomerId(customers[0].id); }, [customerId, customers]);
  const filtered = vehicles.filter((item) => !query.trim() || JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <div className="agl-no-print flex gap-3"><label className="relative max-w-xl flex-1"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search registration, VIN, owner, make, model…" className="h-11 w-full rounded-lg border border-white/[0.1] bg-black/25 pl-9 pr-3 text-xs text-white" /></label><button onClick={() => setAdding(true)} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={14} /> Register vehicle</button></div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25 text-cyan-300"><Car size={18} /></span><Status value={item.status} /></div><h2 className="mt-4 text-sm text-white">{String(item.vehicle)}</h2><div className="mt-1 font-mono text-[9px] text-cyan-300">{String(item.registration)}</div><dl className="mt-4 space-y-2 border-t border-white/[0.07] pt-4 text-[9px]"><Row label="Owner" value={item.customer} /><Row label="VIN" value={item.vin} /><Row label="Mileage" value={`${Number(item.mileage ?? 0).toLocaleString()} km`} /><Row label="Insurance" value={item.insuranceExpiry} /><Row label="Roadworthy" value={item.roadworthyExpiry} /><Row label="Next service" value={item.nextService} /></dl><button onClick={() => { const reason = window.prompt(`Reason for retiring ${String(item.registration)}:`); if (reason) run(() => aglCustomerWorkflow.retireVehicle(actor, item.id, reason), `${String(item.registration)} retired with service history preserved.`); }} className="agl-no-print mt-4 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-amber-300/15 text-[9px] text-amber-200"><Archive size={11} /> Retire vehicle</button></article>)}</section>
      {adding && <div className="custom-scrollbar fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/75 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); const result = run(() => aglCustomerWorkflow.addVehicle(actor, customerId, vehicle), `${vehicle.registration} registered.`); if (result) setAdding(false); }} className="my-auto w-full max-w-3xl rounded-xl border border-white/[0.1] bg-[#090909] p-6"><div className="flex items-start justify-between"><div><div className="font-mono text-[8px] uppercase text-cyan-300">Attach vehicle to customer master</div><h2 className="mt-2 text-xl text-white">Register vehicle</h2></div><button type="button" onClick={() => setAdding(false)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={14} /></button></div><div className="mt-6"><Field label="Customer" value={customerId} onChange={setCustomerId} options={customers.map((customer) => ({ value: customer.id, label: `${String(customer.name)} · ${String(customer.phone)}` }))} /></div><VehicleFields values={vehicle} onChange={setVehicle} /><button className="mt-6 min-h-11 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Register vehicle</button></form></div>}
    </>
  );
};

const SubscriptionsView = ({ revision, run }: { revision: number; run: (operation: () => unknown, confirmation: string) => unknown }) => {
  const customers = useMemo(() => aglCustomerWorkflow.customers(), [revision]);
  const vehicles = useMemo(() => aglCustomerWorkflow.vehicles(), [revision]);
  const subscriptions = useMemo(() => aglCustomerWorkflow.subscriptions(), [revision]);
  const [values, setValues] = useState({ customerId: customers[0]?.id ?? '', vehicleId: '', plan: 'Preventive maintenance', startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10), amount: 0, billingCycle: 'Annual', owner: 'Yvonne Botchway' });
  const eligibleVehicles = vehicles.filter((vehicle) => !values.customerId || vehicle.customerId === values.customerId || vehicle.customer === customers.find((item) => item.id === values.customerId)?.name);
  useEffect(() => { if (!values.customerId && customers[0]) setValues((current) => ({ ...current, customerId: customers[0].id })); }, [customers, values.customerId]);
  useEffect(() => { if (!eligibleVehicles.some((vehicle) => vehicle.id === values.vehicleId)) setValues((current) => ({ ...current, vehicleId: eligibleVehicles[0]?.id ?? '' })); }, [eligibleVehicles, values.vehicleId]);
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={(event) => { event.preventDefault(); run(() => aglCustomerWorkflow.createSubscription(actor, values), 'Service subscription created.'); }} className="h-fit space-y-4 rounded-xl border border-white/[0.08] bg-[#090909] p-5"><h2 className="text-sm text-white">Create subscription</h2><Field label="Customer" value={values.customerId} onChange={(value) => setValues({ ...values, customerId: value })} options={customers.map((customer) => ({ value: customer.id, label: String(customer.name) }))} /><Field label="Vehicle" value={values.vehicleId} onChange={(value) => setValues({ ...values, vehicleId: value })} options={eligibleVehicles.map((vehicle) => ({ value: vehicle.id, label: `${String(vehicle.registration)} · ${String(vehicle.vehicle)}` }))} /><Field label="Plan" value={values.plan} onChange={(value) => setValues({ ...values, plan: value })} options={['Preventive maintenance', 'Fleet care', 'Priority diagnostics', 'Annual inspection', 'Roadside support'].map((value) => ({ value, label: value }))} /><div className="grid grid-cols-2 gap-3"><Field label="Start" type="date" value={values.startDate} onChange={(value) => setValues({ ...values, startDate: value })} /><Field label="End" type="date" value={values.endDate} onChange={(value) => setValues({ ...values, endDate: value })} /></div><Field label="Billing cycle" value={values.billingCycle} onChange={(value) => setValues({ ...values, billingCycle: value })} options={['Monthly', 'Quarterly', 'Annual'].map((value) => ({ value, label: value }))} /><Field label="Amount (GHS)" type="number" value={String(values.amount)} onChange={(value) => setValues({ ...values, amount: Number(value) })} /><Field label="Account owner" value={values.owner} onChange={(value) => setValues({ ...values, owner: value })} options={['Yvonne Botchway', 'Alex Morgan', 'AGL Admin'].map((value) => ({ value, label: value }))} /><button className="min-h-11 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Create subscription</button></form>
      <section className="space-y-3">{subscriptions.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start justify-between gap-4"><div><div className="font-mono text-[8px] text-cyan-300">{item.id}</div><h2 className="mt-2 text-sm text-white">{String(item.plan ?? item.name)}</h2><p className="mt-1 text-[10px] text-gray-500">{String(item.customer ?? item.name)} · {String(item.vehicle ?? item.reference)}</p></div><Status value={item.status} /></div><div className="mt-4 grid gap-3 border-t border-white/[0.07] pt-4 sm:grid-cols-4"><Mini label="Coverage" value={`${String(item.startDate ?? '—')} → ${String(item.endDate ?? '—')}`} /><Mini label="Billing" value={item.billingCycle ?? '—'} /><Mini label="Amount" value={money.format(Number(item.amount ?? 0))} /><Mini label="Owner" value={item.owner} /></div></article>)}</section>
    </div>
  );
};

const CustomerEditor = ({ record, onClose, onSave }: { record?: AglOperationalRecord; onClose: () => void; onSave: (customer: CustomerInput, vehicle?: VehicleInput) => void }) => {
  const [customer, setCustomer] = useState<CustomerInput>({ ...emptyCustomer, ...(record as unknown as Partial<CustomerInput> ?? {}) });
  const [vehicle, setVehicle] = useState<VehicleInput>(emptyVehicle);
  const [includeVehicle, setIncludeVehicle] = useState(!record);
  return <div className="custom-scrollbar fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/75 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); onSave(customer, includeVehicle ? vehicle : undefined); }} className="my-auto w-full max-w-4xl rounded-xl border border-white/[0.1] bg-[#090909] p-6"><div className="flex items-start justify-between"><div><div className="font-mono text-[8px] uppercase text-cyan-300">{record ? 'Update customer master' : 'One-step customer and vehicle intake'}</div><h2 className="mt-2 text-xl text-white">{record ? String(record.name) : 'New customer'}</h2></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={14} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{Object.entries(customer).map(([key, value]) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')} value={String(value)} onChange={(next) => setCustomer({ ...customer, [key]: next })} options={key === 'customerType' ? ['Individual', 'Corporate', 'Fleet', 'Insurance'].map((item) => ({ value: item, label: item })) : key === 'preferredContact' ? ['WhatsApp', 'SMS', 'Phone', 'Email'].map((item) => ({ value: item, label: item })) : key === 'acquisitionChannel' ? ['Walk-in', 'WhatsApp', 'Phone', 'Instagram', 'TikTok', 'Facebook', 'Referral', 'Management'].map((item) => ({ value: item, label: item })) : key === 'locality' ? ['Accra', 'Tema', 'Kasoa', 'Teshie', 'Nungua', 'Madina', 'Adenta', 'East Legon', 'Spintex', 'Airport Residential'].map((item) => ({ value: item, label: item })) : key === 'owner' ? ['Yvonne Botchway', 'Alex Morgan', 'AGL Admin'].map((item) => ({ value: item, label: item })) : undefined} />)}</div>{!record && <label className="mt-6 flex items-center gap-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-xs text-cyan-200"><input type="checkbox" checked={includeVehicle} onChange={(event) => setIncludeVehicle(event.target.checked)} /> Also register the customer’s vehicle now</label>}{includeVehicle && !record && <VehicleFields values={vehicle} onChange={setVehicle} />}<button className="mt-6 min-h-11 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Save customer relationship</button></form></div>;
};

const VehicleFields = ({ values, onChange }: { values: VehicleInput; onChange: (values: VehicleInput) => void }) => <div className="mt-6 grid gap-4 border-t border-white/[0.08] pt-6 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(values).map(([key, value]) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')} type={['year', 'mileage'].includes(key) ? 'number' : key.toLowerCase().includes('expiry') || key === 'nextService' ? 'date' : 'text'} value={String(value)} onChange={(next) => onChange({ ...values, [key]: ['year', 'mileage'].includes(key) ? Number(next) : next })} options={key === 'make' ? ['Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'Mercedes-Benz', 'BMW', 'Ford', 'Volkswagen', 'Suzuki', 'Mitsubishi'].map((item) => ({ value: item, label: item })) : key === 'color' ? ['Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Gold', 'Brown'].map((item) => ({ value: item, label: item })) : key === 'fuelType' ? ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'].map((item) => ({ value: item, label: item })) : key === 'transmission' ? ['Automatic', 'Manual', 'CVT', 'Dual-clutch'].map((item) => ({ value: item, label: item })) : undefined} />)}</div>;
const Field = ({ label, value, onChange, type = 'text', options }: { label: string; value: string; onChange: (value: string) => void; type?: string; options?: { value: string; label: string }[] }) => <label className="block"><span className="font-mono text-[8px] capitalize text-gray-600">{label}</span>{options ? <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#050505] px-3 text-xs text-white">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" />}</label>;
const Status = ({ value }: { value: unknown }) => <span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-500">{String(value)}</span>;
const Signal = ({ label, value }: { label: string; value: unknown }) => <div className="bg-[#080808] px-5 py-4"><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className="mt-2 text-lg text-white">{String(value)}</div></div>;
const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => <h3 className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-cyan-300">{icon}{children}</h3>;
const Row = ({ label, value }: { label: string; value: unknown }) => <div className="flex items-center justify-between gap-4"><dt className="text-gray-600">{label}</dt><dd className="max-w-[68%] truncate text-right text-gray-400">{String(value ?? '—')}</dd></div>;
const Mini = ({ label, value }: { label: string; value: unknown }) => <div><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className="mt-2 text-[10px] text-gray-300">{String(value)}</div></div>;
