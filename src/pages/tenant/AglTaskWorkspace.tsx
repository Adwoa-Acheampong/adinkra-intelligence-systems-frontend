import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import { AlertTriangle, CalendarClock, Check, ClipboardCheck, Link2, Search, UserRound, X } from 'lucide-react';
import type { Tenant } from '../../types';
import { aglErpRepository } from '../../erp/agl/repository';
import { AGL_TASK_STATUSES, aglTaskWorkflow, type AglTaskInput } from '../../erp/agl/taskWorkflow';

const actor = { name: 'AGL Admin', role: 'Operations Manager' };
const priorities: AglTaskInput['priority'][] = ['Urgent', 'High', 'Normal', 'Low'];
const sourceModules = ['Management', 'Workshop', 'Inventory', 'Sales', 'Finance', 'People', 'Marketing', 'Customer service'];
const today = () => new Date().toISOString().slice(0, 10);

export const AglTaskWorkspace = ({ tenant }: { tenant: Tenant }) => {
  const [revision, setRevision] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('All employees');
  const [priorityFilter, setPriorityFilter] = useState('All priorities');
  const employees = useMemo(() => aglErpRepository.list('employees').filter((item) => item.status === 'Active'), [revision]);
  const tasks = useMemo(() => aglTaskWorkflow.tasks(), [revision]);
  const [values, setValues] = useState<AglTaskInput>({
    title: '',
    employeeId: employees[0]?.id ?? '',
    priority: 'Normal',
    dueDate: today(),
    dueTime: '17:00',
    details: '',
    sourceModule: 'Management',
    sourceRecord: '',
  });

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('agl-erp-change', refresh);
    return () => window.removeEventListener('agl-erp-change', refresh);
  }, []);

  useEffect(() => {
    if (!values.employeeId && employees[0]) setValues((current) => ({ ...current, employeeId: employees[0].id }));
  }, [employees, values.employeeId]);

  const run = (operation: () => unknown, confirmation: string) => {
    try {
      operation();
      setFeedback(confirmation);
      setError('');
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The task action failed.');
      setFeedback('');
      return false;
    }
  };

  const filtered = tasks.filter((task) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [task.id, task.title, task.assignedTo, task.details, task.sourceRecord]
      .some((value) => String(value ?? '').toLowerCase().includes(query));
    const matchesEmployee = employeeFilter === 'All employees' || task.employeeId === employeeFilter;
    const matchesPriority = priorityFilter === 'All priorities' || task.priority === priorityFilter;
    return matchesSearch && matchesEmployee && matchesPriority;
  });
  const active = tasks.filter((item) => !['Completed', 'Cancelled'].includes(item.status));
  const overdue = active.filter((item) => String(item.dueDate) < today());
  const dueToday = active.filter((item) => String(item.dueDate) === today());
  const completed = tasks.filter((item) => item.status === 'Completed');

  const submit = () => {
    const created = run(() => aglTaskWorkflow.create(actor, values), `${values.title || 'Task'} assigned.`);
    if (created) setValues((current) => ({ ...current, title: '', details: '', sourceRecord: '' }));
  };

  const move = (taskId: string, status: string) => run(
    () => aglTaskWorkflow.changeStatus(actor, taskId, status),
    `${taskId} moved to ${status}.`,
  );

  return <div className="mx-auto max-w-[1720px] space-y-5 pb-12">
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{tenant.id.toUpperCase()} ERP / PEOPLE / ACCOUNTABLE WORK</div><h1 className="mt-3 text-3xl font-display font-semibold text-white">Staff task control</h1><p className="mt-2 max-w-4xl text-xs leading-5 text-gray-500">Assign work to a named employee, retain the operating source, and let staff progress the same record from their portal. This is the management side of the AGL task loop.</p></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Signal label="Active" value={active.length} /><Signal label="Due today" value={dueToday.length} /><Signal label="Overdue" value={overdue.length} warning={overdue.length > 0} /><Signal label="Completed" value={completed.length} /></div>
    </header>

    {(feedback || error) && <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-xs ${error ? 'border-rose-400/20 bg-rose-400/[0.05] text-rose-200' : 'border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-100'}`}><span className="flex items-center gap-2">{error ? <AlertTriangle size={14} /> : <Check size={14} />}{error || feedback}</span><button type="button" onClick={() => { setError(''); setFeedback(''); }}><X size={13} /></button></div>}

    <section className="grid gap-5 2xl:grid-cols-[360px_minmax(0,1fr)]">
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="h-fit space-y-4 rounded-xl border border-white/[0.08] bg-[#090909] p-5 2xl:sticky 2xl:top-2">
        <div><h2 className="flex items-center gap-2 text-sm text-white"><ClipboardCheck size={15} className="text-cyan-300" /> Assign accountable task</h2><p className="mt-1 text-[9px] leading-4 text-gray-600">The assignee sees the same record and can progress only through controlled next states.</p></div>
        <Field label="Task title"><input required value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} placeholder="What must be completed?" /></Field>
        <Field label="Assigned employee"><select required value={values.employeeId} onChange={(event) => setValues({ ...values, employeeId: event.target.value })}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{String(employee.name)} · {String(employee.department)}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Priority"><select value={values.priority} onChange={(event) => setValues({ ...values, priority: event.target.value as AglTaskInput['priority'] })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></Field><Field label="Source module"><select value={values.sourceModule} onChange={(event) => setValues({ ...values, sourceModule: event.target.value })}>{sourceModules.map((module) => <option key={module}>{module}</option>)}</select></Field></div>
        <div className="grid grid-cols-2 gap-3"><Field label="Due date"><input required type="date" value={values.dueDate} onChange={(event) => setValues({ ...values, dueDate: event.target.value })} /></Field><Field label="Due time"><input type="time" value={values.dueTime} onChange={(event) => setValues({ ...values, dueTime: event.target.value })} /></Field></div>
        <Field label="Linked record"><input value={values.sourceRecord} onChange={(event) => setValues({ ...values, sourceRecord: event.target.value })} placeholder="VSR, invoice, PO, case…" /></Field>
        <Field label="Instructions / acceptance condition"><textarea required rows={4} value={values.details} onChange={(event) => setValues({ ...values, details: event.target.value })} placeholder="State the outcome and what counts as complete." /></Field>
        <button type="submit" className="min-h-11 w-full rounded-lg bg-cyan-300 text-xs font-semibold text-black">Assign task</button>
      </form>

      <div className="min-w-0 space-y-4">
        <div className="grid gap-3 rounded-xl border border-white/[0.08] bg-[#090909] p-4 lg:grid-cols-[minmax(260px,1fr)_220px_180px]">
          <label className="relative"><Search size={14} className="absolute left-3 top-3.5 text-gray-600" /><input aria-label="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search task, person, source or record" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 pl-9 pr-3 text-xs text-white" /></label>
          <select aria-label="Filter by employee" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className="h-11 rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-gray-300"><option>All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{String(employee.name)}</option>)}</select>
          <select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-11 rounded-lg border border-white/[0.08] bg-black/25 px-3 text-xs text-gray-300"><option>All priorities</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select>
        </div>

        <div className="custom-scrollbar overflow-x-auto pb-2">
          <div className="grid min-w-[1180px] grid-cols-5 gap-3">
            {AGL_TASK_STATUSES.map((status) => {
              const records = filtered.filter((task) => task.status === status);
              return <section key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const taskId = event.dataTransfer.getData('text/task-id'); if (taskId) move(taskId, status); }} className="min-h-[560px] rounded-xl border border-white/[0.08] bg-[#080808]">
                <header className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-300">{status}</span><span className="rounded-full bg-white/[0.06] px-2 py-1 font-mono text-[8px] text-gray-500">{records.length}</span></header>
                <div className="space-y-3 p-3">{records.map((task) => <TaskCard key={task.id} task={task} onMove={(next) => move(task.id, next)} />)}{!records.length && <div className="rounded-lg border border-dashed border-white/[0.07] p-5 text-center text-[9px] leading-4 text-gray-700">Drop a valid task here or assign new work.</div>}</div>
              </section>;
            })}
          </div>
        </div>
      </div>
    </section>
  </div>;
};

const TaskCard = ({ task, onMove }: { task: ReturnType<typeof aglTaskWorkflow.tasks>[number]; onMove: (status: string) => void }) => {
  const isOverdue = !['Completed', 'Cancelled'].includes(task.status) && String(task.dueDate) < today();
  const next = aglTaskWorkflow.allowedNext(task.status);
  return <article draggable onDragStart={(event) => { event.dataTransfer.setData('text/task-id', task.id); event.dataTransfer.effectAllowed = 'move'; }} className={`cursor-grab rounded-xl border bg-[#0c0c0c] p-4 active:cursor-grabbing ${isOverdue ? 'border-rose-400/30' : 'border-white/[0.08]'}`}>
    <div className="flex items-start justify-between gap-3"><span className={`rounded px-2 py-1 font-mono text-[7px] uppercase ${task.priority === 'Urgent' ? 'bg-rose-400/10 text-rose-300' : task.priority === 'High' ? 'bg-amber-400/10 text-amber-300' : 'bg-white/[0.05] text-gray-500'}`}>{String(task.priority)}</span><span className="font-mono text-[7px] text-gray-700">{task.id}</span></div>
    <h3 className="mt-3 text-xs font-medium leading-5 text-gray-100">{String(task.title ?? task.name)}</h3>
    <p className="mt-2 line-clamp-3 text-[9px] leading-4 text-gray-500">{String(task.details)}</p>
    <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3 text-[8px]"><div className="flex items-center gap-2 text-gray-400"><UserRound size={11} className="text-cyan-300" /> {String(task.assignedTo)} · {String(task.department)}</div><div className={isOverdue ? 'flex items-center gap-2 text-rose-300' : 'flex items-center gap-2 text-gray-500'}><CalendarClock size={11} /> {String(task.dueDate)} {String(task.dueTime ?? '')}</div>{task.sourceRecord && <div className="flex items-center gap-2 text-gray-500"><Link2 size={11} /> {String(task.sourceModule)} · {String(task.sourceRecord)}</div>}</div>
    {next.length > 0 && <select aria-label={`Move ${String(task.title)} to`} defaultValue="" onChange={(event) => { if (event.target.value) onMove(event.target.value); event.target.value = ''; }} className="mt-4 h-9 w-full rounded-lg border border-white/[0.08] bg-black px-2 font-mono text-[8px] uppercase text-gray-300"><option value="">Move to…</option>{next.map((status) => <option key={status}>{status}</option>)}</select>}
  </article>;
};

const Signal = ({ label, value, warning = false }: { label: string; value: string | number; warning?: boolean }) => <div className="min-w-24 rounded-lg border border-white/[0.08] bg-[#090909] px-3 py-3"><div className="font-mono text-[7px] uppercase text-gray-600">{label}</div><div className={`mt-1 font-mono text-base ${warning ? 'text-rose-300' : 'text-white'}`}>{value}</div></div>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-2 block font-mono text-[8px] uppercase tracking-[0.12em] text-gray-600">{label}</span><div className="[&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.08] [&_input]:bg-black/25 [&_input]:px-3 [&_input]:text-xs [&_input]:text-white [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.08] [&_select]:bg-black/25 [&_select]:px-3 [&_select]:text-xs [&_select]:text-gray-300 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-white/[0.08] [&_textarea]:bg-black/25 [&_textarea]:p-3 [&_textarea]:text-xs [&_textarea]:text-white">{children}</div></label>;
