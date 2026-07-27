/**
 * tenant/tenantRegistry.ts — Module-level singleton for the active TenantContext.
 *
 * This is NOT a Zustand store. It is a plain module-level service:
 *   - keeps the active context in memory
 *   - persists to localStorage for page reload continuity
 *   - exposes a subscription API for reactive components
 *
 * Single-teacher deployments (current default):
 *   A "personal" tenant is auto-created on first boot using the browser's
 *   fingerprint timestamp so teachers without an IT admin don't need to
 *   configure anything.
 *
 * Multi-tenant deployments:
 *   Set the context explicitly after login:
 *     tenantRegistry.setContext({ tenantId: asTenantId('iis_garibaldi'), userId: '...', role: 'TEACHER' })
 */

import type { TenantContext, TenantProfile, TenantId, UserRole } from './types';
import { asTenantId } from './types';

const CONTEXT_KEY = 'tenant_context_v1';
const PROFILES_KEY = 'tenant_profiles_v1';
const DEFAULT_TENANT_ID = 'personal';

// ─── Singleton ────────────────────────────────────────────────────────────────

type ContextListener = (ctx: TenantContext) => void;

class TenantRegistryImpl {
  private _context: TenantContext;
  private _profiles: Map<string, TenantProfile>;
  private _listeners: ContextListener[] = [];

  constructor() {
    this._context = this._loadOrInit();
    this._profiles = this._loadProfiles();
    // Ensure the active tenant's profile is registered
    if (!this._profiles.has(this._context.tenantId)) {
      this._upsertProfile({
        id: this._context.tenantId as TenantId,
        name: this._context.tenantId === DEFAULT_TENANT_ID ? 'La mia scuola' : this._context.tenantId,
        createdAt: this._context.createdAt,
      });
    }
  }

  // ── Context ───────────────────────────────────────────────────────────────

  getContext(): TenantContext {
    return this._context;
  }

  setContext(partial: { tenantId: TenantId; userId: string; role: UserRole }): TenantContext {
    const ctx: TenantContext = {
      ...partial,
      createdAt: new Date().toISOString(),
    };
    this._context = ctx;
    this._save();
    // Notify subscribers
    for (const l of this._listeners) {
      try { l(ctx); } catch { /* ignore listener errors */ }
    }
    return ctx;
  }

  /** Subscribe to context changes. Returns unsubscribe function. */
  subscribe(listener: ContextListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  // ── Tenant profiles ───────────────────────────────────────────────────────

  getProfile(tenantId: TenantId): TenantProfile | undefined {
    return this._profiles.get(tenantId);
  }

  getAllProfiles(): TenantProfile[] {
    return [...this._profiles.values()];
  }

  registerTenant(profile: TenantProfile): void {
    this._upsertProfile(profile);
  }

  // ── Isolation assertion ───────────────────────────────────────────────────

  /**
   * Assert that `targetTenantId` matches the active context.
   * Throws if cross-tenant access is attempted.
   * No-op when `targetTenantId` is undefined (legacy/unscoped data).
   */
  assertSameTenant(targetTenantId: string | undefined): void {
    if (!targetTenantId) return;
    if (targetTenantId !== this._context.tenantId) {
      throw new Error(
        `Cross-tenant access denied: active="${this._context.tenantId}", target="${targetTenantId}"`,
      );
    }
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _loadOrInit(): TenantContext {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(CONTEXT_KEY);
        if (raw) return JSON.parse(raw) as TenantContext;
      }
    } catch { /* corrupted or SSR */ }

    // Default: personal tenant for a solo teacher
    return {
      tenantId: asTenantId(DEFAULT_TENANT_ID),
      userId: `teacher_${Date.now()}`,
      role: 'TEACHER',
      createdAt: new Date().toISOString(),
    };
  }

  private _save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CONTEXT_KEY, JSON.stringify(this._context));
      }
    } catch { /* quota / private */ }
  }

  private _loadProfiles(): Map<string, TenantProfile> {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(PROFILES_KEY);
        if (raw) {
          const arr = JSON.parse(raw) as TenantProfile[];
          return new Map(arr.map((p) => [p.id, p]));
        }
      }
    } catch { /* corrupted */ }
    return new Map();
  }

  private _upsertProfile(profile: TenantProfile): void {
    this._profiles.set(profile.id, profile);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PROFILES_KEY, JSON.stringify([...this._profiles.values()]));
      }
    } catch { /* quota */ }
  }
}

export const tenantRegistry = new TenantRegistryImpl();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mappa il ruolo utente al dominio operativo.
 * TEACHER lavora nel dominio 'school'; ADMIN e PRINCIPAL nel dominio 'admin'.
 */
export function getUserDomain(role: UserRole): 'school' | 'admin' {
  switch (role) {
    case 'ADMIN':
    case 'PRINCIPAL':
      return 'admin';
    default:
      return 'school';
  }
}
