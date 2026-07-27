/**
 * TrendPredictionPanel — Sprint 4
 *
 * Visualises grade trajectory forecasts per student/subject using OLS
 * regression from trendEngine.ts.
 *
 * Structure:
 *  - Top: risk alert list (projected < 6) + excellence list (>= 8)
 *  - Accordion per student that has data
 *    - Chip row of subject forecasts
 *    - Recharts LineChart: solid historical regression + dashed projected
 */
import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import { InfoCard, SectionHeader, EmptyState } from '../ui';
import type { Studente, Valutazione } from '../../types';
import {
  generateForecasts,
  type StudentForecast,
  type SubjectTrend,
  type TrendDirection,
} from '../../ai/copilot/trendEngine';

// ── colour helpers ──────────────────────────────────────────────────────────

const DIRECTION_COLOR: Record<TrendDirection, string> = {
  improving: 'var(--md-sys-color-tertiary)',
  stable: 'var(--md-sys-color-secondary)',
  declining: 'var(--md-sys-color-error)',
};

const DIRECTION_ICON: Record<TrendDirection, string> = {
  improving: 'trending_up',
  stable: 'trending_flat',
  declining: 'trending_down',
};

// ── custom recharts tooltip ──────────────────────────────────────────────────

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
}

interface CustomTooltipInternalProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipInternalProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: 'var(--md-sys-shape-corner-small)',
        px: 'var(--md-sys-spacing-3)',
        py: 'var(--md-sys-spacing-2)',
      }}
    >
      <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Typography key={String(entry.dataKey)} variant="body2" sx={{ color: entry.color }}>
          {entry.name}: {entry.value !== undefined ? entry.value : '—'}
        </Typography>
      ))}
    </Box>
  );
};

// ── subject chart ─────────────────────────────────────────────────────────────

