/**
 * hooks/useSmartChat.ts — P37 Unified Interaction Layer
 *
 * Manages the full chat session state for SmartChat.tsx.
 *
 * P37 additions:
 *   - Integrates ConversationStore for multi-thread persistence
 *   - Registers ActionBridge handler so UI events map to messages
 *   - Injects SystemPromptBuilder context before each orchestrator call
 *   - Accepts optional MessageMetadata on sendMessage
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAdaptiveOrchestrator }        from '@/hooks/useAdaptiveOrchestrator';
import { executeAgent }                   from '@/modules/agents/AgentManager';
import { submitUserFeedback }             from '@/services/agentApiClient';
import { registerChatHandler }            from '@/modules/orchestration/ActionBridge';
import { buildSystemPrompt }              from '@/modules/orchestration/SystemPromptBuilder';
import { useConversationStore }           from '@/stores/useConversationStore';
import { useChatPrefsStore }              from '@/stores/useChatPrefsStore';
import { applyAutoUpgrade }              from '@/hooks/useSuggestedMode';
import {
  analyzeEmotional, adaptBlocks,
  createEmotionalMemory, updateEmotionalMemory,
  deriveProfile,
  type EmotionalMemory, type EmotionalState,
} from '@/modules/orchestration/EmotionalEngine';
import {
  deriveStyle, recordModeUsage, mergeStrategy,
} from '@/modules/orchestration/CognitiveStyleEngine';
import { buildExplainBlock } from '@/modules/orchestration/ExplainEngine';
import { buildConfidenceBlock } from '@/modules/orchestration/ConfidenceEngine';
import { buildPlan } from '@/modules/orbit/PlanEngine';
import { buildWorkSession } from '@/modules/orchestration/WorkSessionEngine';
import { observe }                        from '@/utils/observability';
import type { OrchestratorResult }        from '@/modules/orchestration/CognitiveOrchestrator';
import type { Mode }                      from '@/modules/orchestration/ModeEngine';
import type { ChatMessage, UIBlock, UIInsightData, MessageMetadata } from '@/types/uiBlocks';

// ── Helpers ───────────────────────────────────────────────────────────────────

let _msgCounter = 0;

function newId(): string {
  return `msg-${Date.now()}-${++_msgCounter}`;
}

/**
 * Derive the adaptive hints list from agent scores.
 * Pure function — no side effects.
 */
function deriveAdaptiveHints(result: OrchestratorResult): string[] {
  const hints: string[] = [];
  const agentsUsed = new Set(result.steps.map(s => s.agent));

  for (const score of result.agentScoresUsed) {
    if (agentsUsed.has(score.agentId)) {
      const pct = Math.round(score.reliability * 100);
      hints.push(`Ho scelto ${score.agentId} (affidabilità ${pct}%)`);
    } else if (score.reliability < 0.40) {
      const pct = Math.round(score.reliability * 100);
      hints.push(`Ho evitato ${score.agentId} (affidabilità ${pct}%)`);
    }
  }
  return hints;
}

/**
 * Convert an OrchestratorResult into a structured UIBlock array.
 *
 * Layout:
 *   1. text block — main synthesised output
 *   2. plan block — if >1 step succeeded (shows reasoning chain)
 *   3. insight block — explainability (always created, default collapsed in UI)
 *   4. status block — mode / performance info
 */
