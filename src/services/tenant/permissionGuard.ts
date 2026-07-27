/**
 * tenant/permissionGuard.ts — Pure permission check functions.
 *
 * Usage:
 *   import { can, assertCan } from '@/services/tenant/permissionGuard';
 *
 *   // Soft check — returns boolean
 *   if (can(ctx, 'school_analytics', 'read')) { ... }
 *
 *   // Hard check — throws AccessDeniedError
 *   assertCan(ctx, 'user_management', 'manage');
 */

import type { TenantContext, TenantResource, PermissionAction, AccessCheckResult } from './types';
import { PERMISSION_MATRIX } from './types';

// ─── AccessDeniedError ────────────────────────────────────────────────────────

export class AccessDeniedError extends Error {
  readonly role: string;
  readonly resource: TenantResource;
  readonly action: PermissionAction;

  constructor(role: string, resource: TenantResource, action: PermissionAction) {
    super(`Access denied: role=${role} cannot ${action} ${resource}`);
    this.name = 'AccessDeniedError';
    this.role = role;
    this.resource = resource;
    this.action = action;
  }
}

// ─── Core guards ─────────────────────────────────────────────────────────────

/**
 * Check whether `ctx.role` may perform `action` on `resource`.
 * Returns an `{ allowed, reason }` result — useful for UI conditional rendering.
 */
export function check(
  ctx: TenantContext,
  resource: TenantResource,
  action: PermissionAction,
): AccessCheckResult {
  const key = `${ctx.role}:${resource}:${action}`;
  const allowed = PERMISSION_MATRIX[key] === true;
  return {
    allowed,
    reason: allowed
      ? `${ctx.role} may ${action} ${resource}`
      : `${ctx.role} does not have ${action} permission on ${resource}`,
  };
}

/**
 * Boolean shorthand for `check(...).allowed`.
 */
export function can(
  ctx: TenantContext,
  resource: TenantResource,
  action: PermissionAction,
): boolean {
  return check(ctx, resource, action).allowed;
}

/**
 * Throws `AccessDeniedError` when permission is denied.
 * Use at action boundaries (service functions, mutations).
 */
export function assertCan(
  ctx: TenantContext,
  resource: TenantResource,
  action: PermissionAction,
): void {
  if (!can(ctx, resource, action)) {
    throw new AccessDeniedError(ctx.role, resource, action);
  }
}

// ─── Resource filter ─────────────────────────────────────────────────────────

/**
 * Filter a list of items that carry a `tenantId` metadata property,
 * returning only those belonging to `ctx.tenantId`.
 *
 * Items without a `tenantId` are included (backwards-compatible with
 * untagged legacy data).
 */
export function filterByTenant<T extends { metadata?: Record<string, unknown> }>(
  ctx: TenantContext,
  items: T[],
): T[] {
  return items.filter((item) => {
    const tid = item.metadata?.['tenantId'];
    return !tid || tid === ctx.tenantId;
  });
}
