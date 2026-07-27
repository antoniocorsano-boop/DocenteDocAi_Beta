/**
 * DidatticaTab.tsx — Wrapper su CopilotRecommendationPanel.
 * Legge dati da store e li passa al panel. MD3 Gold Compliant.
 */
import React, { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import M3Surface from '../../ui/M3Surface';
import CopilotRecommendationPanel from '../../copilot/CopilotRecommendationPanel';
import { useStudentStore }  from '../../../stores/useStudentStore';
import { useAcademicStore } from '../../../stores/useAcademicStore';

interface DidatticaTabProps {
  selectedClass: string;
}

const DidatticaTab: React.FC<DidatticaTabProps> = ({ selectedClass }) => {
  const students    = useStudentStore((s) => s.students);
  const evaluations = useStudentStore((s) => s.evaluations);
  const uda         = useAcademicStore((s) => s.uda);

  const classStudents = useMemo(
    () => students.filter((s) => !s.isArchived && s.classe === selectedClass),
    [students, selectedClass]
  );
  const classEvals = useMemo(
    () => evaluations.filter((e) =>
      classStudents.some((s) => s.id === e.studenteId)
    ),
    [evaluations, classStudents]
  );
  const classUda = useMemo(
    () => uda.filter((u) => u.classe === selectedClass),
    [uda, selectedClass]
  );

  if (!selectedClass) {
    return (
      <M3Surface
        elevation={1}
        sx={{
          p:            'var(--md-sys-spacing-6)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          textAlign:    'center',
        }}
      >
        <Typography variant="bodyMedium" sx={{ color: `var(--md-sys-color-on-surface-variant)` }}>
          Seleziona una classe per visualizzare le raccomandazioni AI.
        </Typography>
      </M3Surface>
    );
  }

  return (
    <CopilotRecommendationPanel
      students={classStudents}
      evaluations={classEvals}
      udas={classUda}
      className={selectedClass}
    />
  );
};

export default DidatticaTab;
