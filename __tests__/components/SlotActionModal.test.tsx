import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { M3ThemeProvider } from '../../src/theme/theme';
import React from 'react';
import SlotActionModal from '../../src/components/SlotActionModal';
import { Slot, Lezione } from '../../src/types';

describe('SlotActionModal', () => {
  const mockSlot: Slot = {
    giorno: 'Lunedì',
    ora: '08:00',
    classe: '5A',
    materia: 'Informatica'
  };

  const mockLesson: Lezione = {
    id: 'lesson-1',
    classe: '5A',
    materia: 'Informatica',
    contenuto: 'Introduzione ai test unitari',
    svolta: false,
    tipoLezione: 'Teoria',
    nota: 'Portare il libro'
  };

  const mockHandlers = {
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onStart: vi.fn(),
    onView: vi.fn()
  };

  it('renders correctly with lesson details', () => {
    render(
      <M3ThemeProvider>
        <SlotActionModal
          slot={mockSlot}
          lesson={mockLesson}
          isDraftExisting={false}
          {...mockHandlers}
        />
      </M3ThemeProvider>
    );

    expect(screen.getByText('Lezione Programmata')).toBeInTheDocument();
    expect(screen.getByText('Lunedì, 08:00')).toBeInTheDocument();
    expect(screen.getByText('5A')).toBeInTheDocument();
    expect(screen.getByText('Informatica')).toBeInTheDocument();
    expect(screen.getByText('Introduzione ai test unitari')).toBeInTheDocument();
    expect(screen.getByText('Portare il libro')).toBeInTheDocument();
  });

  it('calls onStart when "Avvia Aula" is clicked', () => {
    render(
      <M3ThemeProvider>
        <SlotActionModal
          slot={mockSlot}
          lesson={mockLesson}
          isDraftExisting={false}
          {...mockHandlers}
        />
      </M3ThemeProvider>
    );

    const startBtn = screen.getByText('Avvia Aula');
    fireEvent.click(startBtn);
    expect(mockHandlers.onStart).toHaveBeenCalled();
  });

  it('shows "Torna in Aula" when isDraftExisting is true', () => {
    render(
      <M3ThemeProvider>
        <SlotActionModal
          slot={mockSlot}
          lesson={mockLesson}
          isDraftExisting={true}
          {...mockHandlers}
        />
      </M3ThemeProvider>
    );

    expect(screen.getByText('Torna in Aula')).toBeInTheDocument();
  });

  it('calls onEdit when "Modifica" is clicked', () => {
    render(
      <M3ThemeProvider>
        <SlotActionModal
          slot={mockSlot}
          lesson={mockLesson}
          isDraftExisting={false}
          {...mockHandlers}
        />
      </M3ThemeProvider>
    );

    const editBtn = screen.getByText('Modifica');
    fireEvent.click(editBtn);
    expect(mockHandlers.onEdit).toHaveBeenCalled();
  });

  it('calls onView when the hero card is clicked', () => {
    render(
      <M3ThemeProvider>
        <SlotActionModal
          slot={mockSlot}
          lesson={mockLesson}
          isDraftExisting={false}
          {...mockHandlers}
        />
      </M3ThemeProvider>
    );

    const heroCard = screen.getByLabelText('Vedi dettagli lezione');
    fireEvent.click(heroCard);
    expect(mockHandlers.onView).toHaveBeenCalled();
  });
});
