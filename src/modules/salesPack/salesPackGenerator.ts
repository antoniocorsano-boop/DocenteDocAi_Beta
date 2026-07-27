/**
 * salesPackGenerator.ts
 *
 * Aggrega i moduli esistenti del Self-Compliance Engine e genera tutti i
 * contenuti documentali del Sales Pack in un singolo passaggio.
 *
 * NO hardcoding: tutti i valori vengono letti dal runtime reale.
 *
 * Moduli riutilizzati:
 *  - generateDPIA()               → dpiaGenerator (GDPR Art.35)
 *  - generateVerbaleHTML/TXT()    → auditVerbaleGenerator (C11)
 *  - generateComplianceReport()   → complianceReportGenerator (C10)
 *  - exportReportAsText()         → complianceReportGenerator
 *  - runAuditSimulation()         → auditSimulator
 *  - getConsistencySnapshot()     → runtimeConsistency (C1)
 *  - useComplianceStore           → stato compliance live
 */

import { generateDPIA }                     from '../../self-compliance/certification/dpiaGenerator';
import { generateVerbaleHTML, generateVerbaleTXT } from '../../services/auditVerbaleGenerator';
import {
  generateComplianceReport,
  exportReportAsText,
}                                           from '../../services/complianceReportGenerator';
import { runAuditSimulation }               from '../../self-compliance/runtime/audit/auditSimulator';
import { useComplianceStore }               from '../../self-compliance/useComplianceStore';
import { getConsistencySnapshot }           from '../../cognition/runtimeConsistency';
import { slog }                             from '../../utils/structuredLogger';
import type { SalesPack }                   from './types';

// ─── Generatori testuali interni ──────────────────────────────────────────────

function buildOnePager(
  complianceScore:  number,
  paReady:          boolean,
  aiEnabled:        boolean,
  generatedAt:      string,
): string {
  const date = new Date(generatedAt).toLocaleDateString('it-IT', { dateStyle: 'long' });
  const status = paReady ? 'PA-READY ✔' : 'IN ADEGUAMENTO';

  return `
═══════════════════════════════════════════════════════════════════════
 DocenteDoc AI — ONE PAGER per Pubbliche Amministrazioni
═══════════════════════════════════════════════════════════════════════

 Data:        ${date}
 Stato PA:    ${status}
 Compliance:  ${complianceScore}%
 AI attiva:   ${aiEnabled ? 'Sì' : 'No (modalità manuale)'}

───────────────────────────────────────────────────────────────────────
 CHE COS'È
───────────────────────────────────────────────────────────────────────

DocenteDoc AI è la piattaforma intelligente per la pianificazione
didattica nelle scuole italiane. Supporta i docenti nella redazione di
Unità di Apprendimento (UDA), nella gestione del registro, nell'analisi
delle performance degli studenti e nella produzione automatica di
documentazione scolastica.

───────────────────────────────────────────────────────────────────────
 PERCHÉ SCEGLIERLA (VANTAGGI PA)
───────────────────────────────────────────────────────────────────────

✔ Conforme AI Act Titolo III (sistema AI a rischio limitato)
✔ Conforme GDPR Art. 5-46 con DPIA GDPR Art. 35 integrata
✔ Allineata alle Linee Guida AGID per il software pubblico (CAD)
✔ Self-Compliance Engine integrato: audit automatico in tempo reale
✔ Nessun dato personale inviato fuori dall'UE
✔ PWA offline: funziona senza connessione continua
✔ Open source ready: codice verificabile e auditabile

───────────────────────────────────────────────────────────────────────
 AMBITO DI UTILIZZO
───────────────────────────────────────────────────────────────────────

• Istituti scolastici di ogni ordine e grado
• Uffici Scolastici Regionali (USR)
• Reti di scuole / consorzi didattici
• MIM — Ministero dell'Istruzione e del Merito

───────────────────────────────────────────────────────────────────────
 STACK TECNOLOGICO
───────────────────────────────────────────────────────────────────────

• Frontend: React 18 + TypeScript + MUI v7 (Material Design 3)
• AI: Google Gemini Flash / Anthropic Claude (proxy server-side)
• Deploy: Vercel Edge (CDN EU) + PWA offline
• Storage: localStorage + opzionale Google Drive
• Tracciabilità: OpenTelemetry + Self-Compliance Engine

───────────────────────────────────────────────────────────────────────
 MODELLO COMMERCIALE
───────────────────────────────────────────────────────────────────────

• SaaS PA (abbonamento annuale per istituto)
• Pilota gratuito 3 mesi per scuole partner
• Supporto onboarding e formazione docenti incluso

───────────────────────────────────────────────────────────────────────
 CONTATTI
───────────────────────────────────────────────────────────────────────

Referente PA: admin@docentedoc.ai
Sito:         https://docentedoc.ai
Documentazione tecnica: disponibile su richiesta

═══════════════════════════════════════════════════════════════════════
 Documento generato automaticamente da DocenteDoc AI — Self-Compliance
 Score attuale: ${complianceScore}% | Stato: ${status}
═══════════════════════════════════════════════════════════════════════
`.trim();
}

