/**
 * orchestration/orchestrationService.ts
 *
 * Il "cervello runtime" che coordina i tre layer fondamentali:
 *   Cognitive Layer  → genera suggerimenti contestuali
 *   Capability System → verifica cosa può fare l'utente
 *   Trust Layer       → verifica integrità della catena audit
 *
 * Design:
 *   - buildContext()   → calcolo ephemeral on-demand (no cache, no store)
 *   - executeAction()  → check permission → crea TrustRecord → dispatch
 *   - Nessuno store aggiuntivo: il context vive solo in memoria finché usato
 *
 * Filtri per ruolo:
 *   TEACHER    → azioni dominio pedagogical | compliance
 *   ADMIN      → tutte le azioni
 *   PRINCIPAL  → tutte le azioni
 */

import './defaultSkills';
import { emergentSkillStore }      from './emergentSkillStore';
import { useCognitiveStore }      from '../cognitiveLayer/cognitiveStore';
import { generateSuggestions }    from '../cognitiveLayer/suggestionEngine';
import { listCapabilities, isCapabilityEnabled } from '../capabilitySystem/capabilityService';
import { useTrustStore }          from '../trustLayer/trustStore';
import { SESSION_BOOST_MAP }      from '../session/orbitSession';
import { verifyChain, createTrustRecord } from '../trustLayer/trustService';
import { tenantRegistry }         from '../../services/tenant/tenantRegistry';
import { skillRegistry }          from './skillRegistry';
import { useUserBehaviorStore }   from '../../stores/useUserBehaviorStore';
import type { CognitiveSuggestion, CognitiveDomain } from '../cognitiveLayer/types';
import type {
  OrchestrationContext,
  OrchestrationAction,
  OrchestrationOptions,
  ExecuteActionResult,
  TrustStatus,
} from './types';

// ─── Priority mapping ─────────────────────────────────────────────────────────

const PRIORITY_NUMBER: Record<string, number> = {
  critical: 1,
  high:     2,
  medium:   3,
  low:      4,
};

// ─── Role filter ──────────────────────────────────────────────────────────────

/**
 * Domini visibili per ruolo.
 * TEACHER vede solo azioni didattiche e compliance.
 * ADMIN e PRINCIPAL vedono tutto.
 */
const ROLE_ALLOWED_DOMAINS: Record<string, Set<CognitiveDomain>> = {
  TEACHER: new Set(['pedagogical', 'compliance']),
};

function isActionAllowedForRole(domain: CognitiveDomain, role?: string): boolean {
  if (!role || role === 'ADMIN' || role === 'PRINCIPAL') return true;
  const allowed = ROLE_ALLOWED_DOMAINS[role];
  return allowed ? allowed.has(domain) : true;
}

// ─── Trust status ─────────────────────────────────────────────────────────────

async function getTrustStatus(tenantId: string): Promise<TrustStatus> {
  const records = useTrustStore.getState().getByTenant(tenantId);
  if (records.length === 0) return 'empty';
  try {
    const result = await verifyChain(tenantId);
    return result.valid ? 'verified' : 'broken';
  } catch {
    return 'broken';
  }
}

// ─── Suggestion → Action mapper ───────────────────────────────────────────────

