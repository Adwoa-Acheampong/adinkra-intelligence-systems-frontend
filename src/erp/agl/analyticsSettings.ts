export interface AglAnalyticsSettings {
  currency: 'GHS' | 'USD';
  fiscalYearStart: string;
  salesTargetGhs: number;
  workshopCompletionTarget: number;
  firstPassQualityTarget: number;
  inventoryAvailabilityTarget: number;
  payrollBudgetGhs: number;
  lowStockThreshold: number;
  defaultChart: 'ranked-bar' | 'donut' | 'trend';
  evidencePreviewLimit: number;
  showTargets: boolean;
}

export const AGL_ANALYTICS_SETTINGS_KEY = 'adinkra_agl_analytics_settings_v1';
export const AGL_ANALYTICS_SETTINGS_EVENT = 'agl-analytics-settings-change';

export const DEFAULT_AGL_ANALYTICS_SETTINGS: AglAnalyticsSettings = {
  currency: 'GHS',
  fiscalYearStart: '01',
  salesTargetGhs: 50000,
  workshopCompletionTarget: 92,
  firstPassQualityTarget: 95,
  inventoryAvailabilityTarget: 90,
  payrollBudgetGhs: 25000,
  lowStockThreshold: 4,
  defaultChart: 'ranked-bar',
  evidencePreviewLimit: 25,
  showTargets: true,
};

export const readAglAnalyticsSettings = (): AglAnalyticsSettings => {
  if (typeof window === 'undefined') return DEFAULT_AGL_ANALYTICS_SETTINGS;
  const raw = window.localStorage.getItem(AGL_ANALYTICS_SETTINGS_KEY);
  if (!raw) return DEFAULT_AGL_ANALYTICS_SETTINGS;
  try {
    return { ...DEFAULT_AGL_ANALYTICS_SETTINGS, ...JSON.parse(raw) as Partial<AglAnalyticsSettings> };
  } catch {
    return DEFAULT_AGL_ANALYTICS_SETTINGS;
  }
};

export const saveAglAnalyticsSettings = (settings: AglAnalyticsSettings) => {
  window.localStorage.setItem(AGL_ANALYTICS_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(AGL_ANALYTICS_SETTINGS_EVENT));
};

export const resetAglAnalyticsSettings = () => {
  window.localStorage.removeItem(AGL_ANALYTICS_SETTINGS_KEY);
  window.dispatchEvent(new CustomEvent(AGL_ANALYTICS_SETTINGS_EVENT));
};
