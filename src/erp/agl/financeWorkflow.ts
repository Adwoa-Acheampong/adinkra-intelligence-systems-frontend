import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface FinanceActor {
  name: string;
  role: string;
}

const requireRecord = (moduleId: string, recordId: string) => {
  const record = aglErpRepository.list(moduleId).find((candidate) => candidate.id === recordId);
  if (!record) throw new Error(`${recordId} was not found.`);
  return record;
};

const createJournal = (
  actor: FinanceActor,
  correlationId: string,
  values: {
    name: string;
    reference: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    sourceModule: string;
    sourceRecordId: string;
    evidenceReference: string;
    notes: string;
  },
) => aglErpRepository.create({
  moduleId: 'finance-journals',
  actorName: actor.name,
  actorRole: actor.role,
  correlationId,
  values: { ...values, owner: actor.name, status: 'Posted', postedAt: new Date().toISOString() },
});

export const aglFinanceWorkflow = {
  expenses(): AglOperationalRecord[] {
    return aglErpRepository.list('expenses');
  },

  pettyCash(): AglOperationalRecord[] {
    return aglErpRepository.list('petty-cash');
  },

  reconciliations(): AglOperationalRecord[] {
    return aglErpRepository.list('reconciliation');
  },

  journals(): AglOperationalRecord[] {
    return aglErpRepository.list('finance-journals');
  },

  controls(): AglOperationalRecord | undefined {
    return aglErpRepository.listAll('finance-controls').find((record) => record.status === 'Active');
  },

  saveControls(actor: FinanceActor, values: {
    name: string;
    currency: string;
    fiscalYearStartMonth: string;
    vatRate: number;
    nhilRate: number;
    getfundRate: number;
    defaultPaymentTermsDays: number;
    expenseApprovalThresholdGhs: number;
    invoicePrefix: string;
    owner: string;
    notes: string;
  }) {
    if (!values.name.trim() || !values.currency.trim() || !values.invoicePrefix.trim()) {
      throw new Error('Control name, currency, and invoice prefix are required.');
    }
    if ([values.vatRate, values.nhilRate, values.getfundRate].some((rate) => rate < 0 || rate > 100)) {
      throw new Error('Tax rates must be between 0 and 100 percent.');
    }
    if (values.defaultPaymentTermsDays < 0 || values.expenseApprovalThresholdGhs < 0) {
      throw new Error('Payment terms and approval thresholds cannot be negative.');
    }
    const existing = this.controls();
    const command = {
      moduleId: 'finance-controls',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-FINANCE-CONTROLS-${Date.now()}`,
      values: {
        ...values,
        reference: 'AGL-FINANCE-CONTROLS',
        updatedBy: actor.name,
        effectiveAt: new Date().toISOString(),
        status: 'Active',
      },
    };
    return existing
      ? aglErpRepository.update({ ...command, recordId: existing.id })
      : aglErpRepository.create(command);
  },

  createExpense(actor: FinanceActor, values: {
    name: string;
    category: string;
    vendor: string;
    amount: number;
    expenseDate: string;
    paymentMethod: string;
    evidenceReference: string;
    owner: string;
    notes: string;
  }) {
    if (!values.name.trim() || !values.category.trim() || !values.vendor.trim()) throw new Error('Expense, category, and vendor are required.');
    if (values.amount <= 0) throw new Error('Expense amount must be greater than zero.');
    if (!values.evidenceReference.trim()) throw new Error('Invoice or receipt evidence is required.');
    return aglErpRepository.create({
      moduleId: 'expenses',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-EXPENSE-${Date.now()}`,
      values: { ...values, reference: values.evidenceReference, status: 'Draft' },
    });
  },

  submitExpense(expenseId: string, actor: FinanceActor) {
    const expense = requireRecord('expenses', expenseId);
    if (expense.status !== 'Draft') throw new Error('Only a draft expense can be submitted.');
    return aglErpRepository.changeStatus({
      moduleId: 'expenses',
      recordId: expense.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-EXPENSE-SUBMIT-${Date.now()}`,
      status: 'Approval required',
      values: { submittedBy: actor.name, submittedAt: new Date().toISOString() },
    });
  },

  approveExpense(expenseId: string, actor: FinanceActor, approver: string, approvalBasis: string) {
    const expense = requireRecord('expenses', expenseId);
    if (expense.status !== 'Approval required') throw new Error('This expense is not awaiting approval.');
    if (!approver.trim() || !approvalBasis.trim()) throw new Error('Approver and approval basis are required.');
    if (approver.trim().toLowerCase() === String(expense.owner ?? '').trim().toLowerCase()) {
      throw new Error('The expense owner cannot approve their own expense.');
    }
    const correlationId = `CORR-EXPENSE-APPROVAL-${Date.now()}`;
    const approved = aglErpRepository.changeStatus({
      moduleId: 'expenses',
      recordId: expense.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Approved',
      values: { approver, approvalBasis, approvedAt: new Date().toISOString() },
    });
    const journal = createJournal(actor, correlationId, {
      name: String(expense.name),
      reference: String(expense.evidenceReference ?? expense.reference),
      debitAccount: `Operating expense · ${String(expense.category ?? 'General')}`,
      creditAccount: 'Accounts payable',
      amount: Number(expense.amount ?? 0),
      sourceModule: 'expenses',
      sourceRecordId: expense.id,
      evidenceReference: String(expense.evidenceReference ?? expense.reference),
      notes: `Approved by ${approver} · ${approvalBasis}`,
    });
    return { expense: approved, journal };
  },

  settleExpense(expenseId: string, actor: FinanceActor, paymentReference: string) {
    const expense = requireRecord('expenses', expenseId);
    if (expense.status !== 'Approved') throw new Error('Approve the expense before settlement.');
    if (!paymentReference.trim()) throw new Error('Bank, MoMo, cash, or cheque reference is required.');
    const correlationId = `CORR-EXPENSE-SETTLE-${Date.now()}`;
    const settled = aglErpRepository.changeStatus({
      moduleId: 'expenses',
      recordId: expense.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Settled',
      values: { paymentReference, settledBy: actor.name, settledAt: new Date().toISOString() },
    });
    const journal = createJournal(actor, correlationId, {
      name: `Settle ${String(expense.name)}`,
      reference: paymentReference,
      debitAccount: 'Accounts payable',
      creditAccount: String(expense.paymentMethod ?? 'Cash and bank'),
      amount: Number(expense.amount ?? 0),
      sourceModule: 'expenses',
      sourceRecordId: expense.id,
      evidenceReference: paymentReference,
      notes: `Settlement of ${expense.id}`,
    });
    return { expense: settled, journal };
  },

  requestPettyCash(actor: FinanceActor, values: {
    entryType: 'Disbursement' | 'Replenishment';
    name: string;
    amount: number;
    custodian: string;
    evidenceReference: string;
    notes: string;
  }) {
    if (!values.name.trim() || !values.custodian.trim() || !values.evidenceReference.trim()) {
      throw new Error('Purpose, custodian, and evidence are required.');
    }
    if (values.amount <= 0) throw new Error('Petty-cash amount must be greater than zero.');
    return aglErpRepository.create({
      moduleId: 'petty-cash',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-PETTY-CASH-${Date.now()}`,
      values: {
        ...values,
        reference: values.evidenceReference,
        owner: values.custodian,
        status: 'Approval required',
      },
    });
  },

  approvePettyCash(recordId: string, actor: FinanceActor, approver: string, basis: string) {
    const entry = requireRecord('petty-cash', recordId);
    if (entry.status !== 'Approval required') throw new Error('This petty-cash entry is not awaiting approval.');
    if (!approver.trim() || !basis.trim()) throw new Error('Approver and approval basis are required.');
    if (approver.trim().toLowerCase() === String(entry.owner ?? '').trim().toLowerCase()) {
      throw new Error('The custodian cannot approve their own cash request.');
    }
    return aglErpRepository.changeStatus({
      moduleId: 'petty-cash',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-PETTY-CASH-APPROVAL-${Date.now()}`,
      status: 'Approved',
      values: { approver, approvalBasis: basis, approvedAt: new Date().toISOString() },
    });
  },

  settlePettyCash(recordId: string, actor: FinanceActor, cashReference: string) {
    const entry = requireRecord('petty-cash', recordId);
    if (entry.status !== 'Approved') throw new Error('Approve the cash entry before posting it.');
    if (!cashReference.trim()) throw new Error('Voucher or replenishment reference is required.');
    const correlationId = `CORR-PETTY-CASH-POST-${Date.now()}`;
    const settled = aglErpRepository.changeStatus({
      moduleId: 'petty-cash',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Settled',
      values: { cashReference, settledAt: new Date().toISOString(), settledBy: actor.name },
    });
    const disbursement = entry.entryType !== 'Replenishment';
    const journal = createJournal(actor, correlationId, {
      name: String(entry.name),
      reference: cashReference,
      debitAccount: disbursement ? 'Petty-cash expense' : 'Petty cash',
      creditAccount: disbursement ? 'Petty cash' : 'Bank',
      amount: Number(entry.amount ?? 0),
      sourceModule: 'petty-cash',
      sourceRecordId: entry.id,
      evidenceReference: String(entry.evidenceReference),
      notes: `${String(entry.entryType)} · custodian ${String(entry.custodian)}`,
    });
    return { entry: settled, journal };
  },

  startReconciliation(actor: FinanceActor, values: {
    channel: string;
    period: string;
    expectedAmount: number;
    declaredAmount: number;
    statementReference: string;
    owner: string;
    notes: string;
  }) {
    if (!values.channel.trim() || !values.period.trim() || !values.statementReference.trim()) {
      throw new Error('Tender channel, period, and external statement are required.');
    }
    const variance = values.declaredAmount - values.expectedAmount;
    return aglErpRepository.create({
      moduleId: 'reconciliation',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId: `CORR-RECON-${Date.now()}`,
      values: {
        ...values,
        name: `${values.channel} · ${values.period}`,
        reference: values.statementReference,
        amount: values.expectedAmount,
        variance,
        status: variance === 0 ? 'Settled' : 'Approval required',
      },
    });
  },

  resolveReconciliation(recordId: string, actor: FinanceActor, values: {
    approver: string;
    resolution: string;
    evidenceReference: string;
  }) {
    const record = requireRecord('reconciliation', recordId);
    if (record.status !== 'Approval required') throw new Error('Only a reconciliation break can be resolved.');
    if (!values.approver.trim() || !values.resolution.trim() || !values.evidenceReference.trim()) {
      throw new Error('Approver, resolution, and evidence are required.');
    }
    const correlationId = `CORR-RECON-RESOLVE-${Date.now()}`;
    const settled = aglErpRepository.changeStatus({
      moduleId: 'reconciliation',
      recordId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Settled',
      values: {
        ...values,
        resolvedAt: new Date().toISOString(),
        resolvedBy: actor.name,
      },
    });
    const journal = Number(record.variance ?? 0) === 0 ? undefined : createJournal(actor, correlationId, {
      name: `Reconciliation adjustment · ${String(record.channel)}`,
      reference: values.evidenceReference,
      debitAccount: Number(record.variance ?? 0) < 0 ? 'Tender shortage' : 'Cash and bank',
      creditAccount: Number(record.variance ?? 0) < 0 ? 'Cash and bank' : 'Tender overage',
      amount: Math.abs(Number(record.variance ?? 0)),
      sourceModule: 'reconciliation',
      sourceRecordId: record.id,
      evidenceReference: values.evidenceReference,
      notes: values.resolution,
    });
    return { reconciliation: settled, journal };
  },
};
