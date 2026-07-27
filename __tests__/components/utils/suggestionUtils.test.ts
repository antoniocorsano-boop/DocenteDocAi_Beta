// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { analyzeSystemState } from '../../../src/utils/suggestionUtils';
import { Studente, Slot, Uda, EventoCalendario, Valutazione } from '../../../src/types';

describe('analyzeSystemState', () => {
  const emptyStudents: Studente[] = [];
  const someStudents: Studente[] = [{ id: 's1', nome: 'A', cognome: 'B', classe: '1A' }];
  
  const emptySlots: Record<string, Slot> = {};
  const filledSlots: Record<string, Slot> = { 'Lun-08:00': { giorno: 'Lunedì', ora: '08:00', classe: '1A', materia: 'Matematica' } };
  
  const emptyUdas: Uda[] = [];
  const someUdas: Uda[] = [{ id: 'u1', title: 'UDA 1', classe: '1A', materia: 'Mat', introduction: '', finalProduct: '', competencyIds: [], phases: [], evaluation: '', tools: '' }];
  
  const emptyEvals: Valutazione[] = [];
  const someEvals: Valutazione[] = [{ id: 'e1', studenteId: 's1', materia: 'Mat', tipo: 'Scritto', voto: '7', data: '2023-01-01' }];

  const emptyEvents: EventoCalendario[] = [];

  it('dovrebbe suggerire l\'importazione studenti se non ce ne sono', () => {
    const suggestion = analyzeSystemState(emptyStudents, filledSlots, someUdas, emptyEvents, someEvals);
    expect(suggestion?.id).toBe('import_students');
  });

  it('dovrebbe suggerire la configurazione orario se non ci sono slot', () => {
    const suggestion = analyzeSystemState(someStudents, emptySlots, someUdas, emptyEvents, someEvals);
    expect(suggestion?.id).toBe('setup_timetable');
  });

  it('dovrebbe suggerire l\'assistente live se non ci sono valutazioni', () => {
    const suggestion = analyzeSystemState(someStudents, filledSlots, someUdas, emptyEvents, emptyEvals);
    expect(suggestion?.id).toBe('live_assistant');
  });

  it('dovrebbe suggerire il wizard annuale se non ci sono UDA', () => {
    const suggestion = analyzeSystemState(someStudents, filledSlots, emptyUdas, emptyEvents, someEvals);
    expect(suggestion?.id).toBe('annual_wizard');
  });

  it('dovrebbe dare priorità alle scadenze imminenti', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deadlineEvent: EventoCalendario = {
      id: 'evt1', titolo: 'Scadenza PTOF', data: tomorrow.toISOString().split('T')[0], tipo: 'scadenza'
    };
    
    // Anche se manca qualcos'altro, la scadenza ha priorità nel codice (check order dependent)
    // Actually, in the implementation, priority order is fixed. Let's check logic:
    // 1. Students -> 2. Slots -> 3. Evals -> 4. UDAs -> 5. Deadlines
    // So to test Deadlines, previous must be satisfied.
    const suggestion = analyzeSystemState(someStudents, filledSlots, someUdas, [deadlineEvent], someEvals);
    expect(suggestion?.id).toBe('studio_ai');
    expect(suggestion?.message).toContain('1 scadenze imminenti');
  });

  it('dovrebbe restituire null se tutto è a posto', () => {
    const suggestion = analyzeSystemState(someStudents, filledSlots, someUdas, emptyEvents, someEvals);
    expect(suggestion).toBeNull();
  });
});
