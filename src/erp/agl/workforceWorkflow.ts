import { aglErpRepository } from './repository';

export interface WorkforceActor {
  name: string;
  role: string;
}

const requireEmployee = (employeeId: string) => {
  const employee = aglErpRepository.list('employees').find((item) => item.id === employeeId);
  if (!employee) throw new Error(`Employee ${employeeId} was not found.`);
  return employee;
};

export const aglWorkforceWorkflow = {
  employees() {
    return aglErpRepository.list('employees');
  },

  addEmployee(actor: WorkforceActor, values: {
    name: string;
    role: string;
    department: string;
    phone: string;
    email: string;
    payBasis: string;
    basePayGhs: number;
    compensationEffectiveDate: string;
    startDate: string;
    owner: string;
    ghanaCardId?: string;
    ssnitNumber?: string;
    healthInsurance?: string;
    workStart?: string;
    workEnd?: string;
    payrollOnly?: boolean;
  }) {
    if (!values.name.trim() || !values.role.trim() || !values.department.trim() || !values.startDate) {
      throw new Error('Name, role, department, and start date are required.');
    }
    if (!Number.isFinite(Number(values.basePayGhs)) || Number(values.basePayGhs) <= 0) {
      throw new Error('Enter the employee’s contracted pay amount before saving the employee.');
    }
    if (!values.compensationEffectiveDate) {
      throw new Error('The compensation effective date is required.');
    }
    if (values.workStart && values.workEnd && values.workEnd <= values.workStart) {
      throw new Error('The employee work end must be later than the work start.');
    }
    const duplicate = this.employees().find((employee) => (
      values.email && String(employee.email).toLowerCase() === values.email.toLowerCase()
    ));
    if (duplicate) throw new Error(`${values.email} is already assigned to ${String(duplicate.name)}.`);
    return aglErpRepository.create({
      moduleId: 'employees',
      actorName: actor.name,
      actorRole: actor.role,
      values: { ...values, status: 'Active' },
    });
  },

  updateEmployee(actor: WorkforceActor, employeeId: string, values: Record<string, string | number | boolean | undefined>) {
    const employee = requireEmployee(employeeId);
    const payAmount = Number(values.basePayGhs ?? employee.basePayGhs ?? 0);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      throw new Error('Enter a contracted pay amount greater than zero.');
    }
    if (!String(values.compensationEffectiveDate ?? employee.compensationEffectiveDate ?? '').trim()) {
      throw new Error('The compensation effective date is required.');
    }
    const workStart = String(values.workStart ?? employee.workStart ?? '08:00');
    const workEnd = String(values.workEnd ?? employee.workEnd ?? '18:00');
    if (workEnd <= workStart) throw new Error('The employee work end must be later than the work start.');
    return aglErpRepository.update({
      moduleId: 'employees',
      recordId: employeeId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-EMPLOYEE-TERMS-${Date.now()}`,
      values: {
        ...values,
        basePayGhs: payAmount,
        compensationLastChangedAt: Number(employee.basePayGhs ?? 0) !== payAmount
          ? new Date().toISOString()
          : employee.compensationLastChangedAt,
      },
    });
  },

  departments() {
    const declared = aglErpRepository.list('departments');
    const staff = this.employees();
    const names = Array.from(new Set([
      ...declared.map((item) => String(item.name)),
      ...staff.map((employee) => String(employee.department ?? 'Unassigned')),
    ]));
    return names.map((name) => ({
      id: declared.find((item) => item.name === name)?.id ?? `DEP-${name.replace(/\W+/g, '-').toUpperCase()}`,
      name,
      employees: staff.filter((employee) => String(employee.department ?? 'Unassigned') === name),
    }));
  },

  schedules() {
    return aglErpRepository.list('schedules');
  },

  createSchedule(actor: WorkforceActor, values: {
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    shiftType: string;
    notes: string;
  }) {
    const employee = requireEmployee(values.employeeId);
    if (!values.date || !values.startTime || !values.endTime || values.endTime <= values.startTime) {
      throw new Error('Provide a valid shift date and time range.');
    }
    const duplicate = this.schedules().find((schedule) => schedule.employeeId === values.employeeId && schedule.date === values.date);
    if (duplicate) throw new Error(`${String(employee.name)} already has a shift on ${values.date}.`);
    return aglErpRepository.create({
      moduleId: 'schedules',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: employee.name,
        reference: employee.id,
        owner: actor.name,
        status: 'Pending',
      },
    });
  },

  updateScheduleStatus(actor: WorkforceActor, scheduleId: string, status: string) {
    return aglErpRepository.changeStatus({
      moduleId: 'schedules',
      recordId: scheduleId,
      actorName: actor.name,
      actorRole: actor.role,
      status,
      values: { statusChangedAt: new Date().toISOString() },
    });
  },

  training() {
    return aglErpRepository.list('training');
  },

  assignTraining(actor: WorkforceActor, values: {
    employeeId: string;
    course: string;
    provider: string;
    dueDate: string;
    certification: string;
    expiryDate: string;
    notes: string;
  }) {
    const employee = requireEmployee(values.employeeId);
    if (!values.course.trim() || !values.dueDate) throw new Error('Course and due date are required.');
    return aglErpRepository.create({
      moduleId: 'training',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: values.course,
        employee: employee.name,
        employeeId: employee.id,
        reference: employee.id,
        owner: actor.name,
        status: 'Pending',
      },
    });
  },

  completeTraining(actor: WorkforceActor, trainingId: string, evidenceReference: string) {
    if (!evidenceReference.trim()) throw new Error('Certificate or completion evidence is required.');
    return aglErpRepository.changeStatus({
      moduleId: 'training',
      recordId: trainingId,
      actorName: actor.name,
      actorRole: actor.role,
      status: 'Completed',
      values: {
        evidenceReference,
        completedAt: new Date().toISOString(),
        completedBy: actor.name,
      },
    });
  },

  performance() {
    const employees = this.employees();
    const jobs = aglErpRepository.list('work-orders');
    const inspections = aglErpRepository.list('inspections');
    const recalls = aglErpRepository.list('recalls');
    const complaints = aglErpRepository.list('complaints');
    return employees.map((employee) => {
      const assigned = jobs.filter((job) => String(job.mechanic ?? '').toLowerCase() === String(employee.name).toLowerCase());
      const completed = assigned.filter((job) => job.status === 'Closed');
      const revenue = completed.reduce((sum, job) => sum + Number(job.amount ?? 0), 0);
      const passed = inspections.filter((inspection) => (
        inspection.status === 'Pass'
        && assigned.some((job) => job.id === inspection.jobId || job.id === inspection.reference)
      )).length;
      const inspected = inspections.filter((inspection) => assigned.some((job) => job.id === inspection.jobId || job.id === inspection.reference)).length;
      const recallCount = recalls.filter((recall) => assigned.some((job) => job.id === recall.reference || job.id === recall.jobId)).length;
      const complaintCount = complaints.filter((complaint) => assigned.some((job) => job.id === complaint.reference || job.id === complaint.jobId)).length;
      const qualityRate = inspected ? passed / inspected * 100 : completed.length ? 100 : 0;
      const score = Math.max(0, Math.min(100, 55 + completed.length * 4 + qualityRate * 0.35 - recallCount * 8 - complaintCount * 5));
      return {
        employee,
        assigned: assigned.length,
        completed: completed.length,
        revenue,
        qualityRate,
        recallCount,
        complaintCount,
        score,
      };
    }).filter((row) => row.assigned > 0 || String(row.employee.department).toLowerCase() === 'workshop');
  },

  payslips() {
    return aglErpRepository.list('payslips');
  },
};
