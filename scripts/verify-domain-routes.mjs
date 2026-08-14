import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const evidence = [];

const fail = (message) => failures.push(message);
const pass = (message) => evidence.push(message);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const loadDataModule = async (relativePath) => {
  const moduleUrl = pathToFileURL(path.join(root, relativePath));
  moduleUrl.searchParams.set('domain-verification', String(Date.now()));
  return import(moduleUrl.href);
};

const walkFiles = (relativeDirectory) => {
  const directory = path.join(root, relativeDirectory);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? walkFiles(relativePath) : [relativePath];
  });
};

const verticalIds = ['merchant', 'autos', 'estate', 'farmers', 'label', 'susu', 'gold', 'agents'];
const profileVerticalIds = verticalIds.filter((id) => id !== 'estate');

const tenantModule = await loadDataModule('src/data/mockAnalyticsData.ts');
const domainModule = await loadDataModule('src/data/verticalDomainContracts.ts');
const profileModule = await loadDataModule('src/data/verticalModuleProfiles.ts');

const tenants = tenantModule.MOCK_TENANTS;
const contracts = domainModule.VERTICAL_DOMAIN_CONTRACTS;
const profiles = profileModule.VERTICAL_MODULE_PROFILES;

const tenantIds = new Set();
for (const tenant of tenants) {
  if (tenantIds.has(tenant.id)) fail(`Duplicate tenant id: ${tenant.id}`);
  tenantIds.add(tenant.id);
}

for (const verticalId of verticalIds) {
  const count = tenants.filter((tenant) => tenant.verticalId === verticalId).length;
  if (count < 3) fail(`${verticalId}: expected at least three tenants, found ${count}`);
  else pass(`${verticalId}: ${count} tenants`);
}

const subjectOwner = new Map();
for (const verticalId of profileVerticalIds) {
  const contract = contracts[verticalId];
  const routeProfiles = profiles[verticalId];
  if (!contract) {
    fail(`${verticalId}: missing domain contract`);
    continue;
  }
  if (!routeProfiles) {
    fail(`${verticalId}: missing route profiles`);
    continue;
  }

  const contractContent = contract.seeds
    .flatMap((seed) => [seed.subject, seed.segment, seed.owner, seed.impact, seed.action])
    .join(' ')
    .toLowerCase();
  for (const prohibited of contract.prohibited) {
    if (contractContent.includes(prohibited.toLowerCase())) {
      fail(`${verticalId}: seed data contains prohibited phrase "${prohibited}"`);
    }
  }

  for (const [moduleId, routeProfile] of Object.entries(routeProfiles)) {
    if (routeProfile.records.length < 4) fail(`${verticalId}/${moduleId}: fewer than four exact records`);
    if (routeProfile.pipeline.length < 4) fail(`${verticalId}/${moduleId}: process pipeline is too shallow`);
    if (routeProfile.measures.length !== 4) fail(`${verticalId}/${moduleId}: expected four decision measures`);
    if (routeProfile.facet[1].length < 2) fail(`${verticalId}/${moduleId}: custom facet has fewer than two options`);

    const content = [
      routeProfile.noun,
      routeProfile.owner,
      routeProfile.question,
      routeProfile.decision,
      ...routeProfile.measures,
      routeProfile.facet[0],
      ...routeProfile.facet[1],
      ...routeProfile.pipeline,
      ...routeProfile.records.flatMap((record) => [record.subject, record.segment, record.impact, record.action, record.owner ?? '']),
    ].join(' ').toLowerCase();

    for (const prohibited of contract.prohibited) {
      if (content.includes(prohibited.toLowerCase())) {
        fail(`${verticalId}/${moduleId}: contains prohibited phrase "${prohibited}"`);
      }
    }

    for (const record of routeProfile.records) {
      const subjectKey = record.subject.trim().toLowerCase();
      const priorOwner = subjectOwner.get(subjectKey);
      if (priorOwner && priorOwner !== `${verticalId}/${moduleId}`) {
        fail(`Duplicate route record subject across pages: "${record.subject}" in ${priorOwner} and ${verticalId}/${moduleId}`);
      }
      subjectOwner.set(subjectKey, `${verticalId}/${moduleId}`);
    }
  }
  pass(`${verticalId}: ${Object.keys(routeProfiles).length} route-specific profiles are domain clean`);
}

