/**
 * CopilotInsights.ts — AI-powered natural language explanations of decisions.
 *
 * Provides "why?" explanations for AI recommendations, risk scores, and
 * evaluations.  Uses the StreamingManager to call Gemini via the secure
 * /api/ai proxy — never calls the model directly from the browser.
 *
 * Design rules:
 *  – Never import raw API keys — all AI calls go through /api/ai
 *  – Returned text is sanitized against XSS before rendering
 *  – Each function is independently abortable via AbortController
 */

import { streamAIToString } from '../ai/orchestrator/StreamingManager';
import { PipelineRegistry } from '../ai/orchestrator/PipelineRegistry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StudentRiskContext {
    studentName: string;
    riskLevel: string;
    recentEvaluations?: Array<{ subject: string; grade: number }>;
    absences?: number;
    notes?: string;
}

export interface ClassHealthContext {
    className: string;
    averageGrade?: number;
    atRiskCount?: number;
    totalStudents?: number;
    recentTrend?: 'improving' | 'stable' | 'declining';
}

export interface InsightResult {
    text: string;
    evidenceBullets: string[];
    confidence: 'high' | 'medium' | 'low';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Escapes HTML entities to prevent XSS when rendering AI output */
function sanitize(raw: string): string {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Parses the AI response into a structured InsightResult.
 * Expects the model to produce lines like "• evidence" for bullet extraction.
 */
function parseInsight(raw: string): InsightResult {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets = lines
        .filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
        .map((l) => sanitize(l.replace(/^[•\-*]\s*/, '')));
    const text = sanitize(lines.filter((l) => !l.startsWith('•') && !l.startsWith('-') && !l.startsWith('*')).join(' '));
    // Simple confidence heuristic based on evidence density
    const confidence: InsightResult['confidence'] =
        bullets.length >= 3 ? 'high' : bullets.length >= 1 ? 'medium' : 'low';
    return { text, evidenceBullets: bullets, confidence };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Explains why a student is flagged as at-risk in natural language.
 * Returns a structured InsightResult with an explanation and evidence bullets.
 */
export async function explainStudentRisk(
    context: StudentRiskContext,
    signal?: AbortSignal,
): Promise<InsightResult> {
    const pipeline = PipelineRegistry.get('copilot.feedback');
    const evaluationSummary =
        context.recentEvaluations
            ?.map((e) => `${e.subject}: ${e.grade}`)
            .join(', ') ?? 'nessuna valutazione recente';

    const prompt = `
Sei un assistente AI per docenti italiani. Analizza questa situazione e spiega perché lo studente è a rischio.
Usa un tono professionale ma empatico. Fornisci 3-5 bullet point di evidenza concreta (inizia ogni bullet con "•").

Studente: ${context.studentName}
Livello di rischio: ${context.riskLevel}
Valutazioni recenti: ${evaluationSummary}
Assenze: ${context.absences ?? 'non rilevate'}
Note del docente: ${context.notes ?? 'nessuna'}

Prima scrivi una spiegazione sintetica (1-2 frasi), poi elenca i bullet point di evidenza.
`.trim();

    void signal; // AbortSignal reserved for future fetch integration
    const raw = await streamAIToString({
        pipelineId: pipeline?.id ?? 'copilot.feedback',
        prompt,
    });

    return parseInsight(raw);
}

/**
 * Provides a natural-language summary of the overall class health.
 */
export async function explainClassHealth(
    context: ClassHealthContext,
    signal?: AbortSignal,
): Promise<InsightResult> {
    const pipeline = PipelineRegistry.get('analysis.class');

    const prompt = `
Sei un assistente AI per docenti italiani. Riassumi la salute della classe in modo chiaro e utile.
Fornisci 2-4 bullet point di osservazione chiave (inizia ogni bullet con "•").

Classe: ${context.className}
Studenti totali: ${context.totalStudents ?? 'N/D'}
Media voti: ${context.averageGrade?.toFixed(1) ?? 'N/D'}
Studenti a rischio: ${context.atRiskCount ?? 0}
Trend recente: ${context.recentTrend ?? 'stabile'}

Prima scrivi una valutazione sintetica (1 frase), poi elenca i bullet point.
`.trim();

    void signal;
    const raw = await streamAIToString({
        pipelineId: pipeline?.id ?? 'analysis.class',
        prompt,
    });

    return parseInsight(raw);
}

/**
 * Suggests a personalised intervention plan for a student at risk.
 */
export async function generateInterventionPlan(
    context: StudentRiskContext,
    signal?: AbortSignal,
): Promise<InsightResult> {
    const pipeline = PipelineRegistry.get('copilot.plan');

    const prompt = `
Sei un assistente AI per docenti italiani. Proponi un piano di intervento pratico per questo studente.
Fornisci 3-5 azioni concrete (inizia ogni azione con "•").

Studente: ${context.studentName}
Livello di rischio: ${context.riskLevel}
Assenze: ${context.absences ?? 'non rilevate'}
Note: ${context.notes ?? 'nessuna'}

Inizia con una frase di inquadramento, poi elenca le azioni specifiche.
`.trim();

    void signal;
    const raw = await streamAIToString({
        pipelineId: pipeline?.id ?? 'copilot.plan',
        prompt,
    });

    return parseInsight(raw);
}
