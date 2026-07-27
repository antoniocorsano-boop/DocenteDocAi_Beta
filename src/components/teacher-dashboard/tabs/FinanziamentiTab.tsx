/**
 * FinanziamentiTab.tsx — Wrapper su FundingPanel.
 * Legge studenti, UDA e lezioni dallo store. MD3 Gold Compliant.
 */
import React, { useMemo } from 'react';
import { useStudentStore }  from '../../../stores/useStudentStore';
import { useAcademicStore } from '../../../stores/useAcademicStore';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import FundingPanel from '../../copilot/FundingPanel';

interface FinanziamentiTabProps {
  selectedClass: string;
}

const FinanziamentiTab: React.FC<FinanziamentiTabProps> = ({ selectedClass }) => {
  const students  = useStudentStore((s) => s.students);
  const uda       = useAcademicStore((s) => s.uda);
  const lessons   = useAcademicStore((s) => s.lessons);
  const settings  = useSettingsStore((s) => s.settings);

  const classStudents = useMemo(
    () => students.filter((s) => !s.isArchived && s.classe === selectedClass),
    [students, selectedClass]
  );
  const classUda = useMemo(
    () => uda.filter((u) => u.classe === selectedClass),
    [uda, selectedClass]
  );
  const classLessons = useMemo(
    () => Object.values(lessons).filter((l) => l.classe === selectedClass),
    [lessons, selectedClass]
  );

  const userProfile = useMemo(
    () => ({
      istituto: settings.nomeIstituto,
    }),
    [settings]
  );

  return (
    <FundingPanel
      students={classStudents}
      udas={classUda}
      lessons={classLessons}
      className={selectedClass || 'Tutte'}
      userProfile={userProfile}
    />
  );
};

export default FinanziamentiTab;
