import type { SubjectGap, LessonSuggestion } from './types'

/**
 * Maps each SubjectGap to lesson suggestions:
 *  - high severity   → recupero + verifica
 *  - medium severity → recupero + attivita
 *  - low severity    → attivita (enrichment / consolidation)
 */
export function suggestActivities(gaps: SubjectGap[]): LessonSuggestion[] {
  const suggestions: LessonSuggestion[] = []

  for (const gap of gaps) {
    const { subject, severity, affectedStudentIds, subjectAverage } = gap

    // recupero for high and medium gaps
    if (severity === 'high' || severity === 'medium') {
      suggestions.push({
        id: `recupero-${subject}-${affectedStudentIds.join('-')}`,
        type: 'recupero',
        subject,
        description: `Attività di recupero su ${subject} — esercizi graduati e rinforzo concetti base`,
        rationale: `Media classe ${subject}: ${subjectAverage.toFixed(1)} — ${affectedStudentIds.length} studente/i sotto la sufficienza`,
        targetStudentIds: affectedStudentIds,
      })
    }

    // verifica only after high-severity recovery
    if (severity === 'high') {
      suggestions.push({
        id: `verifica-${subject}`,
        type: 'verifica',
        subject,
        description: `Verifica formativa su ${subject} per monitorare i progressi dopo il recupero`,
        rationale: `Necessario verificare i progressi degli studenti a rischio in ${subject}`,
        targetStudentIds: affectedStudentIds,
      })
    }

    // attivita for medium (collaborative consolidation) and low (enrichment)
    if (severity === 'medium') {
      suggestions.push({
        id: `attivita-${subject}`,
        type: 'attivita',
        subject,
        description: `Attività di consolidamento in ${subject} — lavoro di gruppo su casi applicativi`,
        rationale: `Alcuni studenti mostrano difficoltà in ${subject} (media ${subjectAverage.toFixed(1)}): attività collaborativa per consolidare`,
        targetStudentIds: affectedStudentIds,
      })
    }

    if (severity === 'low') {
      suggestions.push({
        id: `attivita-approfondimento-${subject}`,
        type: 'attivita',
        subject,
        description: `Attività di approfondimento in ${subject} — problem solving e compiti autentici`,
        rationale: `Classe in linea in ${subject} (media ${subjectAverage.toFixed(1)}): consolidare con esercizi sfidanti`,
      })
    }
  }

  return suggestions
}
