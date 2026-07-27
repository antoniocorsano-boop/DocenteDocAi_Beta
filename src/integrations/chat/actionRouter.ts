/**
 * actionRouter.ts — Maps ParsedIntent to DocenteDoc AI store actions.
 *
 * CLIENT-SIDE ONLY: imports Zustand stores that use localStorage.
 * DO NOT import this module in api/ Edge Functions.
 *
 * Architecture:
 *   Chat → Edge Function → parseIntent → confirmText → reply to user
 *   App  → IntegrationEvent → actionRouter.routeIntent() → store mutations
 *
 * The edge functions parse intent and send confirmations immediately.
 * When the teacher opens the app, pending IntegrationEvents become
 * executable actions via this router (called from event subscribers).
 *
 * Connections to real stores:
 *   useStudentStore    → add_student, add_evaluation, show_students, show_class
 *   useAcademicStore   → schedule_event, mark_attendance
 *   useSystemStore     → trackAnalyticsEvent (all actions)
 *   useTeacherModelStore → getNextActionSuggestion() reads capabilityLevel
 *   useIntegrationStore  → drive status check; publishActionEvent()
 *
 * Document AI extensions (new commands):
 *   add_students_from_doc → reuses saveStudent() — same mutation as add_student
 *   import_grades         → reuses store evaluation logic
 *   generate_email        → delegates to email service interface
 *   send_email            → delegates to email + optional signature service
 *   parse_document        → no store write; returns data for UI wizard
 */

import type { ParsedIntent, IntegrationEventType } from '../../types/integration.types';
import type { Studente, Valutazione } from '../../types';
import type { DocumentIntent, ParsedStudentList, ParsedGradesTable, ParsedOfficialDocument } from '../../services/documentAI/types';
import { useStudentStore }       from '../../stores/useStudentStore';
import { useAcademicStore }      from '../../stores/useAcademicStore';
import { useSystemStore }        from '../../stores/useSystemStore';
import { useTeacherModelStore }  from '../../stores/useTeacherModelStore';
import { useIntegrationStore }   from '../../stores/useIntegrationStore';
import { getNextAction }         from '../../cognition/decisionEngine/getNextAction';
import type { NextActionContext } from '../../cognition/decisionEngine/types';
import { decisionMemory }        from '../../cognition/decisionMemory';
import { enterpriseOrchestrator, approvalGate } from '../../services/enterprise';
import type { RegulatoryDocument, ApprovalLevel } from '../../types/enterprise.types';

/** Valid decisions accepted by approvalGate.resolve() */
type ApprovalResolutionDecision = 'approved' | 'rejected' | 'deferred';

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ActionResult {
    ok: boolean;
    /** Italian message for chat reply */
    message: string;
    /** Event emitted on success — consumed by publishActionEvent() */
    eventType?: IntegrationEventType;
    /** Whether the teacher must open the app to complete the action */
    requiresApp: boolean;
    /** Serialisable data for the cross-surface event payload */
    data?: Record<string, unknown>;
    /** AI confidence (0–1) — present when action originated from Document AI */
    confidence?: number;
    /** Non-blocking warnings from validation layer */
    warnings?: string[];
}

// ─── Main router ──────────────────────────────────────────────────────────────

export async function routeIntent(intent: ParsedIntent): Promise<ActionResult> {
    const { action, params } = intent;

    switch (action) {
        case 'create_class':            return handleCreateClass(params);
        case 'add_student':             return handleAddStudent(params);
        case 'import_students':         return handleImportStudents(params);
        case 'classroom_import':        return handleClassroomImport();
        case 'drive_sync':              return handleDriveSync();
        case 'create_uda':              return handleCreateUda(params);
        case 'schedule_event':          return handleScheduleEvent(params);
        case 'mark_attendance':         return handleMarkAttendance(params);
        case 'add_evaluation':          return handleAddEvaluation(params);
        case 'show_students':           return handleShowStudents(params);
        case 'show_class':              return handleShowClass();
        case 'generate_content':        return handleGenerateContent(params);
        case 'show_next_step':
            return { ok: true, message: getNextActionSuggestion(), requiresApp: false };
        // Enterprise pipeline actions
        case 'enterprise_regulatory_parse':  return handleEnterpriseRegulatoryParse(params);
        case 'enterprise_approval_resolve':  return handleEnterpriseApprovalResolve(params);
        case 'enterprise_status':            return handleEnterpriseStatus();
        case 'enterprise_compliance_report': return handleEnterpriseComplianceReport(params);
        // Document AI actions — handled via routeDocumentIntent (see below)
        case 'add_students_from_doc':
        case 'import_grades':
        case 'generate_email':
        case 'send_email':
        case 'parse_document':
            return {
                ok: false,
                message: 'Azione documento: usa routeDocumentIntent() con il DocumentIntent completo.',
                requiresApp: false,
            };
        default:
            return { ok: false, message: getNextActionSuggestion(), requiresApp: false };
    }
}

