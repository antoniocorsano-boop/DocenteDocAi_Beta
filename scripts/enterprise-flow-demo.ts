/**
 * enterprise-flow-demo.ts
 *
 * Dimostrazione end-to-end del flusso Enterprise CopilotDoc.
 *
 * Simula il ciclo completo:
 *   Documento MIUR → RegulatoryAgent → Report → ApprovalGate (HITL multi-livello)
 *   → KG Enterprise update → Pipeline agenti specializzati
 *   → Dashboard insights → Automazioni soft/critiche → Compliance report
 *
 * Esecuzione (Node/ts-node, fuori dalla SPA — solo per demo/sviluppo):
 *   npx ts-node --project tsconfig.json scripts/enterprise-flow-demo.ts
 *
 * NOTA: importa servizi enterprise che usano localStorage internamente.
 * In Node, localStorage è assente → le chiamate di persistenza sono gestite
 * con try/catch nel codice dei servizi. I risultati in-memory sono completi.
 */

// ── Polyfill localStorage per Node ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof globalThis.localStorage === 'undefined') {
  const _store: Record<string, string> = {};
  // @ts-expect-error – localStorage polyfill per ambiente Node
  globalThis.localStorage = {
    getItem:    (k: string) => _store[k] ?? null,
    setItem:    (k: string, v: string) => { _store[k] = v; },
    removeItem: (k: string) => { delete _store[k]; },
    clear:      () => { Object.keys(_store).forEach(k => delete _store[k]); },
  };
}

import {
  enterpriseOrchestrator,
  approvalGate,
  enterpriseAuditLog,
} from '../src/services/enterprise/index';
import { decisionMemory }           from '../src/cognition/decisionMemory';
import {
  getCopilotPrimaryAction,
  getTopSecondaryActions,
} from '../src/cognition/copilotBrain';
import { executeCopilotAction } from '../src/cognition/executeCopilotAction';
import type {
  RegulatoryDocument,
  EnterpriseWorkflowSession,
} from '../src/types/enterprise.types';

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTO NORMATIVO SIMULATO — Circolare MIUR 2026
// ─────────────────────────────────────────────────────────────────────────────

