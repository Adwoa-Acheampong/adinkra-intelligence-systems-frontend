export type AnalyticalIntent =
  | 'comparison'
  | 'trend'
  | 'distribution'
  | 'composition'
  | 'relationship'
  | 'flow'
  | 'geography'
  | 'investigation';

export interface VisualizationPolicy {
  intent: AnalyticalIntent;
  questionPattern: string;
  preferred: string[];
  avoid: string[];
  requiredContext: string[];
}

export const VISUALIZATION_POLICY: VisualizationPolicy[] = [
  {
    intent: 'comparison',
    questionPattern: 'How do entities, periods, plans or cohorts differ?',
    preferred: ['grouped column', 'ordered bar', 'bullet', 'variance bridge'],
    avoid: ['single-value cards', 'unlabelled radar', 'multiple unrelated pies'],
    requiredContext: ['common baseline', 'comparator', 'unit', 'material variance'],
  },
  {
    intent: 'trend',
    questionPattern: 'How is the measure changing and when did it shift?',
    preferred: ['line', 'area', 'small multiples'],
    avoid: ['bars for dense time series', 'dual axis without causal need'],
    requiredContext: ['time grain', 'target or prior period', 'annotations', 'freshness'],
  },
  {
    intent: 'distribution',
    questionPattern: 'What is normal, variable or in the tail?',
    preferred: ['histogram', 'box plot', 'percentile band'],
    avoid: ['averages without spread', 'pie chart'],
    requiredContext: ['bin rule', 'population', 'median or percentile', 'outliers'],
  },
  {
    intent: 'composition',
    questionPattern: 'What makes up the whole and how concentrated is it?',
    preferred: ['stacked column', '100% stacked bar', 'donut with few categories', 'treemap'],
    avoid: ['pie with many categories', '3D slices'],
    requiredContext: ['whole', 'share', 'category count', 'other treatment'],
  },
  {
    intent: 'relationship',
    questionPattern: 'Do two measures move together and which cases are outliers?',
    preferred: ['scatter', 'bubble', 'quadrant plot'],
    avoid: ['line connecting unordered observations', 'claiming causation'],
    requiredContext: ['x and y meaning', 'reference lines', 'population', 'outlier drill'],
  },
  {
    intent: 'flow',
    questionPattern: 'Where does a sequential process lose or delay cases?',
    preferred: ['funnel', 'stage conversion', 'Sankey when magnitude between nodes matters'],
    avoid: ['funnel for non-sequential categories'],
    requiredContext: ['ordered stages', 'entry population', 'stage loss', 'time window'],
  },
  {
    intent: 'geography',
    questionPattern: 'Where is a spatial pattern material to the decision?',
    preferred: ['map plus ranked table', 'corridor flow'],
    avoid: ['map when rank or category is the real question'],
    requiredContext: ['geographic grain', 'normalisation', 'ranked alternative', 'coverage'],
  },
  {
    intent: 'investigation',
    questionPattern: 'Which exact record requires action and what proves it?',
    preferred: ['sortable table', 'matrix', 'evidence drawer'],
    avoid: ['summary visual without record drill'],
    requiredContext: ['record grain', 'owner', 'status', 'evidence', 'action'],
  },
];

export const DASHBOARD_RULES = [
  'Do not use KPI-card strips as the default dashboard structure.',
  'Every chart declares its analytical intent and the decision it supports.',
  'Every material visual exposes its comparison basis, period, unit, freshness and source.',
  'Every aggregate chart filters or drills to an accessible record table and original evidence.',
  'Do not use chart variety as decoration; use the smallest visual that answers the question.',
] as const;
