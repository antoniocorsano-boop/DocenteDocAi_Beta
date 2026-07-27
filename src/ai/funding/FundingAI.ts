/**
 * FundingAI.ts — Motore AI per finanziamenti e bandi educativi
 *
 * Logica pura (no side effects):
 * - computeFundingReport(): genera FundingReport da contesto classe
 * - generateCandidaturaDraft(): produce bozza testuale candidatura
 * - simulateApprovazione(): stima probabilità di approvazione
 * - refreshBandiFromAPI(): aggiornamento mock bandi ministeriali
 *
 * In produzione sostituire il catalogo mock con fetch all'API ministeriale.
 */

import type {
  FundingOpportunity,
  FundingReport,
  FundingRecommendation,
  ProjectType,
  UserFundingProfile,
  ApprovazioneSimulation,
  ComplianceCheck,
} from '../../types/funding.types';
import type { Lezione, Studente } from '../../types';

// ── Catalogo bandi mock (aggiornamento automatico: sostituire con fetch) ──────

export const BANDI_CATALOGO: FundingOpportunity[] = [
  {
    id: 'pnrr-2025-scuola40',
    titolo: 'PNRR – Scuola 4.0: Innovazione AI in classe',
    ente: 'MIM – Ministero dell\'Istruzione e del Merito',
    scadenza: '2026-06-30',
    budget: '50.000–200.000 €',
    tipoProgetto: ['Pilota AI', 'Curriculum Innovativo'],
    requisiti: [
      'SPID docente referente',
      'GDPR: registro trattamenti completo',
      'DPA con fornitore AI firmato',
      'Piano formazione docenti allegato',
      'Dichiarazione accessibilità WCAG 2.1 AA',
    ],
    descrizione:
      'Finanziamento PNRR M4C1 per progetti pilota che introducono intelligenza artificiale nella didattica. ' +
      'Priorità a istituti con documentazione GDPR completa, piano pedagogico validato e almeno 6 mesi di attività AI pregresse.',
    urgencyScore: 0.9,
    impactScore: 0.95,
    url: 'https://www.istruzione.it/pnrr',
    suggestedActivities: [
      'Laboratorio AI-literacy con studenti BES/DSA',
      'Produzione artefatti digitali con AI generativa',
      'Valutazione formativa automatizzata con feedback AI',
    ],
    budgetBreakdown: [
      { voce: 'Formazione docenti', percentuale: 30 },
      { voce: 'Licenze software AI', percentuale: 25 },
      { voce: 'Hardware e infrastruttura', percentuale: 20 },
      { voce: 'Materiali didattici', percentuale: 15 },
      { voce: 'Coordinamento e rendicontazione', percentuale: 10 },
    ],
  },
  {
    id: 'erasmus-plus-ka2-2025',
    titolo: 'Erasmus+ KA2 – Cooperazione per l\'innovazione digitale',
    ente: 'Commissione Europea / Agenzia Nazionale Erasmus+ (Indire)',
    scadenza: '2026-04-15',
    budget: '15.000–150.000 €',
    tipoProgetto: ['Curriculum Innovativo', 'Inclusione Digitale'],
    requisiti: [
      'Partnership con almeno 2 istituti europei',
      'Piano triennale di innovazione',
      'GDPR conforme (responsabile trattamento nominato)',
      'Documentazione bilingue IT/EN',
      'Budget dettagliato per voce',
    ],
    descrizione:
      'Progetto di cooperazione internazionale per l\'innovazione curricolare e l\'inclusione digitale. ' +
      'Favorisce metodologie STEM, coding, pensiero computazionale e accessibilità digitale.',
    urgencyScore: 0.75,
    impactScore: 0.85,
    url: 'https://erasmus-plus.ec.europa.eu',
    suggestedActivities: [
      'Gemellaggio virtuale con classi europee',
      'Progetto STEM condiviso in lingua inglese',
      'Produzione OER (Open Educational Resources)',
    ],
    budgetBreakdown: [
      { voce: 'Mobilità studenti e docenti', percentuale: 40 },
      { voce: 'Sviluppo materiali', percentuale: 30 },
      { voce: 'Gestione progetto', percentuale: 20 },
      { voce: 'Disseminazione', percentuale: 10 },
    ],
  },
  {
    id: 'pon-inclusione-2025',
    titolo: 'PON – Inclusione e accessibilità digitale',
    ente: 'MIM / Fondi Strutturali Europei',
    scadenza: '2026-05-31',
    budget: '20.000–80.000 €',
    tipoProgetto: ['Inclusione Digitale'],
    requisiti: [
      'Presenza alunni BES/DSA/H104 documentata',
      'PEI/PDP aggiornati',
      'GDPR: consenso esplicito famiglie per dati sensibili',
      'Referente per l\'inclusione nominato',
    ],
    descrizione:
      'Finanziamento per progetti che migliorano l\'inclusione di alunni con Bisogni Educativi Speciali ' +
      'tramite tecnologie assistive, AI e strumenti digitali accessibili.',
    urgencyScore: 0.8,
    impactScore: 0.88,
    url: 'https://www.istruzione.it/pon',
    suggestedActivities: [
      'Percorso AI-assistito per studenti DSA',
      'Laboratorio di tecnologie assistive',
      'Formazione famiglie su strumenti digitali inclusivi',
    ],
    budgetBreakdown: [
      { voce: 'Tecnologie assistive', percentuale: 35 },
      { voce: 'Formazione specializzata', percentuale: 30 },
      { voce: 'Materiali inclusivi', percentuale: 20 },
      { voce: 'Coordinamento', percentuale: 15 },
    ],
  },
  {
    id: 'miur-curriculum-2025',
    titolo: 'Fondo per il Merito – Curricolo Innovativo e Competenze Digitali',
    ente: 'MIM – Direzione Generale per gli Ordinamenti Scolastici',
    scadenza: '2026-07-15',
    budget: '10.000–60.000 €',
    tipoProgetto: ['Curriculum Innovativo'],
    requisiti: [
      'Piano curricolare documentato',
      'Collegamento con certificazioni digitali riconosciute (ECDL, IC3)',
      'Valutazione da rubrica allegata',
      'Rendicontazione per competenze',
    ],
    descrizione:
      'Sostegno a scuole che innovano il curricolo con competenze digitali certificate, ' +
      'pensiero critico, problem solving e didattica per competenze.',
    urgencyScore: 0.6,
    impactScore: 0.78,
    url: 'https://www.istruzione.it/curricolo',
    suggestedActivities: [
      'Percorso per competenza chiave "Competenza digitale"',
      'Utilizzo rubriche valutative MD3-align',
      'Portfolio digitale studente',
    ],
    budgetBreakdown: [
      { voce: 'Sviluppo curricolare', percentuale: 40 },
      { voce: 'Certificazioni esterne', percentuale: 30 },
      { voce: 'Valutazione e rendicontazione', percentuale: 30 },
    ],
  },
  {
    id: 'regionale-innovazione-2025',
    titolo: 'Bando Regionale – Scuole Innovative e Laboratori Digitali',
    ente: 'Regione (aggregato nazionale)',
    scadenza: '2026-09-30',
    budget: '5.000–30.000 €',
    tipoProgetto: ['Pilota AI', 'Curriculum Innovativo', 'Inclusione Digitale'],
    requisiti: [
      'Istituto nella regione promotrice',
      'Piano didattico allegato',
      'Almeno 1 docente con formazione digitale certificata',
    ],
    descrizione:
      'Bando regionale per la realizzazione di laboratori digitali, acquisto hardware e software didattico, ' +
      'e formazione docenti. Accessibile a singoli docenti con delega del dirigente scolastico.',
    urgencyScore: 0.5,
    impactScore: 0.65,
    url: 'https://www.regione.it/scuola-digitale',
    suggestedActivities: [
      'Acquisto tablet/device per classe',
      'Corso di aggiornamento docenti',
      'Allestimento laboratorio maker',
    ],
    budgetBreakdown: [
      { voce: 'Hardware', percentuale: 50 },
      { voce: 'Software licenze', percentuale: 25 },
      { voce: 'Formazione', percentuale: 25 },
    ],
  },
];

