/**
 * PlanningAssistantPanel — Sprint 2
 *
 * Shows AI-generated recovery/enrichment plans per student.
 * Two inner tabs:
 *   1. Recupero    — plans for at-risk students
 *   2. Eccellenza  — plans for excellent students
 */
import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import { InfoCard, SectionHeader, EmptyState } from '../ui';
import { FeatureHintChip } from '../journey';
import type { AISuggestion } from '../../ai/contextEngine/types';
import type { Studente, Valutazione, Uda } from '../../types';
import { generateStudentPlans, type StudentPlan, type ActivitySuggestion } from '../../ai/copilot/planningEngine';

// ── activity-type meta ────────────────────────────────────────────────────────

const ACTIVITY_TYPE_META: Record<
  ActivitySuggestion['type'],
  { icon: string; label: string }
> = {
  individual: { icon: 'person', label: 'Individuale' },
  group: { icon: 'group', label: 'Gruppo' },
  'self-study': { icon: 'menu_book', label: 'Studio autonomo' },
  project: { icon: 'science', label: 'Progetto' },
};

// ── subject chip ──────────────────────────────────────────────────────────────

const SubjectChip: React.FC<{ subject: string; avg: number; planType: StudentPlan['planType'] }> = ({
  subject,
  avg,
  planType,
}) => {
  const isRecovery = planType === 'recovery';
  return (
    <Chip
      label={`${subject} ${avg}`}
      size="small"
      sx={{
        backgroundColor: isRecovery
          ? 'var(--md-sys-color-error-container)'
          : 'var(--md-sys-color-tertiary-container)',
        color: isRecovery
          ? 'var(--md-sys-color-on-error-container)'
          : 'var(--md-sys-color-on-tertiary-container)',
        fontWeight: 'var(--md-sys-typescale-weight-medium)',
        height: 22,
        fontSize: 11,
      }}
    />
  );
};

// ── single plan card ──────────────────────────────────────────────────────────

