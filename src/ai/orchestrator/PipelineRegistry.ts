/**
 * PipelineRegistry.ts — Catalog of named LLM pipelines.
 *
 * Each pipeline declares:
 *   id          — unique key used by callers
 *   tier        — 'flash' | 'pro'
 *   systemPrompt — base system instruction sent to Gemini
 *
 * Usage:
 *   const pipeline = PipelineRegistry.get('copilot.chat');
 *   const model    = resolveModel(pipeline.tier);
 */

import type { ModelTier } from './ModelRouter';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PipelineDefinition {
    readonly id: string;
    readonly tier: ModelTier;
    readonly systemPrompt: string;
    /** Human-readable description (for devtools/audit) */
    readonly description: string;
}

// ── Built-in pipeline catalog ─────────────────────────────────────────────────

const PIPELINES: PipelineDefinition[] = [
    {
        id: 'copilot.chat',
        tier: 'flash',
        description: 'General-purpose Copilot docente conversational turn',
        systemPrompt:
            'Sei il Copilot Docente di DocenteDoc AI. Rispondi in italiano, in modo conciso e professionale. '
            + 'Aiuta i docenti italiani con la pianificazione didattica, la gestione della classe, '
            + 'le valutazioni e le UDA. Non inventare dati statistici. '
            + 'Non menzionare nomi di studenti reali senza contesto esplicito.',
    },
    {
        id: 'copilot.plan',
        tier: 'pro',
        description: 'Multi-step UDA / lesson planning',
        systemPrompt:
            'Sei un esperto di progettazione didattica italiana. '
            + 'Genera piani di lezione, UDA e percorsi formativi secondo le Indicazioni Nazionali. '
            + 'Struttura le risposte in sezioni chiare (Obiettivi, Attività, Valutazione). '
            + 'Rispondi sempre in italiano.',
    },
    {
        id: 'copilot.feedback',
        tier: 'flash',
        description: 'Student feedback and evaluation narrative generation',
        systemPrompt:
            'Sei un assistente per la stesura di giudizi e feedback agli studenti. '
            + 'Utilizza un linguaggio inclusivo, positivo e orientato alla crescita. '
            + 'Rispetta la privacy: non usare cognomi completi. '
            + 'Rispondi sempre in italiano.',
    },
    {
        id: 'analysis.class',
        tier: 'pro',
        description: 'Deep class analytics and recommendations',
        systemPrompt:
            'Sei un analista pedagogico. Analizza i dati della classe forniti in input '
            + 'e produci insight chiari, raccomandazioni concrete e priorità di intervento. '
            + 'Fai riferimento alle evidenze nei dati, non a generalizzazioni. '
            + 'Rispondi sempre in italiano.',
    },
    {
        id: 'studio.assistant',
        tier: 'flash',
        description: 'AI Studio general-purpose assistant',
        systemPrompt:
            'Sei un assistente AI per docenti. Rispondi alle domande in modo preciso e conciso. '
            + 'Puoi aiutare con: spiegazioni di concetti, attività didattiche, ricerche, '
            + 'scrittura professionale e preparazione di materiali. '
            + 'Rispondi sempre in italiano salvo esplicita richiesta in altra lingua.',
    },
    {
        id: 'artistic.consilium',
        tier: 'pro',
        description: 'AI Artistica Educativa — interdisciplinary creative activity suggestions for teachers',
        systemPrompt:
            'Sei un esperto di educazione artistica e pedagogia creativa italiana. '
            + 'Generi attività didattiche artistiche innovative e interdisciplinari per docenti di scuola secondaria. '
            + 'Le tue proposte sono pratiche, concise e immediatamente utilizzabili in classe. '
            + 'Ogni attività include: titolo, descrizione breve (2-3 frasi), '
            + 'tipo (visual|musical|theatrical|literary|interdisciplinary), durata in minuti e materiali. '
            + 'Rispondi sempre in italiano. Formato output: JSON array.',
    },
];

// ── Registry class ────────────────────────────────────────────────────────────

class Registry {
    private readonly _map = new Map<string, PipelineDefinition>(
        PIPELINES.map(p => [p.id, p]),
    );

    /** Returns the pipeline definition or throws if not found. */
    get(id: string): PipelineDefinition {
        const p = this._map.get(id);
        if (!p) throw new Error(`[PipelineRegistry] Unknown pipeline: "${id}"`);
        return p;
    }

    /** Returns true if the pipeline is registered. */
    has(id: string): boolean {
        return this._map.has(id);
    }

    /** Register a custom pipeline at runtime (plugins / feature flags). */
    register(definition: PipelineDefinition): void {
        if (this._map.has(definition.id)) {
            throw new Error(`[PipelineRegistry] Pipeline already registered: "${definition.id}"`);
        }
        this._map.set(definition.id, definition);
    }

    /** List all registered pipeline IDs. */
    ids(): string[] {
        return Array.from(this._map.keys());
    }
}

export const PipelineRegistry = new Registry();
