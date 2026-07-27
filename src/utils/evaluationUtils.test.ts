
import { describe, it, expect } from 'vitest';
import { calculatePerformance } from './evaluationUtils';
import { Valutazione } from '../types';

// Helper per creare rapidamente una valutazione finta
const createEval = (voto: string, data: string): Valutazione => ({
    id: Math.random().toString(),
    studenteId: 'student-1',
    materia: 'Matematica',
    tipo: 'Scritto',
    voto: voto,
    data: data,
    argomento: 'Test',
});

describe('Calcolo Performance Studente', () => {
    
    it('dovrebbe calcolare correttamente la media matematica semplice', () => {
        // 1. ARRANGE: Preparo i dati
        const evaluations = [
            createEval('8', '2023-10-01'),
            createEval('6', '2023-10-05')
        ];

        // 2. ACT: Eseguo la funzione
        const result = calculatePerformance('student-1', 'Complessivo', evaluations);

        // 3. ASSERT: Verifico il risultato (Media di 8 e 6 è 7.0)
        expect(result.grade).toBe('7.0');
    });

    it('dovrebbe gestire i voti non numerici (es. "Ottimo")', () => {
        const evaluations = [
            createEval('Ottimo', '2023-10-01'), // Vale 10
            createEval('Distinto', '2023-10-05') // Vale 8.5
        ];

        const result = calculatePerformance('student-1', 'Complessivo', evaluations);
        
        // Media di 10 e 8.5 = 9.25 -> arrotondato 9.3
        expect(result.grade).toBe('9.3');
    });

    it('dovrebbe rilevare un trend in crescita (UP)', () => {
        // Simulo voti che migliorano nel tempo
        const evaluations = [
            createEval('5', '2023-09-01'),
            createEval('6', '2023-09-10'),
            createEval('7', '2023-09-20'),
            createEval('8', '2023-10-01')
        ];

        const result = calculatePerformance('student-1', 'Complessivo', evaluations);

        expect(result.trend).toBe('up');
    });

    it('dovrebbe rilevare un trend in calo (DOWN)', () => {
        // Simulo voti che peggiorano. Aggiungiamo dati per attivare la logica
        const evaluationsLong = [
            createEval('9', '2023-09-01'),
            createEval('9', '2023-09-05'),
            createEval('4', '2023-09-25'),
            createEval('4', '2023-10-01')
        ];

        const result = calculatePerformance('student-1', 'Complessivo', evaluationsLong);

        expect(result.trend).toBe('down');
    });

    it('dovrebbe ignorare i voti di altri studenti', () => {
        const evaluations = [
            createEval('10', '2023-10-01'), // Studente 1
            { ...createEval('2', '2023-10-01'), studenteId: 'student-2' } // Studente 2
        ];

        const result = calculatePerformance('student-1', 'Complessivo', evaluations);

        // La media deve essere 10 (ignora il 2 dell'altro studente)
        expect(result.grade).toBe('10.0');
    });

    it('dovrebbe filtrare per tipo di valutazione', () => {
        const evaluations = [
            { ...createEval('10', '2023-10-01'), tipo: 'Scritto' },
            { ...createEval('6', '2023-10-05'), tipo: 'Orale' }
        ];

        const result = calculatePerformance('student-1', 'Scritto', evaluations as any);
        expect(result.grade).toBe('10.0');
    });

    it('dovrebbe rilevare un trend stabile', () => {
        const evaluations = [
            createEval('7', '2023-09-01'),
            createEval('7', '2023-09-10'),
            createEval('7', '2023-09-20'),
            createEval('7', '2023-10-01')
        ];

        const result = calculatePerformance('student-1', 'Complessivo', evaluations);
        expect(result.trend).toBe('stable');
    });

    it('dovrebbe restituire trend stabile se ci sono meno di 4 voti', () => {
        const evaluations = [
            createEval('10', '2023-09-01'),
            createEval('5', '2023-09-10')
        ];

        const result = calculatePerformance('student-1', 'Complessivo', evaluations);
        expect(result.trend).toBe('stable');
    });

    it('dovrebbe restituire null se non ci sono voti', () => {
        const result = calculatePerformance('student-1', 'Complessivo', []);
        expect(result.grade).toBeNull();
        expect(result.trend).toBeNull();
    });

    it('dovrebbe gestire voti non validi', () => {
        const evaluations = [
            createEval('NonValido', '2023-10-01')
        ];
        const result = calculatePerformance('student-1', 'Complessivo', evaluations);
        expect(result.grade).toBeNull();
    });
});

