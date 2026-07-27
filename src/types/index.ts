export type VerticalId = 'global' | 'autos' | 'farmers' | 'estate' | 'gold' | 'agents' | 'merchant' | 'label' | 'appsWebsite' | 'susu' | 'systemConfig';

export type SourceSurface =
  | 'blkk_star_hub_web'
  | 'blkk_autos_ios'
  | 'blkk_autos_android'
  | 'merchants_ios'
  | 'merchants_android'
  | 'farmers_ios'
  | 'farmers_android'
  | 'estate_ios'
  | 'estate_android'
  | 'blkk_label_admin_ios'
  | 'blkk_label_admin_android'
  | 'backoffice'
  | 'import'
  | 'api';

export interface Tenant {
  id: string;
  name: string;
  verticalId: VerticalId;
  type: 'hub' | 'dealer' | 'coop' | 'merchant' | 'agent' | 'house' | 'miner' | 'workshop' | 'parts_seller' | 'agency' | 'landlord';
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
