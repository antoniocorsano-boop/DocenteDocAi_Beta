/**
 * maturitaPipeline.ts — Maturità AI real data pipeline
 *
 * Pure function that aggregates real AI sub-system outputs
 * into MaturitaSection[] for the AIMaturitaDashboard store.
 *
 * Computes:
 *   - curriculum  → generateCurriculumRecommendations(lessons)
 *   - pedagogia   → generatePedagogyReport(lessons, udas)
 *   - trust       → predictStudentRisk → explainClass → biasReport → trustReport
 *
 * GDPR / accessibility / PA readiness: kept at seed defaults (require manual
 * compliance input from the user — no computable heuristic available).
 */

import type { Studente, Valutazione } from '@/types/student.types';
import type { Lezione, Uda } from '@/types/uda.types';
import type { MaturitaSection, BlockerSeverity } from '@/types/aiMaturita.types';
import { generateCurriculumRecommendations } from '../recommendation/curriculumAdvisor';
import { generatePedagogyReport } from '../pedagogy/pedagogyReport';
import { predictStudentRisk } from '../prediction/predictStudentRisk';
import { explainClass } from '../explainability/decisionExplainer';
import { generateBiasReport } from '../fairness/biasReport';
import { generateTrustReport } from '../trust/trustReport';
import type { RecommendationAction } from '../recommendation/lessonRecommender';

// ── helpers ───────────────────────────────────────────────────────────────────

const ACTION_MAP_IT: Record<RecommendationAction, string> = {
  addExercise:   'Aggiungi esercizi mirati per questa area didattica',
  adjustContent: 'Rivedi e aggiusta i contenuti delle lezioni coinvolte',
  reschedule:    'Riorganizza la sequenza delle lezioni e delle UDA',
  highlightRisk: 'Segnala gli studenti a rischio al consiglio di classe',
};

