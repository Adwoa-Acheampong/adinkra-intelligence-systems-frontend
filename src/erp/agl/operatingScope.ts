import type { AglAuditEvent, AglOperationalRecord, AglRecordValue } from './contracts';

export type AglOrgUnitLevel = 'country' | 'city' | 'branch' | 'site';
export type AglPeriodPreset = 'all' | 'today' | 'this-week' | 'this-month' | 'this-quarter' | 'this-year' | 'custom';

export interface AglOrgUnit {
  id: string;
  name: string;
  code: string;
  level: AglOrgUnitLevel;
  parentId?: string;
  country: string;
  countryCode: string;
  city?: string;
  branchId?: string;
  branchName?: string;
  siteId?: string;
  siteName?: string;
  address?: string;
  manager?: string;
  phone?: string;
  timezone: string;
}

export interface AglOperatingScope {
  countryCode: string;
  city: string;
  branchId: string;
  siteId: string;
  periodPreset: AglPeriodPreset;
  dateFrom: string;
  dateTo: string;
}

export const AGL_SCOPE_STORAGE_KEY = 'adinkra_agl_operating_scope_v1';
export const AGL_ORG_UNIT_STORAGE_KEY = 'adinkra_agl_org_units_v1';

export const AGL_ORG_UNITS: AglOrgUnit[] = [
  {
    id: 'COUNTRY-GH',
    name: 'Ghana',
    code: 'GH',
    level: 'country',
    country: 'Ghana',
    countryCode: 'GH',
    timezone: 'Africa/Accra',
  },
  {
    id: 'CITY-GH-ACC',
    name: 'Accra',
    code: 'ACC',
    level: 'city',
    parentId: 'COUNTRY-GH',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Accra',
    timezone: 'Africa/Accra',
  },
  {
    id: 'BRANCH-GH-ACC',
    name: 'AGL Accra',
    code: 'AGL-ACC',
    level: 'branch',
    parentId: 'CITY-GH-ACC',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Accra',
    branchId: 'BRANCH-GH-ACC',
    branchName: 'AGL Accra',
    address: 'Greater Accra Region',
    manager: 'Alex Morgan',
    phone: '+233 30 200 4100',
    timezone: 'Africa/Accra',
  },
  {
    id: 'SITE-GH-ACC-EL',
    name: 'East Legon',
    code: 'ACC-EL',
    level: 'site',
    parentId: 'BRANCH-GH-ACC',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Accra',
    branchId: 'BRANCH-GH-ACC',
    branchName: 'AGL Accra',
    siteId: 'SITE-GH-ACC-EL',
    siteName: 'East Legon',
    address: 'Boundary Road, East Legon',
    manager: 'Bekoe Adu Benjamin',
    phone: '+233 54 536 2388',
    timezone: 'Africa/Accra',
  },
  {
    id: 'SITE-GH-ACC-LS',
    name: 'Lakeside',
    code: 'ACC-LS',
    level: 'site',
    parentId: 'BRANCH-GH-ACC',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Accra',
    branchId: 'BRANCH-GH-ACC',
    branchName: 'AGL Accra',
    siteId: 'SITE-GH-ACC-LS',
    siteName: 'Lakeside',
    address: 'Lakeside Estate, Accra',
    manager: 'Bright Botchway',
    phone: '+233 24 880 2940',
    timezone: 'Africa/Accra',
  },
  {
    id: 'CITY-GH-KSI',
    name: 'Kumasi',
    code: 'KSI',
    level: 'city',
    parentId: 'COUNTRY-GH',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Kumasi',
    timezone: 'Africa/Accra',
  },
  {
    id: 'BRANCH-GH-KSI',
    name: 'AGL Kumasi',
    code: 'AGL-KSI',
    level: 'branch',
    parentId: 'CITY-GH-KSI',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Kumasi',
    branchId: 'BRANCH-GH-KSI',
    branchName: 'AGL Kumasi',
    address: 'Asokwa, Kumasi',
    manager: 'Nana Kojo Daniel',
    phone: '+233 54 709 6821',
    timezone: 'Africa/Accra',
  },
  {
    id: 'SITE-GH-KSI-AS',
    name: 'Asokwa',
    code: 'KSI-AS',
    level: 'site',
    parentId: 'BRANCH-GH-KSI',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Kumasi',
    branchId: 'BRANCH-GH-KSI',
    branchName: 'AGL Kumasi',
    siteId: 'SITE-GH-KSI-AS',
    siteName: 'Asokwa',
    address: 'Asokwa Industrial Area, Kumasi',
    manager: 'Nana Kojo Daniel',
    phone: '+233 54 709 6821',
    timezone: 'Africa/Accra',
  },
  {
    id: 'COUNTRY-NG',
    name: 'Nigeria',
    code: 'NG',
    level: 'country',
    country: 'Nigeria',
    countryCode: 'NG',
    timezone: 'Africa/Lagos',
  },
  {
    id: 'CITY-NG-LAG',
    name: 'Lagos',
    code: 'LOS',
    level: 'city',
    parentId: 'COUNTRY-NG',
    country: 'Nigeria',
    countryCode: 'NG',
    city: 'Lagos',
    timezone: 'Africa/Lagos',
  },
  {
    id: 'BRANCH-NG-LAG',
    name: 'AGL Lagos',
    code: 'AGL-LOS',
    level: 'branch',
    parentId: 'CITY-NG-LAG',
    country: 'Nigeria',
    countryCode: 'NG',
    city: 'Lagos',
    branchId: 'BRANCH-NG-LAG',
    branchName: 'AGL Lagos',
    address: 'Lagos State',
    manager: 'Tunde Adeyemi',
    phone: '+234 802 440 9120',
    timezone: 'Africa/Lagos',
  },
  {
    id: 'SITE-NG-LAG-IKE',
    name: 'Ikeja',
    code: 'LOS-IKE',
    level: 'site',
    parentId: 'BRANCH-NG-LAG',
    country: 'Nigeria',
    countryCode: 'NG',
    city: 'Lagos',
    branchId: 'BRANCH-NG-LAG',
    branchName: 'AGL Lagos',
    siteId: 'SITE-NG-LAG-IKE',
    siteName: 'Ikeja',
    address: 'Ikeja Industrial Estate, Lagos',
    manager: 'Tunde Adeyemi',
    phone: '+234 802 440 9120',
    timezone: 'Africa/Lagos',
  },
];

