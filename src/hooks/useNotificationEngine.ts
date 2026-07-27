/**
 * useNotificationEngine — gestione toast e installazione PWA.
 *
 * Estratto da useAppEngine (Step 1 – Foundation Stabilization).
 * Responsabilità:
 *   - Registra il listener beforeinstallprompt per PWA
 *   - Espone showToast centralizzato (key lookup in messages.ts)
 *   - Espone handleInstallApp
 */
import { useEffect, useCallback } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { messages } from '../messages';
import type { BeforeInstallPromptEvent } from '../types.ts';

export type ShowToast = (messageKey: string, type?: 'success' | 'error' | 'info') => void;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useNotificationEngine = () => {
    const { installPrompt, actions: uiActions } = useUIStore();

    // --- PWA install prompt ---
    useEffect(() => {
        const handler = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            uiActions.setInstallPrompt(e);
            uiActions.setCanShowInstallPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handler as EventListener);
        return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showToast: ShowToast = useCallback((messageKey, type = 'info') => {
        const msg = (messages.toast as Record<string, string>)[messageKey] || messageKey;
        uiActions.showToast(msg, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleInstallApp = useCallback(() => {
        if (installPrompt && typeof installPrompt.prompt === 'function') {
            installPrompt.prompt();
            installPrompt.userChoice?.then((choiceResult: { outcome: 'accepted' | 'dismissed'; platform: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    uiActions.setInstallPrompt(null);
                    uiActions.setCanShowInstallPrompt(false);
                }
            });
        }
    }, [installPrompt, uiActions]);

    return { showToast, handleInstallApp };
};
