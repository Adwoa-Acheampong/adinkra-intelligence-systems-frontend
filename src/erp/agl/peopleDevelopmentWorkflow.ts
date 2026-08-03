import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface PeopleDevelopmentActor {
  name: string;
  role: string;
}

export const AGL_ONBOARDING_STEPS = [
  'Identity & statutory records',
  'Employment contract',
  'Payroll & benefits',
  'System access',
  'Safety induction',
  'Department induction',
] as const;

const required = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} is required.`);
};

const completedSteps = (record: AglOperationalRecord) => new Set(
  String(record.completedSteps ?? '').split('||').filter(Boolean),
);

const certificationStatus = (expiryDate: string) => {
  const expiry = new Date(`${expiryDate}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return 'Current';
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'Expired';
  if (days <= 60) return 'Expiring';
  return 'Current';
};

export const aglPeopleDevelopmentWorkflow = {
  positions() {
    return aglErpRepository.list('positions');
  },

  createPosition(actor: PeopleDevelopmentActor, values: { name: string; department: string; reportsTo: string; headcount: number; owner: string }) {
    required(values.name, 'Position title');
    required(values.department, 'Department');
    if (!Number.isFinite(values.headcount) || values.headcount < 1) throw new Error('Approved headcount must be at least one.');
    return aglErpRepository.create({
      moduleId: 'positions',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        employeeId: '',
        filledBy: '',
        reference: `POS-${String(Date.now()).slice(-7)}`,
      },
    });
  },

  assignPosition(actor: PeopleDevelopmentActor, position: AglOperationalRecord, employeeId: string) {
    const employee = aglErpRepository.list('employees').find((item) => item.id === employeeId);
    if (employeeId && !employee) throw new Error('Select a valid employee.');
    const updated = aglErpRepository.update({
      moduleId: 'positions',
      recordId: position.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        employeeId,
        filledBy: employee ? employee.name : '',
        status: employee ? 'Filled' : 'Open',
        assignedAt: employee ? new Date().toISOString() : '',
      },
    });
    if (employee) {
      aglErpRepository.update({
        moduleId: 'employees',
        recordId: employee.id,
        actorName: actor.name,
        actorRole: actor.role,
        values: { positionId: position.id, positionTitle: position.name },
      });
    }
    return updated;
  },

  startOnboarding(actor: PeopleDevelopmentActor, values: { employeeId: string; positionId: string; manager: string; startDate: string; owner: string }) {
    const employee = aglErpRepository.list('employees').find((item) => item.id === values.employeeId);
    const position = aglErpRepository.list('positions').find((item) => item.id === values.positionId);
    if (!employee) throw new Error('Select an employee.');
    if (!position) throw new Error('Select an approved position.');
    required(values.manager, 'Onboarding manager');
    required(values.startDate, 'Start date');
    const duplicate = aglErpRepository.list('onboarding').some((item) => item.employeeId === employee.id && !['Completed', 'Cancelled'].includes(item.status));
    if (duplicate) throw new Error('This employee already has an active onboarding case.');
    return aglErpRepository.create({
      moduleId: 'onboarding',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: `${String(employee.name)} onboarding`,
        employeeName: employee.name,
        positionName: position.name,
        completedSteps: '',
        reference: employee.id,
      },
    });
  },

  toggleOnboardingStep(actor: PeopleDevelopmentActor, record: AglOperationalRecord, step: string) {
    if (!AGL_ONBOARDING_STEPS.includes(step as typeof AGL_ONBOARDING_STEPS[number])) throw new Error('Unknown onboarding control.');
    const completed = completedSteps(record);
    if (completed.has(step)) completed.delete(step);
    else completed.add(step);
    const completeCount = completed.size;
    const status = completeCount === AGL_ONBOARDING_STEPS.length ? 'Completed' : completeCount > 0 ? 'In progress' : 'Not started';
    return aglErpRepository.update({
      moduleId: 'onboarding',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        completedSteps: [...completed].join('||'),
        completedCount: completeCount,
        completionPercent: Math.round((completeCount / AGL_ONBOARDING_STEPS.length) * 100),
        status,
        completedAt: status === 'Completed' ? new Date().toISOString() : '',
      },
    });
  },

  registerCertification(actor: PeopleDevelopmentActor, values: { employeeId: string; name: string; issuingBody: string; certificateNumber: string; skillGroup: string; issuedDate: string; expiryDate: string; owner: string }) {
    const employee = aglErpRepository.list('employees').find((item) => item.id === values.employeeId);
    if (!employee) throw new Error('Select an employee.');
    required(values.name, 'Certification');
    required(values.issuingBody, 'Issuing body');
    required(values.certificateNumber, 'Certificate number');
    required(values.issuedDate, 'Issue date');
    required(values.expiryDate, 'Expiry date');
    if (values.expiryDate < values.issuedDate) throw new Error('Expiry date cannot precede the issue date.');
    return aglErpRepository.create({
      moduleId: 'certifications',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        status: certificationStatus(values.expiryDate),
        employeeName: employee.name,
        reference: employee.id,
      },
    });
  },

  refreshCertificationStatus(actor: PeopleDevelopmentActor, record: AglOperationalRecord) {
    const status = certificationStatus(String(record.expiryDate));
    return aglErpRepository.update({
      moduleId: 'certifications',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: { status, reviewedAt: new Date().toISOString() },
    });
  },

  renewCertification(actor: PeopleDevelopmentActor, record: AglOperationalRecord) {
    const issuedDate = new Date().toISOString().slice(0, 10);
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    return aglErpRepository.update({
      moduleId: 'certifications',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        issuedDate,
        expiryDate: expiry.toISOString().slice(0, 10),
        status: 'Current',
        renewedAt: new Date().toISOString(),
        renewedBy: actor.name,
      },
    });
  },
};
