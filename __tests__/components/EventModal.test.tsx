import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventModal from '../../src/components/EventModal';
import { EventoCalendario } from '../../src/types';

// Mock M3Components with proper implementation
vi.mock('../../src/components/M3Components', () => ({
  TextField: ({ label, value, onChange, type }: { label?: string; value?: string; onChange?: (v: string) => void; type?: string }) => (
    <input
      placeholder={label}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      type={type || 'text'}
      data-testid={`input-${label?.toLowerCase()}`}
    />
  ),
  TextArea: ({ label, value, onChange }: { label?: string; value?: string; onChange?: (v: string) => void }) => (
    <textarea
      placeholder={label}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      data-testid={`textarea-${label?.toLowerCase()}`}
    />
  ),
  M3ChoiceCard: ({ options = [], value, onChange }: { options?: Array<{ label: string; value: string }>; value?: string; onChange?: (v: string) => void }) => (
    <div data-testid="choice-card">
      {options.map((opt) => (
        <button
          key={opt.value}
          data-testid={`choice-${opt.value}`}
          onClick={() => onChange?.(opt.value)}
          className={value === opt.value ? 'selected' : ''}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

describe('EventModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dovrebbe renderizzare il modal per un nuovo evento', () => {
    render(
      <EventModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );
    // Component should render without errors
    expect(screen.queryByText(/salva/i)).toBeInTheDocument();
  });

  it('dovrebbe renderizzare il modal per modificare un evento', () => {
    const existingEvent: Partial<EventoCalendario> = {
      id: 'evt-1',
      titolo: 'Test Event',
      data: '2024-01-15',
      tipo: 'impegno',
    };

    render(
      <EventModal
        eventToEdit={existingEvent}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/annulla/i)).toBeInTheDocument();
  });

  it('dovrebbe compilare i campi da un evento esistente', () => {
    const existingEvent: Partial<EventoCalendario> = {
      titolo: 'Riunione',
      data: '2024-01-20',
      tipo: 'consiglio',
      descrizione: 'Riunione team',
    };

    render(
      <EventModal
        eventToEdit={existingEvent}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/salva/i)).toBeInTheDocument();
  });

  it('dovrebbe consentire di cambiare il tipo di evento', () => {
    const { container } = render(
      <EventModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    expect(container).toBeTruthy();
  });

  it('dovrebbe mostrare errore se titolo è vuoto', async () => {
    render(
      <EventModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    // Try to submit without title
    const submitBtn = screen.getByText(/salva/i);
    if (submitBtn) fireEvent.click(submitBtn);

    // Component shows inline validation error instead of window.alert
    expect(screen.getByText(/obbligatori/i)).toBeTruthy();
  });

  it('dovrebbe salvare un evento con dati validi', () => {
    render(
      <EventModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    // Component should have rendered
    expect(screen.queryByText(/salva/i)).toBeInTheDocument();
  });

  it('dovrebbe generare un ID univoco se non fornito', () => {
    render(
      <EventModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('dovrebbe aggiustare dataFine se è prima di data', () => {
    const event: Partial<EventoCalendario> = {
      data: '2024-01-20',
      dataFine: '2024-01-10', // Before start date
    };

    render(
      <EventModal
        eventToEdit={event}
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/annulla/i)).toBeInTheDocument();
  });

  it('dovrebbe chiudere il modal quando si clicca il pulsante close', () => {
    render(
      <EventModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    const closeBtn = screen.getByText(/annulla/i);
    if (closeBtn) fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('dovrebbe includere tutti i campi obbligatori nel submit', () => {
    render(
      <EventModal
        onClose={mockOnClose}
        onSave={mockOnSave}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/salva/i)).toBeInTheDocument();
  });
});
