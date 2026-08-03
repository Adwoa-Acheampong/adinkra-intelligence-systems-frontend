import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface AglTaskActor {
  name: string;
  role: string;
}

export interface AglTaskInput {
  title: string;
  employeeId: string;
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  dueDate: string;
  dueTime?: string;
  details: string;
  sourceModule: string;
  sourceRecord?: string;
}

const transitions: Record<string, string[]> = {
  Open: ['In progress', 'Cancelled'],
  'In progress': ['Blocked', 'Completed', 'Cancelled'],
  Blocked: ['In progress', 'Cancelled'],
  Completed: ['In progress'],
  Cancelled: ['Open'],
};

export const AGL_TASK_STATUSES = ['Open', 'In progress', 'Blocked', 'Completed', 'Cancelled'] as const;

export const aglTaskWorkflow = {
  tasks(employeeId?: string): AglOperationalRecord[] {
    const records = aglErpRepository.list('tasks');
    return employeeId ? records.filter((item) => item.employeeId === employeeId || item.reference === employeeId) : records;
  },

  create(actor: AglTaskActor, input: AglTaskInput): AglOperationalRecord {
    const employee = aglErpRepository.list('employees').find((item) => item.id === input.employeeId);
    if (!employee) throw new Error('Select an active employee before assigning the task.');
    if (!input.title.trim()) throw new Error('Task title is required.');
    if (!input.details.trim()) throw new Error('Instructions or an acceptance condition are required.');
    if (!input.dueDate) throw new Error('A due date is required.');

    return aglErpRepository.create({
      moduleId: 'tasks',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        name: input.title.trim(),
        title: input.title.trim(),
        reference: employee.id,
        employeeId: employee.id,
        assignedTo: String(employee.name),
        department: String(employee.department ?? 'Unassigned'),
        priority: input.priority,
        dueDate: input.dueDate,
        dueTime: input.dueTime ?? '',
        dueDatetime: `${input.dueDate}${input.dueTime ? `T${input.dueTime}` : ''}`,
        details: input.details.trim(),
        sourceModule: input.sourceModule,
        sourceRecord: input.sourceRecord?.trim() ?? '',
        owner: actor.name,
      },
    });
  },

  changeStatus(actor: AglTaskActor, taskId: string, status: string): AglOperationalRecord {
    const task = aglErpRepository.list('tasks').find((item) => item.id === taskId);
    if (!task) throw new Error(`Task ${taskId} was not found.`);
    if (!AGL_TASK_STATUSES.includes(status as typeof AGL_TASK_STATUSES[number])) throw new Error(`${status} is not a valid task state.`);
    if (task.status !== status && !(transitions[task.status] ?? []).includes(status)) {
      throw new Error(`${task.status} tasks cannot move directly to ${status}.`);
    }
    const now = new Date().toISOString();
    return aglErpRepository.changeStatus({
      moduleId: 'tasks',
      recordId: taskId,
      actorName: actor.name,
      actorRole: actor.role,
      status,
      values: {
        startedAt: status === 'In progress' ? String(task.startedAt ?? now) : task.startedAt,
        completedAt: status === 'Completed' ? now : status === 'In progress' ? '' : task.completedAt,
        completedBy: status === 'Completed' ? actor.name : status === 'In progress' ? '' : task.completedBy,
      },
    });
  },

  allowedNext(status: string): string[] {
    return transitions[status] ?? [];
  },
};