// ── Documenti standard per tipo di progetto ──────────────────────────────────

const DOCUMENTS_BY_TYPE: Record<ProjectType, string[]> = {
  'Pilota AI': [
    'Registro trattamenti dati GDPR art.30',
    'DPA (Data Processing Agreement) con fornitore AI',
    'Consenso informato famiglie/studenti maggiorenni',
    'Piano formazione docenti sull\'etica AI',
    'SPID del docente referente',
    'Dichiarazione accessibilità (Legge Stanca/WCAG 2.1 AA)',
    'Piano pedagogico di progetto (almeno 6 lezioni)',
    'Delibera del Consiglio di Istituto',
  ],
  'Curriculum Innovativo': [
    'Piano curricolare per competenze',
    'Rubrica di valutazione allegata',
    'Delibera del Collegio Docenti',
    'GDPR: informativa privacy studenti aggiornata',
    'Certificazione digitale docente referente',
    'Documentazione UDA collegate al progetto',
  ],
  'Inclusione Digitale': [
    'PEI/PDP aggiornati per alunni BES/DSA/H104',
    'GDPR: consenso esplicito per dati sensibili',
    'Referente per l\'inclusione (L. 104/92)',
    'Piano acquisto tecnologie assistive',
    'Rendicontazione accessibilità strumenti digitali',
    'Verifica accessibilità piattaforma (EN 301 549)',
    'SPID del dirigente scolastico',
  ],
};

