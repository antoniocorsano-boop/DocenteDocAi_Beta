/**
 * CopilotProvider.tsx — React context provider that wires the Copilot layer.
 *
 * Responsibilities:
 *  1. Listen to ALL CognitionBus events via wildcard subscription
 *  2. Generate proactive suggestions via CopilotPredictions
 *  3. Render a non-intrusive suggestion chip bar at the bottom of the app
 *  4. Execute chosen suggestions via CopilotActions
 *  5. Expose `useCopilot()` hook for imperative access from child components
 *
 * MD3 compliance: uses M3Surface + MUI v7 components only. No raw <div> containers.
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import M3Surface from '../components/ui/M3Surface';
import { cognitionBus } from '../cognition/CognitionBus';
import type { CognitionEvents } from '../cognition/CognitionBus';
import { suggest, hasPredictions } from './CopilotPredictions';
import type { CopilotSuggestion } from './CopilotPredictions';
import { executeCopilotAction } from './CopilotActions';
import type { ActionContext } from './CopilotActions';
import { initArtisticConsilium, _resetArtisticConsilium } from '../services/ArtisticConsilium';
import { mapCopilotSuggestionToIngest, isMappedToOrbit } from './adapters/predictionsToCognitive';
import { ingestInput } from '../modules/cognitiveLayer';
import { tenantRegistry } from '../services/tenant/tenantRegistry';

// ── Context ───────────────────────────────────────────────────────────────────

export interface CopilotContextValue {
    /** Currently visible suggestions */
    suggestions: CopilotSuggestion[];
    /** Dismiss a specific suggestion by id */
    dismiss: (id: string) => void;
    /** Dismiss all current suggestions */
    dismissAll: () => void;
    /** Execute a suggestion action */
    execute: (suggestion: CopilotSuggestion) => Promise<void>;
    /** Whether the suggestion bar is currently visible */
    isVisible: boolean;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

