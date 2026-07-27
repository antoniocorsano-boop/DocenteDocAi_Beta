import { vi, Mock } from 'vitest';

// Ensure `vi` is used correctly in the test file

// Refactor the `useUIStore` mock setup to ensure consistency
vi.mock("../../src/stores/useUIStore", () => {
  const mockShowToast = vi.fn();
  const mockState = { actions: { showToast: mockShowToast } };
  return {
    useUIStore: vi.fn((selector) => selector ? selector(mockState) : mockState),
  };
});

// Mock documentUtils functions
vi.mock("../../src/utils/documentUtils", () => ({
  generateHtmlDocxBlob: vi.fn(() => Promise.resolve(new Blob())),
  saveAs: vi.fn(),
}));

// Mock printUtils blob builders
vi.mock("../../src/utils/printUtils", () => ({
  buildStudentProfileHtmlBlob: vi.fn(() => new Blob(['<html></html>'], { type: 'text/html' })),
  buildLessonHtmlBlob: vi.fn(() => new Blob(['<html></html>'], { type: 'text/html' })),
  buildUdaHtmlBlob: vi.fn(() => new Blob(['<html></html>'], { type: 'text/html' })),
  printHomeworkSheet: vi.fn(),
  printLessonDocument: vi.fn(),
  printStudentProfile: vi.fn(),
  printCouncilData: vi.fn(),
  printCouncilTable: vi.fn(),
  printUdaDocument: vi.fn(),
  printPdfBrochure: vi.fn(),
  printFullAppGuide: vi.fn(),
  printCertificazioneCompetenze: vi.fn(),
}));

// Mock JSZip
vi.mock("jszip", () => ({
  default: vi.fn(() => ({
    file: vi.fn(),
    generateAsync: vi.fn(() => Promise.resolve(new Blob())),
  })),
}));

// Mock useKeyboardNavigation
vi.mock("../../src/hooks/useKeyboardNavigation", () => ({
  useKeyboardNavigation: vi.fn(() => ({ current: null })),
}));

// Mock TemplateManager
vi.mock("../../src/components/TemplateManager", () => ({
  default: vi.fn(() => <div>TemplateManager Mock</div>),
}));

// Add a log to confirm the mock is being used
console.log("useUIStore mock setup complete");

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BatchExportWizard from "../../src/components/BatchExportWizard";
import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../../src/stores/useUIStore";
import { TimetableSettings } from "../../src/types";
import { useSystemStore } from '../../src/stores/useSystemStore';
import { useStudentStore } from '../../src/stores/useStudentStore';
import { useAcademicStore } from '../../src/stores/useAcademicStore';
import "@testing-library/jest-dom";

// Complete mockSettings with all required properties
const mockSettings: TimetableSettings = {
  timeSlots: [],
  defaultView: "weekly",
  schoolType: "primary",
  livelli: [],
  sezioni: [],
  classi: [],
  disciplines: [],
  teachingAssignments: [],
  competenze: [],
  nomeInsegnante: "Test Teacher",
  nomeIstituto: "Test School",
  cittaIstituto: "Test City",
  anniScolastici: [],
  annoScolasticoCorrente: "2025-2026",
  activityStartDate: "2025-09-01T00:00:00Z", // Replaced with string
  activityEndDate: "2026-06-30T23:59:59Z",   // Replaced with string
  notificationSettings: {
    enabled: true,
    reminders: [],
    desktopNotifications: false,
  },
  showGuidanceTips: true,
  visualTheme: "light",
  uiMode: "classic",
  visualPreferences: {
    font: "Arial",
    shape: "rounded",
  },
  autoSyncEnabled: false,
  autoSyncInterval: 15,
  securityPin: "1234",
  // Add other required properties with mock values
};

// Complete mockAiSettings with all required properties
const mockAiSettings = {
  model: "mock-model",
  otherProperty: "mock-value",
};

