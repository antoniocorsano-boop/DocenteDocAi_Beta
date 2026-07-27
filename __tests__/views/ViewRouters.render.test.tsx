import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { ViewRouter } from '../../src/components/views/ViewRouters';
import { DEFAULT_TIMETABLE_SETTINGS } from '../../src/constants';

const baseSchedulingProps = {
  slots: {},
  lessons: {},
  settings: DEFAULT_TIMETABLE_SETTINGS,
  eventi: [],
  aiSettings: { model: 'gemini-3-flash-preview' },
  activeSuggestion: null,
  curricula: [],
  onEditSlot: () => {},
  onShowSlotActions: () => {},
  onAiSuggest: () => {},
  onNavigate: () => {},
  onScheduleLesson: () => {},
  onAddLessons: () => {},
  onUpdateLesson: () => {},
  onStartClassroom: () => {},
  setIsLoadingModalOpen: () => {},
  setLoadingModalMessage: () => {},
  setEventi: () => {},
  activeSlotKey: undefined,
  showGuidanceTips: false,
};

describe('ViewRouter rendering', () => {
  it('renders the Calendar view', () => {
    render(<ViewRouter viewName="calendario" props={baseSchedulingProps} />);
    // Verifica che il titolo del calendario mostri un mese e anno (es: "Gennaio 2026")
    expect(screen.getByText(/\b[A-Za-zàèéìòù]+ \d{4}\b/)).toBeInTheDocument();
    // Verifica che i giorni della settimana siano presenti
    expect(screen.getByText('LUN')).toBeInTheDocument();
    expect(screen.getByText('DOM')).toBeInTheDocument();
  });
});
