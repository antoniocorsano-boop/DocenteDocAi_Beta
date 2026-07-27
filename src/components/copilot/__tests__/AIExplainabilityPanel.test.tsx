import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import type { AISuggestion } from '../../../ai/contextEngine/types';

vi.mock('../../../ai/telemetry/aiTelemetry', () => ({
  logAIExplanationOpened: vi.fn(),
}));

import AIExplainabilityPanel from '../AIExplainabilityPanel';
import { logAIExplanationOpened } from '../../../ai/telemetry/aiTelemetry';

const makeSuggestion = (overrides?: Partial<AISuggestion>): AISuggestion => ({
  id: 'sug-1',
  type: 'student_at_risk',
  message: 'Messaggio suggerimento test',
  confidence: 0.85,
  studentId: 'student-1',
  explanation: {
    reason: 'Trend di voto in calo nelle ultime verifiche',
    bulletPoints: ['Media attuale: 4.2', 'Ultima verifica: 3.0'],
    sourceData: {
      average: 4.2,
      trend: 'declining',
      sampleCount: 5,
      lowGradeCount: 3,
      subjects: ['Matematica'],
    },
  },
  ...overrides,
});

describe('AIExplainabilityPanel - empty state', () => {
  it('shows empty-state alert when no suggestions provided', () => {
    render(<AIExplainabilityPanel suggestions={[]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('alert mentions suggerimenti (Italian empty-state text)', () => {
    render(<AIExplainabilityPanel suggestions={[]} />);
    expect(screen.getByRole('alert').textContent).toMatch(/suggeriment/i);
  });
});

describe('AIExplainabilityPanel - suggestion rows', () => {
  it('renders suggestion message text in the header', () => {
    const s = makeSuggestion({ message: 'Testo messaggio univoco' });
    render(<AIExplainabilityPanel suggestions={[s]} />);
    const els = screen.getAllByText('Testo messaggio univoco');
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it('renders confidence as a percentage number', () => {
    const s = makeSuggestion({ confidence: 0.75 });
    render(<AIExplainabilityPanel suggestions={[s]} />);
    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  it('renders no alert when suggestions are present', () => {
    render(<AIExplainabilityPanel suggestions={[makeSuggestion()]} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('AIExplainabilityPanel - expand/collapse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('expands on click and shows reason text', () => {
    const s = makeSuggestion();
    render(<AIExplainabilityPanel suggestions={[s]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Trend di voto in calo nelle ultime verifiche')).toBeInTheDocument();
  });

  it('shows bullet evidence after expand', () => {
    const s = makeSuggestion();
    render(<AIExplainabilityPanel suggestions={[s]} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Media attuale: 4.2')).toBeInTheDocument();
    expect(screen.getByText('Ultima verifica: 3.0')).toBeInTheDocument();
  });

  it('fires logAIExplanationOpened on expand', () => {
    const s = makeSuggestion({ id: 'sug-telemetry' });
    render(<AIExplainabilityPanel suggestions={[s]} />);

    fireEvent.click(screen.getByRole('button'));

    expect(logAIExplanationOpened).toHaveBeenCalledWith('sug-telemetry');
  });

  it('does NOT fire telemetry again on collapse', () => {
    const s = makeSuggestion({ id: 'sug-collapse' });
    render(<AIExplainabilityPanel suggestions={[s]} />);

    const button = screen.getByRole('button');
    fireEvent.click(button); // expand - fires telemetry
    fireEvent.click(button); // collapse - should NOT fire again

    expect(logAIExplanationOpened).toHaveBeenCalledTimes(1);
  });
});

describe('AIExplainabilityPanel - filterTypes', () => {
  it('hides suggestions not in filterTypes', () => {
    const suggestions = [
      makeSuggestion({ id: 's1', type: 'student_at_risk', message: 'Studente a rischio unico' }),
      makeSuggestion({ id: 's2', type: 'student_excellence', message: 'Studente eccellente unico' }),
    ];
    render(
      <AIExplainabilityPanel suggestions={suggestions} filterTypes={['student_excellence']} />,
    );
    expect(screen.getAllByText('Studente eccellente unico').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Studente a rischio unico')).toBeNull();
  });

  it('shows all suggestions when filterTypes is undefined', () => {
    const suggestions = [
      makeSuggestion({ id: 's1', type: 'student_at_risk', message: 'Messaggio rischio unico' }),
      makeSuggestion({ id: 's2', type: 'student_excellence', message: 'Messaggio eccellenza unico' }),
    ];
    render(<AIExplainabilityPanel suggestions={suggestions} />);
    expect(screen.getAllByText('Messaggio rischio unico').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Messaggio eccellenza unico').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty-state alert when filter removes all suggestions', () => {
    const suggestions = [
      makeSuggestion({ id: 's1', type: 'student_at_risk' }),
    ];
    render(
      <AIExplainabilityPanel suggestions={suggestions} filterTypes={['student_excellence']} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('AIExplainabilityPanel - sorting by confidence', () => {
  it('renders higher-confidence suggestion text before lower-confidence one', () => {
    const suggestions = [
      makeSuggestion({ id: 'low', message: 'Messaggio bassa confidenza', confidence: 0.3 }),
      makeSuggestion({ id: 'high', message: 'Messaggio alta confidenza', confidence: 0.95 }),
    ];
    render(<AIExplainabilityPanel suggestions={suggestions} />);

    const container = document.body;
    const highPos = container.textContent?.indexOf('Messaggio alta confidenza') ?? -1;
    const lowPos = container.textContent?.indexOf('Messaggio bassa confidenza') ?? -1;
    expect(highPos).toBeGreaterThanOrEqual(0);
    expect(lowPos).toBeGreaterThan(highPos);
  });
});