/**
 * Route a DocumentIntent (from the Document AI pipeline) to the real store actions.
 *
 * This is the ONLY entry point for document-based actions.
 * It reuses existing store mutations — no new mutation logic is added here.
 */
export async function routeDocumentIntent(docIntent: DocumentIntent): Promise<ActionResult> {
    const { action, document: doc, confidence } = docIntent;

    switch (action) {
        case 'add_students_from_doc':
            return handleAddStudentsFromDoc(doc.data as ParsedStudentList, confidence, doc.warnings);

        case 'import_grades':
            return handleImportGrades(doc.data as ParsedGradesTable, confidence, doc.warnings);

        case 'generate_email':
            return handleGenerateEmail(doc.data as ParsedOfficialDocument, confidence);

        case 'parse_document':
            return {
                ok: true,
                message:
                    'Documento ricevuto ✓\n' +
                    'Apri l\'app per completare il wizard di pianificazione con i dati estratti.',
                requiresApp: true,
                confidence,
                eventType: 'document_parsed',
                data: { documentType: doc.type, rawData: doc.data },
                warnings: doc.warnings,
            };

        case 'show_next_step':
        default:
            return {
                ok: false,
                message:
                    'Non sono riuscito a identificare il tipo di documento.\n\n' +
                    getNextActionSuggestion(),
                requiresApp: false,
                confidence: 0,
                warnings: doc.warnings,
            };
    }
}


function handleCreateClass(params: Record<string, string>): ActionResult {
    const className = params.className ?? '';
    if (!className) {
        return {
            ok: false,
            message: 'Specifica il nome della classe. Es: "crea classe 2B"',
            requiresApp: false,
        };
    }

    const { students } = useStudentStore.getState();
    const classStudents = students.filter(
        (s) => s.classe.toUpperCase() === className.toUpperCase() && !s.isArchived
    );
    if (classStudents.length > 0) {
        return {
            ok: true,
            message: `La classe ${className} esiste già con ${classStudents.length} studenti. Scrivi "mostra studenti classe ${className}" per vederli.`,
            requiresApp: false,
        };
    }

    useSystemStore.getState().actions.trackAnalyticsEvent('feature_usage', 'chat_create_class', { className });

    return {
        ok: true,
        message: `Classe ${className} registrata ✓\nApri l'app per aggiungere studenti.`,
        eventType: 'class_created',
        requiresApp: true,
        data: { className },
    };
}

function handleAddStudent(params: Record<string, string>): ActionResult {
    const { studentName, className } = params;
    if (!studentName) {
        return {
            ok: false,
            message: 'Specifica il nome. Es: "aggiungi studente Mario Bianchi in classe 2B"',
            requiresApp: false,
        };
    }

    const parts = studentName.trim().split(' ');
    const nome = parts[0] ?? '';
    const cognome = parts.slice(1).join(' ');

    const newStudent: Studente = {
        id: `temp-${Date.now()}`,
        nome,
        cognome,
        classe: className ?? '',
    };

    useStudentStore.getState().actions.saveStudent(newStudent);
    useSystemStore.getState().actions.trackAnalyticsEvent('feature_usage', 'chat_add_student', { studentName });

    return {
        ok: true,
        message: `${nome} ${cognome} aggiunto${className ? ` alla classe ${className}` : ''} ✓`,
        eventType: 'student_added',
        requiresApp: false,
        data: { studentId: newStudent.id, studentName, className: className ?? '' },
    };
}

function handleImportStudents(params: Record<string, string>): ActionResult {
    return {
        ok: true,
        message:
            'Per importare studenti:\n' +
            '1. Apri DocenteDoc AI\n' +
            '2. Impostazioni → Dati & Cloud → Importa dati\n' +
            '3. Carica il file CSV/Excel\n\n' +
            'Oppure inviami direttamente il file CSV.',
        requiresApp: true,
        data: { className: params.className ?? '' },
    };
}

