// MD3 GOLD COMPLIANT — ClassCompetencyDashboard: riprogettato + analytics + charts

import React, { useMemo, useState, useEffect } from 'react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';
import { Studente, ValutazioneCompetenza, TimetableSettings, Competenza, Livello, View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';
import { M3Dialog, M3Surface, Avatar, PageWrapper } from './ui';
import { useSystemStore } from '../stores/useSystemStore';
import ButtonBase from '@mui/material/ButtonBase';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface ClassCompetencyDashboardProps {
    selectedClass: string;
    students: Studente[];
    competencyEvaluations: ValutazioneCompetenza[];
    settings: TimetableSettings;
    onViewStudentProfile: (student: Studente) => void;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

interface CompetencySummary {
    competency: Competenza;
    levelCounts: { level: Livello; count: number; students: Studente[] }[];
    totalEvaluated: number;
}

// ── Colori semantici per livello ─────────────────────────────────────────────
function getLevelColor(levelName: string): string {
    const lower = levelName.toLowerCase();
    if (lower.includes('avanzato') || lower.startsWith('a')) return 'var(--md-sys-color-tertiary)';
    if (lower.includes('intermedio') || lower.startsWith('b')) return 'var(--md-sys-color-secondary)';
    if (lower.includes('base') || lower.startsWith('c')) return 'var(--md-sys-color-primary)';
    if (lower.includes('iniziale') || lower.startsWith('d')) return 'var(--md-sys-color-error)';
    return 'var(--md-sys-color-outline)';
}

function getLevelContainerColor(levelName: string): string {
    const lower = levelName.toLowerCase();
    if (lower.includes('avanzato') || lower.startsWith('a')) return 'var(--md-sys-color-tertiary-container)';
    if (lower.includes('intermedio') || lower.startsWith('b')) return 'var(--md-sys-color-secondary-container)';
    if (lower.includes('base') || lower.startsWith('c')) return 'var(--md-sys-color-primary-container)';
    if (lower.includes('iniziale') || lower.startsWith('d')) return 'var(--md-sys-color-error-container)';
    return 'var(--md-sys-color-surface-container)';
}

function getLevelOnContainerColor(levelName: string): string {
    const lower = levelName.toLowerCase();
    if (lower.includes('avanzato') || lower.startsWith('a')) return 'var(--md-sys-color-on-tertiary-container)';
    if (lower.includes('intermedio') || lower.startsWith('b')) return 'var(--md-sys-color-on-secondary-container)';
    if (lower.includes('base') || lower.startsWith('c')) return 'var(--md-sys-color-on-primary-container)';
    if (lower.includes('iniziale') || lower.startsWith('d')) return 'var(--md-sys-color-on-error-container)';
    return 'var(--md-sys-color-on-surface-variant)';
}

// ── Singola card competenza (con espansione controllata) ──────────────────────
type DashTab = 'overview' | 'radar' | 'trend' | 'ai';

interface AtRiskStudent {
    student: Studente;
    weakCompetencies: { name: string; levelName: string }[];
    excellentCount: number;
}

interface CompetencyCardProps {
    summary: CompetencySummary;
    totalStudents: number;
    onLevelClick: (lc: CompetencySummary['levelCounts'][0], competencyName: string) => void;
}

const CompetencyCard: React.FC<CompetencyCardProps> = ({ summary, totalStudents, onLevelClick }) => {
    const [expanded, setExpanded] = useState(false);
    const notEvaluated = totalStudents - summary.totalEvaluated;
    const pctEvaluated = totalStudents > 0 ? Math.round((summary.totalEvaluated / totalStudents) * 100) : 0;

    return (
        <M3Surface elevation={1} sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', overflow: 'hidden' }}>
            {/* ── Header sempre visibile ── */}
            <ButtonBase
                onClick={() => setExpanded(v => !v)}
                focusRipple
                aria-expanded={expanded}
                aria-label={`${expanded ? 'Chiudi' : 'Espandi'} ${summary.competency.nome}`}
                sx={{
                    width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                    px: 'var(--md-sys-spacing-4)', pt: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-3)',
                    gap: 'var(--md-sys-spacing-3)',
                    textAlign: 'left',
                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                    '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: -2 },
                }}
            >
                {/* riga 1: badge codice + contatore + chevron */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                    <Box sx={{
                        px: 'var(--md-sys-spacing-2)', py: '2px',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        bgcolor: 'var(--md-sys-color-primary)',
                        flexShrink: 0,
                    }}>
                        <Typography variant="labelSmall" sx={{
                            color: 'var(--md-sys-color-on-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-bold)',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                        }}>
                            {summary.competency.codice}
                        </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}>
                        {summary.totalEvaluated}/{totalStudents} valutati
                    </Typography>

                    {summary.totalEvaluated > 0 && (
                        <Typography variant="labelSmall" sx={{
                            color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                            ml: 'auto',
                            flexShrink: 0,
                        }}>
                            {pctEvaluated}%
                        </Typography>
                    )}

                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{
                        fontSize: 20,
                        color: 'var(--md-sys-color-on-surface-variant)',
                        ml: summary.totalEvaluated > 0 ? 0 : 'auto',
                        flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                        expand_more
                    </Box>
                </Box>

                {/* riga 2: nome competenza */}
                <Typography variant="titleMedium" sx={{
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                    lineHeight: 1.4,
                }}>
                    {summary.competency.nome}
                </Typography>

                {/* riga 3: barra di progresso composita */}
                <Box sx={{
                    height: 6, borderRadius: 'var(--md-sys-shape-corner-full)',
                    bgcolor: 'var(--md-sys-color-surface-container-high)',
                    overflow: 'hidden', display: 'flex',
                }}>
                    {summary.levelCounts.map(lc => {
                        if (lc.count === 0 || totalStudents === 0) return null;
                        return (
                            <Box key={lc.level.id} sx={{
                                height: '100%',
                                width: `${(lc.count / totalStudents) * 100}%`,
                                bgcolor: getLevelColor(lc.level.nome),
                                flexShrink: 0,
                            }} />
                        );
                    })}
                    {notEvaluated > 0 && totalStudents > 0 && (
                        <Box sx={{
                            height: '100%',
                            width: `${(notEvaluated / totalStudents) * 100}%`,
                            bgcolor: 'var(--md-sys-color-surface-container-high)',
                        }} />
                    )}
                </Box>

                {/* riga 4: legenda livelli (sempre visibile) */}
                {summary.totalEvaluated > 0 && (
                    <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap' }}>
                        {summary.levelCounts.filter(lc => lc.count > 0).map(lc => (
                            <Box key={lc.level.id} sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Box sx={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    bgcolor: getLevelColor(lc.level.nome), flexShrink: 0,
                                }} />
                                <Typography variant="labelSmall" sx={{
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                }}>
                                    {lc.level.nome} ({lc.count})
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </ButtonBase>

            {/* ── Espansione: cards per livello ── */}
            {expanded && (
                <Box sx={{
                    px: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-4)',
                    pt: 'var(--md-sys-spacing-2)',
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: 'var(--md-sys-spacing-2)',
                    borderTop: '1px solid var(--md-sys-color-outline-variant)',
                }}>
                    {summary.levelCounts.map(lc => {
                        const containerColor = getLevelContainerColor(lc.level.nome);
                        const onContainerColor = getLevelOnContainerColor(lc.level.nome);
                        const isClickable = lc.count > 0;
                        return (
                            <ButtonBase
                                key={lc.level.id}
                                onClick={isClickable ? () => onLevelClick(lc, summary.competency.nome) : undefined}
                                focusRipple={isClickable}
                                disabled={!isClickable}
                                aria-label={`${lc.level.nome}: ${lc.count} studenti`}
                                sx={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    p: 'var(--md-sys-spacing-3)',
                                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                                    bgcolor: containerColor,
                                    opacity: isClickable ? 1 : 0.5,
                                    cursor: isClickable ? 'pointer' : 'default',
                                    textAlign: 'left',
                                    gap: 'var(--md-sys-spacing-1)',
                                    '&:hover': isClickable ? { filter: 'brightness(0.92)' } : {},
                                    '&:focus-visible': { outline: `2px solid ${getLevelColor(lc.level.nome)}`, outlineOffset: 2 },
                                }}
                            >
                                {/* numero grande */}
                                <Typography variant="h4" sx={{
                                    color: onContainerColor,
                                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                    lineHeight: 1,
                                }}>
                                    {lc.count}
                                </Typography>
                                {/* nome livello */}
                                <Typography variant="labelSmall" sx={{
                                    color: onContainerColor,
                                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                    opacity: 0.85,
                                }}>
                                    {lc.level.nome}
                                </Typography>
                                {/* descrizione */}
                                {lc.level.descrizione && (
                                    <Typography variant="bodySmall" sx={{
                                        color: onContainerColor,
                                        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                        lineHeight: 1.3,
                                        opacity: 0.75,
                                        mt: '2px',
                                    }}>
                                        {lc.level.descrizione}
                                    </Typography>
                                )}
                                {/* link studenti */}
                                {lc.count > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mt: 'auto', pt: 'var(--md-sys-spacing-2)' }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                            sx={{ fontSize: 12, color: onContainerColor, opacity: 0.75 }}>
                                            group
                                        </Box>
                                        <Typography variant="labelSmall" sx={{
                                            color: onContainerColor, fontSize: 'var(--md-sys-typescale-label-small-font-size)', opacity: 0.75,
                                        }}>
                                            Vedi studenti
                                        </Typography>
                                    </Box>
                                )}
                            </ButtonBase>
                        );
                    })}
                </Box>
            )}
        </M3Surface>
    );
};

// ── Radar Section ─────────────────────────────────────────────────────────────
interface RadarSectionProps {
    summaries: CompetencySummary[];
    totalStudents: number;
}

const RadarSection: React.FC<RadarSectionProps> = ({ summaries, totalStudents }) => {
    const radarData = useMemo(() => {
        if (totalStudents === 0) return [];
        return summaries
            .filter(s => s.totalEvaluated > 0)
            .map(s => {
                // score = weighted avg score where A=100, B=75, C=50, D=25
                const levels = [...s.competency.livelli].sort((a, b) =>
                    parseInt(b.punteggio || '0', 10) - parseInt(a.punteggio || '0', 10)
                );
                const maxScore = levels.length > 0 ? parseInt(levels[0].punteggio || '100', 10) : 100;
                const weightedSum = s.levelCounts.reduce((acc, lc) => {
                    const score = parseInt(lc.level.punteggio || '0', 10);
                    return acc + score * lc.count;
                }, 0);
                const value = maxScore > 0
                    ? Math.round((weightedSum / (totalStudents * maxScore)) * 100)
                    : 0;
                return { competency: s.competency.codice, fullName: s.competency.nome, value };
            });
    }, [summaries, totalStudents]);

    if (radarData.length === 0) {
        return (
            <M3Surface elevation={0} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-8)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--md-sys-spacing-3)', textAlign: 'center',
                bgcolor: 'var(--md-sys-color-surface-container)',
            }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: 48, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5 }}>
                    radar
                </Box>
                <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Nessuna valutazione disponibile
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 300 }}>
                    Valuta gli studenti sulle competenze per visualizzare il radar.
                </Typography>
            </M3Surface>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <M3Surface elevation={1} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-4)',
            }}>
                <Typography variant="titleSmall" sx={{
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                    mb: 'var(--md-sys-spacing-3)',
                }}>
                    Profilo competenze classe
                </Typography>
                <Typography variant="bodySmall" sx={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    mb: 'var(--md-sys-spacing-4)',
                }}>
                    Punteggio medio ponderato per competenza (0–100)
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
                        <PolarGrid stroke="var(--md-sys-color-outline-variant)" />
                        <PolarAngleAxis
                            dataKey="competency"
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 10 }}
                            tickCount={5}
                        />
                        <Radar
                            name="Classe"
                            dataKey="value"
                            stroke="var(--md-sys-color-primary)"
                            fill="var(--md-sys-color-primary)"
                            fillOpacity={0.25}
                            strokeWidth={2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </M3Surface>

            {/* Legenda competenze */}
            <M3Surface elevation={0} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-4)',
                bgcolor: 'var(--md-sys-color-surface-container)',
            }}>
                <Typography variant="labelSmall" sx={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                    mb: 'var(--md-sys-spacing-3)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                    Legenda
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
                    {radarData.map(d => (
                        <Box key={d.competency} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                            <Box sx={{
                                px: 'var(--md-sys-spacing-2)', py: '2px',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                bgcolor: 'var(--md-sys-color-primary)',
                                minWidth: 36, textAlign: 'center', flexShrink: 0,
                            }}>
                                <Typography variant="labelSmall" sx={{
                                    color: 'var(--md-sys-color-on-primary)',
                                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                }}>
                                    {d.competency}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', flex: 1 }}>
                                {d.fullName}
                            </Typography>
                            <Typography variant="labelSmall" sx={{
                                color: d.value >= 70
                                    ? 'var(--md-sys-color-tertiary)'
                                    : d.value >= 45
                                    ? 'var(--md-sys-color-secondary)'
                                    : 'var(--md-sys-color-error)',
                                fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                                flexShrink: 0,
                            }}>
                                {d.value}%
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </M3Surface>
        </Box>
    );
};

// ── Trend Section ──────────────────────────────────────────────────────────────
interface TrendSectionProps {
    competencySummaries: CompetencySummary[];
    competencyEvaluations: ValutazioneCompetenza[];
    classStudentIds: Set<string>;
    settings: TimetableSettings;
}

const MONTH_LABELS: Record<number, string> = {
    0: 'Gen', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'Mag', 5: 'Giu',
    6: 'Lug', 7: 'Ago', 8: 'Set', 9: 'Ott', 10: 'Nov', 11: 'Dic',
};

const TrendSection: React.FC<TrendSectionProps> = ({
    competencyEvaluations,
    classStudentIds,
    settings,
}) => {
    const trendData = useMemo(() => {
        // Build a lookup: competenzaId → livello id → punteggio
        const levelScoreMap: Record<string, number> = {};
        const levelMaxMap: Record<string, number> = {};
        settings.competenze.forEach(comp => {
            const sorted = [...comp.livelli].sort((a, b) =>
                parseInt(b.punteggio || '0', 10) - parseInt(a.punteggio || '0', 10)
            );
            const max = sorted.length > 0 ? parseInt(sorted[0].punteggio || '100', 10) : 100;
            comp.livelli.forEach(lvl => {
                levelScoreMap[lvl.id] = parseInt(lvl.punteggio || '0', 10);
                levelMaxMap[lvl.id] = max;
            });
        });

        // Filter evals for this class, group by YYYY-MM
        const byMonth: Record<string, { sum: number; max: number; count: number }> = {};
        competencyEvaluations.forEach(ev => {
            if (!classStudentIds.has(ev.studenteId)) return;
            const d = new Date(ev.data);
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { sum: 0, max: 0, count: 0 };
            const score = levelScoreMap[ev.livelloId] ?? 0;
            const maxScore = levelMaxMap[ev.livelloId] ?? 100;
            byMonth[key].sum += score;
            byMonth[key].max += maxScore;
            byMonth[key].count += 1;
        });

        return Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, { sum, max, count }]) => {
                const [year, month] = key.split('-');
                const label = `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year.slice(2)}`;
                return {
                    month: label,
                    score: max > 0 ? Math.round((sum / max) * 100) : 0,
                    valutazioni: count,
                };
            });
    }, [competencyEvaluations, classStudentIds, settings.competenze]);

    if (trendData.length === 0) {
        return (
            <M3Surface elevation={0} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-8)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--md-sys-spacing-3)', textAlign: 'center',
                bgcolor: 'var(--md-sys-color-surface-container)',
            }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: 48, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5 }}>
                    trending_up
                </Box>
                <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Nessun dato di trend
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 300 }}>
                    I trend richiederanno valutazioni in più mesi distinti.
                </Typography>
            </M3Surface>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <M3Surface elevation={1} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-4)',
            }}>
                <Typography variant="titleSmall" sx={{
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                    mb: 'var(--md-sys-spacing-1)',
                }}>
                    Andamento nel tempo
                </Typography>
                <Typography variant="bodySmall" sx={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    mb: 'var(--md-sys-spacing-4)',
                }}>
                    Punteggio medio mensile delle valutazioni per competenza
                </Typography>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                        <defs>
                            <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--md-sys-color-primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--md-sys-color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                        />
                        <RechartsTooltip
                            contentStyle={{
                                background: 'var(--md-sys-color-surface-container-high)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                borderRadius: 8,
                                color: 'var(--md-sys-color-on-surface)',
                                fontSize: 12,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="var(--md-sys-color-primary)"
                            strokeWidth={2}
                            fill="url(#gradScore)"
                            name="Punteggio medio (%)"
                            dot={{ fill: 'var(--md-sys-color-primary)', r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </M3Surface>

            <M3Surface elevation={1} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-4)',
            }}>
                <Typography variant="titleSmall" sx={{
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                    mb: 'var(--md-sys-spacing-1)',
                }}>
                    Volume valutazioni
                </Typography>
                <Typography variant="bodySmall" sx={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    mb: 'var(--md-sys-spacing-4)',
                }}>
                    Numero di valutazioni per competenza registrate per mese
                </Typography>
                <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={trendData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                        <defs>
                            <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--md-sys-color-secondary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--md-sys-color-secondary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
                            axisLine={false} tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }}
                            axisLine={false} tickLine={false}
                        />
                        <RechartsTooltip
                            contentStyle={{
                                background: 'var(--md-sys-color-surface-container-high)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                borderRadius: 8,
                                color: 'var(--md-sys-color-on-surface)',
                                fontSize: 12,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="valutazioni"
                            stroke="var(--md-sys-color-secondary)"
                            strokeWidth={2}
                            fill="url(#gradCount)"
                            name="Valutazioni"
                            dot={{ fill: 'var(--md-sys-color-secondary)', r: 3 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </M3Surface>
        </Box>
    );
};

// ── AI Section ────────────────────────────────────────────────────────────────
interface AISectionProps {
    summaries: CompetencySummary[];
    classStudents: Studente[];
    competencyEvaluations: ValutazioneCompetenza[];
    onViewStudentProfile: (student: Studente) => void;
}

const INTERVENTIONS: Record<string, string[]> = {
    low: [
        'Attività di recupero individuale con materiale differenziato',
        'Tutoraggio tra pari per consolidare i prerequisiti',
        'Piano di lavoro personalizzato con obiettivi graduali',
    ],
    medium: [
        'Esercitazioni mirate con feedback immediato',
        'Revisione degli obiettivi di competenza in itinere',
        'Coinvolgimento in attività collaborative e laboratoriali',
    ],
    high: [
        'Compiti di realtà sfidanti e approfondimento autonomo',
        'Ruolo di tutor per i compagni in difficoltà',
        'Proposte di arricchimento e ricerca personale',
    ],
};

const AISection: React.FC<AISectionProps> = ({
    summaries,
    classStudents,
    competencyEvaluations,
    onViewStudentProfile,
}) => {
    const atRiskStudents = useMemo<AtRiskStudent[]>(() => {
        const levelRankMap: Record<string, number> = {};
        summaries.forEach(s => {
            const sorted = [...s.competency.livelli].sort((a, b) =>
                parseInt(b.punteggio || '0', 10) - parseInt(a.punteggio || '0', 10)
            );
            sorted.forEach((lvl, idx) => { levelRankMap[lvl.id] = idx; }); // 0=best
        });

        return classStudents
            .map(student => {
                const weak: { name: string; levelName: string }[] = [];
                let excellentCount = 0;

                summaries.forEach(s => {
                    const latest = competencyEvaluations
                        .filter(e => e.studenteId === student.id && e.competenzaId === s.competency.id)
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

                    if (!latest) return;
                    const rank = levelRankMap[latest.livelloId] ?? 99;
                    const levelName = s.competency.livelli.find(l => l.id === latest.livelloId)?.nome ?? '?';
                    const totalLevels = s.competency.livelli.length;
                    if (rank >= totalLevels - 1) {
                        // At the lowest level
                        weak.push({ name: s.competency.nome, levelName });
                    } else if (rank === 0) {
                        excellentCount++;
                    }
                });

                return { student, weakCompetencies: weak, excellentCount };
            })
            .filter(r => r.weakCompetencies.length > 0)
            .sort((a, b) => b.weakCompetencies.length - a.weakCompetencies.length);
    }, [summaries, classStudents, competencyEvaluations]);

    const excellentStudents = useMemo(() => {
        return classStudents.filter(student => {
            const evaluated = summaries.filter(s =>
                competencyEvaluations.some(e => e.studenteId === student.id && e.competenzaId === s.competency.id)
            );
            if (evaluated.length === 0) return false;
            return evaluated.every(s => {
                const latest = competencyEvaluations
                    .filter(e => e.studenteId === student.id && e.competenzaId === s.competency.id)
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                if (!latest) return false;
                const sorted = [...s.competency.livelli].sort((a, b) =>
                    parseInt(b.punteggio || '0', 10) - parseInt(a.punteggio || '0', 10)
                );
                return sorted.length > 0 && sorted[0].id === latest.livelloId;
            });
        });
    }, [classStudents, summaries, competencyEvaluations]);

    if (atRiskStudents.length === 0 && excellentStudents.length === 0) {
        return (
            <M3Surface elevation={0} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-8)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 'var(--md-sys-spacing-3)', textAlign: 'center',
                bgcolor: 'var(--md-sys-color-surface-container)',
            }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: 48, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5 }}>
                    smart_toy
                </Box>
                <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Nessun suggerimento disponibile
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 300 }}>
                    Completa le valutazioni per ottenere suggerimenti di intervento personalizzati.
                </Typography>
            </M3Surface>
        );
    }

    const getInterventions = (count: number) => {
        if (count >= 3) return INTERVENTIONS.low;
        if (count === 2) return INTERVENTIONS.medium.slice(0, 2);
        return [INTERVENTIONS.low[0]];
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {/* Banner info */}
            <M3Surface elevation={0} sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                p: 'var(--md-sys-spacing-4)',
                bgcolor: 'var(--md-sys-color-secondary-container)',
                display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-3)',
            }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                    sx={{ fontSize: 20, color: 'var(--md-sys-color-on-secondary-container)', flexShrink: 0, mt: '1px' }}>
                    info
                </Box>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                    I suggerimenti sono generati automaticamente dai dati di valutazione. Non sostituiscono la valutazione professionale del docente.
                </Typography>
            </M3Surface>

            {/* At-risk students */}
            {atRiskStudents.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                            sx={{ fontSize: 18, color: 'var(--md-sys-color-error)' }}>
                            warning
                        </Box>
                        <Typography variant="titleSmall" sx={{
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                        }}>
                            Studenti che necessitano supporto ({atRiskStudents.length})
                        </Typography>
                    </Box>
                    {atRiskStudents.map(({ student, weakCompetencies }) => (
                        <M3Surface key={student.id} elevation={1} sx={{
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            overflow: 'hidden',
                        }}>
                            <ButtonBase
                                onClick={() => onViewStudentProfile(student)}
                                focusRipple
                                aria-label={`Apri profilo ${student.nome} ${student.cognome}`}
                                sx={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)',
                                    textAlign: 'left',
                                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                                    '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: -2 },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', flex: 1 }}>
                                    <Avatar name={`${student.nome} ${student.cognome}`} size="md" />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{
                                            color: 'var(--md-sys-color-on-surface)',
                                            fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                        }}>
                                            {student.cognome} {student.nome}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', mt: '4px' }}>
                                            {weakCompetencies.map((wc, i) => (
                                                <Box key={i} sx={{
                                                    px: '6px', py: '2px',
                                                    borderRadius: 'var(--md-sys-shape-corner-small)',
                                                    bgcolor: 'var(--md-sys-color-error-container)',
                                                }}>
                                                    <Typography variant="labelSmall" sx={{
                                                        color: 'var(--md-sys-color-on-error-container)',
                                                        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                                    }}>
                                                        {wc.levelName}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                    sx={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0, ml: 'var(--md-sys-spacing-2)' }}>
                                    arrow_forward
                                </Box>
                            </ButtonBase>
                            {/* Interventions */}
                            <Box sx={{
                                px: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-3)',
                                borderTop: '1px solid var(--md-sys-color-outline-variant)',
                                pt: 'var(--md-sys-spacing-2)',
                                bgcolor: 'var(--md-sys-color-surface-container)',
                            }}>
                                <Typography variant="labelSmall" sx={{
                                    color: 'var(--md-sys-color-on-surface-variant)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                                    mb: 'var(--md-sys-spacing-2)',
                                    display: 'block',
                                }}>
                                    Interventi suggeriti
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {getInterventions(weakCompetencies.length).map((intvn, i) => (
                                        <Box key={i} sx={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                                sx={{ fontSize: 14, color: 'var(--md-sys-color-primary)', mt: '1px', flexShrink: 0 }}>
                                                check_circle
                                            </Box>
                                            <Typography variant="bodySmall" sx={{
                                                color: 'var(--md-sys-color-on-surface-variant)',
                                                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                                lineHeight: 1.4,
                                            }}>
                                                {intvn}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </M3Surface>
                    ))}
                </Box>
            )}

            {/* Excellent students */}
            {excellentStudents.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                            sx={{ fontSize: 18, color: 'var(--md-sys-color-tertiary)' }}>
                            star
                        </Box>
                        <Typography variant="titleSmall" sx={{
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                        }}>
                            Studenti in eccellenza ({excellentStudents.length})
                        </Typography>
                    </Box>
                    <M3Surface elevation={0} sx={{
                        borderRadius: 'var(--md-sys-shape-corner-large)',
                        p: 'var(--md-sys-spacing-3)',
                        bgcolor: 'var(--md-sys-color-tertiary-container)',
                    }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
                            {excellentStudents.map(s => (
                                <ButtonBase
                                    key={s.id}
                                    onClick={() => onViewStudentProfile(s)}
                                    focusRipple
                                    aria-label={`Apri profilo ${s.nome} ${s.cognome}`}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        px: 'var(--md-sys-spacing-2)', py: '6px',
                                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                                        bgcolor: 'var(--md-sys-color-tertiary)',
                                        '&:hover': { filter: 'brightness(0.9)' },
                                        '&:focus-visible': { outline: '2px solid var(--md-sys-color-on-tertiary-container)', outlineOffset: 2 },
                                    }}
                                >
                                    <Typography variant="labelSmall" sx={{
                                        color: 'var(--md-sys-color-on-tertiary)',
                                        fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                                        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                    }}>
                                        {s.cognome} {s.nome}
                                    </Typography>
                                </ButtonBase>
                            ))}
                        </Box>
                        <Typography variant="bodySmall" sx={{
                            color: 'var(--md-sys-color-on-tertiary-container)',
                            mt: 'var(--md-sys-spacing-3)',
                            fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                        }}>
                            {INTERVENTIONS.high[0]}
                        </Typography>
                    </M3Surface>
                </Box>
            )}
        </Box>
    );
};

