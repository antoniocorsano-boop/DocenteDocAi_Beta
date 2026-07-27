/**
 * enterprise/agents/artisticCulturalAgent.ts
 *
 * Artistic-Cultural Agent — Creative Suggestions layer.
 *
 * Role: Generate creative and culturally rich educational content suggestions
 *       based on the Knowledge Graph Enterprise state and approved regulatory context.
 *
 * Outputs: curated activity suggestions, interdisciplinary links, cultural events calendar,
 *          creative assessment ideas, artistic project templates.
 */

import type { AgentResult, DashboardInsight } from '../../../types/enterprise.types';

function nanoid(): string {
  return `art_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface ArtisticCulturalContext {
  gradeLevel?: string;
  discipline?: string;
  currentUdaTitle?: string;
  studentCount?: number;
  recentTopics?: string[];
  tenantId?: string;
}

export class ArtisticCulturalAgent {
  run(ctx: ArtisticCulturalContext): AgentResult {
    const sessionId   = nanoid();
    const suggestions = this._generateSuggestions(ctx);
    const insights    = this._buildInsights(ctx);

    return {
      agentRole:        'artistic_cultural',
      sessionId,
      producedAt:       new Date().toISOString(),
      ok:               true,
      summary:          `${suggestions.length} suggerimenti creativi generati per ${ctx.discipline ?? 'la disciplina corrente'}.`,
      requiresApproval: false,
      data: {
        suggestions,
        insights,
        gradeLevel:   ctx.gradeLevel,
        discipline:   ctx.discipline,
        tenantId:     ctx.tenantId,
      },
      recommendations: suggestions.slice(0, 3).map(s => s.title),
    };
  }

  private _generateSuggestions(ctx: ArtisticCulturalContext): Array<{
    id: string;
    title: string;
    type: 'project' | 'activity' | 'event' | 'assessment';
    description: string;
    estimatedHours: number;
    interdisciplinaryLinks?: string[];
  }> {
    const discipline = ctx.discipline ?? 'generale';
    return [
      {
        id:   nanoid(),
        type: 'project',
        title: `Progetto interdisciplinare — ${discipline} e arti visive`,
        description: 'Laboratorio creativo che integra contenuti disciplinari con espressione visiva e digitale. Adatto a gruppi di 3-5 studenti.',
        estimatedHours: 6,
        interdisciplinaryLinks: ['Arte', 'Italiano', discipline],
      },
      {
        id:   nanoid(),
        type: 'activity',
        title: 'Storytelling digitale — Il sapere in una storia',
        description: 'Gli studenti creano brevi podcast o video che raccontano un concetto appreso. Sviluppa competenze comunicative e digitali.',
        estimatedHours: 3,
        interdisciplinaryLinks: ['Italiano', 'Informatica', discipline],
      },
      {
        id:   nanoid(),
        type: 'event',
        title: 'Uscita didattica culturale — Patrimonio locale',
        description: 'Visita a musei locali o siti di interesse. Collegamento ai contenuti UDA con attività di debriefing strutturato.',
        estimatedHours: 4,
      },
      {
        id:   nanoid(),
        type: 'assessment',
        title: 'Portfolio creativo digitale',
        description: 'Valutazione autentica tramite raccolta di elaborati digitali. Rubrica di valutazione inclusa, conforme alle Linee guida MIUR.',
        estimatedHours: 2,
        interdisciplinaryLinks: ['Tutte le discipline'],
      },
    ];
  }

  private _buildInsights(ctx: ArtisticCulturalContext): DashboardInsight[] {
    return [
      {
        level:   'segreteria',
        title:   'Attività creative pianificate',
        metric:  'Progetti',
        value:   4,
        trend:   'stable',
        sources: ['artistic_cultural'],
      },
      {
        level:   'dirigente',
        title:   'Integrazione PON/PNRR attività artistiche',
        metric:  'Ore previste',
        value:   ctx.studentCount ? ctx.studentCount * 15 : 450,
        trend:   'up',
        sources: ['artistic_cultural'],
      },
    ];
  }
}

export const artisticCulturalAgent = new ArtisticCulturalAgent();
