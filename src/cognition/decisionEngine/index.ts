/**
 * decisionEngine/index.ts — barrel export.
 *
 * The Decision Engine is the single source of truth for "what should the
 * teacher do next". All UI components must consume this via `useNextAction`.
 */

export { getNextAction } from './getNextAction';
export type { NextAction, NextActionContext } from './types';
