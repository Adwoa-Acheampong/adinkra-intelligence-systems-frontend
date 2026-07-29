export type SaleChannel = 'Walk-in' | 'Phone' | 'Delivery' | 'WhatsApp' | 'Boss';
export type SalePaymentMethod = 'MoMo' | 'Cash' | 'POS' | 'Bank transfer' | 'Credit';
export type SalePaymentState = 'Paid' | 'Pending payment' | 'Part paid' | 'Refund review';
export type SaleLineType = 'Part' | 'Service';
export type SalesEvidenceState = 'Accepted' | 'Pending' | 'Missing';

export interface AutoSaleLine {
  id: string;
  type: SaleLineType;
  sku: string;
  description: string;
  quantity: number;
  unitPriceGhs: number;
  unitCostGhs: number;
  inventoryMovementId?: string;
}

export interface AutoSaleEvidence {
  label: string;
  state: SalesEvidenceState;
  reference?: string;
}

export interface AutoSaleTransaction {
  id: string;
  soldAt: string;
  customer: string;
  phone: string;
  channel: SaleChannel;
  vehicle: string;
  registration: string;
  jobId?: string;
  receiptId: string;
  paymentMethod: SalePaymentMethod;
  paymentState: SalePaymentState;
  amountGhs: number;
  collectedGhs: number;
  salesRep: string;
  mechanic?: string;
  nextDecision: string;
  lines: AutoSaleLine[];
  evidence: AutoSaleEvidence[];
}

export interface SalesChannelPerformance {
  channel: SaleChannel;
  orders: number;
  revenueGhs: number;
  grossMarginPct: number;
  paymentRealizationPct: number;
}

export interface SalesTenderReconciliation {
  method: SalePaymentMethod;
  expectedGhs: number;
  declaredGhs: number;
  evidenceCount: number;
  exceptionCount: number;
}

export interface AutoSalesSnapshot {
  tenantId: string;
  tenantName: string;
  asOf: string;
  source: string;
  periodRevenueGhs: number;
  periodOrders: number;
  averageSaleGhs: number;
  outstandingCreditGhs: number;
  collectedGhs: number;
  grossMarginPct: number;
  linkedJobCoveragePct: number;
  inventoryReferenceCoveragePct: number;
  transactions: AutoSaleTransaction[];
  channels: SalesChannelPerformance[];
  tenders: SalesTenderReconciliation[];
}

export interface SalesQuery {
  tenantId: string;
  period: 'today' | '7d' | '30d';
}

export interface AutoSalesOperationsPort {
  loadSalesSnapshot(query: SalesQuery): Promise<AutoSalesSnapshot>;
}
