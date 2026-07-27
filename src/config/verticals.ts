import { VerticalId } from '../types';

export interface VerticalMetadata {
  id: VerticalId;
  name: string;
  path: string;
  description: string;
}

export const VERTICALS: Record<VerticalId, VerticalMetadata> = {
  global: { id: 'global', name: 'Command Center', path: '/', description: 'Ecosystem Command Center' },
  merchant: { id: 'merchant', name: 'Merchants', path: '/merchant', description: 'Merchants Central Dashboard' },
  autos: { id: 'autos', name: 'AutoHub', path: '/autos', description: 'AutoHub Central Dashboard' },
  estate: { id: 'estate', name: 'Estate', path: '/estate', description: 'Estate Central Dashboard' },
  farmers: { id: 'farmers', name: 'Farmers Market', path: '/farmers', description: 'Farmers Market Central Dashboard' },
  label: { id: 'label', name: 'BLKK Label', path: '/label', description: 'BLKK Label Central Dashboard' },
  appsWebsite: { id: 'appsWebsite', name: 'Websites & Apps', path: '/apps-website', description: 'Websites & Apps Central' },
  susu: { id: 'susu', name: 'Susu Rail & Payments', path: '/susu', description: 'Susu & Payments Central' },
  gold: { id: 'gold', name: 'Precious Metals', path: '/gold', description: 'Precious Metals Central' },
  agents: { id: 'agents', name: 'Field Agents', path: '/agents', description: 'Field Agents Central' },
  systemConfig: { id: 'systemConfig', name: 'System Config', path: '/system-config', description: 'System Configuration' },
};
