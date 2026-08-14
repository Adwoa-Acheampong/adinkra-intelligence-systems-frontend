import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  GraduationCap,
  Pencil,
  Plus,
  Printer,
  Search,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import { aglWorkforceWorkflow } from '../../erp/agl/workforceWorkflow';
import { aglErpRepository } from '../../erp/agl/repository';

const actor = { name: 'AGL Admin', role: 'Administrator' };
type WorkforceMode = 'employees' | 'departments' | 'schedules' | 'training' | 'performance' | 'payslips';
const money = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 2 });
const departmentOptions = ['Workshop', 'Inventory', 'Sales', 'Finance', 'People & HR', 'Marketing', 'Management', 'Administration'];
const roleOptions = ['Apprentice Mechanic', 'Mechanic', 'Senior Mechanic', 'Master Technician', 'Workshop Supervisor', 'Service Advisor', 'Inventory Attendant', 'Parts Specialist', 'Sales Executive', 'Finance Officer', 'HR Officer', 'Operations Manager', 'Administrator'];
const peopleOwnerOptions = ['Alex Morgan', 'Bekoe Adu Benjamin', 'AGL Admin'];
const locationOptions = ['AGL Main Workshop', 'Spintex Service Bay', 'Mobile Service Unit', 'Parts Warehouse', 'Head Office'];
const trainingCourseOptions = ['Workplace safety', 'Bosch diagnostics', 'Hybrid & EV safety', 'Customer service', 'Inventory controls', 'Data protection', 'Supervisor essentials'];
const trainingProviderOptions = ['AGL Learning', 'Bosch Ghana', 'Toyota Ghana', 'DVLA Ghana', 'Ghana Employers Association'];

const meta: Record<WorkforceMode, { eyebrow: string; title: string; detail: string; icon: React.ReactNode }> = {
  employees: { eyebrow: 'people / employee master', title: 'Employee directory', detail: 'Maintain the governed employee identity, contact details, role, department, employment state, and current terms.', icon: <Users size={13} /> },
  departments: { eyebrow: 'people / organization', title: 'Departments', detail: 'See the operating structure and drill into the roster attached to each department.', icon: <Building2 size={13} /> },
  schedules: { eyebrow: 'people / planned shifts', title: 'Staff schedules', detail: 'Plan shifts independently from actual attendance, then confirm, complete, or cancel each assignment.', icon: <CalendarDays size={13} /> },
  training: { eyebrow: 'people / competency', title: 'Training & certifications', detail: 'Assign training, retain completion evidence, and expose certification expiry risk.', icon: <GraduationCap size={13} /> },
  performance: { eyebrow: 'people / operational output', title: 'Mechanic performance', detail: 'Derive assigned work, completed jobs, revenue contribution, quality, recalls, complaints, and a transparent score from source records.', icon: <Trophy size={13} /> },
  payslips: { eyebrow: 'people / payroll evidence', title: 'Payslips', detail: 'Review payroll-generated payslips and transfer an employee copy to print or PDF.', icon: <FileCheck2 size={13} /> },
};

export const AglWorkforceWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: WorkforceMode }) => {
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
      operation();
      setNotice(confirmation);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The workforce operation could not be completed.');
      return false;
    }
  };
  const descriptor = meta[moduleId];
  return (
    <div className="mx-auto max-w-[1740px] space-y-5 pb-12">
      <header className="agl-no-print border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{descriptor.icon} {tenant.id.toUpperCase()} ERP / {descriptor.eyebrow}</div>
        <h1 className="mt-3 text-3xl font-display font-semibold text-white">{descriptor.title}</h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">{descriptor.detail}</p>
      </header>
      <div className="agl-no-print">{(notice || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span>{error || notice}</span><button onClick={() => { setNotice(''); setError(''); }}><X size={13} /></button></div>}</div>
      {moduleId === 'employees' && <EmployeesView revision={revision} run={run} />}
      {moduleId === 'departments' && <DepartmentsView revision={revision} />}
      {moduleId === 'schedules' && <SchedulesView revision={revision} run={run} />}
      {moduleId === 'training' && <TrainingView revision={revision} run={run} />}
      {moduleId === 'performance' && <PerformanceView revision={revision} />}
      {moduleId === 'payslips' && <PayslipsView revision={revision} />}
    </div>
  );
};

