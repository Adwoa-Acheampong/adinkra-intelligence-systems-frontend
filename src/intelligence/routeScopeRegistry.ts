import type { ScopeLevel } from './contracts';

export interface RouteScopeDefinition {
  pattern: string;
  scope: ScopeLevel;
  owner: string;
  primaryDecision: string;
  parentDrillPath?: string;
}

export const ROUTE_SCOPE_REGISTRY: RouteScopeDefinition[] = [
  { pattern: '/', scope: 'continent', owner: 'Founder / Group Executive', primaryDecision: 'Allocate attention, capital and institutional response' },
  { pattern: '/intelligence', scope: 'continent', owner: 'Authorised analyst', primaryDecision: 'Validate a claim and inspect its original evidence', parentDrillPath: '/' },
  { pattern: '/merchant/:module', scope: 'vertical', owner: 'Merchants Central', primaryDecision: 'Coordinate merchant capacity, trust and BLKK fulfilment', parentDrillPath: '/' },
  { pattern: '/autos/:module', scope: 'vertical', owner: 'AutoHub Central', primaryDecision: 'Coordinate automotive capacity, stock, quality and demand', parentDrillPath: '/' },
  { pattern: '/farmers/:module', scope: 'vertical', owner: 'Farmers Market Central', primaryDecision: 'Coordinate production, loss, quality and fulfilment', parentDrillPath: '/' },
  { pattern: '/estate/:module', scope: 'vertical', owner: 'Estate Central', primaryDecision: 'Coordinate property verification, inspection and demand', parentDrillPath: '/' },
  { pattern: '/label/:module', scope: 'vertical', owner: 'BLKK Label Central', primaryDecision: 'Coordinate design, production, inventory and fulfilment', parentDrillPath: '/' },
  { pattern: '/susu/:module', scope: 'vertical', owner: 'Susu Rail Control', primaryDecision: 'Protect safeguarded funds and settlement integrity', parentDrillPath: '/' },
  { pattern: '/gold/:module', scope: 'vertical', owner: 'Precious Metals Control', primaryDecision: 'Protect assay, custody, licensing and settlement integrity', parentDrillPath: '/' },
  { pattern: '/agents/:module', scope: 'vertical', owner: 'Field Operations', primaryDecision: 'Allocate assignments and protect field evidence quality', parentDrillPath: '/' },
  { pattern: '/apps-website/:module', scope: 'vertical', owner: 'Digital Product Operations', primaryDecision: 'Protect product journeys, releases and reliability', parentDrillPath: '/' },
  { pattern: '/:vertical/tenant/:tenantId', scope: 'tenant', owner: 'Tenant user', primaryDecision: 'Choose operational ERP or tenant analytics', parentDrillPath: '/:vertical' },
  { pattern: '/:vertical/tenant/:tenantId/analytics', scope: 'tenant', owner: 'Authorised tenant analyst', primaryDecision: 'Explain tenant performance and drill to evidence', parentDrillPath: '/:vertical/tenant/:tenantId' },
  { pattern: '/:vertical/tenant/:tenantId/analytics/:module', scope: 'department', owner: 'Authorised tenant analyst', primaryDecision: 'Investigate a department measure and its evidence', parentDrillPath: '/:vertical/tenant/:tenantId/analytics' },
  { pattern: '/:vertical/tenant/:tenantId/erp/:module', scope: 'department', owner: 'Tenant operator', primaryDecision: 'Create, progress, approve, and audit operational records', parentDrillPath: '/:vertical/tenant/:tenantId' },
];

export const resolveRouteScope = (pathname: string): RouteScopeDefinition => {
  if (/^\/[^/]+\/tenant\/[^/]+\/erp\/[^/]+/.test(pathname)) return ROUTE_SCOPE_REGISTRY.find((route) => route.pattern.endsWith('/erp/:module'))!;
  if (/^\/[^/]+\/tenant\/[^/]+\/analytics\/[^/]+/.test(pathname)) return ROUTE_SCOPE_REGISTRY.find((route) => route.pattern.endsWith('/analytics/:module'))!;
  if (/^\/[^/]+\/tenant\/[^/]+\/analytics/.test(pathname)) return ROUTE_SCOPE_REGISTRY.find((route) => route.pattern.endsWith('/analytics'))!;
  if (/^\/[^/]+\/tenant\/[^/]+/.test(pathname)) return ROUTE_SCOPE_REGISTRY.find((route) => route.pattern === '/:vertical/tenant/:tenantId')!;
  if (pathname === '/') return ROUTE_SCOPE_REGISTRY[0];
  if (pathname.startsWith('/intelligence')) return ROUTE_SCOPE_REGISTRY[1];
  const route = ROUTE_SCOPE_REGISTRY.find((candidate) => {
    const prefix = candidate.pattern.split('/:')[0];
    return prefix !== '/' && pathname.startsWith(prefix);
  });
  return route ?? ROUTE_SCOPE_REGISTRY[0];
};