const DOCUMENTO_MIUR: RegulatoryDocument = {
  id:            'miur_circ_2026_003',
  source:        'miur',
  title:         'Circolare MIUR n. 3/2026 — Aggiornamento valutazione competenze digitali',
  referenceCode: 'MIUR.AOODGOSV.REGISTRO UFFICIALE(U).0000003.03-03-2026',
  rawText: `
MINISTERO DELL'ISTRUZIONE E DEL MERITO
Circolare n. 3 del 3 marzo 2026

OGGETTO: Linee operative per la valutazione delle competenze digitali degli studenti
ai sensi del GDPR EU 2016/679, ISO 27001, D.Lgs. 196/2003 e AgID.

Art. 1 – Ambito di applicazione
La presente circolare si applica a tutti gli istituti scolastici di ogni ordine e grado.
Le scuole sono tenute ad adeguare i piani di valutazione entro il 30 giugno 2026.

Art. 2 – Competenze digitali obbligatorie
A partire dall'anno scolastico 2026/2027 è obbligatoria la valutazione delle
competenze digitali secondo il framework DigComp 2.2:
  1. Informazioni e dati
  2. Comunicazione e collaborazione
  3. Creazione di contenuti digitali
  4. Sicurezza (trattamento dati personali, GDPR)
  5. Risoluzione di problemi

Art. 3 – Protezione dei dati personali
Tutte le valutazioni devono rispettare il GDPR EU 2016/679 e il D.Lgs. 196/2003.
I dati degli studenti minorenni sono soggetti a protezione rafforzata.
I report aggregati devono essere resi disponibili all'AgID per il monitoraggio
della trasformazione digitale scolastica (D.Lgs. 82/2005 — Codice Amministrazione Digitale).

Art. 4 – Adempimenti istituzionali
Ogni dirigente scolastico approva il piano di adeguamento entro 60 giorni.
La rendicontazione è trasmessa via PEC con firma digitale ai sensi del CAC.

Firmato: Il Ministro dell'Istruzione e del Merito
`,
  issuedAt:  '2026-03-03T10:00:00.000Z',
  tenantId:  'istituto_demo_001',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES DEMO
// ─────────────────────────────────────────────────────────────────────────────

function section(title: string): void {
  console.log('\n' + '═'.repeat(72));
  console.log(`  ${title}`);
  console.log('═'.repeat(72));
}

function sub(label: string, value: unknown): void {
  const str = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  console.log(`\n  ▸ ${label}:`);
  str.split('\n').forEach(l => console.log(`    ${l}`));
}

function ok(msg: string): void  { console.log(`\n  ✅  ${msg}`); }
function warn(msg: string): void { console.log(`\n  ⚠️   ${msg}`); }
function info(msg: string): void { console.log(`\n  ℹ️   ${msg}`); }

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DEMO
// ─────────────────────────────────────────────────────────────────────────────

async function runEnterpriseFlowDemo(): Promise<void> {
  console.log('\n🏛️  CopilotDoc Enterprise — Demo flusso completo');
  console.log('   Documento: Circolare MIUR n. 3/2026');
  console.log('   Tenant:    istituto_demo_001');
  console.log('   Data:      ' + new Date().toLocaleString('it-IT'));

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 1 — REGULATORY AGENT: Parsing documento MIUR');
  // ──────────────────────────────────────────────────────────────────────────

  info('Invio documento al RegulatoryAgent tramite EnterpriseOrchestrator...');

  const session: EnterpriseWorkflowSession =
    enterpriseOrchestrator.processRegulatoryDocument(DOCUMENTO_MIUR);

  ok(`Sessione creata: ${session.id}`);

  const regResult = session.regulatoryResult;
  if (!regResult) {
    warn('Nessun risultato dal RegulatoryAgent — interruzione.');
    return;
  }

  sub('Sommario RegulatoryAgent', regResult.summary);

  const normRefs = (regResult.data['normativeRefs'] as { standard: string; article?: string; description: string }[] | undefined) ?? [];
  sub('Riferimenti normativi estratti', normRefs.map(r =>
    `  [${r.standard}]${r.article ? ' Art.' + r.article : ''} — ${r.description}`
  ).join('\n') || '  (nessuno rilevato)');

  const kgStubs = (regResult.data['kgNodeStubs'] as { id: string; label: string; type: string }[] | undefined) ?? [];
  sub('Nodi KG in staging', kgStubs.map(n => `  ${n.id} | ${n.type} | ${n.label}`).join('\n') || '  (nessuno)');

  const recommendations = regResult.recommendations ?? [];
  sub('Raccomandazioni', recommendations.map((r, i) => `  ${i + 1}. ${r}`).join('\n') || '  (nessuna)');

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 2 — APPROVAL GATE: Richiesta approvazione multi-livello');
  // ──────────────────────────────────────────────────────────────────────────

  const approvalReq = session.approvalRequest;
  if (!approvalReq) {
    warn('Nessuna ApprovalRequest generata — il documento non richiede approvazione.');
    info('Salto direttamente alla pipeline agenti...');
  } else {
    sub('ApprovalRequest', {
      id:            approvalReq.id,
      title:         approvalReq.title,
      requiredLevel: approvalReq.requiredLevel,
      chain:         approvalReq.approvalChain,
      kgImpact:      approvalReq.kgImpact,
      status:        approvalReq.status,
    });

    info('Simulazione approvazione a cascata (segreteria → dirigente)...');

    // Level 1: Segreteria
    info('Livello 1 — Segreteria: Dott.ssa Moretti approva report normativa...');
    const res1 = approvalGate.resolve(
      approvalReq.id,
      'segreteria',
      'approved',
      'Dott.ssa Moretti (Segreteria)',
      'Circolare regolare, documento autentico MIUR verificato.',
    );
    if (res1) {
      ok(`Approvazione Segreteria registrata — ${res1.resolvedAt}`);
    } else {
      warn('Approvazione Segreteria fallita (request non trovata o già chiusa).');
    }

    // Level 2: Dirigente
    info('Livello 2 — Dirigente: Prof. Bianchi approva aggiornamento KG...');
    const res2 = approvalGate.resolve(
      approvalReq.id,
      'dirigente',
      'approved',
      'Prof. Bianchi (Dirigente Scolastico)',
      'Confermo adeguamento piano digitale. Procedere con update KG.',
    );
    if (res2) {
      ok(`Approvazione Dirigente registrata — ${res2.resolvedAt}`);
    } else {
      warn('Approvazione Dirigente: catena multi-step richiede livello superiore (normale).');
    }

    const pending = approvalGate.getPending();
    if (pending.some(r => r.id === approvalReq.id)) {
      info(`Richiesta ${approvalReq.id} ancora pending — ulteriori livelli richiesti.`);
    } else {
      ok(`Catena approvativa completata per ${approvalReq.id}.`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 3 — KG UPDATE + PIPELINE AGENTI SPECIALIZZATI');
  // ──────────────────────────────────────────────────────────────────────────

  info('Esecuzione pipeline agenti post-approvazione (approvedBy: Prof. Bianchi)...');

  const sessionPost = enterpriseOrchestrator.runAgentPipeline(session, 'Prof. Bianchi (Dirigente)');

  ok(`Pipeline completata — ${sessionPost.agentResults.length} agenti eseguiti`);

  for (const result of sessionPost.agentResults) {
    const icon = result.ok ? '✅' : '⚠️ ';
    console.log(`\n  ${icon} [${result.agentRole.toUpperCase()}] ${result.summary}`);
    if (result.recommendations?.length) {
      result.recommendations.slice(0, 2).forEach(r => console.log(`       → ${r}`));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 4 — DASHBOARD INSIGHTS (multi-livello)');
  // ──────────────────────────────────────────────────────────────────────────

  const insights = sessionPost.dashboardInsights;
  info(`${insights.length} insight generati per i livelli dashboard:`);

  const byLevel: Record<string, typeof insights> = {};
  for (const ins of insights) {
    byLevel[ins.level] = byLevel[ins.level] ?? [];
    byLevel[ins.level].push(ins);
  }

  const levelLabels: Record<string, string> = {
    segreteria: '👩‍💼 Segreteria',
    dirigente:  '🏫 Dirigente',
    ministry:   '🏛️  Ministero',
    governo:    '🇮🇹 Governo',
  };

  for (const [level, ins] of Object.entries(byLevel)) {
    console.log(`\n  ${levelLabels[level] ?? level}`);
    ins.forEach(i => {
      const trend = i.trend === 'up' ? '↑' : i.trend === 'down' ? '↓' : '—';
      const alert = i.alert ? ' 🔴' : '';
      const val   = i.value !== undefined ? ` [${i.value}]` : '';
      console.log(`    • ${i.title}${val} ${trend}${alert}`);
      if (i.metric) console.log(`      metrica: ${i.metric}`);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 5 — AUTOMAZIONI SOFT / CRITICHE');
  // ──────────────────────────────────────────────────────────────────────────

  const actions = sessionPost.automationActions;
  info(`${actions.length} azioni di automazione generate:`);

  const softActions     = actions.filter(a => a.tier === 'soft');
  const criticalActions = actions.filter(a => a.tier === 'critical');

  console.log(`\n  🟢 Automazioni SOFT (auto-execute): ${softActions.length}`);
  softActions.slice(0, 3).forEach(a =>
    console.log(`    • [${a.triggeredByAgent}] ${a.title}`)
  );

  console.log(`\n  🔴 Automazioni CRITICHE (approvazione richiesta): ${criticalActions.length}`);
  criticalActions.forEach(a =>
    console.log(`    • [${a.triggeredByAgent}] ${a.title} — livello: ${a.approvalLevel ?? 'N/A'}`)
  );

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 6 — AUDIT LOG (estratto ultimi eventi)');
  // ──────────────────────────────────────────────────────────────────────────

  const auditEntries = enterpriseAuditLog.getLast(8);
  info(`Ultimi ${auditEntries.length} eventi nel log di audit:`);

  auditEntries.forEach((entry, i) => {
    const time = new Date(entry.timestamp).toLocaleTimeString('it-IT');
    const role = entry.agentRole ? `[${entry.agentRole}]` : '[sistema]';
    const tags = entry.complianceTags?.length ? ` (${entry.complianceTags.join(', ')})` : '';
    console.log(`    ${i + 1}. ${time} ${role} ${entry.action}${tags}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 7 — COMPLIANCE REPORT FINALE');
  // ──────────────────────────────────────────────────────────────────────────

  const report = enterpriseOrchestrator.getComplianceReport('istituto_demo_001');

  sub('Compliance report', {
    generatedAt:      report.generatedAt,
    auditLogSize:     report.auditLogSize,
    approvedChanges:  report.approvedChanges,
    pendingApprovals: report.pendingApprovals,
  });

  console.log('\n  Standard verificati:');
  report.standards.forEach(s => {
    const icon = s.status === 'compliant' ? '✅' : s.status === 'partial' ? '⚠️ ' : '❓';
    console.log(`    ${icon} ${s.standard} — ${s.status}`);
    if (s.notes) console.log(`       ${s.notes}`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 8 — COPILOT BRAIN: l\'azione giusta al momento giusto');
  // ──────────────────────────────────────────────────────────────────────────

  info('CopilotBrain legge DecisionMemory + ApprovalGate + store → calcola la prossima azione...');

  // The brain automatically reads decisionMemory (signals emitted in steps 1-7),
  // approvalGate (pending count), and teacher/student stores (default in Node demo).
  const primary     = getCopilotPrimaryAction();
  const secondaries = getTopSecondaryActions();

  sub('AZIONE PRIMARIA', {
    id:               primary.id,
    title:            primary.title,
    description:      primary.description,
    priority:         primary.priority,
    type:             primary.type,
    requiresApproval: primary.requiresApproval ?? false,
  });

  if (secondaries.length > 0) {
    sub('AZIONI SECONDARIE', secondaries.map((s, i) =>
      `${i + 1}. [${s.priority.toUpperCase()}] ${s.title} (${s.type})`
    ).join('\n'));
  } else {
    info('Nessuna azione secondaria — priorità gestita interamente dalla primaria.');
  }

  // Show what DecisionMemory collected during the pipeline run
  const dmState    = decisionMemory.getState();
  const allSignals = decisionMemory.getSignals();
  sub('DecisionMemory — segnali accumulati', allSignals.length > 0
    ? allSignals.map(s => `[${s.severity.toUpperCase()}] ${s.type}: ${s.message}`).join('\n')
    : '(nessun segnale attivo)');

  sub('DecisionMemory — flussi attivi', dmState.activeFlows.length > 0
    ? dmState.activeFlows.join(', ')
    : '(nessun flusso attivo)');

  const urgencyIcon = primary.priority === 'high' ? '🔴' : primary.priority === 'medium' ? '🟡' : '🟢';
  ok(`Brain → ${urgencyIcon} "${primary.title}"${primary.requiresApproval ? ' — richiede approvazione' : ''}`);

  // ──────────────────────────────────────────────────────────────────────────
  section('STEP 9 — EXECUTE COPILOT ACTION: gateway di esecuzione sicura');
  // ──────────────────────────────────────────────────────────────────────────

  info('Simulazione click utente su azione primaria → executeCopilotAction()...');

  const execCtx = { userId: 'prof.demo', tenantId: DOCUMENTO_MIUR.tenantId };

  // Scenario A — soft action (should execute)
  const softAction = secondaries[0] ?? primary;
  const softResult = executeCopilotAction({ ...softAction, requiresApproval: false }, execCtx);
  sub('Scenario A — azione soft', {
    input:      softAction.title,
    status:     softResult.status,
    message:    softResult.message,
    navigateTo: softResult.navigateTo ?? '(nessuna navigazione)',
  });
  if (softResult.status === 'executed') ok('Azione soft eseguita — audit + segnale emessi.');

  // Scenario B — action requiring approval
  const approvalAction = { ...primary, requiresApproval: true };
  const approvalResult = executeCopilotAction(approvalAction, execCtx);
  sub('Scenario B — azione con approvazione', {
    input:             approvalAction.title,
    status:            approvalResult.status,
    message:           approvalResult.message,
    approvalRequestId: approvalResult.approvalRequestId ?? '(N/A)',
  });
  if (approvalResult.status === 'pending_approval') {
    ok('HITL gate attivato — request inviata all\'ApprovalGate.');
    info(`Pending approvals dopo step 9: ${approvalGate.getPendingCount()}`);
  }

  // Scenario C — blocked by compliance (simulate critical GDPR)
  decisionMemory.updateComplianceStatus('gdpr', 'critical');
  const blockedResult = executeCopilotAction(softAction, execCtx);
  sub('Scenario C — azione bloccata (GDPR critico)', {
    status:        blockedResult.status,
    blockedReason: blockedResult.blockedReason ?? '(N/A)',
  });
  if (blockedResult.status === 'blocked') ok('PolicyEngine ha bloccato l\'azione come atteso.');
  // Restore compliance
  decisionMemory.updateComplianceStatus('gdpr', 'ok');

  sub('Audit log — esecuzioni copilot (ultimi 3)', enterpriseAuditLog.getLast(3).map(e =>
    `[${new Date(e.timestamp).toLocaleTimeString('it-IT')}] ${e.action} — ${JSON.stringify(e.details['status'])}`
  ).join('\n'));

  // ──────────────────────────────────────────────────────────────────────────
  section('RIEPILOGO FLUSSO COMPLETATO');
  // ──────────────────────────────────────────────────────────────────────────

  console.log(`
  📄  Documento:       ${DOCUMENTO_MIUR.title}
  🆔  Sessione:        ${sessionPost.id}
  🏫  Tenant:          ${session.tenantId ?? 'N/A'}
  🤖  Agenti eseguiti: ${sessionPost.agentResults.length}
  💡  Insights:        ${sessionPost.dashboardInsights.length}
  ⚡  Automazioni:     ${sessionPost.automationActions.length} (soft: ${softActions.length}, critiche: ${criticalActions.length})
  📋  Audit log:       ${enterpriseAuditLog.getAll().length} eventi
  `);

  ok('Flusso Enterprise CopilotDoc completato con successo.');
  info('Vedere src/services/enterprise/ per l\'implementazione completa.');
}

// ── Esecuzione ────────────────────────────────────────────────────────────────
runEnterpriseFlowDemo().catch(err => {
  console.error('\n❌  Errore durante demo:', err);
  process.exit(1);
});
