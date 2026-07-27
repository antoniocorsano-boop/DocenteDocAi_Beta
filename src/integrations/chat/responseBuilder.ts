/**
 * responseBuilder.ts — Builds structured chat responses with contextual CTAs.
 *
 * Pure/isomorphic: no store imports, no browser APIs.
 * Safe to use in both Edge Functions (api/) and client-side code.
 *
 * Usage:
 *   // In edge functions (api/webhook-*.ts):
 *   const reply = buildEdgeResponse(intent, confirmText, suggestions);
 *
 *   // In client-side action subscribers:
 *   const reply = buildActionResponse(result, intent.source);
 *
 *   // When the decision engine NextAction is available (preferred):
 *   const reply = buildContextualChatResponse(resultText, nextAction, alternates);
 *
 *   // For role-aware responses (TEACHER vs PRINCIPAL):
 *   const reply = buildRoleAwareResponse(role, content, nextAction);
 *
 * Chat response contract (non-negotiable):
 *   - Every response MUST include exactly 1 primary next action.
 *   - Up to 2 secondary alternative actions are allowed.
 *   - Generic responses ("puoi fare X o Y…") are FORBIDDEN.
 *   - Use `buildContextualChatResponse` when a NextAction is available.
 */

import type { ParsedIntent, ChatResponse } from '../../types/integration.types';
import type { ActionResult } from './actionRouter';
import type { NextAction } from '../../cognition/decisionEngine/types';
import type { SuggestedAction } from '../../cognition/copilotBrain';

// ─── CTA catalogue ────────────────────────────────────────────────────────────

/** Default quick-reply suggestions per intent action */
const DEFAULT_CTAs: Record<string, string[]> = {
    create_class:      ['Aggiungi studenti', 'Mostra classi', 'Crea UDA'],
    add_student:       ['Aggiungi un altro', 'Mostra studenti', 'Crea UDA'],
    import_students:   ['Apri app', 'Mostra classi', 'Annulla'],
    classroom_import:  ['Apri impostazioni', 'Mostra classi', 'Aiuto'],
    drive_sync:        ['Apri app', 'Mostra studenti', 'Stato backup'],
    create_uda:        ['Apri app', 'Mostra classi', 'Aggiungi evento'],
    schedule_event:    ['Aggiungi altro evento', 'Mostra studenti', 'Cosa devo fare'],
    mark_attendance:   ['Apri app', 'Mostra studenti', 'Cosa devo fare'],
    add_evaluation:    ['Aggiungi voto', 'Mostra studenti', 'Cosa devo fare'],
    show_students:     ['Mostra classi', 'Aggiungi studente', 'Crea UDA'],
    show_class:        ['Mostra studenti', 'Crea classe', 'Crea UDA'],
    generate_content:  ['Apri app', 'Crea UDA', 'Cosa devo fare'],
    unknown:           ['Cosa devo fare', 'Mostra studenti', 'Crea classe'],
};

const APP_OPEN_CTA = 'Apri DocenteDoc AI';

// ─── Edge function response (server-side, after parseIntent) ──────────────────

/**
 * Builds the chat reply for edge functions that have already parsed intent
 * but cannot execute store actions.
 *
 * @param intent     - Result of commandInterpreter.parseIntent()
 * @param message    - Confirmation message from buildConfirmationMessage()
 * @param suggestions - Suggestions from getSuggestions()
 */
export function buildEdgeResponse(
    intent: ParsedIntent,
    message: string,
    suggestions: string[]
): ChatResponse {
    const prefix = intent.action === 'unknown' ? '❓ ' : '✅ ';
    const ctaList = suggestions.length > 0 ? suggestions : (DEFAULT_CTAs[intent.action] ?? DEFAULT_CTAs.unknown);

    return {
        text: prefix + message,
        suggestions: ctaList.slice(0, 3),
    };
}

// ─── Client-side response (after routeIntent executes the action) ─────────────

/**
 * Builds the chat reply after routeIntent() has executed the action
 * against the real Zustand stores.
 *
 * @param result - ActionResult from routeIntent()
 * @param action - Intent action (for CTA lookup)
 */
