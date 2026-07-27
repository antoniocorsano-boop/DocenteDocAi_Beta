/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
// Prompt template for AI-generated wizard steps per node
import { NKANode } from './types';

export function buildWizardPrompt(node: NKANode, userContext: any): string {
  return `
Sei un assistente AI per docenti. Genera un wizard didattico step-by-step per il nodo "${node.label}" (id: ${node.id}), adattato al livello utente e contesto.

Contesto utente:
${JSON.stringify(userContext, null, 2)}

Rispondi con una lista JSON di step:
[
  { "id": string, "title": string, "description": string, "actions": string[] }
]

Regole:
- Ogni step deve essere chiaro, pratico, e coerente con il nodo
- Adatta la difficoltà e il linguaggio al livello utente
- Includi azioni concrete e utili
`;
}

