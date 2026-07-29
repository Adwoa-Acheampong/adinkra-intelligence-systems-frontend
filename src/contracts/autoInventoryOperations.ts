export type InventoryHealth = 'Available' | 'Low cover' | 'Stockout' | 'Quarantined';
export type InventoryEvidenceState = 'Verified' | 'Pending' | 'Failed';
export type InventoryMovementType = 'Receipt' | 'Issue' | 'Reservation' | 'Adjustment' | 'Return';
export type ReorderState = 'Draft' | 'Approval required' | 'Ordered';

export interface InventoryJobExposure {
  jobId: string;
  vehicle: string;
  promisedAt: string;
  requiredQuantity: number;
}

export interface InventoryProvenance {
  batchId: string;
  supplierDocument: string;
  receivedAt: string;
  state: InventoryEvidenceState;
}

export interface AutoInventoryItem {
  sku: string;
  name: string;
  category: string;
  make: string;
  fitment: string;
  supplier: string;
  onHand: number;
  reserved: number;
  incoming: number;
  reorderPoint: number;
  weeklyDemand: number;
  unitCostGhs: number;
  leadTimeDays: number;
  health: InventoryHealth;
  countedAt: string;
  countVariance: number;
  nextDecision: string;
  exposures: InventoryJobExposure[];
  provenance: InventoryProvenance;
}

export interface AutoInventoryMovement {
  id: string;
  at: string;
  type: InventoryMovementType;
  sku: string;
  quantity: number;
  reference: string;
  actor: string;
  resultingOnHand: number;
  evidence: InventoryEvidenceState;
}

export interface InventoryReorderDecision {
  id: string;
  sku: string;
  recommendedQuantity: number;
  supplier: string;
  coverBeforeDays: number;
  coverAfterDays: number;
  landedCostGhs: number;
  dueAt: string;
  state: ReorderState;
  rationale: string;
}

export interface AutoInventorySnapshot {
  tenantId: string;
  tenantName: string;
  asOf: string;
  source: string;
  totalSkus: number;
  outOfStockSkus: number;
  lowCoverSkus: number;
  trustedBookValueGhs: number;
  rawBookValueGhs: number;
  valuationConfidence: number;
  countAccuracy: number;
  serviceDemandCovered: number;
  items: AutoInventoryItem[];
  movements: AutoInventoryMovement[];
  reorderQueue: InventoryReorderDecision[];
}

export interface InventoryQuery {
  tenantId: string;
  period: 'today' | '7d' | '30d';
}

export interface AutoInventoryOperationsPort {
  loadInventorySnapshot(query: InventoryQuery): Promise<AutoInventorySnapshot>;
}