// ── AI Maturità classifier ────────────────────────────────────────────────────

export function classifyAIMaturita(
  lessonCount: number,
  udaCount: number
): 'bassa' | 'media' | 'alta' {
  if (lessonCount >= 20 && udaCount >= 3) return 'alta';
  if (lessonCount >= 8 || udaCount >= 1) return 'media';
  return 'bassa';
}

// ── Ranking bandi ─────────────────────────────────────────────────────────────

function rankBandi(
  bandi: FundingOpportunity[],
  projectType: ProjectType,
  compliance: Partial<ComplianceCheck>,
  aiMaturita: 'bassa' | 'media' | 'alta'
): FundingOpportunity[] {
  const maturitaBonus = aiMaturita === 'alta' ? 0.15 : aiMaturita === 'media' ? 0.07 : 0;
  const complianceBonus =
    (compliance.gdpr ? 0.1 : 0) +
    (compliance.spid ? 0.07 : 0) +
    (compliance.dpa ? 0.07 : 0) +
    (compliance.sla ? 0.06 : 0);

  return [...bandi]
    .filter((b) => b.tipoProgetto.includes(projectType))
    .map((b) => ({
      ...b,
      urgencyScore: Math.min(1, b.urgencyScore + maturitaBonus),
      impactScore: Math.min(1, b.impactScore + complianceBonus),
    }))
    .sort((a, b) => b.impactScore * b.urgencyScore - a.impactScore * a.urgencyScore);
}

// ── Raccomandazioni AI ────────────────────────────────────────────────────────

function generateRecommendations(
  projectType: ProjectType,
  lessonCount: number,
  studentCount: number,
  aiMaturita: 'bassa' | 'media' | 'alta',
  rankedBandi: FundingOpportunity[]
): FundingRecommendation[] {
  const recs: FundingRecommendation[] = [];
  const topBando = rankedBandi[0];

  if (aiMaturita === 'bassa') {
    recs.push({
      id: 'rec-ai-literacy',
      titolo: 'Avvia un percorso di AI literacy',
      descrizione:
        'Prima di candidarsi a bandi AI, è consigliabile documentare almeno 8 lezioni strutturate ' +
        'con integrazione di strumenti digitali e 1 UDA progettata per competenze.',
      pedagogicValue: 'Costruisce le basi per una didattica digitale consapevole e trasferibile.',
      trustValue: 'Dimostra ai valutatori un approccio riflessivo e incrementale.',
      curriculumValue: 'Allinea il progetto alle indicazioni nazionali su competenze chiave europee.',
      priorita: 'alta',
      bandoId: topBando?.id,
    });
  }

  if (projectType === 'Pilota AI' || projectType === 'Curriculum Innovativo') {
    recs.push({
      id: 'rec-uda-align',
      titolo: 'Documenta le UDA collegate al progetto',
      descrizione:
        `Hai ${lessonCount} lezioni registrate. Collegale esplicitamente alle UDA di progetto per creare ` +
        'una traccia pedagogica verificabile dai valutatori.',
      pedagogicValue: 'Evidenzia la progressione dell\'apprendimento e la coerenza metodologica.',
      trustValue: 'Fornisce prove concrete di impatto su ' + studentCount + ' studenti.',
      curriculumValue: 'Soddisfa il requisito di rendicontazione didattica per la maggior parte dei bandi.',
      priorita: lessonCount < 6 ? 'alta' : 'media',
    });
  }

  if (projectType === 'Inclusione Digitale') {
    recs.push({
      id: 'rec-bes-doc',
      titolo: 'Documenta il percorso di inclusione digitale',
      descrizione:
        'Assicurati che i PEI/PDP degli alunni BES/DSA siano aggiornati e citino esplicitamente ' +
        'gli strumenti digitali utilizzati nel progetto.',
      pedagogicValue: 'Personalizzazione didattica documentata = maggiore punteggio nei criteri di valutazione.',
      trustValue: 'Tutela legale per scuola e famiglie (GDPR dati sensibili).',
      curriculumValue: 'Risponde ai BES specifici con strumenti certamente accessibili.',
      priorita: 'alta',
    });
  }

  if (studentCount > 15) {
    recs.push({
      id: 'rec-scale',
      titolo: 'Evidenzia la scala di impatto',
      descrizione:
        `Il tuo progetto coinvolge ${studentCount} studenti. Nei bandi ministeriali un campione ` +
        'numericamente significativo aumenta il punteggio di impatto.',
      pedagogicValue: 'Maggiore impatto = evidenza più solida per i commissari.',
      trustValue: 'Scalabilità del modello didattico verso altre classi.',
      curriculumValue: 'Possibilità di diffusione come buona pratica d\'istituto.',
      priorita: 'media',
    });
  }

  recs.push({
    id: 'rec-gdpr-complete',
    titolo: 'Completa il registro GDPR e il DPA',
    descrizione:
      'Ogni bando pubblico richiede che il trattamento dei dati alunni sia pienamente conforme. ' +
      'Il registro GDPR art.30 e il DPA con il fornitore AI sono requisiti eliminatori.',
    pedagogicValue: 'Un trattamento dati etico è prerequisito per qualsiasi didattica responsabile con AI.',
    trustValue: 'Protegge scuola, docenti e famiglie da sanzioni amministrative.',
    curriculumValue: 'Modello di governance dati replicabile in tutto l\'istituto.',
    priorita: 'alta',
  });

  return recs;
}

