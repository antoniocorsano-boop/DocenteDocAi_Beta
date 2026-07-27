import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PianoInclusioneEditor from '../../src/components/PianoInclusioneEditor';
import { Studente, TimetableSettings, AiSettings } from '../../src/types';

// Mock aiService
vi.mock('../../src/services/aiService', () => ({
    getPIPSuggestion: vi.fn(() => Promise.resolve('Suggerimento AI generato')),
}));

const mockStudent: Studente = {
    id: 's1',
    nome: 'Marco',
    cognome: 'Verdi',
    classe: 'III-A',
};

const mockSettings: TimetableSettings = {
    disciplines: ['Italiano', 'Matematica'],
    competenze: [],
    // ... other settings
} as any;

const mockAiSettings: AiSettings = {
    model: 'gemini-1.5-flash',
} as any;

const mockShowToast = vi.fn();
const mockOnSave = vi.fn();
const mockOnClose = vi.fn();
const mockOnDelete = vi.fn();

describe('PianoInclusioneEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with student info', () => {
        render(
            <PianoInclusioneEditor
                student={mockStudent}
                existingPiano={undefined}
                onClose={mockOnClose}
                onSave={mockOnSave}
                onDeletePiano={mockOnDelete}
                aiSettings={mockAiSettings}
                evaluations={[]}
                competencyEvaluations={[]}
                settings={mockSettings}
                showToast={mockShowToast}
            />
        );

        expect(screen.getByText(/Verdi Marco/i)).toBeInTheDocument();
        expect(screen.getByText(/Classe III-A/i)).toBeInTheDocument();
    });

    it('renders subject-specific objective fields', () => {
        render(
            <PianoInclusioneEditor
                student={mockStudent}
                existingPiano={undefined}
                onClose={mockOnClose}
                onSave={mockOnSave}
                onDeletePiano={mockOnDelete}
                aiSettings={mockAiSettings}
                evaluations={[]}
                competencyEvaluations={[]}
                settings={mockSettings}
                showToast={mockShowToast}
            />
        );

        expect(screen.getByText('Italiano')).toBeInTheDocument();
        expect(screen.getByText('Matematica')).toBeInTheDocument();
    });

    it('handles manual input for subject objectives', () => {
        render(
            <PianoInclusioneEditor
                student={mockStudent}
                existingPiano={undefined}
                onClose={mockOnClose}
                onSave={mockOnSave}
                onDeletePiano={mockOnDelete}
                aiSettings={mockAiSettings}
                evaluations={[]}
                competencyEvaluations={[]}
                settings={mockSettings}
                showToast={mockShowToast}
            />
        );

        const italianoInput = screen.getByPlaceholderText('Obiettivi per Italiano...');
        fireEvent.change(italianoInput, { target: { value: 'Obiettivi minimi' } });
        
        expect(italianoInput).toHaveValue('Obiettivi minimi');
    });

    it('calls onSave with correct data when submitting', () => {
        render(
            <PianoInclusioneEditor
                student={mockStudent}
                existingPiano={undefined}
                onClose={mockOnClose}
                onSave={mockOnSave}
                onDeletePiano={mockOnDelete}
                aiSettings={mockAiSettings}
                evaluations={[]}
                competencyEvaluations={[]}
                settings={mockSettings}
                showToast={mockShowToast}
            />
        );

        const saveButton = screen.getByText('Salva Piano');
        fireEvent.click(saveButton);

        expect(mockOnSave).toHaveBeenCalled();
        const savedPiano = mockOnSave.mock.calls[0][0];
        expect(savedPiano.id).toBe(mockStudent.id);
    });
});
