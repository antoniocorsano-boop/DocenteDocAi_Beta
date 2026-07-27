/**
 * tenant/index.ts — Public barrel for the multi-tenant layer.
 *
 * CLIENT-SIDE ONLY: uses localStorage for context persistence.
 *
 * Quick start (single teacher — zero config):
 *   The tenantRegistry auto-initialises with tenantId='personal' and
 *   role='TEACHER'. No action required.
 *
 * Multi-tenant setup (after login):
 *   import { tenantRegistry, asTenantId } from '@/services/tenant';
 *   tenantRegistry.setContext({
 *     tenantId: asTenantId('iis_garibaldi_2026'),
 *     userId: 'teacher_42',
 *     role: 'TEACHER',
 *   });
 *
 * Permission check:
 *   import { can, assertCan } from '@/services/tenant';
 *   if (can(tenantRegistry.getContext(), 'school_analytics', 'read')) { ... }
 *
 * School dashboard (PRINCIPAL/ADMIN):
 *   import { queryPrincipalDashboard } from '@/services/tenant';
 *   const data = queryPrincipalDashboard(ctx, ctx.tenantId);
 */

// Types
export type {
  TenantId,
  UserRole,
  TenantResource,
  PermissionAction,
  Permission,
  TenantContext,
  TenantProfile,
  AccessCheckResult,
} from './types';
export { asTenantId, hasRole, ROLE_HIERARCHY, PERMISSION_MATRIX } from './types';

// Registry
export { tenantRegistry } from './tenantRegistry';

// Permission guard
export { can, check, assertCan, filterByTenant, AccessDeniedError } from './permissionGuard';

// School insights
export type { ClassRiskSignal, SchoolSnapshot, DashboardQuery } from './schoolInsights';
export {
  generateSchoolSnapshot,
  queryPrincipalDashboard,
  detectSchoolPatterns,
} from './schoolInsights';