function suggestionToAction(s: CognitiveSuggestion): OrchestrationAction | null {
  if (!s.ctaType) return null;
  return {
    id:           s.id,
    label:        s.cta ?? s.title,
    capabilityId: skillRegistry.resolve(s.ctaType)?.capabilityId,
    priority:     PRIORITY_NUMBER[s.priority] ?? 4,
    ctaType:      s.ctaType,
    domain:       s.domain,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Determina il livello di automazione per un'azione in base al profilo
 * comportamentale dell'utente:
 *   - 'auto'      → l'azione è nelle preferite (freq > 3) + riskTolerance 'high'
 *   - 'assisted'  → azione preferita ma riskTolerance non 'high'
 *   - 'suggested' → default
 */
export function getAutomationLevel(ctaType: string): 'suggested' | 'assisted' | 'auto' {
  const { preferredActions, riskTolerance } = useUserBehaviorStore.getState().profile;
  if (!preferredActions.includes(ctaType)) return 'suggested';
  if (riskTolerance === 'high') return 'auto';
  return 'assisted';
}

/**
 * Costruisce il contesto di orchestrazione per un input specifico.
 *
 * Il context è ephemeral — ricalcolato ad ogni chiamata (no stale data).
 * Restituisce null se l'entry non viene trovata in store.
 */
export async function buildContext(
  inputId: string,
  opts: OrchestrationOptions,
): Promise<OrchestrationContext | null> {
  const { tenantId, role, maxSuggestions = 10 } = opts;

  // 1. Trova la CognitiveEntry in store
  const entry = useCognitiveStore.getState().entries.find(e => e.id === inputId);
  if (!entry) return null;

  // 2. Ricalcola sempre suggestions (mai da cache)
  const rawSuggestions = generateSuggestions(entry, opts.scheduleContext).slice(0, maxSuggestions);

  // 3. Mappa suggestions → actions (solo quelle con ctaType) e filtra per ruolo
  const rawActions: OrchestrationAction[] = rawSuggestions
    .map(suggestionToAction)
    .filter((a): a is OrchestrationAction => a !== null)
    .filter(a => isActionAllowedForRole(a.domain, role));

  // 4a. Behavior-driven boost/suppress:
  //     - preferredActions: priority -1 (promuoviamo in cima)
  //     - ignoredActions: filtrate fuori (a meno che dominio compliance — mai soppresso)
  const { preferredActions, ignoredActions } = useUserBehaviorStore.getState().profile;

  // 4b. Session-aware boost: promuove le azioni rilevanti per la modalità corrente
  const sessionBoost: readonly string[] = opts.session
    ? SESSION_BOOST_MAP[opts.session.mode]
    : [];

  const actions: OrchestrationAction[] = rawActions
    .filter(a => a.domain === 'compliance' || !ignoredActions.includes(a.ctaType))
    .map(a => {
      let p = a.priority;
      if (preferredActions.includes(a.ctaType))  p = Math.max(1, p - 1);
      if (sessionBoost.includes(a.ctaType))       p = Math.max(1, p - 1);
      return p !== a.priority ? { ...a, priority: p } : a;
    })
    .sort((a, b) => a.priority - b.priority);

  // 4. Capability del tenant
  const capabilities = listCapabilities(tenantId);

  // 5. Trust status (async)
  const trustStatus = await getTrustStatus(tenantId);

  // 6. Append dynamic (emergent) skills as synthetic suggestions + actions
  const dynamicSkills = emergentSkillStore.match({
    domain:    entry.domain,
    tags:      entry.tags,
    inputType: entry.inputType,
  });

  const allSuggestions = [...rawSuggestions];
  const allActions     = [...actions];

  for (const skill of dynamicSkills) {
    const syntheticId = `dsk_${skill.id}`;
    const syntheticSuggestion: CognitiveSuggestion = {
      id:           syntheticId,
      type:         'ACTION',
      priority:     'medium',
      domain:       (skill.trigger.domain ?? entry.domain) as CognitiveDomain,
      title:        skill.name,
      description:  `Skill personalizzata — eseguita ${skill.usageCount} volte`,
      cta:          skill.name,
      ctaType:      `${DYNAMIC_SKILL_PREFIX}${skill.id}`,
      sourceEntryId: entry.id,
      generatedAt:  Date.now(),
    };

    const dynamicAction: OrchestrationAction = {
      id:       syntheticId,
      label:    skill.name,
      priority: 3,
      ctaType:  `${DYNAMIC_SKILL_PREFIX}${skill.id}`,
      domain:   syntheticSuggestion.domain,
      meta:     { skillId: skill.id },
    };

    allSuggestions.push(syntheticSuggestion);
    allActions.push(dynamicAction);
  }

  return {
    inputId,
    suggestions: allSuggestions,
    actions:     allActions,
    capabilities,
    trustStatus,
  };
}

/**
 * Esegue un'azione dell'orchestrazione.
 *
 * Pipeline:
 *   1. Verifica capability gate
 *   2. Crea TrustRecord di audit
 *   3. Ritorna risultato
 */
const DYNAMIC_SKILL_PREFIX = 'DYNAMIC_SKILL::';

export async function executeAction(
  ctaType: string,
  suggestion: CognitiveSuggestion,
  opts: OrchestrationOptions,
): Promise<ExecuteActionResult> {
  const { tenantId } = opts;
  const ctx = tenantRegistry.getContext();

  // 0. Handle dynamic (emergent) skill execution
  if (ctaType.startsWith(DYNAMIC_SKILL_PREFIX)) {
    const skillId = ctaType.slice(DYNAMIC_SKILL_PREFIX.length);
    const skill   = emergentSkillStore.resolve(skillId);
    if (!skill) {
      return { success: false, reason: 'Skill emergente non trovata.' };
    }
    emergentSkillStore.incrementUsage(skillId);
    try {
      const record = await createTrustRecord({
        eventType:   'DOCUMENT_GENERATED',
        tenantId,
        actorId:     ctx.userId,
        description: `Skill emergente eseguita: ${skill.name} (${skillId})`,
        payload:     { ctaType, skillId, domain: skill.trigger.domain },
      });
      return { success: true, trustRecordId: record.id };
    } catch (err) {
      return {
        success: false,
        reason:  err instanceof Error ? err.message : 'Errore esecuzione skill emergente.',
      };
    }
  }

  // 1. Capability check
  const capabilityId = skillRegistry.resolve(ctaType)?.capabilityId;
  if (capabilityId && !isCapabilityEnabled(tenantId, capabilityId)) {
    return {
      success: false,
      reason:  `Capability '${capabilityId}' non attiva per questo tenant.`,
    };
  }

  // 2. TrustRecord di audit
  try {
    const record = await createTrustRecord({
      eventType:   'DOCUMENT_GENERATED',
      tenantId,
      actorId:     ctx.userId,
      description: `Azione eseguita: ${ctaType} — da suggestion "${suggestion.title}"`,
      payload:     { ctaType, suggestionId: suggestion.id, domain: suggestion.domain },
    });

    return { success: true, trustRecordId: record.id };
  } catch (err) {
    return {
      success: false,
      reason:  err instanceof Error ? err.message : 'Errore durante la creazione del TrustRecord.',
    };
  }
}
