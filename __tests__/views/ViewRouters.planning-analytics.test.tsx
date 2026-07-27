import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { M3ThemeProvider } from '../../src/theme/theme';
import { render } from '@testing-library/react';
import { ViewRouter } from '../../src/components/views/ViewRouters';
import { DEFAULT_TIMETABLE_SETTINGS } from '../../src/constants';

const planningProps = {
  udas: [],
  eventi: [],
  rubriche: [],
  pianiInclusione: {},
  knowledgeBase: [],
  lessons: {},
  students: [],
  evaluations: [],
  competencyEvals: [],
  settings: DEFAULT_TIMETABLE_SETTINGS,
  aiSettings: { model: 'gemini-3-flash-preview' },
  curricula: [],
  viewContext: null,
  onNavigate: () => {},
  onSaveUda: () => {},
  onSaveRubrica: () => {},
  onSavePiano: () => {},
  onDeleteRubrica: () => {},
  onDeletePiano: () => {},
  onDeleteUda: () => {},
  onSaveReport: () => {},
  onSaveEvent: () => {},
  onAddLessons: () => {},
  setUdas: () => {},
  setRubriche: () => {},
  setPianiInclusione: () => {},
  setCurricula: () => {},
  showToast: () => {},
  showGuidanceTips: false,
  setIsLoadingModalOpen: () => {},
  setLoadingModalMessage: () => {},
  setIsGlobalAiLoading: () => {},
  setViewContext: () => {}
};

const analyticsProps = {
  reportistica: [],
  onDeleteReport: () => {},
  userClasses: [],
  students: [],
  evaluations: [],
  competencyEvaluations: [],
  settings: DEFAULT_TIMETABLE_SETTINGS,
  uda: [],
  lessons: {},
  onSaveReport: () => {},
  aiSettings: { model: 'gemini-3-flash-preview' },
  pianiInclusione: {},
  knowledgeBase: [],
  onAddKbEntry: () => {},
  onSaveUda: () => {},
  onAddLessons: () => {},
  onSaveEvent: () => {},
  onSaveReportToKb: () => {},
};

describe('ViewRouter - Planning & Analytics renderers', () => {
  it('renders UdaPlanner when viewName is "uda"', () => {
    const { unmount } = render(
      <M3ThemeProvider>
        <ViewRouter viewName="uda" props={planningProps} />
      </M3ThemeProvider>
    );
    expect(screen.getByText(/Planner Progetti/)).toBeDefined();
    unmount();
  });

  it('renders UdaPlanner when viewName is "uda"', () => {
    const { unmount } = render(
      <M3ThemeProvider>
        <ViewRouter viewName="uda" props={planningProps} />
      </M3ThemeProvider>
    );
    expect(screen.getByText(/Planner Progetti/)).toBeDefined();
    unmount();
  });

  it('renders ReportisticaHub when viewName is "reportistica"', () => {
    const { unmount } = render(
      <M3ThemeProvider>
        <ViewRouter viewName="reportistica" props={analyticsProps} />
      </M3ThemeProvider>
    );
    const matches = screen.getAllByText(/Archivio Report|Centro Documentazione/);
    expect(matches.length).toBeGreaterThan(0);
    unmount();
  });

  it('renders ReportisticaHub when viewName is "reportistica"', () => {
    const { unmount } = render(
      <M3ThemeProvider>
        <ViewRouter viewName="reportistica" props={analyticsProps} />
      </M3ThemeProvider>
    );
    const matches = screen.getAllByText(/Archivio Report|Centro Documentazione/);
    expect(matches.length).toBeGreaterThan(0);
    unmount();
  });
});
