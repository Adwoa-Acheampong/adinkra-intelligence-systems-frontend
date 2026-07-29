import type { AutoFixbotPort, AutoFixbotSnapshot, FixbotCase } from '../contracts/autoFixbot';

const cases: FixbotCase[] = [
  {
    id: 'FB-8821', jobCardId: 'VSR-2051', registration: 'GT 8821-22', vehicle: '2018 Toyota Hilux', faultFamily: 'Fuel & engine',
    complaint: 'Intermittent loss of power under load.', recommendation: 'Verify rail-pressure loss and injector return volume before parts approval.',
    technicianFinding: 'Two injectors exceed return-volume tolerance; supplier provenance remains incomplete.', aiConfidence: 93, technicianConfidence: 96,
    diagnosticMinutes: 38, benchmarkMinutes: 72, avoidedHours: 1.4, agreement: 'Accepted', risk: 'Critical', evidenceCoverage: 75,
    createdAt: '28 Jul · 09:18', owner: 'Kofi Boateng', nextDecision: 'Approve verified injector source or revise customer promise.',
    evidence: [
      { id: 'EVD-SCN-8821', label: 'Rail pressure scan', kind: 'scan', state: 'Accepted', capturedAt: '09:18', capturedBy: 'Kofi Boateng' },
      { id: 'EVD-TST-8821', label: 'Injector return-volume test', kind: 'test_result', state: 'Accepted', capturedAt: '09:42', capturedBy: 'Kofi Boateng' },
      { id: 'EVD-NTE-8821', label: 'Technician finding', kind: 'technician_note', state: 'Accepted', capturedAt: '09:48', capturedBy: 'Kofi Boateng' },
      { id: 'EVD-APR-8821', label: 'Substitute provenance approval', kind: 'approval', state: 'Missing' },
    ],
  },
  {
    id: 'FB-8817', jobCardId: 'VSR-2048', registration: 'GW 4219-24', vehicle: '2020 Honda Civic EX', faultFamily: 'Brakes & chassis',
    complaint: 'Steering vibration above 80 km/h and front brake noise.', recommendation: 'Inspect rotor runout and control-arm bush movement.',
    technicianFinding: 'Front rotors warped; lower control-arm bush wear at replacement threshold.', aiConfidence: 88, technicianConfidence: 92,
    diagnosticMinutes: 44, benchmarkMinutes: 65, avoidedHours: 0.8, agreement: 'Modified', risk: 'High', evidenceCoverage: 100,
    createdAt: '28 Jul · 08:34', owner: 'Kwame Asare', nextDecision: 'Complete road-test evidence and release.',
    evidence: [
      { id: 'EVD-PHO-8817', label: 'Rotor runout media', kind: 'photo', state: 'Accepted', capturedAt: '08:48', capturedBy: 'Kwame Asare' },
      { id: 'EVD-TST-8817', label: 'Runout measurement', kind: 'test_result', state: 'Accepted', capturedAt: '09:03', capturedBy: 'Kwame Asare' },
      { id: 'EVD-NTE-8817', label: 'Technician modification note', kind: 'technician_note', state: 'Accepted', capturedAt: '09:10', capturedBy: 'Kwame Asare' },
    ],
  },
  {
    id: 'FB-8814', jobCardId: 'VSR-2054', registration: 'GR 1094-23', vehicle: '2021 Kia Sportage', faultFamily: 'HVAC',
    complaint: 'Air-conditioning not cooling consistently.', recommendation: 'Test condenser fan relay under heat soak before refrigerant intervention.',
    technicianFinding: 'Relay fails after temperature rise; refrigerant pressure remains stable.', aiConfidence: 96, technicianConfidence: 98,
    diagnosticMinutes: 24, benchmarkMinutes: 58, avoidedHours: 1.7, agreement: 'Accepted', risk: 'Medium', evidenceCoverage: 100,
    createdAt: '28 Jul · 08:22', owner: 'Ama Kwarteng', nextDecision: 'Validate outlet temperature after relay replacement.',
    evidence: [
      { id: 'EVD-TST-8814', label: 'Pressure and temperature test', kind: 'test_result', state: 'Accepted', capturedAt: '08:58', capturedBy: 'Ama Kwarteng' },
      { id: 'EVD-PHO-8814', label: 'Relay heat-soak capture', kind: 'photo', state: 'Accepted', capturedAt: '09:08', capturedBy: 'Ama Kwarteng' },
      { id: 'EVD-NTE-8814', label: 'Technician acceptance', kind: 'technician_note', state: 'Accepted', capturedAt: '09:12', capturedBy: 'Ama Kwarteng' },
    ],
  },
  {
    id: 'FB-8809', jobCardId: 'VSR-2056', registration: 'GN 7280-21', vehicle: '2017 Mercedes-Benz C300', faultFamily: 'Fuel & engine',
    complaint: 'Check-engine light with rough idle.', recommendation: 'Isolate ignition coil before compression testing.',
    technicianFinding: 'Compression variance requires supervisor review before coil replacement.', aiConfidence: 72, technicianConfidence: 84,
    diagnosticMinutes: 61, benchmarkMinutes: 55, avoidedHours: 0.1, agreement: 'Overridden', risk: 'High', evidenceCoverage: 67,
    createdAt: '28 Jul · 11:46', owner: 'Kwame Asare', nextDecision: 'Escalate cylinder-three compression variance.',
    evidence: [
      { id: 'EVD-SCN-8809', label: 'DTC scan', kind: 'scan', state: 'Accepted', capturedAt: '11:46', capturedBy: 'Kwame Asare' },
      { id: 'EVD-TST-8809', label: 'Compression isolation', kind: 'test_result', state: 'Review', capturedAt: '12:18', capturedBy: 'Kwame Asare' },
      { id: 'EVD-APR-8809', label: 'Supervisor finding', kind: 'approval', state: 'Missing' },
    ],
  },
  {
    id: 'FB-8804', jobCardId: 'VSR-2058', registration: 'GW 5610-25', vehicle: '2023 Hyundai Tucson', faultFamily: 'Electrical',
    complaint: 'Rear parking sensor false alerts.', recommendation: 'Inspect connector moisture before sensor replacement.',
    technicianFinding: 'Harness connector corrosion confirmed; sensors pass bench test.', aiConfidence: 91, technicianConfidence: 94,
    diagnosticMinutes: 31, benchmarkMinutes: 52, avoidedHours: 1.1, agreement: 'Accepted', risk: 'Low', evidenceCoverage: 100,
    createdAt: '28 Jul · 12:34', owner: 'Ama Kwarteng', nextDecision: 'Repair connector and validate all rear sensors.',
    evidence: [
      { id: 'EVD-PHO-8804', label: 'Connector corrosion media', kind: 'photo', state: 'Accepted', capturedAt: '12:34', capturedBy: 'Ama Kwarteng' },
      { id: 'EVD-TST-8804', label: 'Sensor bench test', kind: 'test_result', state: 'Accepted', capturedAt: '12:48', capturedBy: 'Ama Kwarteng' },
    ],
  },
  {
    id: 'FB-8798', jobCardId: 'VSR-2039', registration: 'GT 2041-19', vehicle: '2016 Ford Ranger', faultFamily: 'Transmission',
    complaint: 'Harsh shift from second to third when hot.', recommendation: 'Capture hot-fluid pressure and adaptation values.',
    technicianFinding: 'Pressure loss indicates valve-body wear; adaptation reset is not sufficient.', aiConfidence: 79, technicianConfidence: 91,
    diagnosticMinutes: 74, benchmarkMinutes: 80, avoidedHours: 0.3, agreement: 'Modified', risk: 'Critical', evidenceCoverage: 80,
    createdAt: '27 Jul · 15:20', owner: 'Kofi Boateng', nextDecision: 'Request controlled valve-body quote.',
    evidence: [
      { id: 'EVD-SCN-8798', label: 'Transmission adaptation scan', kind: 'scan', state: 'Accepted', capturedAt: '15:20', capturedBy: 'Kofi Boateng' },
      { id: 'EVD-TST-8798', label: 'Hot-fluid pressure test', kind: 'test_result', state: 'Accepted', capturedAt: '16:02', capturedBy: 'Kofi Boateng' },
      { id: 'EVD-APR-8798', label: 'Quote approval', kind: 'approval', state: 'Review', capturedAt: '16:28', capturedBy: 'Nana Osei' },
    ],
  },
  {
    id: 'FB-8791', jobCardId: 'VSR-2035', registration: 'GW 7734-18', vehicle: '2015 Toyota Corolla', faultFamily: 'Electrical',
    complaint: 'Battery drains overnight.', recommendation: 'Run parasitic-draw isolation by fuse circuit.',
    technicianFinding: 'Aftermarket tracker draws 410 mA while parked.', aiConfidence: 97, technicianConfidence: 99,
    diagnosticMinutes: 29, benchmarkMinutes: 90, avoidedHours: 2.2, agreement: 'Accepted', risk: 'Medium', evidenceCoverage: 100,
    createdAt: '27 Jul · 10:11', owner: 'Ama Kwarteng', nextDecision: 'Obtain customer approval to isolate tracker.',
    evidence: [
      { id: 'EVD-TST-8791', label: 'Parasitic-draw test', kind: 'test_result', state: 'Accepted', capturedAt: '10:11', capturedBy: 'Ama Kwarteng' },
      { id: 'EVD-PHO-8791', label: 'Tracker installation media', kind: 'photo', state: 'Accepted', capturedAt: '10:22', capturedBy: 'Ama Kwarteng' },
    ],
  },
  {
    id: 'FB-8786', jobCardId: 'VSR-2028', registration: 'GE 8920-23', vehicle: '2022 Nissan Navara', faultFamily: 'Brakes & chassis',
    complaint: 'Vehicle pulls left under braking.', recommendation: 'Compare caliper temperatures and brake force.',
    technicianFinding: 'Right-front caliper slides seized; pad wear imbalance confirmed.', aiConfidence: 89, technicianConfidence: 95,
    diagnosticMinutes: 42, benchmarkMinutes: 63, avoidedHours: 0.9, agreement: 'Accepted', risk: 'High', evidenceCoverage: 100,
    createdAt: '26 Jul · 14:52', owner: 'Kwame Asare', nextDecision: 'Approve caliper service kit and pads.',
    evidence: [
      { id: 'EVD-TST-8786', label: 'Brake force comparison', kind: 'test_result', state: 'Accepted', capturedAt: '14:52', capturedBy: 'Kwame Asare' },
      { id: 'EVD-PHO-8786', label: 'Pad wear comparison', kind: 'photo', state: 'Accepted', capturedAt: '15:08', capturedBy: 'Kwame Asare' },
    ],
  },
  {
    id: 'FB-8780', jobCardId: 'VSR-2021', registration: 'GN 4013-20', vehicle: '2019 Hyundai Santa Fe', faultFamily: 'HVAC',
    complaint: 'Blower speed fluctuates.', recommendation: 'Test blower control module signal before motor replacement.',
    technicianFinding: 'Control module signal drops under load; blower motor current stable.', aiConfidence: 86, technicianConfidence: 90,
    diagnosticMinutes: 36, benchmarkMinutes: 54, avoidedHours: 0.7, agreement: 'Accepted', risk: 'Low', evidenceCoverage: 100,
    createdAt: '25 Jul · 09:44', owner: 'Ama Kwarteng', nextDecision: 'Replace control module and validate all speeds.',
    evidence: [
      { id: 'EVD-TST-8780', label: 'Module signal test', kind: 'test_result', state: 'Accepted', capturedAt: '09:44', capturedBy: 'Ama Kwarteng' },
      { id: 'EVD-NTE-8780', label: 'Technician confirmation', kind: 'technician_note', state: 'Accepted', capturedAt: '10:02', capturedBy: 'Ama Kwarteng' },
    ],
  },
  {
    id: 'FB-8774', jobCardId: 'VSR-2018', registration: 'GT 1190-17', vehicle: '2014 Honda Accord', faultFamily: 'Fuel & engine',
    complaint: 'Oil-pressure warning at idle.', recommendation: 'Stop engine and verify mechanical pressure before sensor replacement.',
    technicianFinding: 'Mechanical pressure below safe threshold; internal engine review required.', aiConfidence: 82, technicianConfidence: 97,
    diagnosticMinutes: 48, benchmarkMinutes: 46, avoidedHours: 0, agreement: 'Escalated', risk: 'Critical', evidenceCoverage: 83,
    createdAt: '24 Jul · 13:16', owner: 'Kofi Boateng', nextDecision: 'Hold release and open engine teardown approval.',
    evidence: [
      { id: 'EVD-TST-8774', label: 'Mechanical oil-pressure test', kind: 'test_result', state: 'Accepted', capturedAt: '13:16', capturedBy: 'Kofi Boateng' },
      { id: 'EVD-NTE-8774', label: 'Critical hold note', kind: 'technician_note', state: 'Accepted', capturedAt: '13:28', capturedBy: 'Kofi Boateng' },
      { id: 'EVD-APR-8774', label: 'Teardown approval', kind: 'approval', state: 'Review', capturedAt: '14:05', capturedBy: 'Nana Osei' },
    ],
  },
  {
    id: 'FB-8768', jobCardId: 'VSR-2012', registration: 'GW 6621-21', vehicle: '2020 Volkswagen Tiguan', faultFamily: 'Transmission',
    complaint: 'Delayed drive engagement from cold start.', recommendation: 'Check fluid level and mechatronic adaptation.',
    technicianFinding: 'External leak lowered fluid level; adaptation remains within limits.', aiConfidence: 77, technicianConfidence: 93,
    diagnosticMinutes: 57, benchmarkMinutes: 75, avoidedHours: 0.6, agreement: 'Overridden', risk: 'High', evidenceCoverage: 100,
    createdAt: '23 Jul · 08:38', owner: 'Kwame Asare', nextDecision: 'Repair leak before any mechatronic intervention.',
    evidence: [
      { id: 'EVD-SCN-8768', label: 'Mechatronic adaptation scan', kind: 'scan', state: 'Accepted', capturedAt: '08:38', capturedBy: 'Kwame Asare' },
      { id: 'EVD-PHO-8768', label: 'Transmission leak media', kind: 'photo', state: 'Accepted', capturedAt: '08:54', capturedBy: 'Kwame Asare' },
    ],
  },
  {
    id: 'FB-8761', jobCardId: 'VSR-2008', registration: 'GE 3022-22', vehicle: '2021 Suzuki Vitara', faultFamily: 'Electrical',
    complaint: 'Intermittent no-crank condition.', recommendation: 'Inspect starter relay control and ground voltage drop.',
    technicianFinding: 'Engine ground strap voltage drop exceeds limit.', aiConfidence: 94, technicianConfidence: 96,
    diagnosticMinutes: 33, benchmarkMinutes: 68, avoidedHours: 1.3, agreement: 'Accepted', risk: 'Medium', evidenceCoverage: 100,
    createdAt: '22 Jul · 16:08', owner: 'Ama Kwarteng', nextDecision: 'Replace ground strap and repeat cranking test.',
    evidence: [
      { id: 'EVD-TST-8761', label: 'Ground voltage-drop test', kind: 'test_result', state: 'Accepted', capturedAt: '16:08', capturedBy: 'Ama Kwarteng' },
      { id: 'EVD-PHO-8761', label: 'Ground strap condition', kind: 'photo', state: 'Accepted', capturedAt: '16:16', capturedBy: 'Ama Kwarteng' },
    ],
  },
];

