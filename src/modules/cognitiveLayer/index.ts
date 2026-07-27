/**
 * cognitiveLayer/index.ts  —  barrel export
 */

export type {
  CognitiveEntry,
  CognitiveSuggestion,
  ClassificationResult,
  CognitiveInputType,
  CognitiveDomain,
  ClassificationConfidence,
  CognitiveSuggestionType,
  SuggestionPriority,
} from './types';

export { classifyInput } from './classifier';
export { generateSuggestions } from './suggestionEngine';
export { useCognitiveStore } from './cognitiveStore';
export { ingestInput } from './cognitiveService';
