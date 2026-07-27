import { Studente, Slot, Uda, EventoCalendario, Valutazione, SystemSuggestion } from '../types';

export const analyzeSystemState = (
    students: Studente[],
    slots: Record<string, Slot>,
    uda: Uda[],
    events: EventoCalendario[],
    evaluations: Valutazione[] = []
): SystemSuggestion | null => {
    
    // 1. Priority: System Setup (No Students)
    if (students.length === 0) {
        return {
            id: 'import_students',
            message: 'Non hai ancora inserito studenti. Inizia da qui.',
            targetView: 'aula', // Target the Class/Students section
            actionLabel: 'Importa',
            // FIX: Add missing 'action' property
            action: { type: 'navigate', payload: 'aula' }
        };
    }

    // 2. Priority: Timetable Setup (No Slots defined)
    const hasSchedule = Object.values(slots).some(s => !!s.classe);
    if (!hasSchedule) {
        return {
            id: 'setup_timetable',
            message: 'Il tuo orario è vuoto. Configuralo per gestire le lezioni.',
            targetView: 'timetable',
            actionLabel: 'Configura',
            // FIX: Add missing 'action' property
            action: { type: 'navigate', payload: 'timetable' }
        };
    }

    // 3. Priority: Initial Activity (No evaluations yet)
    if (evaluations.length === 0) {
        return {
            id: 'live_assistant',
            message: 'Nessun voto registrato. Usa l\'assistente per iniziare.',
            targetView: 'live-assistant', // Opens modal usually, but logic handles view mapping
            actionLabel: 'Avvia',
            // FIX: Add missing 'action' property
            action: { type: 'modal', payload: 'isLiveAssistantModalOpen' }
        };
    }
    
    // 4. Priority: Annual Planning (No UDAs)
    if (uda.length === 0) {
        return {
            id: 'annual_wizard',
            message: 'Pianifica il tuo anno scolastico con il Wizard UDA.',
            targetView: 'progettazione-hub',
            actionLabel: 'Pianifica',
            // FIX: Add missing 'action' property
            action: { type: 'navigate', payload: { view: 'progettazione-hub', context: { action: 'annual-planning' } } }
        };
    }

    // 5. Priority: Operational (Check for upcoming deadlines)
    const today = new Date();
    const upcomingDeadlines = events.filter(e => 
        e.tipo === 'scadenza' && 
        new Date(e.data) > today && 
        new Date(e.data).getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000 // Next 7 days
    );

    if (upcomingDeadlines.length > 0) {
        return {
            id: 'studio_ai',
            message: `Hai ${upcomingDeadlines.length} scadenze imminenti. Prepara i materiali.`,
            targetView: 'calendario',
            actionLabel: 'Vedi',
            // FIX: Add missing 'action' property
            action: { type: 'navigate', payload: 'calendario' }
        };
    }

    return null;
};

