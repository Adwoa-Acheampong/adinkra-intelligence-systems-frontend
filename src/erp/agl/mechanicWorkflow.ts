import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface MechanicAssignmentActor {
  name: string;
  role: string;
}

const activeJobStates = new Set(['Intake', 'Diagnosis', 'Awaiting parts', 'In progress', 'Quality control', 'Ready']);
const requireRecord = (moduleId: string, recordId: string) => {
  const record = aglErpRepository.list(moduleId).find((candidate) => candidate.id === recordId);
  if (!record) throw new Error(`${recordId} was not found in ${moduleId}.`);
  return record;
};

export const aglMechanicWorkflow = {
  jobs(): AglOperationalRecord[] {
    return aglErpRepository.list('work-orders').filter((job) => activeJobStates.has(job.status));
  },

  mechanics(): AglOperationalRecord[] {
    const profiles = aglErpRepository.list('mechanics');
    const employees = aglErpRepository.list('employees').filter((employee) => (
      employee.status === 'Active'
      && String(employee.department ?? '').toLowerCase() === 'workshop'
    ));
    return employees.map((employee) => {
      const profile = profiles.find((candidate) => candidate.id === employee.id || candidate.name === employee.name);
      const currentJobs = this.jobs().filter((job) => job.mechanic === employee.name);
      return {
        ...employee,
        ...profile,
        id: employee.id,
        name: employee.name,
        employeeRole: employee.role,
        employeeDepartment: employee.department,
        currentJobs: currentJobs.length,
        currentJobIds: currentJobs.map((job) => job.id).join(', '),
        bays: Array.from(new Set(currentJobs.map((job) => String(job.bay ?? 'Unassigned')))).join(', '),
        capacityState: currentJobs.length === 0 ? 'Available' : currentJobs.length >= 2 ? 'At capacity' : 'Assigned',
      };
    });
  },

  assign(actor: MechanicAssignmentActor, values: { jobId: string; mechanicId: string; bay: string }) {
    const job = requireRecord('work-orders', values.jobId);
    if (!activeJobStates.has(job.status)) throw new Error('Only active work orders can be assigned.');
    const mechanic = requireRecord('employees', values.mechanicId);
    if (mechanic.status !== 'Active' || String(mechanic.department ?? '').toLowerCase() !== 'workshop') {
      throw new Error('Select an active workshop employee.');
    }
    if (!values.bay || values.bay === 'Unassigned') throw new Error('Select a workshop bay.');
    const bayConflict = this.jobs().find((candidate) => (
      candidate.id !== job.id
      && candidate.bay === values.bay
      && ['Diagnosis', 'In progress', 'Quality control'].includes(candidate.status)
    ));
    if (bayConflict) throw new Error(`${values.bay} is occupied by ${bayConflict.id}. Move that job or select another bay.`);
    const correlationId = `CORR-ASSIGNMENT-${Date.now()}`;
    const assigned = aglErpRepository.update({
      moduleId: 'work-orders',
      recordId: job.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        mechanic: String(mechanic.name),
        mechanicId: mechanic.id,
        bay: values.bay,
        assignedBy: actor.name,
        assignedAt: new Date().toISOString(),
      },
    });
    const profile = aglErpRepository.list('mechanics').find((candidate) => candidate.id === mechanic.id || candidate.name === mechanic.name);
    if (profile) {
      aglErpRepository.update({
        moduleId: 'mechanics',
        recordId: profile.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: { job: job.id, bay: values.bay, status: 'Assigned' },
      });
    }
    return assigned;
  },
};