export const DEFAULT_AGL_OPERATING_SCOPE: AglOperatingScope = {
  countryCode: 'GH',
  city: 'Accra',
  branchId: 'BRANCH-GH-ACC',
  siteId: 'SITE-GH-ACC-EL',
  periodPreset: 'all',
  dateFrom: '',
  dateTo: '',
};

export const readAglOrgUnits = (): AglOrgUnit[] => {
  if (typeof window === 'undefined') return AGL_ORG_UNITS;
  const stored = window.localStorage.getItem(AGL_ORG_UNIT_STORAGE_KEY);
  if (!stored) return AGL_ORG_UNITS;
  try {
    const custom = JSON.parse(stored) as AglOrgUnit[];
    const byId = new Map(AGL_ORG_UNITS.map((unit) => [unit.id, unit]));
    custom.forEach((unit) => byId.set(unit.id, unit));
    return [...byId.values()];
  } catch {
    return AGL_ORG_UNITS;
  }
};

export const upsertAglOrgUnit = (record: AglOperationalRecord) => {
  if (typeof window === 'undefined') return;
  const level = String(record.level) as AglOrgUnitLevel;
  if (!['country', 'city', 'branch', 'site'].includes(level)) return;
  const unit: AglOrgUnit = {
    id: record.id,
    name: String(record.name),
    code: String(record.code ?? record.reference),
    level,
    parentId: String(record.parentId ?? '') || undefined,
    country: String(record.country ?? ''),
    countryCode: String(record.countryCode ?? ''),
    city: String(record.city ?? '') || undefined,
    branchId: String(record.branchId ?? '') || undefined,
    branchName: String(record.branchName ?? '') || undefined,
    siteId: String(record.siteId ?? '') || undefined,
    siteName: String(record.siteName ?? '') || undefined,
    address: String(record.address ?? '') || undefined,
    manager: String(record.manager ?? record.owner ?? '') || undefined,
    phone: String(record.phone ?? '') || undefined,
    timezone: String(record.timezone ?? 'Africa/Accra'),
  };
  const existing = readAglOrgUnits().filter((candidate) => candidate.id !== unit.id && !AGL_ORG_UNITS.some((seed) => seed.id === candidate.id));
  window.localStorage.setItem(AGL_ORG_UNIT_STORAGE_KEY, JSON.stringify([...existing, unit]));
};

const administrativeModules = new Set([
  'roles',
  'users',
  'locations',
  'integrations',
  'settings',
  'finance-controls',
  // Plans are tenant-wide commercial products. Enrolments remain branch scoped,
  // but every branch must be able to sell from the same governed catalogue.
  'subscription-plans',
]);

const recordDateKeys = [
  'occurredAt',
  'transactionDate',
  'expenseDate',
  'receivedAt',
  'issuedAt',
  'paidAt',
  'workDate',
  'date',
  'period',
  'createdAt',
  'updatedAt',
] as const;

const pad = (value: number) => String(value).padStart(2, '0');
const dateOnly = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const readAglOperatingScope = (): AglOperatingScope => {
  if (typeof window === 'undefined') return DEFAULT_AGL_OPERATING_SCOPE;
  const stored = window.localStorage.getItem(AGL_SCOPE_STORAGE_KEY);
  if (!stored) return DEFAULT_AGL_OPERATING_SCOPE;
  try {
    return { ...DEFAULT_AGL_OPERATING_SCOPE, ...(JSON.parse(stored) as Partial<AglOperatingScope>) };
  } catch {
    return DEFAULT_AGL_OPERATING_SCOPE;
  }
};

export const saveAglOperatingScope = (scope: AglOperatingScope) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AGL_SCOPE_STORAGE_KEY, JSON.stringify(scope));
};

