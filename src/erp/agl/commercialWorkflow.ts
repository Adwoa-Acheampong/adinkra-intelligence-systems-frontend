import type { AglOperationalRecord } from './contracts';
import { aglErpRepository } from './repository';

export interface CommercialActor {
  name: string;
  role: string;
}

export interface SaleLineInput {
  stockId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceGhs: number;
}

export interface CompleteSaleInput {
  lines: SaleLineInput[];
  customer: string;
  customerPhone: string;
  channel: string;
  paymentMethod: string;
  salesRep: string;
  mechanic: string;
  discountPercent: number;
  taxPercent: number;
  notes: string;
}

const requireStock = (line: SaleLineInput) => {
  const stock = aglErpRepository.list('stock-ledger').find((item) => item.id === line.stockId || item.sku === line.sku);
  if (!stock) throw new Error(`${line.sku} was not found in the stock ledger.`);
  const available = Number(stock.quantity ?? 0) - Number(stock.reserved ?? 0);
  if (line.quantity <= 0) throw new Error(`${line.name} quantity must be greater than zero.`);
  if (line.quantity > available) throw new Error(`Only ${available} unreserved ${line.name} unit(s) are available.`);
  if (line.unitPriceGhs < 0) throw new Error(`${line.name} price cannot be negative.`);
  return stock;
};

const receiptNumber = () => `AGL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-5)}`;

export const aglCommercialWorkflow = {
  stock() {
    return aglErpRepository.list('stock-ledger').filter((item) => item.status !== 'Quarantined' && Number(item.quantity ?? 0) > 0);
  },

  sales() {
    return aglErpRepository.list('new-sale');
  },

  completeSale(actor: CommercialActor, input: CompleteSaleInput) {
    if (!input.lines.length) throw new Error('Add at least one sale line.');
    input.lines.forEach(requireStock);
    if (!input.customer.trim()) throw new Error('Customer name or Walk-in is required.');
    if (!input.salesRep.trim()) throw new Error('The accountable sales representative is required.');
    const subtotal = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceGhs, 0);
    const discount = subtotal * Math.max(0, Math.min(100, input.discountPercent)) / 100;
    const taxable = subtotal - discount;
    const tax = taxable * Math.max(0, Math.min(100, input.taxPercent)) / 100;
    const amount = Number((taxable + tax).toFixed(2));
    const receipt = receiptNumber();
    const correlationId = `CORR-SALE-${Date.now()}`;
    const sale = aglErpRepository.create({
      moduleId: 'new-sale',
      actorName: actor.name,
      actorRole: actor.role,
      correlationId,
      values: {
        name: input.lines.length === 1 ? input.lines[0].name : `${input.lines.length} sale lines`,
        item: input.lines.map((line) => `${line.quantity}× ${line.name}`).join(' · '),
        quantity: input.lines.reduce((sum, line) => sum + line.quantity, 0),
        reference: receipt,
        receipt,
        customer: input.customer,
        customerPhone: input.customerPhone,
        channel: input.channel,
        paymentMethod: input.paymentMethod,
        owner: input.salesRep,
        salesRep: input.salesRep,
        mechanic: input.mechanic,
        subtotal,
        discountPercent: input.discountPercent,
        discount,
        taxPercent: input.taxPercent,
        tax,
        amount,
        lineItems: JSON.stringify(input.lines),
        notes: input.notes,
        status: input.paymentMethod === 'Credit' ? 'Awaiting payment' : 'Paid',
      },
    });
    input.lines.forEach((line) => {
      aglErpRepository.create({
        moduleId: 'stock-movements',
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: {
          movementType: 'Issue',
          sku: line.sku,
          name: line.name,
          quantity: line.quantity,
          location: String(requireStock(line).location ?? 'Main store'),
          reference: sale.id,
          saleId: sale.id,
          owner: input.salesRep,
          notes: `Stock consumed by sale ${sale.id} / ${receipt}.`,
          status: 'Posted',
        },
      });
    });
    if (input.paymentMethod === 'Credit') {
      aglErpRepository.create({
        moduleId: 'debtors',
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: {
          name: input.customer,
          customer: input.customer,
          phone: input.customerPhone,
          reference: sale.id,
          owner: input.salesRep,
          amount,
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          notes: `Credit sale ${receipt}.`,
          status: 'Open',
        },
      });
    }
    const customer = aglErpRepository.list('customers').find((item) => (
      String(item.name ?? item.customer).trim().toLowerCase() === input.customer.trim().toLowerCase()
      || (input.customerPhone && item.phone === input.customerPhone)
    ));
    if (customer) {
      aglErpRepository.update({
        moduleId: 'customers',
        recordId: customer.id,
        actorName: actor.name,
        actorRole: actor.role,
        correlationId,
        values: {
          lastSaleId: sale.id,
          lastSaleAt: new Date().toISOString(),
          lifetimeSpendGhs: Number(customer.lifetimeSpendGhs ?? 0) + amount,
        },
      });
    }
    return sale;
  },

  receipt(saleId: string): { sale: AglOperationalRecord; lines: SaleLineInput[] } {
    const sale = this.sales().find((item) => item.id === saleId);
    if (!sale) throw new Error(`Sale ${saleId} was not found.`);
    let lines: SaleLineInput[] = [];
    try {
      lines = JSON.parse(String(sale.lineItems ?? '[]')) as SaleLineInput[];
    } catch {
      lines = [];
    }
    return { sale, lines };
  },
};
