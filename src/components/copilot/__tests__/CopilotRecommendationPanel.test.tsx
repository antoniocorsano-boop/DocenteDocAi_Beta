/**
 * CopilotRecommendationPanel.test.tsx
 *
 * Tests for the teacher-facing AI Recommendations panel (Sprint 9).
 * All AI pipeline modules are mocked to keep tests fast and deterministic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── mocks (vi.mock is hoisted automatically by Vitest) ────────────────────────

vi.mock('../../../stores/useAcademicStore', () => ({
  useAcademicStore: vi.fn((selector: (s: { lessons: Record<string, object> }) => unknown) =>
    selector({ lessons: { 'l1': {}, 'l2': {}, 'l3': {} } }),
  ),
}));

vi.mock('../../../ai/prediction/predictStudentRisk', () => ({
  predictStudentRisk: vi.fn(() => ({ studentId: 's1', riskLevel: 'low', score: 0.2 })),
}));

vi.mock('../../../ai/explainability/decisionExplainer', () => ({
  explainClass: vi.fn(() => new Map()),
}));

vi.mock('../../../ai/fairness/biasReport', () => ({
  generateBiasReport: vi.fn(() => ({
    metrics: [],
    profiles: [],
    overallBiasLevel: 'low',
  })),
}));

vi.mock('../../../ai/trust/trustReport', () => ({
  generateTrustReport: vi.fn(() => ({ overallScore: 0.85, concerns: [] })),
}));

vi.mock('../../../ai/pedagogy/pedagogyReport', () => ({
  generatePedagogyReport: vi.fn(() => ({ overallScore: 0.80, dimensions: [] })),
}));

vi.mock('../../../ai/recommendation/lessonRecommender', () => ({
  generateRecommendations: vi.fn(() => []),
}));

vi.mock('../../../ai/recommendation/curriculumAdvisor', () => ({
  generateCurriculumRecommendations: vi.fn(() => []),
}));

vi.mock('../../../ai/recommendation/activityGenerator', () => ({
  generateActivity: vi.fn(() => []),
}));

vi.mock('../../ui/PluginSlot', () => ({
  default: () => null,
}));

// ── import under test ─────────────────────────────────────────────────────────

import CopilotRecommendationPanel from '../CopilotRecommendationPanel';
import { generateRecommendations } from '../../../ai/recommendation/lessonRecommender';
import { generateCurriculumRecommendations } from '../../../ai/recommendation/curriculumAdvisor';
import { generateActivity } from '../../../ai/recommendation/activityGenerator';

const defaultProps = {
  students:    [{ id: 's1', nome: 'Mario', cognome: 'Rossi' }] as never,
  evaluations: [],
  udas:        [{ id: 'u1' }, { id: 'u2' }] as never,
  className:   'Classe 3A',
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('CopilotRecommendationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, context chips and Calcola button in initial state', () => {
    render(<CopilotRecommendationPanel {...defaultProps} />);

    expect(screen.getByText('Raccomandazioni AI')).toBeInTheDocument();
    expect(screen.getByText(/3 lezi/)).toBeInTheDocument();   // 3 lessons
    expect(screen.getByText(/1 student/)).toBeInTheDocument(); // 1 student
    expect(screen.getByText(/2 (UDA|Lezioni|lezioni)/i)).toBeInTheDocument(); // 2 UDAs (label adapts to capability level)
    expect(screen.getByRole('button', { name: /calcola raccomandazioni/i })).toBeInTheDocument();
  });

  it('shows info Alert prompting to press Calcola before first run', () => {
    render(<CopilotRecommendationPanel {...defaultProps} />);
    const alerts = screen.getAllByRole('alert');
    const calcolaAlert = alerts.find(a => /Calcola/.test(a.textContent ?? ''));
    expect(calcolaAlert).toBeDefined();
  });

  it('shows loading spinner while computation is in progress', async () => {
    // Delay the recommendation pipeline so we can observe the loading state
    vi.mocked(generateRecommendations).mockImplementation(() => {
      return [];
    });

    render(<CopilotRecommendationPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /calcola raccomandazioni/i }));

    // CircularProgress has aria-label "Analisi raccomandazioni in corso"
    expect(screen.getByLabelText(/Analisi raccomandazioni in corso/i)).toBeInTheDocument();
  });

  it('shows "Nessuna raccomandazione critica" when all pipelines return empty arrays', async () => {
    vi.mocked(generateCurriculumRecommendations).mockReturnValue([]);
    vi.mocked(generateRecommendations).mockReturnValue([]);

    render(<CopilotRecommendationPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /calcola raccomandazioni/i }));

    await waitFor(() => {
      expect(screen.getByText(/Nessuna raccomandazione critica/i)).toBeInTheDocument();
    });
  });

  it('renders a RecommendationCard for each returned recommendation', async () => {
    const mockRecs = [
      {
        id: 'rec-lesson-1',
        title: 'Struttura la progressione cognitiva',
        description: 'Riorganizza lezioni.',
        impactScore: 0.6,
        source: 'pedagogy' as const,
        suggestedAction: 'adjustContent' as const,
        tags: ['Bloom'],
      },
      {
        id: 'rec-lesson-2',
        title: 'Aumenta le attività HOTS',
        description: 'Integra laboratori.',
        impactScore: 0.45,
        source: 'pedagogy' as const,
        suggestedAction: 'addExercise' as const,
        tags: ['HOTS'],
      },
    ];
    vi.mocked(generateRecommendations).mockReturnValue(mockRecs);

    render(<CopilotRecommendationPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /calcola raccomandazioni/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('article').length).toBe(2);
    });
    expect(screen.getByText('Struttura la progressione cognitiva')).toBeInTheDocument();
    expect(screen.getByText('Aumenta le attività HOTS')).toBeInTheDocument();
  });

  it('button label changes to "Ricalcola" after first computation', async () => {
    render(<CopilotRecommendationPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: /calcola raccomandazioni/i }).textContent).toBe('Calcola');

    fireEvent.click(screen.getByRole('button', { name: /calcola raccomandazioni/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText(/Analisi raccomandazioni in corso/i)).toBeNull();
    });

    expect(screen.getByRole('button', { name: /calcola raccomandazioni/i }).textContent).toBe('Ricalcola');
  });

  it('"Genera attività" button appears inside a RecommendationCard', async () => {
    const mockRec = {
      id: 'rec-cur-1',
      title: 'Diversifica i metodi',
      description: 'Alterna teoria e laboratorio.',
      impactScore: 0.5,
      source: 'pedagogy' as const,
      suggestedAction: 'addExercise' as const,
      tags: [],
    };
    vi.mocked(generateCurriculumRecommendations).mockReturnValue([mockRec as never]);
    vi.mocked(generateActivity).mockReturnValue([
      {
        id: 'act-1',
        title: 'Quiz',
        description: 'Breve quiz',
        instructions: 'Rispondi alle domande.',
        type: 'quiz' as const,
        durationMinutes: 15,
        targetBloomLevel: 'remember' as never,
        recommendationId: 'rec-cur-1',
      },
    ]);

    render(<CopilotRecommendationPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /calcola raccomandazioni/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /genera attività per: diversifica i metodi/i })).toBeInTheDocument();
    });
  });
});
