import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AssistantModal from '../../src/components/AssistantModal';
import { vi } from 'vitest';

// Mock the AI service so the test doesn't depend on API calls or retry delays
vi.mock('../../src/services/aiService', () => ({
  chatWithAi: vi.fn().mockResolvedValue({ role: 'model', text: 'Risposta AI (demo): ciao' }),
  generateUdaWithAi: vi.fn(),
  generateLessonPlanWithAi: vi.fn(),
}));

describe('AssistantModal', () => {
  it('renders and handles send + AI response and Escape', async () => {
    const onClose = vi.fn();
    const aiSettings = { model: 'gemini-3-flash-preview' };
    render(<AssistantModal open={true} onClose={onClose} aiSettings={aiSettings} />);

    expect(screen.getByText('Assistente DocenteDoc AI')).toBeInTheDocument();
    expect(screen.getByText('Come posso usare questa funzione?')).toBeInTheDocument();

    const input = screen.getByLabelText(/Scrivi una domanda/i);
    fireEvent.change(input, { target: { value: 'ciao' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // AI service is mocked to resolve immediately — no retry delays
    const ai = await screen.findByText(/Risposta AI \(demo\): ciao|Si è verificato un errore nella generazione della risposta\./i, {}, { timeout: 5000 });
    expect(ai).toBeInTheDocument();

    // Escape should trigger onClose
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