export function buildActionResponse(
    result: ActionResult,
    action: string
): ChatResponse {
    const statusEmoji = result.ok ? '✅' : '⚠️';

    let text = `${statusEmoji} ${result.message}`;

    if (result.requiresApp) {
        text += `\n\n👉 _${APP_OPEN_CTA}_`;
    }

    const ctaList = DEFAULT_CTAs[action] ?? DEFAULT_CTAs.unknown;
    const suggestions = result.requiresApp
        ? [APP_OPEN_CTA, ...ctaList.slice(0, 2)]
        : ctaList.slice(0, 3);

    return { text, suggestions };
}

// ─── Generic formatter (legacy compat / spec alignment) ──────────────────────

/**
 * Simple wrapper for direct use without an ActionResult.
 * Matches the API from the original spec's responseBuilder.
 *
 * @param baseMessage - Core message text
 * @param suggestions - Optional CTA list (defaults to common actions)
 */
export function buildResponse(
    baseMessage: string,
    suggestions?: string[]
): ChatResponse {
    const ctaList = suggestions ?? ['Cosa devo fare', 'Mostra studenti', 'Crea classe'];
    const ctaText = ctaList.map((s) => `• ${s}`).join('\n');

    return {
        text: `${baseMessage}\n\n👉 Prossima azione:\n${ctaText}`,
        suggestions: ctaList.slice(0, 3),
    };
}

// ─── Utility: format ChatResponse as plain text for Telegram/WhatsApp ─────────

/**
 * Converts a ChatResponse to a plain string for platforms that
 * don't support rich buttons (fallback mode).
 */
export function responseToPlainText(response: ChatResponse): string {
    if (!response.suggestions || response.suggestions.length === 0) {
        return response.text;
    }
    const suggestionsLine = response.suggestions.map((s) => `• ${s}`).join('\n');
    return `${response.text}\n\n${suggestionsLine}`;
}

// ─── Contextual response with mandatory NextAction ────────────────────────────

/**
 * Build a response that always includes the decision engine's NextAction.
 *
 * Contract (non-negotiable):
 *   - Exactly 1 primary CTA from NextAction (never omitted)
 *   - Up to 2 secondary alternative actions
 *   - Generic free-form responses are FORBIDDEN in callers
 *
 * @param resultText       - What just happened (e.g. "Aggiunti 18 studenti ✓")
 * @param nextAction       - The NextAction from getNextAction()
 * @param alternatives     - Up to 2 alternative action labels (optional)
 */
export function buildContextualChatResponse(
    resultText: string,
    nextAction: NextAction,
    alternatives: [string?, string?] = [],
): ChatResponse {
    const nextText = `\n\n👉 *Prossimo passo*: ${nextAction.label}\n${nextAction.description}\n→ "${nextAction.cta}"`;
    const altSuggestions = (alternatives.filter(Boolean) as string[]).slice(0, 2);

    return {
        text: resultText + nextText,
        suggestions: [nextAction.cta, ...altSuggestions].slice(0, 3),
    };
}

// ─── Document AI response ─────────────────────────────────────────────────────

/**
 * Build a structured response for Document AI actions.
 * Includes action result, AI confidence, warnings, and mandatory NextAction.
 *
 * @param result      - ActionResult from routeDocumentIntent()
 * @param nextAction  - NextAction from getNextAction()
 */
export function buildDocumentActionResponse(
    result: ActionResult,
    nextAction: NextAction,
): ChatResponse {
    const statusEmoji = result.ok ? '✅' : '⚠️';
    let text = `${statusEmoji} ${result.message}`;

    // Confidence line (only when AI was involved)
    if (result.confidence !== undefined && result.confidence > 0) {
        const pct = Math.round(result.confidence * 100);
        text += `\n_Confidenza AI: ${pct}%_`;
    }

    // Non-blocking warnings
    if (result.warnings && result.warnings.length > 0) {
        text += '\n\n⚠️ *Avvisi:*\n' + result.warnings.map((w) => `• ${w}`).join('\n');
    }

    // Mandatory next action
    text += `\n\n👉 *Prossimo passo*: ${nextAction.label}\n→ "${nextAction.cta}"`;

    return {
        text,
        suggestions: [nextAction.cta, 'Rivedi studenti', 'Cosa devo fare'].slice(0, 3),
    };
}

