/**
 * WidgetSlotRenderer — renders all registered widgets for a named slot.
 *
 * Drop this component into any page to make that location extensible
 * without modifying the page itself. Slots with no registered widgets
 * render nothing (zero DOM overhead).
 *
 * @example
 * ```tsx
 * // In ClassDashboard, above the header:
 * <WidgetSlotRenderer slot="dashboard-top" context={{ classeId: selectedClass }} />
 * ```
 *
 * Roadmap: #19 — Plugin-ready: architettura per widget Trello-style
 */
import React from 'react';
import { usePluginWidgets } from '../hooks/usePluginWidgets';
import type { WidgetSlot } from '../services/pluginRegistry';

interface WidgetSlotRendererProps {
  slot: WidgetSlot;
  /** Context data forwarded to each widget component */
  context?: Record<string, unknown>;
  /** Optional wrapper className for the slot container */
  className?: string;
}

/**
 * Renders all widgets registered for `slot` in priority order.
 * Returns null if no widgets are registered (no DOM impact).
 */
const WidgetSlotRenderer: React.FC<WidgetSlotRendererProps> = ({
  slot,
  context,
  className,
}) => {
  const widgets = usePluginWidgets(slot);

  if (widgets.length === 0) return null;

  return (
    <div className={className} data-widget-slot={slot}>
      {widgets.map((w) => (
        <w.component key={w.id} slot={slot} context={context} />
      ))}
    </div>
  );
};

export default WidgetSlotRenderer;