const SubjectChart: React.FC<{ trend: SubjectTrend }> = ({ trend }) => {
  const data = trend.points.map((p) => ({
    label: p.label,
    reale: p.actual,
    previsione: p.regression,
    projected: p.projected,
  }));

  // Split regression into two series so we can style them differently
  const histData = data.map((d) => ({ ...d, storico: d.projected ? null : d.previsione }));
  const projData = data.map((d) => ({ ...d, futuro: d.projected ? d.previsione : null }));
  const merged = histData.map((d, i) => ({ ...d, futuro: projData[i].futuro }));

  return (
    <Box sx={{ height: 200, mt: 'var(--md-sys-spacing-2)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" opacity={0.4} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--md-sys-color-on-surface-variant)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fontSize: 10, fill: 'var(--md-sys-color-on-surface-variant)' }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <ReferenceLine y={6} stroke="var(--md-sys-color-error)" strokeDasharray="4 2" opacity={0.6} label={{ value: '6', fontSize: 9, fill: 'var(--md-sys-color-error)' }} />
          <ReferenceLine y={8} stroke="var(--md-sys-color-tertiary)" strokeDasharray="4 2" opacity={0.6} label={{ value: '8', fontSize: 9, fill: 'var(--md-sys-color-tertiary)' }} />
          <Legend
            iconSize={10}
            wrapperStyle={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}
          />
          {/* Actual grades */}
          <Line
            type="monotone"
            dataKey="reale"
            name="Voto"
            stroke="var(--md-sys-color-primary)"
            dot={{ r: 3, fill: 'var(--md-sys-color-primary)' }}
            connectNulls={false}
            strokeWidth={2}
          />
          {/* Historical regression */}
          <Line
            type="monotone"
            dataKey="storico"
            name="Tendenza"
            stroke="var(--md-sys-color-secondary)"
            dot={false}
            connectNulls={false}
            strokeWidth={1.5}
          />
          {/* Projected regression */}
          <Line
            type="monotone"
            dataKey="futuro"
            name="Previsione"
            stroke="var(--md-sys-color-tertiary)"
            dot={{ r: 3, fill: 'var(--md-sys-color-tertiary)', strokeDasharray: '' }}
            connectNulls={false}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

// ── student accordion card ───────────────────────────────────────────────────

const StudentForecastCard: React.FC<{ forecast: StudentForecast }> = ({ forecast }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(
    forecast.subjects[0]?.subject ?? '',
  );
  const activeTrend = forecast.subjects.find((s) => s.subject === selectedSubject);

  const overallColor =
    forecast.overallProjected < 6
      ? 'var(--md-sys-color-error)'
      : forecast.overallProjected >= 8
      ? 'var(--md-sys-color-tertiary)'
      : 'var(--md-sys-color-on-surface)';

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: 'var(--md-sys-shape-corner-medium) !important',
        mb: 'var(--md-sys-spacing-2)',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20, color: 'var(--md-sys-color-on-surface-variant)' }}>
            expand_more
          </Box>
        }
        aria-controls={`forecast-${forecast.studentId}-content`}
        id={`forecast-${forecast.studentId}-header`}
        sx={{
          px: 'var(--md-sys-spacing-4)',
          py: 'var(--md-sys-spacing-2)',
          backgroundColor: 'var(--md-sys-color-surface-container)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', flex: 1, pr: 1 }}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 22, color: 'var(--md-sys-color-on-surface-variant)' }}>
            person
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              {forecast.studentName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)', mt: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Media prevista:
              </Typography>
              <Typography variant="caption" sx={{ color: overallColor, fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
                {forecast.overallProjected > 0 ? forecast.overallProjected : '—'}
              </Typography>
              {forecast.atRiskSubjects.length > 0 && (
                <Chip
                  label={`${forecast.atRiskSubjects.length} a rischio`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 9,
                    backgroundColor: 'var(--md-sys-color-error-container)',
                    color: 'var(--md-sys-color-on-error-container)',
                  }}
                />
              )}
              {forecast.excellenceSubjects.length > 0 && (
                <Chip
                  label={`${forecast.excellenceSubjects.length} eccellenza`}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 9,
                    backgroundColor: 'var(--md-sys-color-tertiary-container)',
                    color: 'var(--md-sys-color-on-tertiary-container)',
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface)' }}>
        {/* Subject selector chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-1)', mb: 'var(--md-sys-spacing-3)' }}>
          {forecast.subjects.map((s) => {
            const dir = s.insufficient ? 'stable' : s.direction;
            const isSelected = s.subject === selectedSubject;
            return (
              <Chip
                key={s.subject}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 13 }}>
                      {DIRECTION_ICON[dir]}
                    </Box>
                    {s.subject}
                    {!s.insufficient && (
                      <Box component="span" sx={{ ml: 0.5, fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
                        →{s.projectedGrade}
                      </Box>
                    )}
                  </Box>
                }
                size="small"
                onClick={() => setSelectedSubject(s.subject)}
                aria-label={`Mostra previsione per ${s.subject}`}
                aria-pressed={isSelected}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: isSelected
                    ? 'var(--md-sys-color-secondary-container)'
                    : 'var(--md-sys-color-surface-container-high)',
                  color: isSelected
                    ? 'var(--md-sys-color-on-secondary-container)'
                    : DIRECTION_COLOR[dir],
                  border: isSelected ? '1px solid var(--md-sys-color-secondary)' : '1px solid transparent',
                  '&:hover': { opacity: 0.85 },
                }}
              />
            );
          })}
        </Box>

        {/* Chart for selected subject */}
        {activeTrend && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', mb: 'var(--md-sys-spacing-1)' }}>
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                {activeTrend.subject}
              </Typography>
              {!activeTrend.insufficient && (
                <>
                  <Chip
                    label={activeTrend.direction === 'improving' ? 'In miglioramento' : activeTrend.direction === 'declining' ? 'In calo' : 'Stabile'}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: 9,
                      backgroundColor:
                        activeTrend.direction === 'improving'
                          ? 'var(--md-sys-color-tertiary-container)'
                          : activeTrend.direction === 'declining'
                          ? 'var(--md-sys-color-error-container)'
                          : 'var(--md-sys-color-secondary-container)',
                      color:
                        activeTrend.direction === 'improving'
                          ? 'var(--md-sys-color-on-tertiary-container)'
                          : activeTrend.direction === 'declining'
                          ? 'var(--md-sys-color-on-error-container)'
                          : 'var(--md-sys-color-on-secondary-container)',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', ml: 'auto' }}>
                    Affidabilità: {Math.round(activeTrend.rSquared * 100)}%
                  </Typography>
                </>
              )}
              {activeTrend.insufficient && (
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Dati insufficienti per regressione
                </Typography>
              )}
            </Box>
            <SubjectChart trend={activeTrend} />
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// ── main component ────────────────────────────────────────────────────────────

interface TrendPredictionPanelProps {
  students: Studente[];
  evaluations: Valutazione[];
  className: string;
  studentId: string;
}

const TrendPredictionPanel: React.FC<TrendPredictionPanelProps> = ({
  students,
  evaluations,
  className,
  studentId,
}) => {
  const targetStudents = useMemo(
    () => (studentId === 'all' ? students : students.filter((s) => s.id === studentId)),
    [students, studentId],
  );

  const forecasts = useMemo(
    () => generateForecasts(targetStudents, evaluations, 90),
    [targetStudents, evaluations],
  );

  const globalRisk = useMemo(
    () =>
      forecasts.filter((f) => f.atRiskSubjects.length > 0),
    [forecasts],
  );
  const globalExcellence = useMemo(
    () => forecasts.filter((f) => f.excellenceSubjects.length > 0),
    [forecasts],
  );

  return (
    <InfoCard variant="outlined">
      <SectionHeader
        title="Predizione Trend"
        subtitle={`Previsione voti a 30 giorni — classe ${className}`}
      />

      {/* ── Alert banners ── */}
      {globalRisk.length > 0 && (
        <Alert
          severity="error"
          icon={
            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>
              trending_down
            </Box>
          }
          sx={{
            mb: 'var(--md-sys-spacing-3)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            backgroundColor: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            '& .MuiAlert-icon': { color: 'var(--md-sys-color-error)' },
          }}
        >
          <Typography variant="labelSmall" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
            {globalRisk.length === 1
              ? `1 studente a rischio`
              : `${globalRisk.length} studenti a rischio`}
            {' — '}
            {globalRisk.map((f) => f.studentName).join(', ')}
          </Typography>
        </Alert>
      )}
      {globalExcellence.length > 0 && (
        <Alert
          severity="success"
          icon={
            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>
              trending_up
            </Box>
          }
          sx={{
            mb: 'var(--md-sys-spacing-3)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            backgroundColor: 'var(--md-sys-color-tertiary-container)',
            color: 'var(--md-sys-color-on-tertiary-container)',
            '& .MuiAlert-icon': { color: 'var(--md-sys-color-tertiary)' },
          }}
        >
          <Typography variant="labelSmall" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
            {globalExcellence.length === 1
              ? `1 studente verso eccellenza`
              : `${globalExcellence.length} studenti verso eccellenza`}
            {' — '}
            {globalExcellence.map((f) => f.studentName).join(', ')}
          </Typography>
        </Alert>
      )}

      {/* ── Student accordions ── */}
      {forecasts.length === 0 ? (
        <EmptyState
          title="Nessun dato disponibile"
          description="Non sono presenti valutazioni negli ultimi 90 giorni per la selezione corrente."
          icon="show_chart"
        />
      ) : (
        forecasts.map((forecast) => (
          <StudentForecastCard key={forecast.studentId} forecast={forecast} />
        ))
      )}

      {/* ── Legend note ── */}
      {forecasts.length > 0 && (
        <Box sx={{ mt: 'var(--md-sys-spacing-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" sx={{ width: 16, height: 2, backgroundColor: 'var(--md-sys-color-tertiary)', display: 'inline-block', borderTop: '2px dashed', borderColor: 'var(--md-sys-color-tertiary)' }} />
            Proiezione (+30gg)
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            · Affidabilità basata su R² (regressione lineare sui voti)
          </Typography>
        </Box>
      )}
    </InfoCard>
  );
};

export default TrendPredictionPanel;
