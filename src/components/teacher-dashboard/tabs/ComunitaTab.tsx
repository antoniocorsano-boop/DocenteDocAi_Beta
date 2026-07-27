/**
 * ComunitaTab.tsx — Adapter per ConsiglioClasse.
 * Legge tutti i props necessari dagli store esistenti.
 * MD3 Gold Compliant.
 */
import React, { useCallback, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import M3Surface from '../../ui/M3Surface';
import ConsiglioClasse from '../../ConsiglioClasse';
import { useStudentStore }  from '../../../stores/useStudentStore';
import { useAcademicStore } from '../../../stores/useAcademicStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import type { GiudizioPeriodico, Studente } from '../../../types';

interface ComunitaTabProps {
  selectedClass: string;
}

const ComunitaTab: React.FC<ComunitaTabProps> = ({ selectedClass }) => {
  const students        = useStudentStore((s)  => s.students);
  const evaluations     = useStudentStore((s)  => s.evaluations);
  const competencyEvals = useStudentStore((s)  => s.competencyEvals);
  const setStudentProfileContext = useStudentStore((s) => s.actions.setStudentProfileContext);

  const giudizi        = useAcademicStore((s)  => s.giudizi);
  const saveGiudizio   = useAcademicStore((s)  => s.actions.saveGiudizio);

  const settings       = useSettingsStore((s)  => s.settings);
  const aiSettings     = useSettingsStore((s)  => s.aiSettings);

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

  const handleViewStudentProfile = useCallback(
    (student: Studente) => setStudentProfileContext(student),
    [setStudentProfileContext]
  );

  const handleSaveGiudizio = useCallback(
    (giudizio: GiudizioPeriodico) => saveGiudizio(giudizio),
    [saveGiudizio]
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
          Seleziona una classe per visualizzare il Consiglio di Classe.
        </Typography>
      </M3Surface>
    );
  }

  return (
    <ConsiglioClasse
      selectedClass={selectedClass}
      students={classStudents}
      evaluations={classEvals}
      giudizi={giudizi}
      onSaveGiudizio={handleSaveGiudizio}
      settings={settings}
      aiSettings={aiSettings}
      annoScolasticoCorrente={settings.annoScolasticoCorrente}
      onViewStudentProfile={handleViewStudentProfile}
      competencyEvaluations={competencyEvals}
    />
  );
};

export default ComunitaTab;
