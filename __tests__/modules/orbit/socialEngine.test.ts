/**
 * __tests__/modules/orbit/socialEngine.test.ts
 *
 * Unit tests for src/modules/orbit/socialEngine.ts (Fase 7 — Social Layer)
 *
 * Coverage:
 *   - canSatisfy() permission hierarchy
 *   - resolveEffectivePermission() — GDPR consent check, doc override, group fallback
 *   - canAccess() — integration of resolve + satisfy
 *   - createGroupId() / createDocumentId() — format + uniqueness
 *   - getConsentingMembers() — GDPR filter
 *   - getOwner() — owner lookup
 *   - isMember() — consent-aware membership check
 *   - getGroupsForUser() — multi-group filter
 *   - Structural contracts (exports, function arity)
 */

import { describe, it, expect } from 'vitest';
import {
  canSatisfy,
  resolveEffectivePermission,
  canAccess,
  createGroupId,
  createDocumentId,
  getConsentingMembers,
  getOwner,
  isMember,
  getGroupsForUser,
} from '../../../src/modules/orbit/socialEngine';
import type { SocialGroup, SharedDocument, GroupMember } from '../../../src/types/social.types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeGroup(overrides: Partial<SocialGroup> = {}): SocialGroup {
  return {
    id:                'grp-test',
    name:              'Gruppo Test',
    createdAt:         '2026-01-01T00:00:00.000Z',
    ownerId:           'user-owner',
    members: [
      {
        userId:       'user-owner',
        displayName:  'Owner',
        permission:   'owner',
        joinedAt:     '2026-01-01T00:00:00.000Z',
        consentGiven: true,
      },
      {
        userId:       'user-editor',
        displayName:  'Editor',
        permission:   'editor',
        joinedAt:     '2026-01-01T00:00:00.000Z',
        consentGiven: true,
      },
      {
        userId:       'user-viewer',
        displayName:  'Viewer',
        permission:   'viewer',
        joinedAt:     '2026-01-01T00:00:00.000Z',
        consentGiven: true,
      },
      {
        userId:       'user-revoked',
        displayName:  'Revoked',
        permission:   'viewer',
        joinedAt:     '2026-01-01T00:00:00.000Z',
        consentGiven: false,  // GDPR: consent withdrawn
      },
    ],
    sharedDocumentIds: [],
    ...overrides,
  };
}

function makeDoc(overrides: Partial<SharedDocument> = {}): SharedDocument {
  return {
    id:          'doc-test',
    title:       'Test Document',
    groupId:     'grp-test',
    authorId:    'user-owner',
    createdAt:   '2026-01-01T00:00:00.000Z',
    updatedAt:   '2026-01-01T00:00:00.000Z',
    type:        'note',
    permissions: {},
    ...overrides,
  };
}

// ── canSatisfy ────────────────────────────────────────────────────────────────

describe('canSatisfy', () => {
  it('owner satisfies owner', () => {
    expect(canSatisfy('owner', 'owner')).toBe(true);
  });

  it('owner satisfies editor', () => {
    expect(canSatisfy('owner', 'editor')).toBe(true);
  });

  it('owner satisfies viewer', () => {
    expect(canSatisfy('owner', 'viewer')).toBe(true);
  });

  it('editor satisfies editor', () => {
    expect(canSatisfy('editor', 'editor')).toBe(true);
  });

  it('editor satisfies viewer', () => {
    expect(canSatisfy('editor', 'viewer')).toBe(true);
  });

  it('editor does NOT satisfy owner', () => {
    expect(canSatisfy('editor', 'owner')).toBe(false);
  });

  it('viewer satisfies viewer', () => {
    expect(canSatisfy('viewer', 'viewer')).toBe(true);
  });

  it('viewer does NOT satisfy editor', () => {
    expect(canSatisfy('viewer', 'editor')).toBe(false);
  });

  it('viewer does NOT satisfy owner', () => {
    expect(canSatisfy('viewer', 'owner')).toBe(false);
  });
});

// ── resolveEffectivePermission ─────────────────────────────────────────────────

describe('resolveEffectivePermission', () => {
  it('returns null for non-member', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(resolveEffectivePermission('user-unknown', doc, group)).toBeNull();
  });

  it('returns null for revoked member (GDPR)', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(resolveEffectivePermission('user-revoked', doc, group)).toBeNull();
  });

  it('returns group-level permission when no doc override', () => {
    const group = makeGroup();
    const doc   = makeDoc({ permissions: {} });
    expect(resolveEffectivePermission('user-editor', doc, group)).toBe('editor');
  });

  it('returns doc-level override when explicitly set', () => {
    const group = makeGroup();
    const doc   = makeDoc({ permissions: { 'user-editor': 'viewer' } });
    // Doc level overrides group level
    expect(resolveEffectivePermission('user-editor', doc, group)).toBe('viewer');
  });

  it('doc-level owner grant takes priority over group viewer', () => {
    const group = makeGroup();
    const doc   = makeDoc({ permissions: { 'user-viewer': 'owner' } });
    expect(resolveEffectivePermission('user-viewer', doc, group)).toBe('owner');
  });

  it('returns group-level owner for the group owner', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(resolveEffectivePermission('user-owner', doc, group)).toBe('owner');
  });
});