const PlanCard: React.FC<{ plan: StudentPlan; udas: Uda[] }> = ({ plan, udas }) => {
  const isRecovery = plan.planType === 'recovery';
  const headerBg = isRecovery
    ? 'var(--md-sys-color-error-container)'
    : 'var(--md-sys-color-tertiary-container)';
  const headerFg = isRecovery
    ? 'var(--md-sys-color-on-error-container)'
    : 'var(--md-sys-color-on-tertiary-container)';

  const linkedUdas = useMemo(
    () => udas.filter((u) => plan.suggestedUdaIds.includes(u.id)),
    [udas, plan.suggestedUdaIds],
  );

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid var(--md-sys-color-outline-variant)',
        borderRadius: 'var(--md-sys-shape-corner-medium) !important',
        mb: 'var(--md-sys-spacing-2)',
        overflow: 'hidden',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ color: headerFg, fontSize: 20 }}
          >
            expand_more
          </Box>
        }
        aria-controls={`plan-${plan.studentId}-content`}
        id={`plan-${plan.studentId}-header`}
        sx={{ backgroundColor: headerBg, px: 'var(--md-sys-spacing-4)', py: 'var(--md-sys-spacing-2)' }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-1)', flexGrow: 1, pr: 1 }}>
          <Typography variant="titleSmall" sx={{ color: headerFg, fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
            {plan.studentName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', flexWrap: 'wrap' }}>
            {plan.subjectFocus.slice(0, 4).map((sf) => (
              <SubjectChip key={sf.subject} subject={sf.subject} avg={sf.avg} planType={plan.planType} />
            ))}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container)' }}>
        {/* Summary */}
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-3)' }}>
          {plan.summary}
        </Typography>

        {/* Activities */}
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Attività suggerite
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)', mb: 'var(--md-sys-spacing-3)' }}>
          {plan.activities.map((act, i) => {
            const meta = ACTIVITY_TYPE_META[act.type];
            return (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  gap: 'var(--md-sys-spacing-3)',
                  p: 'var(--md-sys-spacing-3)',
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                }}
              >
                {/* type icon */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-1)', minWidth: 44 }}>
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ color: 'var(--md-sys-color-primary)', fontSize: 20 }}
                  >
                    {meta.icon}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', lineHeight: 1.2 }}>
                    {meta.label}
                  </Typography>
                </Box>
                {/* detail */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
                      {act.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}>
                      {act.estimatedSessions} sessioni
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {act.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Linked UDAs */}
        {linkedUdas.length > 0 && (
          <>
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
              UDA correlate
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
              {linkedUdas.map((u) => (
                <Chip
                  key={u.id}
                  icon={
                    <Box
                      component="span"
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      sx={{ fontSize: '16px !important', color: 'inherit' }}
                    >
                      folder_open
                    </Box>
                  }
                  label={`${u.title} — ${u.materia}`}
                  size="small"
                  sx={{
                    backgroundColor: 'var(--md-sys-color-secondary-container)',
                    color: 'var(--md-sys-color-on-secondary-container)',
                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// ── main component ────────────────────────────────────────────────────────────

interface PlanningAssistantPanelProps {
  suggestions: AISuggestion[];
  students: Studente[];
  evaluations: Valutazione[];
  udas: Uda[];
  className: string;
  studentId: string;
}

const PlanningAssistantPanel: React.FC<PlanningAssistantPanelProps> = ({
  suggestions,
  students,
  evaluations,
  udas,
  className,
  studentId,
}) => {
  const [innerTab, setInnerTab] = useState(0);

  // Filter to current class + optional single student
  const targetStudents = useMemo(
    () =>
      studentId === 'all'
        ? students
        : students.filter((s) => s.id === studentId),
    [students, studentId],
  );

  // Only pass suggestions for the visible students
  const targetSuggestions = useMemo(() => {
    const ids = new Set(targetStudents.map((s) => s.id));
    return suggestions.filter((s) => s.studentId && ids.has(s.studentId));
  }, [suggestions, targetStudents]);

  const allPlans = useMemo(
    () => generateStudentPlans(targetSuggestions, targetStudents, evaluations, udas),
    [targetSuggestions, targetStudents, evaluations, udas],
  );

  const recoveryPlans = allPlans.filter((p) => p.planType === 'recovery');
  const enrichmentPlans = allPlans.filter((p) => p.planType === 'enrichment');

  return (
    <InfoCard variant="outlined">
      <SectionHeader
        title="Planning Assistant"
        subtitle={`Piani personalizzati — classe ${className}`}
      />
      <FeatureHintChip hintId="planning-assistant" requiredLevel="praticante" message="Hai sbloccato l'Assistente Pianificazione — esplora le funzioni avanzate!" />

      {/* inner tabs */}
      <Tabs
        value={innerTab}
        onChange={(_, v: number) => setInnerTab(v)}
        aria-label="Planning Assistant tabs"
        sx={{ mb: 'var(--md-sys-spacing-3)', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>
                healing
              </Box>
              Recupero{recoveryPlans.length > 0 && ` (${recoveryPlans.length})`}
            </Box>
          }
          id="plan-tab-0"
          aria-controls="plan-panel-0"
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>
                star
              </Box>
              Eccellenza{enrichmentPlans.length > 0 && ` (${enrichmentPlans.length})`}
            </Box>
          }
          id="plan-tab-1"
          aria-controls="plan-panel-1"
        />
      </Tabs>

      <Box role="tabpanel" id={`plan-panel-${innerTab}`} aria-labelledby={`plan-tab-${innerTab}`}>
        {innerTab === 0 && (
          recoveryPlans.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {recoveryPlans.map((plan) => (
                <PlanCard key={plan.studentId} plan={plan} udas={udas} />
              ))}
            </Box>
          ) : (
            <EmptyState
              title="Nessun piano di recupero"
              description="Non ci sono studenti a rischio per la selezione corrente."
              icon="check_circle"
            />
          )
        )}
        {innerTab === 1 && (
          enrichmentPlans.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {enrichmentPlans.map((plan) => (
                <PlanCard key={plan.studentId} plan={plan} udas={udas} />
              ))}
            </Box>
          ) : (
            <EmptyState
              title="Nessun piano di eccellenza"
              description="Non ci sono studenti eccellenti rilevati per la selezione corrente."
              icon="school"
            />
          )
        )}
      </Box>
    </InfoCard>
  );
};

export default PlanningAssistantPanel;
