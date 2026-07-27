import { create } from 'zustand';
import type { IntegrationMeta, IntegrationEvent, ConnectionStatus } from '../types/integration.types';

// ─── Default integration registry ────────────────────────────────────────────

const DEFAULT_INTEGRATIONS: IntegrationMeta[] = [
    {
        id: 'google_classroom',
        label: 'Google Classroom',
        icon: 'school',
        description: 'Importa classi e studenti direttamente da Classroom',
        status: 'disconnected',
    },
    {
        id: 'google_drive',
        label: 'Google Drive',
        icon: 'add_to_drive',
        description: 'Backup automatico e sincronizzazione dati',
        status: 'disconnected',
    },
    {
        id: 'gmail',
        label: 'Gmail',
        icon: 'mail',
        description: 'Ricevi e analizza email direttamente nel workspace',
        status: 'disconnected',
    },
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: 'chat',
        description: 'Azioni rapide via chat. Crea classi, registra presenze, importa file.',
        status: 'disconnected',
    },
    {
        id: 'telegram',
        label: 'Telegram',
        icon: 'send',
        description: 'Copilot esteso via Telegram. Stesso cervello, interfaccia chat.',
        status: 'disconnected',
    },
];

// ─── Store state ──────────────────────────────────────────────────────────────

interface IntegrationState {
    integrations: IntegrationMeta[];
    /** Cross-surface event log — all changes from all channels end up here */
    events: IntegrationEvent[];
    /** Whether unacknowledged events exist */
    hasPendingEvents: boolean;
}

interface IntegrationActions {
    /** Update the connection status of one integration */
    setIntegrationStatus: (id: string, status: ConnectionStatus, metadata?: Record<string, string>) => void;
    setIntegrationError: (id: string, message: string) => void;
    disconnectIntegration: (id: string) => void;
    /** Push a new cross-surface event to the log */
    pushEvent: (event: Omit<IntegrationEvent, 'acknowledged'>) => void;
    /** Mark all pending events as acknowledged */
    acknowledgeEvents: () => void;
}

interface IntegrationStore extends IntegrationState {
    actions: IntegrationActions;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useIntegrationStore = create<IntegrationStore>((set) => ({
    integrations: DEFAULT_INTEGRATIONS,
    events: [],
    hasPendingEvents: false,

    actions: {
        setIntegrationStatus: (id, status, metadata) =>
            set((state) => ({
                integrations: state.integrations.map((i) =>
                    i.id === id
                        ? {
                              ...i,
                              status,
                              metadata: metadata ?? i.metadata,
                              connectedAt:
                                  status === 'connected'
                                      ? new Date().toISOString()
                                      : i.connectedAt,
                              errorMessage: undefined,
                          }
                        : i
                ),
            })),

        setIntegrationError: (id, message) =>
            set((state) => ({
                integrations: state.integrations.map((i) =>
                    i.id === id ? { ...i, status: 'error' as ConnectionStatus, errorMessage: message } : i
                ),
            })),

        disconnectIntegration: (id) =>
            set((state) => ({
                integrations: state.integrations.map((i) =>
                    i.id === id
                        ? { ...i, status: 'disconnected' as ConnectionStatus, connectedAt: undefined, metadata: undefined, errorMessage: undefined }
                        : i
                ),
            })),

        pushEvent: (event) =>
            set((state) => ({
                events: [{ ...event, acknowledged: false }, ...state.events].slice(0, 200), // keep last 200
                hasPendingEvents: true,
            })),

        acknowledgeEvents: () =>
            set((state) => ({
                events: state.events.map((e) => ({ ...e, acknowledged: true })),
                hasPendingEvents: false,
            })),
    },
}));
