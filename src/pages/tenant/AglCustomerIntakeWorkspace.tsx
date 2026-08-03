import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Car,
  Check,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Plus,
  ShieldCheck,
  UserRound,
  Wrench,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import {
  aglIntakeWorkflow,
  type CustomerIntakeDetails,
  type OpenIntakeResult,
  type VehicleIntakeDetails,
  type VisitIntakeDetails,
} from '../../erp/agl/intakeWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };

const today = new Date().toISOString().slice(0, 10);
const emptyCustomer: CustomerIntakeDetails = {
  name: '',
  phone: '',
  alternatePhone: '',
  email: '',
  customerType: 'Individual',
  preferredContact: 'WhatsApp',
  notificationsEnabled: true,
  acquisitionChannel: 'Walk-in',
  locality: '',
  address: '',
  tinOrGhanaCard: '',
  notes: '',
};
const emptyVehicle: VehicleIntakeDetails = {
  registration: '',
  make: '',
  model: '',
  year: '',
  color: '',
  vin: '',
  engineNumber: '',
  engineCapacity: '',
  fuelType: 'Petrol',
  transmission: 'Automatic',
  mileage: 0,
  fuelLevel: 'Half',
  keyCount: 1,
  intakeCondition: 'Driveable',
  preExistingDamage: '',
  accessoriesReceived: 'Vehicle key',
  insuranceExpiry: '',
  roadworthyExpiry: '',
  evidenceReferences: '',
};
const emptyVisit: VisitIntakeDetails = {
  service: '',
  reasonForVisit: 'Repair / diagnosis',
  customerComplaint: '',
  observedSymptoms: '',
  date: today,
  time: '09:00',
  expectedCollection: '',
  mechanic: 'Unassigned',
  bay: 'Unassigned',
  advisor: 'Briana Owusu',
  serviceFeeGhs: 0,
  customerAuthorized: false,
  authorityNotes: '',
  openJobImmediately: true,
};

const steps = [
  { label: 'Customer', icon: <UserRound size={15} /> },
  { label: 'Vehicle', icon: <Car size={15} /> },
  { label: 'Visit & authority', icon: <ClipboardCheck size={15} /> },
  { label: 'Review & open', icon: <Wrench size={15} /> },
];

