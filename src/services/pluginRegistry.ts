/**
 * pluginRegistry — lightweight client-side widget/plugin architecture.
 *
 * Provides named "slots" where feature teams (or future plugin authors) can
 * register React components without modifying core pages. Consumers render
 * slot contents via `usePluginWidgets(slotId)` or `<WidgetSlotRenderer>`.
 *
 * Design: Trello-style — any page exposes named slots; widgets self-register
 * with a priority number and are rendered in ascending priority order.
 *
 * Roadmap: #19 — Plugin-ready: architettura per widget Trello-style
 */
import type React from 'react';

// ──────────────────────────────────────────────────────────────────────────────
// Slot identifiers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * All named slots where widgets can be injected.
 * Add new slots here as pages expose extension points.
 */
export type WidgetSlot =
  | 'dashboard-top'        // Above the class dashboard header
  | 'dashboard-sidebar'    // Right column of class dashboard
  | 'student-sidebar'      // Student profile side panel
  | 'uda-actions'          // Extra buttons in UDA card actions row
  | 'studio-tools'         // Additional tools below Studio AI grid
  | 'reportistica-after'   // Below the document grid in ReportisticaHub
  | 'settings-extra'       // Extra panels at bottom of Settings
  | 'global-overlay'       // Full-screen overlays (e.g. tutorials, tours)
  | 'maturita-widget';     // Slot per plugin futuri nel tab Maturità AI

// ──────────────────────────────────────────────────────────────────────────────
// Widget definition
// ──────────────────────────────────────────────────────────────────────────────

/** Props passed to every widget component */
export interface WidgetProps {
  /** Slot where this widget is rendered */
  slot: WidgetSlot;
  /** Arbitrary context data forwarded by the host page */
  context?: Record<string, unknown>;
}

/** Plugin widget registration descriptor */
export interface PluginWidget {
  /** Unique identifier — used to prevent duplicate registration */
  id: string;
  /** Target slot */
  slot: WidgetSlot;
  /** Human-readable label (used in dev tools / admin views) */
  label: string;
  /** Optional material icon name for admin UI */
  icon?: string;
  /**
   * Rendering priority — lower number = rendered first.
   * Widgets with the same priority are ordered by registration time.
   */
  priority: number;
  /** The React component to render */
  component: React.ComponentType<WidgetProps>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Registry (module singleton)
// ──────────────────────────────────────────────────────────────────────────────

type RegistryListener = () => void;

class PluginRegistryClass {
  private widgets: Map<string, PluginWidget> = new Map();
  private listeners: Set<RegistryListener> = new Set();

  /** Register a widget. No-op if id already registered. */
  register(widget: PluginWidget): void {
    if (this.widgets.has(widget.id)) return;
    this.widgets.set(widget.id, widget);
    this.notify();
  }

  /** Unregister by id. */
  unregister(id: string): void {
    if (!this.widgets.has(id)) return;
    this.widgets.delete(id);
    this.notify();
  }

  /** Replace a widget definition (updates component/priority without re-registering). */
  update(id: string, partial: Partial<Omit<PluginWidget, 'id'>>): void {
    const existing = this.widgets.get(id);
    if (!existing) return;
    this.widgets.set(id, { ...existing, ...partial });
    this.notify();
  }

  /** Get all widgets for a slot, sorted ascending by priority. */
  getWidgets(slot: WidgetSlot): PluginWidget[] {
    return Array.from(this.widgets.values())
      .filter((w) => w.slot === slot)
      .sort((a, b) => a.priority - b.priority);
  }

  /** Get all registered widgets across all slots. */
  getAll(): PluginWidget[] {
    return Array.from(this.widgets.values()).sort((a, b) => a.priority - b.priority);
  }

  /** Subscribe to registry changes (for React hooks). Returns unsubscribe fn. */
  subscribe(listener: RegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}

/** Singleton plugin registry — import this anywhere to register/query widgets. */
export const pluginRegistry = new PluginRegistryClass();
