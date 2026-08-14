import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarOff,
  Check,
  Clock3,
  Download,
  FileClock,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Printer,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import type { Tenant } from '../../types';
import type { AglOperationalRecord } from '../../erp/agl/contracts';
import {
  aglAttendanceWorkflow,
  type AbsenceType,
  type AttendanceEntryInput,
} from '../../erp/agl/attendanceWorkflow';

const actor = { name: 'AGL Admin', role: 'Administrator' };
const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);
type Mode = 'attendance' | 'leave';

export const AglAttendanceWorkspace = ({ tenant, moduleId }: { tenant: Tenant; moduleId: Mode }) => {
  const [revision, setRevision] = useState(0);
  const [month, setMonth] = useState(currentMonth());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [editing, setEditing] = useState<AglOperationalRecord | 'new' | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  const employees = useMemo(() => aglAttendanceWorkflow.employees(), [revision]);
  const [year, monthNumber] = month.split('-').map(Number);
  const employeeSummaries = useMemo(
    () => aglAttendanceWorkflow.organizationSummary(year, monthNumber),
    [year, monthNumber, revision],
  );
  useEffect(() => {
    if (!selectedEmployeeId && employees[0]) setSelectedEmployeeId(employees[0].id);
  }, [employees, selectedEmployeeId]);

  const selectedSummary = employeeSummaries.find((item) => item.employee.id === selectedEmployeeId);
  const entries = useMemo(
    () => aglAttendanceWorkflow.entries()
      .filter((entry) => String(entry.date ?? '').startsWith(month))
      .sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [month, revision],
  );
  const leaveRequests = useMemo(() => aglAttendanceWorkflow.leaveRequests(), [revision]);
  const organization = employeeSummaries.reduce((result, item) => ({
    expected: result.expected + item.summary.expectedDays,
    logged: result.logged + item.summary.loggedDays,
    unlogged: result.unlogged + item.summary.unloggedDays,
    excused: result.excused + item.summary.excusedDays,
    late: result.late + item.summary.lateCount,
    missed: result.missed + item.summary.missedIn + item.summary.missedOut,
    overtime: result.overtime + item.summary.overtimeHours,
  }), { expected: 0, logged: 0, unlogged: 0, excused: 0, late: 0, missed: 0, overtime: 0 });

  const run = (operation: () => unknown, confirmation: string) => {
    setError('');
    try {
      operation();
      setNotice(confirmation);
      setEditing(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The attendance operation could not be completed.');
    }
  };

  if (moduleId === 'leave') {
    return (
      <LeaveWorkspace
        tenant={tenant}
        employees={employees}
        requests={leaveRequests}
        notice={notice}
        error={error}
        onRun={run}
        clearMessage={() => { setNotice(''); setError(''); }}
      />
    );
  }

  const todayEntries = aglAttendanceWorkflow.entries().filter((entry) => entry.date === today());
  return (
    <div className="mx-auto max-w-[1780px] space-y-5 pb-12">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">
            <FileClock size={13} /> {tenant.id.toUpperCase()} ERP / people / attendance
          </div>
          <h1 className="mt-3 text-3xl font-display font-semibold text-white">Attendance control room</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">
            Record live and backdated shifts, correct missed punches, assign statutory absences, expose unlogged workdays, and feed governed working time into payroll.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="h-11 rounded-lg border border-white/[0.1] bg-black/25 px-3 text-xs text-white"
          />
          <button onClick={() => exportAttendance(entries, month)} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => window.print()} className="flex min-h-11 items-center gap-2 rounded-lg border border-white/[0.1] px-4 text-xs text-gray-300">
            <Printer size={14} /> Print / PDF
          </button>
          <button onClick={() => setEditing('new')} className="flex min-h-11 items-center gap-2 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">
            <Plus size={14} /> Manual entry
          </button>
        </div>
      </header>

      <Message notice={notice} error={error} onClose={() => { setNotice(''); setError(''); }} />

      <section className="grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-3 xl:grid-cols-6">
        <Signal label="Roster" value={String(employees.length)} detail={`${organization.expected} expected employee-days`} icon={<UserCheck size={14} />} />
        <Signal label="Logged" value={String(organization.logged)} detail="Recorded shifts and absences" icon={<CalendarCheck size={14} />} />
        <Signal label="Unlogged" value={String(organization.unlogged)} detail="Expected weekdays with no record" icon={<CalendarOff size={14} />} warn={organization.unlogged > 0} />
        <Signal label="Excused" value={String(organization.excused)} detail="Holiday · PTO · Sickday" icon={<ShieldCheck size={14} />} />
        <Signal label="Punch issues" value={String(organization.missed)} detail={`${organization.late} late arrivals`} icon={<AlertTriangle size={14} />} warn={organization.missed > 0} />
        <Signal label="Overtime" value={`${organization.overtime.toFixed(1)}h`} detail="After 18:00" icon={<Clock3 size={14} />} />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909]">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <div>
              <h2 className="text-sm font-medium text-white">Monthly attendance position</h2>
              <p className="mt-1 text-[10px] text-gray-600">Select an employee to inspect the evidence gap by date.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="bg-black/20 font-mono text-[8px] uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-normal">Employee</th>
                  <th className="px-5 py-3 font-normal">Expected</th>
                  <th className="px-5 py-3 font-normal">Payable</th>
                  <th className="px-5 py-3 font-normal">Excused</th>
                  <th className="px-5 py-3 font-normal">Late</th>
                  <th className="px-5 py-3 font-normal">Punch gaps</th>
                  <th className="px-5 py-3 font-normal">Unlogged</th>
                  <th className="px-5 py-3 font-normal">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {employeeSummaries.map(({ employee, summary }) => (
                  <tr
                    key={employee.id}
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    className={`cursor-pointer transition ${selectedEmployeeId === employee.id ? 'bg-cyan-300/[0.06]' : 'hover:bg-white/[0.025]'}`}
                  >
                    <td className="px-5 py-4"><div className="text-gray-200">{String(employee.name)}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{employee.id} · {String(employee.role)}</div></td>
                    <td className="px-5 py-4 font-mono text-gray-400">{summary.expectedDays}</td>
                    <td className="px-5 py-4 font-mono text-gray-300">{summary.payableDays}</td>
                    <td className="px-5 py-4 font-mono text-gray-400">{summary.excusedDays}</td>
                    <td className="px-5 py-4 font-mono text-gray-400">{summary.lateCount}</td>
                    <td className="px-5 py-4 font-mono text-gray-400">{summary.missedIn + summary.missedOut}</td>
                    <td className={`px-5 py-4 font-mono ${summary.unloggedDays ? 'text-amber-300' : 'text-emerald-300'}`}>{summary.unloggedDays}</td>
                    <td className="px-5 py-4 font-mono text-gray-300">{summary.totalHours.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
            <div className="flex items-center justify-between gap-4">
              <div><div className="font-mono text-[8px] uppercase text-cyan-300">Evidence gap</div><h2 className="mt-2 text-base text-white">{String(selectedSummary?.employee.name ?? 'Select employee')}</h2></div>
              {selectedSummary && <span className="rounded border border-white/[0.08] px-2 py-1 font-mono text-[8px] text-gray-500">{selectedSummary.employee.id}</span>}
            </div>
            {selectedSummary ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Mini label="Logged" value={selectedSummary.summary.loggedDays} />
                  <Mini label="Payable" value={selectedSummary.summary.payableDays} />
                  <Mini label="Unlogged" value={selectedSummary.summary.unloggedDays} warn />
                  <Mini label="Overtime" value={`${selectedSummary.summary.overtimeHours.toFixed(1)}h`} />
                </div>
                <div className="mt-4 rounded-lg border border-white/[0.07] bg-black/20 p-4">
                  <div className="font-mono text-[8px] uppercase text-gray-600">Dates requiring a record</div>
                  <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                    {selectedSummary.summary.unloggedDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => setEditing({
                          id: '',
                          status: 'New',
                          createdAt: '',
                          updatedAt: '',
                          reference: selectedSummary.employee.id,
                          date,
                        })}
                        className="rounded border border-amber-300/20 bg-amber-300/[0.05] px-2 py-1 font-mono text-[8px] text-amber-200"
                      >
                        {date}
                      </button>
                    ))}
                    {!selectedSummary.summary.unloggedDates.length && <span className="text-[10px] text-emerald-300">No missing workday records.</span>}
                  </div>
                </div>
              </>
            ) : <p className="mt-5 text-xs text-gray-600">Select a roster member.</p>}
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
            <div className="flex items-center justify-between"><div><h2 className="text-sm text-white">Today’s live clock</h2><p className="mt-1 text-[10px] text-gray-600">{today()}</p></div><Clock3 size={16} className="text-cyan-300" /></div>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {employees.map((employee) => {
                const entry = todayEntries.find((item) => item.reference === employee.id);
                const clockedIn = Boolean(entry?.clockIn) && !entry?.clockOut;
                return (
                  <div key={employee.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-black/20 p-3">
                    <div><div className="text-[11px] text-gray-200">{String(employee.name)}</div><div className="mt-1 text-[9px] text-gray-600">{entry?.absenceType && entry.absenceType !== 'None' ? String(entry.absenceType) : entry?.clockIn ? `${String(entry.clockIn)}${entry.clockOut ? ` – ${String(entry.clockOut)}` : ' · on shift'}` : 'Not clocked'}</div></div>
                    {!entry?.clockIn && !entry?.absenceType ? (
                      <button onClick={() => run(() => aglAttendanceWorkflow.clockIn(actor, employee.id), `${String(employee.name)} clocked in.`)} className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300/20 px-3 text-[9px] text-emerald-300"><LogIn size={12} /> In</button>
                    ) : clockedIn ? (
                      <button onClick={() => run(() => aglAttendanceWorkflow.clockOut(actor, employee.id), `${String(employee.name)} clocked out.`)} className="flex h-9 items-center gap-1.5 rounded-lg border border-amber-300/20 px-3 text-[9px] text-amber-300"><LogOut size={12} /> Out</button>
                    ) : <Check size={14} className="text-emerald-300" />}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#090909]">
        <div className="border-b border-white/[0.08] px-5 py-4"><h2 className="text-sm text-white">Attendance ledger</h2><p className="mt-1 text-[10px] text-gray-600">Every change remains in Admin Audit with before and after state.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-xs">
            <thead className="bg-black/20 font-mono text-[8px] uppercase tracking-wider text-gray-600"><tr><th className="px-5 py-3 font-normal">Date</th><th className="px-5 py-3 font-normal">Employee</th><th className="px-5 py-3 font-normal">In</th><th className="px-5 py-3 font-normal">Out</th><th className="px-5 py-3 font-normal">Hours</th><th className="px-5 py-3 font-normal">Absence</th><th className="px-5 py-3 font-normal">Source</th><th className="px-5 py-3 font-normal">State</th><th className="px-5 py-3"></th></tr></thead>
            <tbody className="divide-y divide-white/[0.06]">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.025]">
                  <td className="px-5 py-4 font-mono text-gray-400">{String(entry.date)}</td>
                  <td className="px-5 py-4"><div className="text-gray-200">{String(entry.name)}</div><div className="mt-1 font-mono text-[8px] text-gray-600">{String(entry.reference)}</div></td>
                  <td className="px-5 py-4 font-mono text-gray-400">{String(entry.clockIn || '—')}</td>
                  <td className="px-5 py-4 font-mono text-gray-400">{String(entry.clockOut || '—')}</td>
                  <td className="px-5 py-4 font-mono text-gray-300">{Number(entry.hours ?? 0).toFixed(2)}</td>
                  <td className="px-5 py-4 text-gray-400">{String(entry.absenceType ?? 'None')}</td>
                  <td className="px-5 py-4 text-gray-500">{String(entry.source)}</td>
                  <td className="px-5 py-4"><Status value={entry.status} /></td>
                  <td className="px-5 py-4"><button onClick={() => setEditing(entry)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500 hover:text-cyan-300" aria-label={`Edit ${entry.id}`}><Pencil size={13} /></button></td>
                </tr>
              ))}
              {!entries.length && <tr><td colSpan={9} className="px-5 py-12 text-center text-xs text-gray-600">No attendance records for {month}.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <AttendanceEditor
          employees={employees}
          record={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(input) => run(
            () => editing !== 'new' && editing.id
              ? aglAttendanceWorkflow.correct(actor, editing.id, input)
              : aglAttendanceWorkflow.recordManual(actor, input),
            `Attendance for ${input.date} saved.`,
          )}
        />
      )}
    </div>
  );
};

