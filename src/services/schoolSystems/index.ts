/**
 * schoolSystems/index.ts — Public API barrel for the school systems integration layer.
 *
 * Initialisation:
 *   import { initSchoolSystems } from '@/services/schoolSystems';
 *   initSchoolSystems();   // call once at app startup
 *
 * Quick-start:
 *   import { providerRegistry, SpaggiariProvider, credentialVault } from '@/services/schoolSystems';
 *   const provider = new SpaggiariProvider();
 *   providerRegistry.register(provider);
 *   const token = await credentialVault.retrieve('spaggiari');
 *   if (token) await provider.connect({ endpoint: '...', schoolCode: '...', apiKey: token });
 */

// Provider layer
export { AxiosProvider }       from './providers/axiosProvider';
export { SpaggiariProvider }   from './providers/spaggiariProvider';
export { ArgoProvider }        from './providers/argoProvider';
export { providerRegistry }    from './providerRegistry';

// Normalization
export {
    normalizeStudent,
    normalizeStudents,
    normalizeGrade,
    normalizeGrades,
    normalizeClass,
    normalizeClasses,
} from './normalizer';

// Sync engine
export {
    importStudentsFromRegistry,
    importGradesFromRegistry,
    exportGradesToRegistry,
} from './syncEngine';

// KG bridge
export { linkSyncResultToKG, importAndLink } from './kgBridge';

// Document templates
export { generateOfficialDocument } from './documentTemplates';
export type { DocumentGenerationInput } from './documentTemplates';

// Compliance
export { complianceLog }    from './complianceLog';
export { credentialVault }  from './credentialVault';

// Chat integration
export {
    registerSchoolSystemRules,
    triggerSchoolSyncFromChat,
    parseSyncCommand,
    SYNC_COMMAND_PATTERNS,
} from './chatCommands';
export type { SyncFromChatParams, SyncFromChatResult } from './chatCommands';

// Types
export type {
    SchoolSystemProvider,
    ProviderCredentials,
    RawStudent, RawGrade, RawClass, RawAttendance,
    NormalizedClass,
    SyncResult, SyncEntity, SyncDirection,
    OfficialDocumentType, OfficialDocumentTemplate, ExportableDocument,
    ComplianceAuditEntry,
} from './types';

// ─── One-time initialisation ──────────────────────────────────────────────────

/**
 * Register all school system automation rules.
 * Call once at app startup (e.g. from main.tsx alongside registerDefaultRules()).
 */
export { registerSchoolSystemRules as initSchoolSystems } from './chatCommands';
