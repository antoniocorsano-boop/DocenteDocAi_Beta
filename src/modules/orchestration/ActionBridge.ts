/**
 * modules/orchestration/ActionBridge.ts — P37 Unified Interaction Layer
 *
 * Bridges any UI event into the SmartChat pipeline via a singleton handler
 * registration pattern.
 *
 * Architecture:
 *   UI Event → dispatchAction() → intent mapping → registered chat handler
 *
 * Usage:
 *   // In any component:
 *   import { dispatchAction } from '@/modules/orchestration/ActionBridge';
 *   dispatchAction({ type: 'click', id: 'create-lesson', payload: { topic: 'fotosintesi' } });
 *
 *   // In useSmartChat (mount):
 *   useEffect(() => {
 *     return registerChatHandler(async ({ content, metadata }) => {
 *       await sendMessage(content, metadata);
 *     });
 *   }, [sendMessage]);
 *
 * Guarantees:
 *   - dispatchAction() NEVER throws
 *   - At most one handler registered at a time (last-writer-wins)
 *   - Every dispatch emits an observability event
 */

import { observe } from '@/utils/observability';

// ── Public types ───────────────────────────────────────────────────────────────

/** All action shapes that can be dispatched from the UI */
export type UIAction =
  | { type: 'click';        id: string; payload?: Record<string, unknown> }
  | { type: 'form_submit';  id: string; data:    Record<string, unknown> }
  | { type: 'system_event'; name: string; data?: Record<string, unknown> };

/** Attached to every chat message created by the bridge */
export interface ActionMetadata {
  source:    'ui' | 'system';
  actionId:  string;
}

/** The payload forwarded to the registered chat handler */
export interface BridgedMessage {
  content:  string;
  metadata: ActionMetadata;
}

/** Signature of the handler that useSmartChat registers */
export type ChatBridgeHandler = (msg: BridgedMessage) => Promise<void>;

// ── Singleton registry ─────────────────────────────────────────────────────────

let _handler: ChatBridgeHandler | null = null;

/**
 * Register the active SmartChat handler.
 * Returns an unregister callback so the hook can clean up on unmount.
 */
export function registerChatHandler(handler: ChatBridgeHandler): () => void {
  _handler = handler;
  return () => {
    if (_handler === handler) _handler = null;
  };
}

// ── Intent mapping ─────────────────────────────────────────────────────────────

type IntentFn = (payload: Record<string, unknown> | undefined) => string;

const CLICK_INTENTS: Record<string, IntentFn> = {
  'create-lesson':     (p) => `Crea una lezione${p?.topic ? ` su ${String(p.topic)}` : ''}`,
  'create-uda':        (p) => `Crea una nuova UDA${p?.title ? ` intitolata "${String(p.title)}"` : ''}`,
  'analyze-student':   (p) => `Analizza il profilo dello studente${p?.name ? ` ${String(p.name)}` : ''}`,
  'export-content':    (p) => `Esporta il contenuto${p?.format ? ` in formato ${String(p.format)}` : ''}`,
  'review-plan':       ()  => 'Rivedi il piano didattico attuale e suggerisci miglioramenti',
  'generate-quiz':     (p) => `Genera un quiz${p?.topic ? ` su ${String(p.topic)}` : ''}`,
  'suggest-resources': (p) => `Suggerisci risorse didattiche${p?.topic ? ` per ${String(p.topic)}` : ''}`,
  'summarize-notes':   (p) => `Riassumi le note${p?.subject ? ` di ${String(p.subject)}` : ''}`,
  'plan-week':         (p) => `Pianifica la settimana${p?.week ? ` per la settimana ${String(p.week)}` : ''}`,
};

const FORM_INTENTS: Record<string, IntentFn> = {
  'lesson-create':     (d) => `Crea una lezione con questi dati: ${JSON.stringify(d)}`,
  'uda-create':        (d) => `Crea una UDA con questi dati: ${JSON.stringify(d)}`,
  'student-update':    (d) => `Aggiorna il profilo studente: ${JSON.stringify(d)}`,
  'quiz-settings':     (d) => `Configura il quiz con questi parametri: ${JSON.stringify(d)}`,
  'resource-search':   (d) => `Cerca risorse didattiche con questi criteri: ${JSON.stringify(d)}`,
};

function buildContent(action: UIAction): string {
  switch (action.type) {
    case 'click': {
      const fn = CLICK_INTENTS[action.id];
      return fn
        ? fn(action.payload)
        : `Esegui: ${action.id}${action.payload ? ` — ${JSON.stringify(action.payload)}` : ''}`;
    }
    case 'form_submit': {
      const fn = FORM_INTENTS[action.id];
      return fn
        ? fn(action.data)
        : `Elabora il modulo "${action.id}": ${JSON.stringify(action.data)}`;
    }
    case 'system_event': {
      return `Evento di sistema: ${action.name}${action.data ? ` — ${JSON.stringify(action.data)}` : ''}`;
    }
  }
}

function resolveActionId(action: UIAction): string {
  return action.type === 'system_event' ? action.name : action.id;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Dispatch a UI action into the SmartChat pipeline.
 *
 * Never throws. If no handler is registered, the event is logged and dropped.
 */
export async function dispatchAction(action: UIAction): Promise<void> {
  const actionId = resolveActionId(action);

  observe('ui.action.dispatched', { type: action.type, actionId }, 'info');

  if (!_handler) {
    observe('ui.action.no_handler', { actionId }, 'warn');
    return;
  }

  const content  = buildContent(action);
  const metadata: ActionMetadata = {
    source:   action.type === 'system_event' ? 'system' : 'ui',
    actionId,
  };

  try {
    await _handler({ content, metadata });
  } catch {
    observe('ui.action.dispatch_error', { actionId }, 'error');
  }
}
