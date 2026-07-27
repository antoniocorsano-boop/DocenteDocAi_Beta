/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/explicit-module-boundary-types */
// Wizard AI generativi per NKA: stub per runtime wizard generation
import { NKANode } from './types';

export interface NKAWizardStep {
  id: string;
  title: string;
  description: string;
  actions: string[];
}

/**
 * Genera un wizard AI per un nodo, adattato a livello e contesto.
 * Sostituire con logica AI/LLM runtime.
 */
export function generateWizardForNode(node: NKANode, userContext: any): NKAWizardStep[] {
  // Placeholder: return demo steps
  return [
    {
      id: node.id + '-step1',
      title: `Introduzione a ${node.label}`,
      description: 'Scopri i concetti base e le opportunità.',
      actions: node.actions,
    },
    {
      id: node.id + '-step2',
      title: `Applica ${node.label}`,
      description: 'Esegui attività pratiche guidate.',
      actions: node.actions,
    },
  ];
}