const workspaceSource = read('src/config/erpWorkspaces.ts');
const workspaceOrder = ['merchant', 'autos', 'estate', 'farmers', 'label', 'susu', 'gold', 'agents'];
for (let index = 0; index < workspaceOrder.length; index += 1) {
  const verticalId = workspaceOrder[index];
  if (verticalId === 'estate') continue;
  const startMarker = `  ${verticalId}: vertical('${verticalId}'`;
  const start = workspaceSource.indexOf(startMarker);
  const nextId = workspaceOrder[index + 1];
  const endMarker = nextId ? `  ${nextId}: vertical('${nextId}'` : 'export const DIGITAL_PLATFORM_ERP';
  const end = workspaceSource.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    fail(`${verticalId}: could not extract configured vertical modules`);
    continue;
  }
  const configured = [...workspaceSource.slice(start, end).matchAll(/module\('([^']+)'/g)]
    .map((match) => match[1])
    .filter((moduleId) => moduleId !== 'tenants');
  const missingProfiles = configured.filter((moduleId) => !profiles[verticalId]?.[moduleId]);
  const staleProfiles = Object.keys(profiles[verticalId] ?? {}).filter((moduleId) => !configured.includes(moduleId));
  if (missingProfiles.length) fail(`${verticalId}: configured routes missing profiles (${missingProfiles.join(', ')})`);
  if (staleProfiles.length) fail(`${verticalId}: profiles are not reachable from configured routes (${staleProfiles.join(', ')})`);
  if (!missingProfiles.length && !staleProfiles.length) pass(`${verticalId}: ${configured.length} configured modules match exact profiles`);
}

const estateFiles = [...walkFiles('src/estate'), ...walkFiles('src/pages/estate')]
  .filter((file) => /\.(?:ts|tsx)$/.test(file));
const estateSource = estateFiles.map(read).join('\n').toLowerCase();
for (const phrase of ['maize', 'cocoa', 'harvest', 'brake pad', 'gold lot', 'assay certificate', 'vehicle inspection']) {
  if (estateSource.includes(phrase)) fail(`estate source contains prohibited cross-domain phrase "${phrase}"`);
}
const estateLines = estateSource.split('\n').length;
if (estateFiles.length < 4 || estateLines < 800) fail(`estate: specialized implementation is too shallow (${estateFiles.length} files / ${estateLines} lines)`);
else pass(`estate: ${estateFiles.length} specialized source files / ${estateLines} lines are cross-domain clean`);

const globalWorkspace = workspaceSource.slice(
  workspaceSource.indexOf('export const GLOBAL_ERP'),
  workspaceSource.indexOf('const vertical ='),
);
const globalModules = [...globalWorkspace.matchAll(/module\('([^']+)'/g)].map((match) => match[1]);
const ecosystemSource = read('src/pages/global/EcosystemWorkspace.tsx');
for (const moduleId of globalModules.filter((id) => !['intelligence', 'ontology'].includes(id))) {
  if (!ecosystemSource.includes(`moduleId === '${moduleId}'`)) fail(`ecosystem/${moduleId}: no unique workspace selection`);
  if (!ecosystemSource.includes(`'${moduleId}': {`) && !ecosystemSource.includes(`${moduleId}: {`)) fail(`ecosystem/${moduleId}: no unique decision metadata`);
}
pass(`ecosystem: ${globalModules.length + 1} command routes have explicit ownership or evidence-explorer routing`);

const websitesSource = read('src/pages/WebsitesApps.tsx');
const productFilterUses = (websitesSource.match(/<ProductFilterBar\b/g) ?? []).length;
if (productFilterUses < 4) fail(`websites/apps: expected product filters on four surfaces, found ${productFilterUses}`);
for (const routeContract of [
  'website/blkk-star-hub',
  'website/blkk-star-hub/routes/:routeId',
  'apps/:appId',
  'apps/:appId/:moduleId',
]) {
  if (!websitesSource.includes(`path="${routeContract}"`)) fail(`websites/apps: missing route contract ${routeContract}`);
}
pass(`websites/apps: ${productFilterUses} filter surfaces and product drill routes registered`);

const chooserSource = read('src/pages/tenant/TenantSystemChooser.tsx');
for (const contract of ['Open Analytics', 'Open ERP', '/analytics', '/erp/']) {
  if (!chooserSource.includes(contract)) fail(`tenant chooser: missing ${contract} contract`);
}
pass('tenant chooser: Analytics and ERP doors are both registered');

const sidebarSource = read('src/components/layout/Sidebar.tsx');
for (const contract of [
  'adinkra_sidebar_collapsed',
  'adinkra_sidebar_sections:',
  'aria-expanded',
  'text-cyan-300',
  'overflow-y-auto',
  'Object.prototype.hasOwnProperty.call',
]) {
  if (!sidebarSource.includes(contract)) fail(`sidebar: missing ${contract} behavior`);
}
pass('sidebar: section ownership, collapse, scroll, accessibility, and persistence contracts registered');

if (failures.length) {
  console.error('\nDomain and route verification failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(`\n${failures.length} failure(s).`);
  process.exitCode = 1;
} else {
  console.log('\nDomain and route verification passed:\n');
  for (const line of evidence) console.log(`  ✓ ${line}`);
  console.log(`\n${evidence.length} contracts verified.`);
}