// ─── Role-aware responses ─────────────────────────────────────────────────────

/**
 * Build a role-differentiated chat response.
 *
 * TEACHER responses use first-person, action-focused language.
 * PRINCIPAL responses use third-person aggregate language with school context.
 * ADMIN responses are TEACHER-style with additional management options.
 *
 * @param role       - Active user role ('TEACHER' | 'ADMIN' | 'PRINCIPAL')
 * @param content    - Core message content
 * @param nextAction - Mandatory next action from the decision engine
 */
export function buildRoleAwareResponse(
    role: 'TEACHER' | 'ADMIN' | 'PRINCIPAL',
    content: string,
    nextAction: NextAction,
): ChatResponse {
    const rolePrefix: Record<'TEACHER' | 'ADMIN' | 'PRINCIPAL', string> = {
        TEACHER:   '',
        ADMIN:     '🔧 ',
        PRINCIPAL: '🏫 ',
    };

    const roleCtaSuffix: Record<'TEACHER' | 'ADMIN' | 'PRINCIPAL', string[]> = {
        TEACHER:   ['Cosa devo fare', 'Mostra studenti'],
        ADMIN:     ['Gestisci utenti', 'Panoramica scuola'],
        PRINCIPAL: ['Panoramica rischi', 'Report scuola'],
    };

    const text =
        `${rolePrefix[role]}${content}\n\n` +
        `👉 *Prossimo passo*: ${nextAction.label}\n→ "${nextAction.cta}"`;

    return {
        text,
        suggestions: [nextAction.cta, ...roleCtaSuffix[role]].slice(0, 3),
    };
}

/**
 * Build a school-level insight response for PRINCIPAL/ADMIN users.
 * Takes the output of `detectSchoolPatterns()` and formats it as a chat reply.
 *
 * @param insights    - Array of Italian insight strings from schoolInsights.ts
 * @param nextAction  - Mandatory next action
 */
export function buildSchoolInsightResponse(
    insights: string[],
    nextAction: NextAction,
): ChatResponse {
    const header = '🏫 *Analisi scolastica*\n\n';
    const body = insights.map((s) => `• ${s}`).join('\n');
    const cta = `\n\n👉 *Prossimo passo*: ${nextAction.label}\n→ "${nextAction.cta}"`;

    return {
        text: header + body + cta,
        suggestions: [nextAction.cta, 'Panoramica rischi', 'Esporta report'].slice(0, 3),
    };
}

// ─── Copilot Brain response ───────────────────────────────────────────────────

/**
 * Build a chat response directly from a CopilotBrain SuggestedAction.
 *
 * Use this when the caller already has a SuggestedAction from
 * getCopilotPrimaryAction() / getCopilotSnapshot() — avoids re-building context.
 *
 * Contract: exactly 1 primary CTA, up to 2 alternates.
 *
 * @param resultText   - What just happened ("Aggiunti 3 studenti ✓")
 * @param primary      - Primary SuggestedAction from getCopilotPrimaryAction()
 * @param secondaries  - Secondary suggestions from getTopSecondaryActions() (max 2)
 */
export function buildBrainResponse(
    resultText: string,
    primary: SuggestedAction,
    secondaries: SuggestedAction[] = [],
): ChatResponse {
    const urgencyEmoji = primary.priority === 'high' ? '🔴' : primary.priority === 'medium' ? '🟡' : '🟢';
    const approvalNote = primary.requiresApproval ? '\n_⚠️ Richiede approvazione prima di procedere._' : '';

    const nextText =
        `\n\n${urgencyEmoji} *Prossimo passo*: ${primary.title}\n` +
        `${primary.description}${approvalNote}`;

    const altSuggestions = secondaries
        .slice(0, 2)
        .map((s) => s.title);

    return {
        text:        resultText + nextText,
        suggestions: [primary.title, ...altSuggestions].slice(0, 3),
    };
}
