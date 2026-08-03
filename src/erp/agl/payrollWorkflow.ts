import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';
import { aglAttendanceWorkflow } from './attendanceWorkflow';

export interface PayrollActor {
  name: string;
  role: string;
}

export interface PayrollAmounts {
  basePay: number;
  bonus: number;
  overtime: number;
  tax: number;
  pension: number;
  otherDeductions: number;
}

const requireLine = (lineId: string) => {
  const line = aglErpRepository.list('payroll').find((candidate) => candidate.id === lineId);
  if (!line) throw new Error(`Payroll line ${lineId} was not found.`);
  return line;
};

export const calculateNetPay = (values: PayrollAmounts) => (
  values.basePay + values.bonus + values.overtime - values.tax - values.pension - values.otherDeductions
);

export const aglPayrollWorkflow = {
  lines(): AglOperationalRecord[] {
    return aglErpRepository.list('payroll');
  },

  payslips(): AglOperationalRecord[] {
    return aglErpRepository.list('payslips');
  },

  syncFromEmployeeTerms(actor: PayrollActor, period: string) {
    if (!period.trim()) throw new Error('Choose a payroll period before loading employee pay terms.');
    const periodDate = new Date(`${period} 1`);
    if (Number.isNaN(periodDate.getTime())) throw new Error('Use a recognizable payroll period such as July 2026.');
    const year = periodDate.getFullYear();
    const month = periodDate.getMonth() + 1;
    const employees = aglErpRepository.list('employees').filter((employee) => employee.status === 'Active');
    if (!employees.length) throw new Error('There are no active employees to load into payroll.');
    const missingTerms = employees.filter((employee) => Number(employee.basePayGhs ?? 0) <= 0);
    if (missingTerms.length) {
      throw new Error(`Add contracted pay to: ${missingTerms.map((employee) => String(employee.name)).join(', ')}.`);
    }
    const openLines = this.lines().filter((line) => line.status !== 'Processed');
    const correlationId = `CORR-PAYROLL-TERMS-${Date.now()}`;
    return employees.map((employee) => {
      const existing = openLines.find((line) => line.reference === employee.id);
      const contractedRateGhs = Number(employee.basePayGhs);
      const payBasis = String(employee.payBasis ?? 'Monthly');
      const payrollOnly = employee.payrollOnly === true;
      const attendance = payrollOnly ? null : aglAttendanceWorkflow.summary(employee.id, year, month);
      const payUnits = payrollOnly
        ? 1
        : payBasis === 'Daily'
        ? attendance!.payableDays
        : payBasis === 'Hourly'
          ? attendance!.totalHours
          : 1;
      const basePay = contractedRateGhs * payUnits;
      const values = {
        name: employee.name,
        reference: employee.id,
        payBasis,
        contractedRateGhs,
        payUnits,
        basePayCalculation: payrollOnly
          ? 'Payroll-only contracted amount · attendance excluded'
          : payBasis === 'Daily'
          ? `${attendance!.payableDays} payable day(s) × ${contractedRateGhs}`
          : payBasis === 'Hourly'
            ? `${attendance!.totalHours.toFixed(2)} recorded hour(s) × ${contractedRateGhs}`
            : `${payBasis} contracted amount`,
        payrollOnly,
        compensationSource: employee.currentContractId
          ? `Employee master · ${String(employee.currentContractId)}`
          : 'Employee master',
        compensationEffectiveDate: employee.compensationEffectiveDate,
        period,
        basePay,
        bonus: Number(existing?.bonus ?? 0),
        overtime: Number(existing?.overtime ?? 0),
        tax: Number(existing?.tax ?? 0),
        pension: Number(existing?.pension ?? 0),
        otherDeductions: Number(existing?.otherDeductions ?? 0),
        amount: calculateNetPay({
          basePay,
          bonus: Number(existing?.bonus ?? 0),
          overtime: Number(existing?.overtime ?? 0),
          tax: Number(existing?.tax ?? 0),
          pension: Number(existing?.pension ?? 0),
          otherDeductions: Number(existing?.otherDeductions ?? 0),
        }),
        owner: existing?.owner ?? actor.name,
        termsLoadedAt: new Date().toISOString(),
        status: 'Draft',
      };
      return existing
        ? aglErpRepository.update({
            moduleId: 'payroll',
            recordId: existing.id,
            actorName: actor.name,
            actorRole: actor.role,
            correlationId,
            values,
          })
        : aglErpRepository.create({
            moduleId: 'payroll',
            actorName: actor.name,
            actorRole: actor.role,
            correlationId,
            values,
          });
    });
  },

  recalculate(lineId: string, actor: PayrollActor, amounts: PayrollAmounts, reason: string) {
    const line = requireLine(lineId);
    if (line.status === 'Processed') throw new Error('Processed payroll is immutable. Use a later correction run.');
    if (!reason.trim()) throw new Error('A calculation or correction basis is required.');
    const employee = aglErpRepository.list('employees').find((candidate) => candidate.id === line.reference);
    if (employee && Number(employee.basePayGhs ?? 0) !== Number(amounts.basePay)) {
      throw new Error('Base pay must match the employee master. Change the employee pay terms, then reload the payroll batch.');
    }
    const amount = calculateNetPay(amounts);
    if (amount < 0) throw new Error('Net pay cannot be negative.');
    return aglErpRepository.update({
      moduleId: 'payroll',
      recordId: lineId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-PAYROLL-CALC-${Date.now()}`,
      values: {
        ...amounts,
        amount,
        calculationReason: reason,
        calculatedAt: new Date().toISOString(),
        calculatedBy: actor.name,
        status: 'Ready',
      },
    });
  },

  approveBatch(actor: PayrollActor, approver: string, approvalReference: string) {
    const lines = this.lines().filter((line) => line.status !== 'Processed');
    if (!lines.length) throw new Error('There are no unprocessed payroll lines.');
    if (lines.some((line) => line.status !== 'Ready')) throw new Error('Every line must be Ready before batch approval.');
    if (!approver.trim() || !approvalReference.trim()) throw new Error('Approver and approval reference are required.');
    if (lines.some((line) => String(line.owner ?? '').trim().toLowerCase() === approver.trim().toLowerCase())) {
      throw new Error('The payroll preparer cannot approve their own batch.');
    }
    const correlationId = `CORR-PAYROLL-APPROVAL-${Date.now()}`;
    return lines.map((line) => aglErpRepository.changeStatus({
      moduleId: 'payroll',
      recordId: line.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Approved',
      values: { approver, approvalReference, approvedAt: new Date().toISOString() },
    }));
  },

  processBatch(actor: PayrollActor, paymentReference: string, period: string) {
    const lines = this.lines().filter((line) => line.status !== 'Processed');
    if (!lines.length) throw new Error('This payroll batch is already processed.');
    if (lines.some((line) => line.status !== 'Approved')) throw new Error('Approve every payroll line before processing.');
    if (!paymentReference.trim() || !period.trim()) throw new Error('Payment reference and payroll period are required.');
    const correlationId = `CORR-PAYROLL-PROCESS-${Date.now()}`;
    return lines.map((line) => aglErpRepository.changeStatus({
      moduleId: 'payroll',
      recordId: line.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Processed',
      values: {
        paymentReference,
        period,
        processedAt: new Date().toISOString(),
        processedBy: actor.name,
      },
    }));
  },
};
