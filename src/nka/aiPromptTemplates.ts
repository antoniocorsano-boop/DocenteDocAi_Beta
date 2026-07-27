/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
// Prompt templates for AI-driven neural map layout (LLM integration)
import { NKANode } from './types';

export function buildLayoutPrompt(nodes: readonly NKANode[], userContext: any): string {
  return `
Sei un assistente AI per docenti. Genera una disposizione ottimale e "viva" per una mappa neurale didattica in stile Material 3 Expressive.

Nodi:
${nodes.map(n => `- ${n.label} (id: ${n.id}, depth: ${n.depth}, color: ${n.color}, shape: ${n.shape})`).join('\n')}

Contesto utente:
${JSON.stringify(userContext, null, 2)}

Rispondi con una lista JSON di oggetti:
[
  { "id": string, "x": number, "y": number }
]

Regole:
- Distribuisci i nodi in modo leggibile, connesso, senza sovrapposizioni
- Rispetta depth (più profondo = più centrale)
- Mantieni coerenza con M3 (tonalità, motion, shape)
- Seleziona archi/curve se utile
`;
}

