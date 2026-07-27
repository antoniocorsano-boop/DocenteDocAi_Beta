/**
 * salesPackActionEngine.ts
 *
 * Motore di suggerimenti azioni per il Sales Pack Self Panel.
 *
 * Analizza lo stato del pack + catena trust + compliance score
 * e restituisce un elenco ordinato di azioni suggerite al docente/admin.
 *
 * Ogni azione ha: priorità, tipo, label, descrizione, CTA.
 */

import type { SalesPack }  from './types';

import { getTrustChainLength, verifyChain } from '../trustLayer/trustService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low';
export type ActionType =
  | 'EXPORT_PDF'
  | 'VERIFY_CHAIN'
  | 'REGENERATE_PACK'
  | 'SHARE_PACK'
  | 'UPDATE_DPIA'
  | 'SCHEDULE_DEMO'
  | 'CONTACT_DPO'
  | 'APPROVE_PACK'
  | 'ARCHIVE_PACK';

export type PackAction = {
  id:          string;
  type:        ActionType;
  priority:    ActionPriority;
  label:       string;
  description: string;
  cta:         string;
  /** Se true, richiede isAdmin=true */
  adminOnly:   boolean;
};

// ─── Engine ───────────────────────────────────────────────────────────────────

/**
 * Genera un elenco di azioni suggerite per un Sales Pack.
 * Ordinate per priorità: urgent → high → medium → low.
 */
export async function getSuggestedActions(
  pack: SalesPack,
  isAdmin: boolean,
): Promise<PackAction[]> {
  const actions: PackAction[] = [];
  const score   = pack.complianceScore;
  const chainLen = getTrustChainLength(pack.tenantId);

  // ── Verifica catena trust ──────────────────────────────────────────────────
  if (chainLen === 0) {
    actions.push({
      id: 'no-trust-chain', type: 'VERIFY_CHAIN', priority: 'urgent',
      label: 'Catena Trust non inizializzata',
      description: 'Nessun record trust per questo tenant. Il pack non è tracciato.',
      cta: 'Rigenera il pack per avviare la catena',
      adminOnly: true,
    });
  } else {
    const chainResult = await verifyChain(pack.tenantId);
    if (!chainResult.valid) {
      actions.push({
        id: 'chain-broken', type: 'VERIFY_CHAIN', priority: 'urgent',
        label: '⚠ Integrità catena compromessa',
        description: `Record corrotto rilevato: ${chainResult.firstBroken ?? 'sconosciuto'}`,
        cta: 'Rigenera il pack e verifica i log',
        adminOnly: true,
      });
    }
  }

  // ── Score compliance ───────────────────────────────────────────────────────
  if (score < 60) {
    actions.push({
      id: 'low-compliance', type: 'REGENERATE_PACK', priority: 'urgent',
      label: 'Score compliance critico',
      description: `Score ${score}% — sotto la soglia minima per PA. Richiede intervento immediato.`,
      cta: 'Rigenera pack dopo aver risolto le violazioni',
      adminOnly: true,
    });
  } else if (score < 80) {
    actions.push({
      id: 'partial-compliance', type: 'UPDATE_DPIA', priority: 'high',
      label: 'Compliance parziale — DPIA da completare',
      description: `Score ${score}% — PA-ready richiede ≥80%. Verificare DPIA e misure organizzative.`,
      cta: 'Apri DPIA e completa le sezioni mancanti',
      adminOnly: false,
    });
  }

  // ── Export ancora non effettuato ──────────────────────────────────────────
  // (verifica semplice: se chainLen == 1 = solo creazione, nessun export registrato)
  if (chainLen === 1 && score >= 60) {
    actions.push({
      id: 'export-pending', type: 'EXPORT_PDF', priority: 'high',
      label: 'Pack pronto per export',
      description: 'Il pack è generato ma non ancora esportato in PDF. Condividilo con DPO o dirigente.',
      cta: 'Esporta Full Pack PDF',
      adminOnly: false,
    });
  }

  // ── DPO da contattare se DPIA non approvata ────────────────────────────────
  if (pack.dpia.includes('IN BOZZA')) {
    actions.push({
      id: 'dpia-draft', type: 'CONTACT_DPO', priority: 'high',
      label: 'DPIA in bozza — approvazione DPO richiesta',
      description: 'La DPIA risulta in stato BOZZA. Richiedere revisione e firma al DPO.',
      cta: 'Contatta DPO per approvazione',
      adminOnly: false,
    });
  }

  // ── Pack pronto per demo se score ≥ 80 ────────────────────────────────────
  if (score >= 80) {
    actions.push({
      id: 'schedule-demo', type: 'SCHEDULE_DEMO', priority: 'medium',
      label: 'Pack PA-ready — pianifica demo',
      description: `Score ${score}% — il sistema è conforme. Ottimo momento per una demo con dirigenti/USR.`,
      cta: 'Pianifica demo con dirigente',
      adminOnly: false,
    });
    actions.push({
      id: 'share-pack', type: 'SHARE_PACK', priority: 'medium',
      label: 'Condividi Sales Pack',
      description: 'Invia il pack completo a referenti PA, USR o potenziali partner.',
      cta: 'Esporta e condividi',
      adminOnly: false,
    });
  }

  // ── Pack vecchio (> 30 giorni) ─────────────────────────────────────────────
  const ageMs   = Date.now() - pack.createdAt;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > 30) {
    actions.push({
      id: 'stale-pack', type: 'REGENERATE_PACK', priority: 'medium',
      label: `Pack generato ${Math.floor(ageDays)} giorni fa`,
      description: 'Rigenera il pack per aggiornare i dati compliance e il timbro trust.',
      cta: 'Rigenera pack aggiornato',
      adminOnly: true,
    });
  }

  // ── Pack molto vecchio (> 90 giorni) ──────────────────────────────────────
  if (ageDays > 90) {
    actions.push({
      id: 'archive-pack', type: 'ARCHIVE_PACK', priority: 'low',
      label: 'Archivia pack obsoleto',
      description: `Pack di ${Math.floor(ageDays)} giorni fa. Valuta archiviazione per pulizia store.`,
      cta: 'Archivia pack',
      adminOnly: true,
    });
  }

  // Ordina per priorità
  const priorityOrder: Record<ActionPriority, number> = {
    urgent: 0, high: 1, medium: 2, low: 3,
  };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Filtra azioni admin se non admin
  return isAdmin ? actions : actions.filter(a => !a.adminOnly);
}
