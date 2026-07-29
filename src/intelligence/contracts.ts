import type { VerticalId } from '../types';

export type ScopeLevel =
  | 'continent'
  | 'region'
  | 'country'
  | 'city'
  | 'vertical'
  | 'tenant'
  | 'department'
  | 'entity'
  | 'event'
  | 'evidence';

export type MetricDomain =
  | 'inventory'
  | 'operations'
  | 'sales'
  | 'finance'
  | 'workforce'
  | 'trust'
  | 'telemetry';

export type AggregationPolicy =
  | 'additive'
  | 'ratio'
  | 'latest-state'
  | 'distinct'
  | 'ranking';

export type ConfidenceBand = 'high' | 'review' | 'restricted';
export type EvidenceKind =
  | 'stock_count'
  | 'receipt'
  | 'job_card'
  | 'inspection'
  | 'photo'
  | 'payment_reference'
  | 'payroll_line'
  | 'employment_contract'
  | 'complaint'
  | 'audit_event'
  | 'telemetry_event';

export interface ScopeRef {
  level: ScopeLevel;
  id: string;
  name: string;
  parentId?: string;
  verticalId?: VerticalId;
}

export interface EvidenceReference {
  id: string;
  kind: EvidenceKind;
  title: string;
  capturedAt: string;
  capturedBy: string;
  location: string;
  digest: string;
  status: 'accepted' | 'review' | 'restricted';
  note: string;
}

export interface SourceEvent {
  id: string;
  type: string;
  occurredAt: string;
  recordedAt: string;
  actor: string;
  sourceSurface: string;
  sourceRecordId: string;
  scope: ScopeRef[];
  evidence: EvidenceReference[];
  confidence: number;
}

export interface MetricContributor {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  share: number;
  status: 'accepted' | 'review' | 'excluded';
  reason: string;
  scope: ScopeRef[];
  sourceEvent: SourceEvent;
}

export interface MetricDefinition {
  id: string;
  name: string;
  domain: MetricDomain;
  question: string;
  decision: string;
  owner: string;
  description: string;
  formula: string;
  numerator?: string;
  denominator?: string;
  unit: string;
  aggregation: AggregationPolicy;
  grain: string;
  sourceEvents: string[];
  dimensions: string[];
  supportedScopes: ScopeLevel[];
  freshnessTarget: string;
  confidencePolicy: string;
  inclusionRules: string[];
  exclusionRules: string[];
  access: 'internal' | 'institutional' | 'restricted';
  action: string;
}

export interface MetricObservation {
  id: string;
  metricId: string;
  scope: ScopeRef;
  asOf: string;
  period: string;
  value: number;
  displayValue: string;
  comparator: string;
  variance: string;
  freshnessMinutes: number;
  confidence: number;
  confidenceBand: ConfidenceBand;
  coverage: number;
  includedCount: number;
  excludedCount: number;
  contributors: MetricContributor[];
}

export interface RegisteredMetric {
  definition: MetricDefinition;
  observation: MetricObservation;
}

export interface OntologyEntityDefinition {
  id: string;
  label: string;
  family: 'identity' | 'place' | 'organisation' | 'asset' | 'work' | 'commerce' | 'employment' | 'evidence';
  meaning: string;
  stableIdPattern: string;
  relationships: string[];
  verticalExtensions: string[];
}

export interface SearchResult {
  id: string;
  type: 'metric' | 'tenant' | 'entity' | 'evidence';
  title: string;
  subtitle: string;
  path: string;
  scope: string;
  confidence?: number;
}
