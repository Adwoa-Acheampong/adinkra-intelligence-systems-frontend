export type VerticalId = 'global' | 'autos' | 'farmers' | 'estate' | 'gold' | 'agents' | 'merchant' | 'label';

export interface Tenant {
  id: string;
  name: string;
  verticalId: VerticalId;
  type: 'hub' | 'dealer' | 'coop' | 'merchant' | 'agent' | 'house';
}

export interface TenantContextType {
  currentVertical: VerticalId;
  setCurrentVertical: (vertical: VerticalId) => void;
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
}

export interface VerticalTheme {
  id: VerticalId;
  name: string;
  accentHex: string;
  glowRgba: string;
}