export const AglCustomerIntakeWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [step, setStep] = useState(0);
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
  const [vehicleMode, setVehicleMode] = useState<'existing' | 'new'>('new');
  const [customer, setCustomer] = useState<CustomerIntakeDetails>(emptyCustomer);
  const [vehicle, setVehicle] = useState<VehicleIntakeDetails>(emptyVehicle);
  const [visit, setVisit] = useState<VisitIntakeDetails>(emptyVisit);
  const [result, setResult] = useState<OpenIntakeResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const customers = useMemo(() => aglIntakeWorkflow.customers(), [version]);
  const selectedCustomer = useMemo(
    () => customers.find((item) => item.id === customer.existingId),
    [customers, customer.existingId],
  );
  const vehicles = useMemo(
    () => aglIntakeWorkflow.vehicles(customer.existingId),
    [customer.existingId, version],
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((item) => item.id === vehicle.existingId),
    [vehicles, vehicle.existingId],
  );
  const intakes = useMemo(() => aglIntakeWorkflow.intakes().slice(0, 4), [version]);

  const resolvedCustomer = customerMode === 'existing' && selectedCustomer
    ? {
        ...customer,
        name: String(selectedCustomer.name ?? ''),
        phone: String(selectedCustomer.phone ?? ''),
        email: String(selectedCustomer.email ?? ''),
        preferredContact: String(selectedCustomer.preferredContact ?? customer.preferredContact),
      }
    : customer;
  const resolvedVehicle = vehicleMode === 'existing' && selectedVehicle
    ? {
        ...vehicle,
        registration: String(selectedVehicle.registration ?? ''),
        make: String(selectedVehicle.make ?? String(selectedVehicle.vehicle ?? '').split(' ')[0] ?? ''),
        model: String(selectedVehicle.model ?? String(selectedVehicle.vehicle ?? '').split(' ').slice(1).join(' ') ?? ''),
        mileage: Number(selectedVehicle.mileage ?? 0),
      }
    : vehicle;

  const validateStep = () => {
    if (step === 0) {
      if (customerMode === 'existing' && !customer.existingId) return 'Select the customer record.';
      if (customerMode === 'new' && (!customer.name.trim() || !customer.phone.trim())) return 'Customer name and phone are required.';
    }
    if (step === 1) {
      if (vehicleMode === 'existing' && !vehicle.existingId) return 'Select the customer vehicle.';
      if (vehicleMode === 'new' && (!vehicle.registration.trim() || !vehicle.make.trim() || !vehicle.model.trim())) {
        return 'Registration, make, and model are required.';
      }
    }
    if (step === 2) {
      if (!visit.service.trim() || !visit.customerComplaint.trim() || !visit.date || !visit.time) {
        return 'Service, complaint, appointment date, and time are required.';
      }
      if (!visit.customerAuthorized) return 'Confirm customer authorization before continuing.';
    }
    return '';
  };

  const next = () => {
    const issue = validateStep();
    if (issue) {
      setError(issue);
      return;
    }
    setError('');
    setStep((current) => Math.min(3, current + 1));
  };

  const submit = () => {
    setError('');
    try {
      const opened = aglIntakeWorkflow.open({
        actor,
        customer: resolvedCustomer,
        vehicle: resolvedVehicle,
        visit,
      });
      setResult(opened);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The connected intake could not be opened.');
    }
  };

  const reset = () => {
    setStep(0);
    setCustomerMode('new');
    setVehicleMode('new');
    setCustomer(emptyCustomer);
    setVehicle(emptyVehicle);
    setVisit({ ...emptyVisit, date: new Date().toISOString().slice(0, 10) });
    setResult(null);
    setError('');
  };

  const basePath = `/${tenant.verticalId}/tenant/${tenant.id}/erp`;

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1680px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">
            <ShieldCheck size={13} /> {tenant.id.toUpperCase()} ERP / controlled intake
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Customer & vehicle intake</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">
            Register or select the customer, bind the correct vehicle, record its arrival condition and customer authority, then open the appointment and linked workshop job.
          </p>
        </div>
        <button onClick={reset} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300 hover:border-vertical-accent/40 hover:text-white">
          <Plus size={14} /> New intake
        </button>
      </header>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <nav aria-label="Intake progress" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {steps.map((item, index) => (
              <button
                key={item.label}
                onClick={() => index < step && !result && setStep(index)}
                disabled={index > step || Boolean(result)}
                className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left transition ${
                  index === step
                    ? 'border-vertical-accent/40 bg-vertical-accent-glow text-white'
                    : index < step
                      ? 'border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-200'
                      : 'border-white/[0.07] bg-white/[0.02] text-gray-600'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20">{index < step ? <Check size={15} /> : item.icon}</span>
                <span><span className="block font-mono text-[8px] uppercase tracking-wider">Step {index + 1}</span><span className="mt-1 block text-xs font-medium">{item.label}</span></span>
              </button>
            ))}
          </nav>

          <GlassPanel className="rounded-xl p-5 sm:p-6">
            {!result && step === 0 && (
              <CustomerStep
                mode={customerMode}
                onMode={setCustomerMode}
                value={customer}
                onChange={setCustomer}
                customers={customers}
              />
            )}
            {!result && step === 1 && (
              <VehicleStep
                mode={vehicleMode}
                onMode={setVehicleMode}
                value={vehicle}
                onChange={setVehicle}
                vehicles={vehicles}
                customerName={resolvedCustomer.name}
              />
            )}
            {!result && step === 2 && <VisitStep value={visit} onChange={setVisit} />}
            {!result && step === 3 && (
              <ReviewStep customer={resolvedCustomer} vehicle={resolvedVehicle} visit={visit} />
            )}
            {result && (
              <Completion result={result} onNavigate={(path) => navigate(`${basePath}/${path}`)} onReset={reset} />
            )}

            {!result && (
              <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-5 text-xs text-red-300">{error}</div>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button onClick={() => { setError(''); setStep((current) => current - 1); }} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.08] px-4 text-xs text-gray-400 hover:text-white">
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button onClick={next} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">
                      Continue <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button onClick={submit} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">
                      <Wrench size={14} /> {visit.openJobImmediately ? 'Open linked job' : 'Book appointment'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </GlassPanel>
        </div>

        <aside className="space-y-4">
          <GlassPanel className="rounded-xl p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-white"><FileCheck2 size={15} className="text-vertical-accent" /> Records written</div>
            <div className="mt-4 space-y-3 text-[10px]">
              {['Customer master', 'Vehicle registry', 'Intake evidence', 'Appointment register', 'Kanban work item', 'Dedicated Job Card'].map((label, index) => (
                <div key={label} className="flex items-center gap-3 text-gray-500">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[8px] ${
                    step >= Math.min(index, 3) || result ? 'border-vertical-accent/30 text-vertical-accent' : 'border-white/[0.08]'
                  }`}>{index + 1}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel className="rounded-xl p-5">
            <div className="text-xs font-medium text-white">Recent linked customers</div>
            <div className="mt-4 space-y-3">
              {intakes.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/[0.07] bg-black/20 p-3">
                  <div className="text-[11px] text-white">{String(item.customer)}</div>
                  <div className="mt-1 font-mono text-[8px] text-gray-600">{item.id} · {String(item.jobId ?? 'appointment only')}</div>
                </div>
              ))}
              {!intakes.length && <div className="text-[10px] leading-4 text-gray-600">Completed intakes will link customer, vehicle, appointment, and job references here.</div>}
            </div>
          </GlassPanel>
        </aside>
      </div>
    </motion.div>
  );
};

const CustomerStep = ({
  mode, onMode, value, onChange, customers,
}: {
  mode: 'existing' | 'new';
  onMode: (mode: 'existing' | 'new') => void;
  value: CustomerIntakeDetails;
  onChange: (value: CustomerIntakeDetails) => void;
  customers: AglOperationalRecord[];
}) => (
  <section>
    <SectionTitle icon={<UserRound size={17} />} title="Who owns or presents the vehicle?" detail="Use the customer master when one exists. A new record remains independently available in Customers." />
    <ModeSwitch value={mode} onChange={onMode} existing="Select existing customer" fresh="Register new customer" />
    {mode === 'existing' ? (
      <SelectField label="Customer master record" value={value.existingId ?? ''} onChange={(existingId) => onChange({ ...value, existingId })} options={customers.map((item) => ({ value: item.id, label: `${String(item.name)} · ${String(item.phone ?? item.id)}` }))} />
    ) : (
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Full name / organization" required value={value.name} onChange={(name) => onChange({ ...value, name })} />
        <TextField label="Primary phone" required value={value.phone} onChange={(phone) => onChange({ ...value, phone })} />
        <TextField label="Alternate phone" value={value.alternatePhone ?? ''} onChange={(alternatePhone) => onChange({ ...value, alternatePhone })} />
        <TextField label="Email" type="email" value={value.email ?? ''} onChange={(email) => onChange({ ...value, email })} />
        <SelectField label="Customer type" value={value.customerType} onChange={(customerType) => onChange({ ...value, customerType })} options={['Individual', 'Corporate', 'Fleet', 'Insurance'].map(option)} />
        <SelectField label="Preferred contact" value={value.preferredContact} onChange={(preferredContact) => onChange({ ...value, preferredContact })} options={['WhatsApp', 'SMS', 'Phone', 'Email'].map(option)} />
        <SelectField label="Acquisition channel" value={value.acquisitionChannel} onChange={(acquisitionChannel) => onChange({ ...value, acquisitionChannel })} options={['Walk-in', 'WhatsApp', 'Phone', 'Instagram', 'TikTok', 'Facebook', 'Referral', 'Management'].map(option)} />
        <TextField label="Locality" value={value.locality ?? ''} onChange={(locality) => onChange({ ...value, locality })} />
        <TextField label="Address / landmark" value={value.address ?? ''} onChange={(address) => onChange({ ...value, address })} />
        <TextField label="TIN / Ghana Card (optional)" value={value.tinOrGhanaCard ?? ''} onChange={(tinOrGhanaCard) => onChange({ ...value, tinOrGhanaCard })} />
        <div className="md:col-span-2"><TextArea label="Customer notes" value={value.notes ?? ''} onChange={(notes) => onChange({ ...value, notes })} /></div>
        <CheckField checked={value.notificationsEnabled} onChange={(notificationsEnabled) => onChange({ ...value, notificationsEnabled })} label="Customer consents to operational status notifications." />
      </div>
    )}
  </section>
);

const VehicleStep = ({
  mode, onMode, value, onChange, vehicles, customerName,
}: {
  mode: 'existing' | 'new';
  onMode: (mode: 'existing' | 'new') => void;
  value: VehicleIntakeDetails;
  onChange: (value: VehicleIntakeDetails) => void;
  vehicles: AglOperationalRecord[];
  customerName: string;
}) => (
  <section>
    <SectionTitle icon={<Car size={17} />} title="Bind the exact vehicle" detail={`Only vehicles belonging to ${customerName || 'the selected customer'} are offered. Arrival-condition evidence is retained against the vehicle and job.`} />
    <ModeSwitch value={mode} onChange={onMode} existing="Select registered vehicle" fresh="Register new vehicle" />
    {mode === 'existing' ? (
      <SelectField label="Customer vehicle" value={value.existingId ?? ''} onChange={(existingId) => onChange({ ...value, existingId })} options={vehicles.map((item) => ({ value: item.id, label: `${String(item.registration)} · ${String(item.vehicle)}` }))} />
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TextField label="Registration" required value={value.registration} onChange={(registration) => onChange({ ...value, registration })} />
        <TextField label="Make" required value={value.make} onChange={(make) => onChange({ ...value, make })} />
        <TextField label="Model" required value={value.model} onChange={(model) => onChange({ ...value, model })} />
        <TextField label="Year" type="number" value={value.year ?? ''} onChange={(year) => onChange({ ...value, year })} />
        <TextField label="Colour" value={value.color ?? ''} onChange={(color) => onChange({ ...value, color })} />
        <TextField label="VIN / chassis" value={value.vin ?? ''} onChange={(vin) => onChange({ ...value, vin })} />
        <TextField label="Engine number" value={value.engineNumber ?? ''} onChange={(engineNumber) => onChange({ ...value, engineNumber })} />
        <TextField label="Engine capacity" value={value.engineCapacity ?? ''} onChange={(engineCapacity) => onChange({ ...value, engineCapacity })} />
        <SelectField label="Fuel type" value={value.fuelType ?? ''} onChange={(fuelType) => onChange({ ...value, fuelType })} options={['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'].map(option)} />
        <SelectField label="Transmission" value={value.transmission ?? ''} onChange={(transmission) => onChange({ ...value, transmission })} options={['Automatic', 'Manual', 'CVT', 'Dual-clutch'].map(option)} />
        <NumberField label="Odometer (km)" value={value.mileage ?? 0} onChange={(mileage) => onChange({ ...value, mileage })} />
        <SelectField label="Fuel level" value={value.fuelLevel ?? ''} onChange={(fuelLevel) => onChange({ ...value, fuelLevel })} options={['Empty', 'Quarter', 'Half', 'Three quarters', 'Full'].map(option)} />
        <NumberField label="Keys received" value={value.keyCount ?? 1} onChange={(keyCount) => onChange({ ...value, keyCount })} />
        <SelectField label="Intake condition" value={value.intakeCondition ?? ''} onChange={(intakeCondition) => onChange({ ...value, intakeCondition })} options={['Driveable', 'Towed', 'Unsafe to drive', 'Accident damaged'].map(option)} />
        <TextField label="Insurance expiry" type="date" value={value.insuranceExpiry ?? ''} onChange={(insuranceExpiry) => onChange({ ...value, insuranceExpiry })} />
        <TextField label="Roadworthy expiry" type="date" value={value.roadworthyExpiry ?? ''} onChange={(roadworthyExpiry) => onChange({ ...value, roadworthyExpiry })} />
        <div className="md:col-span-2 lg:col-span-3"><TextArea label="Pre-existing damage" value={value.preExistingDamage ?? ''} onChange={(preExistingDamage) => onChange({ ...value, preExistingDamage })} /></div>
        <div className="md:col-span-2"><TextArea label="Accessories / property received" value={value.accessoriesReceived ?? ''} onChange={(accessoriesReceived) => onChange({ ...value, accessoriesReceived })} /></div>
        <TextArea label="Photo / evidence references" value={value.evidenceReferences ?? ''} onChange={(evidenceReferences) => onChange({ ...value, evidenceReferences })} />
      </div>
    )}
  </section>
);

const VisitStep = ({ value, onChange }: { value: VisitIntakeDetails; onChange: (value: VisitIntakeDetails) => void }) => (
  <section>
    <SectionTitle icon={<CalendarClock size={17} />} title="Visit, capacity, and customer authority" detail="This becomes the appointment source record and, when checked in now, the opening context of the linked Job Card." />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <TextField label="Service requested" required value={value.service} onChange={(service) => onChange({ ...value, service })} />
      <SelectField label="Reason for visit" value={value.reasonForVisit} onChange={(reasonForVisit) => onChange({ ...value, reasonForVisit })} options={['Repair / diagnosis', 'Routine service', 'Inspection', 'Recall', 'Warranty', 'Accident repair'].map(option)} />
      <TextField label="Service advisor" required value={value.advisor} onChange={(advisor) => onChange({ ...value, advisor })} />
      <TextField label="Appointment date" required type="date" value={value.date} onChange={(date) => onChange({ ...value, date })} />
      <TextField label="Arrival time" required type="time" value={value.time} onChange={(time) => onChange({ ...value, time })} />
      <TextField label="Expected collection" type="datetime-local" value={value.expectedCollection ?? ''} onChange={(expectedCollection) => onChange({ ...value, expectedCollection })} />
      <TextField label="Assigned mechanic" value={value.mechanic ?? ''} onChange={(mechanic) => onChange({ ...value, mechanic })} />
      <TextField label="Reserved bay" value={value.bay ?? ''} onChange={(bay) => onChange({ ...value, bay })} />
      <NumberField label="Initial service fee (GHS)" value={value.serviceFeeGhs ?? 0} onChange={(serviceFeeGhs) => onChange({ ...value, serviceFeeGhs })} />
      <div className="md:col-span-2 lg:col-span-3"><TextArea label="Customer complaint — in their own words" required value={value.customerComplaint} onChange={(customerComplaint) => onChange({ ...value, customerComplaint })} /></div>
      <div className="md:col-span-2"><TextArea label="Observed symptoms at intake" value={value.observedSymptoms ?? ''} onChange={(observedSymptoms) => onChange({ ...value, observedSymptoms })} /></div>
      <TextArea label="Authority limits / instructions" value={value.authorityNotes ?? ''} onChange={(authorityNotes) => onChange({ ...value, authorityNotes })} />
      <CheckField checked={value.customerAuthorized} onChange={(customerAuthorized) => onChange({ ...value, customerAuthorized })} label="Customer authorizes diagnosis and the recorded initial scope." />
      <CheckField checked={value.openJobImmediately} onChange={(openJobImmediately) => onChange({ ...value, openJobImmediately })} label="Vehicle is present: check in and open a Kanban job plus Job Card now." />
    </div>
  </section>
);

const ReviewStep = ({ customer, vehicle, visit }: { customer: CustomerIntakeDetails; vehicle: VehicleIntakeDetails; visit: VisitIntakeDetails }) => (
  <section>
    <SectionTitle icon={<FileCheck2 size={17} />} title="Review the controlled record chain" detail="Submitting writes every record with one shared audit correlation ID. Nothing replaces the separate registers." />
    <div className="grid gap-4 lg:grid-cols-3">
      <ReviewCard title="Customer" rows={[['Name', customer.name], ['Phone', customer.phone], ['Contact', customer.preferredContact], ['Channel', customer.acquisitionChannel]]} />
      <ReviewCard title="Vehicle" rows={[['Registration', vehicle.registration], ['Vehicle', `${vehicle.make} ${vehicle.model}`], ['Odometer', `${vehicle.mileage ?? 0} km`], ['Condition', vehicle.intakeCondition ?? '—']]} />
      <ReviewCard title="Workshop visit" rows={[['Service', visit.service], ['Date', `${visit.date} · ${visit.time}`], ['Mechanic', visit.mechanic ?? 'Unassigned'], ['Outcome', visit.openJobImmediately ? 'Open linked job' : 'Confirmed appointment']]} />
    </div>
    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
      <div className="font-mono text-[8px] uppercase tracking-wider text-amber-300">Customer complaint</div>
      <p className="mt-2 text-xs leading-5 text-gray-300">{visit.customerComplaint}</p>
    </div>
  </section>
);

const Completion = ({ result, onNavigate, onReset }: { result: OpenIntakeResult; onNavigate: (path: string) => void; onReset: () => void }) => (
  <section>
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300"><Check size={22} /></div>
    <h2 className="mt-4 text-2xl font-display font-semibold text-white">{result.job ? 'Workshop job opened' : 'Appointment registered'}</h2>
    <p className="mt-2 text-xs leading-5 text-gray-500">The intake has been written across the existing operational registers and is traceable under one audit correlation.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ['Customer', result.customer.id],
        ['Vehicle', result.vehicle.id],
        ['Intake', result.intake.id],
        ['Appointment', result.appointment.id],
        ['Job / Kanban', result.job?.id ?? 'Not opened'],
        ['Audit correlation', result.correlationId],
      ].map(([label, value]) => (
        <div key={label} className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
          <div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div>
          <div className="mt-2 break-all text-xs text-white">{value}</div>
        </div>
      ))}
    </div>
    <div className="mt-6 flex flex-wrap gap-2">
      {result.job && (
        <>
          <button onClick={() => onNavigate(`job-cards?job=${result.job?.id}`)} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-4 text-xs font-semibold text-black"><ExternalLink size={14} /> Open Job Card</button>
          <button onClick={() => onNavigate('job-board')} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300"><ExternalLink size={14} /> Open Kanban</button>
        </>
      )}
      <button onClick={() => onNavigate('appointments')} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300"><CalendarClock size={14} /> Appointment register</button>
      <button onClick={onReset} className="min-h-11 rounded-lg border border-white/[0.08] px-4 text-xs text-gray-500 hover:text-white">Start another intake</button>
    </div>
  </section>
);

const SectionTitle = ({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) => (
  <div className="mb-6 flex items-start gap-3 border-b border-white/[0.08] pb-5">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-vertical-accent/25 bg-vertical-accent-glow text-vertical-accent">{icon}</span>
    <div><h2 className="text-base font-medium text-white">{title}</h2><p className="mt-1 max-w-3xl text-[11px] leading-5 text-gray-600">{detail}</p></div>
  </div>
);
const ModeSwitch = ({ value, onChange, existing, fresh }: { value: 'existing' | 'new'; onChange: (value: 'existing' | 'new') => void; existing: string; fresh: string }) => (
  <div className="mb-5 inline-flex rounded-lg border border-white/[0.08] bg-black/25 p-1">
    <button onClick={() => onChange('existing')} className={`min-h-9 rounded-md px-3 text-[10px] ${value === 'existing' ? 'bg-white/10 text-white' : 'text-gray-600'}`}>{existing}</button>
    <button onClick={() => onChange('new')} className={`min-h-9 rounded-md px-3 text-[10px] ${value === 'new' ? 'bg-white/10 text-white' : 'text-gray-600'}`}>{fresh}</button>
  </div>
);
const fieldClass = 'mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white outline-none placeholder:text-gray-700 focus:border-vertical-accent';
const TextField = ({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}{required ? ' *' : ''}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} /></label>
);
const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><input type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} className={fieldClass} /></label>
);
const TextArea = ({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}{required ? ' *' : ''}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} min-h-24 py-3`} /></label>
);
const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}><option value="">Select {label.toLowerCase()}</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
);
const CheckField = ({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) => (
  <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-4 text-[11px] leading-5 text-gray-400"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--theme-accent)]" /><span>{label}</span></label>
);
const ReviewCard = ({ title, rows }: { title: string; rows: string[][] }) => (
  <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4"><div className="text-xs font-medium text-white">{title}</div><div className="mt-4 space-y-2">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-[10px]"><span className="text-gray-600">{label}</span><span className="max-w-[65%] text-right text-gray-300">{value || '—'}</span></div>)}</div></div>
);
const option = (value: string) => ({ value, label: value });
