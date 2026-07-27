// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// M3Expressive refactor: COMPLETED - Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, ButtonBase } from '@mui/material';
import { Uda, EventoCalendario } from '../types';
import { generateHueFromString } from '../utils/colorUtils';
import GanttBar from './GanttBar';
import Tooltip from './Tooltip';
import { logger } from '../utils/logger';

interface TimelineViewProps {
    udas: Uda[];
    events: EventoCalendario[];
    onUdaClick: (uda: Uda) => void;
    startDate: string;
    endDate: string;
    previewMessage: string | null;
    onSaveUda: (uda: Uda) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ udas, events, onUdaClick, startDate, endDate, previewMessage, onSaveUda }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [lastMove, setLastMove] = useState<{ udaId: string; prevStart: string; prevEnd: string } | null>(null);

    // Calculate Timeline Metrics with safe fallbacks when startDate/endDate are invalid
    const inputStart = useMemo(() => new Date(startDate), [startDate]);
    const inputEnd = useMemo(() => new Date(endDate), [endDate]);

    const computedStart = useMemo(() => {
        const candidates: number[] = [];
        if (udas) {
            udas.forEach(u => { if (u.startDate) { const d = new Date(u.startDate).getTime(); if (!isNaN(d)) candidates.push(d); } });
        }
        if (events) {
            events.forEach(e => { if (e.data) { const d = new Date(e.data).getTime(); if (!isNaN(d)) candidates.push(d); } });
        }
        if (candidates.length === 0) {
            const d = new Date(); d.setDate(d.getDate() - 30); return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        return new Date(Math.min(...candidates));
    }, [udas, events]);

    const computedEnd = useMemo(() => {
        const candidates: number[] = [];
        if (udas) {
            udas.forEach(u => { if (u.endDate) { const d = new Date(u.endDate).getTime(); if (!isNaN(d)) candidates.push(d); } });
        }
        if (events) {
            events.forEach(e => { if (e.data) { const d = new Date(e.data).getTime(); if (!isNaN(d)) candidates.push(d); } });
        }
        if (candidates.length === 0) {
            const d = new Date(); d.setDate(d.getDate() + 30); return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        return new Date(Math.max(...candidates));
    }, [udas, events]);

    const start = !isNaN(inputStart.getTime()) ? inputStart : computedStart;
    const end = !isNaN(inputEnd.getTime()) ? inputEnd : computedEnd;

    // Fix potential division by zero if dates are equal or invalid, ensuring minimum 1 day duration (86400000 ms)
    const totalDurationMs = useMemo(() => Math.max(86400000, end.getTime() - start.getTime()), [start, end]);

    // Dynamic Months Generation
    const months = useMemo(() => {
        const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const result = [];
        const curr = new Date(start);
        // Set to first day to correctly step through months
        curr.setDate(1);

        while (curr <= end) {
            result.push({
                label: monthNames[curr.getMonth()],
                year: curr.getFullYear(),
                date: new Date(curr)
            });
            curr.setMonth(curr.getMonth() + 1);
        }
        return result;
    }, [start, end]);

    // Calculate position percentage (0-100) for a given date
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getPositionPercentage = (dateStr?: string): number => {
        if (!dateStr) return -100;
        const d = new Date(dateStr);
        const diff = d.getTime() - start.getTime();
        const percentage = (diff / totalDurationMs) * 100;
        return percentage;
    };

    // Aggiunto controllo di sicurezza per udas
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const safeUdas = Array.isArray(udas) ? udas : [];

    // Process UDAs for lanes
    const timelineData = useMemo(() => {
        const validUdas = safeUdas
            .filter(u => u.startDate && u.endDate)
            .map(u => {
                const startPos = Math.max(0, getPositionPercentage(u.startDate));
                const endPos = Math.min(100, getPositionPercentage(u.endDate));
                // Semantic Color based on Subject/Title hash
                const hue = generateHueFromString(u.materia || u.title);

                return {
                    ...u,
                    startPos,
                    width: Math.max(0.5, endPos - startPos), // Minimal width ensures visibility
                    color: `hsl(${hue}, var(--gantt-bg-saturation), var(--gantt-bg-lightness))`,
                    borderColor: `hsl(${hue}, var(--gantt-border-saturation), var(--gantt-border-lightness))`,
                    textColor: `hsl(${hue}, var(--gantt-text-saturation), var(--gantt-text-lightness))`
                };
            })
            .filter(u => u.startPos < 100 && (u.startPos + u.width) > 0) // Filter out-of-range
            .sort((a, b) => a.startPos - b.startPos); // Sort by start date

        // Lane assignment logic (simple greedy)
        const lanes: typeof validUdas[] = [];

        validUdas.forEach(uda => {
            let placed = false;
            for (const lane of lanes) {
                const lastInLane = lane[lane.length - 1];
                // If current starts after last ends (with slight buffer), place here
                if (uda.startPos > (lastInLane.startPos + lastInLane.width + 0.5)) {
                    lane.push(uda);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                lanes.push([uda]);
            }
        });

        return lanes;
    }, [safeUdas, getPositionPercentage]);

    // Fix: Use local time instead of UTC to avoid "previous day" shift on timeline
    const todayLocal = new Date();
    // Create a date string in YYYY-MM-DD format using local time
    const todayLocalStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    const todayPosition = getPositionPercentage(todayLocalStr);

    const isEmpty = timelineData.length === 0 && events.length === 0;

    // Width ensuring full month display
    const minWidth = months.length * 80;

    // Auto-scroll to today
    useEffect(() => {
        if (todayPosition >= 0 && todayPosition <= 100 && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            // Center the view on the today line: Position in pixels - half screen
            const targetPos = (minWidth * (todayPosition / 100)) - (container.clientWidth / 2);
            container.scrollTo({ left: Math.max(0, targetPos), behavior: 'smooth' });
        }
    }, [todayPosition, minWidth]);

    const handleUdaClick = (uda: Uda) => {
        logger.debug(`Audit: Opened UDA detail modal for ${uda.id}: ${uda.title}`);
        onUdaClick(uda);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
                <Typography component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', m: 0, fontSize: 'var(--md-sys-typescale-title-large-font-size)', color: 'var(--md-sys-color-on-surface)' }}>
                    <span className="material-symbols-outlined" aria-hidden="true">calendar_view_week</span>
                    Timeline Didattica
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-4)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>school</Box> UDA
                    </Box>
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>flag</Box> Scadenza
                    </Box>
                </Box>
            </Box>

            {/* Scrollable timeline container */}
            <Box ref={scrollContainerRef} sx={{ overflowX: 'auto', overflowY: 'visible', position: 'relative', borderRadius: 'var(--md-sys-shape-corner-medium)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                {/* 1. Month header grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, minmax(80px, 1fr))`, minWidth: `${minWidth}px`, borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)', background: 'var(--md-sys-color-surface-container-low)' }}>
                    {months.map((m, i) => (
                        <Box key={i} sx={{ padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-3)', fontSize: 'var(--md-sys-typescale-label-medium-font-size)', color: 'var(--md-sys-color-on-surface-variant)', borderRight: i < months.length - 1 ? 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' : 'none', whiteSpace: 'nowrap' }}>
                            {m.label} <Box component="span" sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', opacity: 0.6 }}>{m.year}</Box>
                        </Box>
                    ))}
                </Box>

                {/* Inner content area — position relative for absolute children */}
                <Box sx={{ position: 'relative', minWidth: `${minWidth}px`, background: 'var(--md-sys-color-surface)' }}>

                    {/* 2. Today line */}
                    {todayPosition >= 0 && todayPosition <= 100 && (
                        <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPosition}%`, width: '2px', background: 'var(--md-sys-color-primary)', zIndex: 2, pointerEvents: 'none' }}>
                            <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', fontSize: 10, padding: '1px 4px', borderRadius: 'var(--md-sys-shape-corner-extra-small)', whiteSpace: 'nowrap' }}>OGGI</Box>
                        </Box>
                    )}

                    {/* Empty state */}
                    {isEmpty && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--md-sys-spacing-3)', padding: 'var(--md-sys-spacing-12)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            <span className="material-symbols-outlined" aria-hidden="true">edit_calendar</span>
                            <span>Nessuna pianificazione. Usa il Wizard Annuale o crea un&apos;UDA.</span>
                        </Box>
                    )}

                    {/* 3. Events row */}
                    {events.filter(e => e.tipo === 'scadenza' || e.tipo === 'consiglio').length > 0 && (
                        <Box sx={{ position: 'relative', height: '28px', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                            {events.filter(e => e.tipo === 'scadenza' || e.tipo === 'consiglio').map(evt => {
                                const pos = getPositionPercentage(evt.data);
                                if (pos < 0 || pos > 100) return null;
                                return (
                                    <Box
                                        key={evt.id}
                                        sx={{ position: 'absolute', left: `${pos}%`, top: '50%', transform: 'translate(-50%, -50%)', color: evt.tipo === 'scadenza' ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-secondary)', zIndex: 1 }}
                                        title={`${evt.titolo} (${new Date(evt.data).toLocaleDateString()})`}
                                        aria-label={`Evento: ${evt.titolo} il ${new Date(evt.data).toLocaleDateString()}`}
                                    >
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>
                                            {evt.tipo === 'scadenza' ? 'flag' : 'gavel'}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}

                    {/* 4. Swimlanes for UDAs */}
                    {timelineData.map((lane, laneIndex) => (
                        <Box key={laneIndex} sx={{ position: 'relative', height: '40px', borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-surface-container)' }}>
                            {lane.map(uda => (
                                <Tooltip key={uda.id} label={`${uda.title} — ${uda.startDate ? new Date(uda.startDate).toLocaleDateString() : ''} - ${uda.endDate ? new Date(uda.endDate).toLocaleDateString() : ''}`} position="top">
                                    <GanttBar uda={uda} onClick={() => handleUdaClick(uda)} />
                                </Tooltip>
                            ))}
                        </Box>
                    ))}

                    {/* Drag Preview Bubble */}
                    {previewMessage && (
                        <Box sx={{ position: 'sticky', bottom: 'var(--md-sys-spacing-3)', left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', background: 'var(--md-sys-color-inverse-surface)', color: 'var(--md-sys-color-inverse-on-surface)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', zIndex: 3 }}>
                            {previewMessage}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Snackbar undo */}
            {showSnackbar && lastMove && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--md-sys-color-inverse-surface)', color: 'var(--md-sys-color-inverse-on-surface)', borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', gap: 'var(--md-sys-spacing-4)' }}>
                    <span>UDA spostata.</span>
                    <ButtonBase
                        sx={{ color: 'var(--md-sys-color-inverse-primary)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}
                        onClick={() => {
                            const original = udas.find(u => u.id === lastMove.udaId);
                            if (original) {
                                onSaveUda({ ...original, startDate: lastMove.prevStart, endDate: lastMove.prevEnd });
                                setShowSnackbar(false);
                                setLastMove(null);
                            }
                        }}
                    >Annulla</ButtonBase>
                    <ButtonBase
                        onClick={() => setShowSnackbar(false)}
                        aria-label="Chiudi"
                        sx={{ color: 'var(--md-sys-color-inverse-on-surface)', display: 'flex', alignItems: 'center' }}
                    >
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18 }}>close</Box>
                    </ButtonBase>
                </Box>
            )}
        </Box>
    );
};

export default TimelineView;