export const resolveAglPeriodRange = (scope: AglOperatingScope, now = new Date()) => {
  if (scope.periodPreset === 'all') return { from: '', to: '' };
  if (scope.periodPreset === 'custom') return { from: scope.dateFrom, to: scope.dateTo };
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  if (scope.periodPreset === 'this-week') {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    end.setDate(start.getDate() + 6);
  }
  if (scope.periodPreset === 'this-month') {
    start.setDate(1);
    end.setMonth(start.getMonth() + 1, 0);
  }
  if (scope.periodPreset === 'this-quarter') {
    const quarterStart = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStart, 1);
    end.setMonth(quarterStart + 3, 0);
  }
  if (scope.periodPreset === 'this-year') {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  return { from: dateOnly(start), to: dateOnly(end) };
};

export const recordDate = (record: AglOperationalRecord | AglAuditEvent) => {
  for (const key of recordDateKeys) {
    const value = record[key as keyof typeof record];
    if (!value) continue;
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) return dateOnly(parsed);
  }
  return '';
};

export const getAglSite = (siteId: string) => (
  readAglOrgUnits().find((unit) => unit.level === 'site' && unit.id === siteId)
);

export const getAglWriteSite = (scope = readAglOperatingScope()) => {
  const exact = getAglSite(scope.siteId);
  if (exact) return exact;
  return readAglOrgUnits().find((unit) => (
    unit.level === 'site'
    && (!scope.branchId || unit.branchId === scope.branchId)
    && (!scope.city || unit.city === scope.city)
    && (!scope.countryCode || unit.countryCode === scope.countryCode)
  )) ?? getAglSite(DEFAULT_AGL_OPERATING_SCOPE.siteId)!;
};

export const scopeFieldsForSite = (site: AglOrgUnit): Record<string, AglRecordValue> => ({
  orgCountry: site.country,
  orgCountryCode: site.countryCode,
  orgCity: site.city,
  branchId: site.branchId,
  branchName: site.branchName,
  siteId: site.siteId,
  siteName: site.siteName,
});

const stableIndex = (value: string, length: number) => (
  [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % length
);

export const normalizeAglRecordScope = (
  moduleId: string,
  record: AglOperationalRecord,
  index = 0,
): AglOperationalRecord => {
  if (administrativeModules.has(moduleId)) return record;
  const existingSite = getAglSite(String(record.siteId ?? ''));
  if (existingSite) return { ...scopeFieldsForSite(existingSite), ...record };
  const sites = readAglOrgUnits().filter((unit) => unit.level === 'site');
  const chosen = sites[stableIndex(`${moduleId}:${record.id}:${index}`, sites.length)] ?? getAglWriteSite();
  return { ...record, ...scopeFieldsForSite(chosen) };
};

export const attachCurrentAglScope = (
  moduleId: string,
  values: Record<string, AglRecordValue>,
): Record<string, AglRecordValue> => {
  if (administrativeModules.has(moduleId)) return values;
  const existingSite = getAglSite(String(values.siteId ?? ''));
  const activeScope = readAglOperatingScope();
  const site = existingSite ?? getAglSite(activeScope.siteId);
  if (!site) {
    throw new Error('Select one operating site in the scope bar before creating this record. Aggregate branch and country views are read-only populations.');
  }
  return { ...scopeFieldsForSite(site), ...values };
};

export const matchesAglOperatingScope = (
  record: AglOperationalRecord | AglAuditEvent,
  scope = readAglOperatingScope(),
) => {
  if (scope.countryCode && String(record.orgCountryCode ?? '') !== scope.countryCode) return false;
  if (scope.city && String(record.orgCity ?? '') !== scope.city) return false;
  if (scope.branchId && String(record.branchId ?? '') !== scope.branchId) return false;
  if (scope.siteId && String(record.siteId ?? '') !== scope.siteId) return false;
  const { from, to } = resolveAglPeriodRange(scope);
  if (!from && !to) return true;
  const date = recordDate(record);
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

export const filterAglRecords = (
  moduleId: string,
  records: AglOperationalRecord[],
  scope = readAglOperatingScope(),
) => {
  if (administrativeModules.has(moduleId)) return records;
  return records.filter((record) => matchesAglOperatingScope(record, scope));
};

export const aglScopeLabel = (scope: AglOperatingScope) => {
  const site = getAglSite(scope.siteId);
  const units = readAglOrgUnits();
  const branch = units.find((unit) => unit.id === scope.branchId);
  const geography = [
    scope.countryCode ? units.find((unit) => unit.level === 'country' && unit.countryCode === scope.countryCode)?.name : 'All countries',
    scope.city || 'All cities',
    branch?.name ?? 'All branches',
    site?.name ?? 'All sites',
  ].filter(Boolean).join(' / ');
  const period = scope.periodPreset === 'custom'
    ? `${scope.dateFrom || 'start'} – ${scope.dateTo || 'today'}`
    : scope.periodPreset.replace(/-/g, ' ');
  return `${geography} · ${period}`;
};
