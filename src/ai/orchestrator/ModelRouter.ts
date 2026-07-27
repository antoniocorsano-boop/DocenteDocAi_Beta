/**
 * ModelRouter.ts — Resolve the correct Gemini model for a given task tier.
 *
 * Rules:
 *   flash  → fast, cost-efficient; for conversational turns, quick completions
 *   pro    → high-capability; for complex planning, multi-step analysis
 *
 * Model names mirror src/constants.ts AI_SETTINGS defaults so they stay in sync.
 */

export type ModelTier = 'flash' | 'pro';

const MODEL_NAMES: Record<ModelTier, string> = {
    flash: 'gemini-3-flash-preview',
    pro: 'gemini-3-pro-preview',
};

/**
 * Returns the Gemini model identifier string for the given tier.
 *
 * @example
 *   const model = resolveModel('flash'); // → 'gemini-3-flash-preview'
 */
export function resolveModel(tier: ModelTier): string {
    return MODEL_NAMES[tier];
}

/**
 * Heuristic: classify a task as flash or pro based on estimated token complexity.
 *
 * @param promptLength  approximate character count of the prompt
 * @param forceProFeatures  true when the task requires multi-step reasoning
 */
export function classifyTier(
    promptLength: number,
    forceProFeatures = false,
): ModelTier {
    if (forceProFeatures) return 'pro';
    // Short prompts (< 2KB) → flash
    return promptLength < 2_000 ? 'flash' : 'pro';
}
