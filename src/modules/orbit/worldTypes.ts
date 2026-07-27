/**
 * modules/orbit/worldTypes.ts — Orbit World types (Fase 6 — Mondi Orbitanti)
 *
 * Defines the structural types that describe an Orbit "world" — a semantic
 * context cluster that groups related intent, suggestions and feed entries.
 *
 * Design:
 *   - Pure types: no side-effects, no stores
 *   - Domain-mapped: each world links to a DomainIntent for PlanEngine routing
 *   - Privacy-first: feed entries carry only local data (no external sync)
 */

import type { DomainIntent } from './DomainIntentEngine';

// ── WorldConfig ───────────────────────────────────────────────────────────────

/**
 * Static definition of an Orbit world.
 * Registered once in worldRegistry at startup; immutable at runtime.
 */
export interface WorldConfig {
  /** Globally unique world identifier (kebab-case) */
  id:          string;
  /** Human-readable name shown in UI (e.g. "Didattica") */
  label:       string;
  /** One-sentence description for the world-switch UI */
  description: string;
  /** Material icon name for the world avatar/chip */
  icon:        string;
  /**
   * Primary DomainIntent associated with this world.
   * Used by PlanEngine to boost confidence when user is in this world.
   */
  domain:      DomainIntent;
  /**
   * Lowercase keyword substrings that suggest the user is entering this world.
   * Checked by OrbitSuggestionEngine when generating cross-world suggestions.
   */
  keywords:    string[];
  /**
   * Optional CSS custom-property key for the world accent color.
   * Falls back to `--md-sys-color-primary` if not set.
   * Example: `--orbit-world-didattica`
   */
  colorToken?: string;
}

// ── WorldFeedEntry ────────────────────────────────────────────────────────────

/** A single entry in a world's activity feed. */
export interface WorldFeedEntry {
  /** Stable unique ID */
  id:        string;
  /** Parent world */
  worldId:   string;
  /** Short title (≤ 80 chars) */
  title:     string;
  /** 1–2 sentence summary for the feed row */
  summary:   string;
  /** Epoch ms — used for reverse-chronological sort */
  timestamp: number;
  /** Origin of the entry */
  source:   'user' | 'ai' | 'system';
}

// ── WorldFeed ─────────────────────────────────────────────────────────────────

/** Aggregated feed for a world — most recent entries first. */
export interface WorldFeed {
  worldId:     string;
  entries:     WorldFeedEntry[];
  lastUpdated: number;
}

// ── WorldContext ──────────────────────────────────────────────────────────────

/** Ephemeral session-scoped context for the currently active world. */
export interface WorldContext {
  worldId:       string;
  active:        boolean;
  /** Epoch ms when this world session started */
  sessionStart:  number;
  /** Number of user-initiated actions in this session */
  actionsCount:  number;
}