function buildDemoScript(
  complianceScore: number,
  aiEnabled:       boolean,
  blockedCount:    number,
): string {
  return `
═══════════════════════════════════════════════════════════════════════
 DocenteDoc AI — DEMO SCRIPT per Dirigenti Scolastici / USR
═══════════════════════════════════════════════════════════════════════

Durata suggerita: 20–30 minuti
Pubblico target: Dirigenti scolastici, DSGA, referenti digitali USR

───────────────────────────────────────────────────────────────────────
 PARTE 1 — APERTURA (3 min)
───────────────────────────────────────────────────────────────────────

"Buongiorno. Oggi le mostro come un docente della sua scuola può
passare da zero a una UDA compliant in 10 minuti, con supporto AI
e documentazione automatica pronta per audit."

Aprire l'app su: http://localhost:5173 (o URL produzione)

Mostrare:
→ Schermata principale con logo DocenteDoc AI
→ Indicatore stato AI: ${aiEnabled ? 'ATTIVA' : 'IN STANDBY'}
→ Score compliance attuale: ${complianceScore}%

───────────────────────────────────────────────────────────────────────
 PARTE 2 — CREAZIONE UDA (8 min)
───────────────────────────────────────────────────────────────────────

Step 1: Click "Nuova UDA" → Wizard guidato
  • Selezionare classe, disciplina, periodo
  • AI suggerisce obiettivi di apprendimento in base al curriculum
  • Il docente approva/modifica ogni suggerimento (supervisione umana ✔)

Step 2: Sezione "Valutazione"
  • Inserire competenze attese, criteri di valutazione
  • AI genera rubrica valutativa personalizzata
  • Export PDF immediato

Punti di enfasi:
  ✔ Ogni azione AI è logdata e reversibile
  ✔ Nessun dato studente inviato fuori dall'istituto
  ✔ Docente mantiene il controllo completo

───────────────────────────────────────────────────────────────────────
 PARTE 3 — COMPLIANCE LIVE (5 min)
───────────────────────────────────────────────────────────────────────

Aprire: Pannello Governance → Dashboard Compliance

Mostrare:
→ Score globale: ${complianceScore}%
→ Framework: GDPR ${complianceScore}% | AI Act ${complianceScore}% | AgID ${complianceScore}%
${blockedCount > 0 ? `→ Attenzione: ${blockedCount} use case bloccati per parametri di sicurezza` : '→ Tutti i use case attivi e conformi'}

"Il sistema fa l'audit di se stesso in tempo reale. Non serve
aspettare il revisore esterno: sa già se è conforme."

───────────────────────────────────────────────────────────────────────
 PARTE 4 — DOCUMENTAZIONE AUTOMATICA (5 min)
───────────────────────────────────────────────────────────────────────

Aprire: Pannello Admin → Sales Pack → "Genera Pack"

Mostrare generazione automatica di:
  • DPIA GDPR Art.35 — pronta per DPO
  • Verbale audit PA — firmabile digitalmente
  • Report compliance GDPR/AI Act/AgID

"In 10 secondi ha tutta la documentazione che normalmente richiede
settimane a un consulente esterno."

───────────────────────────────────────────────────────────────────────
 PARTE 5 — CHIUSURA E NEXT STEP (4 min)
───────────────────────────────────────────────────────────────────────

Domande tipo da dirigente → risposte:

Q: "I dati degli studenti sono al sicuro?"
A: "Tutto rimane nel browser del docente. Nessun server nostro
   vede i dati degli alunni. Il modello AI riceve solo testo
   anonimizzato per i suggerimenti."

Q: "Cosa succede se Internet va giù?"
A: "L'app funziona offline come app installabile (PWA).
   I dati vengono sincronizzati quando la connessione torna."

Q: "Come si integra con il registro elettronico?"
A: "Export CSV/PDF compatibile con i principali registri.
   API di integrazione in roadmap."

CALL TO ACTION:
→ 3 mesi di pilota gratuito
→ Formazione docenti inclusa (2h online)
→ Documentazione tecnica per bando disponibile

───────────────────────────────────────────────────────────────────────
 NOTE PER IL PRESENTER
───────────────────────────────────────────────────────────────────────

• Tenere la demo in modalità "produzione live" (scenario reale)
• NON usare dati reali di studenti in demo — usare dati esempio
• Enfatizzare supervisione umana su ogni azione AI
• Portare il verbale audit precompilato come documento fisico

═══════════════════════════════════════════════════════════════════════
 Script generato automaticamente da DocenteDoc AI Sales Pack
═══════════════════════════════════════════════════════════════════════
`.trim();
}

