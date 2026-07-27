// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { useAcademicStore } from '../../src/stores/useAcademicStore';
import { Lezione, EventoCalendario } from '../../src/types';

describe('useAcademicStore', () => {
  beforeEach(() => {
    useAcademicStore.getState().actions.resetAcademicData();
  });

  // Lessons Tests
  describe('Lessons', () => {
    it('dovrebbe inizializzare con oggetto vuoto di lezioni', () => {
      expect(useAcademicStore.getState().lessons).toEqual({});
    });

    it('dovrebbe impostare lezioni', () => {
      const lessons: Record<string, Lezione> = {
        'lez1': {
          id: 'lez1',
          classe: 'III-A',
          materia: 'Italiano',
          contenuto: '<p>Contenuto</p>',
          svolta: false,
        },
      };

      useAcademicStore.getState().actions.setLessons(lessons);
      expect(useAcademicStore.getState().lessons).toEqual(lessons);
      expect(useAcademicStore.getState().lessons['lez1']?.materia).toBe('Italiano');
    });

    it('dovrebbe aggiornare lezioni tramite funzione', () => {
      const initialLessons: Record<string, Lezione> = {
        'lez1': {
          id: 'lez1',
          classe: 'III-A',
          materia: 'Italiano',
          contenuto: '<p>Contenuto</p>',
          svolta: false,
        },
      };

      useAcademicStore.getState().actions.setLessons(initialLessons);
      
      useAcademicStore.getState().actions.setLessons((prev: Record<string, Lezione>) => ({
        ...prev,
        'lez2': {
          id: 'lez2',
          classe: 'III-A',
          materia: 'Italiano',
          contenuto: '<p>Contenuto 2</p>',
          svolta: false,
        },
      }));

      expect(Object.keys(useAcademicStore.getState().lessons).length).toBe(2);
    });
  });

  // Events Tests
  describe('Events (Calendario)', () => {
    it('dovrebbe inizializzare con array vuoto di eventi', () => {
      expect(useAcademicStore.getState().eventi).toEqual([]);
    });

    it('dovrebbe impostare eventi', () => {
      const events: EventoCalendario[] = [
        {
          id: 'evt1',
          titolo: 'Riunione',
          data: '2024-12-20',
          oraInizio: '10:00',
          tipo: 'consiglio',
        },
      ];

      useAcademicStore.getState().actions.setEventi(events);
      expect(useAcademicStore.getState().eventi).toEqual(events);
    });
  });

  describe('Other Actions', () => {
    it('dovrebbe impostare slot anche tramite funzione', () => {
      const slots = { 'slot1': { id: 'slot1', day: 1, hour: 1 } };
      useAcademicStore.getState().actions.setSlots(slots);
      useAcademicStore.getState().actions.setSlots((prev) => ({ ...prev, 'slot2': { id: 'slot2', day: 2, hour: 2 } }));
      expect(Object.keys(useAcademicStore.getState().slots)).toHaveLength(2);
    });

    it('dovrebbe impostare UDA anche tramite funzione', () => {
      const uda = [{ id: 'uda1', titolo: 'Test UDA' }];
      useAcademicStore.getState().actions.setUda(uda);
      useAcademicStore.getState().actions.setUda((prev) => [...prev, { id: 'uda2', titolo: 'Test UDA 2' }]);
      expect(useAcademicStore.getState().uda).toHaveLength(2);
    });

    it('dovrebbe impostare eventi anche tramite funzione', () => {
      const events = [{ id: 'evt1', titolo: 'E1', data: '2024-01-01', oraInizio: '10:00', tipo: 'consiglio' }];
      useAcademicStore.getState().actions.setEventi(events);
      useAcademicStore.getState().actions.setEventi((prev) => [...prev, { id: 'evt2', titolo: 'E2', data: '2024-01-02', oraInizio: '11:00', tipo: 'colloquio' }]);
      expect(useAcademicStore.getState().eventi).toHaveLength(2);
    });

    it('dovrebbe impostare rubriche anche tramite funzione', () => {
      const rubriche = [{ id: 'r1', titolo: 'R1' }];
      useAcademicStore.getState().actions.setRubriche(rubriche);
      useAcademicStore.getState().actions.setRubriche((prev) => [...prev, { id: 'r2', titolo: 'R2' }]);
      expect(useAcademicStore.getState().rubriche).toHaveLength(2);
    });

    it('dovrebbe impostare curricula anche tramite funzione', () => {
      const curricula = [{ id: 'c1', subject: 'S1' }];
      useAcademicStore.getState().actions.setCurricula(curricula);
      useAcademicStore.getState().actions.setCurricula((prev) => [...prev, { id: 'c2', subject: 'S2' }]);
      expect(useAcademicStore.getState().curricula).toHaveLength(2);
    });

    it('dovrebbe impostare submissions anche tramite funzione', () => {
      const submissions = [{ id: 's1', studentId: 'st1' }];
      useAcademicStore.getState().actions.setSubmissions(submissions);
      useAcademicStore.getState().actions.setSubmissions((prev) => [...prev, { id: 's2', studentId: 'st2' }]);
      expect(useAcademicStore.getState().submissions).toHaveLength(2);
    });

    it('dovrebbe impostare draftRegister anche tramite funzione', () => {
      const draft = { 'd1': { id: 'd1' } };
      useAcademicStore.getState().actions.setDraftRegister(draft);
      useAcademicStore.getState().actions.setDraftRegister((prev) => ({ ...prev, 'd2': { id: 'd2' } }));
      expect(Object.keys(useAcademicStore.getState().draftRegister)).toHaveLength(2);
    });

    it('dovrebbe impostare finalizedRegister anche tramite funzione', () => {
      const finalized = [{ id: 'f1' }];
      useAcademicStore.getState().actions.setFinalizedRegister(finalized);
      useAcademicStore.getState().actions.setFinalizedRegister((prev) => [...prev, { id: 'f2' }]);
      expect(useAcademicStore.getState().finalizedRegister).toHaveLength(2);
    });

    it('dovrebbe impostare giudizi anche tramite funzione', () => {
      const giudizi = { 'g1': { studenteId: 's1', periodo: '1', annoScolastico: '2023', testo: 'T1' } };
      useAcademicStore.getState().actions.setGiudizi(giudizi);
      useAcademicStore.getState().actions.setGiudizi((prev) => ({ ...prev, 'g2': { studenteId: 's2', periodo: '1', annoScolastico: '2023', testo: 'T2' } }));
      expect(Object.keys(useAcademicStore.getState().giudizi)).toHaveLength(2);
    });

    it('dovrebbe impostare reportistica anche tramite funzione', () => {
      const reports = [{ id: 'rep1' }];
      useAcademicStore.getState().actions.setReportistica(reports);
      useAcademicStore.getState().actions.setReportistica((prev) => [...prev, { id: 'rep2' }]);
      expect(useAcademicStore.getState().reportistica).toHaveLength(2);
    });

    it('dovrebbe impostare slot', () => {
      const slots = { 'slot1': { id: 'slot1', day: 1, hour: 1 } };
      useAcademicStore.getState().actions.setSlots(slots);
      expect(useAcademicStore.getState().slots).toEqual(slots);
    });

    it('dovrebbe impostare UDA', () => {
      const uda = [{ id: 'uda1', titolo: 'Test UDA' }];
      useAcademicStore.getState().actions.setUda(uda);
      expect(useAcademicStore.getState().uda).toEqual(uda);
    });

    it('dovrebbe impostare rubriche e salvarne una', () => {
      const rubrica = { id: 'rub1', titolo: 'Rubrica 1' };
      useAcademicStore.getState().actions.setRubriche([rubrica]);
      expect(useAcademicStore.getState().rubriche).toContain(rubrica);

      const updatedRubrica = { id: 'rub1', titolo: 'Rubrica 1 Updated' };
      useAcademicStore.getState().actions.saveRubrica(updatedRubrica);
      expect(useAcademicStore.getState().rubriche).toHaveLength(1);
      expect(useAcademicStore.getState().rubriche[0].titolo).toBe('Rubrica 1 Updated');
    });

    it('dovrebbe impostare curricula', () => {
      const curricula = [{ id: 'curr1', subject: 'Math' }];
      useAcademicStore.getState().actions.setCurricula(curricula);
      expect(useAcademicStore.getState().curricula).toEqual(curricula);
    });

    it('dovrebbe impostare submissions', () => {
      const submissions = [{ id: 'sub1', studentId: 's1' }];
      useAcademicStore.getState().actions.setSubmissions(submissions);
      expect(useAcademicStore.getState().submissions).toEqual(submissions);
    });

    it('dovrebbe impostare draftRegister e finalizedRegister', () => {
      const draft = { 'reg1': { id: 'reg1' } };
      useAcademicStore.getState().actions.setDraftRegister(draft);
      expect(useAcademicStore.getState().draftRegister).toEqual(draft);

      const finalized = [{ id: 'reg1' }];
      useAcademicStore.getState().actions.setFinalizedRegister(finalized);
      expect(useAcademicStore.getState().finalizedRegister).toEqual(finalized);
    });

    it('dovrebbe impostare giudizi e salvarne uno', () => {
      const giudizio = { studenteId: 's1', periodo: '1', annoScolastico: '2023', testo: 'Bravo' };
      useAcademicStore.getState().actions.saveGiudizio(giudizio);
      const key = 's1-1-2023';
      expect(useAcademicStore.getState().giudizi[key]).toEqual(giudizio);
    });

    it('dovrebbe impostare reportistica', () => {
      const reports = [{ id: 'rep1' }];
      useAcademicStore.getState().actions.setReportistica(reports);
      expect(useAcademicStore.getState().reportistica).toEqual(reports);
    });

    it('dovrebbe caricare dal backup', () => {
      const backup = { uda: [{ id: 'uda-b' }] };
      useAcademicStore.getState().actions.loadFromBackup(backup);
      expect(useAcademicStore.getState().uda).toEqual(backup.uda);
    });
  });
});
