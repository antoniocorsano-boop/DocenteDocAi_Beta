/**
 * AggregatedDashboard — Sprint 5
 *
 * Single-screen command centre that assembles key widgets from all
 * previous sprints into one scrollable overview:
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  KPI row: studenti, media classe, a rischio, eccellenze │
 *  ├──────────────┬──────────────────────────────────────────┤
 *  │ Suggerimenti │  Predizioni a rischio (top 3)            │
 *  │ AI           │                                          │
 *  ├──────────────┴──────────────────────────────────────────┤
 *  │  Attività pianificate (a rischio + eccellenza count)    │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  Messaggi in coda                                       │
 *  └─────────────────────────────────────────────────────────┘
 *
 * Data flows are computed here (not re-fetched) by calling the
 * sprint engines: planningEngine, communicationEngine, trendEngine.
 */
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { InfoCard, SectionHeader, EmptyState } from '../ui';
import type { AISuggestion } from '../../ai/contextEngine/types';
import type { ClassHealthIndex } from '../../ai/classHealth/types';
import type { AISnapshot } from '../../stores/useAISnapshotStore';
import type { Studente, Valutazione, Uda } from '../../types';
import { generateStudentPlans } from '../../ai/copilot/planningEngine';
import { generateCommunications } from '../../ai/copilot/communicationEngine';
import { generateForecasts } from '../../ai/copilot/trendEngine';

// ── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  bg?: string;
  fg?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  icon,
  label,
  value,
  bg = 'var(--md-sys-color-surface-container)',
  fg = 'var(--md-sys-color-on-surface)',
}) => (
  <Box
    sx={{
      flex: '1 1 120px',
      backgroundColor: bg,
      borderRadius: 'var(--md-sys-shape-corner-medium)',
      p: 'var(--md-sys-spacing-3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 'var(--md-sys-spacing-1)',
    }}
  >
    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 22, color: fg }}>
      {icon}
    </Box>
    <Typography variant="h4" sx={{ color: fg, lineHeight: 1, fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: fg, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </Typography>
  </Box>
);

// ── section title ─────────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', mb: 'var(--md-sys-spacing-2)' }}>
    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18, color: 'var(--md-sys-color-primary)' }}>
      {icon}
    </Box>
    <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
      {title}
    </Typography>
  </Box>
);

// ── suggestion row ────────────────────────────────────────────────────────────

const SUGGESTION_META: Record<
  AISuggestion['type'],
  { icon: string; bg: string; fg: string; label: string }
> = {
  student_at_risk: { icon: 'warning', bg: 'var(--md-sys-color-error-container)', fg: 'var(--md-sys-color-on-error-container)', label: 'A rischio' },
  student_excellence: { icon: 'star', bg: 'var(--md-sys-color-tertiary-container)', fg: 'var(--md-sys-color-on-tertiary-container)', label: 'Eccellenza' },
  missing_assessment: { icon: 'assignment_late', bg: 'var(--md-sys-color-secondary-container)', fg: 'var(--md-sys-color-on-secondary-container)', label: 'Val. mancante' },
  learning_gap: { icon: 'school', bg: 'var(--md-sys-color-surface-container-high)', fg: 'var(--md-sys-color-on-surface-variant)', label: 'Lacuna' },
};

const SuggestionRow: React.FC<{ suggestion: AISuggestion; students: Studente[] }> = ({ suggestion, students }) => {
  const meta = SUGGESTION_META[suggestion.type] ?? SUGGESTION_META.learning_gap;
  const student = students.find((s) => s.id === suggestion.studentId);
  const name = student
    ? `${student.cognome ?? ''} ${student.nome ?? ''}`.trim()
    : suggestion.studentId ?? '—';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--md-sys-spacing-3)',
        p: 'var(--md-sys-spacing-2)',
        borderRadius: 'var(--md-sys-shape-corner-small)',
        backgroundColor: meta.bg,
        mb: 'var(--md-sys-spacing-1)',
      }}
    >
      <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18, color: meta.fg, mt: 0.25, flexShrink: 0 }}>
        {meta.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)', flexWrap: 'wrap' }}>
          <Typography variant="labelSmall" sx={{ color: meta.fg, fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
            {name}
          </Typography>
          <Chip label={meta.label} size="small" sx={{ height: 14, fontSize: 9, backgroundColor: 'transparent', color: meta.fg, border: `1px solid ${meta.fg}` }} />
        </Box>
        <Typography variant="caption" sx={{ color: meta.fg, opacity: 0.8, display: 'block', mt: 0.25 }}>
          {suggestion.message}
        </Typography>
      </Box>
    </Box>
  );
};