/** Access the Copilot context from any child component */
export function useCopilot(): CopilotContextValue {
    const ctx = useContext(CopilotContext);
    if (!ctx) throw new Error('useCopilot must be used inside <CopilotProvider>');
    return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export interface CopilotProviderProps {
    children: React.ReactNode;
    /**
     * Callback to navigate to a given view.
     * Injected from App.tsx so CopilotActions doesn't import React hooks.
     */
    onNavigate: (view: string, ctx?: Record<string, unknown>) => void;
    /** Callback to show a toast notification */
    onToast: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
}

/** Maximum number of suggestions shown at once */
const MAX_SUGGESTIONS = 3;
/** Suggestions auto-dismiss after this many milliseconds */
const AUTO_DISMISS_MS = 12_000;

export function CopilotProvider({
    children,
    onNavigate,
    onToast,
}: CopilotProviderProps): JSX.Element {
    const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Event listener ───────────────────────────────────────────────────────

    const handleEvent = useCallback(
        <K extends keyof CognitionEvents>(eventName: K, payload: CognitionEvents[K]) => {
            if (!hasPredictions(eventName)) return;
            const newSuggestions = suggest(eventName, payload);
            if (!newSuggestions.length) return;

            // Suggestions con mapping Orbit → Cognitive Layer (JarvisIndicator)
            const { tenantId } = tenantRegistry.getContext();
            for (const s of newSuggestions) {
                const params = mapCopilotSuggestionToIngest(s, tenantId);
                if (params) {
                    void ingestInput({
                        tenantId:  params.tenantId,
                        sourceId:  params.sourceId,
                        inputType: 'system_event',
                        content:   params.content,
                        label:     params.label,
                        meta:      params.meta,
                    });
                }
            }

            // Suggestions senza mapping → chip bar legacy
            const unmapped = newSuggestions.filter(s => !isMappedToOrbit(s));
            if (!unmapped.length) return;

            setSuggestions((prev) => {
                // Deduplicate by id
                const existingIds = new Set(prev.map((s) => s.id));
                const fresh = unmapped.filter((s) => !existingIds.has(s.id));
                return [...prev, ...fresh].slice(0, MAX_SUGGESTIONS);
            });

            // Reset auto-dismiss timer on each new suggestion batch
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = setTimeout(() => {
                setSuggestions([]);
            }, AUTO_DISMISS_MS);
        },
        [],
    );

    useEffect(() => {
        // mitt wildcard — receives (type, payload) for every event
        const wildcardHandler = (eventName: unknown, payload: unknown) => {
            handleEvent(
                eventName as keyof CognitionEvents,
                payload as CognitionEvents[keyof CognitionEvents],
            );
        };

        (cognitionBus as unknown as {
            on: (evt: '*', handler: (type: unknown, payload: unknown) => void) => void;
            off: (evt: '*', handler: (type: unknown, payload: unknown) => void) => void;
        }).on('*', wildcardHandler);

        // Wire ArtisticConsilium — quick sync hints from UDA/planning/KB events
        initArtisticConsilium((hint) => {
            setSuggestions((prev) => {
                const existingIds = new Set(prev.map((s) => s.id));
                if (existingIds.has(hint.id)) return prev;
                return [...prev, hint].slice(0, MAX_SUGGESTIONS);
            });
        });

        return () => {
            (cognitionBus as unknown as {
                on: (evt: '*', handler: (type: unknown, payload: unknown) => void) => void;
                off: (evt: '*', handler: (type: unknown, payload: unknown) => void) => void;
            }).off('*', wildcardHandler);

            _resetArtisticConsilium();
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        };
    }, [handleEvent]);

    // ── Actions ──────────────────────────────────────────────────────────────

    const dismiss = useCallback((id: string) => {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        cognitionBus.emit('copilot.suggestion.rejected', { suggestionId: id });
    }, []);

    const dismissAll = useCallback(() => {
        setSuggestions([]);
    }, []);

    const execute = useCallback(
        async (suggestion: CopilotSuggestion) => {
            const actionCtx: ActionContext = {
                navigate: onNavigate,
                showToast: onToast,
            };
            dismiss(suggestion.id);
            await executeCopilotAction(
                suggestion.actionKey,
                suggestion.actionPayload ?? {},
                actionCtx,
            );
        },
        [dismiss, onNavigate, onToast],
    );

    // ── Context value ────────────────────────────────────────────────────────

    const contextValue: CopilotContextValue = {
        suggestions,
        dismiss,
        dismissAll,
        execute,
        isVisible: suggestions.length > 0,
    };

    return (
        <CopilotContext.Provider value={contextValue}>
            {children}
            <CopilotSuggestionBar
                suggestions={suggestions}
                onExecute={execute}
                onDismiss={dismiss}
                onDismissAll={dismissAll}
            />
        </CopilotContext.Provider>
    );
}

// ── Suggestion Bar (UI) ───────────────────────────────────────────────────────

interface SuggestionBarProps {
    suggestions: CopilotSuggestion[];
    onExecute: (s: CopilotSuggestion) => void;
    onDismiss: (id: string) => void;
    onDismissAll: () => void;
}

function CopilotSuggestionBar({
    suggestions,
    onExecute,
    onDismiss,
    onDismissAll,
}: SuggestionBarProps): JSX.Element | null {
    const visible = suggestions.length > 0;

    return (
        <Collapse in={visible} unmountOnExit>
            <M3Surface
                elevation={4}
                component="aside"
                aria-label="Suggerimenti Copilot AI"
                sx={{
                    position: 'fixed',
                    bottom: 'var(--md-sys-spacing-4, 16px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1300,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-2, 8px)',
                    px: 'var(--md-sys-spacing-4, 16px)',
                    py: 'var(--md-sys-spacing-2, 8px)',
                    borderRadius: 'var(--md-sys-shape-corner-large, 16px)',
                    maxWidth: '90vw',
                    flexWrap: 'wrap',
                }}
            >
                {/* Icon */}
                <AutoAwesomeIcon
                    aria-hidden
                    sx={{
                        color: 'var(--md-sys-color-primary)',
                        fontSize: 20,
                        flexShrink: 0,
                    }}
                />

                {/* Label */}
                <Typography
                    variant="labelSmall"
                    sx={{
                        color: 'var(--md-sys-color-on-surface-variant)',
                        flexShrink: 0,
                        mr: 'var(--md-sys-spacing-1, 4px)',
                    }}
                >
                    Copilot:
                </Typography>

                {/* Suggestion chips */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 'var(--md-sys-spacing-2, 8px)',
                        flexWrap: 'wrap',
                        flex: 1,
                    }}
                >
                    {suggestions.map((s) => (
                        <Tooltip key={s.id} title={s.description ?? ''} arrow>
                            <Chip
                                label={s.label}
                                onClick={() => onExecute(s)}
                                onDelete={() => onDismiss(s.id)}
                                deleteIcon={
                                    <CloseIcon
                                        aria-label={`Ignora: ${s.label}`}
                                        sx={{ fontSize: 14 }}
                                    />
                                }
                                aria-label={`Suggerimento: ${s.label}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{
                                    borderRadius: 'var(--md-sys-shape-corner-small, 8px)',
                                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                    cursor: 'pointer',
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>

                {/* Dismiss all */}
                {suggestions.length > 1 && (
                    <Tooltip title="Ignora tutti i suggerimenti">
                        <IconButton
                            onClick={onDismissAll}
                            aria-label="Ignora tutti i suggerimenti Copilot"
                            size="small"
                            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </M3Surface>
        </Collapse>
    );
}
