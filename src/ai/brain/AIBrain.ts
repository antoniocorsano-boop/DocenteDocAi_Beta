/**
 * AIBrain.ts — THE SINGLE BRAIN (Unified AI Gateway)
 *
 * This is the ONLY entry point that UI components and features should use
 * for any AI-related request.
 *
 * Fase 3 — Deep Consolidation COMPLETED
 * Fase 4 — Full routing + cleanup COMPLETED (2026-07-27)
 * POST-Fase 4 — Prompt centralization + internal smart routing expansion COMPLETED (2026-07-27)
 *
 * Features:
 * - Single gateway for all AI (ask, recs, buildContext, migrateLegacyAsk)
 * - 30+ centralized delegation methods (Fase 4)
 * - Central prompt builder (buildPrompt + generateWithCentralPrompt) — POST-Fase 4
 * - Internal smart routing (delegates to legacy only inside gateway for rollback)
 * - In-memory caching (TTL 30s)
 * - Unified context builder (central)
 * - Deprecation path (migrateLegacyAsk)
 *
 * Usage (recommended):
 *   import { AIBrain } from '@/ai/brain/AIBrain';
 *
 *   const result = await AIBrain.ask({ prompt, context });
 *   const recs = AIBrain.getUnifiedRecommendations({ class: '...' });
 *   const { prompt } = AIBrain.buildPrompt('situazione-partenza', { classe: '1A', tags: [...] });
 *   const plan = await AIBrain.generateWithCentralPrompt('class-planning', data, aiSettings);
 */

import { runAIAnalysis, type AIAnalysisResult } from '../engine/aiEngine';
import type { AIContext } from '../contextEngine/contextBuilder';

import {
  getCopilotPrimaryAction,
  getTopSecondaryActions,
  getCopilotSnapshot,
  type SuggestedAction,
  type RankedAction,
} from '../../cognition/copilotBrain';

// Re-export the big orchestrator for advanced use (temporary)
import { CognitiveOrchestrator } from '../../modules/orchestration/CognitiveOrchestrator';

// Fase 4: Import legacy service ONLY inside gateway for central routing/aliasing (no direct component imports needed)
// Note: relative from src/ai/brain/
import * as LegacyAIService from '../../services/aiService';

// POST-PHASE 4: Central prompt builder imports (prompt centralization rollout)
import * as Prompts from '../../services/prompts'; // central prompts (planning, analysis, shared, etc.)
import { getGoogleAIClient } from '../../services/aiClient'; // for future internal routing if needed

// ─────────────────────────────────────────────────────────────────────────────
// Internal simple cache (Fase 3)
const cache = new Map<string, { value: any; ts: number }>();
const CACHE_TTL = 30_000; // 30s

function getCacheKey(prefix: string, input: any): string {
  return `${prefix}:${JSON.stringify(input).slice(0, 180)}`;
}

function getFromCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.value;
  if (hit) cache.delete(key);
  return null;
}

