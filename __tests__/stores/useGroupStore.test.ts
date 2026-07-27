// @ts-nocheck
/**
 * __tests__/stores/useGroupStore.test.ts
 *
 * Unit tests for src/stores/useGroupStore.ts (Fase 7 — Social Layer)
 *
 * Coverage:
 *   - Initial state (empty groups, empty documents)
 *   - createGroup — owner membership, timestamps, worldId
 *   - dissolveGroup — removes group + its documents
 *   - addMember — insert + replace existing
 *   - removeMember — GDPR: sets consentGiven = false, record kept
 *   - shareDocument — assigns ID + timestamps + updates group
 *   - revokeDocument — removes from store + group
 *   - updatePermission — changes group-level member permission
 *   - Selectors: selectGroupsForUser, selectDocumentsByGroup
 *   - Structural contracts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGroupStore, selectGroupsForUser, selectDocumentsByGroup } from '../../src/stores/useGroupStore';

// ── Reset helper ──────────────────────────────────────────────────────────────

function resetStore() {
  useGroupStore.setState({ groups: [], sharedDocuments: [] });
}

// ── Initial state ─────────────────────────────────────────────────────────────

describe('useGroupStore — initial state', () => {
  beforeEach(resetStore);

  it('starts with no groups', () => {
    expect(useGroupStore.getState().groups).toHaveLength(0);
  });

  it('starts with no shared documents', () => {
    expect(useGroupStore.getState().sharedDocuments).toHaveLength(0);
  });
});

// ── createGroup ───────────────────────────────────────────────────────────────

describe('useGroupStore — createGroup', () => {
  beforeEach(resetStore);

  it('adds a new group', () => {
    useGroupStore.getState().actions.createGroup('Biologia 3A', 'user-1');
    expect(useGroupStore.getState().groups).toHaveLength(1);
  });

  it('returns the created group object', () => {
    const group = useGroupStore.getState().actions.createGroup('Math', 'user-1');
    expect(group.name).toBe('Math');
    expect(group.ownerId).toBe('user-1');
  });

  it('assigns a grp- prefixed ID', () => {
    const group = useGroupStore.getState().actions.createGroup('History', 'user-1');
    expect(group.id).toMatch(/^grp-/);
  });

  it('sets owner as first member with permission owner', () => {
    const group = useGroupStore.getState().actions.createGroup('Science', 'user-42');
    const owner = group.members.find((m) => m.userId === 'user-42');
    expect(owner).toBeDefined();
    expect(owner.permission).toBe('owner');
    expect(owner.consentGiven).toBe(true);
  });

  it('sets description and worldId when provided', () => {
    const group = useGroupStore.getState().actions.createGroup(
      'Gruppo Didattica',
      'user-1',
      { description: 'Test desc', worldId: 'didattica' },
    );
    expect(group.description).toBe('Test desc');
    expect(group.worldId).toBe('didattica');
  });

  it('initialises sharedDocumentIds as empty array', () => {
    const group = useGroupStore.getState().actions.createGroup('Empty Docs', 'user-1');
    expect(group.sharedDocumentIds).toEqual([]);
  });

  it('can create multiple groups', () => {
    useGroupStore.getState().actions.createGroup('G1', 'user-1');
    useGroupStore.getState().actions.createGroup('G2', 'user-2');
    expect(useGroupStore.getState().groups).toHaveLength(2);
  });
});

// ── dissolveGroup ─────────────────────────────────────────────────────────────

describe('useGroupStore — dissolveGroup', () => {
  beforeEach(resetStore);

  it('removes the group', () => {
    const g = useGroupStore.getState().actions.createGroup('ToDissolve', 'user-1');
    useGroupStore.getState().actions.dissolveGroup(g.id);
    expect(useGroupStore.getState().groups).toHaveLength(0);
  });

  it('removes documents belonging to the dissolved group', () => {
    const g = useGroupStore.getState().actions.createGroup('WithDocs', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'U2', permission: 'editor', consentGiven: true,
    });
    useGroupStore.getState().actions.shareDocument({
      title: 'Note', groupId: g.id, authorId: 'user-1',
      type: 'note', permissions: {},
    });
    useGroupStore.getState().actions.dissolveGroup(g.id);
    expect(useGroupStore.getState().sharedDocuments).toHaveLength(0);
  });

  it('does not affect other groups', () => {
    const g1 = useGroupStore.getState().actions.createGroup('G1', 'user-1');
    useGroupStore.getState().actions.createGroup('G2', 'user-2');
    useGroupStore.getState().actions.dissolveGroup(g1.id);
    expect(useGroupStore.getState().groups).toHaveLength(1);
    expect(useGroupStore.getState().groups[0].name).toBe('G2');
  });
});

// ── addMember ─────────────────────────────────────────────────────────────────

describe('useGroupStore — addMember', () => {
  beforeEach(resetStore);

  it('adds a new member to the group', () => {
    const g = useGroupStore.getState().actions.createGroup('Team', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Alice', permission: 'editor', consentGiven: true,
    });
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    expect(updated.members).toHaveLength(2);
  });

  it('assigns joinedAt timestamp automatically', () => {
    const g = useGroupStore.getState().actions.createGroup('Team', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Alice', permission: 'editor', consentGiven: true,
    });
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    const alice = updated.members.find((m) => m.userId === 'user-2');
    expect(alice.joinedAt).toBeTruthy();
  });

  it('replaces an existing member record with same userId', () => {
    const g = useGroupStore.getState().actions.createGroup('Team', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Alice', permission: 'viewer', consentGiven: true,
    });
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Alice Updated', permission: 'editor', consentGiven: true,
    });
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    const alice = updated.members.filter((m) => m.userId === 'user-2');
    expect(alice).toHaveLength(1);
    expect(alice[0].permission).toBe('editor');
  });
});

// ── removeMember ─────────────────────────────────────────────────────────────

describe('useGroupStore — removeMember (GDPR)', () => {
  beforeEach(resetStore);

  it('sets consentGiven = false — does NOT delete the record', () => {
    const g = useGroupStore.getState().actions.createGroup('Team', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Alice', permission: 'editor', consentGiven: true,
    });
    useGroupStore.getState().actions.removeMember(g.id, 'user-2');
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    const alice = updated.members.find((m) => m.userId === 'user-2');
    expect(alice).toBeDefined();
    expect(alice.consentGiven).toBe(false);
  });

  it('does not affect other members', () => {
    const g = useGroupStore.getState().actions.createGroup('Team', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Alice', permission: 'editor', consentGiven: true,
    });
    useGroupStore.getState().actions.removeMember(g.id, 'user-2');
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    const owner = updated.members.find((m) => m.userId === 'user-1');
    expect(owner.consentGiven).toBe(true);
  });
});

// ── shareDocument ─────────────────────────────────────────────────────────────

describe('useGroupStore — shareDocument', () => {
  beforeEach(resetStore);

  it('adds document to sharedDocuments', () => {
    const g = useGroupStore.getState().actions.createGroup('Docs', 'user-1');
    useGroupStore.getState().actions.shareDocument({
      title: 'Piano', groupId: g.id, authorId: 'user-1',
      type: 'plan', permissions: {},
    });
    expect(useGroupStore.getState().sharedDocuments).toHaveLength(1);
  });

  it('returns the created document with doc- prefixed ID', () => {
    const g = useGroupStore.getState().actions.createGroup('Docs', 'user-1');
    const doc = useGroupStore.getState().actions.shareDocument({
      title: 'Nota', groupId: g.id, authorId: 'user-1',
      type: 'note', permissions: {},
    });
    expect(doc.id).toMatch(/^doc-/);
  });

  it('appends document ID to group.sharedDocumentIds', () => {
    const g = useGroupStore.getState().actions.createGroup('Docs', 'user-1');
    const doc = useGroupStore.getState().actions.shareDocument({
      title: 'UDA', groupId: g.id, authorId: 'user-1',
      type: 'uda', permissions: {},
    });
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    expect(updated.sharedDocumentIds).toContain(doc.id);
  });

  it('assigns createdAt and updatedAt', () => {
    const g = useGroupStore.getState().actions.createGroup('Docs', 'user-1');
    const doc = useGroupStore.getState().actions.shareDocument({
      title: 'Resource', groupId: g.id, authorId: 'user-1',
      type: 'resource', permissions: {},
    });
    expect(doc.createdAt).toBeTruthy();
    expect(doc.updatedAt).toBeTruthy();
  });
});

// ── revokeDocument ────────────────────────────────────────────────────────────

describe('useGroupStore — revokeDocument', () => {
  beforeEach(resetStore);

  it('removes document from sharedDocuments', () => {
    const g = useGroupStore.getState().actions.createGroup('Docs', 'user-1');
    const doc = useGroupStore.getState().actions.shareDocument({
      title: 'Note', groupId: g.id, authorId: 'user-1',
      type: 'note', permissions: {},
    });
    useGroupStore.getState().actions.revokeDocument(doc.id);
    expect(useGroupStore.getState().sharedDocuments).toHaveLength(0);
  });

  it('removes document ID from group.sharedDocumentIds', () => {
    const g = useGroupStore.getState().actions.createGroup('Docs', 'user-1');
    const doc = useGroupStore.getState().actions.shareDocument({
      title: 'Note', groupId: g.id, authorId: 'user-1',
      type: 'note', permissions: {},
    });
    useGroupStore.getState().actions.revokeDocument(doc.id);
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    expect(updated.sharedDocumentIds).not.toContain(doc.id);
  });
});

// ── updatePermission ──────────────────────────────────────────────────────────

describe('useGroupStore — updatePermission', () => {
  beforeEach(resetStore);

  it('updates the group-level permission for a member', () => {
    const g = useGroupStore.getState().actions.createGroup('Perm', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Bob', permission: 'viewer', consentGiven: true,
    });
    useGroupStore.getState().actions.updatePermission(g.id, 'user-2', 'editor');
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    const bob = updated.members.find((m) => m.userId === 'user-2');
    expect(bob.permission).toBe('editor');
  });

  it('does not affect other members permissions', () => {
    const g = useGroupStore.getState().actions.createGroup('Perm', 'user-1');
    useGroupStore.getState().actions.addMember(g.id, {
      userId: 'user-2', displayName: 'Bob', permission: 'viewer', consentGiven: true,
    });
    useGroupStore.getState().actions.updatePermission(g.id, 'user-2', 'editor');
    const updated = useGroupStore.getState().groups.find((x) => x.id === g.id);
    const owner = updated.members.find((m) => m.userId === 'user-1');
    expect(owner.permission).toBe('owner');
  });
});

// ── Selectors ─────────────────────────────────────────────────────────────────

describe('selectGroupsForUser', () => {
  beforeEach(resetStore);

  it('returns groups where user is active consenting member', () => {
    const g1 = useGroupStore.getState().actions.createGroup('G1', 'user-1');
    useGroupStore.getState().actions.createGroup('G2', 'user-2');
    const state = useGroupStore.getState();
    const groups = selectGroupsForUser('user-1')(state);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(g1.id);
  });

  it('excludes groups where user consent is revoked', () => {
    const g1 = useGroupStore.getState().actions.createGroup('G1', 'user-1');
    useGroupStore.getState().actions.addMember(g1.id, {
      userId: 'user-2', displayName: 'U2', permission: 'viewer', consentGiven: false,
    });
    const state = useGroupStore.getState();
    const groups = selectGroupsForUser('user-2')(state);
    expect(groups).toHaveLength(0);
  });

  it('returns empty array when user has no groups', () => {
    useGroupStore.getState().actions.createGroup('G1', 'user-1');
    const state = useGroupStore.getState();
    expect(selectGroupsForUser('user-stranger')(state)).toHaveLength(0);
  });
});

describe('selectDocumentsByGroup', () => {
  beforeEach(resetStore);

  it('returns documents for the given group', () => {
    const g = useGroupStore.getState().actions.createGroup('Docs', 'user-1');
    useGroupStore.getState().actions.shareDocument({
      title: 'Note', groupId: g.id, authorId: 'user-1',
      type: 'note', permissions: {},
    });
    const state = useGroupStore.getState();
    const docs = selectDocumentsByGroup(g.id)(state);
    expect(docs).toHaveLength(1);
    expect(docs[0].groupId).toBe(g.id);
  });

  it('returns empty array for unknown group', () => {
    const state = useGroupStore.getState();
    expect(selectDocumentsByGroup('grp-unknown')(state)).toHaveLength(0);
  });
});

// ── Structural contracts ───────────────────────────────────────────────────────

describe('useGroupStore structural contracts', () => {
  it('exports useGroupStore', () => {
    expect(typeof useGroupStore).toBe('function');
  });

  it('exports selectGroupsForUser as a function', () => {
    expect(typeof selectGroupsForUser).toBe('function');
  });

  it('exports selectDocumentsByGroup as a function', () => {
    expect(typeof selectDocumentsByGroup).toBe('function');
  });

  it('actions object contains all expected actions', () => {
    const { actions } = useGroupStore.getState();
    const expected = [
      'createGroup', 'dissolveGroup', 'addMember', 'removeMember',
      'shareDocument', 'revokeDocument', 'updatePermission',
    ];
    expected.forEach((key) => {
      expect(typeof actions[key]).toBe('function');
    });
  });
});
