/**
 * Integration & Multi-Surface Types
 *
 * Defines the contract for external connectors (Google Classroom, Drive),
 * chat adapters (WhatsApp, Telegram), and the shared event bus used to
 * keep all surfaces in sync.
 */

// ─── Integration Registry ────────────────────────────────────────────────────

export type IntegrationId =
    | 'google_classroom'
    | 'google_drive'
    | 'gmail'
    | 'whatsapp'
    | 'telegram';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface IntegrationMeta {
    id: IntegrationId;
    /** Human-readable label shown in ConnectButton */
    label: string;
    /** Material Symbol icon name */
    icon: string;
    /** Short description of what connecting does */
    description: string;
    /** Runtime connection state */
    status: ConnectionStatus;
    /** ISO timestamp of last successful connection */
    connectedAt?: string;
    /** Surface-specific metadata (token, email, folder, etc.) */
    metadata?: Record<string, string>;
    /** Last error message if status === 'error' */
    errorMessage?: string;
}

// ─── Command / Intent System ─────────────────────────────────────────────────

export type IntentAction =
    | 'create_class'
    | 'add_student'
    | 'import_students'
    | 'create_uda'
    | 'schedule_event'
    | 'generate_content'
    | 'show_students'
    | 'show_class'
    | 'mark_attendance'
    | 'add_evaluation'
    | 'drive_sync'
    | 'classroom_import'
    | 'show_next_step'
    // Document AI actions (image pipeline)
    | 'add_students_from_doc'
    | 'import_grades'
    | 'generate_email'
    | 'send_email'
    | 'parse_document'
    // Enterprise pipeline actions
    | 'enterprise_regulatory_parse'
    | 'enterprise_approval_resolve'
    | 'enterprise_status'
    | 'enterprise_compliance_report'
    | 'unknown';

export interface ParsedIntent {
    /** Classified action */
    action: IntentAction;
    /** Extracted parameters from the natural language text */
    params: Record<string, string>;
    /** 0–1 confidence score */
    confidence: number;
    /** Original input text */
    rawText: string;
    /** Surface that produced this intent */
    source: 'app' | 'whatsapp' | 'telegram';
}

// ─── Cross-Surface Event Bus ──────────────────────────────────────────────────

export type IntegrationEventType =
    | 'class_created'
    | 'students_imported'
    | 'student_added'
    | 'uda_created'
    | 'event_scheduled'
    | 'content_generated'
    | 'attendance_marked'
    | 'evaluation_added'
    | 'drive_synced'
    | 'classroom_synced'
    // Document AI events
    | 'document_parsed'
    | 'grades_imported'
    | 'email_sent';

export interface IntegrationEvent {
    id: string;
    type: IntegrationEventType;
    /** Which surface triggered the event */
    source: 'app' | 'whatsapp' | 'telegram' | 'classroom' | 'drive';
    /** ISO timestamp */
    timestamp: string;
    /** Serialisable payload */
    payload: Record<string, unknown>;
    /** Whether the app UI has already reacted to this event */
    acknowledged: boolean;
}

// ─── Chat Adapter Contract ────────────────────────────────────────────────────

export interface ChatChannelMessage {
    id: string;
    from: string;
    text: string;
    /** ISO timestamp */
    timestamp: string;
    /** Parsed intent if already interpreted */
    intent?: ParsedIntent;
}

export interface ChatResponse {
    text: string;
    /** Optional quick-reply chips shown in chat surface */
    suggestions?: string[];
}

/**
 * Implemented by each chat adapter (WhatsApp, Telegram, future surfaces).
 * The adapters are thin: they translate platform messages into ParsedIntent
 * and delegate execution to the commandInterpreter.
 *
 * NOTE: Actual real-time delivery (webhooks, long-polling) requires a backend
 * server. These adapters provide the interface + action mapping that can be
 * activated once a backend (e.g. Vercel Edge Function) is added.
 */
export interface ChatAdapter {
    readonly integrationId: IntegrationId;
    /** Parse an incoming platform message into a ChatChannelMessage. */
    parseIncoming(raw: unknown): ChatChannelMessage;
    /** Format an outgoing ChatResponse back to platform format. */
    formatOutgoing(response: ChatResponse): unknown;
    /** Build a webhook URL that the platform must call. */
    getWebhookUrl(baseUrl: string): string;
}

// ─── Connector Contract ───────────────────────────────────────────────────────

/** Returned by classroom.listCourses() */
export interface ClassroomCourse {
    id: string;
    name: string;
    section?: string;
    enrollmentCode?: string;
    studentCount?: number;
}

/** Returned by classroom.listStudents() */
export interface ClassroomStudent {
    id: string;
    name: string;
    email: string;
    courseId: string;
}
