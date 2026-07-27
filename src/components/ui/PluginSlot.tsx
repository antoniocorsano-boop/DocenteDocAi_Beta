/**
 * PluginSlot.tsx — #19 Plugin-ready architecture
 *
 * Renders all widgets registered for a named slot. Uses the singleton
 * `pluginRegistry` (src/services/pluginRegistry.ts) and subscribes to
 * live changes so hot-registered widgets appear without a page reload.
 *
 * Usage:
 *   // In any page — zero coupling to whichever widgets may be registered:
 *   <PluginSlot slot="dashboard-top" context={{ classId }} />
 *
 *   // Registration (typically in a feature module's entry point):
 *   pluginRegistry.register({
 *     id: 'my-widget', slot: 'dashboard-top', label: 'My Widget',
 *     priority: 10, component: MyWidgetComponent,
 *   });
 */

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { pluginRegistry, type PluginWidget, type WidgetSlot, type WidgetProps } from '../../services/pluginRegistry';

// ── hook: usePluginWidgets ─────────────────────────────────────────────────────

/**
 * Returns all widgets for a given slot, kept in sync with the registry.
 * Re-renders only when the registry notifies a change.
 */
export function usePluginWidgets(slot: WidgetSlot): PluginWidget[] {
  const [widgets, setWidgets] = useState<PluginWidget[]>(() => pluginRegistry.getWidgets(slot));

  useEffect(() => {
    // Sync immediately in case slot changed
    setWidgets(pluginRegistry.getWidgets(slot));
    // Subscribe to future changes
    return pluginRegistry.subscribe(() => {
      setWidgets(pluginRegistry.getWidgets(slot));
    });
  }, [slot]);

  return widgets;
}

// ── PluginSlot component ───────────────────────────────────────────────────────

export interface PluginSlotProps {
  /** Named slot to render widgets for. */
  slot: WidgetSlot;
  /** Arbitrary data forwarded as `context` to every widget component. */
  context?: Record<string, unknown>;
  /**
   * Content rendered when no widgets are registered for this slot.
   * Defaults to null (renders nothing).
   */
  emptyFallback?: React.ReactNode;
  /** Additional `sx`-compatible styles for the wrapper Box. */
  sx?: React.ComponentProps<typeof Box>['sx'];
}

/**
 * Renders all widgets registered for the given slot, sorted by priority.
 * Returns null (or `emptyFallback`) when the slot is empty.
 */
const PluginSlot: React.FC<PluginSlotProps> = ({ slot, context, emptyFallback = null, sx }) => {
  const widgets = usePluginWidgets(slot);

  if (widgets.length === 0) {
    return <>{emptyFallback}</>;
  }

  return (
    <Box
      sx={sx}
      data-plugin-slot={slot}
      aria-label={`Slot widget: ${slot}`}
    >
      {widgets.map((widget) => {
        const WidgetComponent = widget.component as React.ComponentType<WidgetProps>;
        return (
          <WidgetComponent
            key={widget.id}
            slot={slot}
            context={context}
          />
        );
      })}
    </Box>
  );
};

export default PluginSlot;