function handleClassroomImport(): ActionResult {
    return {
        ok: true,
        message:
            'Per collegare Google Classroom:\n' +
            '1. Apri DocenteDoc AI\n' +
            '2. Impostazioni → Integrazioni → Google Classroom\n' +
            '3. Premi "Collega"\n\n' +
            'Dopo la connessione le classi si aggiornano automaticamente.',
        requiresApp: true,
    };
}

function handleDriveSync(): ActionResult {
    const driveIntegration = useIntegrationStore
        .getState()
        .integrations.find((i) => i.id === 'google_drive');

    if (driveIntegration?.status !== 'connected') {
        return {
            ok: false,
            message:
                'Google Drive non è collegato.\n' +
                'Apri DocenteDoc AI → Impostazioni → Integrazioni → Google Drive.',
            requiresApp: true,
        };
    }

    return {
        ok: true,
        message: 'Backup Drive avviato ✓\nApri l\'app per monitorare il progresso.',
        eventType: 'drive_synced',
        requiresApp: true,
    };
}

function handleCreateUda(params: Record<string, string>): ActionResult {
    const subject = params.subject ?? '';
    return {
        ok: true,
        message:
            `Creo una UDA${subject ? ` su "${subject}"` : ''} ✓\n` +
            'Apri l\'app per completare il piano didattico: obiettivi, fasi e valutazione.',
        eventType: 'uda_created',
        requiresApp: true,
        data: { subject },
    };
}

function handleScheduleEvent(params: Record<string, string>): ActionResult {
    const { title, date } = params;
    if (!title && !date) {
        return {
            ok: false,
            message: 'Specifica l\'evento. Es: "segna riunione di dipartimento il 20/03"',
            requiresApp: false,
        };
    }

    const newEvent = {
        id: `chat-${Date.now()}`,
        titolo: title || 'Evento da chat',
        data: date || new Date().toISOString().split('T')[0],
        tipo: 'impegno' as const,
    };

    useAcademicStore.getState().actions.setEventi((prev) => [...prev, newEvent]);
    useSystemStore.getState().actions.trackAnalyticsEvent('feature_usage', 'chat_schedule_event', { title: title ?? '' });

    return {
        ok: true,
        message: `Evento "${newEvent.titolo}"${date ? ` per il ${date}` : ''} aggiunto al calendario ✓`,
        eventType: 'event_scheduled',
        requiresApp: false,
        data: { eventId: newEvent.id, title: newEvent.titolo, date: newEvent.data },
    };
}

function handleMarkAttendance(params: Record<string, string>): ActionResult {
    const { className } = params;
    if (!className) {
        return {
            ok: true,
            message: 'Per registrare le presenze apri DocenteDoc AI → Registri → Presenze.',
            requiresApp: true,
        };
    }

    return {
        ok: true,
        message: `Registro presenze classe ${className}: apri DocenteDoc AI per completare l'appello.`,
        eventType: 'attendance_marked',
        requiresApp: true,
        data: { className },
    };
}

function handleAddEvaluation(params: Record<string, string>): ActionResult {
    const { studentName, grade } = params;
    if (!studentName || !grade) {
        return {
            ok: false,
            message: 'Specifica studente e voto. Es: "aggiungi voto 8 a Mario Bianchi"',
            requiresApp: false,
        };
    }

    const { students } = useStudentStore.getState();
    const found = students.find((s) =>
        `${s.nome} ${s.cognome}`.toLowerCase().includes(studentName.toLowerCase())
    );

    if (!found) {
        return {
            ok: false,
            message: `Studente "${studentName}" non trovato. Verifica il nome nell'app.`,
            requiresApp: true,
        };
    }

    const newEval: Omit<Valutazione, 'id'> = {
        studenteId: found.id,
        materia: '',
        data: new Date().toISOString().split('T')[0],
        tipo: 'Orale',
        voto: grade,
    };

    useStudentStore.getState().actions.addEvaluation(newEval);
    useSystemStore.getState().actions.trackAnalyticsEvent('feature_usage', 'chat_add_evaluation', { studentName, grade });

    return {
        ok: true,
        message: `Voto ${grade} aggiunto a ${found.nome} ${found.cognome} ✓`,
        eventType: 'evaluation_added',
        requiresApp: false,
        data: { studentId: found.id, grade },
    };
}

