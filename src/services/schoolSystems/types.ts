/**
 * schoolSystems/types.ts — Shared types for external school system integration.
 *
 * All external data flows through this type layer before reaching
 * DocenteDoc's core Studente / Valutazione types via the normalizer.
 *
 * Architecture: external provider → normalizer → routeSchoolSyncIntent → store
 *
 * SECURITY: ProviderCredentials.password must NEVER be stored in any
 * persistent layer. Delegate token/key storage to credentialVault.ts.
 */

// ─── Provider credentials ─────────────────────────────────────────────────────

/**
 * Runtime-only credential bundle. Clear `.password` from memory immediately
 * after a successful `.connect()` call (providers must do this themselves).
 */
export interface ProviderCredentials {
    /** Base URL of the school system REST API */
    readonly endpoint: string;
    /** Italian codice meccanografico (e.g. "BSIC81200G") */
    readonly schoolCode: string;
    /** API token / JWT — store encrypted via credentialVault */
    apiKey?: string;
    /** Username for basic-auth providers */
    readonly username?: string;
    /** NEVER persist — held in plain text in memory only during auth */
    password?: string;
}

// ─── Raw external formats (pre-normalization) ─────────────────────────────────

export interface RawStudent {
    externalId: string;
    firstName: string;
    lastName: string;
    classCode: string;
    birthDate?: string;       // ISO 8601 or provider-native format
    fiscalCode?: string;      // codice fiscale
    specialNeeds?: {
        bes?: boolean;
        dsa?: boolean;
        l104?: boolean;
    };
}

export interface RawGrade {
    externalId: string;
    studentExternalId: string;
    subject: string;           // subject code or display name
    date: string;              // ISO 8601
    gradeValue: string;        // "7", "8.5", "ottimo", "A"
    gradeType?: string;        // "oral" | "scritto" | "pratico" — provider-specific
    period?: string;           // "Q1" | "Q2" | "scrutinio_finale"
    note?: string;
}

export interface RawClass {
    externalId: string;
    code: string;              // "3A"
    year: number;              // 3
    schoolYear: string;        // "2025/2026"
    section?: string;          // "A"
    course?: string;           // "Liceo Scientifico"
}

export interface RawAttendance {
    studentExternalId: string;
    date: string;              // ISO 8601
    classCode: string;
    type: 'absent' | 'late' | 'justified' | 'early_exit';
    minutes?: number;          // for late/early_exit only
    note?: string;
}

// ─── Normalized provider-agnostic class record ────────────────────────────────

export interface NormalizedClass {
    id: string;                // stable key: `ext_${providerId}_class_${externalId}`
    externalId: string;
    providerId: string;
    code: string;
    year: number;
    schoolYear: string;
    course?: string;
}

// ─── Provider contract ────────────────────────────────────────────────────────

/**
 * All school system integrations must implement this interface.
 * Adapters are the ONLY code that speaks provider-native formats.
 */
export interface SchoolSystemProvider {
    /** Stable unique identifier — used in compliance logs and KG metadata */
    readonly id: string;
    /** Human-readable display name */
    readonly name: string;

    /**
     * Authenticate with the provider.
     * MUST clear `credentials.password` from memory before returning.
     */
    connect(credentials: ProviderCredentials): Promise<boolean>;
    disconnect(): Promise<void>;
    isConnected(): boolean;

    fetchClasses(): Promise<RawClass[]>;
    fetchStudents(classCode: string): Promise<RawStudent[]>;
    fetchGrades(classCode: string, period?: string): Promise<RawGrade[]>;
    pushGrade(grade: RawGrade): Promise<{ ok: boolean; externalId?: string }>;
    pushAttendance(entry: RawAttendance): Promise<{ ok: boolean }>;
}

// ─── Sync results ─────────────────────────────────────────────────────────────

export type SyncEntity = 'students' | 'grades' | 'classes' | 'attendance';
export type SyncDirection = 'import' | 'export';

export interface SyncResult {
    provider: string;
    direction: SyncDirection;
    entity: SyncEntity;
    classCode?: string;
    period?: string;
    total: number;
    imported: number;
    skipped: number;
    errors: string[];
    timestamp: string;    // ISO 8601
}

// ─── Official document templates ──────────────────────────────────────────────

export type OfficialDocumentType =
    | 'pagella'                     // school report card
    | 'verbale_scrutinio'           // grading meeting minutes
    | 'relazione_finale'            // end-of-year class report
    | 'certificazione_competenze'   // competency certification
    | 'piano_recupero'              // remediation plan
    | 'comunicazione_famiglie';     // family communication letter

export interface OfficialDocumentTemplate {
    type: OfficialDocumentType;
    schoolName: string;
    schoolCode: string;
    schoolYear: string;
    teacherName: string;
    subject?: string;
    classCode: string;
    generatedAt: string;  // ISO 8601
}

export interface ExportableDocument {
    type: OfficialDocumentType;
    filename: string;
    /** Markdown content — renderable or convertible to PDF */
    content: string;
    metadata: OfficialDocumentTemplate;
}

// ─── Compliance audit entry ───────────────────────────────────────────────────

export interface ComplianceAuditEntry {
    id: string;              // `audit_${timestamp}_${random}`
    timestamp: string;       // ISO 8601
    action: string;          // e.g. "sync_import_students"
    operator?: string;       // teacher name or "system"
    /** Serialisable context — no passwords, no tokens */
    context: Record<string, unknown>;
}