const LeaveWorkspace = ({
  tenant,
  employees,
  requests,
  notice,
  error,
  onRun,
  clearMessage,
}: {
  tenant: Tenant;
  employees: AglOperationalRecord[];
  requests: AglOperationalRecord[];
  notice: string;
  error: string;
  onRun: (operation: () => unknown, confirmation: string) => void;
  clearMessage: () => void;
}) => {
  const [values, setValues] = useState({
    employeeId: employees[0]?.id ?? '',
    absenceType: 'PTO' as Exclude<AbsenceType, 'None'>,
    startDate: today(),
    endDate: today(),
    reason: '',
    requestedBy: 'Alex Morgan',
  });
  const [approver, setApprover] = useState('Bekoe Adu Benjamin');
  const [rejectionReason, setRejectionReason] = useState('');
  useEffect(() => {
    if (!values.employeeId && employees[0]) setValues((current) => ({ ...current, employeeId: employees[0].id }));
  }, [employees, values.employeeId]);
  return (
    <div className="mx-auto max-w-[1640px] space-y-5 pb-12">
      <header className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300"><CalendarOff size={13} /> {tenant.id.toUpperCase()} ERP / people / leave</div>
        <h1 className="mt-3 text-3xl font-display font-semibold text-white">Leave, PTO & overtime</h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-gray-500">Approve absences once, then automatically create excused attendance evidence for every workday in the approved range.</p>
      </header>
      <Message notice={notice} error={error} onClose={clearMessage} />
      <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onRun(() => aglAttendanceWorkflow.requestLeave(actor, values), 'Leave request submitted for approval.');
            setValues((current) => ({ ...current, reason: '' }));
          }}
          className="h-fit space-y-4 rounded-xl border border-white/[0.08] bg-[#090909] p-5"
        >
          <h2 className="text-sm font-medium text-white">New leave request</h2>
          <Field label="Employee" value={values.employeeId} onChange={(value) => setValues({ ...values, employeeId: value })} options={employees.map((employee) => ({ value: employee.id, label: `${String(employee.name)} · ${String(employee.role)}` }))} />
          <Field label="Absence type" value={values.absenceType} onChange={(value) => setValues({ ...values, absenceType: value as Exclude<AbsenceType, 'None'> })} options={['Holiday', 'PTO', 'Sickday'].map((value) => ({ value, label: value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" type="date" value={values.startDate} onChange={(value) => setValues({ ...values, startDate: value })} />
            <Field label="End" type="date" value={values.endDate} onChange={(value) => setValues({ ...values, endDate: value })} />
          </div>
          <Field label="Requested by" value={values.requestedBy} onChange={(value) => setValues({ ...values, requestedBy: value })} />
          <Field label="Reason" value={values.reason} onChange={(value) => setValues({ ...values, reason: value })} textarea />
          <button className="min-h-11 w-full rounded-lg bg-vertical-accent text-xs font-semibold text-black">Submit request</button>
        </form>
        <section className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-white/[0.08] bg-[#090909] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="font-mono text-[9px] text-cyan-300">{request.id}</div>
                  <h2 className="mt-2 text-sm text-white">{String(request.name)} · {String(request.absenceType)}</h2>
                  <p className="mt-2 text-[10px] text-gray-500">{String(request.startDate)} → {String(request.endDate)} · requested by {String(request.requestedBy)}</p>
                  <p className="mt-3 text-xs leading-5 text-gray-400">{String(request.reason)}</p>
                </div>
                <Status value={request.status} />
              </div>
              {request.status === 'Pending' && (
                <div className="mt-5 grid gap-3 border-t border-white/[0.07] pt-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <Field label="Approver" value={approver} onChange={setApprover} />
                  <Field label="Rejection basis" value={rejectionReason} onChange={setRejectionReason} />
                  <button onClick={() => onRun(() => aglAttendanceWorkflow.approveLeave(actor, request.id, approver), `${request.id} approved and attendance evidence created.`)} className="mt-auto min-h-10 rounded-lg bg-emerald-400 px-4 text-[10px] font-semibold text-black">Approve</button>
                  <button onClick={() => onRun(() => aglAttendanceWorkflow.rejectLeave(actor, request.id, approver, rejectionReason), `${request.id} rejected.`)} className="mt-auto min-h-10 rounded-lg border border-red-300/20 px-4 text-[10px] text-red-300">Reject</button>
                </div>
              )}
            </article>
          ))}
          {!requests.length && <div className="rounded-xl border border-dashed border-white/[0.1] p-14 text-center text-xs text-gray-600">No leave requests.</div>}
        </section>
      </div>
    </div>
  );
};

