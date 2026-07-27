/**
 * capabilitySystem/capabilityRegistry.ts
 *
 * Registro statico di tutte le capability dell'applicazione.
 * È la "fonte di verità" per nomi, categorie e tier richiesto.
 *
 * Non modificare lo stato qui — quello è gestito da capabilityStore.
 */

import type { Capability, CapabilityModule } from './types';

// ─── Capability definitions ───────────────────────────────────────────────────

export const ALL_CAPABILITIES: Capability[] = [
  // ── AI pipeline ───────────────────────────────────────────────────────────
  {
    id: 'ai_assistant',
    name: 'Assistente AI',
    description: 'Copilot docente con raccomandazioni intelligenti e supporto alla pianificazione.',
    icon: 'AutoAwesome',
    category: 'ai',
    requiredTier: 'free',
    state: 'active',
    upgradeCta: undefined,
  },
  {
    id: 'cognitive_layer',
    name: 'Cognitive Layer',
    description: 'Classificazione automatica degli input con suggerimenti contestuali cross-dominio.',
    icon: 'Psychology',
    category: 'ai',
    requiredTier: 'pilot',
    state: 'locked',
    upgradeCta: 'Richiedi accesso pilota',
  },
  {
    id: 'ai_decision_support',
    name: 'AI Decision Support',
    description: 'Raccomandazioni predittive per interventi educativi e planning strategico.',
    icon: 'Insights',
    category: 'ai',
    requiredTier: 'standard',
    state: 'locked',
    upgradeCta: 'Aggiorna piano',
  },

  // ── Compliance ────────────────────────────────────────────────────────────
  {
    id: 'trust_layer',
    name: 'Trust Layer',
    description: 'Catena di fiducia crittografica per tracciabilità e audit certificabile.',
    icon: 'VerifiedUser',
    category: 'compliance',
    requiredTier: 'pilot',
    state: 'locked',
    upgradeCta: 'Richiedi accesso pilota',
  },
  {
    id: 'gdpr_retention',
    name: 'Data Retention GDPR',
    description: 'Eliminazione automatica artefatti AI dopo 365 giorni (art. 5 GDPR).',
    icon: 'DeleteSweep',
    category: 'compliance',
    requiredTier: 'free',
    state: 'active',
  },

  // ── Commercial ────────────────────────────────────────────────────────────
  {
    id: 'sales_pack',
    name: 'Sales Pack',
    description: 'Generazione automatica di pack commerciali certificati con trust stamp.',
    icon: 'WorkspacePremium',
    category: 'commercial',
    requiredTier: 'pilot',
    state: 'locked',
    upgradeCta: 'Richiedi accesso pilota',
  },
  {
    id: 'self_assessment',
    name: 'Self Assessment Panel',
    description: 'Pannello di autovalutazione per gestione autonoma dei Sales Pack.',
    icon: 'AssignmentTurnedIn',
    category: 'commercial',
    requiredTier: 'standard',
    state: 'locked',
    upgradeCta: 'Aggiorna piano',
  },

  // ── Pedagogical ───────────────────────────────────────────────────────────
  {
    id: 'uda_planner',
    name: 'Pianificatore UDA',
    description: 'Creazione e gestione di Unità Didattiche Apprendimento con AI.',
    icon: 'School',
    category: 'pedagogical',
    requiredTier: 'free',
    state: 'active',
  },
  {
    id: 'evaluation_pipeline',
    name: 'Pipeline Valutazione',
    description: 'Rubrica valutativa, valutazioni adattive e analytics per classe.',
    icon: 'Grading',
    category: 'pedagogical',
    requiredTier: 'standard',
    state: 'locked',
    upgradeCta: 'Aggiorna piano',
  },

  // ── Integration ───────────────────────────────────────────────────────────
  {
    id: 'google_drive',
    name: 'Google Drive Sync',
    description: 'Backup automatico e sincronizzazione con Google Drive.',
    icon: 'CloudSync',
    category: 'integration',
    requiredTier: 'free',
    state: 'active',
  },

  // ── Advanced ──────────────────────────────────────────────────────────────
  {
    id: 'multitenancy',
    name: 'Multi-Tenant Admin',
    description: 'Gestione multi-istituto con ruoli, permessi e namespace isolati.',
    icon: 'AccountTree',
    category: 'advanced',
    requiredTier: 'enterprise',
    state: 'hidden',
    upgradeCta: 'Contatta il team commerciale',
  },
];

// ─── Modules ──────────────────────────────────────────────────────────────────

export const CAPABILITY_MODULES: CapabilityModule[] = [
  {
    moduleId: 'ai_pipeline',
    name: 'Pipeline AI',
    capabilityIds: ['ai_assistant', 'cognitive_layer', 'ai_decision_support'],
  },
  {
    moduleId: 'trust_compliance',
    name: 'Trust & Compliance',
    capabilityIds: ['trust_layer', 'gdpr_retention'],
  },
  {
    moduleId: 'commercial',
    name: 'Commerciale',
    capabilityIds: ['sales_pack', 'self_assessment'],
  },
  {
    moduleId: 'pedagogical',
    name: 'Didattica',
    capabilityIds: ['uda_planner', 'evaluation_pipeline'],
  },
  {
    moduleId: 'integrations',
    name: 'Integrazioni',
    capabilityIds: ['google_drive'],
  },
  {
    moduleId: 'enterprise',
    name: 'Enterprise',
    capabilityIds: ['multitenancy'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCapabilityById(id: string): Capability | undefined {
  return ALL_CAPABILITIES.find(c => c.id === id);
}

export function getCapabilitiesByCategory(category: string): Capability[] {
  return ALL_CAPABILITIES.filter(c => c.category === category);
}
