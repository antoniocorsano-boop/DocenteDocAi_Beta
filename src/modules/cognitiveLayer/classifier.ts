/**
 * cognitiveLayer/classifier.ts
 *
 * Classificatore semantico degli input nel Cognitive Layer.
 *
 * Strategia: keyword matching deterministico (no AI) per garantire:
 *   - Performance istantanea (zero latency)
 *   - Funzionamento offline
 *   - Risultati ripetibili (test-safe)
 *
 * Futura estensione: sostituire/affiancare con embedding model locale.
 */

import type { CognitiveDomain, ClassificationConfidence, ClassificationResult } from './types';

// ─── Keyword maps ─────────────────────────────────────────────────────────────

const DOMAIN_KEYWORDS: Record<CognitiveDomain, string[]> = {
  pedagogical: [
    'uda', 'unità di apprendimento', 'didattica', 'curriculum', 'valutazione',
    'rubrica', 'competenza', 'obiettivo', 'studente', 'classe', 'docente',
    'lezione', 'materia', 'disciplina', 'apprendimento', 'alunno',
  ],
  compliance: [
    'gdpr', 'dpia', 'privacy', 'data protection', 'ai act', 'agid', 'cad',
    'audit', 'verbale', 'compliance', 'conformità', 'violazione', 'score',
    'trattamento', 'consenso', 'titolare', 'dpo', 'responsabile',
  ],
  administrative: [
    'pa', 'pubblica amministrazione', 'bando', 'circolare', 'nota ministeriale',
    'ufficio scolastico', 'dirigente', 'dsga', 'protocollo', 'notifica',
    'firmato', 'timbro', 'ufficiale', 'documento',
  ],
  technical: [
    'deploy', 'build', 'vercel', 'typescript', 'react', 'api', 'store',
    'configurazione', 'log', 'errore', 'performance', 'bundle', 'sistema',
    'infrastruttura', 'backup', 'recovery',
  ],
  commercial: [
    'sales pack', 'offerta', 'pricing', 'pilota', 'scuola pilota', 'tenant',
    'abbonamento', 'licenza', 'demo', 'presentazione', 'proposta',
    'contratto', 'commerciale',
  ],
  operational: [
    'backup', 'ripristino', 'monitoraggio', 'uptime', 'alert', 'notifica',
    'operativo', 'manutenzione', 'aggiornamento', 'versione', 'release',
  ],
  unknown: [],
};

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Classifica un testo nel dominio semantico più pertinente.
 * Usa keyword matching con punteggio ponderato.
 */
export function classifyInput(text: string): ClassificationResult {
  const lower = text.toLowerCase();
  const scores: Record<CognitiveDomain, number> = {
    pedagogical:    0,
    compliance:     0,
    administrative: 0,
    technical:      0,
    commercial:     0,
    operational:    0,
    unknown:        0,
  };

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [CognitiveDomain, string[]][]) {
    if (domain === 'unknown') continue;
    for (const kw of keywords) {
      // Peso doppio se la keyword è una parola intera
      const exact  = new RegExp(`\\b${kw}\\b`, 'i').test(lower) ? 2 : 0;
      const partial = lower.includes(kw) ? 1 : 0;
      scores[domain] += Math.max(exact, partial);
    }
  }

  const entries = Object.entries(scores) as [CognitiveDomain, number][];
  const best    = entries.reduce((a, b) => b[1] > a[1] ? b : a);

  if (best[1] === 0) {
    return { domain: 'unknown', confidence: 'low', tags: [] };
  }

  // Estrai tag: keyword che hanno scorato
  const tags = (DOMAIN_KEYWORDS[best[0]] ?? [])
    .filter(kw => lower.includes(kw))
    .slice(0, 5);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const ratio      = best[1] / (totalScore || 1);
  const confidence: ClassificationConfidence =
    ratio >= 0.6 ? 'high'
    : ratio >= 0.35 ? 'medium'
    : 'low';

  return { domain: best[0], confidence, tags };
}
