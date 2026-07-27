/**
 * ClasseTab.tsx — Griglia StudentCard con showRisk e ClassHealth chip.
 * Dati da useStudentStore. MD3 Gold Compliant.
 */
import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import M3Surface from '../../ui/M3Surface';
import StudentCard from '../StudentCard';
import { useStudentStore }  from '../../../stores/useStudentStore';
import type { Studente }    from '../../../types';

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

function classHealth(studentCount: number, atRiskCount: number): {
  label: string;
  bg:    string;
  fg:    string;
  icon:  string;
} {
  if (studentCount === 0) return { label: 'N/D',      bg: tok('surface-container-high'), fg: tok('on-surface-variant'),    icon: 'help_outline' };
  const ratio = atRiskCount / studentCount;
  if (ratio === 0)    return { label: 'Ottima',     bg: tok('primary-container'),      fg: tok('on-primary-container'),   icon: 'check_circle'  };
  if (ratio <= 0.15)  return { label: 'Buona',      bg: tok('secondary-container'),    fg: tok('on-secondary-container'), icon: 'thumb_up'      };
  if (ratio <= 0.30)  return { label: 'Attenzione', bg: tok('tertiary-container'),     fg: tok('on-tertiary-container'),  icon: 'warning'       };
  return               { label: 'Critica',    bg: tok('error-container'),        fg: tok('on-error-container'),    icon: 'error'         };
}

interface ClasseTabProps {
  selectedClass: string;
  showRisk?:     boolean;
  onStudentClick?: (student: Studente) => void;
}

const ClasseTab: React.FC<ClasseTabProps> = ({
  selectedClass,
  showRisk = true,
  onStudentClick,
}) => {
  const students    = useStudentStore((s) => s.students);
  const evaluations = useStudentStore((s) => s.evaluations);

  const classStudents = useMemo(
    () => students.filter((s) => !s.isArchived && s.classe === selectedClass),
    [students, selectedClass]
  );

  const atRiskCount = useMemo(() => {
    return classStudents.filter((student) => {
      const evals  = evaluations.filter((e) => e.studenteId === student.id);
      const grades = evals.map((e) => parseFloat(e.voto)).filter((n) => !isNaN(n));
      if (grades.length === 0) return false;
      const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
      return avg < 6;
    }).length;
  }, [classStudents, evaluations]);

  const health = classHealth(classStudents.length, atRiskCount);

  if (classStudents.length === 0) {
    return (
      <M3Surface
        elevation={1}
        sx={{
          p:            'var(--md-sys-spacing-6)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          textAlign:    'center',
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 48, color: tok('on-surface-variant'), display: 'block', mb: 2 }}
        >
          group
        </Box>
        <Typography variant="titleMedium" sx={{ color: tok('on-surface-variant') }}>
          Nessuno studente trovato per la classe{' '}
          <strong>{selectedClass || 'selezionata'}</strong>.
        </Typography>
      </M3Surface>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Class health summary */}
      <M3Surface
        elevation={2}
        component="section"
        aria-label="Salute della classe"
        sx={{
          p:            'var(--md-sys-spacing-3)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          display:      'flex',
          alignItems:   'center',
          gap:          'var(--md-sys-spacing-3)',
          flexWrap:     'wrap',
        }}
      >
        <Box
          component="span"
          className="material-symbols-outlined"
          aria-hidden="true"
          sx={{ fontSize: 24, color: tok('primary'), fontVariationSettings: '"FILL" 1' }}
        >
          group
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="titleSmall"
            sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
          >
            Classe {selectedClass}
          </Typography>
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
            {classStudents.length} studenti · {atRiskCount} a rischio
          </Typography>
        </Box>
        <Chip
          label={`Salute: ${health.label}`}
          icon={
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden
              sx={{ fontSize: '16px !important' }}
            >
              {health.icon}
            </Box>
          }
          sx={{
            bgcolor:  health.bg,
            color:    health.fg,
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          }}
          aria-label={`Salute classe: ${health.label}`}
        />
        {showRisk && atRiskCount > 0 && (
          <Chip
            label={`${atRiskCount} a rischio`}
            size="small"
            sx={{
              bgcolor: tok('error-container'),
              color:   tok('on-error-container'),
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        )}
      </M3Surface>

      {/* Student grid */}
      <Box
        component="section"
        aria-label={`Studenti della classe ${selectedClass}`}
        sx={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap:                 'var(--md-sys-spacing-3)',
        }}
      >
        {classStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            evaluations={evaluations}
            showRisk={showRisk}
            onClick={onStudentClick ? () => onStudentClick(student) : undefined}
          />
        ))}
      </Box>
    </Stack>
  );
};

export default ClasseTab;
