/**
 * useNavigationEngine — gestione navigazione SPA.
 *
 * Estratto da useAppEngine (Step 1 – Foundation Stabilization).
 * Responsabilità:
 *   - Stato locale view / viewContext
 *   - handleNavigate con emit CognitionBus e history append
 *   - handleBack
 */
import { useState, useCallback } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { cognitionBus } from '../cognition/CognitionBus';
import { errorLogger } from '../services/errorLogger';
import type { View } from '../types.ts';
import type { ShowToast } from './useNotificationEngine';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useNavigationEngine = (showToast: ShowToast) => {
    const [view, setView] = useState<View>('home');
    const [viewContext, setViewContext] = useState<Record<string, unknown> | null>(null);
    const { navigationHistory, actions: uiActions } = useUIStore();

    const handleNavigate = useCallback((newView: View, context?: unknown) => {
        const ctx = (context ?? null) as Record<string, unknown> | null;
        try {
            cognitionBus.emit('navigation.view_changed', { from: view as string, to: String(newView) });
            uiActions.addNavigationEntry({ view, context: viewContext });
            setView(newView);
            setViewContext(ctx);
            window.scrollTo(0, 0);
            errorLogger.logInfo(
                `Navigated to ${newView}`,
                'navigation',
                { fromView: view, toView: newView, hasContext: !!ctx }
            );
        } catch (error) {
            errorLogger.logNavigationError(newView, error as Error, view);
            showToast('Errore durante la navigazione', 'error');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, viewContext, showToast]);

    const handleBack = useCallback((force = false) => {
        if (navigationHistory.length > 0) {
            const last = navigationHistory[navigationHistory.length - 1];
            uiActions.popNavigationEntry();
            setView(last.view);
            setViewContext(last.context as Record<string, unknown> | null);
        } else if (view !== 'home' || force) {
            setView('home');
            setViewContext(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigationHistory, view]);

    const canGoBack = navigationHistory.length > 0 || view !== 'home';

    return { view, viewContext, setViewContext, handleNavigate, handleBack, canGoBack };
};
