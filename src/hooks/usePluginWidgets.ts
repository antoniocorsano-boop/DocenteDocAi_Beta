/**
 * usePluginWidgets — reactive hook for plugin slot contents.
 *
 * Returns the current list of registered widgets for the given slot.
 * Re-renders automatically when widgets are added, updated or removed.
 *
 * Roadmap: #19 — Plugin-ready: architettura per widget Trello-style
 *
 * @example
 * ```tsx
 * const widgets = usePluginWidgets('dashboard-top');
 * return (
 *   <>
 *     {widgets.map(w => <w.component key={w.id} slot="dashboard-top" />)}
 *   </>
 * );
 * ```
 */
import { useState, useEffect } from 'react';
import { pluginRegistry, type WidgetSlot, type PluginWidget } from '../services/pluginRegistry';

/**
 * Returns widgets registered for `slot`, sorted by priority.
 * Updates reactively when the registry changes.
 */
export function usePluginWidgets(slot: WidgetSlot): PluginWidget[] {
  const [widgets, setWidgets] = useState<PluginWidget[]>(() =>
    pluginRegistry.getWidgets(slot),
  );

  useEffect(() => {
    // Sync immediately in case registry changed between render and effect
    setWidgets(pluginRegistry.getWidgets(slot));

    const unsubscribe = pluginRegistry.subscribe(() => {
      setWidgets(pluginRegistry.getWidgets(slot));
    });

    return unsubscribe;
  }, [slot]);

  return widgets;
}
