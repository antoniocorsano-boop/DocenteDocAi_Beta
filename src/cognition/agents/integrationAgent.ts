/**
 * integrationAgent.ts — Technical Integration Agent.
 *
 * Monitors connection status of Drive, Classroom, WhatsApp, Telegram.
 * Suggests connection actions based on data volume and usage patterns.
 */

import type { AgentContext, AgentSuggestion } from './types';

export const AGENT_ID = 'integration';

export function runIntegrationAgent(ctx: AgentContext): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];

  const byId = (id: string) => ctx.integrations.find((i) => i.id === id);
  const drive      = byId('google_drive');
  const classroom  = byId('google_classroom');
  const telegram   = byId('telegram');
  const whatsapp   = byId('whatsapp');

  const activeStudents = ctx.students.filter((s) => !s.isArchived);
  const hasData = activeStudents.length > 0 || ctx.uda.length > 0;

  // ── I1: Drive not connected but data exists ───────────────────────────────
  if (drive?.status !== 'connected' && hasData) {
    suggestions.push({
      id: 'int-connect-drive',
      agentId: AGENT_ID,
      label: 'Attiva il backup Drive',
      description: 'I tuoi dati non sono ancora protetti da backup automatico.',
      reason: `Hai ${activeStudents.length} studenti e ${ctx.uda.length} UDA senza backup. Un errore o reset può causare perdita permanente.`,
      priority: 80,
      icon: 'backup',
      actionKey: 'settings.drive_backup',
      targetView: 'settings',
    });
  }

  // ── I2: Drive error ───────────────────────────────────────────────────────
  if (drive?.status === 'error') {
    suggestions.push({
      id: 'int-drive-error',
      agentId: AGENT_ID,
      label: 'Problema con Google Drive',
      description: `Errore Drive: ${drive.errorMessage ?? 'connessione fallita'}. Riconnetti per proteggere i dati.`,
      reason: 'Il backup automatico è interrotto. Ricollega Drive per riprendere la protezione.',
      priority: 90,
      icon: 'cloud_off',
      actionKey: 'settings.drive_reconnect',
      targetView: 'settings',
    });
  }

  // ── I3: Classroom not connected, many manual students ─────────────────────
  if (classroom?.status !== 'connected' && activeStudents.length >= 5) {
    suggestions.push({
      id: 'int-connect-classroom',
      agentId: AGENT_ID,
      label: 'Importa da Google Classroom',
      description: 'Collega Classroom per sincronizzare classi e studenti automaticamente.',
      reason: `Hai ${activeStudents.length} studenti aggiunti manualmente. Classroom li sincronizza in automatico e riduce gli errori.`,
      priority: 58,
      icon: 'school',
      actionKey: 'settings.classroom_connect',
      targetView: 'settings',
    });
  }

  // ── I4: Chat platforms available (suggest for mobile workflow) ────────────
  if (
    telegram?.status !== 'connected' &&
    whatsapp?.status !== 'connected' &&
    ctx.capabilityLevel >= 2
  ) {
    suggestions.push({
      id: 'int-enable-chat',
      agentId: AGENT_ID,
      label: 'Usa il Copilot in mobilità',
      description: 'Collega Telegram o WhatsApp per gestire la classe direttamente dalla chat.',
      reason: 'Al tuo livello puoi sfruttare il Copilot via chat: presenze, valutazioni e UDA senza aprire il browser.',
      priority: 50,
      icon: 'chat',
      actionKey: 'settings.chat_connect',
      targetView: 'settings',
    });
  }

  return suggestions;
}