// ── Compute principale ────────────────────────────────────────────────────────

export function computeFundingReport(
  projectType: ProjectType,
  userProfile: UserFundingProfile,
  lessons: Lezione[],
  students: Studente[]
): FundingReport {
  const lessonCount = lessons.length;
  const studentCount = students.length;
  const udaIds = new Set(lessons.map((l) => l.udaId).filter(Boolean));
  const udaCount = udaIds.size;

  const aiMaturita = classifyAIMaturita(lessonCount, udaCount);

  const compliance: Partial<ComplianceCheck> = {
    gdpr: userProfile.hasGdprRegistry ?? false,
    spid: userProfile.hasSpid ?? false,
    dpa: userProfile.hasDpa ?? false,
    sla: userProfile.hasSla ?? false,
  };

  const complianceScore =
    ((compliance.gdpr ? 1 : 0) +
      (compliance.spid ? 1 : 0) +
      (compliance.dpa ? 1 : 0) +
      (compliance.sla ? 1 : 0)) /
    4;

  const rankedBandi = rankBandi(BANDI_CATALOGO, projectType, compliance, aiMaturita);

  const urgencyScore =
    rankedBandi.length > 0
      ? rankedBandi.reduce((sum, b) => sum + b.urgencyScore, 0) / rankedBandi.length
      : 0;

  const recommendations = generateRecommendations(
    projectType,
    lessonCount,
    studentCount,
    aiMaturita,
    rankedBandi
  );

  const documentsNeeded = DOCUMENTS_BY_TYPE[projectType];

  return {
    projectType,
    urgencyScore,
    complianceScore,
    fundingOpportunities: rankedBandi,
    recommendations,
    documentsNeeded,
    generatedAt: new Date().toISOString(),
    contextStats: {
      lessonCount,
      studentCount,
      udaCount,
      aiMaturita,
    },
  };
}

// ── Bozza candidatura ─────────────────────────────────────────────────────────