function now(): string {
  return new Date().toISOString();
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ── GDPR / Accessibilità / PA Readiness (compliance-only — require manual input) ─

const GDPR_BLOCKERS: MaturitaSection['blockers'] = [
  {
    id: 'gdpr-001',
    descrizione: 'DPA (Data Processing Agreement) con fornitore AI non firmato',
    severita: 'critica',
    azioneSuggerita: "Contatta l'ufficio legale per far firmare il DPA al DS entro 30 giorni",
  },
  {
    id: 'gdpr-002',
    descrizione: 'Registro trattamenti dati non aggiornato con attività AI',
    severita: 'critica',
    azioneSuggerita: "Aggiorna il registro RT includendo l'uso di DocenteDocAI",
  },
];

const ACCESSIBILITA_BLOCKERS: MaturitaSection['blockers'] = [
  {
    id: 'acc-001',
    descrizione: 'Dichiarazione accessibilità WCAG 2.1 AA non pubblicata',
    severita: 'media',
    azioneSuggerita: 'Pubblica la dichiarazione di accessibilità sul sito istituzionale',
  },
];

const PA_READINESS_BLOCKERS: MaturitaSection['blockers'] = [
  {
    id: 'par-001',
    descrizione: "SPID referente didattico non configurato nell'app",
    severita: 'critica',
    azioneSuggerita: 'Configura SPID del docente referente nel pannello Impostazioni',
  },
  {
    id: 'par-002',
    descrizione: 'SLA con fornitore AI non firmato',
    severita: 'critica',
    azioneSuggerita: 'Richiedi al DS di firmare il SLA allegato alla proposta commerciale',
  },
  {
    id: 'par-003',
    descrizione: 'Piano triennale innovazione digitale non allegato',
    severita: 'media',
    azioneSuggerita: 'Allega il PTDI aggiornato nella sezione documentazione',
  },
];

// ── Pipeline params ───────────────────────────────────────────────────────────

export interface MaturitaPipelineParams {
  students: Studente[];
  evaluations: Valutazione[];
  lessons: Lezione[];
  udas: Uda[];
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Runs the full Maturità AI data pipeline and returns 6 MaturitaSection objects.
 * Pure function — deterministic for the same inputs.
 */
export function runMaturitaPipeline({
  students,
  evaluations,
  lessons,
  udas,
}: MaturitaPipelineParams): MaturitaSection[] {
  const timestamp = now();

  // ── 1. Curriculum Coverage ──────────────────────────────────────────────
  const curriculumRecs = generateCurriculumRecommendations(lessons);
  const avgImpact =
    curriculumRecs.length > 0
      ? curriculumRecs.reduce((a, r) => a + r.impactScore, 0) / curriculumRecs.length
      : 0;
  const curriculumScore =
    lessons.length < 2 ? 50 : clamp(Math.round((1 - avgImpact) * 100));

  const curriculumSection: MaturitaSection = {
    id: 'curriculum',
    label: 'Curriculum Coverage',
    icon: 'menu_book',
    score: curriculumScore,
    weight: 0.20,
    collapsed: curriculumScore >= 70,
    lastUpdated: timestamp,
    blockers: curriculumRecs
      .filter((r) => r.impactScore >= 0.50)
      .slice(0, 3)
      .map((r) => {
        const sev: BlockerSeverity = r.impactScore >= 0.75 ? 'critica' : 'media';
        return {
          id: r.id,
          descrizione: r.title,
          severita: sev,
          azioneSuggerita: ACTION_MAP_IT[r.suggestedAction],
        };
      }),
    recommendations: curriculumRecs.slice(0, 3).map((r) => r.description),
  };

  // ── 2. Pedagogia AI ─────────────────────────────────────────────────────
  const pedagogyReport = generatePedagogyReport(lessons, udas);
  const pedagogiaScore = clamp(Math.round(pedagogyReport.overallScore * 100));
  const pedagogiaSev: BlockerSeverity = pedagogiaScore < 40 ? 'critica' : 'media';

  const pedagogiaSection: MaturitaSection = {
    id: 'pedagogia',
    label: 'Pedagogia AI',
    icon: 'school',
    score: pedagogiaScore,
    weight: 0.25,
    collapsed: pedagogiaScore >= 70,
    lastUpdated: timestamp,
    blockers: pedagogyReport.opportunities.slice(0, 2).map((opp, i) => ({
      id: `ped-real-${i}`,
      descrizione: opp,
      severita: pedagogiaSev,
      azioneSuggerita: 'Rivedi il piano lezioni in base ai suggerimenti AI',
    })),
    recommendations: [
      ...pedagogyReport.strengths.slice(0, 2),
      ...pedagogyReport.opportunities.slice(0, 1),
    ],
  };

  // ── 3. Trust Score ──────────────────────────────────────────────────────

  let trustSection: MaturitaSection;

  if (students.length === 0) {
    trustSection = {
      id: 'trust',
      label: 'Trust Score',
      icon: 'verified_user',
      score: 50,
      weight: 0.20,
      collapsed: false,
      lastUpdated: timestamp,
      blockers: [
        {
          id: 'trst-ns',
          descrizione: 'Nessuno studente caricato: il Trust Score non è calcolabile',
          severita: 'media',
          azioneSuggerita: 'Aggiungi studenti alla classe per attivare il Trust Score',
        },
      ],
      recommendations: [
        'Aggiungi almeno un studente alla classe per attivare il Trust Score.',
      ],
    };
  } else {
    const riskPredictions = students.map((s) =>
      predictStudentRisk(s.id, evaluations.filter((e) => e.studenteId === s.id))
    );
    const explanationsMap = explainClass(students, evaluations, riskPredictions);
    const biasReport = generateBiasReport(students, explanationsMap);
    const explanationsArr = Array.from(explanationsMap.values());
    const trustReport = generateTrustReport(
      explanationsArr,
      biasReport.overallBiasLevel,
      pedagogyReport.overallScore,
    );

    const trustScore = clamp(Math.round(trustReport.classScore.overallScore * 100));
    const trustSev: BlockerSeverity =
      trustScore < 40 ? 'critica' : trustScore < 70 ? 'media' : 'bassa';

    const biasBlocker =
      biasReport.overallBiasLevel !== 'none'
        ? [
            {
              id: 'trst-bias',
              descrizione: `Bias ${biasReport.overallBiasLevel} rilevato: ${biasReport.affectedGroups.length} gruppi impattati`,
              severita:
                biasReport.overallBiasLevel === 'high'
                  ? ('critica' as BlockerSeverity)
                  : ('media' as BlockerSeverity),
              azioneSuggerita: 'Consulta il report bias dal tab Dev Tools > Bias Detection',
            },
          ]
        : [];

    trustSection = {
      id: 'trust',
      label: 'Trust Score',
      icon: 'verified_user',
      score: trustScore,
      weight: 0.20,
      collapsed: trustScore >= 70,
      lastUpdated: timestamp,
      blockers: [
        ...trustReport.classScore.warningFlags.slice(0, 2).map((flag, i) => ({
          id: `trst-real-${i}`,
          descrizione: flag,
          severita: trustSev,
          azioneSuggerita: 'Consulta la sezione Spiegabilità AI per i dettagli',
        })),
        ...biasBlocker,
      ],
      recommendations: trustReport.recommendations.slice(0, 3),
    };
  }

  // ── 4–6. GDPR / Accessibilità / PA Readiness (compliance data) ──────────

  const gdprSection: MaturitaSection = {
    id: 'gdpr',
    label: 'GDPR Compliance',
    icon: 'lock',
    score: 45,
    weight: 0.15,
    collapsed: false,
    lastUpdated: timestamp,
    blockers: GDPR_BLOCKERS,
    recommendations: [
      'Completa il DPA con il fornitore AI — requisito bloccante PNRR',
      'Nomina il DPO o verifica se la nomina è già in essere',
      "Aggiorna l'informativa privacy agli alunni e famiglie",
    ],
  };

  const accessibilitaSection: MaturitaSection = {
    id: 'accessibilita',
    label: 'Accessibilità',
    icon: 'accessibility_new',
    score: 60,
    weight: 0.10,
    collapsed: true,
    lastUpdated: timestamp,
    blockers: ACCESSIBILITA_BLOCKERS,
    recommendations: [
      'Pubblica la dichiarazione accessibilità sul portale scolastico',
      'Verifica compatibilità screen reader per i materiali AI generati',
    ],
  };

  const paReadinessSection: MaturitaSection = {
    id: 'pa_readiness',
    label: 'PA Readiness',
    icon: 'account_balance',
    score: 30,
    weight: 0.10,
    collapsed: false,
    lastUpdated: timestamp,
    blockers: PA_READINESS_BLOCKERS,
    recommendations: [
      'Configura SPID — requisito obbligatorio per bandi MIM e PNRR',
      'Firma il SLA con il fornitore AI entro il prossimo CDA',
      "Prepara il PTDI aggiornato con riferimento all'uso di AI in classe",
    ],
  };

  return [
    pedagogiaSection,
    trustSection,
    curriculumSection,
    gdprSection,
    accessibilitaSection,
    paReadinessSection,
  ];
}
