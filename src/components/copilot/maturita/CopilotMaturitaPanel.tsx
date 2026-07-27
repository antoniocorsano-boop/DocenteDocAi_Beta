/**
 * CopilotMaturitaPanel.tsx — Maturità AI Panel con pipeline dati reali
 *
 * Componente wrapper che:
 *   1. Accetta studenti, valutazioni e className come props reali dal CopilotDocentePanel
 *   2. Legge lezioni e UDA dallo store accademico
 *   3. Esegue la pipeline dati reale via `runMaturitaPipeline` (pura, deterministica)
 *   4. Idrata `useAIMaturitaStore` con i risultati computed
 *   5. Renderizza `AIMaturitaDashboard` (che legge dallo store)
 *
 * Le modalità di interazione (Classica / Semi-Osmotica / Osmotica) vengono
 * gestite dallo store e dall'AIMaturitaDashboard — nessuna props aggiuntiva necessaria.
 */

import React, { useEffect, useMemo } from 'react';
import type { Studente, Valutazione } from '@/types/student.types';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { useAIMaturitaStore } from '@/stores/useAIMaturitaStore';
import { runMaturitaPipeline } from '@/ai/maturita/maturitaPipeline';
import AIMaturitaDashboard from './AIMaturitaDashboard';
import { FeatureHintChip } from '../../journey';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CopilotMaturitaPanelProps {
  /** Studenti della classe (da useStudentStore passati via CopilotDocentePanel) */
  students: Studente[];
  /** Valutazioni della classe (da registro) */
  evaluations: Valutazione[];
  /** Nome della classe (per contesto display futuro) */
  className: string;
}

// ── Component ────────────────────────────────────────────────────────────────

const CopilotMaturitaPanel: React.FC<CopilotMaturitaPanelProps> = ({
  students,
  evaluations,
  className: _className,
}) => {
  const lessonsRecord = useAcademicStore((state) => state.lessons);
  const udas = useAcademicStore((state) => state.uda);
  const hydrate = useAIMaturitaStore((state) => state.actions.hydrate);

  // Computa le sezioni reali in modo puro, si aggiorna solo quando cambiano i dati
  const sections = useMemo(
    () =>
      runMaturitaPipeline({
        students,
        evaluations,
        lessons: Object.values(lessonsRecord),
        udas,
      }),
    [students, evaluations, lessonsRecord, udas]
  );

  // Idrata lo store ogni volta che la pipeline produce nuovi risultati
  useEffect(() => {
    hydrate(sections);
  }, [sections, hydrate]);

  return (
    <>
      <FeatureHintChip hintId="ai-maturity" requiredLevel="maestro" message="Sei un Maestro! Questa dashboard mostra il tuo profilo di maturità AI completo." />
      <AIMaturitaDashboard />
    </>
  );
};

export default CopilotMaturitaPanel;