export function generateCandidaturaDraft(
  bando: FundingOpportunity,
  projectType: ProjectType,
  userProfile: UserFundingProfile,
  lessonCount: number,
  studentCount: number
): string {
  const istituto = userProfile.istituto ?? 'Istituto Scolastico';
  const classe = userProfile.className;
  const regione = userProfile.regione ?? 'Italia';

  return `BOZZA CANDIDATURA — ${bando.titolo}
Ente erogatore: ${bando.ente}
Scadenza: ${bando.scadenza}
─────────────────────────────────────────────────

SEZIONE 1 — DESCRIZIONE DEL PROGETTO
Tipo progetto: ${projectType}
Titolo progetto: Innovazione Didattica con AI per la classe ${classe}

L'${istituto}, situato in ${regione}, intende realizzare un progetto di "${projectType}" 
rivolto agli studenti della classe ${classe} (${studentCount} alunni).

Il progetto si fonda su una base didattica documentata di ${lessonCount} lezioni strutturate, 
integrate con strumenti di intelligenza artificiale per personalizzare il percorso di apprendimento, 
migliorare i feedback formativi e favorire l'inclusione digitale.

SEZIONE 2 — OBIETTIVI
• Sviluppare competenze digitali critiche e responsabili negli studenti.
• Introdurre metodologie didattiche innovative supportate da AI.
• Garantire accessibilità e inclusività per tutti gli alunni, inclusi BES/DSA.
• Promuovere la collaborazione scuola-famiglia attraverso trasparenza e comunicazione digitale.

SEZIONE 3 — METODOLOGIA
Il progetto adotta un approccio per competenze, con UDA strutturate secondo le Indicazioni Nazionali, 
valutazione formativa continua con rubriche, e integrazione etica di strumenti AI nel rispetto del GDPR.

SEZIONE 4 — REQUISITI DI COMPLIANCE
${bando.requisiti.map((r) => `• ${r}`).join('\n')}

SEZIONE 5 — RISULTATI ATTESI
• ${studentCount} studenti con competenze digitali certificate.
• Documentazione didattica open-source replicabile.
• Riduzione del divario digitale nella classe di riferimento.
• Modello scalabile ad altri istituti della rete scolastica.

SEZIONE 6 — BUDGET INDICATIVO
Budget richiesto: ${bando.budget}
${bando.budgetBreakdown ? bando.budgetBreakdown.map((v) => `• ${v.voce}: ${v.percentuale}%`).join('\n') : '• Da definire in sede di progetto esecutivo.'}

─────────────────────────────────────────────────
NOTA: Questa è una BOZZA generata automaticamente da DocenteDoc AI.
Rivedere e personalizzare prima dell'invio ufficiale.
Verificare l'aggiornamento di tutti i documenti allegati richiesti.
`;
}

// ── Simulazione approvazione ──────────────────────────────────────────────────

export function simulateApprovazione(
  bando: FundingOpportunity,
  compliance: ComplianceCheck,
  lessonCount: number,
  studentCount: number,
  aiMaturita: 'bassa' | 'media' | 'alta'
): ApprovazioneSimulation {
  let probabilita = 0.3; // base
  const fattoriPositivi: string[] = [];
  const fattoriRischio: string[] = [];
  const suggerimenti: string[] = [];

  // Compliance
  if (compliance.gdpr) { probabilita += 0.12; fattoriPositivi.push('GDPR conforme'); }
  else { fattoriRischio.push('GDPR incompleto — requisito eliminatorio'); }

  if (compliance.spid) { probabilita += 0.08; fattoriPositivi.push('SPID verificato'); }
  else { fattoriRischio.push('SPID mancante — necessario per candidatura PA'); }

  if (compliance.dpa) { probabilita += 0.08; fattoriPositivi.push('DPA AI firmato'); }
  else { fattoriRischio.push('DPA non firmato con fornitore AI'); suggerimenti.push('Richiedere DPA al fornitore entro 2 settimane'); }

  if (compliance.sla) { probabilita += 0.05; fattoriPositivi.push('Dichiarazione accessibilità presente'); }
  else { suggerimenti.push('Predisporre dichiarazione accessibilità (WCAG 2.1 AA)'); }

  // Maturità AI
  if (aiMaturita === 'alta') { probabilita += 0.15; fattoriPositivi.push('Maturità AI alta (20+ lezioni, 3+ UDA)'); }
  else if (aiMaturita === 'media') { probabilita += 0.07; fattoriPositivi.push('Maturità AI media'); }
  else { fattoriRischio.push('Poca esperienza AI documentata'); suggerimenti.push('Documentare almeno 8 lezioni con AI prima di candidarsi'); }

  // Dimensione classe
  if (studentCount >= 15) { probabilita += 0.05; fattoriPositivi.push(`Classe numerosa (${studentCount} studenti) — maggiore impatto`); }
  if (lessonCount >= 10) { probabilita += 0.07; fattoriPositivi.push(`${lessonCount} lezioni documentate`); }
  else { suggerimenti.push(`Documentare più lezioni (attualmente ${lessonCount}, target: 10+)`); }

  // Impatto bando
  probabilita = Math.min(0.95, probabilita * (0.5 + bando.impactScore * 0.5));

  return {
    bandoId: bando.id,
    probabilita: Math.round(probabilita * 100) / 100,
    fattoriPositivi,
    fattoriRischio,
    suggerimenti,
  };
}

// ── Mock API ministeriale ─────────────────────────────────────────────────────

/**
 * Simula aggiornamento bandi da API ministeriale.
 * In produzione: fetch('https://api.istruzione.gov.it/bandi')
 */
export async function refreshBandiFromAPI(): Promise<FundingOpportunity[]> {
  // Simula latenza API
  await new Promise((resolve) => setTimeout(resolve, 800));
  // Ritorna il catalogo mock con timestamp aggiornato
  return BANDI_CATALOGO.map((b) => ({ ...b }));
}
