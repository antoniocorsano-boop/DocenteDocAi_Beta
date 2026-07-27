/**
 * modules/orbit/socialEngine.ts — Social Layer Engine (Fase 7 — Social Layer)
 *
 * Pure functions for permission resolution and GDPR-safe group/document operations.
 *
 * Design:
 *   - No side effects — callers pass current state read from useGroupStore
 *   - No imports from React, Zustand or other non-type modules
 *   - All functions are synchronous and deterministic
 *
 * GDPR invariants enforced here:
 *   1. Members with consentGiven === false are excluded from all access checks
 *   2. Permission resolution is always explicit — no implicit fallbacks beyond group level
 *   3. getConsentingMembers() is the only safe way to enumerate active members
 */

import type {
  PermissionLevel,
  GroupMember,
  SocialGroup,
  SharedDocument,
} from '@/types/social.types';

// ── Permission hierarchy ──────────────────────────────────────────────────────

const PERMISSION_RANK: Record<PermissionLevel, number> = {
  owner:  3,
  editor: 2,
  viewer: 1,
};

/**
 * Returns true if `granted` satisfies `required`.
 * Example: canSatisfy('editor', 'viewer') === true
 *          canSatisfy('viewer', 'editor') === false
 */
export function canSatisfy(
  granted:  PermissionLevel,
  required: PermissionLevel,
): boolean {
  return PERMISSION_RANK[granted] >= PERMISSION_RANK[required];
}

/**
 * Resolves the effective permission of a user for a specific document,
 * merging group-level and document-level grants.
 *
 * Resolution order:
 *   1. doc.permissions[userId]  (explicit override) takes priority
 *   2. group member permission  (group-level default)
 *   3. null                     (no access)
 *
 * GDPR: returns null if:
 *   - userId is not in group.members
 *   - member.consentGiven === false
 */
export function resolveEffectivePermission(
  userId: string,
  doc:    SharedDocument,
  group:  SocialGroup,
): PermissionLevel | null {
  const member = group.members.find((m) => m.userId === userId);

  // GDPR guard: no access without explicit consent
  if (!member || !member.consentGiven) return null;

  // Doc-level explicit grant takes priority over group-level
  if (Object.prototype.hasOwnProperty.call(doc.permissions, userId)) {
    return doc.permissions[userId];
  }

  // Fall back to group-level member permission
  return member.permission;
}

/**
 * Returns true if `userId` has at least `requiredLevel` access to `doc`.
 * Includes GDPR consent check through resolveEffectivePermission.
 */
export function canAccess(
  userId:        string,
  doc:           SharedDocument,
  group:         SocialGroup,
  requiredLevel: PermissionLevel,
): boolean {
  const effective = resolveEffectivePermission(userId, doc, group);
  if (!effective) return false;
  return canSatisfy(effective, requiredLevel);
}

// ── ID generation ─────────────────────────────────────────────────────────────

/**
 * Generates a collision-resistant group ID.
 * Format: `grp-{base36 timestamp}-{5 random chars}`
 * No external dependency; safe for use in a fully client-side environment.
 */
export function createGroupId(): string {
  return `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Generates a collision-resistant document ID.
 * Format: `doc-{base36 timestamp}-{5 random chars}`
 */
export function createDocumentId(): string {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Member utilities ──────────────────────────────────────────────────────────

/**
 * Returns all members of a group who have given explicit GDPR consent.
 * This is the only safe way to enumerate active members for display or sharing.
 *
 * Members with consentGiven === false are audit-trail entries — not active users.
 */
export function getConsentingMembers(group: SocialGroup): GroupMember[] {
  return group.members.filter((m) => m.consentGiven);
}

/**
 * Returns the owner's GroupMember record, or null if not found.
 * A valid group always has exactly one owner; null signals data corruption.
 */
export function getOwner(group: SocialGroup): GroupMember | null {
  return group.members.find((m) => m.userId === group.ownerId) ?? null;
}

/**
 * Returns true if `userId` is an active (consenting) member of `group`.
 * Does not check permission level.
 */
export function isMember(userId: string, group: SocialGroup): boolean {
  return group.members.some((m) => m.userId === userId && m.consentGiven);
}

/**
 * Returns all groups in `groups` where `userId` is an active consenting member.
 */
export function getGroupsForUser(
  userId: string,
  groups: SocialGroup[],
): SocialGroup[] {
  return groups.filter((g) => isMember(userId, g));
}
