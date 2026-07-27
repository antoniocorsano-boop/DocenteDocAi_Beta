/**
 * stores/useGroupStore.ts — Social Group Store (Fase 7 — Social Layer)
 *
 * Zustand persist store for Orbit social groups and shared documents.
 * Persists to localStorage under key: 'orbit_social_v1'
 *
 * GDPR invariants:
 *   - consentGiven must be true before a member gains access
 *   - removeMember sets consentGiven = false — never hard-deletes the GroupMember
 *     (audit trail preservation per GDPR art.5(1)(e))
 *   - No external sync without explicit user action
 *
 * Persist key:
 *   'orbit_social_v1' — increment only with an explicit migration plan.
 *   Changing this key resets all group data for existing users.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  SocialGroup,
  GroupMember,
  SharedDocument,
  PermissionLevel,
} from '@/types/social.types';
import { createGroupId, createDocumentId } from '@/modules/orbit/socialEngine';

// ── State shape ───────────────────────────────────────────────────────────────

interface GroupState {
  /** All social groups (active + dissolved audit trail) */
  groups:          SocialGroup[];
  /** All shared documents (active + revoked audit trail) */
  sharedDocuments: SharedDocument[];

  actions: {
    /**
     * Create a new group owned by `ownerId`.
     * The owner is automatically added with permission 'owner' and consentGiven = true.
     * Returns the newly created group.
     */
    createGroup: (
      name:    string,
      ownerId: string,
      opts?:   { description?: string; worldId?: string },
    ) => SocialGroup;

    /**
     * Remove all documents and the group itself.
     * Use only when the owner explicitly dissolves the group.
     */
    dissolveGroup: (groupId: string) => void;

    /**
     * Add or re-activate a member in a group.
     * If a member with the same userId already exists, their record is replaced.
     * `consentGiven` in the provided member object is used as-is — callers must
     * not pass consentGiven = true without an explicit consent UI flow.
     */
    addMember: (groupId: string, member: Omit<GroupMember, 'joinedAt'>) => void;

    /**
     * Revoke a member's access by setting consentGiven = false.
     * The GroupMember record is preserved for GDPR audit purposes.
     */
    removeMember: (groupId: string, userId: string) => void;

    /**
     * Share a document with a group.
     * Assigns a unique ID and timestamps.
     * Returns the created SharedDocument.
     */
    shareDocument: (
      doc: Omit<SharedDocument, 'id' | 'createdAt' | 'updatedAt'>,
    ) => SharedDocument;

    /**
     * Revoke a shared document — removes it from the store and the group's ID list.
     * The document is fully removed (no audit trail needed for documents).
     */
    revokeDocument: (docId: string) => void;

    /**
     * Update the group-level permission for a member.
     * Does not affect per-document permission overrides.
     */
    updatePermission: (
      groupId: string,
      userId:  string,
      level:   PermissionLevel,
    ) => void;
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGroupStore = create<GroupState>()(
  persist(
    (set) => ({
      groups:          [],
      sharedDocuments: [],

      actions: {
        createGroup: (name, ownerId, opts = {}) => {
          const now = new Date().toISOString();

          const ownerMember: GroupMember = {
            userId:       ownerId,
            displayName:  ownerId,  // caller should update displayName after creation
            permission:   'owner',
            joinedAt:     now,
            consentGiven: true,
          };

          const group: SocialGroup = {
            id:                createGroupId(),
            name,
            description:       opts.description,
            createdAt:         now,
            ownerId,
            members:           [ownerMember],
            sharedDocumentIds: [],
            worldId:           opts.worldId,
          };

          set((state) => ({ groups: [...state.groups, group] }));
          return group;
        },

        dissolveGroup: (groupId) =>
          set((state) => ({
            groups: state.groups.filter((g) => g.id !== groupId),
            sharedDocuments: state.sharedDocuments.filter((d) => d.groupId !== groupId),
          })),

        addMember: (groupId, member) =>
          set((state) => ({
            groups: state.groups.map((g) => {
              if (g.id !== groupId) return g;
              const withoutExisting = g.members.filter((m) => m.userId !== member.userId);
              return {
                ...g,
                members: [
                  ...withoutExisting,
                  { ...member, joinedAt: new Date().toISOString() },
                ],
              };
            }),
          })),

        removeMember: (groupId, userId) =>
          set((state) => ({
            groups: state.groups.map((g) => {
              if (g.id !== groupId) return g;
              return {
                ...g,
                members: g.members.map((m) =>
                  m.userId !== userId
                    ? m
                    : { ...m, consentGiven: false },  // GDPR audit trail — not a hard delete
                ),
              };
            }),
          })),

        shareDocument: (doc) => {
          const now    = new Date().toISOString();
          const newDoc: SharedDocument = {
            ...doc,
            id:        createDocumentId(),
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            sharedDocuments: [...state.sharedDocuments, newDoc],
            groups: state.groups.map((g) =>
              g.id !== doc.groupId
                ? g
                : { ...g, sharedDocumentIds: [...g.sharedDocumentIds, newDoc.id] },
            ),
          }));

          return newDoc;
        },

        revokeDocument: (docId) =>
          set((state) => {
            const target = state.sharedDocuments.find((d) => d.id === docId);
            return {
              sharedDocuments: state.sharedDocuments.filter((d) => d.id !== docId),
              groups: state.groups.map((g) => {
                if (!target || g.id !== target.groupId) return g;
                return {
                  ...g,
                  sharedDocumentIds: g.sharedDocumentIds.filter((id) => id !== docId),
                };
              }),
            };
          }),

        updatePermission: (groupId, userId, level) =>
          set((state) => ({
            groups: state.groups.map((g) => {
              if (g.id !== groupId) return g;
              return {
                ...g,
                members: g.members.map((m) =>
                  m.userId !== userId ? m : { ...m, permission: level },
                ),
              };
            }),
          })),
      },
    }),
    {
      name: 'orbit_social_v1',
      // Only persist data — not action functions
      partialize: (state) => ({
        groups:          state.groups,
        sharedDocuments: state.sharedDocuments,
      }),
    },
  ),
);

// ── Selectors ─────────────────────────────────────────────────────────────────

/**
 * Returns all groups where `userId` is an active consenting member.
 * Usage: `useGroupStore(selectGroupsForUser(userId))`
 */
export const selectGroupsForUser =
  (userId: string) =>
  (state: GroupState): SocialGroup[] =>
    state.groups.filter((g) =>
      g.members.some((m) => m.userId === userId && m.consentGiven),
    );

/**
 * Returns all shared documents belonging to `groupId`.
 * Usage: `useGroupStore(selectDocumentsByGroup(groupId))`
 */
export const selectDocumentsByGroup =
  (groupId: string) =>
  (state: GroupState): SharedDocument[] =>
    state.sharedDocuments.filter((d) => d.groupId === groupId);
