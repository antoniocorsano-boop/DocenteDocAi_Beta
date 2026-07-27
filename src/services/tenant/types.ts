/**
 * tenant/types.ts — Core types for multi-tenant, role-based access.
 *
 * Design:
 *   - tenantId is stable, human-readable (e.g. "iis_garibaldi_2026")
 *   - Roles are additive: PRINCIPAL > ADMIN > TEACHER
 *   - Permissions are resource × action pairs
 *   - TenantContext is immutable once created — re-create to switch tenant/role
 *
 * Tenant isolation rule:
 *   - TEACHER can only read/write their own tenant
 *   - ADMIN can manage users within their tenant
 *   - PRINCIPAL can read all teachers' data within their tenant, plus school-level analytics
 *   - Cross-tenant access is NEVER permitted regardless of role
 */

// ─── Tenant identity ──────────────────────────────────────────────────────────

/** Stable tenant identifier. Lowercase, underscores allowed, no spaces. */
export type TenantId = string & { readonly _brand: 'TenantId' };

/** Cast a plain string to a branded TenantId. */
export function asTenantId(id: string): TenantId {
  if (!id || !/^[a-z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid tenantId: "${id}". Use lowercase letters, digits, _ and - only.`);
  }
  return id as TenantId;
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export type UserRole = 'TEACHER' | 'ADMIN' | 'PRINCIPAL';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  TEACHER:   1,
  ADMIN:     2,
  PRINCIPAL: 3,
};

/** Returns true if `role` has at least the required minimum role. */
export function hasRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

// ─── Resources & permissions ──────────────────────────────────────────────────

export type TenantResource =
  | 'students'          // individual student records
  | 'evaluations'       // grades + assessments
  | 'documents'         // uploaded/processed documents
  | 'kg_nodes'          // KG nodes and edges
  | 'automation_rules'  // create/modify automation rules
  | 'school_analytics'  // aggregated school-level insights
  | 'user_management'   // manage teacher/admin accounts in tenant
  | 'tenant_config';    // school-level settings

export type PermissionAction = 'read' | 'write' | 'delete' | 'manage';

export interface Permission {
  resource: TenantResource;
  action: PermissionAction;
}

/**
 * Static permission matrix.
 * Key: `${role}:${resource}:${action}`
 */
export const PERMISSION_MATRIX: Partial<Record<string, boolean>> = {
  // TEACHER — full access to own data
  'TEACHER:students:read':          true,
  'TEACHER:students:write':         true,
  'TEACHER:students:delete':        false,
  'TEACHER:evaluations:read':       true,
  'TEACHER:evaluations:write':      true,
  'TEACHER:evaluations:delete':     false,
  'TEACHER:documents:read':         true,
  'TEACHER:documents:write':        true,
  'TEACHER:documents:delete':       false,
  'TEACHER:kg_nodes:read':          true,
  'TEACHER:kg_nodes:write':         true,
  'TEACHER:automation_rules:read':  true,
  'TEACHER:automation_rules:write': true,
  'TEACHER:school_analytics:read':  false,
  'TEACHER:user_management:manage': false,
  'TEACHER:tenant_config:read':     false,

  // ADMIN — all TEACHER permissions + user management
  'ADMIN:students:read':            true,
  'ADMIN:students:write':           true,
  'ADMIN:students:delete':          true,
  'ADMIN:evaluations:read':         true,
  'ADMIN:evaluations:write':        true,
  'ADMIN:evaluations:delete':       true,
  'ADMIN:documents:read':           true,
  'ADMIN:documents:write':          true,
  'ADMIN:documents:delete':         true,
  'ADMIN:kg_nodes:read':            true,
  'ADMIN:kg_nodes:write':           true,
  'ADMIN:automation_rules:read':    true,
  'ADMIN:automation_rules:write':   true,
  'ADMIN:school_analytics:read':    true,
  'ADMIN:user_management:manage':   true,
  'ADMIN:tenant_config:read':       true,

  // PRINCIPAL — full read + school analytics + config, no delete of records
  'PRINCIPAL:students:read':            true,
  'PRINCIPAL:students:write':           false,
  'PRINCIPAL:students:delete':          false,
  'PRINCIPAL:evaluations:read':         true,
  'PRINCIPAL:evaluations:write':        false,
  'PRINCIPAL:evaluations:delete':       false,
  'PRINCIPAL:documents:read':           true,
  'PRINCIPAL:documents:write':          false,
  'PRINCIPAL:documents:delete':         false,
  'PRINCIPAL:kg_nodes:read':            true,
  'PRINCIPAL:kg_nodes:write':           false,
  'PRINCIPAL:automation_rules:read':    true,
  'PRINCIPAL:automation_rules:write':   true,
  'PRINCIPAL:school_analytics:read':    true,
  'PRINCIPAL:user_management:manage':   true,
  'PRINCIPAL:tenant_config:read':       true,
  'PRINCIPAL:tenant_config:manage':     true,
};

// ─── Context ──────────────────────────────────────────────────────────────────

export interface TenantContext {
  tenantId: TenantId;
  /** Opaque user identifier within the tenant. */
  userId: string;
  role: UserRole;
  /** Dominio operativo corrente: 'school' per docenti, 'admin' per amministratori. */
  domain?: 'school' | 'admin';
  /** ISO-8601 — when this context was established. */
  createdAt: string;
}

// ─── Tenant profile ───────────────────────────────────────────────────────────

export interface TenantProfile {
  id: TenantId;
  /** Display name shown in PRINCIPAL dashboard. */
  name: string;
  /** School code (codice meccanografico, optional). */
  schoolCode?: string;
  createdAt: string;
}

// ─── Access check result ──────────────────────────────────────────────────────

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
}
