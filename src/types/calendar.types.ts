// ============================================================================
// CALENDAR DOMAIN — calendar events and event type enums
// ============================================================================

export type TipoEvento = 'impegno' | 'scadenza' | 'consiglio' | 'formazione' | 'urgente' | 'riunione';

export interface EventoCalendario {
    id: string;
    titolo: string;
    data: string;
    dataFine?: string;
    tipo: TipoEvento;
    oraInizio?: string;
    oraFine?: string;
    descrizione?: string;
    location?: string;
}
