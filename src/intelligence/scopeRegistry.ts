import type { ScopeLevel, ScopeRef } from './contracts';

export const SCOPE_ORDER: ScopeLevel[] = [
  'continent',
  'region',
  'country',
  'city',
  'vertical',
  'tenant',
  'department',
  'entity',
  'event',
  'evidence',
];

export const CANONICAL_SCOPES: ScopeRef[] = [
  { level: 'continent', id: 'africa', name: 'Africa' },
  { level: 'region', id: 'west-africa', name: 'West Africa', parentId: 'africa' },
  { level: 'country', id: 'gh', name: 'Ghana', parentId: 'west-africa' },
  { level: 'country', id: 'ng', name: 'Nigeria', parentId: 'west-africa' },
  { level: 'city', id: 'accra', name: 'Accra', parentId: 'gh' },
  { level: 'city', id: 'kumasi', name: 'Kumasi', parentId: 'gh' },
  { level: 'city', id: 'koforidua', name: 'Koforidua', parentId: 'gh' },
  { level: 'city', id: 'lagos', name: 'Lagos', parentId: 'ng' },
  { level: 'vertical', id: 'autos', name: 'AutoHub', parentId: 'africa', verticalId: 'autos' },
  { level: 'vertical', id: 'merchant', name: 'Merchants', parentId: 'africa', verticalId: 'merchant' },
  { level: 'vertical', id: 'farmers', name: 'Farmers Market', parentId: 'africa', verticalId: 'farmers' },
  { level: 'vertical', id: 'estate', name: 'Estate', parentId: 'africa', verticalId: 'estate' },
  { level: 'vertical', id: 'label', name: 'BLKK Label', parentId: 'africa', verticalId: 'label' },
  { level: 'vertical', id: 'susu', name: 'Susu Rail', parentId: 'africa', verticalId: 'susu' },
  { level: 'vertical', id: 'gold', name: 'Precious Metals', parentId: 'africa', verticalId: 'gold' },
  { level: 'vertical', id: 'agents', name: 'Field Agents', parentId: 'africa', verticalId: 'agents' },
];

export const getScopeLabel = (level: ScopeLevel) => {
  const labels: Record<ScopeLevel, string> = {
    continent: 'Continental',
    region: 'Regional',
    country: 'Country',
    city: 'City',
    vertical: 'Vertical',
    tenant: 'Tenant',
    department: 'Department',
    entity: 'Record',
    event: 'Event',
    evidence: 'Evidence',
  };
  return labels[level];
};

export const getScopeTrail = (scope: ScopeRef, scopes = CANONICAL_SCOPES): ScopeRef[] => {
  const trail: ScopeRef[] = [scope];
  let cursor = scope;
  while (cursor.parentId) {
    const parent = scopes.find((candidate) => candidate.id === cursor.parentId);
    if (!parent) break;
    trail.unshift(parent);
    cursor = parent;
  }
  return trail;
};
