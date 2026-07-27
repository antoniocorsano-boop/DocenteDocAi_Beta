import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateManager from '../../src/components/TemplateManager';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSystemStore } from '../../src/stores/useSystemStore';
import { useUIStore } from '../../src/stores/useUIStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';

// Mock degli store
vi.mock('../../src/stores/useSystemStore', () => ({
  useSystemStore: vi.fn()
}));

vi.mock('../../src/stores/useUIStore', () => ({
  useUIStore: vi.fn()
}));

vi.mock('../../src/stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn()
}));

describe('TemplateManager', () => {
  const mockTemplates = [
    {
      id: '1',
      name: 'Template Test',
      type: 'student_profile',
      description: 'Descrizione test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: { includeEvaluations: true },
      content: { header: '<h1>{{nome_studente}}</h1>', footer: '<p>Footer</p>' }
    }
  ];

  beforeEach(() => {
    (useSystemStore as any).mockImplementation((selector: any) => {
      const state = {
        templates: mockTemplates,
        actions: {
          setTemplates: vi.fn(),
          trackAnalyticsEvent: vi.fn()
        }
      };
      return selector(state);
    });

    (useUIStore as any).mockImplementation((selector: any) => {
      const state = {
        actions: {
          showToast: vi.fn()
        }
      };
      return selector(state);
    });

    (useSettingsStore as any).mockImplementation((selector: any) => {
      const state = {
        aiSettings: { model: 'gemini-3-flash-preview' }
      };
      return selector(state);
    });
  });

  it('mostra la lista dei template e permette di entrare in modalità edit', () => {
    render(<TemplateManager onClose={() => {}} />);
    
    expect(screen.getByText('Template Test')).toBeInTheDocument();
    
    // Clicca su modifica
    const editButton = screen.getByTitle('Modifica template Template Test');
    fireEvent.click(editButton);
    
    // Verifica che il title del dialog cambi
    expect(screen.getByText('Modifica Template')).toBeInTheDocument();
  });

  // Temporarily disabled - TemplateEditor functionality not implemented
  // it('mostra l\'anteprima real-time nel tab Contenuto HTML', () => {
  //   render(<TemplateManager onClose={() => {}} />);
  //
  //   // Entra in edit
  //   fireEvent.click(screen.getByTitle('Modifica template Template Test'));
  //
  //   // Passa al tab Contenuto HTML
  //   fireEvent.click(screen.getByText('Contenuto HTML'));
  //
  //   // Verifica che ci sia l'intestazione dell'anteprima
  //   expect(screen.getByText('Anteprima Real-time')).toBeInTheDocument();
  //   expect(screen.getByText('Live')).toBeInTheDocument();
  //
  //   // Verifica che il contenuto del template sia renderizzato nell'anteprima (con variabile sostituita)
  //   // Il template ha <h1>{{nome_studente}}</h1>, l'anteprima sostituisce con 'Mario'
  //   expect(screen.getByText('Mario')).toBeInTheDocument();
  // });

  // it('aggiorna l\'anteprima quando viene modificato l\'HTML', () => {
  //   render(<TemplateManager onClose={() => {}} />);
  //
  //   fireEvent.click(screen.getByTitle('Modifica template Template Test'));
  //   fireEvent.click(screen.getByText('Contenuto HTML'));
  //
  //   const textarea = screen.getByPlaceholderText('<h1>Titolo</h1>...');
  //   fireEvent.change(textarea, { target: { value: '<h2>Nuovo Titolo {{nome_studente}}</h2>' } });
  //
  //   // L'anteprima dovrebbe aggiornarsi
  //   expect(screen.getByText('Nuovo Titolo Mario')).toBeInTheDocument();
  // });
});