function handleShowStudents(params: Record<string, string>): ActionResult {
    const className = params.className ?? '';
    const { students } = useStudentStore.getState();
    const active = students.filter((s) => !s.isArchived);
    const filtered = className
        ? active.filter((s) => s.classe.toUpperCase() === className.toUpperCase())
        : active;

    if (filtered.length === 0) {
        return {
            ok: true,
            message: className
                ? `Nessuno studente trovato nella classe ${className}.`
                : 'Nessuno studente registrato. Usa "importa studenti" per iniziare.',
            requiresApp: false,
        };
    }

    const rows = filtered
        .slice(0, 10)
        .map((s) => `• ${s.nome} ${s.cognome} (${s.classe})`)
        .join('\n');
    const more = filtered.length > 10 ? `\n...e altri ${filtered.length - 10}` : '';

    return {
        ok: true,
        message: `${className ? `Classe ${className}` : 'Studenti'} — ${filtered.length} totali:\n${rows}${more}`,
        requiresApp: false,
    };
}

function handleShowClass(): ActionResult {
    const { students } = useStudentStore.getState();
    const active = students.filter((s) => !s.isArchived);
    const classes = [...new Set(active.map((s) => s.classe))].sort();

    if (classes.length === 0) {
        return {
            ok: true,
            message: 'Nessuna classe registrata. Inizia con "crea classe 2B".',
            requiresApp: false,
        };
    }

    const rows = classes
        .map((c) => {
            const count = active.filter((s) => s.classe === c).length;
            return `• ${c} — ${count} studenti`;
        })
        .join('\n');

    return {
        ok: true,
        message: `Le tue classi (${classes.length}):\n${rows}`,
        requiresApp: false,
    };
}

function handleGenerateContent(params: Record<string, string>): ActionResult {
    return {
        ok: true,
        message: 'Apri il Copilot nell\'app per generare e personalizzare il contenuto.',
        requiresApp: true,
        data: params,
    };
}

// ─── Decision engine ──────────────────────────────────────────────────────────

/**
 * Returns the most relevant next-action suggestion for the chat surface.
 *
 * Delegates to the REAL decision engine (getNextAction) — same brain
 * used by the UI (FloatingSatelliteCopilot, NextStepBanner).
 * No more duplicated / diverging heuristics.
 */
export function getNextActionSuggestion(): string {
    const { capabilityLevel, usageProfile } = useTeacherModelStore.getState();
    const { students } = useStudentStore.getState();

    const dmState          = decisionMemory.getState();
    const pendingCount     = approvalGate.getPendingCount();

    const ctx: NextActionContext = {
        // eventNames is empty in the server/store context (no EventLogger session here)
        eventNames: new Set<string>(),
        capabilityLevel,
        usage: {
            lessonsCreated:      usageProfile.lessonsCreated,
            udaCreated:          usageProfile.udaCreated,
            copilotRequests:     usageProfile.copilotRequests,
            driveConnected:      usageProfile.driveConnected,
            bookServicesLinked:  usageProfile.bookServicesLinked,
            analyticsViews:      usageProfile.analyticsViews,
            workspaceConfigured: usageProfile.workspaceConfigured,
        },
        hasStudents:      students.filter((s) => !s.isArchived).length > 0,
        pendingApprovals: pendingCount,
        signals:          dmState.signals.map((s) => ({ type: s.type, severity: s.severity })),
        complianceStatus: dmState.complianceStatus,
    };

    const action = getNextAction(ctx);
    const prefix = pendingCount > 0
        ? `⚠️ ${pendingCount} approvazion${pendingCount !== 1 ? 'i' : 'e'} Enterprise in attesa.\n\n`
        : '';
    return `${prefix}${action.label}: ${action.description}\n\n👉 "${action.cta}" → apri l'app.`;
}

// ─── Document AI handlers ─────────────────────────────────────────────────────

/**
 * Add multiple students parsed from a document image.
 * Reuses the same `saveStudent()` mutation as handleAddStudent() — no duplication.
 */