// ── risk forecast row ─────────────────────────────────────────────────────────

const RiskForecastRow: React.FC<{ name: string; subjects: string[]; projected: number }> = ({ name, subjects, projected }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--md-sys-spacing-3)',
      p: 'var(--md-sys-spacing-2)',
      borderRadius: 'var(--md-sys-shape-corner-small)',
      backgroundColor: 'var(--md-sys-color-error-container)',
      mb: 'var(--md-sys-spacing-1)',
    }}
  >
    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 18, color: 'var(--md-sys-color-error)', flexShrink: 0 }}>
      trending_down
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-error-container)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
        {name}
      </Typography>
      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-error-container)', opacity: 0.8, display: 'block' }}>
        {subjects.join(', ')} · media prevista {projected}
      </Typography>
    </Box>
  </Box>
);

// ── main component ────────────────────────────────────────────────────────────

interface AggregatedDashboardProps {
  suggestions: AISuggestion[];
  classHealth: ClassHealthIndex;
  snapshots: AISnapshot[];
  students: Studente[];
  evaluations: Valutazione[];
  udas: Uda[];
  className: string;
  studentId: string;
}

const AggregatedDashboard: React.FC<AggregatedDashboardProps> = ({
  suggestions,
  students,
  evaluations,
  udas,
  className,
  studentId,
}) => {
  const targetStudents = useMemo(
    () => (studentId === 'all' ? students : students.filter((s) => s.id === studentId)),
    [students, studentId],
  );
  const ids = useMemo(() => new Set(targetStudents.map((s) => s.id)), [targetStudents]);
  const targetSuggestions = useMemo(
    () => suggestions.filter((s) => s.studentId == null || ids.has(s.studentId)),
    [suggestions, ids],
  );

  // ── KPI data ──
  const classAvg = useMemo(() => {
    const grades = evaluations
      .filter((e) => ids.has(e.studenteId))
      .map((e) => parseFloat(e.voto.replace(',', '.')))
      .filter((v) => !isNaN(v) && v > 0);
    if (grades.length === 0) return 0;
    return grades.reduce((a, b) => a + b, 0) / grades.length;
  }, [evaluations, ids]);
  const atRiskCount = targetSuggestions.filter((s) => s.type === 'student_at_risk').length;
  const excellenceCount = targetSuggestions.filter((s) => s.type === 'student_excellence').length;

  // ── Sprint 2: plan counts ──
  const plans = useMemo(
    () => generateStudentPlans(targetSuggestions, targetStudents, evaluations, udas),
    [targetSuggestions, targetStudents, evaluations, udas],
  );

  // ── Sprint 3: message queue ──
  const messages = useMemo(
    () => generateCommunications(targetSuggestions, targetStudents, evaluations),
    [targetSuggestions, targetStudents, evaluations],
  );

  // ── Sprint 4: risk forecasts (top 3 by atRisk count) ──
  const forecasts = useMemo(
    () => generateForecasts(targetStudents, evaluations, 90),
    [targetStudents, evaluations],
  );
  const riskForecasts = useMemo(
    () =>
      forecasts
        .filter((f) => f.atRiskSubjects.length > 0)
        .sort((a, b) => b.atRiskSubjects.length - a.atRiskSubjects.length)
        .slice(0, 3),
    [forecasts],
  );

  // ── Top suggestions (first 5) ──
  const topSuggestions = targetSuggestions.slice(0, 5);

  // ── Message summary ──
  const parentMsgCount = messages.filter((m) => m.target === 'parent').length;
  const studentMsgCount = messages.filter((m) => m.target === 'student').length;

  return (
    <InfoCard variant="outlined">
      <SectionHeader
        title="Dashboard Aggregata"
        subtitle={`Panoramica completa — classe ${className}`}
      />

      {/* ── KPI row ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)', mb: 'var(--md-sys-spacing-5)' }}>
        <KpiCard
          icon="group"
          label="Studenti"
          value={targetStudents.length}
        />
        <KpiCard
          icon="grade"
          label="Media classe"
          value={classAvg > 0 ? classAvg.toFixed(1) : '—'}
          bg="var(--md-sys-color-primary-container)"
          fg="var(--md-sys-color-on-primary-container)"
        />
        <KpiCard
          icon="warning"
          label="A rischio"
          value={atRiskCount}
          bg={atRiskCount > 0 ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-surface-container)'}
          fg={atRiskCount > 0 ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-surface-variant)'}
        />
        <KpiCard
          icon="star"
          label="Eccellenze"
          value={excellenceCount}
          bg={excellenceCount > 0 ? 'var(--md-sys-color-tertiary-container)' : 'var(--md-sys-color-surface-container)'}
          fg={excellenceCount > 0 ? 'var(--md-sys-color-on-tertiary-container)' : 'var(--md-sys-color-on-surface-variant)'}
        />
        <KpiCard
          icon="assignment"
          label="Piani attivi"
          value={plans.length}
          bg="var(--md-sys-color-secondary-container)"
          fg="var(--md-sys-color-on-secondary-container)"
        />
        <KpiCard
          icon="mail"
          label="Messaggi in coda"
          value={messages.length}
        />
      </Box>

      <Divider sx={{ mb: 'var(--md-sys-spacing-4)', borderColor: 'var(--md-sys-color-outline-variant)' }} />

      {/* ── Two-column grid ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 'var(--md-sys-spacing-4)' }}>

        {/* Left: Top AI suggestions */}
        <Box>
          <SectionTitle icon="lightbulb" title="Suggerimenti AI" />
          {topSuggestions.length > 0 ? (
            topSuggestions.map((s) => (
              <SuggestionRow key={s.id} suggestion={s} students={targetStudents} />
            ))
          ) : (
            <EmptyState title="Nessun suggerimento" description="Nessun alert AI per la selezione corrente." icon="check_circle" />
          )}
        </Box>

        {/* Right: Risk forecasts */}
        <Box>
          <SectionTitle icon="show_chart" title="Predizioni a rischio (top 3)" />
          {riskForecasts.length > 0 ? (
            riskForecasts.map((f) => (
              <RiskForecastRow
                key={f.studentId}
                name={f.studentName}
                subjects={f.atRiskSubjects}
                projected={f.overallProjected}
              />
            ))
          ) : (
            <EmptyState title="Nessuna previsione di rischio" description="Dati insufficienti o nessuno studente in calo." icon="trending_up" />
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 'var(--md-sys-spacing-4)', borderColor: 'var(--md-sys-color-outline-variant)' }} />

      {/* ── Bottom row: planning + messages ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 'var(--md-sys-spacing-4)' }}>

        {/* Planning summary */}
        <Box>
          <SectionTitle icon="calendar_today" title="Attività pianificate" />
          {plans.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
              {plans.slice(0, 6).map((plan) => (
                <Box
                  key={plan.studentId}
                  sx={{
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    backgroundColor:
                      plan.planType === 'recovery'
                        ? 'var(--md-sys-color-error-container)'
                        : 'var(--md-sys-color-tertiary-container)',
                    px: 'var(--md-sys-spacing-2)',
                    py: 'var(--md-sys-spacing-1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-1)',
                  }}
                >
                  <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 14, color: plan.planType === 'recovery' ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-tertiary-container)' }}>
                    {plan.planType === 'recovery' ? 'healing' : 'star'}
                  </Box>
                  <Typography variant="caption" sx={{ color: plan.planType === 'recovery' ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-tertiary-container)' }}>
                    {plan.studentName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: plan.planType === 'recovery' ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-tertiary-container)', opacity: 0.7 }}>
                    · {plan.activities.length} att.
                  </Typography>
                </Box>
              ))}
              {plans.length > 6 && (
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', alignSelf: 'center' }}>
                  +{plans.length - 6} altri
                </Typography>
              )}
            </Box>
          ) : (
            <EmptyState title="Nessun piano attivo" description="Nessuna attività pianificata per la selezione corrente." icon="event_available" />
          )}
        </Box>

        {/* Message queue summary */}
        <Box>
          <SectionTitle icon="mail_outline" title="Messaggi in coda" />
          {messages.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', p: 'var(--md-sys-spacing-2)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20, color: 'var(--md-sys-color-primary)' }}>
                  family_restroom
                </Box>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {parentMsgCount} messaggi per genitori
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', p: 'var(--md-sys-spacing-2)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20, color: 'var(--md-sys-color-secondary)' }}>
                  school
                </Box>
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {studentMsgCount} messaggi per studenti
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Apri il tab "Comunicazione" per copiare i testi.
              </Typography>
            </Box>
          ) : (
            <EmptyState title="Nessun messaggio" description="Nessun messaggio generato per la selezione corrente." icon="mark_email_read" />
          )}
        </Box>
      </Box>
    </InfoCard>
  );
};

export default AggregatedDashboard;
