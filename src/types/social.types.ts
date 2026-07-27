/**
 * types/social.types.ts — Social Layer types (Fase 7 — Social Layer)
 *
 * GDPR-safe data model for Orbit groups, shared documents and permissions.
 *
 * Design:
 *   - Pure types: no side-effects, no imports from non-type modules
 *   - Privacy-first: consentGiven required for membership; no cross-user data without consent
 *   - Permission model: owner > editor > viewer (LEAST_PRIVILEGE principle)
 *   - Audit trail: removing a member sets consentGiven = false — never hard-deletes GroupMember
 */

// ── Permission Level ──────────────────────────────────────────────────────────

/**
 * Hierarchical access level within a group or document.
 *   `owner`  → full control (create, edit, delete, invite, revoke)
 *   `editor` → read + write, no delete or membership changes
 *   `viewer` → read-only
 */
export type PermissionLevel = 'owner' | 'editor' | 'viewer';

// ── GroupMember ───────────────────────────────────────────────────────────────

/**
 * A member of a SocialGroup.
 *
 * GDPR art.6 (consent): membership is only active when consentGiven === true.
 * When a member is removed, consentGiven is set to false — the record is kept
 * as an audit trail but the user loses all access.
 */
export interface GroupMember {
  /** Opaque user identifier (local UUID — never server-synced without explicit action) */
  userId:       string;
  /** Display name shown in group UI */
  displayName:  string;
  /** Access level for all group documents (unless overridden per-document) */
  permission:   PermissionLevel;
  /** ISO 8601 timestamp of joining */
  joinedAt:     string;
  /**
   * GDPR consent flag.
   * true  = user has given explicit consent to share data with this group.
   * false = access revoked; record kept for audit purposes only.
   */
  consentGiven: boolean;
}

// ── SocialGroup ───────────────────────────────────────────────────────────────

/**
 * An Orbit collaboration group.
 * Groups are scoped to a single Orbit world (worldId) and can hold multiple members.
 * All data is local-first; no cross-device sync without explicit user action.
 */
export interface SocialGroup {
  /** Unique group ID — format: `grp-{timestamp36}-{random5}` */
  id:                string;
  /** Human-readable group name */
  name:              string;
  /** Optional one-line description shown in group chips */
  description?:      string;
  /** ISO 8601 creation timestamp */
  createdAt:         string;
  /** userId of the group owner — always has PermissionLevel 'owner' */
  ownerId:           string;
  /** All members, including the owner; audit-trail entries included (consentGiven false) */
  members:           GroupMember[];
  /** Ordered list of SharedDocument IDs attached to this group */
  sharedDocumentIds: string[];
  /** Optional: binds the group to a specific Orbit world (worldId from worldRegistry) */
  worldId?:          string;
}

// ── SharedDocument ────────────────────────────────────────────────────────────

/**
 * A document or artifact shared within a SocialGroup.
 *
 * Permission resolution:
 *   1. If doc.permissions[userId] is set → use that level
 *   2. Otherwise fall back to the group member's permission
 *   3. If the user is not a member or consentGiven = false → no access
 */
export interface SharedDocument {
  /** Unique document ID — format: `doc-{timestamp36}-{random5}` */
  id:              string;
  /** Human-readable title */
  title:           string;
  /** ID of the SocialGroup that contains this document */
  groupId:         string;
  /** userId of the document author */
  authorId:        string;
  /** ISO 8601 creation timestamp */
  createdAt:       string;
  /** ISO 8601 last-update timestamp */
  updatedAt:       string;
  /** Optional summary shown in group feed */
  contentSummary?: string;
  /** Semantic document type — maps to app domain */
  type:            'note' | 'uda' | 'plan' | 'resource';
  /**
   * Per-user permission overrides.
   * Key = userId, value = PermissionLevel.
   * If userId is absent, the group-level member permission applies.
   */
  permissions:     Record<string, PermissionLevel>;
}
