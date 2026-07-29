export type FixbotAgreement = 'Accepted' | 'Modified' | 'Overridden' | 'Escalated';
export type FixbotRisk = 'Low' | 'Medium' | 'High' | 'Critical';

export interface FixbotEvidence {
  id: string;
  label: string;
  kind: 'scan' | 'photo' | 'test_result' | 'technician_note' | 'approval';
  state: 'Accepted' | 'Review' | 'Missing';
  capturedAt?: string;
  capturedBy?: string;
}

export interface FixbotCase {
  id: string;
  jobCardId: string;
  registration: string;
  vehicle: string;
  faultFamily: string;
  complaint: string;
  recommendation: string;
  technicianFinding: string;
  aiConfidence: number;
  technicianConfidence: number;
  diagnosticMinutes: number;
  benchmarkMinutes: number;
  avoidedHours: number;
  agreement: FixbotAgreement;
  risk: FixbotRisk;
  evidenceCoverage: number;
  createdAt: string;
  owner: string;
  nextDecision: string;
  evidence: FixbotEvidence[];
}

export interface FixbotFamilyComparison {
  family: string;
  aiProposed: number;
  technicianAccepted: number;
  overridden: number;
}

export interface FixbotTrendPoint {
  day: string;
  aiAgreement: number;
  firstPass: number;
  medianMinutes: number;
}

export interface FixbotFunnelStage {
  name: string;
  value: number;
  fill: string;
}

export interface FixbotHistogramBin {
  bin: string;
  cases: number;
  review: number;
}

export interface FixbotCompositionSlice {
  name: string;
  value: number;
  fill: string;
}

export interface AutoFixbotSnapshot {
  tenantId: string;
  asOf: string;
  source: string;
  cases: FixbotCase[];
  familyComparison: FixbotFamilyComparison[];
  trend: FixbotTrendPoint[];
  funnel: FixbotFunnelStage[];
  confidenceDistribution: FixbotHistogramBin[];
  caseMix: FixbotCompositionSlice[];
}

export interface AutoFixbotPort {
  loadSnapshot(query: { tenantId: string; period: '7d' | '30d' }): Promise<AutoFixbotSnapshot>;
}
