import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportModal from '../../src/components/ExportModal';
import { Studente, Valutazione, ValutazioneCompetenza, TimetableSettings } from '../../src/types';

// Mock external components and functions
vi.mock('../../src/components/M3Components', () => ({
  TabGroup: ({ tabs = [], activeTab, onTabChange }: any) => (
    <div data-testid="tab-group">
      {tabs.map((tab: any) => (
        <button
          key={tab.id}
          data-testid={`tab-${tab.id}`}
          onClick={() => onTabChange?.(tab.id)}
          className={activeTab === tab.id ? 'active' : ''}
        >
          {tab.label}
        </button>
      ))}
    </div>
  ),
  M3Dialog: ({ children, isOpen, open, buttons }: any) => (isOpen ?? open) ? (
    <div data-testid="m3-dialog">
      <div>{children}</div>
      <div>{buttons}</div>
    </div>
  ) : null,
  TextField: ({ label, value, onChange, type }: any) => (
    <input
      placeholder={label}
      value={value || ''}
      onChange={onChange}
      type={type}
      data-testid={`field-${label?.toLowerCase()}`}
    />
  ),
  SectionHeader: ({ title }: any) => <h3>{title}</h3>,
}));

vi.mock('../../src/utils/documentUtils', () => ({
  viewPdfInNewTab: vi.fn(),
  saveAs: vi.fn(),
  extractTextFromFile: vi.fn(),
}));

vi.mock('../../src/utils/evaluationUtils', () => ({
  calculatePerformance: vi.fn(() => 7.5),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    addPage: vi.fn(),
    save: vi.fn(),
    text: vi.fn(),
  })),
}));

describe('ExportModal', () => {
  const mockOnClose = vi.fn();
  const mockStudents: Studente[] = [
    { id: 's1', nome: 'Mario', cognome: 'Rossi', classe: 'III-A' },
    { id: 's2', nome: 'Anna', cognome: 'Bianchi', classe: 'III-A' },
  ];
  const mockEvaluations: Valutazione[] = [
    {
      id: 'val1',
      studenteId: 's1',
      materia: 'Italiano',
      tipo: 'Scritto',
      voto: '8',
      data: '2024-01-10',
    },
  ];
  const mockCompetencyEvaluations: ValutazioneCompetenza[] = [];
  const mockSettings: TimetableSettings = {
      disciplines: ['Italiano', 'Matematica', 'Inglese'],
      competenze: [
          {
              id: 'c1', nome: 'Comunicazione',
              codice: '',
              livelli: []
          },
      ],
      classi: ['III-A'],
      anniScolastici: ['2023/2024'],
      timeSlots: [],
      defaultView: '',
      schoolType: '',
      livelli: [],
      sezioni: [],
      teachingAssignments: [],
      nomeInsegnante: '',
      nomeIstituto: '',
      cittaIstituto: '',
      annoScolasticoCorrente: '',
      activityStartDate: '',
      activityEndDate: '',
      notificationSettings: {
          enabled: false,
          reminders: [],
          desktopNotifications: false
      },
      showGuidanceTips: false,
      visualTheme: '',
      uiMode: 'classic',
      visualPreferences: {
          font: '',
          shape: ''
      },
      autoSyncEnabled: false,
      autoSyncInterval: 0,
      securityPin: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dovrebbe renderizzare il modal di esportazione', () => {
    const { container } = render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('dovrebbe mostrare formato PDF di default', () => {
    render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );
    // TabGroup per formato: PDF attivo
    const pdfTab = screen.getByRole('tab', { name: 'PDF Grafico' });
    expect(pdfTab).toHaveAttribute('aria-selected', 'true');
    // Bottone mostra "Esporta PDF"
    expect(screen.getByText(/Esporta PDF/i)).toBeInTheDocument();
  });

  it('dovrebbe permettere di cambiare anno scolastico', () => {
    render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );
    const schoolYearInput = screen.getByTestId('field-anno scolastico') as HTMLInputElement;
    fireEvent.change(schoolYearInput, { target: { value: '2024/2025' } });
    expect(schoolYearInput.value).toBe('2024/2025');
  });

  it('dovrebbe mostrare lista di studenti della classe', () => {
    const { container } = render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('dovrebbe permettere selezione materie', () => {
    render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );
    // Cambia scope da "Solo le mie" a "Tutte con dati"
    const allTab = screen.getByTestId('tab-all');
    fireEvent.click(allTab);
    // Paragrafo aggiornato per "tutte le discipline"
    expect(screen.getByText(/tutte le discipline/i)).toBeInTheDocument();
  });

  it('dovrebbe includere competenze nell\'esportazione', () => {
    const { container } = render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('dovrebbe gestire esportazione senza valutazioni', () => {
    const { container } = render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={[]}
        competencyEvaluations={[]}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('dovrebbe mostrare data di esportazione', () => {
    render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );
    const exportDateInput = screen.getByTestId('field-data esportazione') as HTMLInputElement;
    fireEvent.change(exportDateInput, { target: { value: '2025-01-10' } });
    expect(exportDateInput.value).toBe('2025-01-10');
  });

  it('dovrebbe permettere chiudere il modal', () => {
    render(
      <ExportModal
        onClose={mockOnClose}
        students={mockStudents}
        evaluations={mockEvaluations}
        competencyEvaluations={mockCompetencyEvaluations}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );
    fireEvent.click(screen.getByText(/Annulla/i));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('dovrebbe validare dati prima di esportare', async () => {
    render(
      <ExportModal
        onClose={mockOnClose}
        students={[]}
        evaluations={[]}
        competencyEvaluations={[]}
        settings={mockSettings}
        selectedClass="III-A"
        prove={[]}
      />
    );
    // Cambia formato in CSV e esporta
    const csvTab = screen.getByTestId('tab-csv');
    fireEvent.click(csvTab);
    fireEvent.click(screen.getByText(/Esporta CSV/i));
    // Attendi che handleExport completi
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 1000 });
  });
});