export function buildUIBlocks(result: OrchestratorResult, mode: Mode): UIBlock[] {
  const blocks: UIBlock[] = [];

  // 1. Text
  blocks.push({ type: 'text', content: result.output });

  // 2. Plan: only when multiple steps produced meaningful output
  const successfulSteps = result.steps.filter(s => s.success && s.data);
  if (successfulSteps.length > 1) {
    blocks.push({
      type:  'plan',
      steps: successfulSteps.map(s => {
        const d    = s.data;
        const text = typeof d === 'string' ? d : JSON.stringify(d);
        return `[${s.agent}] ${text.slice(0, 120)}`;
      }),
    });
  }

  // 3. Insight (explainability)
  const memoryItems = result.memoryUsed
    ? result.steps
        .filter(s => s.success && typeof s.data === 'string' && (s.data as string).includes('Contesto'))
        .slice(0, 3)
        .map(s => (s.data as string).slice(0, 80))
    : [];

  const insightData: UIInsightData = {
    agentsUsed:    [...new Set(result.steps.map(s => s.agent))],
    confidence:    result.confidence,
    memoryUsed:    result.memoryUsed,
    memoryItems,
    intentType:    result.intentType,
    durationMs:    result.durationMs,
    mode,
    adaptiveHints: deriveAdaptiveHints(result),
  };
  blocks.push({ type: 'insight', data: insightData });

  // 4. Status bar
  const confPct   = Math.round(result.confidence * 100);
  const durSec    = (result.durationMs / 1000).toFixed(1);
  const severity  = result.confidence >= 0.7 ? 'success' : result.confidence >= 0.4 ? 'info' : 'warning';
  blocks.push({
    type: 'status',
    data: {
      label:    `Confidenza ${confPct}% · ${durSec}s · Modalità ${mode}`,
      severity,
      detail:   result.simulated ? 'Simulazione attiva' : undefined,
    },
  });

  // 5. Auto-sandbox — detect renderable content and append a sandbox block.
  //    HTML: at least one real element tag (not just entities or angle-bracket text).
  //    Code: fenced code block with an explicit language identifier.
  const HTML_TAG_RE  = /<[a-z][a-z0-9]*(?:\s[^>]*)?\s*\/?>/i;
  const CODE_FENCE_RE = /```([a-z0-9+#-]+)\n([\s\S]+?)```/;

  if (HTML_TAG_RE.test(result.output)) {
    blocks.push({ type: 'sandbox', config: { html: result.output, language: 'html' } });
  } else {
    const fenceMatch = CODE_FENCE_RE.exec(result.output);
    if (fenceMatch) {
      blocks.push({
        type:   'sandbox',
        config: { code: fenceMatch[2].trim(), language: fenceMatch[1] },
      });
    }
  }

  return blocks;
}

// ── Hook interface ─────────────────────────────────────────────────────────────

