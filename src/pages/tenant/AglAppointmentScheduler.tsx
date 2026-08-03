import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  Car,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { GlassPanel } from '../../components/ui/GlassPanel';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import {
  aglAppointmentWorkflow,
  type AppointmentBooking,
} from '../../erp/agl/appointmentWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const bays = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'Bay 6'];
const hours = Array.from({ length: 11 }, (_, index) => index + 8);
const today = new Date().toISOString().slice(0, 10);
const initialBooking: AppointmentBooking = {
  customerId: '',
  vehicleId: '',
  service: '',
  customerComplaint: '',
  date: today,
  time: '09:00',
  durationMinutes: 60,
  mechanic: 'Unassigned',
  bay: 'Unassigned',
  advisor: 'Briana Owusu',
  expectedCollection: '',
  notes: '',
  confirmNow: true,
};

export const AglAppointmentScheduler = ({ tenant }: { tenant: Tenant }) => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [date, setDate] = useState(today);
  const [selectedId, setSelectedId] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState<AppointmentBooking>(initialBooking);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const appointments = useMemo(() => aglAppointmentWorkflow.appointments(), [version]);
  const customers = useMemo(() => aglAppointmentWorkflow.customers(), [version]);
  const vehicles = useMemo(() => aglAppointmentWorkflow.vehicles(booking.customerId), [booking.customerId, version]);
  const mechanics = useMemo(() => aglAppointmentWorkflow.mechanics(), [version]);
  const dayAppointments = useMemo(() => appointments
    .filter((item) => item.date === date && item.status !== 'Cancelled')
    .sort((a, b) => String(a.time).localeCompare(String(b.time))), [appointments, date]);
  const selected = appointments.find((item) => item.id === selectedId);
  const conflicts = useMemo(() => aglAppointmentWorkflow.conflicts(booking), [booking, version]);

  useEffect(() => {
    if (bookingOpen) setBooking((current) => ({ ...current, date }));
  }, [date, bookingOpen]);

  const openBooking = (bay = 'Unassigned', time = '09:00') => {
    setBooking({ ...initialBooking, date, bay, time });
    setBookingOpen(true);
    setError('');
    setNotice('');
  };

  const saveBooking = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const created = aglAppointmentWorkflow.book({ actor, booking });
      setSelectedId(created.id);
      setBookingOpen(false);
      setNotice(`${created.id} booked for ${String(created.date)} at ${String(created.time)}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The appointment could not be booked.');
    }
  };

  const run = (action: () => unknown, confirmation: string) => {
    setError('');
    try {
      action();
      setNotice(confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The appointment action could not be completed.');
    }
  };

  const openJob = (appointment: AglOperationalRecord) => {
    setError('');
    try {
      const result = aglAppointmentWorkflow.openJob(appointment.id, actor);
      navigate(`/${tenant.verticalId}/tenant/${tenant.id}/erp/job-cards?job=${result.job.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The work order could not be opened.');
    }
  };

  const confirmed = dayAppointments.filter((item) => item.status === 'Confirmed').length;
  const checkedIn = dayAppointments.filter((item) => item.status === 'Checked in').length;
  const occupiedBays = new Set(dayAppointments.filter((item) => item.bay && item.bay !== 'Unassigned').map((item) => item.bay)).size;

  return (
    <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-[1760px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vertical-accent">
            <ShieldCheck size={13} /> {tenant.id.toUpperCase()} ERP / service capacity
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold tracking-tight text-white">Appointment control</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">
            Reserve the actual bay and mechanic, surface conflicts before commitment, check the vehicle in, and open the linked VSR without re-keying the booking.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] bg-black/25 px-3 text-xs text-gray-400">
            <CalendarClock size={14} />
            <input aria-label="Schedule date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="bg-transparent text-white outline-none" />
          </label>
          <button onClick={() => openBooking()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">
            <Plus size={14} /> Book appointment
          </button>
        </div>
      </header>

      {(notice || error) && (
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}>
          <span className="flex items-center gap-2">{error ? <AlertTriangle size={14} /> : <Check size={14} />}{error || notice}</span>
          <button onClick={() => { setError(''); setNotice(''); }} className="rounded p-1 hover:bg-white/5" aria-label="Dismiss message"><X size={13} /></button>
        </div>
      )}

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
        <CapacitySignal label="Scheduled" value={String(dayAppointments.length)} detail={date} />
        <CapacitySignal label="Confirmed" value={String(confirmed)} detail="Customer commitment" />
        <CapacitySignal label="Checked in" value={String(checkedIn)} detail="Vehicles on site" />
        <CapacitySignal label="Bay load" value={`${occupiedBays}/${bays.length}`} detail="Reserved today" warning={occupiedBays >= bays.length} />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_370px]">
        <GlassPanel className="overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <div><h2 className="text-sm font-medium text-white">Bay capacity rail</h2><p className="mt-1 text-[10px] text-gray-600">08:00–18:00 · select a booking for controls</p></div>
            <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Conflicts blocked before save</span>
          </div>
          <div className="custom-scrollbar overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[86px_1fr] border-b border-white/[0.06]">
                <div className="border-r border-white/[0.06] p-3 font-mono text-[8px] uppercase text-gray-600">Resource</div>
                <div className="grid grid-cols-11">
                  {hours.map((hour) => <div key={hour} className="border-r border-white/[0.04] px-2 py-3 font-mono text-[8px] text-gray-600">{String(hour).padStart(2, '0')}:00</div>)}
                </div>
              </div>
              {bays.map((bay) => {
                const bayAppointments = dayAppointments.filter((item) => item.bay === bay);
                return (
                  <div key={bay} className="grid min-h-[82px] grid-cols-[86px_1fr] border-b border-white/[0.05] last:border-b-0">
                    <button onClick={() => openBooking(bay)} className="border-r border-white/[0.06] px-3 text-left transition hover:bg-white/[0.03]">
                      <span className="block text-[11px] font-medium text-gray-300">{bay}</span>
                      <span className="mt-1 block font-mono text-[8px] uppercase text-gray-700">{bayAppointments.length ? `${bayAppointments.length} booked` : 'Open'}</span>
                    </button>
                    <div className="relative bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:9.0909%_100%]">
                      {bayAppointments.map((appointment) => {
                        const start = timeToMinutes(String(appointment.time ?? '08:00'));
                        const duration = Number(appointment.durationMinutes ?? 60);
                        const left = Math.max(0, ((start - 480) / 600) * 100);
                        const width = Math.max(5, Math.min(100 - left, (duration / 600) * 100));
                        return (
                          <button
                            key={appointment.id}
                            onClick={() => setSelectedId(appointment.id)}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            className={`absolute top-3 min-h-[56px] overflow-hidden rounded-lg border p-2 text-left transition hover:z-10 hover:brightness-125 ${
                              selectedId === appointment.id
                                ? 'z-10 border-vertical-accent/70 bg-vertical-accent text-black'
                                : appointment.status === 'Checked in'
                                  ? 'border-cyan-400/30 bg-cyan-400/[0.12] text-cyan-100'
                                  : 'border-white/[0.1] bg-[#121212] text-gray-300'
                            }`}
                          >
                            <span className="block truncate font-mono text-[8px]">{String(appointment.time)} · {appointment.id}</span>
                            <span className="mt-1 block truncate text-[9px] font-medium">{String(appointment.vehicle)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="grid min-h-[70px] grid-cols-[86px_1fr]">
                <div className="border-r border-white/[0.06] px-3 py-4 text-[10px] text-gray-600">Unassigned</div>
                <div className="flex flex-wrap gap-2 p-3">
                  {dayAppointments.filter((item) => !item.bay || item.bay === 'Unassigned').map((item) => (
                    <button key={item.id} onClick={() => setSelectedId(item.id)} className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-left">
                      <span className="block font-mono text-[8px] text-amber-300">{String(item.time)} · {item.id}</span>
                      <span className="mt-1 block text-[9px] text-gray-300">{String(item.vehicle)}</span>
                    </button>
                  ))}
                  {!dayAppointments.some((item) => !item.bay || item.bay === 'Unassigned') && <span className="text-[10px] text-gray-700">No unassigned capacity.</span>}
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        <aside className="space-y-4">
          <GlassPanel className="rounded-xl p-5">
            {selected ? (
              <AppointmentControls
                appointment={selected}
                cancelReason={cancelReason}
                onCancelReason={setCancelReason}
                onConfirm={() => run(() => aglAppointmentWorkflow.confirm(selected.id, actor), `${selected.id} confirmed.`)}
                onCheckIn={() => run(() => aglAppointmentWorkflow.checkIn(selected.id, actor), `${selected.id} checked in.`)}
                onOpenJob={() => openJob(selected)}
                onCancel={() => run(() => {
                  aglAppointmentWorkflow.cancel(selected.id, actor, cancelReason);
                  setCancelReason('');
                }, `${selected.id} cancelled with reason retained.`)}
              />
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <Clock3 size={24} className="text-gray-700" />
                <div className="mt-3 text-xs text-gray-400">Select a booking</div>
                <p className="mt-2 max-w-56 text-[10px] leading-4 text-gray-600">Customer, vehicle, capacity, check-in, and VSR controls appear here.</p>
              </div>
            )}
          </GlassPanel>
          <GlassPanel className="rounded-xl p-5">
            <div className="text-xs font-medium text-white">Day queue</div>
            <div className="mt-4 space-y-2">
              {dayAppointments.map((appointment) => (
                <button key={appointment.id} onClick={() => setSelectedId(appointment.id)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3 text-left hover:border-white/[0.14]">
                  <span><span className="block font-mono text-[8px] text-vertical-accent">{String(appointment.time)} · {appointment.id}</span><span className="mt-1 block text-[10px] text-gray-300">{String(appointment.customer)}</span></span>
                  <span className="font-mono text-[8px] uppercase text-gray-600">{appointment.status}</span>
                </button>
              ))}
              {!dayAppointments.length && <div className="rounded-lg border border-dashed border-white/[0.07] p-5 text-center text-[10px] text-gray-600">No appointments on this date.</div>}
            </div>
          </GlassPanel>
        </aside>
      </div>

      {bookingOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onClick={() => setBookingOpen(false)}>
          <motion.aside initial={{ x: 620 }} animate={{ x: 0 }} onClick={(event) => event.stopPropagation()} className="custom-scrollbar h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#080808] p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div><div className="font-mono text-[9px] uppercase tracking-wider text-vertical-accent">Capacity commitment</div><h2 className="mt-2 text-xl font-medium text-white">Book appointment</h2><p className="mt-1 text-xs text-gray-600">The vehicle list follows the selected customer. Bay and mechanic conflicts are blocked.</p></div>
              <button onClick={() => setBookingOpen(false)} aria-label="Close booking" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={saveBooking} className="mt-6 grid gap-4 sm:grid-cols-2">
              <SelectField label="Customer" required value={booking.customerId} onChange={(customerId) => setBooking((current) => ({ ...current, customerId, vehicleId: '' }))} options={customers.map((item) => ({ value: item.id, label: `${String(item.name)} · ${String(item.phone ?? item.id)}` }))} />
              <SelectField label="Vehicle" required value={booking.vehicleId} onChange={(vehicleId) => setBooking((current) => ({ ...current, vehicleId }))} options={vehicles.map((item) => ({ value: item.id, label: `${String(item.registration)} · ${String(item.vehicle)}` }))} />
              <TextField label="Service requested" required value={booking.service} onChange={(service) => setBooking((current) => ({ ...current, service }))} />
              <TextField label="Service advisor" required value={booking.advisor} onChange={(advisor) => setBooking((current) => ({ ...current, advisor }))} />
              <TextField label="Date" type="date" required value={booking.date} onChange={(nextDate) => setBooking((current) => ({ ...current, date: nextDate }))} />
              <TextField label="Start time" type="time" required value={booking.time} onChange={(time) => setBooking((current) => ({ ...current, time }))} />
              <SelectField label="Duration" value={String(booking.durationMinutes)} onChange={(duration) => setBooking((current) => ({ ...current, durationMinutes: Number(duration) }))} options={[30, 60, 90, 120, 180, 240].map((value) => ({ value: String(value), label: `${value} minutes` }))} />
              <SelectField label="Bay" value={booking.bay} onChange={(bay) => setBooking((current) => ({ ...current, bay }))} options={['Unassigned', ...bays].map(option)} />
              <SelectField label="Mechanic" value={booking.mechanic} onChange={(mechanic) => setBooking((current) => ({ ...current, mechanic }))} options={['Unassigned', ...mechanics.map((item) => String(item.name))].map(option)} />
              <TextField label="Expected collection" type="datetime-local" value={booking.expectedCollection ?? ''} onChange={(expectedCollection) => setBooking((current) => ({ ...current, expectedCollection }))} />
              <div className="sm:col-span-2"><TextArea label="Customer complaint" required value={booking.customerComplaint} onChange={(customerComplaint) => setBooking((current) => ({ ...current, customerComplaint }))} /></div>
              <div className="sm:col-span-2"><TextArea label="Booking notes" value={booking.notes ?? ''} onChange={(notes) => setBooking((current) => ({ ...current, notes }))} /></div>
              <label className="flex min-h-14 items-center gap-3 rounded-lg border border-white/[0.08] bg-black/20 p-4 text-[11px] text-gray-400 sm:col-span-2"><input type="checkbox" checked={booking.confirmNow} onChange={(event) => setBooking((current) => ({ ...current, confirmNow: event.target.checked }))} className="h-4 w-4 accent-[var(--theme-accent)]" />Customer has confirmed this slot.</label>
              {conflicts.length > 0 && (
                <div className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-4 text-[11px] text-red-300 sm:col-span-2">
                  {conflicts.map((conflict) => <div key={`${conflict.type}-${conflict.appointmentId}`}>{conflict.message}</div>)}
                </div>
              )}
              {error && <div className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-3 text-xs text-red-300 sm:col-span-2">{error}</div>}
              <div className="flex justify-end gap-2 border-t border-white/[0.08] pt-5 sm:col-span-2">
                <button type="button" onClick={() => setBookingOpen(false)} className="min-h-11 rounded-lg border border-white/[0.08] px-4 text-xs text-gray-400">Cancel</button>
                <button type="submit" disabled={conflicts.length > 0 || !booking.customerId || !booking.vehicleId || !booking.service.trim() || !booking.customerComplaint.trim()} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black disabled:opacity-35"><CalendarClock size={14} /> Save appointment</button>
              </div>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </motion.div>
  );
};

const AppointmentControls = ({
  appointment, cancelReason, onCancelReason, onConfirm, onCheckIn, onOpenJob, onCancel,
}: {
  appointment: AglOperationalRecord;
  cancelReason: string;
  onCancelReason: (value: string) => void;
  onConfirm: () => void;
  onCheckIn: () => void;
  onOpenJob: () => void;
  onCancel: () => void;
}) => (
  <div>
    <div className="flex items-start justify-between gap-3">
      <div><div className="font-mono text-[9px] text-vertical-accent">{appointment.id}</div><div className="mt-2 text-base font-medium text-white">{String(appointment.vehicle)}</div><div className="mt-1 text-[10px] text-gray-600">{String(appointment.registration ?? '')}</div></div>
      <span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-400">{appointment.status}</span>
    </div>
    <div className="mt-5 space-y-3 border-y border-white/[0.07] py-4 text-[10px]">
      <Detail icon={<UserRound size={13} />} label="Customer" value={String(appointment.customer)} />
      <Detail icon={<Clock3 size={13} />} label="Slot" value={`${String(appointment.date)} · ${String(appointment.time)} · ${String(appointment.durationMinutes ?? 60)} min`} />
      <Detail icon={<Wrench size={13} />} label="Capacity" value={`${String(appointment.bay ?? 'Unassigned')} · ${String(appointment.mechanic ?? 'Unassigned')}`} />
      <Detail icon={<Car size={13} />} label="Complaint" value={String(appointment.customerComplaint ?? appointment.service)} />
    </div>
    <div className="mt-4 grid gap-2">
      {appointment.status === 'Requested' && <ActionButton label="Confirm appointment" onClick={onConfirm} />}
      {['Requested', 'Confirmed'].includes(appointment.status) && <ActionButton label="Check vehicle in" onClick={onCheckIn} />}
      {['Confirmed', 'Checked in'].includes(appointment.status) && <ActionButton label="Open linked VSR Job Card" onClick={onOpenJob} primary />}
      {appointment.status === 'Converted' && <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-3 text-[10px] text-emerald-300">Converted to workshop work. Open it from Job Cards or the Kanban.</div>}
    </div>
    {!['Converted', 'Cancelled'].includes(appointment.status) && (
      <div className="mt-5 border-t border-white/[0.07] pt-4">
        <label className="font-mono text-[8px] uppercase tracking-wider text-gray-600">Cancellation reason</label>
        <textarea value={cancelReason} onChange={(event) => onCancelReason(event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-white/[0.08] bg-black/25 p-3 text-xs text-white outline-none focus:border-red-400/40" />
        <button disabled={!cancelReason.trim()} onClick={onCancel} className="mt-2 min-h-9 w-full rounded-lg border border-red-400/20 text-[9px] text-red-300 disabled:opacity-30">Cancel and retain reason</button>
      </div>
    )}
  </div>
);

const CapacitySignal = ({ label, value, detail, warning = false }: { label: string; value: string; detail: string; warning?: boolean }) => (
  <div className="bg-[#090909] px-5 py-4"><div className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</div><div className={`mt-2 text-xl font-display ${warning ? 'text-amber-300' : 'text-white'}`}>{value}</div><div className="mt-1 text-[9px] text-gray-700">{detail}</div></div>
);
const Detail = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="grid grid-cols-[18px_70px_1fr] gap-2 text-gray-500"><span className="text-gray-700">{icon}</span><span>{label}</span><span className="text-right text-gray-300">{value}</span></div>
);
const ActionButton = ({ label, onClick, primary = false }: { label: string; onClick: () => void; primary?: boolean }) => (
  <button onClick={onClick} className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-[10px] ${primary ? 'bg-vertical-accent font-semibold text-black' : 'border border-white/[0.08] text-gray-300'}`}>{label}<ChevronRight size={13} /></button>
);
const fieldClass = 'mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white outline-none focus:border-vertical-accent';
const TextField = ({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}{required ? ' *' : ''}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} /></label>
);
const TextArea = ({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}{required ? ' *' : ''}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} min-h-24 py-3`} /></label>
);
const SelectField = ({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; required?: boolean }) => (
  <label className="block"><span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}{required ? ' *' : ''}</span><select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}><option value="">Select {label.toLowerCase()}</option>{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
);
const option = (value: string) => ({ value, label: value });
const timeToMinutes = (time: string) => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return hour * 60 + minute;
};
