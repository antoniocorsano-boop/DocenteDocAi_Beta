/**
 * getNextAction.ts — SINGLE SOURCE OF TRUTH for "what should the teacher do next".
 *
 * Architecture rule: NO component may compute the next action on its own.
 * All UIs (NextStepBanner, JourneyProgressPanel, CopilotRecommendationPanel…)
 * call this function (via the `useNextAction` hook) to get the ONE recommended action.
 *
 * Design:
 *   - Pure function (no side effects, no imports from stores)
 *   - Rules are ordered by pedagogical priority (lowest level → most urgent)
 *   - Each rule is a named constant → easy to test, audit, extend
 *   - Returns null when the teacher has completed all major milestones
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CANONICAL DECISION PRIORITY ORDER (non-negotiable)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   TIER 1 — BLOCKING  : Missing critical data that prevents other features
 *   TIER 2 — ONBOARDING: Initial setup steps for a functional workspace
 *   TIER 3 — ACADEMIC  : Core instructional workflow (UDA, planning)
 *   TIER 4 — SYSTEM    : Integration and analytics improvements
 *   TIER 5 — ADVANCED  : Capability-gated automation and optimizations
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Source-of-truth resolution:
 *   This function IS the authoritative source for next-action decisions.
 *   Agent suggestions (runAllAgents) are DERIVED and complementary.
 *   If any other module computes a "next step" independently, it is a violation.
 *
 * Rule ordering (top = most urgent):
 *   [TIER 0] E0-1  Critical signal from an Enterprise agent
 *   [TIER 0] E0-2  Pending approvals in the Enterprise approval gate
 *   [TIER 0] E0-3  Compliance warning (GDPR / AgID)
 *   [TIER 1] L1-1  No students configured yet
 *   [TIER 2] L1-2  Fewer than 3 lessons created
 *   [TIER 2] L1-3  Copilot never opened
 *   [TIER 3] L2-1  No UDA created
 *   [TIER 4] L2-2  Drive backup not connected
 *   [TIER 3] L2-3  Annual plan not completed
 *   [TIER 4] L3-1  Analytics never viewed
 *   [TIER 4] L3-2  Book service not linked
 *   [TIER 5] L4-1  Automation not yet enabled
 */

import type { NextAction, NextActionContext } from './types';

// ── Decision rules — ordered list ────────────────────────────────────────────

type DecisionRule = (ctx: NextActionContext) => NextAction | null;