export interface UseSmartChatReturn {
  messages:      ChatMessage[];
  loading:       boolean;
  error:         string | null;
  mode:          Mode;
  setMode:       (m: Mode) => void;
  /** P37: optional metadata forwarded from ActionBridge */
  sendMessage:    (text: string, metadata?: MessageMetadata) => Promise<void>;
  /** OrbitDock shortcut — sends a prompt without metadata */
  triggerPrompt:  (prompt: string) => Promise<void>;
  triggerAction: (agentId: string, input?: string) => Promise<void>;
  submitFeedback:(messageId: string, rating: 1 | 2 | 3 | 4 | 5) => void;
  clearMessages: () => void;
  /** P38.5: current cognitive-emotional state (drives InputBar placeholder) */
  emotionalState: EmotionalState;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseSmartChatOptions {
  /** Overrides the starting mode (e.g. set by OrbitChatFAB based on device) */
  initialMode?: Mode;
}

export function useSmartChat({ initialMode }: UseSmartChatOptions = {}): UseSmartChatReturn {
  // ── ConversationStore ────────────────────────────────────────────────────────
  const {
    activeConversation,
    activeId,
    createConversation,
    addMessage,
  } = useConversationStore();

  // Auto-create a conversation on first mount
  useEffect(() => {
    if (!activeId) createConversation();
  }, [activeId, createConversation]);

  const messages = useMemo(
    () => activeConversation?.messages ?? [],
    [activeConversation],
  );

  const { autoUpgradeThreshold } = useChatPrefsStore();
  const [mode, setMode] = useState<Mode>(initialMode ?? 'balanced');

  // Keep a stable ref to the current last user input for action re-invocations
  const lastInputRef = useRef<string>('');

  // P38.5: emotional session memory (per conversation, not persisted)
  const emotionalMemoryRef = useRef<EmotionalMemory>(createEmotionalMemory());
  const emotionalStateRef  = useRef<EmotionalState>('focused');

  const orchestrator = useAdaptiveOrchestrator({ enableFeedbackLoop: true });

  // ── ActionBridge ─────────────────────────────────────────────────────────
  // Stable ref so the registered callback always calls the latest sendMessage
  const sendMessageRef = useRef<(text: string, metadata?: MessageMetadata) => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    return registerChatHandler(async (bridgedMsg) => {
      await sendMessageRef.current(bridgedMsg.content, bridgedMsg.metadata);
    });
  }, []);

  // ── sendMessage ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string, metadata?: MessageMetadata): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed) return;

    lastInputRef.current = trimmed;

    // Auto-upgrade mode if message is long or complex enough (P38.5)
    const effectiveMode = applyAutoUpgrade(trimmed, mode, autoUpgradeThreshold);
    if (effectiveMode !== mode) {
      setMode(effectiveMode);
      useChatPrefsStore.getState().recordManualUpgrade();
    }

    // P38.5 + P38.6: EmotionalEngine pipeline
    const emotionalProfile = useChatPrefsStore.getState().emotionalProfile;
    const { signal, state, strategy } = analyzeEmotional(
      trimmed,
      emotionalMemoryRef.current,
      emotionalProfile,
      emotionalStateRef.current,   // prevState → smoothState
    );

    // Transition telemetry (P38.6)
    const prevState = emotionalStateRef.current;
    if (prevState !== state) {
      observe('chat.emotional.transition', {
        from:        prevState,
        to:          state,
        frustration: emotionalMemoryRef.current.frustrationCount,
        flow:        emotionalMemoryRef.current.flowScore,
      });
    }

    emotionalMemoryRef.current = updateEmotionalMemory(emotionalMemoryRef.current, signal, state);
    emotionalStateRef.current  = state;

    // Evolve persistent profile after each turn (P38.6)
    const newProfile = deriveProfile(emotionalMemoryRef.current, state, emotionalProfile);
    useChatPrefsStore.getState().updateEmotionalProfile(newProfile);

    // P39: evolve cognitive style from mode usage + reveal clicks
    const { cognitiveStyle, cognitiveStyleSignals, revealClickCount } = useChatPrefsStore.getState();
    const updatedSignals = recordModeUsage(
      { ...cognitiveStyleSignals, revealClicks: revealClickCount },
      effectiveMode,
      state === 'blocked',
    );

    // P39.6 + Fase 5: error boundaries — cognitive layer failures degrade gracefully
    let newStyle = cognitiveStyle;
    try {
      newStyle = deriveStyle(updatedSignals, cognitiveStyle);
      useChatPrefsStore.getState().updateCognitiveStyle(newStyle);
      useChatPrefsStore.getState().updateCognitiveStyleSignals(updatedSignals);

      observe('cognitive.style.updated', {
        structure:       newStyle.structure,
        autonomy:        newStyle.autonomy,
        speedPreference: newStyle.speedPreference,
        exploration:     newStyle.exploration,
        turns:           updatedSignals.totalTurns,
      });
    } catch (e) {
      observe('cognitive.engine.error', { phase: 'deriveStyle', error: String(e) }, 'warn');
      // fallback: keep current cognitiveStyle unchanged
    }

    // P39.6: explicit merge engine — emotion (safety) > style (preference)
    let adaptedStrategy = strategy;
    try {
      adaptedStrategy = mergeStrategy(strategy, newStyle);
    } catch (e) {
      observe('cognitive.engine.error', { phase: 'mergeStrategy', error: String(e) }, 'warn');
      // fallback: use emotional-only strategy (no style bias)
    }

    // Build system context with emotional modulation
    buildSystemPrompt({ mode: effectiveMode, memory: [], emotional: adaptedStrategy, cognitiveStyle: newStyle });

    // Append user message to ConversationStore
    const userMsg: ChatMessage = {
      id:        newId(),
      role:      'user',
      content:   trimmed,
      timestamp: Date.now(),
      metadata,
    };
    addMessage(userMsg);

    // Run orchestrator
    const result: OrchestratorResult | null = await orchestrator.executeTask(trimmed, effectiveMode);

    if (!result) return;

    let rawBlocks = buildUIBlocks(result, effectiveMode);

    // P43 — PlanEngine: detect domain plan (consumed by WorkSessionEngine below)
    // P44.5 — Intake detection: force plan for upload/document style requests
    const INTAKE_KEYWORDS = ['carica', 'documento', 'upload', 'allega', 'file', 'programma', 'programmazione'];
    const hasIntakeKw = INTAKE_KEYWORDS.some(k => trimmed.toLowerCase().includes(k));
    const planInput   = hasIntakeKw && trimmed.length < 20
      ? `${trimmed} — analizza e prepara un piano di lavoro`
      : trimmed;
    const plan = buildPlan(planInput);

    // P40.1 + P40.2: ExplainEngine — compute explain metadata
    const explain = buildExplainBlock({
      userText:            trimmed,
      result,
      strategy:            adaptedStrategy,
      state,
      mode:                effectiveMode,
      cognitiveStyle:      newStyle,
      explainOpenedCount:  useChatPrefsStore.getState().explainOpenedCount,
    });

    // P41: ConfidenceEngine — compute confidence metadata
    const confidence = buildConfidenceBlock({
      userText: trimmed,
      result,
      state,
      strategy: adaptedStrategy,
    });

    // P43 — WorkSessionEngine: collapse plan + confidence + explain + actions into one block
    const actionsIdx   = rawBlocks.findIndex(b => b.type === 'actions');
    const actionsBlock = actionsIdx !== -1
      ? (rawBlocks[actionsIdx] as Extract<UIBlock, { type: 'actions' }>)
      : null;

    const workSession = buildWorkSession({
      plan,
      confidence,
      explain,
      actions: actionsBlock?.actions ?? [],
    });

    if (workSession) {
      // Replace all individual signal blocks with the unified WorkSession block
      rawBlocks = rawBlocks.filter(
        b =>
          b.type !== 'actions'      &&
          b.type !== 'explain'      &&
          b.type !== 'confidence'   &&
          b.type !== 'orbit_plan'   &&
          b.type !== 'decision_card',
      );
      rawBlocks.splice(1, 0, workSession);
    } else {
      // P42 Fallback — DecisionCard only when a real decision is needed
      // P44.6: NOT always — only when: plan present, low confidence (<0.7), or explain warranted
      const planPresent = !!plan && plan.confidence >= 0.65;
      const unify = actionsIdx !== -1 && (
        planPresent           ||
        confidence.score < 0.7 ||
        explain.shouldShow
      );

      if (!unify && planPresent) {
        // P44.6: plan exists but no decision needed — show orbit_plan block directly
        rawBlocks.splice(1, 0, {
          type:            'orbit_plan',
          title:           plan!.title,
          steps:           plan!.steps,
          confidence:      plan!.confidence,
          intentLabel:     plan!.intentLabel,
          executionPrompt: plan!.executionPrompt,
        });
      }

      if (unify) {
        observe('explain.shown', {
          state,
          depth:    adaptedStrategy.depth,
          items:    explain.shouldShow ? explain.items.length : 0,
          position: 'decision_card',
        });
        const [primaryAction, ...secondaryActions] = actionsBlock!.actions;
        rawBlocks.splice(actionsIdx, 1, {
          type:             'decision_card',
          primaryAction,
          secondaryActions,
          explainItems:  explain.shouldShow     ? explain.items                                         : undefined,
          confidence:    confidence.shouldShow  ? { score: confidence.score, factors: confidence.factors } : undefined,
          nextAction:    confidence.nextAction,
        });
      } else {
        if (explain.shouldShow) {
          observe('explain.shown', {
            state,
            depth:    adaptedStrategy.depth,
            items:    explain.items.length,
            position: explain.position,
          });
          if (explain.position === 'first') {
            rawBlocks.splice(1, 0, { type: 'explain', items: explain.items });
          } else {
            rawBlocks.push({ type: 'explain', items: explain.items });
          }
        } else {
          observe('explain.hidden', { state, reason: 'not_needed' });
        }
        if (confidence.shouldShow) {
          rawBlocks.push({ type: 'confidence', score: confidence.score, factors: confidence.factors });
        }
      }
    }

    const blocks    = adaptBlocks(rawBlocks, adaptedStrategy, newStyle);

    observe('chat.emotional.signal', { state, tone: strategy.tone, depth: strategy.depth, guidance: strategy.guidance });
    observe('chat.response.completed', {
      mode:          effectiveMode,
      emotionalState: state,
      blocksShown:   blocks.filter(b => !('hidden' in b && b.hidden)).length,
      blocksTotal:   blocks.length,
    });
    useChatPrefsStore.getState().tuneThreshold();

    const assistantMsg: ChatMessage = {
      id:        newId(),
      role:      'assistant',
      content:   result.output,
      blocks,
      timestamp: Date.now(),
      isDeep:    mode === 'deep' || mode === 'manual',
    };
    addMessage(assistantMsg);
  }, [orchestrator, mode, addMessage, autoUpgradeThreshold]);

  // Keep ref in sync for ActionBridge
  sendMessageRef.current = sendMessage;

  // ── triggerAction ────────────────────────────────────────────────────────────
  const triggerAction = useCallback(async (agentId: string, input?: string): Promise<void> => {
    const taskInput = input ?? lastInputRef.current ?? '';
    if (!taskInput) return;
    const agentResult = await executeAgent(agentId, taskInput);
    const content = String(agentResult.data ?? '');
    const blocks: UIBlock[] = [
      { type: 'text', content },
      {
        type: 'status',
        data: {
          label:    `Agente: ${agentId} · ${agentResult.durationMs.toFixed(0)}ms`,
          severity: agentResult.success ? 'success' : 'error',
        },
      },
    ];

    const actionMsg: ChatMessage = {
      id:        newId(),
      role:      'assistant',
      content,
      blocks,
      timestamp: Date.now(),
    };
    addMessage(actionMsg);
  }, [addMessage]);

  // ── submitFeedback ───────────────────────────────────────────────────────────
  const submitFeedback = useCallback((messageId: string, rating: 1 | 2 | 3 | 4 | 5): void => {
    // Fire-and-forget — non-fatal
    const msg = messages.find(m => m.id === messageId);
    const agentId = msg?.blocks
      ?.find(b => b.type === 'insight')
      ?.data && (msg.blocks.find(b => b.type === 'insight') as { data?: { agentsUsed?: string[] } })?.data?.agentsUsed?.[0];

    submitUserFeedback({ agentId: agentId ?? undefined, rating }).catch(() => undefined);
  }, [messages]);

  // ── clearMessages ─────────────────────────────────────────────
  // P37: start a fresh conversation instead of wiping local state
  const clearMessages = useCallback((): void => {
    createConversation();
  }, [createConversation]);

  // triggerPrompt: thin alias for sendMessage without metadata (used by OrbitDock)
  const triggerPrompt = useCallback(
    (prompt: string) => sendMessage(prompt),
    [sendMessage],
  );

  return {
    messages,
    loading:       orchestrator.loading,
    error:         orchestrator.error,
    mode,
    setMode,
    sendMessage,
    triggerPrompt,
    triggerAction,
    submitFeedback,
    clearMessages,
    emotionalState: emotionalStateRef.current,
  };
}
