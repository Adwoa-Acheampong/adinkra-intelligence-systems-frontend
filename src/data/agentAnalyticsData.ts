export interface AgentNetworkSnapshot {
  tenantId: string;
  region: string;
  lead: string;
  agents: number;
  online: number;
  assignments: number;
  completed: number;
  verified: number;
  rejected: number;
  syncBacklog: number;
  sla: number;
  commission: number;
  coverage: Array<{ vertical: string; assignments: number; completion: number }>;
}

export interface AgentWorkItem {
  id: string;
  module: string;
  agent: string;
  subject: string;
  location: string;
  status: 'Complete' | 'In field' | 'Needs review' | 'Overdue' | 'Queued';
  captured: string;
  evidence: string;
  risk: 'Low' | 'Medium' | 'High';
}

export const AGENT_NETWORKS: AgentNetworkSnapshot[] = [
  {
    tenantId: 'accra_field_network',
    region: 'Greater Accra',
    lead: 'Abena Owusu',
    agents: 168,
    online: 132,
    assignments: 4182,
    completed: 3926,
    verified: 3710,
    rejected: 88,
    syncBacklog: 31,
    sla: 94,
    commission: 48620,
    coverage: [
      { vertical: 'Merchants', assignments: 1480, completion: 96 },
      { vertical: 'Autos', assignments: 1084, completion: 94 },
      { vertical: 'Estate', assignments: 922, completion: 91 },
      { vertical: 'Label', assignments: 696, completion: 95 },
    ],
  },
  {
    tenantId: 'ashanti_trade_desk',
    region: 'Ashanti',
    lead: 'Kwame Poku',
    agents: 116,
    online: 89,
    assignments: 3140,
    completed: 2872,
    verified: 2644,
    rejected: 104,
    syncBacklog: 48,
    sla: 91,
    commission: 38240,
    coverage: [
      { vertical: 'Merchants', assignments: 1210, completion: 93 },
      { vertical: 'Autos', assignments: 864, completion: 91 },
      { vertical: 'Farmers', assignments: 702, completion: 89 },
      { vertical: 'Estate', assignments: 364, completion: 88 },
    ],
  },
  {
    tenantId: 'techiman_market_unit',
    region: 'Bono East',
    lead: 'Akosua Mensah',
    agents: 92,
    online: 68,
    assignments: 2796,
    completed: 2611,
    verified: 2486,
    rejected: 42,
    syncBacklog: 96,
    sla: 93,
    commission: 31780,
    coverage: [
      { vertical: 'Farmers', assignments: 1670, completion: 95 },
      { vertical: 'Merchants', assignments: 624, completion: 91 },
      { vertical: 'Autos', assignments: 302, completion: 89 },
      { vertical: 'Susu', assignments: 200, completion: 94 },
    ],
  },
  {
    tenantId: 'tema_fulfilment_cell',
    region: 'Tema / Port',
    lead: 'Nii Laryea',
    agents: 74,
    online: 61,
    assignments: 2305,
    completed: 2148,
    verified: 2061,
    rejected: 31,
    syncBacklog: 18,
    sla: 97,
    commission: 27640,
    coverage: [
      { vertical: 'Logistics', assignments: 1010, completion: 98 },
      { vertical: 'Merchants', assignments: 624, completion: 96 },
      { vertical: 'Autos', assignments: 446, completion: 97 },
      { vertical: 'Gold', assignments: 225, completion: 95 },
    ],
  },
];

export const AGENT_TREND = [
  { day: 'Mon', assigned: 1620, completed: 1492, verified: 1378 },
  { day: 'Tue', assigned: 1764, completed: 1580, verified: 1494 },
  { day: 'Wed', assigned: 1812, completed: 1705, verified: 1582 },
  { day: 'Thu', assigned: 1698, completed: 1574, verified: 1488 },
  { day: 'Fri', assigned: 1940, completed: 1812, verified: 1720 },
  { day: 'Sat', assigned: 1514, completed: 1440, verified: 1362 },
  { day: 'Sun', assigned: 1075, completed: 954, verified: 877 },
];

export const AGENT_WORK_ITEMS: AgentWorkItem[] = [
  { id: 'ASG-84092', module: 'assignments', agent: 'Kofi Badu', subject: 'Verify Abossey Okai parts stock', location: 'Abossey Okai, Accra', status: 'In field', captured: '11 min ago', evidence: '18 photos · GPS locked', risk: 'Low' },
  { id: 'VIS-39118', module: 'visits', agent: 'Esi Tetteh', subject: 'Merchant follow-up · Nana Phones', location: 'Circle, Accra', status: 'Complete', captured: '24 min ago', evidence: 'Form 100% · signature', risk: 'Low' },
  { id: 'VER-24018', module: 'verification', agent: 'Yaw Osei', subject: 'Toyota Corolla 2019 identity', location: 'Dzorwulu, Accra', status: 'Needs review', captured: '41 min ago', evidence: 'VIN mismatch · 12 photos', risk: 'High' },
  { id: 'LST-12882', module: 'listings', agent: 'Mariam Fuseini', subject: '48 maize lots · batch capture', location: 'Techiman Market', status: 'Queued', captured: '1 hr ago', evidence: 'Offline · 82 MB pending', risk: 'Medium' },
  { id: 'ONB-90661', module: 'onboarding', agent: 'Kojo Agyeman', subject: 'Ahenfie Textiles KYC', location: 'Adum, Kumasi', status: 'Complete', captured: '2 hrs ago', evidence: 'Ghana Card · storefront GPS', risk: 'Low' },
  { id: 'COL-55712', module: 'collections', agent: 'Zainab Issah', subject: 'BLKK order cash reconciliation', location: 'Tema Community 1', status: 'Needs review', captured: '2 hrs ago', evidence: 'GHS 7,420 · receipt attached', risk: 'Medium' },
  { id: 'COM-44902', module: 'commissions', agent: 'Nana Boateng', subject: 'Weekly verified-work payout', location: 'Kumasi Central', status: 'Queued', captured: '3 hrs ago', evidence: '34 accepted outcomes', risk: 'Low' },
  { id: 'SYN-18204', module: 'sync', agent: 'Akua Addai', subject: 'Farm plot survey upload', location: 'Tuobodom', status: 'Overdue', captured: '18 hrs ago', evidence: '126 MB · last signal Edge', risk: 'High' },
  { id: 'QUA-77119', module: 'quality', agent: 'Daniel Nartey', subject: 'Duplicate storefront review', location: 'Kaneshie, Accra', status: 'Needs review', captured: 'Yesterday', evidence: '0.89 similarity score', risk: 'High' },
  { id: 'ASG-84093', module: 'assignments', agent: 'Sena Dapaah', subject: 'Estate document pickup', location: 'East Legon, Accra', status: 'Complete', captured: 'Yesterday', evidence: '7 documents · chain logged', risk: 'Low' },
];

export const getAgentNetwork = (tenantId: string) =>
  AGENT_NETWORKS.find((network) => network.tenantId === tenantId);

export const getAgentWorkItems = (module?: string) => {
  if (!module || module === 'all') return AGENT_WORK_ITEMS;
  return AGENT_WORK_ITEMS.filter((item) => item.module === module);
};