const AttendanceEditor = ({
  employees,
  record,
  onClose,
  onSave,
}: {
  employees: AglOperationalRecord[];
  record?: AglOperationalRecord;
  onClose: () => void;
  onSave: (values: AttendanceEntryInput) => void;
}) => {
  const [values, setValues] = useState<AttendanceEntryInput>({
    employeeId: String(record?.reference ?? employees[0]?.id ?? ''),
    date: String(record?.date ?? today()),
    clockIn: String(record?.clockIn ?? '08:00'),
    clockOut: String(record?.clockOut ?? '18:00'),
    absenceType: String(record?.absenceType ?? 'None') as AbsenceType,
    source: String(record?.source ?? 'Manager correction') as AttendanceEntryInput['source'],
    notes: String(record?.notes ?? ''),
  });
  const set = <K extends keyof AttendanceEntryInput>(key: K, value: AttendanceEntryInput[K]) => setValues((current) => ({ ...current, [key]: value }));
  const excused = values.absenceType !== 'None';
  return (
    <div className="custom-scrollbar fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={record?.id ? `Edit attendance ${record.id}` : 'Manual attendance entry'}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(values); }} className="mx-auto my-auto w-full max-w-xl rounded-xl border border-white/[0.1] bg-[#090909] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[#090909]/95 p-5 backdrop-blur sm:p-6">
          <div><div className="font-mono text-[8px] uppercase text-cyan-300">{record?.id ? 'Controlled correction' : 'Backdated / manual capture'}</div><h2 className="mt-2 text-xl text-white">{record?.id ? `Edit ${record.id}` : 'Manual attendance entry'}</h2><p className="mt-1 text-[10px] text-gray-600">Use legal absence for Holiday, PTO, or Sickday; times are cleared automatically.</p></div>
          <button type="button" aria-label="Close attendance editor" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-gray-500"><X size={14} /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2"><Field label="Employee" value={values.employeeId} onChange={(value) => set('employeeId', value)} options={employees.map((employee) => ({ value: employee.id, label: `${String(employee.name)} · ${String(employee.role)}` }))} /></div>
          <Field label="Work date" type="date" value={values.date} onChange={(value) => set('date', value)} />
          <Field label="Legal absence" value={values.absenceType} onChange={(value) => set('absenceType', value as AbsenceType)} options={['None', 'Holiday', 'PTO', 'Sickday'].map((value) => ({ value, label: value }))} />
          <Field label="Clock in" type="time" value={values.clockIn} onChange={(value) => set('clockIn', value)} disabled={excused} />
          <Field label="Clock out" type="time" value={values.clockOut} onChange={(value) => set('clockOut', value)} disabled={excused} />
          <div className="sm:col-span-2"><Field label="Capture source" value={values.source} onChange={(value) => set('source', value as AttendanceEntryInput['source'])} options={['Biometric', 'Manager correction', 'Imported record', 'Mobile'].map((value) => ({ value, label: value }))} /></div>
          <div className="sm:col-span-2"><Field label="Correction / absence note" value={values.notes} onChange={(value) => set('notes', value)} textarea /></div>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/[0.08] bg-[#090909]/95 p-5 backdrop-blur sm:px-6">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-white/[0.08] px-4 text-xs text-gray-400">Cancel</button>
          <button className="min-h-11 rounded-lg bg-vertical-accent px-5 text-xs font-semibold text-black">Save attendance</button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', options, textarea = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; options?: { value: string; label: string }[]; textarea?: boolean; disabled?: boolean }) => (
  <label className="block">
    <span className="font-mono text-[8px] uppercase tracking-wider text-gray-600">{label}</span>
    {options ? (
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-[#050505] px-3 text-xs text-white disabled:opacity-35">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    ) : textarea ? (
      <textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 min-h-24 w-full rounded-lg border border-white/[0.08] bg-black/25 p-3 text-xs text-white disabled:opacity-35" />
    ) : (
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="mt-2 h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-white disabled:opacity-35" />
    )}
  </label>
);

const Signal = ({ label, value, detail, icon, warn = false }: { label: string; value: string; detail: string; icon: React.ReactNode; warn?: boolean }) => (
  <div className="bg-[#090909] px-5 py-4">
    <div className="flex items-center justify-between text-gray-600"><span className="font-mono text-[8px] uppercase tracking-wider">{label}</span>{icon}</div>
    <div className={`mt-2 text-lg ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div>
    <div className="mt-1 text-[9px] text-gray-700">{detail}</div>
  </div>
);

const Mini = ({ label, value, warn = false }: { label: string; value: string | number; warn?: boolean }) => <div className="rounded-lg border border-white/[0.07] bg-black/20 p-3"><div className="font-mono text-[8px] uppercase text-gray-600">{label}</div><div className={`mt-2 text-sm ${warn && Number(value) > 0 ? 'text-amber-300' : 'text-white'}`}>{value}</div></div>;
const Status = ({ value }: { value: string }) => <span className="inline-flex rounded border border-white/[0.08] bg-white/[0.025] px-2 py-1 font-mono text-[8px] uppercase text-gray-400">{value}</span>;
const Message = ({ notice, error, onClose }: { notice: string; error: string; onClose: () => void }) => !notice && !error ? null : <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-red-400/20 bg-red-400/[0.05] text-red-300' : 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'}`}><span>{error || notice}</span><button onClick={onClose}><X size={13} /></button></div>;

const exportAttendance = (entries: AglOperationalRecord[], month: string) => {
  const keys = ['date', 'reference', 'name', 'clockIn', 'clockOut', 'hours', 'overtimeHours', 'absenceType', 'source', 'status', 'notes'];
  const csv = [
    keys.join(','),
    ...entries.map((entry) => keys.map((key) => `"${String(entry[key] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `agl-attendance-${month}.csv`;
  anchor.click();
  URL.revokeObjectURL(href);
};