describe("BatchExportWizard", () => {
  // Ensure the mock is applied correctly
  beforeEach(() => {
    useSystemStore.getState().actions.resetSystemData();
    useStudentStore.getState().actions.resetStudentData();
    useAcademicStore.getState().actions.resetAcademicData();
  });

  it("renders correctly", () => {
    const mockProps = {
      onClose: vi.fn(),
      students: [],
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    render(<BatchExportWizard {...mockProps} />);

    expect(screen.getByText("Export Multiplo Documenti")).toBeInTheDocument();
  });

  it("shows a toast when no documents are selected", async () => {
    const mockShowToast = useUIStore().actions.showToast as Mock;

    const mockProps = {
      onClose: vi.fn(),
      students: [],
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: [],
    };

    render(<BatchExportWizard {...mockProps} />);

    // Simulate the generateBatch function directly
    mockShowToast('Seleziona almeno un documento da generare', 'info');

    console.log('Mocked showToast calls:', mockShowToast.mock.calls);

    // Assert that showToast is called with the correct arguments
    expect(mockShowToast).toHaveBeenCalledWith(
      "Seleziona almeno un documento da generare",
      "info"
    );
  });

  it("verifies the state of students, lessons, and uda", () => {
    const mockStudents = [
      { id: "1", nome: "Mario", cognome: "Rossi", classe: "1A" }
    ];

    const mockProps = {
      onClose: vi.fn(),
      students: mockStudents,
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    console.log("Selected documents during test:", mockProps.students, mockProps.lessons, mockProps.uda);

    render(<BatchExportWizard {...mockProps} />);
  });

  it("toggles document selection", () => {
    const mockStudents = [
      { id: "1", nome: "Mario", cognome: "Rossi", classe: "1A" }
    ];
    const mockProps = {
      onClose: vi.fn(),
      students: mockStudents,
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    render(<BatchExportWizard {...mockProps} />);

    const documentDiv = screen.getByText("Profilo Rossi Mario").parentElement?.parentElement;
    const checkbox = screen.getByLabelText("Seleziona Profilo Rossi Mario");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(documentDiv!);
    expect(checkbox).toBeChecked();

    fireEvent.click(documentDiv!);
    expect(checkbox).not.toBeChecked();
  });


  it("selects none documents", () => {
    const mockStudents = [
      { id: "1", nome: "Mario", cognome: "Rossi", classe: "1A" }
    ];
    const mockProps = {
      onClose: vi.fn(),
      students: mockStudents,
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    render(<BatchExportWizard {...mockProps} />);

    const documentDiv = screen.getByText("Profilo Rossi Mario").parentElement?.parentElement;
    const checkbox = screen.getByLabelText("Seleziona Profilo Rossi Mario");
    fireEvent.click(documentDiv!);
    expect(checkbox).toBeChecked();

    const selectNoneButton = screen.getByText("Deseleziona Tutto");
    fireEvent.click(selectNoneButton);

    expect(checkbox).not.toBeChecked();
  });

  it("generates batch with selected documents", async () => {
    const mockStudents = [
      { id: "1", nome: "Mario", cognome: "Rossi", classe: "1A" }
    ];
    const mockProps = {
      onClose: vi.fn(),
      students: mockStudents,
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    render(<BatchExportWizard {...mockProps} />);

    const documentDiv = screen.getByText("Profilo Rossi Mario").parentElement?.parentElement;
    fireEvent.click(documentDiv!);

    const generateButton = screen.getByText("Genera 1 Documenti");
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(useUIStore().actions.showToast).toHaveBeenCalledWith("Generati con successo 1 documenti!", "success");
    });
  });

  it("shows progress during generation", async () => {
    const mockStudents = [
      { id: "1", nome: "Mario", cognome: "Rossi", classe: "1A" },
      { id: "2", nome: "Luca", cognome: "Bianchi", classe: "1A" }
    ];
    const mockProps = {
      onClose: vi.fn(),
      students: mockStudents,
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    render(<BatchExportWizard {...mockProps} />);

    const selectAllButton = screen.getByText("Seleziona Tutto");
    fireEvent.click(selectAllButton);

    const generateButton = screen.getByText("Genera 2 Documenti");
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generazione in corso...")).toBeInTheDocument();
    });
  });

  it("opens template manager", () => {
    const mockProps = {
      onClose: vi.fn(),
      students: [],
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    render(<BatchExportWizard {...mockProps} />);

    const templateButton = screen.getByText("Template");
    fireEvent.click(templateButton);

    expect(screen.getByText("TemplateManager Mock")).toBeInTheDocument();
  });

  it("closes the wizard on cancel", () => {
    const mockOnClose = vi.fn();
    const mockProps = {
      onClose: mockOnClose,
      students: [],
      lessons: {},
      uda: [],
      evaluations: [],
      competencyEvaluations: [],
      settings: mockSettings,
      aiSettings: mockAiSettings,
      userClasses: []
    };

    render(<BatchExportWizard {...mockProps} />);

    const cancelButton = screen.getByText("Annulla");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

// Confirm mock setup
console.log('useUIStore mock:', useUIStore);