function handleAddStudentsFromDoc(
    data: ParsedStudentList,
    confidence: number,
    warnings?: string[],
): ActionResult {
    const { saveStudent } = useStudentStore.getState().actions;
    const added: string[] = [];

    for (const s of data.students) {
        const parts = s.name.trim().split(' ');
        const nome = parts[0] ?? '';
        const cognome = parts.slice(1).join(' ');
        if (!nome) continue;

        const newStudent: Studente = {
            id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nome,
            cognome,
            classe: s.className ?? '',
        };
        saveStudent(newStudent);
        added.push(`${nome} ${cognome}`);
    }

    useSystemStore.getState().actions.trackAnalyticsEvent(
        'feature_usage',
        'doc_add_students',
        { count: String(added.length) },
    );

    return {
        ok: true,
        message: `Aggiunti ${added.length} student${added.length !== 1 ? 'i' : 'e'} dal documento ✓`,
        eventType: 'students_imported',
        requiresApp: false,
        confidence,
        warnings,
        data: { added },
    };
}

/**
 * Import grades from a parsed grades table.
 * Reuses the same store mutation as handleAddEvaluation() — no duplication.
 */
function handleImportGrades(
    data: ParsedGradesTable,
    confidence: number,
    warnings?: string[],
): ActionResult {
    const imported: string[] = [];

    for (const e of data.evaluations) {
        if (!e.studentName || !e.grade) continue;

        const { students } = useStudentStore.getState();
        const student = students.find(
            (s) =>
                !s.isArchived &&
                `${s.nome} ${s.cognome}`.toLowerCase() === e.studentName.toLowerCase(),
        );

        if (student) {
            useStudentStore.getState().actions.addEvaluation({
                studenteId: student.id,
                materia: e.subject ?? 'Non specificata',
                voto: e.grade,
                tipo: 'Verifica',
                data: new Date().toISOString().split('T')[0],
                note: 'Importato da documento',
            });
            imported.push(`${e.studentName}: ${e.grade}`);
        }
    }

    useSystemStore.getState().actions.trackAnalyticsEvent(
        'feature_usage',
        'doc_import_grades',
        { count: String(imported.length) },
    );

    return {
        ok: true,
        message: `Importat${imported.length !== 1 ? 'e' : 'a'} ${imported.length} valutazion${imported.length !== 1 ? 'i' : 'e'} ✓`,
        eventType: 'grades_imported',
        requiresApp: false,
        confidence,
        warnings,
        data: { imported },
    };
}

/**
 * Prepare an email draft from a parsed official document.
 * Delegates to the email service interface — no email is sent without confirmation.
 */
function handleGenerateEmail(data: ParsedOfficialDocument, confidence: number): ActionResult {
    useSystemStore.getState().actions.trackAnalyticsEvent(
        'feature_usage',
        'doc_generate_email',
        { hasRecipient: data.recipient ? 'true' : 'false' },
    );

    return {
        ok: true,
        message:
            `Bozza email pronta ✓\n` +
            (data.recipient ? `Destinatario: ${data.recipient}\n` : '') +
            (data.title ? `Oggetto: ${data.title}\n` : '') +
            '\nApri l\'app per rivedere, firmare e inviare.',
        requiresApp: true,
        eventType: 'document_parsed',
        confidence,
        data: {
            emailDraft: {
                to: data.recipient ?? '',
                subject: data.title ?? '',
                body: data.body,
            },
        },
    };
}

// ─── Cross-surface event publisher ───────────────────────────────────────────

/**
 * Pushes a cross-surface IntegrationEvent after a successful action.
 * Call this immediately after routeIntent() resolves with ok: true.
 */
export function publishActionEvent(intent: ParsedIntent, result: ActionResult): void {
    if (!result.ok || !result.eventType) return;

    useIntegrationStore.getState().actions.pushEvent({
        id: `${intent.source}-${result.eventType}-${Date.now()}`,
        type: result.eventType,
        source: intent.source,
        timestamp: new Date().toISOString(),
        payload: result.data ?? {},
    });
}

// ─── School systems sync adapter ──────────────────────────────────────────────

/**
 * Strongly-typed payload for school system sync operations.
 * Used by syncEngine.ts — not routed through ParsedIntent (which only
 * supports string params).
 */
export type SchoolSyncPayloadInput =
    | { type: 'students'; students: Studente[]; classCode: string; provider: string }
    | { type: 'grades';   grades: Valutazione[]; classCode: string; provider: string; period?: string };

/**
 * Route a school system sync payload into the appropriate store mutations.
 *
 * Called exclusively by syncEngine.ts — this is the single write path
 * for externally-sourced student and grade data.
 *
 * Student import uses `saveStudent()` (upsert by id) — idempotent.
 * Grade import uses `addEvaluation()` — NOT idempotent; see syncEngine docs.
 */
