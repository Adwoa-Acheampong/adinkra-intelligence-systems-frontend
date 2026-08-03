import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface CommercialActor {
  name: string;
  role: string;
}

const requireText = (value: string, label: string) => {
  if (!value.trim()) throw new Error(`${label} is required.`);
};

const invoiceSnapshot = (invoiceId: string) => {
  const invoice = aglErpRepository.list('invoices').find((item) => item.id === invoiceId);
  if (!invoice) throw new Error('Invoice was not found.');
  const paid = aglErpRepository.list('payments')
    .filter((item) => item.invoiceId === invoiceId && item.status !== 'Voided')
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  return { invoice, paid, balance: Math.max(0, Number(invoice.amount ?? 0) - paid) };
};

export const aglCommercialDocumentsWorkflow = {
  invoiceSnapshot,

  createQuotation(actor: CommercialActor, values: { customer: string; customerContact: string; scope: string; amount: number; validUntil: string; owner: string; notes: string }) {
    requireText(values.customer, 'Customer');
    requireText(values.scope, 'Quotation scope');
    if (values.amount <= 0) throw new Error('Quotation amount must be greater than zero.');
    return aglErpRepository.create({
      moduleId: 'quotations',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: values.scope,
        reference: `QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        issuedAt: new Date().toISOString(),
      },
    });
  },

  sendQuotation(actor: CommercialActor, record: AglOperationalRecord) {
    return aglErpRepository.changeStatus({
      moduleId: 'quotations',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      status: 'Sent',
      values: { sentAt: new Date().toISOString(), sentBy: actor.name },
    });
  },

  acceptAndInvoice(actor: CommercialActor, record: AglOperationalRecord) {
    if (!['Sent', 'Accepted'].includes(record.status)) throw new Error('Send the quotation before accepting it.');
    const correlationId = `QUOTE-CONVERT-${Date.now()}`;
    aglErpRepository.changeStatus({
      moduleId: 'quotations',
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: 'Accepted',
      values: { acceptedAt: new Date().toISOString(), acceptedBy: actor.name },
    });
    return aglErpRepository.create({
      moduleId: 'invoices',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        name: record.name,
        customer: record.customer,
        customerContact: record.customerContact,
        reference: record.id,
        quotationId: record.id,
        amount: Number(record.amount ?? 0),
        issuedAt: new Date().toISOString(),
        dueDate: record.validUntil,
        owner: record.owner,
        notes: `Converted from accepted quotation ${record.id}.`,
      },
    });
  },

  createInvoice(actor: CommercialActor, values: { customer: string; scope: string; sourceReference: string; amount: number; dueDate: string; owner: string; notes: string }) {
    requireText(values.customer, 'Customer');
    requireText(values.scope, 'Invoice scope');
    requireText(values.sourceReference, 'Source reference');
    if (values.amount <= 0) throw new Error('Invoice amount must be greater than zero.');
    return aglErpRepository.create({
      moduleId: 'invoices',
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        name: values.scope,
        reference: values.sourceReference,
        issuedAt: new Date().toISOString(),
      },
    });
  },

  recordPayment(actor: CommercialActor, invoiceId: string, values: { amount: number; method: string; reference: string; receivedBy: string }) {
    const before = invoiceSnapshot(invoiceId);
    if (values.amount <= 0 || values.amount > before.balance) throw new Error(`Payment must be between GHS 0.01 and GHS ${before.balance.toFixed(2)}.`);
    requireText(values.reference, 'Tender reference');
    const correlationId = `PAYMENT-${Date.now()}`;
    const payment = aglErpRepository.create({
      moduleId: 'payments',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        name: `${values.method} · ${String(before.invoice.customer ?? before.invoice.name)}`,
        invoiceId,
        customer: before.invoice.customer,
        reference: values.reference,
        amount: values.amount,
        paymentMethod: values.method,
        receivedBy: values.receivedBy,
        receivedAt: new Date().toISOString(),
        owner: values.receivedBy,
        notes: `Payment against invoice ${invoiceId}.`,
      },
    });
    const afterBalance = before.balance - values.amount;
    aglErpRepository.changeStatus({
      moduleId: 'invoices',
      recordId: invoiceId,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      status: afterBalance <= 0 ? 'Paid' : 'Part paid',
      values: { paidGhs: before.paid + values.amount, balanceGhs: afterBalance, lastPaymentAt: new Date().toISOString() },
    });
    const debtor = aglErpRepository.list('debtors').find((item) => item.invoiceId === invoiceId);
    if (debtor) {
      aglErpRepository.update({
        moduleId: 'debtors',
        recordId: debtor.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: { amountPaid: Number(debtor.amountPaid ?? 0) + values.amount, outstanding: afterBalance },
      });
      if (afterBalance <= 0) {
        aglErpRepository.changeStatus({ moduleId: 'debtors', recordId: debtor.id, actorName: actor.name, actorRole: actor.role, correlationId, status: 'Settled', values: {} });
      }
    }
    return payment;
  },

  createCreditAccount(actor: CommercialActor, moduleId: 'creditors' | 'debtors', values: { name: string; contact: string; sourceReference: string; totalAmount: number; amountPaid: number; transactionDate: string; dueDate: string; owner: string; notes: string }) {
    requireText(values.name, moduleId === 'debtors' ? 'Customer' : 'Supplier');
    requireText(values.sourceReference, 'Source reference');
    if (values.totalAmount <= 0 || values.amountPaid < 0 || values.amountPaid > values.totalAmount) throw new Error('Credit amounts are inconsistent.');
    const outstanding = values.totalAmount - values.amountPaid;
    const created = aglErpRepository.create({
      moduleId,
      actorName: actor.name,
      actorRole: actor.role,
      values: {
        ...values,
        reference: values.sourceReference,
        amount: values.totalAmount,
        outstanding,
        status: outstanding <= 0 ? 'Settled' : 'Approved',
      },
    });
    return aglErpRepository.changeStatus({
      moduleId,
      recordId: created.id,
      actorName: actor.name,
      actorRole: actor.role,
      status: outstanding <= 0 ? 'Settled' : 'Approved',
      values: {},
    });
  },

  settleCredit(actor: CommercialActor, moduleId: 'creditors' | 'debtors', record: AglOperationalRecord, amount: number, paymentReference: string) {
    const outstanding = Number(record.outstanding ?? Number(record.amount ?? 0) - Number(record.amountPaid ?? 0));
    if (amount <= 0 || amount > outstanding) throw new Error(`Settlement must not exceed GHS ${outstanding.toFixed(2)}.`);
    requireText(paymentReference, 'Payment reference');
    const nextOutstanding = outstanding - amount;
    const correlationId = `CREDIT-SETTLE-${Date.now()}`;
    const updated = aglErpRepository.update({
      moduleId,
      recordId: record.id,
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        amountPaid: Number(record.amountPaid ?? 0) + amount,
        outstanding: nextOutstanding,
        lastPaymentReference: paymentReference,
        lastPaymentAt: new Date().toISOString(),
      },
    });
    if (nextOutstanding <= 0) {
      return aglErpRepository.changeStatus({ moduleId, recordId: record.id, actorName: actor.name, actorRole: actor.role, correlationId, status: 'Settled', values: {} });
    }
    return updated;
  },
};