const RULES: DecisionRule[] = [

  // ── [TIER 0 — ENTERPRISE CRITICAL] E0-1: Critical agent signal ───────────
  (ctx) =>
    ctx.signals?.some(s => s.severity === 'critical')
      ? {
          id:               'da-enterprise-critical-alert',
          label:            'Segnale critico rilevato',
          description:      "Un agente Enterprise ha rilevato una situazione critica che richiede attenzione immediata.",
          targetView:       'copilot',
          targetTab:        12,  // Enterprise compliance tab
          cta:              'Esamina ora',
          reason:
            "Un segnale critico è stato emesso dal sistema Enterprise. Risolvilo prima di procedere con qualsiasi altra azione.",
          icon:             'emergency',
          priority:         'high' as const,
          requiresApproval: true,
        }
      : null,

  // ── [TIER 0 — ENTERPRISE] E0-2: Pending HITL approvals ───────────────────
  (ctx) =>
    (ctx.pendingApprovals ?? 0) > 0
      ? {
          id:               'da-enterprise-pending-approval',
          label:            `${ctx.pendingApprovals} approvazion${(ctx.pendingApprovals ?? 0) !== 1 ? 'i' : 'e'} in attesa`,
          description:      `${ctx.pendingApprovals} richiest${(ctx.pendingApprovals ?? 0) !== 1 ? 'e' : 'a'} di approvazione Enterprise richiede la tua revisione prima che il Knowledge Graph possa essere aggiornato.`,
          targetView:       'copilot',
          targetTab:        12,
          cta:              'Approva',
          reason:
            "Le approvazioni Enterprise sono bloccanti: il Knowledge Graph non viene aggiornato finché non vengono gestite.",
          icon:             'approval',
          priority:         'high' as const,
          requiresApproval: true,
        }
      : null,

  // ── [TIER 0 — ENTERPRISE] E0-3: Compliance warning (GDPR / AgID) ─────────
  (ctx) =>
    ctx.complianceStatus &&
    (ctx.complianceStatus.gdpr !== 'ok' || ctx.complianceStatus.agid !== 'ok')
      ? {
          id:          'da-enterprise-compliance-warning',
          label:       'Verifica compliance normativa',
          description: 'Lo stato di conformità GDPR o AgID richiede attenzione prima di procedere con azioni critiche.',
          targetView:  'copilot',
          targetTab:   12,
          cta:         'Verifica ora',
          reason:      `Compliance corrente — GDPR: ${ctx.complianceStatus.gdpr} | AgID: ${ctx.complianceStatus.agid}. Risolvi le non-conformità prima di aggiornare il Knowledge Graph.`,
          icon:        'policy',
          priority:    'medium' as const,
        }
      : null,

  // ── [TIER 1 — BLOCKING] L1-1: Add first student ──────────────────────────
  (ctx) =>
    !ctx.hasStudents && !ctx.usage.workspaceConfigured
      ? {
          id: 'da-add-first-student',
          label: 'Aggiungi la tua classe',
          description: 'Configura studenti e classe per sbloccare tutte le funzionalità.',
          targetView: 'aula',
          cta: 'Vai alla classe',
          reason:
            'Non hai ancora aggiunto nessuno studente. La maggior parte delle funzionalità — valutazioni, Copilot, analisi — richiede una classe configurata.',
          icon: 'group_add',
        }
      : null,

  // ── [TIER 2 — ONBOARDING] L1-2: Create first lesson ──────────────────────
  (ctx) =>
    ctx.usage.lessonsCreated < 3
      ? {
          id: 'da-create-lesson',
          label: 'Crea la tua prima lezione',
          description: 'Registra una lezione per iniziare a costruire il tuo storico didattico.',
          targetView: 'lessons',
          cta: 'Crea lezione',
          reason: `Hai registrato ${ctx.usage.lessonsCreated} lezione${ctx.usage.lessonsCreated !== 1 ? 'i' : ''}. Registrarne almeno 3 permette al Copilot di farti suggerimenti precisi.`,
          icon: 'edit_document',
        }
      : null,

  // ── [TIER 2 — ONBOARDING] L1-3: Discover Copilot ─────────────────────────
  (ctx) =>
    ctx.usage.copilotRequests === 0 && ctx.capabilityLevel === 1
      ? {
          id: 'da-discover-copilot',
          label: 'Scopri il Copilot',
          description: "Esplora le raccomandazioni AI personalizzate per la tua didattica.",
          targetView: 'copilot',
          targetTab: 11, // Raccomandazioni AI tab
          cta: 'Apri Copilot',
          reason:
            'Non hai ancora aperto il Copilot. È lo strumento centrale per suggerimenti e analisi — vale la pena esplorarlo.',
          icon: 'auto_awesome',
        }
      : null,

  // ── [TIER 3 — ACADEMIC] L2-1: Create first UDA ───────────────────────────
  (ctx) =>
    ctx.capabilityLevel >= 2 && ctx.usage.udaCreated === 0
      ? {
          id: 'da-create-uda',
          label: 'Pianifica la tua prima UDA',
          description: 'Crea una Unità Didattica per strutturare obiettivi e attività.',
          targetView: 'uda',
          targetTab: 4, // Planning tab
          cta: 'Crea UDA',
          reason:
            "Hai registrato lezioni ma non hai ancora creato una UDA. Organizzando le attività in UDA, il Copilot può analizzare la progressione degli studenti.",
          icon: 'layers',
        }
      : null,

  // ── [TIER 4 — SYSTEM] L2-2: Connect Drive backup ─────────────────────────
  (ctx) =>
    ctx.capabilityLevel >= 2 &&
    !ctx.usage.driveConnected &&
    !ctx.eventNames.has('drive.connected')
      ? {
          id: 'da-connect-drive',
          label: 'Attiva il backup Google Drive',
          description: 'Proteggi i tuoi dati collegando il backup automatico su Drive.',
          targetView: 'settings',
          cta: 'Configura',
          reason:
            'Stai creando contenuti ma non hai ancora attivato il backup Drive. Collegarlo protegge tutto il lavoro da perdite accidentali.',
          icon: 'backup',
        }
      : null,

  // ── [TIER 3 — ACADEMIC] L2-3: Complete annual plan ───────────────────────
  (ctx) =>
    ctx.capabilityLevel >= 2 && !ctx.eventNames.has('annual.plan.created')
      ? {
          id: 'da-annual-plan',
          label: 'Crea il piano annuale',
          description: 'Struttura obiettivi e UDA per tutto l\'anno scolastico.',
          targetView: 'planning',
          targetTab: 4, // Planning tab
          cta: 'Pianifica',
          reason:
            "Non hai ancora creato un piano annuale. Il wizard di pianificazione guida la distribuzione delle UDA nel calendario.",
          icon: 'calendar_today',
        }
      : null,

  // ── [TIER 4 — SYSTEM] L3-1: View analytics ───────────────────────────────
  (ctx) =>
    ctx.capabilityLevel >= 3 && ctx.usage.analyticsViews === 0
      ? {
          id: 'da-view-analytics',
          label: 'Analizza le performance',
          description: 'Visualizza trend e pattern nelle valutazioni della classe.',
          targetView: 'copilot',
          targetTab: 7, // Dashboard tab
          cta: 'Apri analisi',
          reason:
            "Hai dati sufficienti per un'analisi significativa ma non hai ancora visitato la Dashboard AI. Offre insight su progressione e rischi.",
          icon: 'analytics',
        }
      : null,

  // ── [TIER 4 — SYSTEM] L3-2: Link book service ────────────────────────────
  (ctx) =>
    ctx.capabilityLevel >= 3 && ctx.usage.bookServicesLinked === 0
      ? {
          id: 'da-link-book',
          label: 'Integra il libro di testo',
          description: 'Collega il libro adottato per raccomandazioni contestuali.',
          targetView: 'settings',
          cta: 'Collega',
          reason:
            "Non hai ancora collegato un servizio libro. L'integrazione permette al Copilot di allineare UDA ai contenuti del testo adottato.",
          icon: 'menu_book',
        }
      : null,

  // ── [TIER 5 — ADVANCED] L4-1: Enable automation ──────────────────────────
  (ctx) =>
    ctx.capabilityLevel >= 4 && !ctx.eventNames.has('copilot.automation.enabled')
      ? {
          id: 'da-enable-automation',
          label: 'Attiva le automazioni AI',
          description: 'Abilita suggerimenti automatici in background per massima efficienza.',
          targetView: 'copilot',
          targetTab: 9, // Spiegabilità tab
          cta: 'Configura',
          reason:
            "Sei al livello più avanzato ma non hai ancora abilitato le automazioni. Permettono al Copilot di agire proattivamente senza input manuale.",
          icon: 'bolt',
        }
      : null,
];