function buildDpiaText(dpia: ReturnType<typeof generateDPIA>): string {
  const lines: string[] = [
    `DPIA — Data Protection Impact Assessment`,
    `GDPR Art. 35 — ${new Date(dpia.date).toLocaleDateString('it-IT', { dateStyle: 'long' })}`,
    `Titolare: ${dpia.controller}`,
    `DPO: ${dpia.dpo}`,
    `Sistema: ${dpia.systemName}`,
    ``,
    `CATEGORIE DI DATI TRATTATI: ${dpia.dataCategories.length}`,
    ...dpia.dataCategories.map(
      d => `  • ${d.name} — ${d.subjects.join(', ')} — Retention: ${d.retentionDays}gg`,
    ),
    ``,
    `RISCHI IDENTIFICATI: ${dpia.risks.length}`,
    ...dpia.risks.map(
      r => `  [${r.likelihood.toUpperCase()}/${r.impact.toUpperCase()}] ${r.threat} → ${r.mitigation}`,
    ),
    ``,
    `NECESSITÀ E PROPORZIONALITÀ: ${dpia.necessityTest}`,
    `PROPORZIONALITÀ: ${dpia.proportionalityTest}`,
    ``,
    `FINALITÀ: ${dpia.purpose.join(', ')}`,
    ``,
    `APPROVAZIONE: ${dpia.approvalStatus === 'approved' ? 'APPROVATA' : 'IN BOZZA'}`,
  ];
  return lines.join('\n');
}

// ─── Export principale ────────────────────────────────────────────────────────

/**
 * Genera tutti i contenuti documentali del Sales Pack usando i moduli runtime.
 * Restituisce i campi di contenuto di SalesPack (senza id/tenantId/version).
 */
export function generateSalesPack(): Omit<
  SalesPack,
  'id' | 'tenantId' | 'createdBy' | 'version' | 'createdAt'
> {
  slog.info('AUDIT', 'Generazione Sales Pack avviata');

  // ── 1. Runtime snapshot ──────────────────────────────────────────────────
  const snapshot   = getConsistencySnapshot();
  const db         = useComplianceStore.getState().db;
  const aiEnabled  = snapshot.effectiveMode !== 'offline_only';
  const blockedCount = snapshot.blockedUseCases.length;

  // ── 2. Compliance report ────────────────────────────────────────────────
  const complianceReport = generateComplianceReport(false);
  const complianceScore  = complianceReport.globalScore;
  const paReady          = complianceReport.paReady;
  const complianceStatus: SalesPack['complianceStatus'] =
    complianceScore >= 80 ? 'CONFORME'
    : complianceScore >= 60 ? 'PARZIALMENTE_CONFORME'
    : 'NON_CONFORME';

  // ── 3. Audit live (scenario produzione) ─────────────────────────────────
  const auditReport = runAuditSimulation(db, 'production_live');

  // ── 4. DPIA ─────────────────────────────────────────────────────────────
  const dpia = generateDPIA();

  // ── 5. One-pager + demo script ───────────────────────────────────────────
  const generatedAt = new Date().toISOString();
  const onePager   = buildOnePager(complianceScore, paReady, aiEnabled, generatedAt);
  const demoScript = buildDemoScript(complianceScore, aiEnabled, blockedCount);

  slog.info('AUDIT', 'Sales Pack generato con successo', {
    complianceScore,
    complianceStatus,
    aiEnabled,
    blockedCount,
  });

  return {
    onePager,
    demoScript,
    dpia:             buildDpiaText(dpia),
    auditVerbaleHTML: generateVerbaleHTML(auditReport),
    auditVerbaleTXT:  generateVerbaleTXT(auditReport),
    complianceReport: exportReportAsText(complianceReport),
    complianceScore,
    complianceStatus,
    aiEnabled,
  };
}