// ── Componente principale ─────────────────────────────────────────────────────
const ClassCompetencyDashboard: React.FC<ClassCompetencyDashboardProps> = ({
    selectedClass,
    students,
    competencyEvaluations,
    settings,
    onViewStudentProfile,
    onNavigate,
}) => {
    const [viewingStudents, setViewingStudents] = useState<{
        title: string;
        students: Studente[];
        levelColor: string;
    } | null>(null);
    const [sortBy, setSortBy] = useState<'competency' | 'performance'>('competency');
    const [activeTab, setActiveTab] = useState<DashTab>('overview');

    const trackAnalyticsEvent = useSystemStore(s => s.actions.trackAnalyticsEvent);

    useEffect(() => {
        trackAnalyticsEvent('feature_usage', 'competency_dashboard_viewed', { classId: selectedClass });
    }, [selectedClass, trackAnalyticsEvent]);

    const classStudents = useMemo(
        () => students.filter(s => s.classe === selectedClass),
        [students, selectedClass]
    );

    const classStudentIds = useMemo(
        () => new Set(classStudents.map(s => s.id)),
        [classStudents]
    );

    const competencySummaries: CompetencySummary[] = useMemo(() => {
        const summaries = settings.competenze.map(competency => {
            const levelMap: Record<string, { level: Livello; students: Studente[] }> = {};
            competency.livelli.forEach(level => {
                levelMap[level.id] = { level, students: [] };
            });

            classStudents.forEach(student => {
                const latestEval = competencyEvaluations
                    .filter(e => e.studenteId === student.id && e.competenzaId === competency.id)
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

                if (latestEval && levelMap[latestEval.livelloId]) {
                    levelMap[latestEval.livelloId].students.push(student);
                }
            });

            const levelCounts = competency.livelli.map(level => ({
                level,
                count: levelMap[level.id].students.length,
                students: levelMap[level.id].students.sort((a, b) => a.cognome.localeCompare(b.cognome)),
            }));

            const totalEvaluated = levelCounts.reduce((sum, lc) => sum + lc.count, 0);
            return { competency, levelCounts, totalEvaluated };
        });

        if (sortBy === 'performance') {
            summaries.sort((a, b) => {
                const score = (s: CompetencySummary) => {
                    if (s.totalEvaluated === 0) return 0;
                    return s.levelCounts.reduce((acc, lc) => {
                        return acc + (parseInt(lc.level.punteggio || '0', 10) * lc.count);
                    }, 0) / s.totalEvaluated;
                };
                return score(b) - score(a);
            });
        } else {
            summaries.sort((a, b) => a.competency.nome.localeCompare(b.competency.nome));
        }

        return summaries;
    }, [settings.competenze, classStudents, competencyEvaluations, sortBy]);

    const handleLevelClick = (lc: CompetencySummary['levelCounts'][0], competencyName: string) => {
        if (lc.count > 0) {
            setViewingStudents({
                title: `${competencyName} — ${lc.level.nome}`,
                students: lc.students,
                levelColor: getLevelColor(lc.level.nome),
            });
        }
    };

    // ── Statistiche globali ───────────────────────────────────────────────
    const totalEvals = competencySummaries.reduce((s, c) => s + c.totalEvaluated, 0);
    const totalPossible = competencySummaries.length * classStudents.length;
    const coveragePct = totalPossible > 0 ? Math.round((totalEvals / totalPossible) * 100) : 0;

    return (
        <>
            <PageWrapper
                maxWidth="var(--md-sys-layout-content-max-width)"
                gap="var(--md-sys-spacing-5)"
                sx={{
                    px: 'var(--md-sys-spacing-4)',
                    pt: 'var(--md-sys-spacing-4)',
                    pb: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                }}
            >
                {/* ── Intestazione ────────────────────────────────────────── */}
                <Box>
                    <Typography variant="h5" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                        Competenze
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: '2px' }}>
                        {selectedClass} · Analisi dei livelli raggiunti per area di competenza
                    </Typography>
                </Box>

                {/* Contextual AI (Fase 2) */}
                {onNavigate && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <ContextualAskAI
                      onNavigate={onNavigate}
                     
                      context={{ source: 'class-competency-dashboard', classe: selectedClass }}
                    />
                  </Box>
                )}

                {/* ── Riepilogo copertura ──────────────────────────────────── */}
                {competencySummaries.length > 0 && classStudents.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', flexWrap: 'wrap' }}>
                        <Box sx={{
                            px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            bgcolor: 'var(--md-sys-color-surface-container)',
                            minWidth: 80, textAlign: 'center',
                        }}>
                            <Typography variant="h6" sx={{ color: 'var(--md-sys-color-primary)', lineHeight: 1 }}>
                                {classStudents.length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                studenti
                            </Typography>
                        </Box>
                        <Box sx={{
                            px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            bgcolor: 'var(--md-sys-color-surface-container)',
                            minWidth: 80, textAlign: 'center',
                        }}>
                            <Typography variant="h6" sx={{ color: 'var(--md-sys-color-secondary)', lineHeight: 1 }}>
                                {competencySummaries.length}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                competenze
                            </Typography>
                        </Box>
                        <Box sx={{
                            px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-3)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            bgcolor: coveragePct >= 80
                                ? 'var(--md-sys-color-tertiary-container)'
                                : coveragePct >= 40
                                ? 'var(--md-sys-color-secondary-container)'
                                : 'var(--md-sys-color-surface-container)',
                            minWidth: 80, textAlign: 'center',
                        }}>
                            <Typography variant="h6" sx={{
                                color: coveragePct >= 80
                                    ? 'var(--md-sys-color-on-tertiary-container)'
                                    : coveragePct >= 40
                                    ? 'var(--md-sys-color-on-secondary-container)'
                                    : 'var(--md-sys-color-on-surface)',
                                lineHeight: 1,
                            }}>
                                {coveragePct}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                copertura
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* ── Tab bar ─────────────────────────────────────────────── */}
                <Box
                    role="tablist"
                    aria-label="Sezioni dashboard competenze"
                    sx={{
                        display: 'flex',
                        gap: 'var(--md-sys-spacing-2)',
                        flexWrap: 'wrap',
                        pb: 'var(--md-sys-spacing-1)',
                        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                    }}
                >
                    {([
                        { id: 'overview' as DashTab, icon: 'list', label: 'Matrici' },
                        { id: 'radar' as DashTab, icon: 'radar', label: 'Radar' },
                        { id: 'trend' as DashTab, icon: 'trending_up', label: 'Trend' },
                        { id: 'ai' as DashTab, icon: 'smart_toy', label: 'Interventi' },
                    ] as const).map(tab => (
                        <ButtonBase
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            focusRipple
                            aria-label={`Sezione ${tab.label}`}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                px: 'var(--md-sys-spacing-3)', py: 'var(--md-sys-spacing-2)',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                bgcolor: activeTab === tab.id
                                    ? 'var(--md-sys-color-secondary-container)'
                                    : 'transparent',
                                borderBottom: activeTab === tab.id
                                    ? '2px solid var(--md-sys-color-primary)'
                                    : '2px solid transparent',
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                                '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: 2 },
                            }}
                        >
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                sx={{
                                    fontSize: 18,
                                    color: activeTab === tab.id
                                        ? 'var(--md-sys-color-on-secondary-container)'
                                        : 'var(--md-sys-color-on-surface-variant)',
                                }}
                            >
                                {tab.icon}
                            </Box>
                            <Typography variant="labelSmall" sx={{
                                color: activeTab === tab.id
                                    ? 'var(--md-sys-color-on-secondary-container)'
                                    : 'var(--md-sys-color-on-surface-variant)',
                                fontWeight: activeTab === tab.id
                                    ? 'var(--md-sys-typescale-weight-semibold)'
                                    : 'var(--md-sys-typescale-weight-regular)',
                                fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                            }}>
                                {tab.label}
                            </Typography>
                        </ButtonBase>
                    ))}
                </Box>

                {/* ── Contenuto tab attivo ─────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <>
                        {/* Controlli ordinamento */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mr: 'var(--md-sys-spacing-1)' }}>
                                Ordina:
                            </Typography>
                            <Chip
                               
                                size="small"
                                onClick={() => setSortBy('competency')}
                                variant={sortBy === 'competency' ? 'filled' : 'outlined'}
                                sx={{
                                    bgcolor: sortBy === 'competency' ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                                    color: sortBy === 'competency'
                                        ? 'var(--md-sys-color-on-secondary-container)'
                                        : 'var(--md-sys-color-on-surface-variant)',
                                    borderColor: 'var(--md-sys-color-outline-variant)',
                                    fontWeight: sortBy === 'competency' ? 'var(--md-sys-typescale-weight-semibold)' : 'var(--md-sys-typescale-weight-regular)',
                                }}
                            />
                            <Chip
                               
                                size="small"
                                onClick={() => setSortBy('performance')}
                                variant={sortBy === 'performance' ? 'filled' : 'outlined'}
                                sx={{
                                    bgcolor: sortBy === 'performance' ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                                    color: sortBy === 'performance'
                                        ? 'var(--md-sys-color-on-secondary-container)'
                                        : 'var(--md-sys-color-on-surface-variant)',
                                    borderColor: 'var(--md-sys-color-outline-variant)',
                                    fontWeight: sortBy === 'performance' ? 'var(--md-sys-typescale-weight-semibold)' : 'var(--md-sys-typescale-weight-regular)',
                                }}
                            />
                        </Box>

                        {/* Lista competenze */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                            {competencySummaries.length > 0 ? (
                                competencySummaries.map(summary => (
                                    <CompetencyCard
                                        key={summary.competency.id}
                                        summary={summary}
                                        totalStudents={classStudents.length}
                                        onLevelClick={handleLevelClick}
                                    />
                                ))
                            ) : (
                                <M3Surface elevation={0} sx={{
                                    borderRadius: 'var(--md-sys-shape-corner-large)',
                                    p: 'var(--md-sys-spacing-8)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    gap: 'var(--md-sys-spacing-3)', textAlign: 'center',
                                    bgcolor: 'var(--md-sys-color-surface-container)',
                                }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                        sx={{ fontSize: 48, color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.5 }}>
                                        bar_chart
                                    </Box>
                                    <Typography variant="titleMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                                        Nessuna competenza configurata
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 320 }}>
                                        Aggiungi le competenze nelle Impostazioni per iniziare a valutare la classe.
                                    </Typography>
                                </M3Surface>
                            )}
                        </Box>
                    </>
                )}

                {activeTab === 'radar' && (
                    <RadarSection
                        summaries={competencySummaries}
                        totalStudents={classStudents.length}
                    />
                )}

                {activeTab === 'trend' && (
                    <TrendSection
                        competencySummaries={competencySummaries}
                        competencyEvaluations={competencyEvaluations}
                        classStudentIds={classStudentIds}
                        settings={settings}
                    />
                )}

                {activeTab === 'ai' && (
                    <AISection
                        summaries={competencySummaries}
                        classStudents={classStudents}
                        competencyEvaluations={competencyEvaluations}
                        onViewStudentProfile={onViewStudentProfile}
                    />
                )}
            </PageWrapper>

            {/* ── Modale studenti per livello ─────────────────────────────── */}
            {viewingStudents && (
                <M3Dialog
                    title={viewingStudents.title}
                    onClose={() => setViewingStudents(null)}
                    maxWidth="sm"
                >
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)', p: 'var(--md-sys-spacing-3)' }}>
                        {viewingStudents.students.length === 0 ? (
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', py: 'var(--md-sys-spacing-4)' }}>
                                Nessuno studente a questo livello.
                            </Typography>
                        ) : viewingStudents.students.map(student => (
                            <ButtonBase
                                key={student.id}
                                onClick={() => { setViewingStudents(null); onViewStudentProfile(student); }}
                                focusRipple
                                aria-label={`Apri profilo di ${student.nome} ${student.cognome}`}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    p: 'var(--md-sys-spacing-3)',
                                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                                    bgcolor: 'var(--md-sys-color-surface-container)',
                                    textAlign: 'left',
                                    '&:hover': { bgcolor: 'var(--md-sys-color-surface-container-high)' },
                                    '&:focus-visible': { outline: '2px solid var(--md-sys-color-primary)', outlineOffset: 2 },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                    <Avatar name={`${student.nome} ${student.cognome}`} size="md" />
                                    <Box>
                                        <Typography variant="body2" sx={{
                                            color: 'var(--md-sys-color-on-surface)',
                                            fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                        }}>
                                            {student.cognome} {student.nome}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mt: '2px' }}>
                                            <Box sx={{
                                                width: 8, height: 8, borderRadius: '50%',
                                                bgcolor: viewingStudents.levelColor, flexShrink: 0,
                                            }} />
                                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                                Livello raggiunto
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                                    sx={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    arrow_forward
                                </Box>
                            </ButtonBase>
                        ))}
                    </DialogContent>
                    <DialogActions sx={{ px: 'var(--md-sys-spacing-4)', pb: 'var(--md-sys-spacing-3)' }}>
                        <Button onClick={() => setViewingStudents(null)} variant="text">Chiudi</Button>
                    </DialogActions>
                </M3Dialog>
            )}
        </>
    );
};

export default ClassCompetencyDashboard;

