/**
 * InnovazioneAITab.tsx — Wrapper su CopilotMaturitaPanel.
 * Legge studenti e valutazioni dallo store. MD3 Gold Compliant.
 */
import React, { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import M3Surface from '../../ui/M3Surface';
import CopilotMaturitaPanel from '../../copilot/maturita/CopilotMaturitaPanel';
import { useStudentStore } from '../../../stores/useStudentStore';

interface InnovazioneAITabProps {
  selectedClass: string;
}

const InnovazioneAITab: React.FC<InnovazioneAITabProps> = ({ selectedClass }) => {
  const students    = useStudentStore((s) => s.students);
  const evaluations = useStudentStore((s) => s.evaluations);

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
        <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Seleziona una classe per visualizzare la Maturità AI.
        </Typography>
      </M3Surface>
    );
  }

  return (
    <CopilotMaturitaPanel
      students={classStudents}
      evaluations={classEvals}
      className={selectedClass}
    />
  );
};

export default InnovazioneAITab;