// ── canAccess ─────────────────────────────────────────────────────────────────

describe('canAccess', () => {
  it('owner can access at owner level', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(canAccess('user-owner', doc, group, 'owner')).toBe(true);
  });

  it('editor can access at viewer level', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(canAccess('user-editor', doc, group, 'viewer')).toBe(true);
  });

  it('viewer cannot access at editor level', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(canAccess('user-viewer', doc, group, 'editor')).toBe(false);
  });

  it('revoked member cannot access at any level', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(canAccess('user-revoked', doc, group, 'viewer')).toBe(false);
  });

  it('unknown user cannot access at any level', () => {
    const group = makeGroup();
    const doc   = makeDoc();
    expect(canAccess('user-unknown', doc, group, 'viewer')).toBe(false);
  });
});

// ── createGroupId / createDocumentId ─────────────────────────────────────────

describe('createGroupId', () => {
  it('starts with grp-', () => {
    expect(createGroupId()).toMatch(/^grp-/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createGroupId()));
    expect(ids.size).toBe(20);
  });
});

describe('createDocumentId', () => {
  it('starts with doc-', () => {
    expect(createDocumentId()).toMatch(/^doc-/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createDocumentId()));
    expect(ids.size).toBe(20);
  });
});

// ── getConsentingMembers ──────────────────────────────────────────────────────

describe('getConsentingMembers', () => {
  it('filters out revoked members', () => {
    const group = makeGroup();
    const active = getConsentingMembers(group);
    expect(active.every((m) => m.consentGiven)).toBe(true);
  });

  it('excludes user-revoked', () => {
    const group = makeGroup();
    const active = getConsentingMembers(group);
    expect(active.find((m) => m.userId === 'user-revoked')).toBeUndefined();
  });

  it('includes 3 active members (owner + editor + viewer)', () => {
    const group = makeGroup();
    expect(getConsentingMembers(group)).toHaveLength(3);
  });

  it('returns empty array for group with no consenting members', () => {
    const group = makeGroup({
      members: [
        {
          userId: 'u1', displayName: 'U1',
          permission: 'owner', joinedAt: '2026-01-01T00:00:00.000Z', consentGiven: false,
        },
      ],
    });
    expect(getConsentingMembers(group)).toHaveLength(0);
  });
});

// ── getOwner ──────────────────────────────────────────────────────────────────

describe('getOwner', () => {
  it('returns the owner member', () => {
    const group = makeGroup();
    const owner = getOwner(group);
    expect(owner?.userId).toBe('user-owner');
    expect(owner?.permission).toBe('owner');
  });

  it('returns null if owner is missing from members', () => {
    const group = makeGroup({ ownerId: 'user-missing' });
    expect(getOwner(group)).toBeNull();
  });
});

// ── isMember ──────────────────────────────────────────────────────────────────

describe('isMember', () => {
  it('returns true for active consenting member', () => {
    const group = makeGroup();
    expect(isMember('user-editor', group)).toBe(true);
  });

  it('returns false for revoked member', () => {
    const group = makeGroup();
    expect(isMember('user-revoked', group)).toBe(false);
  });

  it('returns false for non-member', () => {
    const group = makeGroup();
    expect(isMember('user-stranger', group)).toBe(false);
  });
});

// ── getGroupsForUser ──────────────────────────────────────────────────────────

describe('getGroupsForUser', () => {
  it('returns groups where user is active member', () => {
    const g1 = makeGroup({ id: 'grp-1' });
    const g2 = makeGroup({
      id: 'grp-2',
      members: [
        {
          userId: 'user-other', displayName: 'Other',
          permission: 'owner', joinedAt: '2026-01-01T00:00:00.000Z', consentGiven: true,
        },
      ],
    });
    const result = getGroupsForUser('user-editor', [g1, g2]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('grp-1');
  });

  it('returns empty array when user has no groups', () => {
    const g1 = makeGroup({ id: 'grp-1' });
    expect(getGroupsForUser('user-stranger', [g1])).toHaveLength(0);
  });

  it('excludes groups where user consent is revoked', () => {
    const g1 = makeGroup({ id: 'grp-1' });
    expect(getGroupsForUser('user-revoked', [g1])).toHaveLength(0);
  });
});

// ── Structural contracts ───────────────────────────────────────────────────────

describe('socialEngine structural contracts', () => {
  it('exports canSatisfy as a function', () => {
    expect(typeof canSatisfy).toBe('function');
  });

  it('exports resolveEffectivePermission as a function', () => {
    expect(typeof resolveEffectivePermission).toBe('function');
  });

  it('exports canAccess as a function', () => {
    expect(typeof canAccess).toBe('function');
  });

  it('exports createGroupId as a function', () => {
    expect(typeof createGroupId).toBe('function');
  });

  it('exports createDocumentId as a function', () => {
    expect(typeof createDocumentId).toBe('function');
  });

  it('exports getConsentingMembers as a function', () => {
    expect(typeof getConsentingMembers).toBe('function');
  });

  it('exports getOwner as a function', () => {
    expect(typeof getOwner).toBe('function');
  });

  it('exports isMember as a function', () => {
    expect(typeof isMember).toBe('function');
  });

  it('exports getGroupsForUser as a function', () => {
    expect(typeof getGroupsForUser).toBe('function');
  });
});
