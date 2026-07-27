/**
 * orchestration/defaultSkills.ts
 *
 * Registrazione delle skill Orbit predefinite.
 *
 * Importare questo modulo come side-effect una volta al bootstrap (main.tsx
 * o orchestrationService.ts) per popolare il SkillRegistry prima del primo
 * buildContext().
 *
 * Aggiungere nuovi casi d'uso qui senza toccare orchestrationService.ts.
 */

import { skillRegistry } from './skillRegistry';

// ─── Skill esistenti (migrate da CTA_CAPABILITY_MAP) ─────────────────────────

skillRegistry.register({
  ctaType:      'RUN_AUDIT',
  label:        'Avvia audit',
  capabilityId: 'gdpr_retention',
  domain:       'compliance',
});

skillRegistry.register({
  ctaType:      'GENERATE_DPIA',
  label:        'Genera DPIA',
  capabilityId: 'gdpr_retention',
  domain:       'compliance',
});

skillRegistry.register({
  ctaType:      'EXPORT_UDA',
  label:        'Esporta UDA',
  capabilityId: 'uda_planner',
  domain:       'pedagogical',
});

skillRegistry.register({
  ctaType:      'GENERATE_SALES_PACK',
  label:        'Genera Sales Pack',
  capabilityId: 'sales_pack',
  domain:       'commercial',
});

skillRegistry.register({
  ctaType:      'CREATE_TRUST_RECORD',
  label:        'Crea record trust',
  capabilityId: 'trust_layer',
  domain:       'compliance',
});

// ─── Nuove skill pedagogiche (Fase 1 — Step 1) ───────────────────────────────

skillRegistry.register({
  ctaType:      'OPEN_REGISTER',
  label:        'Apri registro',
  // Sempre disponibile — nessun gate capability
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'LOAD_DELIVERABLE',
  label:        'Carica deliverable',
  capabilityId: 'uda_planner',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'MANAGE_LESSON',
  label:        'Gestisci lezione',
  capabilityId: 'uda_planner',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'SCHEDULE_RECOVERY',
  label:        'Programma recupero',
  capabilityId: 'uda_planner',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

// ─── Nuove skill contestuali (Fase 2 — ORBIT time-aware) ──────────────────────

skillRegistry.register({
  ctaType:      'OPEN_SCHEDULE',
  label:        'Apri orario',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'OPEN_CLASS_CONTEXT',
  label:        'Contesto classe',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'START_LESSON',
  label:        'Avvia lezione',
  capabilityId: 'uda_planner',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'LOAD_LESSON_MATERIAL',
  label:        'Carica materiale',
  capabilityId: 'uda_planner',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'MARK_ATTENDANCE',
  label:        'Segna presenze',
  domain:       'pedagogical',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

// ─── External connector skills (Phase C) ─────────────────────────────────────

skillRegistry.register({
  ctaType:      'SEND_EMAIL',
  label:        'Invia email',
  domain:       'administrative',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'UPLOAD_FILE',
  label:        'Carica documento',
  domain:       'administrative',
  allowedRoles: ['TEACHER', 'ADMIN', 'PRINCIPAL'],
});

skillRegistry.register({
  ctaType:      'SYNC_DATA',
  label:        'Sincronizza dati',
  domain:       'administrative',
  allowedRoles: ['ADMIN', 'PRINCIPAL'],
});