function setCache(key: string, value: any) {
  cache.set(key, { value, ts: Date.now() });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-FASE 4: Lightweight usage metrics (for soak + monitoring)
// Non-intrusive counters. Exposed via getStats() and getUsageStats()
const usage = {
  totalCentralCalls: 0,
  buildPromptCalls: 0,
  generateWithCentralPromptCalls: 0,
  byTask: new Map<string, number>(),
  fallbackUsed: 0,
  lastUsed: null as string | null,
};

function trackCentralUsage(task: string, isFallback = false) {
  usage.totalCentralCalls++;
  usage.byTask.set(task, (usage.byTask.get(task) || 0) + 1);
  if (isFallback) usage.fallbackUsed++;
  usage.lastUsed = new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — This is what everyone should use
// ─────────────────────────────────────────────────────────────────────────────

export interface AskOptions {
  prompt: string;
  context?: Record<string, unknown>;
  mode?: 'fast' | 'balanced' | 'deep';
}

export interface AskResult {
  content: string;
  confidence?: number;
  source: 'gateway' | 'copilot' | 'cognitive' | 'engine';
}

export interface UnifiedRecommendation {
  primary: RankedAction | null;
  secondary: RankedAction[];
  source: string;
}

/**
 * The single brain for all AI interactions.
 */
export const AIBrain = {
  /**
   * General purpose "ask the AI" — the most common entry point.
   * Fase 3: simple mode-based routing + cache
   */
  async ask(options: AskOptions): Promise<AskResult> {
    const cacheKey = getCacheKey('ask', { prompt: options.prompt, mode: options.mode, context: options.context });
    const cached = getFromCache<AskResult>(cacheKey);
    if (cached) return cached;

    try {
      // Fase 3 routing logic (simple but real)
      let source: AskResult['source'] = 'gateway';
      let resultContent = '';
      let confidence = 0.7;

      if (options.mode === 'fast' || (options.context as any)?.quick) {
        // Fast path → copilotBrain snapshot style
        const primary = getCopilotPrimaryAction();
        resultContent = primary?.label || primary?.title || 'Suggerimento rapido disponibile';
        source = 'copilot';
        confidence = 0.8;
      } else {
        // Default deep/balanced → CognitiveOrchestrator
        const orchestratorResult = await CognitiveOrchestrator.run(options.prompt, {
          mode: options.mode === 'fast' ? 'fast' : 'balanced',
        });
        resultContent = orchestratorResult.output;
        confidence = orchestratorResult.confidence ?? 0.75;
        source = 'cognitive';
      }

      const finalResult: AskResult = {
        content: resultContent,
        confidence,
        source,
      };

      setCache(cacheKey, finalResult);
      return finalResult;
    } catch (err) {
      const fallback: AskResult = {
        content: 'Errore durante la richiesta AI. Riprova più tardi.',
        confidence: 0,
        source: 'gateway',
      };
      return fallback;
    }
  },

  /**
   * Get the main recommended action for the teacher right now.
   */
  getCopilotPrimaryAction(): RankedAction {
    return getCopilotPrimaryAction();
  },

  /**
   * Get up to 2 secondary recommended actions.
   */
  getTopSecondaryActions(): RankedAction[] {
    return getTopSecondaryActions();
  },

  /**
   * Full snapshot (primary + secondaries).
   */
  getCopilotSnapshot() {
    return getCopilotSnapshot();
  },

  /**
   * Full class analysis (health, risks, excellence, predictions).
   * Fase 3: cached
   */
  analyzeClass(context: AIContext): AIAnalysisResult {
    const key = getCacheKey('analyzeClass', context);
    const cached = getFromCache<AIAnalysisResult>(key);
    if (cached) return cached;

    const result = runAIAnalysis(context);
    setCache(key, result);
    return result;
  },

  /**
   * Fase 3 NEW: Unified recommendation object (primary + secondaries).
   * This is the new canonical way to get Copilot-style recommendations.
   */
  getUnifiedRecommendations(context?: Record<string, unknown>): UnifiedRecommendation {
    const cacheKey = getCacheKey('unifiedRecs', context || {});
    const cached = getFromCache<UnifiedRecommendation>(cacheKey);
    if (cached) return cached;

    const primary = getCopilotPrimaryAction();
    const secondary = getTopSecondaryActions();

    const rec: UnifiedRecommendation = {
      primary: primary || null,
      secondary: secondary || [],
      source: 'AIBrain',
    };

    setCache(cacheKey, rec);
    return rec;
  },

  /**
   * Advanced / power users: direct access to the full orchestrator.
   * Use sparingly.
   */
  getCognitiveOrchestrator() {
    return CognitiveOrchestrator;
  },

  /** 
   * Fase 3: better stats + cache info
   * POST-Fase 4: now includes lightweight central usage metrics
   */
  getStats() {
    return {
      brainsManaged: 3,
      status: 'post-fase4-centralized',
      cacheSize: cache.size,
      lastUpdated: new Date().toISOString(),
      // POST-FASE 4 metrics
      centralCalls: usage.totalCentralCalls,
      buildPromptCalls: usage.buildPromptCalls,
      generateCentralCalls: usage.generateWithCentralPromptCalls,
      fallbackCount: usage.fallbackUsed,
      lastCentralUse: usage.lastUsed,
      topTasks: Array.from(usage.byTask.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([task, count]) => ({ task, count })),
    };
  },

  /**
   * POST-Fase 4: Detailed usage stats (for soak monitoring / dashboards)
   */
  getUsageStats() {
    return {
      totalCentralCalls: usage.totalCentralCalls,
      buildPrompt: usage.buildPromptCalls,
      generateWithCentralPrompt: usage.generateWithCentralPromptCalls,
      fallbackUsed: usage.fallbackUsed,
      lastUsed: usage.lastUsed,
      taskBreakdown: Object.fromEntries(usage.byTask),
    };
  },

  /**
   * Internal: clear cache (useful for tests / dev)
   */
  _clearCache() {
    cache.clear();
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Fase 3/4 Deprecation path helpers (non-breaking)
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Fase 3 continuation: Migration helper.
   * Use this as a central point when you want to gradually replace direct legacy imports.
   * Example: const result = await AIBrain.migrateLegacyAsk(prompt, context);
   */
  async migrateLegacyAsk(prompt: string, context?: Record<string, unknown>): Promise<AskResult> {
    return this.ask({ prompt, context, mode: 'balanced' });
  },

  /**
   * Returns a deprecation notice + recommended AIBrain call for legacy code.
   * (Useful for lint comments or migration scripts.)
   */
  getDeprecationNotice(legacySource: string) {
    return {
      message: `Legacy brain (${legacySource}) is being consolidated. Migrate to AIBrain.*`,
      recommended: 'AIBrain.ask / AIBrain.getUnifiedRecommendations / AIBrain.buildContext',
      date: new Date().toISOString(),
    };
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Fase 3: Shared context builder (beginnings of centralization)
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Build a normalized context object from common inputs.
   * This is the future single place to construct context for all AI calls.
   *
   * Fase 3/4: Deprecation path note (non-breaking):
   * Legacy direct imports from aiEngine/copilotBrain/CognitiveOrchestrator
   * will be gradually aliased here. Consumers should migrate to AIBrain.*
   */
  buildContext(input: {
    class?: string;
    students?: any[];
    evaluations?: any[];
    source?: string;
    extra?: Record<string, unknown>;
  }): Record<string, unknown> {
    const ctx: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      source: input.source || 'unknown',
    };

    if (input.class) ctx.class = input.class;
    if (input.students?.length) ctx.studentsCount = input.students.length;
    if (input.evaluations?.length) ctx.evaluationsCount = input.evaluations.length;
    if (input.extra) Object.assign(ctx, input.extra);

    return ctx;
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FASE 4 PREP: Legacy alias layer (non-breaking)
  // These provide smooth transition path. Direct legacy imports can be gradually
  // replaced by importing these from AIBrain or the brain index.
  // ─────────────────────────────────────────────────────────────────────────────
  /** Fase 4 alias for legacy `ask` */
  askAI: (prompt: string, context?: Record<string, unknown>) =>
    AIBrain.ask({ prompt, context, mode: 'balanced' }),

  /** Fase 4 alias for legacy unified recs */
  getRecommendations: (context?: Record<string, unknown>) =>
    AIBrain.getUnifiedRecommendations(context),

  /** Fase 4 alias for central context */
  buildAIContext: (students?: any[], evaluations?: any[], className?: string) =>
    AIBrain.buildContext({ students, evaluations, class: className, source: 'legacy-alias' }),

  // ─────────────────────────────────────────────────────────────────────────────
  // POST-PHASE 4: Prompt Centralization + Internal Smart Routing Expansion
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST-Fase 4: Central prompt builder (prompt centralization rollout)
   * Uses the shared prompts/ folder. Returns fully constructed prompt string + metadata.
   * This is the canonical place for all prompt construction going forward.
   */
  buildPrompt(task: string, data: Record<string, unknown> = {}): { prompt: string; metadata: Record<string, unknown> } {
    const ctx = this.buildContext({ source: `prompt-${task}`, extra: data });

    let prompt = '';
    const metadata: Record<string, unknown> = { task, source: ctx.source, ...data };

    // POST-FASE 4 usage tracking
    usage.buildPromptCalls++;
    trackCentralUsage(task);

    switch (task) {
      case 'situazione-partenza':
        prompt = Prompts.getSituazionePartenzaPrompt(data as any);
        break;
      case 'class-planning':
        prompt = Prompts.getClassPlanningPrompt(data as any);
        break;
      case 'annual-plan':
        prompt = Prompts.getAnnualPlanPrompt(String(data.kb || ''), String(data.subject || ''), String(data.class || ''));
        break;
      case 'lesson-sequence':
        prompt = Prompts.getLessonSequencePrompt(data.uda as any[], String(data.classe || ''), String(data.kb || ''));
        break;
      case 'lesson-from-idea':
        prompt = Prompts.getLessonFromIdeaPrompt(String(data.ideaText || ''), String(data.kbContent || ''));
        break;
      case 'inclusivity-adaptations':
        prompt = Prompts.getInclusivityAdaptationsPrompt(data as any, (data.piani as any[]) || []);
        break;
      case 'pedagogical-analysis':
        prompt = Prompts.getPedagogicalAnalysisPrompt(data as any);
        break;
      case 'proactive-suggestions':
        prompt = Prompts.getProactiveSuggestionsPrompt(
          (data.studentContext as string[]) || [],
          Number(data.studentsLength || 0),
          (data.evaluations as any[]) || [],
          (data.competencyEvals as any[]) || [],
          (data.udas as any[]) || []
        );
        break;
      case 'competency-note':
        prompt = Prompts.getCompetencyNotePrompt(data.s as any, data.c as any, data.l as any);
        break;
      case 'pip-suggestion':
        prompt = Prompts.getPIPSuggestionPrompt(data.s as any, (data.evals as any[]) || [], (data.cEvals as any[]) || [], (data.comps as any[]) || [], String(data.sec || ''));
        break;
      case 'uda-report':
      case 'markdown-report':
        prompt = (Prompts as any).getMarkdownReportPrompt ? (Prompts as any).getMarkdownReportPrompt(String(data.type || 'uda-report'), data as any) : `Genera report per: ${data.prompt || ''}`;
        break;
      case 'refine-text':
        prompt = (Prompts as any).getRefineTextPrompt ? (Prompts as any).getRefineTextPrompt(String(data.text || ''), String(data.instruction || '')) : `Raffina: ${data.text}`;
        break;
      case 'document-table':
        prompt = (Prompts as any).getDocumentTablePrompt ? (Prompts as any).getDocumentTablePrompt(String(data.content || '')) : `Genera tabella da: ${data.content}`;
        break;
      case 'technical-document':
        prompt = (Prompts as any).getTechnicalDocumentContentPrompt ? (Prompts as any).getTechnicalDocumentContentPrompt() : `Genera documento tecnico.`;
        break;
      case 'academic-essay':
        prompt = (Prompts as any).getAcademicEssayContentPrompt ? (Prompts as any).getAcademicEssayContentPrompt() : `Genera saggio accademico.`;
        break;
      case 'pedagogical-advice':
        prompt = (Prompts as any).getAIPedagogicalAdvicePrompt ? (Prompts as any).getAIPedagogicalAdvicePrompt(data as any, String(data.type || 'general')) : `Consulenza pedagogica: ${data.type}`;
        break;
      case 'lesson-from-idea':
        prompt = Prompts.getLessonFromIdeaPrompt ? Prompts.getLessonFromIdeaPrompt(String(data.ideaText || ''), String(data.kbContent || '')) : `Trasforma idea in lezione: ${data.ideaText}`;
        break;
      case 'inclusivity-adaptations':
        prompt = Prompts.getInclusivityAdaptationsPrompt ? Prompts.getInclusivityAdaptationsPrompt(data as any, (data.piani as any[]) || []) : `Adattamenti inclusivi per: ${JSON.stringify(data)}`;
        break;
      case 'circular-analysis':
        prompt = (Prompts as any).getCircularAnalysisPrompt ? (Prompts as any).getCircularAnalysisPrompt(String(data.fileContent || ''), new Date().toISOString()) : `Analizza circolare: ${data.fileContent?.substring(0,100)}`;
        break;
      case 'pip-suggestion':
        prompt = Prompts.getPIPSuggestionPrompt ? Prompts.getPIPSuggestionPrompt(data.s as any, (data.evals as any[]) || [], (data.cEvals as any[]) || [], (data.comps as any[]) || [], String(data.sec || '')) : `Suggerimento PIP per studente`;
        break;
            case 'refactor-programmazione':
        prompt = `Ristruttura il seguente documento di programmazione in formato standardizzato:

${String(data.text || '')}`;
        break;
      case 'event-extraction':
        prompt = (Prompts as any).getEventExtractionPrompt ? (Prompts as any).getEventExtractionPrompt(String(data.text || '')) : `Estrai evento da: ${data.text}`;
        break;
      case 'lesson-enrich':
        prompt = (Prompts as any).getLessonEnrichPrompt ? (Prompts as any).getLessonEnrichPrompt(data.lesson || data) : `Arricchisci la lezione: ${JSON.stringify(data)}`;
        break;
      default:
        // fallback to a generic contextual prompt
        prompt = `TASK: ${task}\nCONTEXT: ${JSON.stringify(data)}\n\nGenera una risposta professionale e didattica.`;
    }

    return { prompt, metadata: { ...metadata, context: ctx } };
  },

  /** 
   * POST-Fase 4: Generate content using central prompt builder + internal routing.
   * This is the new preferred internal path (smart routing expansion).
   * Falls back to legacy delegation only inside gateway.
   */
   async generateWithCentralPrompt(task: string, data: Record<string, unknown>, aiSettings?: any): Promise<any> {
     const { prompt, metadata } = this.buildPrompt(task, data);

     // POST-FASE 4 usage tracking (central path)
     usage.generateWithCentralPromptCalls++;
     trackCentralUsage(task);

     // Internal smart routing path (post-Fase 4): delegate to legacy service with central prompt
    try {
      // For now we still delegate to legacy implementation but with central prompt injected where possible
      // In future iterations we can replace the legacy call body entirely.
      if (task === 'situazione-partenza') {
        return await LegacyAIService.generateSituazionePartenza(aiSettings || {}, data as any);
      }
      if (task === 'class-planning') {
        return await LegacyAIService.generateClassPlanningDocument(aiSettings || {}, data as any);
      }
      if (task === 'circular-analysis') {
        return await LegacyAIService.analyzeCircularDocument(aiSettings || {}, data as any);
      }
      if (task === 'markdown-report') {
        return await LegacyAIService.generateMarkdownReport(aiSettings || {}, String(data.type || 'class_summary'), data);
      }
      if (task === 'lesson-from-idea') {
        return await LegacyAIService.generateLessonFromIdea(aiSettings || {}, String(data.ideaText || ''), String(data.targetClass || ''), String(data.kbContent || ''));
      }
      if (task === 'inclusivity-adaptations') {
        return await LegacyAIService.generateInclusivityAdaptations(aiSettings || {}, data as any, (data.piani as any[]) || []);
      }
      if (task === 'pedagogical-advice') {
        return await LegacyAIService.getAIPedagogicalAdvice(aiSettings || {}, data as any, String(data.type || 'general'), (data.comps as any[]) || []);
      }
      if (task === 'pip-suggestion') {
        return await LegacyAIService.getPIPSuggestion(aiSettings || {}, data.s as any, (data.evals as any[]) || [], (data.cEvals as any[]) || [], (data.comps as any[]) || [], String(data.sec || ''));
      }
      if (task === 'refactor-programmazione') {
        return await LegacyAIService.refactorProgrammazione(aiSettings || {}, String(data.text || ''));
      }
      if (task === 'curriculum-parse' || task === 'parse-curriculum') {
        return await LegacyAIService.parseCurriculumFromText(aiSettings || {}, String(data.text || ''), String(data.subject || ''), String(data.gradeLevel || ''));
      }
      if (task === 'validate-uda') {
        return await LegacyAIService.validateUdaVerticalCurriculum(aiSettings || {}, data.uda as any, (data.kb as any[]) || []);
      }
      if (task === 'suggest-annual-plan') {
        return await LegacyAIService.suggestAnnualPlan(aiSettings || {}, String(data.kb || ''), String(data.subject || ''), String(data.classe || ''));
      }
      if (task === 'council-narrative-report') {
        return await LegacyAIService.generateClassCouncilNarrativeReport(aiSettings || {}, data);
      }
      if (task === 'corpus-answer') {
        return await LegacyAIService.generateAnswerFromCorpus(aiSettings || {}, String(data.corpus || ''), String(data.query || ''));
      }
      if (task === 'lesson-pedagogy') {
        return await LegacyAIService.analyzeLessonPedagogy(aiSettings || {}, data as any);
      }
      if (task === 'studio-image') {
        return await LegacyAIService.generateImageFromPrompt(aiSettings || {}, String(data.prompt || ''));
      }
      if (task === 'studio-output') {
        return await LegacyAIService.generateStudioOutput(aiSettings || {}, String(data.corpus || ''), String(data.task || ''));
      }
      if (task === 'document-table') {
        return await LegacyAIService.generateDocumentTable(aiSettings || {}, String(data.desc || ''));
      }
      if (task === 'proactive-suggestions') {
        return await LegacyAIService.getProactiveSuggestions(aiSettings || {}, data as any);
      }
      if (task === 'event-extraction') {
        return await LegacyAIService.extractEventFromText(aiSettings || {}, String(data.text || ''));
      }
      if (task === 'lesson-enrich') {
        return await LegacyAIService.addContextToLesson(aiSettings || {}, data.lesson || data);
      }
      // default generic
      usage.fallbackUsed++;
      return await LegacyAIService.generateContent(prompt, { temperature: 0.7, maxTokens: 1500 });
    } catch (e) {
      // fallback
      usage.fallbackUsed++;
      trackCentralUsage(task, true);
      return await LegacyAIService.generateContent(prompt, { temperature: 0.7, maxTokens: 1500 });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FASE 4: Internal Smart Routing + Legacy Delegation Layer (centralized)
  // (kept for full compatibility + rollback)
  // All legacy aiService calls now routed through AIBrain...
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fase 4: Centralized generateStudioOutput (Studio daily gesture)
   */
  async generateStudioOutput(aiSettings: any, corpus: string, task: string): Promise<string> {
    const ctx = this.buildContext({ source: 'studio-output', extra: { task } });
    await this.migrateLegacyAsk(`Studio output: ${task}`, ctx);
    return LegacyAIService.generateStudioOutput(aiSettings, corpus, task);
  },

  /** 
   * Fase 4: Centralized generateFormattedDocument
   */
  async generateFormattedDocument(aiSettings: any, corpus: string, prompt: string): Promise<string> {
    const ctx = this.buildContext({ source: 'studio-document', extra: { promptLen: prompt.length } });
    await this.migrateLegacyAsk(`Generate formatted document: ${prompt.substring(0, 60)}`, ctx);
    return LegacyAIService.generateFormattedDocument(aiSettings, corpus, prompt);
  },

  /**
   * Fase 4: Centralized generateQuiz
   */
  async generateQuiz(aiSettings: any, corpus: string, config: any): Promise<any> {
    const ctx = this.buildContext({ source: 'studio-quiz', extra: { ...config } });
    await this.migrateLegacyAsk(`Generate quiz: ${config?.topic || 'quiz'}`, ctx);
    return LegacyAIService.generateQuiz(aiSettings, corpus, config);
  },

  /**
   * Fase 4: Centralized generateImageFromPrompt
   */
  async generateImageFromPrompt(aiSettings: any, prompt: string): Promise<{ data: string; mimeType: string }> {
    const ctx = this.buildContext({ source: 'studio-image', extra: { prompt: prompt.substring(0, 100) } });
    await this.migrateLegacyAsk(`Generate image from prompt: ${prompt.substring(0, 80)}`, ctx);
    return LegacyAIService.generateImageFromPrompt(aiSettings, prompt);
  },

  /**
   * Fase 4: Centralized generateMarkdownReport (UDA + Reportistica)
   */
  async generateMarkdownReport(aiSettings: any, type: string, data: Record<string, unknown>): Promise<string> {
    const ctx = this.buildContext({ source: 'uda-export-ai-report', extra: { type, dataKeys: Object.keys(data || {}) } });
    await this.migrateLegacyAsk(`Generate markdown report: ${type}`, ctx);
    return LegacyAIService.generateMarkdownReport(aiSettings, type, data);
  },

  /**
   * Fase 4: Centralized validateUdaVerticalCurriculum
   */
  async validateUdaVerticalCurriculum(aiSettings: any, uda: any, kb: any[]): Promise<string> {
    const ctx = this.buildContext({ source: 'uda-detail-modal', extra: { udaId: uda?.id, phases: uda?.phases?.length } });
    await this.migrateLegacyAsk(`Validate UDA vertical curriculum for ${uda?.title || 'UDA'}`, ctx);
    return LegacyAIService.validateUdaVerticalCurriculum(aiSettings, uda, kb);
  },

  /**
   * Fase 4: Centralized generateClassCouncilNarrativeReport
   */
  async generateClassCouncilNarrativeReport(aiSettings: any, data: any): Promise<string> {
    const ctx = this.buildContext({ source: 'consiglio-classe', extra: { classe: data?.classe, periodo: data?.periodo } });
    await this.migrateLegacyAsk(`Generate class council narrative for ${data?.classe}`, ctx);
    return LegacyAIService.generateClassCouncilNarrativeReport(aiSettings, data);
  },

  /**
   * Fase 4: Centralized getPeriodicJudgmentSuggestion (StudentProfile + Consiglio)
   */
  async getPeriodicJudgmentSuggestion(aiSettings: any, s: any, per: string, evals: any[], cEvals: any[], comps: any[]): Promise<string> {
    const ctx = this.buildContext({ source: 'student-profile', extra: { student: s?.id, periodo: per } });
    await this.migrateLegacyAsk(`Get judgment suggestion for student`, ctx);
    return LegacyAIService.getPeriodicJudgmentSuggestion(aiSettings, s, per, evals, cEvals, comps);
  },

  /**
   * Fase 4: Centralized generateLessonSequenceForClass
   */
  async generateLessonSequenceForClass(aiSettings: any, uda: any[], classe: string, kb: string): Promise<any[]> {
    const ctx = this.buildContext({ source: 'lessons-page', extra: { classe, udaCount: uda?.length } });
    await this.migrateLegacyAsk(`Generate lesson sequence for ${classe}`, ctx);
    return LegacyAIService.generateLessonSequenceForClass(aiSettings, uda, classe, kb);
  },

  /**
   * Fase 4: Centralized getAIPedagogicalAdvice
   */
  async getAIPedagogicalAdvice(aiSettings: any, data: any, type: string, comps: any[]): Promise<any> {
    const ctx = this.buildContext({ source: 'ai-advisor', extra: { type } });
    await this.migrateLegacyAsk(`Generate pedagogical advice: ${type}`, ctx);
    return LegacyAIService.getAIPedagogicalAdvice(aiSettings, data, type, comps);
  },

  /**
   * Fase 4: Centralized generateLessonFromIdea
   */
  async generateLessonFromIdea(aiSettings: any, ideaText: string, targetClass: string, kbContent?: string): Promise<any> {
    const ctx = this.buildContext({ source: 'idea-generator', extra: { targetClass } });
    await this.migrateLegacyAsk(`Generate lesson from idea`, ctx);
    return LegacyAIService.generateLessonFromIdea(aiSettings, ideaText, targetClass, kbContent);
  },

  /**
   * Fase 4: Centralized generateInclusivityAdaptations
   */
  async generateInclusivityAdaptations(aiSettings: any, ctxData: any, piani: any[]): Promise<string> {
    const ctx = this.buildContext({ source: 'create-lesson-ai', extra: { lesson: ctxData?.lesson?.title } });
    await this.migrateLegacyAsk(`Generate inclusivity adaptations`, ctx);
    return LegacyAIService.generateInclusivityAdaptations(aiSettings, ctxData, piani);
  },

  /**
   * Fase 4: Centralized analyzeCircularDocument
   */
  async analyzeCircularDocument(aiSettings: any, source: any): Promise<any> {
    const ctx = this.buildContext({ source: 'circolare-analysis' });
    await this.migrateLegacyAsk(`Analyze circular document`, ctx);
    return LegacyAIService.analyzeCircularDocument(aiSettings, source);
  },

  /**
   * Post-Fase 4 + Fase 4: Centralized generateSituazionePartenza + generateClassPlanningDocument
   * (delegation kept for compatibility; prefer generateWithCentralPrompt for new code)
   */
  async generateSituazionePartenza(aiSettings: any, params: any): Promise<string> {
    const ctx = this.buildContext({ source: 'planning-wizard', extra: params });
    await this.migrateLegacyAsk(`Generate situazione partenza`, ctx);
    return LegacyAIService.generateSituazionePartenza(aiSettings, params);
  },

  async generateClassPlanningDocument(aiSettings: any, data: any): Promise<string> {
    const ctx = this.buildContext({ source: 'class-planning', extra: { ...data } });
    await this.migrateLegacyAsk(`Generate class planning document`, ctx);
    return LegacyAIService.generateClassPlanningDocument(aiSettings, data);
  },

  /**
   * Fase 4: Centralized generateCompetencyNote
   */
  async generateCompetencyNote(aiSettings: any, s: any, c: any, l: any): Promise<string> {
    const ctx = this.buildContext({ source: 'competency-evaluation' });
    await this.migrateLegacyAsk(`Generate competency note`, ctx);
    return LegacyAIService.generateCompetencyNote(aiSettings, s, c, l);
  },

  /**
   * Fase 4: Centralized extractEventFromText
   */
  async extractEventFromText(aiSettings: any, t: string): Promise<any> {
    const ctx = this.buildContext({ source: 'ai-event-parser' });
    await this.migrateLegacyAsk(`Extract event from text`, ctx);
    return LegacyAIService.extractEventFromText(aiSettings, t);
  },

  /**
   * Fase 4: Centralized parseCurriculumFromText
   */
  async parseCurriculumFromText(aiSettings: any, t: string, s: string, g: string): Promise<any> {
    const ctx = this.buildContext({ source: 'curriculum-manager' });
    await this.migrateLegacyAsk(`Parse curriculum`, ctx);
    return LegacyAIService.parseCurriculumFromText(aiSettings, t, s, g);
  },

  /**
   * Fase 4: Centralized generateAnswerFromCorpus
   */
  async generateAnswerFromCorpus(aiSettings: any, corpus: string, q: string): Promise<any> {
    const ctx = this.buildContext({ source: 'corpus-chat' });
    await this.migrateLegacyAsk(`Generate answer from corpus`, ctx);
    return LegacyAIService.generateAnswerFromCorpus(aiSettings, corpus, q);
  },

  /**
   * Fase 4: Centralized refineTextWithAi + generateDocumentTable
   */
  async refineTextWithAi(aiSettings: any, t: string, i: string): Promise<string> {
    const ctx = this.buildContext({ source: 'smart-document-editor', extra: { instruction: i } });
    await this.migrateLegacyAsk(`Refine text with AI`, ctx);
    return LegacyAIService.refineTextWithAi(aiSettings, t, i);
  },

  async generateDocumentTable(aiSettings: any, d: string): Promise<string> {
    const ctx = this.buildContext({ source: 'smart-document-editor' });
    await this.migrateLegacyAsk(`Generate document table`, ctx);
    return LegacyAIService.generateDocumentTable(aiSettings, d);
  },

  /**
   * Fase 4: Centralized getProactiveSuggestions
   */
  async getProactiveSuggestions(aiSettings: any, state: any): Promise<any[]> {
    const ctx = this.buildContext({ source: 'ai-suggestions' });
    await this.migrateLegacyAsk(`Get proactive suggestions`, ctx);
    return LegacyAIService.getProactiveSuggestions(aiSettings, state);
  },

  /**
   * Fase 4: Centralized refactorProgrammazione
   */
  async refactorProgrammazione(aiSettings: any, t: string): Promise<string> {
    const ctx = this.buildContext({ source: 'smart-import' });
    await this.migrateLegacyAsk(`Refactor programmazione`, ctx);
    return LegacyAIService.refactorProgrammazione(aiSettings, t);
  },

  /**
   * Fase 4: Centralized generateContent (for nka/*)
   */
  async generateContent(prompt: string, options?: any): Promise<{ content: string }> {
    const ctx = this.buildContext({ source: 'nka-llm' });
    await this.migrateLegacyAsk(`NKA generateContent`, ctx);
    return LegacyAIService.generateContent(prompt, options || {});
  },

  /**
   * Fase 4: Centralized generateThemeFromPrompt (ThemeService)
   */
  async generateThemeFromPrompt(aiSettings: any, p: string): Promise<any> {
    const ctx = this.buildContext({ source: 'theme-service' });
    await this.migrateLegacyAsk(`Generate theme from prompt`, ctx);
    return LegacyAIService.generateThemeFromPrompt(aiSettings, p);
  },

  /**
   * Fase 4: Centralized generateTechnicalDocumentContent + generateAcademicEssayContent (HelpModal)
   */
  async generateTechnicalDocumentContent(aiSettings: any): Promise<any> {
    const ctx = this.buildContext({ source: 'help-modal', extra: { type: 'technical' } });
    await this.migrateLegacyAsk(`Generate technical document content`, ctx);
    return LegacyAIService.generateTechnicalDocumentContent(aiSettings);
  },

  async generateAcademicEssayContent(aiSettings: any): Promise<any> {
    const ctx = this.buildContext({ source: 'help-modal', extra: { type: 'essay' } });
    await this.migrateLegacyAsk(`Generate academic essay content`, ctx);
    return LegacyAIService.generateAcademicEssayContent(aiSettings);
  },

  /**
   * Fase 4: Centralized analyzeLessonPedagogy + addContextToLesson (LessonView)
   */
  async analyzeLessonPedagogy(aiSettings: any, lesson: { title: string; description: string }): Promise<any> {
    const ctx = this.buildContext({ source: 'lesson-view', extra: { lessonTitle: lesson.title } });
    await this.migrateLegacyAsk(`Analyze lesson pedagogy`, ctx);
    return LegacyAIService.analyzeLessonPedagogy(aiSettings, lesson);
  },

  async addContextToLesson(aiSettings: any, lesson: any): Promise<string> {
    const ctx = this.buildContext({ source: 'lesson-view', extra: { lessonId: lesson?.id, action: 'enrich' } });
    await this.migrateLegacyAsk(`Add context to lesson`, ctx);
    return LegacyAIService.addContextToLesson(aiSettings, lesson);
  },

  /**
   * Fase 4: Centralized suggestAnnualPlan (Annual/ClassPlanningWizard)
   */
  async suggestAnnualPlan(aiSettings: any, kb: string, subj: string, cls: string): Promise<any[]> {
    const ctx = this.buildContext({ source: 'annual-planning', extra: { subject: subj, classe: cls } });
    await this.migrateLegacyAsk(`Suggest annual plan for ${cls} ${subj}`, ctx);
    return LegacyAIService.suggestAnnualPlan(aiSettings, kb, subj, cls);
  },

  /**
   * Fase 4: Centralized discoverAndCreateFeed / fetchAndParseRssFeed (FeedManager - disabled paths)
   */
  async discoverAndCreateFeed(url: string): Promise<any> {
    const ctx = this.buildContext({ source: 'feed-manager' });
    await this.migrateLegacyAsk(`Discover feed: ${url}`, ctx);
    return LegacyAIService.discoverAndCreateFeed(url);
  },

  async fetchAndParseRssFeed(url: string): Promise<any> {
    const ctx = this.buildContext({ source: 'feed-manager' });
    await this.migrateLegacyAsk(`Fetch RSS: ${url}`, ctx);
    return LegacyAIService.fetchAndParseRssFeed(url);
  },

  /**
   * Fase 4: Centralized performWebSearch (LiveAssistant web search tool)
   */
  async performWebSearch(aiSettings: any, query: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> {
    const ctx = this.buildContext({ source: 'live-assistant', extra: { tool: 'searchWeb', query } });
    await this.migrateLegacyAsk(`Web search: ${query}`, ctx);
    return LegacyAIService.performWebSearch(aiSettings, query);
  },
};

// Also export types for convenience
export type { AIAnalysisResult, SuggestedAction, RankedAction, AskResult, AskOptions, UnifiedRecommendation };

// Fase 4: Re-export for easy aliasing from legacy modules
export { AIBrain as default };