// ── Discovery fallback ────────────────────────────────────────────────────────

/**
 * Shown when the teacher has completed all major milestones for their level.
 * Invites further exploration rather than prescribing a fixed step.
 */
const DISCOVERY_ACTION: NextAction = {
  id: 'da-explore',
  label: 'Esplora le funzionalità avanzate',
  description: "Hai completato tutti i passi fondamentali. Scopri capacità avanzate del Copilot.",
  targetView: 'copilot',
  targetTab: 11, // Raccomandazioni AI
  cta: 'Esplora',
  reason:
    "Hai configurato tutto l'essenziale. Il Copilot ha ulteriori analisi e strumenti che potrebbero tornare utili.",
  icon: 'explore',
};

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Returns the single highest-priority recommended action for the teacher.
 *
 * Rules are evaluated in pedagogical order. The first rule that returns a
 * non-null action wins. When all rules are satisfied, returns DISCOVERY_ACTION.
 *
 * This function is PURE — it never reads from stores or external state.
 * Feed it via `useNextAction()` for React components.
 *
 * @example
 * // In tests
 * const action = getNextAction({
 *   eventNames: new Set(['lesson.created']),
 *   capabilityLevel: 1,
 *   usage: { lessonsCreated: 1, udaCreated: 0, ... },
 *   hasStudents: true,
 * });
 * expect(action.id).toBe('da-create-lesson');
 */
export function getNextAction(ctx: NextActionContext): NextAction {
  for (const rule of RULES) {
    const action = rule(ctx);
    if (action !== null) return action;
  }
  return DISCOVERY_ACTION;
}

/**
 * Returns the top-N highest-priority actions for the current context.
 * The first item is equivalent to `getNextAction()`.
 * Used by copilotBrain to derive secondary suggestions without duplicating rules.
 *
 * @param ctx   - Same context as getNextAction()
 * @param limit - Maximum actions to return (default 3)
 */
export function getNextActions(ctx: NextActionContext, limit = 3): NextAction[] {
  const results: NextAction[] = [];
  for (const rule of RULES) {
    if (results.length >= limit) break;
    const action = rule(ctx);
    if (action !== null) results.push(action);
  }
  if (results.length === 0) results.push(DISCOVERY_ACTION);
  return results;
}