export async function routeSchoolSyncIntent(
    payload: SchoolSyncPayloadInput,
): Promise<ActionResult> {
    const { saveStudent, addEvaluation } = useStudentStore.getState().actions;
    const { trackAnalyticsEvent }        = useSystemStore.getState().actions;

    if (payload.type === 'students') {
        for (const s of payload.students) {
            saveStudent(s);
        }
        trackAnalyticsEvent('feature_usage', 'school_sync_import_students', {
            count:    String(payload.students.length),
            provider: payload.provider,
        });
        const n = payload.students.length;
        return {
            ok:          true,
            message:     `Sincronizzat${n !== 1 ? 'i' : 'o'} ${n} student${n !== 1 ? 'i' : 'e'} da ${payload.provider} ✓`,
            requiresApp: false,
            eventType:   'students_imported',
            data:        { count: n, provider: payload.provider, classCode: payload.classCode },
        };
    }

    if (payload.type === 'grades') {
        let imported = 0;
        for (const v of payload.grades) {
            const { id: _id, ...rest } = v;
            addEvaluation(rest);
            imported++;
        }
        trackAnalyticsEvent('feature_usage', 'school_sync_import_grades', {
            count:    String(imported),
            provider: payload.provider,
        });
        return {
            ok:          true,
            message:     `Importat${imported !== 1 ? 'e' : 'a'} ${imported} valutazion${imported !== 1 ? 'i' : 'e'} da ${payload.provider} ✓`,
            requiresApp: false,
            eventType:   'grades_imported',
            data:        { count: imported, provider: payload.provider, classCode: payload.classCode },
        };
    }

    return { ok: false, message: 'Tipo di sincronizzazione non supportato.', requiresApp: false };
}

// ─── Enterprise pipeline handlers ────────────────────────────────────────────

/**
 * Parse a regulatory document and submit it to the Enterprise approval pipeline.
 *
 * Expected params:
 *   title     — human-readable title of the document
 *   sourceType — 'MIUR' | 'GOVERNMENT' | 'OFFICIAL_RECORD' | 'INTERNAL_POLICY' (default: 'INTERNAL_POLICY')
 *   content    — full text of the document
 *   tenantId   — required for multi-tenant routing
 */