const EmployeesView = ({ revision, run }: { revision: number; run: (operation: () => unknown, confirmation: string) => boolean }) => {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [editing, setEditing] = useState<AglOperationalRecord | 'new' | null>(null);
  const employees = useMemo(() => aglWorkforceWorkflow.employees(), [revision]);
  const departments = ['All departments', ...Array.from(new Set(employees.map((employee) => String(employee.department))))];
  const filtered = employees.filter((employee) => (
    (!query.trim() || JSON.stringify(employee).toLowerCase().includes(query.toLowerCase()))
    && (department === 'All departments' || employee.department === department)
  ));
  return (
    <>
      <div className="agl-no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <label className="relative block max-w-xl flex-1"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, role, skill, contact…" className="h-11 w-full rounded-lg border border-white/[0.1] bg-black/25 pl-9 pr-3 text-xs text-white" /></label>
          <select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-11 rounded-lg border border-white/[0.1] bg-[#070707] px-3 text-xs text-white">{departments.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <button onClick={() => setEditing('new')} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black"><Plus size={14} /> Add employee</button>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((employee) => (
          <article key={employee.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-4">
            <div className="flex items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] text-sm text-cyan-200">{String(employee.name).split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><button onClick={() => setEditing(employee)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-600 hover:text-cyan-300"><Pencil size={13} /></button></div>
            <h2 className="mt-4 text-sm text-white">{String(employee.name)}</h2>
            <p className="mt-1 text-[10px] text-gray-500">{String(employee.role)}</p>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-cyan-300"><BriefcaseBusiness size={12} /> {String(employee.department)}</div>
            <dl className="mt-4 space-y-2 border-t border-white/[0.07] pt-3 text-[9px]"><Row label="Phone" value={employee.phone} /><Row label="Email" value={employee.email} /><Row label="Pay basis" value={employee.payBasis} /><Row label="Contracted pay" value={money.format(Number(employee.basePayGhs ?? 0))} /><Row label="Work envelope" value={employee.payrollOnly === true ? 'Payroll-only' : `${String(employee.workStart ?? '08:00')}–${String(employee.workEnd ?? '18:00')}`} /><Row label="Compliance" value={employee.ghanaCardId || employee.ssnitNumber ? 'Identity captured' : 'Pending'} /><Row label="State" value={employee.status} /></dl>
          </article>
        ))}
      </section>
      {editing && <EmployeeEditor record={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSave={(values) => run(() => editing !== 'new' && editing.id ? aglWorkforceWorkflow.updateEmployee(actor, editing.id, values) : aglWorkforceWorkflow.addEmployee(actor, values as any), `${values.name} saved.`)} />}
    </>
  );
};

const DepartmentsView = ({ revision }: { revision: number }) => {
  const departments = useMemo(() => aglWorkforceWorkflow.departments(), [revision]);
  const total = departments.reduce((sum, department) => sum + department.employees.length, 0);
  return (
    <>
      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3"><Signal label="Departments" value={departments.length} /><Signal label="Roster positions" value={total} /><Signal label="Largest department" value={departments.sort((a, b) => b.employees.length - a.employees.length)[0]?.name ?? '—'} /></section>
      <section className="grid gap-4 lg:grid-cols-2">
        {departments.map((department) => <article key={department.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-cyan-300"><Building2 size={16} /></span><div><h2 className="text-sm text-white">{department.name}</h2><p className="mt-1 font-mono text-[8px] text-gray-600">{department.id}</p></div></div><span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-gray-500">{department.employees.length} people</span></div><div className="mt-5 space-y-2">{department.employees.map((employee) => <div key={employee.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/20 px-3 py-3"><div><div className="text-[10px] text-gray-300">{String(employee.name)}</div><div className="mt-1 text-[8px] text-gray-600">{String(employee.role)}</div></div><Status value={employee.status} /></div>)}</div></article>)}
      </section>
    </>
  );
};

const SchedulesView = ({ revision, run }: { revision: number; run: (operation: () => unknown, confirmation: string) => void }) => {
  const employees = useMemo(() => aglWorkforceWorkflow.employees().filter((item) => item.status === 'Active'), [revision]);
  const schedules = useMemo(() => aglWorkforceWorkflow.schedules().sort((a, b) => String(a.date).localeCompare(String(b.date))), [revision]);
  const [values, setValues] = useState({ employeeId: employees[0]?.id ?? '', date: new Date().toISOString().slice(0, 10), startTime: '08:00', endTime: '18:00', location: 'AGL Main Workshop', shiftType: 'Standard', notes: '' });
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<'calendar' | 'ledger'>('calendar');
  useEffect(() => { if (!values.employeeId && employees[0]) setValues((current) => ({ ...current, employeeId: employees[0].id })); }, [employees, values.employeeId]);
  const weekDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [weekOffset]);
  const firstDay = weekDays[0].toISOString().slice(0, 10);
  const lastDay = weekDays[6].toISOString().slice(0, 10);
  const weekSchedules = schedules.filter((schedule) => {
    const date = String(schedule.date ?? schedule.createdAt).slice(0, 10);
    return date >= firstDay && date <= lastDay;
  });
  const scheduledEmployees = new Set(weekSchedules.map((item) => String(item.employeeId ?? item.reference))).size;
  const uncoveredDays = weekDays.filter((day) => !weekSchedules.some((item) => String(item.date ?? item.createdAt).slice(0, 10) === day.toISOString().slice(0, 10))).length;
  return (
    <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
      <form onSubmit={(event) => { event.preventDefault(); run(() => aglWorkforceWorkflow.createSchedule(actor, values), 'Shift scheduled.'); }} className="h-fit space-y-4 rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div><h2 className="text-sm text-white">Plan shift</h2><p className="mt-1 text-[9px] leading-4 text-gray-600">Select an empty calendar day to seed the date, then assign the employee, time, and location.</p></div><Field label="Employee" value={values.employeeId} onChange={(value) => setValues({ ...values, employeeId: value })} options={employees.map((employee) => ({ value: employee.id, label: `${String(employee.name)} · ${String(employee.role)}` }))} /><Field label="Date" type="date" value={values.date} onChange={(value) => setValues({ ...values, date: value })} /><div className="grid grid-cols-2 gap-3"><Field label="Start" type="time" value={values.startTime} onChange={(value) => setValues({ ...values, startTime: value })} /><Field label="End" type="time" value={values.endTime} onChange={(value) => setValues({ ...values, endTime: value })} /></div><Field label="Location" value={values.location} onChange={(value) => setValues({ ...values, location: value })} options={locationOptions.map((item) => ({ value: item, label: item }))} /><Field label="Shift type" value={values.shiftType} onChange={(value) => setValues({ ...values, shiftType: value })} options={['Standard', 'Early', 'Late', 'On-call', 'Training'].map((item) => ({ value: item, label: item }))} /><Field label="Notes" value={values.notes} onChange={(value) => setValues({ ...values, notes: value })} /><button className="min-h-11 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Create shift</button></form>
      <div className="min-w-0 space-y-4">
        <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3"><Signal label="Shifts this week" value={weekSchedules.length} /><Signal label="People scheduled" value={`${scheduledEmployees} / ${employees.length}`} /><Signal label="Uncovered days" value={uncoveredDays} /></section>
        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><button type="button" aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-400"><ChevronLeft size={14} /></button><div className="min-w-48 text-center font-mono text-[9px] text-gray-300">{weekDays[0].toLocaleDateString()} – {weekDays[6].toLocaleDateString()}</div><button type="button" aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-400"><ChevronRight size={14} /></button><button type="button" onClick={() => setWeekOffset(0)} className="min-h-9 rounded-lg px-3 text-[9px] text-cyan-300">This week</button></div><div className="inline-flex rounded-lg border border-white/[0.08] bg-black/25 p-1"><button type="button" onClick={() => setView('calendar')} className={`min-h-8 rounded-md px-3 text-[9px] ${view === 'calendar' ? 'bg-cyan-300 text-black' : 'text-gray-500'}`}>Week planner</button><button type="button" onClick={() => setView('ledger')} className={`min-h-8 rounded-md px-3 text-[9px] ${view === 'ledger' ? 'bg-cyan-300 text-black' : 'text-gray-500'}`}>Schedule ledger</button></div></div>
        {view === 'calendar' ? <section className="grid min-w-[980px] grid-cols-7 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.06]">
          {weekDays.map((day) => {
            const date = day.toISOString().slice(0, 10);
            const daySchedules = weekSchedules.filter((schedule) => String(schedule.date ?? schedule.createdAt).slice(0, 10) === date);
            return <div key={date} className="min-h-80 bg-[#090909]"><button type="button" onClick={() => setValues((current) => ({ ...current, date }))} className={`w-full border-b border-white/[0.07] px-3 py-3 text-left ${values.date === date ? 'bg-cyan-300/[0.07]' : 'bg-black/15'}`}><div className="font-mono text-[8px] uppercase text-gray-600">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div><div className="mt-1 text-sm text-gray-200">{day.getDate()}</div></button><div className="space-y-2 p-2">{daySchedules.map((schedule) => <article key={schedule.id} className="rounded-lg border border-white/[0.07] bg-black/25 p-3"><div className="text-[9px] text-gray-200">{String(schedule.name)}</div><div className="mt-1 font-mono text-[8px] text-cyan-300">{String(schedule.startTime ?? '08:00')}–{String(schedule.endTime ?? '18:00')}</div><div className="mt-1 truncate text-[8px] text-gray-600">{String(schedule.location ?? 'AGL Main Workshop')}</div><select aria-label={`Status for ${String(schedule.name)} on ${date}`} value={schedule.status} onChange={(event) => run(() => aglWorkforceWorkflow.updateScheduleStatus(actor, schedule.id, event.target.value), `${schedule.id} moved to ${event.target.value}.`)} className="mt-3 h-8 w-full rounded-md border border-white/[0.08] bg-[#050505] px-2 font-mono text-[7px] uppercase text-gray-300">{['Draft', 'Pending', 'Approved', 'Completed', 'Cancelled'].map((state) => <option key={state}>{state}</option>)}</select></article>)}{!daySchedules.length && <button type="button" onClick={() => setValues((current) => ({ ...current, date }))} className="min-h-24 w-full rounded-lg border border-dashed border-white/[0.07] text-[8px] text-gray-700">No shift · add</button>}</div></div>;
          })}
        </section> : <section className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-black/20 font-mono text-[8px] uppercase text-gray-600"><tr><th className="px-5 py-3 font-normal">Date</th><th className="px-5 py-3 font-normal">Employee</th><th className="px-5 py-3 font-normal">Shift</th><th className="px-5 py-3 font-normal">Location</th><th className="px-5 py-3 font-normal">State</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{schedules.map((schedule) => <tr key={schedule.id}><td className="px-5 py-4 font-mono text-gray-400">{String(schedule.date ?? schedule.createdAt).slice(0, 10)}</td><td className="px-5 py-4"><div className="text-gray-200">{String(schedule.name)}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{String(schedule.reference)}</div></td><td className="px-5 py-4 text-gray-400">{String(schedule.startTime ?? '08:00')} – {String(schedule.endTime ?? '18:00')} · {String(schedule.shiftType ?? 'Standard')}</td><td className="px-5 py-4 text-gray-500">{String(schedule.location ?? 'AGL Main Workshop')}</td><td className="px-5 py-4"><select value={schedule.status} onChange={(event) => run(() => aglWorkforceWorkflow.updateScheduleStatus(actor, schedule.id, event.target.value), `${schedule.id} moved to ${event.target.value}.`)} className="h-9 rounded-lg border border-white/[0.08] bg-[#050505] px-2 font-mono text-[8px] uppercase text-gray-300">{['Draft', 'Pending', 'Approved', 'Completed', 'Cancelled'].map((state) => <option key={state}>{state}</option>)}</select></td></tr>)}</tbody></table></section>}
      </div>
    </div>
  );
};

const requiredTrainingCourses = (employee: AglOperationalRecord) => {
  const department = String(employee.department ?? '').toLowerCase();
  const role = String(employee.role ?? '').toLowerCase();
  const required = new Set(['Workplace safety', 'Data protection']);
  if (department.includes('workshop')) required.add('Bosch diagnostics');
  if (/(mechanic|technician|supervisor)/.test(role)) required.add('Hybrid & EV safety');
  if (department.includes('sales') || /(sales|advisor)/.test(role)) required.add('Customer service');
  if (department.includes('inventory') || /(inventory|parts)/.test(role)) required.add('Inventory controls');
  if (/(manager|supervisor)/.test(role)) required.add('Supervisor essentials');
  return required;
};

const TrainingView = ({ revision, run }: { revision: number; run: (operation: () => unknown, confirmation: string) => void }) => {
  const employees = useMemo(() => aglWorkforceWorkflow.employees().filter((item) => item.status === 'Active'), [revision]);
  const training = useMemo(() => aglWorkforceWorkflow.training(), [revision]);
  const [values, setValues] = useState({
    employeeId: employees[0]?.id ?? '',
    course: trainingCourseOptions[0],
    provider: trainingProviderOptions[0],
    dueDate: new Date().toISOString().slice(0, 10),
    certification: 'Internal completion',
    expiryDate: '',
    notes: '',
  });
  const [view, setView] = useState<'matrix' | 'log'>('matrix');
  const [evidenceById, setEvidenceById] = useState<Record<string, string>>({});
  useEffect(() => { if (!values.employeeId && employees[0]) setValues((current) => ({ ...current, employeeId: employees[0].id })); }, [employees, values.employeeId]);

  const latestTraining = useMemo(() => {
    const records = [...training].sort((a, b) => String(b.completedAt ?? b.createdAt).localeCompare(String(a.completedAt ?? a.createdAt)));
    const latest = new Map<string, AglOperationalRecord>();
    records.forEach((item) => {
      const key = `${String(item.employeeId ?? item.reference)}::${String(item.course ?? item.name)}`;
      if (!latest.has(key)) latest.set(key, item);
    });
    return latest;
  }, [training]);
  const today = new Date();
  const coverage = employees.flatMap((employee) => trainingCourseOptions.map((course) => {
    const required = requiredTrainingCourses(employee).has(course);
    const record = latestTraining.get(`${employee.id}::${course}`);
    const expiry = record?.expiryDate ? new Date(String(record.expiryDate)) : undefined;
    const expired = Boolean(expiry && expiry < today);
    const current = Boolean(record?.status === 'Completed' && !expired);
    return { employee, course, required, record, expiry, expired, current };
  }));
  const requiredCoverage = coverage.filter((cell) => cell.required);
  const currentCount = requiredCoverage.filter((cell) => cell.current).length;
  const expiringSoon = requiredCoverage.filter((cell) => cell.current && cell.expiry && cell.expiry.getTime() - today.getTime() <= 60 * 24 * 60 * 60 * 1000).length;
  const gapCount = requiredCoverage.filter((cell) => !cell.current).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
      <form onSubmit={(event) => { event.preventDefault(); run(() => aglWorkforceWorkflow.assignTraining(actor, values), `${values.course} assigned.`); }} className="h-fit space-y-4 rounded-xl border border-white/[0.08] bg-[#090909] p-5">
        <div><h2 className="text-sm text-white">Assign training</h2><p className="mt-1 text-[9px] leading-4 text-gray-600">Create a governed competency assignment. Completion requires retained evidence.</p></div>
        <Field label="Employee" value={values.employeeId} onChange={(value) => setValues({ ...values, employeeId: value })} options={employees.map((employee) => ({ value: employee.id, label: `${String(employee.name)} · ${String(employee.role)}` }))} />
        <Field label="Course" value={values.course} onChange={(value) => setValues({ ...values, course: value })} options={trainingCourseOptions.map((item) => ({ value: item, label: item }))} />
        <Field label="Provider" value={values.provider} onChange={(value) => setValues({ ...values, provider: value })} options={trainingProviderOptions.map((item) => ({ value: item, label: item }))} />
        <Field label="Due date" type="date" value={values.dueDate} onChange={(value) => setValues({ ...values, dueDate: value })} />
        <Field label="Certification" value={values.certification} onChange={(value) => setValues({ ...values, certification: value })} options={['Internal completion', 'Manufacturer certification', 'Safety certification', 'Professional certification', 'No certificate'].map((item) => ({ value: item, label: item }))} />
        <Field label="Certificate expiry" type="date" value={values.expiryDate} onChange={(value) => setValues({ ...values, expiryDate: value })} />
        <Field label="Notes" value={values.notes} onChange={(value) => setValues({ ...values, notes: value })} />
        <button className="min-h-11 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Assign course</button>
      </form>

      <div className="min-w-0 space-y-4">
        <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3">
          <Signal label="Required coverage" value={`${currentCount} / ${requiredCoverage.length}`} />
          <Signal label="Expiring in 60 days" value={expiringSoon} />
          <Signal label="Competency gaps" value={gapCount} />
        </section>
        <div className="inline-flex rounded-lg border border-white/[0.08] bg-[#090909] p-1">
          <button type="button" onClick={() => setView('matrix')} className={`min-h-9 rounded-md px-4 text-[9px] font-semibold ${view === 'matrix' ? 'bg-cyan-300 text-black' : 'text-gray-500'}`}>Coverage matrix</button>
          <button type="button" onClick={() => setView('log')} className={`min-h-9 rounded-md px-4 text-[9px] font-semibold ${view === 'log' ? 'bg-cyan-300 text-black' : 'text-gray-500'}`}>Activity log</button>
        </div>

        {view === 'matrix' ? (
          <section className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#090909]">
            <div className="border-b border-white/[0.08] px-5 py-4"><h2 className="text-sm text-white">Competency coverage matrix</h2><p className="mt-1 text-[9px] text-gray-600">Required capabilities are derived from each employee's department and role. Expired certificates count as gaps.</p></div>
            <table className="w-full min-w-[1280px] text-left text-xs">
              <thead className="bg-black/20 font-mono text-[8px] uppercase text-gray-600"><tr><th className="sticky left-0 z-10 min-w-56 bg-[#070707] px-5 py-3 font-normal">Employee</th>{trainingCourseOptions.map((course) => <th key={course} className="min-w-36 px-3 py-3 font-normal">{course}</th>)}</tr></thead>
              <tbody className="divide-y divide-white/[0.06]">{employees.map((employee) => <tr key={employee.id}>
                <td className="sticky left-0 z-10 bg-[#090909] px-5 py-4"><div className="text-gray-200">{String(employee.name)}</div><div className="mt-1 text-[8px] text-gray-600">{String(employee.role)} · {String(employee.department)}</div></td>
                {trainingCourseOptions.map((course) => {
                  const cell = coverage.find((item) => item.employee.id === employee.id && item.course === course)!;
                  const label = !cell.required && !cell.record ? '—' : cell.expired ? 'Expired' : cell.current ? 'Current' : cell.record ? String(cell.record.status) : 'Missing';
                  const tone = label === 'Current' ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300' : label === '—' ? 'border-transparent text-gray-700' : label === 'Pending' ? 'border-amber-300/20 bg-amber-300/[0.06] text-amber-200' : 'border-red-400/20 bg-red-400/[0.06] text-red-300';
                  return <td key={course} className="px-3 py-4"><span className={`inline-flex rounded-md border px-2 py-1 font-mono text-[8px] uppercase ${tone}`}>{label}</span>{cell.record?.expiryDate && <div className="mt-1 font-mono text-[7px] text-gray-700">to {String(cell.record.expiryDate).slice(0, 10)}</div>}</td>;
                })}
              </tr>)}</tbody>
            </table>
          </section>
        ) : (
          <section className="grid gap-3 lg:grid-cols-2">{training.map((item) => {
            const expired = item.expiryDate && new Date(String(item.expiryDate)) < today;
            const evidence = evidenceById[item.id] ?? '';
            return <article key={item.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5"><div className="flex items-start justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-black/25 text-cyan-300"><Award size={16} /></span><Status value={expired ? 'Expired' : item.status} /></div><h2 className="mt-4 text-sm text-white">{String(item.course ?? item.name)}</h2><p className="mt-1 text-[10px] text-gray-500">{String(item.employee ?? item.reference)} · {String(item.provider ?? 'Internal')}</p><dl className="mt-4 space-y-2 text-[9px]"><Row label="Due" value={item.dueDate} /><Row label="Certification" value={item.certification} /><Row label="Expiry" value={item.expiryDate} /><Row label="Evidence" value={item.evidenceReference} /></dl>{item.status !== 'Completed' && <div className="mt-4 flex gap-2 border-t border-white/[0.07] pt-4"><input value={evidence} onChange={(event) => setEvidenceById((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Certificate / evidence ref" className="h-9 min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/25 px-3 text-[9px] text-white" /><button type="button" onClick={() => run(() => aglWorkforceWorkflow.completeTraining(actor, item.id, evidence), `${item.id} completed.`)} className="min-h-9 rounded-lg bg-emerald-400 px-3 text-[9px] font-semibold text-black">Complete</button></div>}</article>;
          })}{!training.length && <div className="col-span-full rounded-xl border border-dashed border-white/[0.1] p-12 text-center text-xs text-gray-600">No training assignments have been recorded.</div>}</section>
        )}
      </div>
    </div>
  );
};

const PerformanceView = ({ revision }: { revision: number }) => {
  const rows = useMemo(() => aglWorkforceWorkflow.performance().sort((a, b) => b.score - a.score), [revision]);
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  return (
    <>
      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4"><Signal label="Mechanics measured" value={rows.length} /><Signal label="Jobs completed" value={rows.reduce((sum, row) => sum + row.completed, 0)} /><Signal label="Revenue contribution" value={money.format(revenue)} /><Signal label="Average score" value={`${(rows.reduce((sum, row) => sum + row.score, 0) / Math.max(1, rows.length)).toFixed(1)}%`} /></section>
      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909]"><table className="w-full min-w-[1080px] text-left text-xs"><thead className="bg-black/20 font-mono text-[8px] uppercase text-gray-600"><tr><th className="px-5 py-3 font-normal">Rank</th><th className="px-5 py-3 font-normal">Mechanic</th><th className="px-5 py-3 font-normal">Assigned</th><th className="px-5 py-3 font-normal">Completed</th><th className="px-5 py-3 font-normal">Revenue</th><th className="px-5 py-3 font-normal">Quality</th><th className="px-5 py-3 font-normal">Recalls</th><th className="px-5 py-3 font-normal">Complaints</th><th className="px-5 py-3 font-normal">Score</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{rows.map((row, index) => <tr key={row.employee.id}><td className="px-5 py-4"><span className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[9px] ${index === 0 ? 'border-amber-300/30 bg-amber-300/[0.07] text-amber-300' : 'border-white/[0.08] text-gray-600'}`}>{index + 1}</span></td><td className="px-5 py-4"><div className="text-gray-200">{String(row.employee.name)}</div><div className="mt-1 text-[8px] text-gray-600">{String(row.employee.role)}</div></td><td className="px-5 py-4 font-mono text-gray-400">{row.assigned}</td><td className="px-5 py-4 font-mono text-gray-300">{row.completed}</td><td className="px-5 py-4 font-mono text-gray-300">{money.format(row.revenue)}</td><td className="px-5 py-4 font-mono text-gray-300">{row.qualityRate.toFixed(1)}%</td><td className="px-5 py-4 font-mono text-gray-400">{row.recallCount}</td><td className="px-5 py-4 font-mono text-gray-400">{row.complaintCount}</td><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full bg-cyan-300" style={{ width: `${row.score}%` }} /></div><span className="font-mono text-[9px] text-cyan-300">{row.score.toFixed(1)}</span></div></td></tr>)}</tbody></table></section>
    </>
  );
};

const PayslipsView = ({ revision }: { revision: number }) => {
  const payslips = useMemo(() => aglWorkforceWorkflow.payslips(), [revision]);
  const [selectedId, setSelectedId] = useState('');
  const selected = payslips.find((item) => item.id === selectedId) ?? payslips[0];
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="agl-no-print space-y-2">{payslips.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${selected?.id === item.id ? 'border-cyan-300/25 bg-cyan-300/[0.05]' : 'border-white/[0.08] bg-[#090909]'}`}><div><div className="font-mono text-[8px] text-cyan-300">{item.id}</div><div className="mt-2 text-xs text-gray-200">{String(item.name)}</div><div className="mt-1 text-[9px] text-gray-600">{String(item.reference)}</div></div><ChevronRight size={13} className="text-gray-600" /></button>)}{!payslips.length && <div className="rounded-xl border border-dashed border-white/[0.1] p-12 text-center text-xs text-gray-600">Process payroll to generate payslips.</div>}</section>
      {selected && <><article className="agl-no-print overflow-hidden rounded-xl border border-white/[0.08] bg-[#f8f7f3] text-black"><PayslipDocument record={selected} /><div className="border-t border-black/10 p-5 text-right"><button onClick={() => { aglErpRepository.recordAction({ moduleId: 'payslips', recordId: selected.id, actorName: actor.name, actorRole: actor.role, action: 'PRINT', summary: `Opened payslip ${selected.id} for print or PDF.` }); window.print(); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-black px-4 text-[10px] text-white"><Printer size={13} /> Print / PDF</button></div></article><div className="hidden print:block"><article className="agl-print-root"><PayslipDocument record={selected} /></article></div></>}
    </div>
  );
};

const PayslipDocument = ({ record }: { record: AglOperationalRecord }) => {
  const payroll = aglErpRepository.list('payroll').find((line) => line.id === record.id || line.reference === record.reference || String(record.reference).includes(String(line.reference)));
  return <div className="p-8"><div className="flex items-start justify-between border-b border-black/15 pb-6"><div><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-600">AGL OPS</div><h2 className="mt-2 font-serif text-3xl font-bold">Payslip</h2><p className="mt-1 text-xs text-gray-500">Automobiles Ghana Limited</p></div><div className="text-right font-mono text-xs"><div>{String(record.id)}</div><div className="mt-1 text-gray-500">{String(record.period ?? 'Processed payroll')}</div></div></div><div className="mt-7 grid grid-cols-2 gap-6 text-xs"><div><div className="text-[9px] font-bold uppercase text-gray-500">Employee</div><div className="mt-2 text-base font-semibold">{String(payroll?.name ?? record.name)}</div><div className="mt-1 text-gray-500">{String(payroll?.reference ?? record.reference)}</div></div><div className="text-right"><div className="text-[9px] font-bold uppercase text-gray-500">Payment reference</div><div className="mt-2">{String(payroll?.paymentReference ?? record.reference)}</div><div className="mt-1 text-gray-500">{String(payroll?.processedAt ?? record.createdAt).slice(0, 10)}</div></div></div><div className="mt-8 grid gap-px bg-black/10 sm:grid-cols-3"><Paper label="Base pay" value={money.format(Number(payroll?.basePay ?? 0))} /><Paper label="Bonus + overtime" value={money.format(Number(payroll?.bonus ?? 0) + Number(payroll?.overtime ?? 0))} /><Paper label="Deductions" value={money.format(Number(payroll?.tax ?? 0) + Number(payroll?.pension ?? 0) + Number(payroll?.otherDeductions ?? 0))} /></div><div className="mt-8 flex items-center justify-between border-y border-black/15 py-5"><span className="text-sm font-semibold">Net pay</span><span className="font-mono text-2xl font-bold">{money.format(Number(payroll?.amount ?? record.amount ?? 0))}</span></div><p className="mt-8 text-[10px] leading-5 text-gray-500">Generated from the approved payroll batch. Corrections must be made through a later governed payroll run; this issued payslip remains retained.</p></div>;
};

const EmployeeEditor = ({ record, onClose, onSave }: { record?: AglOperationalRecord; onClose: () => void; onSave: (values: Record<string, string | number | boolean>) => boolean }) => {
  const [values, setValues] = useState({
    name: String(record?.name ?? ''),
    role: String(record?.role ?? 'Mechanic'),
    department: String(record?.department ?? 'Workshop'),
    phone: String(record?.phone ?? ''),
    email: String(record?.email ?? ''),
    payBasis: String(record?.payBasis ?? 'Monthly'),
    basePayGhs: Number(record?.basePayGhs ?? 0),
    compensationEffectiveDate: String(record?.compensationEffectiveDate ?? new Date().toISOString().slice(0, 10)),
    startDate: String(record?.startDate ?? new Date().toISOString().slice(0, 10)),
    owner: String(record?.owner ?? 'Alex Morgan'),
    status: String(record?.status ?? 'Active'),
    ghanaCardId: String(record?.ghanaCardId ?? ''),
    ssnitNumber: String(record?.ssnitNumber ?? ''),
    healthInsurance: String(record?.healthInsurance ?? ''),
    workStart: String(record?.workStart ?? '08:00'),
    workEnd: String(record?.workEnd ?? '18:00'),
    payrollOnly: Boolean(record?.payrollOnly ?? false),
  });
  const payLabel = values.payBasis === 'Monthly'
    ? 'Monthly salary (GHS)'
    : values.payBasis === 'Daily'
      ? 'Daily rate (GHS)'
      : values.payBasis === 'Hourly'
        ? 'Hourly rate (GHS)'
        : 'Commission base / draw (GHS)';
  return (
    <div className="custom-scrollbar fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={record ? `Edit employee ${String(record.name)}` : 'Create employee'}>
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <form onSubmit={(event) => { event.preventDefault(); if (onSave(values)) onClose(); }} className="my-auto w-full max-w-3xl rounded-xl border border-white/[0.1] bg-[#090909] shadow-2xl">
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.08] bg-[#090909]/95 p-5 backdrop-blur sm:p-6">
            <div><div className="font-mono text-[8px] uppercase text-cyan-300">{record ? 'Update employee master' : 'Create employee master'}</div><h2 className="mt-2 text-xl text-white">{record ? String(record.name) : 'New employee'}</h2><p className="mt-1 text-[10px] text-gray-600">Employment identity and current compensation terms feed attendance, payroll, and reporting.</p></div>
            <button type="button" aria-label="Close employee editor" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={14} /></button>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2"><EditorSection title="Identity and employment" detail="The employee master is the identity used by attendance, payroll, jobs, reports, and audit." /></div>
            <Field label="Employee name" value={values.name} onChange={(name) => setValues({ ...values, name })} />
            <Field label="Role" value={values.role} onChange={(role) => setValues({ ...values, role })} options={roleOptions.map((item) => ({ value: item, label: item }))} />
            <Field label="Department" value={values.department} onChange={(department) => setValues({ ...values, department })} options={departmentOptions.map((item) => ({ value: item, label: item }))} />
            <Field label="Phone" value={values.phone} onChange={(phone) => setValues({ ...values, phone })} />
            <Field label="Email" value={values.email} onChange={(email) => setValues({ ...values, email })} />
            <Field label="Start date" type="date" value={values.startDate} onChange={(startDate) => setValues({ ...values, startDate })} />
            <div className="sm:col-span-2"><EditorSection title="Statutory and benefit identity" detail="Capture verification references without using them as display names or payroll calculations." /></div>
            <Field label="Ghana Card / national ID" value={values.ghanaCardId} onChange={(ghanaCardId) => setValues({ ...values, ghanaCardId })} />
            <Field label="SSNIT number" value={values.ssnitNumber} onChange={(ssnitNumber) => setValues({ ...values, ssnitNumber })} />
            <div className="sm:col-span-2"><Field label="Health insurance / NHIS reference" value={values.healthInsurance} onChange={(healthInsurance) => setValues({ ...values, healthInsurance })} /></div>
            <div className="sm:col-span-2"><EditorSection title="Pay and working envelope" detail="These terms determine attendance expectations and the source amount loaded into payroll." /></div>
            <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-black/25 p-4">
              <input type="checkbox" checked={values.payrollOnly} onChange={(event) => setValues({ ...values, payrollOnly: event.target.checked })} className="mt-0.5 h-4 w-4 accent-cyan-300" />
              <span><span className="block text-[10px] font-medium text-gray-200">Payroll-only / consultant</span><span className="mt-1 block text-[9px] leading-4 text-gray-600">Generate payroll and payslips, but exclude this person from attendance, missed-day controls, and workforce attendance reporting.</span></span>
            </label>
            <Field label="Pay basis" value={values.payBasis} onChange={(payBasis) => setValues({ ...values, payBasis })} options={['Monthly', 'Daily', 'Hourly', 'Commission'].map((item) => ({ value: item, label: item }))} />
            <Field label={payLabel} type="number" value={values.basePayGhs} onChange={(basePayGhs) => setValues({ ...values, basePayGhs: Number(basePayGhs) })} />
            <Field label="Pay effective date" type="date" value={values.compensationEffectiveDate} onChange={(compensationEffectiveDate) => setValues({ ...values, compensationEffectiveDate })} />
            <Field label="Expected work start" type="time" value={values.workStart} onChange={(workStart) => setValues({ ...values, workStart })} />
            <Field label="Expected work end" type="time" value={values.workEnd} onChange={(workEnd) => setValues({ ...values, workEnd })} />
            <Field label="HR owner" value={values.owner} onChange={(owner) => setValues({ ...values, owner })} options={peopleOwnerOptions.map((item) => ({ value: item, label: item }))} />
            <Field label="Employment status" value={values.status} onChange={(status) => setValues({ ...values, status })} options={['Active', 'On leave', 'Suspended', 'Terminated', 'Archived'].map((item) => ({ value: item, label: item }))} />
          </div>
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/[0.08] bg-[#090909]/95 p-5 backdrop-blur sm:px-6">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-white/[0.08] px-4 text-xs text-gray-400">Cancel</button>
            <button className="min-h-11 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">Save employee & pay terms</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditorSection = ({ title, detail }: { title: string; detail: string }) => (
  <div className="border-b border-white/[0.07] pb-3 pt-2"><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-300">{title}</div><p className="mt-1 text-[9px] leading-4 text-gray-600">{detail}</p></div>
);

const Field = ({ label, value, onChange, type = 'text', options }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; options?: { value: string; label: string }[] }) => <label className="block"><span className="font-mono text-[8px] capitalize text-gray-600">{label}</span>{options ? <select value={String(value)} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-[#050505] px-3 text-xs text-white">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white" />}</label>;
const Status = ({ value }: { value: unknown }) => <span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] uppercase text-gray-500">{String(value)}</span>;
const Row = ({ label, value }: { label: string; value: unknown }) => <div className="flex items-center justify-between gap-4"><dt className="text-gray-600">{label}</dt><dd className="max-w-[68%] truncate text-right text-gray-400">{String(value ?? '—')}</dd></div>;
const Signal = ({ label, value }: { label: string; value: unknown }) => <div className="bg-[#090909] px-5 py-4"><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className="mt-2 text-lg text-white">{String(value)}</div></div>;
const Paper = ({ label, value }: { label: string; value: string }) => <div className="bg-white p-5"><div className="text-[9px] font-bold uppercase text-gray-500">{label}</div><div className="mt-2 font-mono text-sm font-bold">{value}</div></div>;