const snapshot = (tenantId: string): AutoFixbotSnapshot => ({
  tenantId,
  asOf: '28 Jul 2026 · 14:10 GMT',
  source: 'Frontend contract fixture · AutoFixbotPort.loadSnapshot',
  cases,
  familyComparison: [
    { family: 'Fuel & engine', aiProposed: 38, technicianAccepted: 29, overridden: 6 },
    { family: 'Electrical', aiProposed: 34, technicianAccepted: 31, overridden: 2 },
    { family: 'Brakes', aiProposed: 27, technicianAccepted: 23, overridden: 3 },
    { family: 'HVAC', aiProposed: 22, technicianAccepted: 20, overridden: 1 },
    { family: 'Transmission', aiProposed: 18, technicianAccepted: 12, overridden: 5 },
  ],
  trend: [
    { day: '22 Jul', aiAgreement: 78, firstPass: 88, medianMinutes: 58 },
    { day: '23 Jul', aiAgreement: 81, firstPass: 89, medianMinutes: 55 },
    { day: '24 Jul', aiAgreement: 79, firstPass: 87, medianMinutes: 61 },
    { day: '25 Jul', aiAgreement: 84, firstPass: 91, medianMinutes: 49 },
    { day: '26 Jul', aiAgreement: 86, firstPass: 92, medianMinutes: 46 },
    { day: '27 Jul', aiAgreement: 82, firstPass: 90, medianMinutes: 51 },
    { day: '28 Jul', aiAgreement: 88, firstPass: 93, medianMinutes: 42 },
  ],
  funnel: [
    { name: 'Intake with consent', value: 148, fill: '#786341' },
    { name: 'Evidence sufficient', value: 132, fill: '#9b7b43' },
    { name: 'AI recommendation', value: 110, fill: '#c69a4a' },
    { name: 'Technician accepted', value: 94, fill: '#d9b86c' },
    { name: 'Released first pass', value: 87, fill: '#58a883' },
  ],
  confidenceDistribution: [
    { bin: '<60', cases: 3, review: 3 },
    { bin: '60–69', cases: 9, review: 8 },
    { bin: '70–79', cases: 21, review: 13 },
    { bin: '80–89', cases: 48, review: 12 },
    { bin: '90–100', cases: 67, review: 5 },
  ],
  caseMix: [
    { name: 'Fuel & engine', value: 38, fill: '#d3a651' },
    { name: 'Electrical', value: 34, fill: '#4f8c9d' },
    { name: 'Brakes & chassis', value: 27, fill: '#a45d5d' },
    { name: 'HVAC', value: 22, fill: '#7285aa' },
    { name: 'Transmission', value: 18, fill: '#846aa0' },
    { name: 'Other', value: 9, fill: '#5f625f' },
  ],
});

export const fixtureAutoFixbotPort: AutoFixbotPort = {
  async loadSnapshot(query) {
    return snapshot(query.tenantId);
  },
};