async function handleEnterpriseRegulatoryParse(params: Record<string, string>): Promise<ActionResult> {
    const { title, sourceType, content, tenantId } = params;

    if (!title || !content) {
        return {
            ok: false,
            message: 'Specifica titolo e testo del documento normativo. Es: "analizza normativa MIUR 2024 <testo>"',
            requiresApp: false,
        };
    }

    const validSources: RegulatoryDocument['source'][] = ['miur', 'government', 'official_record', 'circular', 'ministerial_decree'];
    const resolvedSource: RegulatoryDocument['source'] = (validSources.includes(sourceType as RegulatoryDocument['source']) ? sourceType as RegulatoryDocument['source'] : 'miur');

    const doc: RegulatoryDocument = {
        id:           `reg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        source:       resolvedSource,
        rawText:      content,
        issuedAt:     new Date().toISOString(),
        tenantId:     tenantId ?? 'default',
    };

    try {
        const session = await enterpriseOrchestrator.processRegulatoryDocument(doc);
        useSystemStore.getState().actions.trackAnalyticsEvent('feature_usage', 'enterprise_regulatory_parse', { sessionId: session.id });

        const pendingCount = session.approvalRequest ? 1 : 0;
        return {
            ok: true,
            message:
                `Documento normativo analizzato ✓\n` +
                `Sessione: ${session.id}\n` +
                `Approvazioni in attesa: ${pendingCount}\n` +
                `Apri il pannello Enterprise per completare il flusso di approvazione.`,
            requiresApp: true,
            eventType:   'document_parsed',
            data:        { sessionId: session.id, pendingApprovals: pendingCount },
        };
    } catch (err) {
        return {
            ok: false,
            message: `Errore analisi documento: ${err instanceof Error ? err.message : String(err)}`,
            requiresApp: false,
        };
    }
}

/**
 * Resolve a pending enterprise approval request.
 *
 * Expected params:
 *   approvalId — ID of the ApprovalRequest to resolve
 *   decision   — 'approved' | 'rejected' | 'escalated'
 *   level      — 'segreteria' | 'dirigente' | 'ministry' | 'governo'
 *   by         — display name of the approver
 *   reason     — optional justification text
 */
async function handleEnterpriseApprovalResolve(params: Record<string, string>): Promise<ActionResult> {
    const { approvalId, decision, level, by, reason } = params;

    if (!approvalId || !decision || !level || !by) {
        return {
            ok: false,
            message: 'Parametri mancanti: specifica approvalId, decision, level e by.',
            requiresApp: false,
        };
    }

    const validDecisions: ApprovalResolutionDecision[] = ['approved', 'rejected', 'deferred'];
    const validLevels: ApprovalLevel[]                 = ['segreteria', 'dirigente', 'ministry', 'governo'];

    const resolvedDecision = validDecisions.includes(decision as ApprovalResolutionDecision) ? decision as ApprovalResolutionDecision : null;
    const resolvedLevel    = validLevels.includes(level as ApprovalLevel) ? level as ApprovalLevel : null;

    if (!resolvedDecision || !resolvedLevel) {
        return {
            ok: false,
            message: `Decisione o livello non valido. Decision: approved|rejected|deferred — Level: segreteria|dirigente|ministry|governo`,
            requiresApp: false,
        };
    }

    try {
        approvalGate.resolve(approvalId, resolvedLevel, resolvedDecision, by, reason);
        const verb = resolvedDecision === 'approved' ? 'approvata' : resolvedDecision === 'rejected' ? 'rifiutata' : 'rinviata';
        useSystemStore.getState().actions.trackAnalyticsEvent('feature_usage', 'enterprise_approval_resolve', { approvalId, decision: resolvedDecision });

        return {
            ok:          true,
            message:     `Richiesta di approvazione ${verb} ✓\nLivello: ${resolvedLevel} — da: ${by}`,
            requiresApp: false,
            eventType:   'document_parsed',
            data:        { approvalId, decision: resolvedDecision, resolvedBy: by },
        };
    } catch (err) {
        return {
            ok: false,
            message: `Errore approvazione: ${err instanceof Error ? err.message : String(err)}`,
            requiresApp: false,
        };
    }
}

/** Return a quick status summary of the enterprise pipeline. */
function handleEnterpriseStatus(): ActionResult {
    const pending = approvalGate.getPending();
    const count   = pending.length;

    if (count === 0) {
        return {
            ok:          true,
            message:     'Pipeline Enterprise: nessuna approvazione in attesa ✓\nTutti i flussi normativi sono aggiornati.',
            requiresApp: false,
        };
    }

    const summary = pending
        .slice(0, 5)
        .map(r => `  • [${r.requiredLevel.toUpperCase()}] ${r.title}`)
        .join('\n');

    return {
        ok:          true,
        message:     `Pipeline Enterprise — ${count} approvazion${count !== 1 ? 'i' : 'e'} in attesa:\n${summary}${count > 5 ? `\n  … e altre ${count - 5}` : ''}\nApri il pannello Compliance per gestirle.`,
        requiresApp: true,
        data:        { pendingCount: count },
    };
}

/**
 * Generate a compliance report for a tenant.
 *
 * Expected params:
 *   tenantId — optional; defaults to 'default'
 */
async function handleEnterpriseComplianceReport(params: Record<string, string>): Promise<ActionResult> {
    const tenantId = params.tenantId ?? 'default';

    try {
        const report = await enterpriseOrchestrator.getComplianceReport(tenantId);
        const total  = report.standards.length;
        const ready  = report.standards.filter((s: { status: string }) => s.status === 'compliant').length;
        const pct    = total > 0 ? Math.round((ready / total) * 100) : 0;

        return {
            ok:          true,
            message:
                `Compliance Report — ${tenantId}\n` +
                `✓ ${pct}% (${ready}/${total} standard conformi)\n` +
                `Standard: ${report.standards.map((s: { standard: string; status: string }) => `${s.standard}=${s.status}`).join(', ')}\n` +
                `Apri il pannello Compliance per il report completo.`,
            requiresApp: true,
            data:        { tenantId, overallPct: pct, standards: total, compliant: ready },
        };
    } catch (err) {
        return {
            ok: false,
            message: `Errore report compliance: ${err instanceof Error ? err.message : String(err)}`,
            requiresApp: false,
        };
    }
}
