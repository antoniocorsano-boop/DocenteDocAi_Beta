/**
 * Validatore di dati per il backup
 * Verifica che i dati caricati siano validi e li normalizza
 */

import { BackupPayload, Studente, Valutazione, Lezione } from '../types';
import { logger } from './logger';

/**
 * Type guards for validation
 */
const isValidUser = (value: unknown): boolean => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Valida e normalizza i dati del backup
 * Ritorna dati sicuri da usare, con valori di default per campi mancanti
 */
export function validateBackupData(data: unknown): BackupPayload | null {
  if (!data || typeof data !== 'object') {
    logger.warn('[DataValidator] Invalid backup data: not an object');
    return null;
  }

  const backup = data as Record<string, unknown>;

  // Funzione helper per validare array
  const ensureArray = <T = unknown>(value: unknown): T[] => {
    if (Array.isArray(value)) return (value as T[]).filter(item => item !== null);
    return [];
  };

  // Funzione helper per validare oggetto
  const ensureObject = (value: unknown): Record<string, unknown> => {
    if (isRecord(value)) {
      return value;
    }
    return {};
  };

  // Funzione helper per validare Set serializzato come array di stringhe
  const ensureStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    return [];
  };

  try {
    const validated = {
      user: isValidUser(backup.user) ? backup.user : null,
      students: ensureArray<Studente>(backup.students),
      lessons: ensureObject(backup.lessons) as Record<string, Lezione>,
      slots: ensureObject(backup.slots),
      evaluations: ensureArray<Valutazione>(backup.evaluations),
      competencyEvals: ensureArray(backup.competencyEvals),
      uda: ensureArray(backup.uda || (backup as Record<string, unknown> & { udas?: unknown }).udas),
      eventi: ensureArray(backup.eventi),
      knowledgeBase: ensureArray(backup.knowledgeBase),
      corpora: ensureArray(backup.corpora),
      notifiche: ensureArray(backup.notifiche),
      rubriche: ensureArray(backup.rubriche),
      pianiInclusione: ensureObject(backup.pianiInclusione),
      giudizi: ensureObject(backup.giudizi),
      reportistica: ensureArray(backup.reportistica),
      feedSources: ensureArray(backup.feedSources),
      draftRegister: ensureObject(backup.draftRegister),
      finalizedRegister: ensureArray(backup.finalizedRegister),
      curricula: ensureArray(backup.curricula),
      submissions: ensureArray(backup.submissions),
      suggestions: ensureArray(backup.suggestions),
      dismissedSuggestions: new Set(ensureStringArray(backup.dismissedSuggestions)),
      settings: isRecord(backup.settings) ? backup.settings : null,
      aiSettings: isRecord(backup.aiSettings) ? backup.aiSettings : null,
      themeState: isRecord(backup.themeState) ? backup.themeState : null,
      navigationHistory: ensureArray(backup.navigationHistory),
      backupState: isRecord(backup.backupState) ? backup.backupState : { status: 'synced', lastBackup: null },
      driveSyncState: isRecord(backup.driveSyncState) ? backup.driveSyncState : { isAuthenticated: false, isSyncing: false, lastSyncTime: null },
      
      // Fields from BackupPayload
      studentProfileContext: isRecord(backup.studentProfileContext) ? backup.studentProfileContext : null,
      selectedClassForDashboard: typeof backup.selectedClassForDashboard === 'string' ? backup.selectedClassForDashboard : null,
      orientamentoActivities: ensureArray(backup.orientamentoActivities),
      ePortfolioEntries: ensureArray(backup.ePortfolioEntries),
      studentOrientamentoStates: ensureObject(backup.studentOrientamentoStates),
      analyticsEvents: ensureArray(backup.analyticsEvents),
      analyticsMetrics: isRecord(backup.analyticsMetrics) ? backup.analyticsMetrics : {
        totalDocumentsGenerated: 0,
        documentsByType: {},
        featuresUsage: {},
        templatesCreated: 0,
        exportBatchesCount: 0,
        aiInteractionsCount: 0,
        averageSessionDuration: 0,
        lastUpdated: new Date().toISOString()
      },
      analyticsSettings: isRecord(backup.analyticsSettings) ? backup.analyticsSettings : {
        enabled: true,
        collectFeatureUsage: true,
        collectDocumentMetrics: true,
        collectPerformanceMetrics: false,
        retentionDays: 90,
        lastReset: null
      },
      activeSuggestion: isRecord(backup.activeSuggestion) ? backup.activeSuggestion : null,
      templates: ensureArray(backup.templates),
      installPrompt: isRecord(backup.installPrompt) ? backup.installPrompt : null,
      canShowInstallPrompt: typeof backup.canShowInstallPrompt === 'boolean' ? backup.canShowInstallPrompt : false,
      isGlobalAiLoading: typeof backup.isGlobalAiLoading === 'boolean' ? backup.isGlobalAiLoading : false,
    } as unknown as BackupPayload;

    logger.debug('[DataValidator] Backup data validated successfully');
    return validated;
  } catch (error) {
    logger.error('[DataValidator] Validation failed:', error);
    return null;
  }
}

/**
 * Verifica se il backup è recente (meno di 24 ore)
 */
export function isBackupRecent(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const backup = data as Record<string, unknown>;
  const savedAt = backup._savedAt;
  
  if (typeof savedAt !== 'string') return false;
  
  try {
    const savedDate = new Date(savedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  } catch {
    return false;
  }
}

/**
 * Verifica integrità minima dei dati (ha almeno user o è vuoto)
 */
export function hasMinimumData(data: BackupPayload): boolean {
  // Se c'è un user, i dati sono validi
  if (data.user) return true;
  
  // Altrimenti controlla se c'è almeno qualche dato significativo
  const hasStudents = data.students.length > 0;
  const hasLessons = Object.keys(data.lessons).length > 0;
  const hasSlots = Object.keys(data.slots).length > 0;
  
  return hasStudents || hasLessons || hasSlots;
}

