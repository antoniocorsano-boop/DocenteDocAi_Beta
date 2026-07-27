import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ModalProvider, useModal } from '../../src/context/ModalContext';
import { vi, describe, it, expect } from 'vitest';

// Componente di test per interagire con lo store dei modali
const TestComponent = () => {
  const { pushModal, popModal, stack } = useModal();
  
  return (
    <div>
      <div data-testid="stack-count">{stack.length}</div>
      <button onClick={() => pushModal({ 
        id: 'test-modal', 
        component: <div data-testid="modal-content">Contenuto Modale</div> 
      })}>
        Apri Modale
      </button>
      <button onClick={() => popModal('test-modal')}>
        Chiudi Modale
      </button>
    </div>
  );
};

describe('ModalContext', () => {
  it('gestisce correttamente l\'apertura e la chiusura dei modali', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Inizialmente lo stack è vuoto
    expect(screen.getByTestId('stack-count').textContent).toBe('0');

    // Clicca per aprire il modale
    fireEvent.click(screen.getByText('Apri Modale'));
    expect(screen.getByTestId('stack-count').textContent).toBe('1');
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();

    // Clicca per chiudere il modale
    fireEvent.click(screen.getByText('Chiudi Modale'));
    expect(screen.getByTestId('stack-count').textContent).toBe('0');
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });

  it('previene l\'apertura di modali con lo stesso ID', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    fireEvent.click(screen.getByText('Apri Modale'));
    fireEvent.click(screen.getByText('Apri Modale')); // Secondo click

    expect(screen.getByTestId('stack-count').textContent).toBe('1');
    expect(consoleSpy).toHaveBeenCalledWith('Modal with ID "test-modal" is already open');
    consoleSpy.mockRestore();
  });
});
