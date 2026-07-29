export type WorkOrderStatus =
  | 'Diagnosis'
  | 'Awaiting parts'
  | 'In progress'
  | 'Quality control'
  | 'Ready';

export type WorkOrderPriority = 'Routine' | 'Priority' | 'Critical';
export type EvidenceState = 'Accepted' | 'Pending' | 'Missing';

export interface WorkOrderPart {
  sku: string;
  name: string;
  quantity: number;
  available: number;
  source: 'AGL stock' | 'Verified supplier' | 'Outhouse';
  state: 'Reserved' | 'Short' | 'Issued';
}

export interface WorkOrderEvidence {
  label: string;
  state: EvidenceState;
  capturedAt?: string;
}

export interface AutoWorkOrder {
  id: string;
  vehicleId: string;
  registration: string;
  vehicle: string;
  customer: string;
  complaint: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  mechanic: string;
  supervisor: string;
  bay: string;
  openedAt: string;
  promisedAt: string;
  elapsedHours: number;
  targetHours: number;
  estimateGhs: number;
  approvedGhs: number;
  completion: number;
  diagnostic: string;
  nextDecision: string;
  parts: WorkOrderPart[];
  evidence: WorkOrderEvidence[];
}

export interface WorkshopCapacity {
  label: string;
  assigned: number;
  capacity: number;
  unit: string;
}

export interface AutoWorkshopSnapshot {
  tenantId: string;
  tenantName: string;
  asOf: string;
  source: string;
  coverage: number;
  firstPassQc: number;
  workOrders: AutoWorkOrder[];
  capacity: WorkshopCapacity[];
}

export interface WorkshopQuery {
  tenantId: string;
  period: 'today' | '7d' | '30d';
}

export interface AutoOperationsPort {
  loadWorkshopSnapshot(query: WorkshopQuery): Promise<AutoWorkshopSnapshot>;
}

