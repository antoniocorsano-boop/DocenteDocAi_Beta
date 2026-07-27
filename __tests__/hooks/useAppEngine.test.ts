import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudentStore } from '../../src/stores/useStudentStore';
import { useAcademicStore } from '../../src/stores/useAcademicStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useUIStore } from '../../src/stores/useUIStore';
import { useSystemStore } from '../../src/stores/useSystemStore';

// Mock services
vi.mock('../../src/services/backupService', () => ({
  loadBackup: vi.fn(),
  saveBackup: vi.fn(),
  deleteBackup: vi.fn()
}));
vi.mock('../../src/services/indexedDbService', () => ({
  loadKbContentFromIndexedDB: vi.fn(),
  saveKbContentToIndexedDB: vi.fn(),
  clearIndexedDB: vi.fn()
}));
vi.mock('../../src/services/googleDriveService', () => ({
  initTokenClient: vi.fn(),
  requestAccessToken: vi.fn(),
  revokeAccessToken: vi.fn(),
  uploadBackup: vi.fn(),
  downloadBackup: vi.fn(),
  getBackupMetadata: vi.fn(),
  pickGoogleDriveFolder: vi.fn(),
  createAppFolder: vi.fn()
}));
vi.mock('../../src/services/errorLogger', () => ({
  errorLogger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    logNavigationError: vi.fn(),
    logActionError: vi.fn(),
    logStoreError: vi.fn(),
    logSyncError: vi.fn(),
    logBackupError: vi.fn(),
    logAiError: vi.fn(),
    logDataError: vi.fn(),
    logAuthError: vi.fn(),
    logCritical: vi.fn(),
    logSecurityEvent: vi.fn(),
    logPerformanceMetric: vi.fn(),
    logInfo: vi.fn(),
    logWarning: vi.fn(),
    logError: vi.fn(),
  }
}));
vi.mock('../../src/utils/dataValidator', () => ({
  validateBackupData: vi.fn(data => data)
}));
vi.mock('../../src/utils/suggestionUtils', () => ({
  analyzeSystemState: vi.fn(() => [])
}));
vi.mock('../../src/utils/aiSuggestionGenerator', () => ({
  generateAiSuggestions: vi.fn(() => Promise.resolve([]))
}));
vi.mock('../../src/services/importService', () => ({
  ImportService: {
    parseFile: vi.fn()
  }
}));
vi.mock('../../src/services/demoData.ts', () => ({
  DEMO_DATA: { students: [], lessons: [], slots: [], uda: [], eventi: [] }
}));

// Mock stores
const mockUiActions = {
  setIsRestoring: vi.fn(),
  setBackupState: vi.fn((input) => {
    if (typeof input === 'function') {
      input({ status: 'idle', lastBackup: null });
    }
  }),
  setDriveSyncState: vi.fn((input) => {
    if (typeof input === 'function') {
      input({ isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined });
    }
  }),
  setNavigationHistory: vi.fn(),
  toggleModal: vi.fn(),
  showToast: vi.fn(),
  setLoading: vi.fn(),
  setEditingSlotKey: vi.fn(),
  setActiveSlotKey: vi.fn(),
  setLessonViewContext: vi.fn(),
  setSyncConflictModal: vi.fn(),
  setCreateLessonContext: vi.fn(),
  setIsVideoAnalysisOpen: vi.fn(),
  setInstallPrompt: vi.fn(),
  setCanShowInstallPrompt: vi.fn(),
  setIsGlobalAiLoading: vi.fn(),
  addNavigationEntry: vi.fn(),
  popNavigationEntry: vi.fn(),
  clearNavigationHistory: vi.fn(),
  setCircularAnalysisModal: vi.fn(),
  clearToast: vi.fn()
};

vi.mock('../../src/stores/useUIStore', () => ({
  useUIStore: Object.assign(vi.fn((selector) => {
    const state = {
      modals: {},
      actions: mockUiActions,
      navigationHistory: [],
      backupState: {},
      driveSyncState: {}
    };
    return selector ? selector(state) : state;
  }), {
    getState: vi.fn(() => ({ actions: mockUiActions })),
    subscribe: vi.fn(() => vi.fn())
  })
}));

const mockStudentActions = {
  loadFromBackup: vi.fn(),
  setStudents: vi.fn(),
  setEvaluations: vi.fn((input) => {
    if (typeof input === 'function') input([]);
  }),
  setCompetencyEvals: vi.fn(),
  setPianiInclusione: vi.fn(),
  resetStudentData: vi.fn(),
  addEvaluation: vi.fn(),
  updateEvaluation: vi.fn(),
  deleteEvaluation: vi.fn(),
  saveStudent: vi.fn(),
  deleteStudent: vi.fn(),
  importStudents: vi.fn(),
  savePianoInclusione: vi.fn(),
  deletePianoInclusione: vi.fn(),
  setStudentProfileContext: vi.fn(),
  setSelectedClassForDashboard: vi.fn(),
  importEvaluations: vi.fn(),
  setOrientamentoActivities: vi.fn(),
  setEPortfolioEntries: vi.fn(),
  setStudentOrientamentoStates: vi.fn()
};
vi.mock('../../src/stores/useStudentStore', () => ({
  useStudentStore: Object.assign(vi.fn((selector) => {
    const state = {
      actions: mockStudentActions,
      students: [],
      evaluations: [],
      competencyEvals: [],
      pianiInclusione: [],
      studentProfileContext: null,
      selectedClassForDashboard: null
    };
    return selector ? selector(state) : state;
  }), {
    getState: vi.fn(() => ({ actions: mockStudentActions })),
    subscribe: vi.fn(() => vi.fn())
  })
}));

const mockAcademicActions = {
  loadFromBackup: vi.fn(),
  setLessons: vi.fn((input) => {
    if (typeof input === 'function') input({});
  }),
  setSlots: vi.fn((input) => {
    if (typeof input === 'function') {
      // Provide a proxy to handle nested spreads like ...prev[slotKey]
      const proxy = new Proxy({}, {
        get: (target, prop) => ({})
      });
      input(proxy);
    }
  }),
  setUda: vi.fn((input) => {
    if (typeof input === 'function') input([]);
  }),
  setEventi: vi.fn((input) => {
    if (typeof input === 'function') input([]);
  }),
  setRubriche: vi.fn(),
  setCurricula: vi.fn(),
  setSubmissions: vi.fn((input) => {
    if (typeof input === 'function') input([]);
  }),
  setDraftRegister: vi.fn((input) => {
    if (typeof input === 'function') {
      // Provide a proxy to handle nested spreads like ...prev[draftKey].studentAttendance
      const proxy = new Proxy({}, {
        get: (target, prop) => ({ studentAttendance: {} })
      });
      input(proxy);
    }
  }),
  setFinalizedRegister: vi.fn(),
  setGiudizi: vi.fn(),
  setReportistica: vi.fn(),
  resetAcademicData: vi.fn(),
  saveRubrica: vi.fn(),
  saveGiudizio: vi.fn()
};
vi.mock('../../src/stores/useAcademicStore', () => ({
  useAcademicStore: Object.assign(vi.fn((selector) => {
    const state = {
      actions: mockAcademicActions,
      lessons: {},
      slots: [],
      uda: [],
      eventi: [],
      rubriche: [],
      curricula: [],
      submissions: [],
      draftRegister: {},
      finalizedRegister: [],
      giudizi: [],
      reportistica: []
    };
    return selector ? selector(state) : state;
  }), {
    getState: vi.fn(() => ({ actions: mockAcademicActions })),
    subscribe: vi.fn(() => vi.fn())
  })
}));

const mockSystemActions = {
  loadFromBackup: vi.fn(),
  setUser: vi.fn(),
  setKnowledgeBase: vi.fn(),
  setSuggestions: vi.fn(),
  trackAnalyticsEvent: vi.fn(),
  dismissSuggestion: vi.fn(),
  reactivateSuggestion: vi.fn(),
  resetSystemData: vi.fn(),
  setActiveSuggestion: vi.fn(),
  setNotifiche: vi.fn((input) => {
    if (typeof input === 'function') input([]);
  }),
  setFeedSources: vi.fn(),
  setTemplates: vi.fn(),
  setCorpora: vi.fn()
};
vi.mock('../../src/stores/useSystemStore', () => ({
  useSystemStore: Object.assign(vi.fn((selector) => {
    const state = {
      actions: mockSystemActions,
      user: null,
      knowledgeBase: [],
      corpora: [],
      notifiche: [],
      feedSources: [],
      suggestions: [],
      activeSuggestion: null,
      dismissedSuggestions: new Set()
    };
    return selector ? selector(state) : state;
  }), {
    getState: vi.fn(() => ({ actions: mockSystemActions, dismissedSuggestions: new Set() })),
    subscribe: vi.fn(() => vi.fn())
  })
}));

const mockSettingsActions = {
  loadFromBackup: vi.fn(),
  setSettings: vi.fn(),
  setThemeState: vi.fn(),
  setAiSettings: vi.fn(),
  updateSettings: vi.fn(),
  reset: vi.fn()
};
vi.mock('../../src/stores/useSettingsStore', () => ({
  useSettingsStore: Object.assign(vi.fn((selector) => {
    const state = {
      actions: mockSettingsActions,
      settings: { backupFolderId: 'folder-1' },
      aiSettings: {},
      themeState: {}
    };
    return selector ? selector(state) : state;
  }), {
    getState: vi.fn(() => ({ actions: mockSettingsActions, settings: { backupFolderId: 'folder-1' } })),
    subscribe: vi.fn(() => vi.fn())
  })
}));

// Import hook
import { useAppEngine } from '../../src/hooks/useAppEngine';
import * as googleDriveService from '../../src/services/googleDriveService';
import * as backupService from '../../src/services/backupService';
import { analyzeSystemState } from '../../src/utils/suggestionUtils';
import { ImportService } from '../../src/services/importService';

describe('useAppEngine', () => {
  let state: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    if (typeof window !== 'undefined') {
      (window as any).__TEST_MODE = false;
    }
    vi.stubGlobal('google', {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn(),
          requestAccessToken: vi.fn()
        }
      }
    });

    state = {
      ui: {
        view: 'home',
        navigationHistory: [],
        backupState: { status: 'synced', lastBackup: null },
        driveSyncState: { isAuthenticated: false, isSyncing: false, lastSyncTime: null },
        actions: mockUiActions,
        modals: {}
      },
      students: {
        students: [],
        evaluations: [],
        actions: mockStudentActions
      },
      academic: {
        lessons: [],
        slots: [],
        uda: [],
        eventi: [],
        rubriche: [],
        curricula: [],
        submissions: [],
        giudizi: {},
        reportistica: [],
        draftRegister: {},
        finalizedRegister: {},
        actions: mockAcademicActions
      },
      system: {
        user: { id: '1', displayName: 'Test' },
        suggestions: [],
        dismissedSuggestions: [],
        actions: mockSystemActions
      },
      settings: {
        settings: { backupFolderId: 'folder123' },
        aiSettings: {},
        themeState: {},
        actions: mockSettingsActions
      }
    };

    vi.mocked(useUIStore).mockImplementation((selector: any) => selector ? selector(state.ui) : state.ui);
    vi.mocked(useStudentStore).mockImplementation((selector: any) => selector ? selector(state.students) : state.students);
    vi.mocked(useAcademicStore).mockImplementation((selector: any) => selector ? selector(state.academic) : state.academic);
    vi.mocked(useSystemStore).mockImplementation((selector: any) => selector ? selector(state.system) : state.system);
    vi.mocked(useSettingsStore).mockImplementation((selector: any) => selector ? selector(state.settings) : state.settings);

    mockUiActions.addNavigationEntry.mockImplementation((entry: any) => {
      state.ui.navigationHistory.push(entry);
    });
    mockUiActions.popNavigationEntry.mockImplementation(() => {
      state.ui.navigationHistory.pop();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize and load data in normal mode', async () => {
    const { loadBackup } = await import('../../src/services/backupService');
    vi.mocked(loadBackup).mockResolvedValueOnce({
      user: { id: '1', displayName: 'Test' },
      students: [],
      lessons: []
    });

    await act(async () => {
      renderHook(() => useAppEngine());
    });

    expect(mockUiActions.setIsRestoring).toHaveBeenCalledWith(true);
    expect(mockStudentActions.loadFromBackup).toHaveBeenCalled();
    expect(mockUiActions.setIsRestoring).toHaveBeenCalledWith(false);
  });

  it('should initialize in test mode', async () => {
    if (typeof window !== 'undefined') {
      (window as any).__TEST_MODE = true;
    }

    await act(async () => {
      renderHook(() => useAppEngine());
    });

    expect(mockSystemActions.setUser).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-local' }));
  });

  it('should initialize in test mode with backup', async () => {
    if (typeof window !== 'undefined') {
      (window as any).__TEST_MODE = true;
    }
    const { loadBackup } = await import('../../src/services/backupService');
    const { loadKbContentFromIndexedDB } = await import('../../src/services/indexedDbService');
    
    const mockBackup = {
      user: { id: 'test-user' },
      settings: {},
      aiSettings: {},
      themeState: {},
      knowledgeBase: [{ id: 'kb-1' }]
    };
    vi.mocked(loadBackup).mockResolvedValue(mockBackup);
    vi.mocked(loadKbContentFromIndexedDB).mockResolvedValue({ 'kb-1': { content: 'test' } });

    await act(async () => {
      renderHook(() => useAppEngine());
    });

    expect(mockSystemActions.loadFromBackup).toHaveBeenCalled();
    if (typeof window !== 'undefined') {
      (window as any).__TEST_MODE = false;
    }
  });

  it('should handle KB load failure in test mode', async () => {
    if (typeof window !== 'undefined') {
      (window as any).__TEST_MODE = true;
    }
    const { loadBackup } = await import('../../src/services/backupService');
    const { loadKbContentFromIndexedDB } = await import('../../src/services/indexedDbService');
    
    const mockBackup = {
      user: { id: 'test-user' },
      knowledgeBase: [{ id: 'kb-1' }]
    };
    vi.mocked(loadBackup).mockResolvedValue(mockBackup);
    vi.mocked(loadKbContentFromIndexedDB).mockRejectedValue(new Error('KB Error'));

    await act(async () => {
      renderHook(() => useAppEngine());
    });

    expect(mockSystemActions.loadFromBackup).toHaveBeenCalled();
    if (typeof window !== 'undefined') {
      (window as any).__TEST_MODE = false;
    }
  });

  it('should handle navigation', () => {
    const { result } = renderHook(() => useAppEngine());

    act(() => {
      result.current.actions.handleNavigate('studenti', { id: '1' });
    });

    expect(result.current.view).toBe('studenti');
    expect(result.current.viewContext).toEqual({ id: '1' });
  });

  it('should handle handleBack', () => {
    // Mock navigation history in the store BEFORE rendering
    state.ui.navigationHistory = [{ view: 'students', context: null }];

    const { result } = renderHook(() => useAppEngine());

    act(() => {
      result.current.actions.handleBack();
    });

    expect(mockUiActions.popNavigationEntry).toHaveBeenCalled();
  });

  it('should handle handleSyncToDrive', async () => {
    // Mock authenticated state
    state.ui.driveSyncState.isAuthenticated = true;

    const { result } = renderHook(() => useAppEngine());
    
    // Mock successful upload
    vi.mocked(googleDriveService.uploadBackup).mockResolvedValue({ id: 'file-id' } as any);

    await act(async () => {
      await result.current.actions.handleSyncToDrive();
    });

    expect(googleDriveService.uploadBackup).toHaveBeenCalled();
    expect(mockUiActions.showToast).toHaveBeenCalledWith('success', 'success');
  });

  it('should handle handleSyncToDrive with error', async () => {
    vi.mocked(googleDriveService.uploadBackup).mockRejectedValue(new Error('Upload failed'));
    vi.mocked(useUIStore).mockImplementation((selector: any) => {
      const state = {
        modals: {},
        actions: mockUiActions,
        navigationHistory: [],
        backupState: {},
        driveSyncState: { isAuthenticated: true }
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      await result.current.actions.handleSyncToDrive();
    });

    expect(mockUiActions.showToast).toHaveBeenCalledWith("Si è verificato un errore. Riprova.", 'error');
  });

  it('should handle handleRestoreFromDrive', async () => {
    // Mock authenticated state
    state.ui.driveSyncState.isAuthenticated = true;

    const { result } = renderHook(() => useAppEngine());
    
    const mockBackupData = {
      version: '1.0.0',
      timestamp: Date.now(),
      students: [],
      evaluations: [],
      lessons: [],
      user: { id: 'user-1' },
      knowledgeBase: [{ id: 'kb-1', title: 'Test KB', content: 'Content' }],
      settings: { backupFolderId: 'folder-1' },
      aiSettings: {},
      themeState: {}
    };

    vi.mocked(googleDriveService.downloadBackup).mockResolvedValue(mockBackupData as any);

    await act(async () => {
      await result.current.actions.handleRestoreFromDrive('file-id');
    });

    expect(googleDriveService.downloadBackup).toHaveBeenCalledWith('file-id');
    expect(mockSystemActions.loadFromBackup).toHaveBeenCalled();
    expect(mockUiActions.showToast).toHaveBeenCalledWith('restoreSuccess', 'success');
  });

  it('should handle handleRestoreFromDrive with error', async () => {
    const { downloadBackup } = await import('../../src/services/googleDriveService');
    vi.mocked(downloadBackup).mockRejectedValue(new Error('Download failed'));
    
    state.ui.driveSyncState.isAuthenticated = true;

    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      await result.current.actions.handleRestoreFromDrive('folder-1');
    });

    expect(mockUiActions.showToast).toHaveBeenCalledWith('restoreError', 'error');
  });

  it('should handle resetAll', async () => {
    const { result } = renderHook(() => useAppEngine());

    await act(async () => {
      await result.current.actions.resetAll();
    });

    expect(mockStudentActions.resetStudentData).toHaveBeenCalled();
    expect(mockAcademicActions.resetAcademicData).toHaveBeenCalled();
    expect(mockSystemActions.resetSystemData).toHaveBeenCalled();
  });

  it('should handle handleLoadDemoData', async () => {
    const { result } = renderHook(() => useAppEngine());

    await act(async () => {
      await result.current.actions.handleLoadDemoData();
    });

    // Demo data loading is async and uses dynamic import, so we might need to wait
    await vi.waitFor(() => {
      expect(mockStudentActions.loadFromBackup).toHaveBeenCalled();
    });
  });

  it('should handle dismissSuggestion', () => {
    const mockSuggestions = [{ id: 'sugg-1', title: 'Test' }];
    vi.mocked(useSystemStore).mockImplementation((selector: any) => {
      const state = {
        suggestions: mockSuggestions,
        dismissedSuggestions: new Set(),
        actions: mockSystemActions
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useAppEngine());

    act(() => {
      result.current.actions.dismissSuggestion('sugg-1');
    });

    expect(mockSystemActions.setSuggestions).toHaveBeenCalledWith([]);
    expect(mockSystemActions.dismissSuggestion).toHaveBeenCalledWith('sugg-1');
    expect(mockUiActions.showToast).toHaveBeenCalledWith('Suggestion dismissed', 'info');
  });

  it('should handle handleAiSuggestionFromHome', () => {
    const { result } = renderHook(() => useAppEngine());
    const mockAction = { type: 'navigate', payload: 'students' };

    act(() => {
      result.current.actions.handleAiSuggestionFromHome(mockAction);
    });

    // Should navigate to students
    // We can't easily check local state 'view' from here without exposing it or checking side effects
  });

  it('should handle handleConfigureDrive', () => {
    const { result } = renderHook(() => useAppEngine());
    result.current.actions.handleConfigureDrive('client-id', 'api-key');
    expect(mockSettingsActions.updateSettings).toHaveBeenCalledWith({
      googleClientId: 'client-id',
      googleApiKey: 'api-key'
    });
  });

  it('should handle handleConnectDrive', async () => {
    const { result } = renderHook(() => useAppEngine());
    vi.mocked(googleDriveService.initTokenClient).mockReturnValue(true);
    vi.mocked(googleDriveService.requestAccessToken).mockReturnValue(undefined);
    
    await act(async () => {
      await result.current.actions.handleConnectDrive();
    });

    expect(googleDriveService.initTokenClient).toHaveBeenCalled();
    expect(googleDriveService.requestAccessToken).toHaveBeenCalled();
  });

  it('should handle handleDisconnectDrive', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      await result.current.actions.handleDisconnectDrive();
    });

    expect(googleDriveService.revokeAccessToken).toHaveBeenCalled();
    expect(mockUiActions.setDriveSyncState).toHaveBeenCalled();
  });

  it('should handle handleEnterStudentMode', () => {
    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.handleEnterStudentMode();
    });
    expect(mockUiActions.addNavigationEntry).toHaveBeenCalled();
  });

  it('should handle handleStartClassroom', () => {
    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.handleStartClassroom('class-1', 'materia', 'slot-1', { id: 'lesson-1' } as any);
    });
    expect(mockAcademicActions.setDraftRegister).toHaveBeenCalled();
  });

  it('should handle handleEditSlot', () => {
    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.handleEditSlot('Lunedi', '1');
    });
    expect(mockUiActions.setEditingSlotKey).toHaveBeenCalledWith('Lunedi-1');
  });

  it('should handle handleShowSlotActions', () => {
    const { result } = renderHook(() => useAppEngine());
    const mockSlot = { giorno: 'Lunedi', ora: '1' };
    const mockLesson = { id: 'lesson-1' };
    act(() => {
      result.current.actions.handleShowSlotActions(mockSlot as any, mockLesson as any);
    });
    expect(mockUiActions.setActiveSlotKey).toHaveBeenCalledWith('Lunedi-1');
    expect(mockUiActions.setLessonViewContext).toHaveBeenCalledWith(mockLesson);
  });

  it('should handle handleAiSuggest', () => {
    const { result } = renderHook(() => useAppEngine());
    const mockSlot = { materia: 'Italiano', classe: '1A' };
    act(() => {
      result.current.actions.handleAiSuggest(mockSlot as any);
    });
    expect(mockUiActions.showToast).toHaveBeenCalledWith('aiSuggestionPrep', 'info');
  });

  it('should handle handleOpenBackupInfo', () => {
    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.handleOpenBackupInfo();
    });
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isBackupInfoModalOpen', true);
  });

  it('should handle handleOpenOperations', () => {
    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.handleOpenOperations();
    });
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isOperationsCenterOpen', true);
  });

  it('should handle handlePromoteStudents', () => {
    const { result } = renderHook(() => useAppEngine());
    const mockStudents = [{ id: 's1' }];
    act(() => {
      result.current.actions.handlePromoteStudents(mockStudents as any, '2024/2025');
    });
    expect(mockStudentActions.setStudents).toHaveBeenCalledWith(mockStudents);
    expect(mockSettingsActions.updateSettings).toHaveBeenCalledWith({ annoScolasticoCorrente: '2024/2025' });
  });

  it('should handle handleResetYearData', async () => {
    const { result } = renderHook(() => useAppEngine());
    await act(async () => {
      await result.current.actions.handleResetYearData();
    });
    expect(mockStudentActions.setEvaluations).toHaveBeenCalledWith([]);
    expect(mockAcademicActions.setDraftRegister).toHaveBeenCalledWith({});
  });

  it('should handle onScheduleLesson', () => {
    const { result } = renderHook(() => useAppEngine());
    const mockData = { materia: 'Italiano', classe: '1A', slotKey: 'Lun-1' };
    act(() => {
      result.current.actions.onScheduleLesson(mockData as any);
    });
    expect(mockAcademicActions.setLessons).toHaveBeenCalled();
    expect(mockAcademicActions.setSlots).toHaveBeenCalled();
  });

  it('should handle handleGradeSubmission', () => {
    const mockSubmissions = [{ id: 'sub-1', studentId: 's1', lessonId: 'l1', status: 'pending' }];
    const mockLessons = { l1: { id: 'l1', materia: 'Math', contenuto: 'Algebra' } };
    
    vi.mocked(useAcademicStore).mockImplementation((selector: any) => {
      const state = {
        submissions: mockSubmissions,
        lessons: mockLessons,
        actions: mockAcademicActions
      };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.handleGradeSubmission('sub-1', '8', 'Bravo');
    });
    expect(mockAcademicActions.setSubmissions).toHaveBeenCalled();
    expect(mockStudentActions.setEvaluations).toHaveBeenCalled();
  });

  it('should handle handleAddEvaluation', () => {
    const { result } = renderHook(() => useAppEngine());
    const mockEval = { studenteId: 's1', voto: '9' };
    act(() => {
      result.current.actions.handleAddEvaluation(mockEval as any);
    });
    expect(mockStudentActions.setEvaluations).toHaveBeenCalled();
  });

  it('should handle handleCreateUda', () => {
    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.handleCreateUda({} as any);
    });
    expect(mockAcademicActions.setUda).toHaveBeenCalled();
  });

  it('should handle handleCleanDemoData', async () => {
    const { result } = renderHook(() => useAppEngine());
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await act(async () => {
      await result.current.actions.handleCleanDemoData();
    });

    expect(mockStudentActions.resetStudentData).toHaveBeenCalled();
    expect(mockAcademicActions.resetAcademicData).toHaveBeenCalled();
    expect(mockSystemActions.resetSystemData).toHaveBeenCalled();
    expect(mockSettingsActions.reset).toHaveBeenCalled();
  });

  it('should handle handleInstallApp', async () => {
    const mockPrompt = {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    };
    
    // Manually set installPrompt in the mock store return value for this test
    state.ui.installPrompt = mockPrompt;

    const { result } = renderHook(() => useAppEngine());

    await act(async () => {
      result.current.actions.handleInstallApp();
    });

    expect(mockPrompt.prompt).toHaveBeenCalled();
    await mockPrompt.userChoice;
    expect(mockUiActions.setInstallPrompt).toHaveBeenCalledWith(null);
  });

  it('should handle onMarkAttendance', async () => {
    // Mock draftRegister in the store BEFORE rendering
    state.academic.draftRegister = { 'slot-1': { studentAttendance: {} } };

    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      result.current.actions.handleNavigate('aula-session', { draftKey: 'slot-1' });
    });

    await act(async () => {
      result.current.actions.onMarkAttendance({ studentName: 'Mario Rossi', status: 'presente' });
    });

    expect(mockAcademicActions.setDraftRegister).toHaveBeenCalled();
  });

  it('should handle handleExportData', async () => {
    const originalURL = global.URL;
    const createObjectURLSpy = vi.fn(() => 'blob:url');
    const revokeObjectURLSpy = vi.fn();
    vi.stubGlobal('URL', {
      ...originalURL,
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy
    });

    const clickSpy = vi.fn();
    const mockLink = {
      click: clickSpy,
      setAttribute: vi.fn(),
      style: {},
      href: '',
      download: ''
    };
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return mockLink as any;
      return originalCreateElement(tagName);
    });
    
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      await result.current.actions.handleExportData();
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    vi.stubGlobal('URL', originalURL);
  });

  it('should handle handleImportData with JSON', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['{"settings": {}}'], 'backup.json', { type: 'application/json' });
    
    class MockFileReader {
      onload: any;
      readAsText(f: File) {
        setTimeout(() => {
          this.onload({ target: { result: '{"settings": {}}' } });
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    await act(async () => {
      await result.current.actions.handleImportData(file);
      vi.runAllTimers();
    });

    expect(mockSettingsActions.loadFromBackup).toHaveBeenCalled();
  });

  it('should handle handleStartClassroom', async () => {
    // Ensure draftRegister is empty for this test
    state.academic.draftRegister = {};

    const { result } = renderHook(() => useAppEngine());
    const lesson = { id: 'l1', materia: 'Math', classe: '1A' } as any;
    
    await act(async () => {
      result.current.actions.handleStartClassroom('1A', 'Math', 'slot-1', lesson);
    });

    expect(mockAcademicActions.setDraftRegister).toHaveBeenCalled();
  });

  it('should handle handlePromoteStudents', async () => {
    const { result } = renderHook(() => useAppEngine());
    const students = [{ id: 's1', nome: 'Mario' }] as any;
    
    await act(async () => {
      result.current.actions.handlePromoteStudents(students, '2024/2025');
    });

    expect(mockStudentActions.setStudents).toHaveBeenCalledWith(students);
    expect(mockSettingsActions.updateSettings).toHaveBeenCalledWith({ annoScolasticoCorrente: '2024/2025' });
  });

  it('should handle onAddLessons', async () => {
    const { result } = renderHook(() => useAppEngine());
    const newLessons = [{ id: 'l1', materia: 'Math' }] as any;
    
    await act(async () => {
      result.current.actions.onAddLessons(newLessons);
    });

    expect(mockAcademicActions.setLessons).toHaveBeenCalled();
    const updater = mockAcademicActions.setLessons.mock.calls[0][0];
    const prev = {};
    const next = updater(prev);
    expect(next['l1']).toEqual(newLessons[0]);
  });

  it('should handle setBackupState functional update', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      result.current.actions.setBackupState((prev: any) => ({ status: 'error' }));
    });

    expect(mockUiActions.setBackupState).toHaveBeenCalled();
    const updater = mockUiActions.setBackupState.mock.calls[0][0];
    const prev = { status: 'synced' };
    const next = updater(prev);
    expect(next.status).toBe('error');
  });

  it('should handle setDriveSyncState functional update', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      result.current.actions.setDriveSyncState((prev: any) => ({ isAuthenticated: true }));
    });

    expect(mockUiActions.setDriveSyncState).toHaveBeenCalled();
    const updater = mockUiActions.setDriveSyncState.mock.calls[0][0];
    const prev = { isAuthenticated: false };
    const next = updater(prev);
    expect(next.isAuthenticated).toBe(true);
  });

  it('should handle setBackupState non-functional update', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      result.current.actions.setBackupState({ status: 'error' });
    });

    expect(mockUiActions.setBackupState).toHaveBeenCalled();
    const updater = mockUiActions.setBackupState.mock.calls[0][0];
    const prev = { status: 'synced' };
    const next = updater(prev);
    expect(next.status).toBe('error');
  });

  it('should handle setDriveSyncState non-functional update', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      result.current.actions.setDriveSyncState({ isAuthenticated: true });
    });

    expect(mockUiActions.setDriveSyncState).toHaveBeenCalled();
    const updater = mockUiActions.setDriveSyncState.mock.calls[0][0];
    const prev = { isAuthenticated: false };
    const next = updater(prev);
    expect(next.isAuthenticated).toBe(true);
  });

  it('should handle modalsProxy methods', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    act(() => {
      result.current.modals.setIsOperationsCenterOpen(true);
      result.current.modals.setIsImageAnalysisOpen(true);
      result.current.modals.setIsLiveAssistantModalOpen(true);
      result.current.modals.setIsHelpOpen(true);
      result.current.modals.setIsLoadingModalOpen(true);
      result.current.modals.setIsLoadingModalOpen(false);
      result.current.modals.setIsLoadingModalOpen();
      result.current.modals.setLoadingModalMessage('Loading...');
      result.current.modals.setLoadingModalMessage();
      result.current.modals.setIsBackupInfoModalOpen(true);
      result.current.modals.setIsRegisterImportOpen(true);
      result.current.modals.setIsYearTransitionOpen(true);
      result.current.modals.setIsVideoAnalysisOpen(true);
      result.current.modals.setIsVideoAnalysisOpen(false);
      result.current.modals.setIsVideoAnalysisOpen();
      result.current.modals.setIsRestoring(true);
      result.current.modals.setCircularAnalysisModal({ isOpen: true, url: '', title: '' });
      result.current.modals.setSyncConflictModal({ isOpen: true, data: null });
      result.current.modals.setSyncConflictModal(null);
      result.current.modals.setSyncConflictModal({ isOpen: true, data: null });
    });

    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isOperationsCenterOpen', true);
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isImageAnalysisOpen', true);
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isLiveAssistantModalOpen', true);
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isHelpOpen', true);
    expect(mockUiActions.setLoading).toHaveBeenCalledWith(true);
    expect(mockUiActions.setLoading).toHaveBeenCalledWith(true, 'Loading...');
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isBackupInfoModalOpen', true);
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isRegisterImportOpen', true);
    expect(mockUiActions.toggleModal).toHaveBeenCalledWith('isYearTransitionOpen', true);
    expect(mockUiActions.setIsVideoAnalysisOpen).toHaveBeenCalledWith(true);
    expect(mockUiActions.setIsRestoring).toHaveBeenCalledWith(true);
    expect(mockUiActions.setCircularAnalysisModal).toHaveBeenCalled();
    expect(mockUiActions.setSyncConflictModal).toHaveBeenCalled();
  });

  it('should handle handleBack with empty history', async () => {
    state.ui.navigationHistory = [];
    const { result } = renderHook(() => useAppEngine());
    await act(async () => {
      result.current.actions.handleBack();
    });
    expect(result.current.view).toBe('home');
  });

  it('should handle handleBack from a non-home view', async () => {
    const { result } = renderHook(() => useAppEngine());
    await act(async () => {
      result.current.actions.handleNavigate('studenti');
    });
    expect(state.ui.navigationHistory.length).toBe(1);
    await act(async () => {
      result.current.actions.handleBack();
    });
    expect(result.current.view).toBe('home');
    expect(state.ui.navigationHistory.length).toBe(0);
  });

  it('should handle handleConnectDrive with success and failure', async () => {
    // Test failure
    vi.mocked(googleDriveService.initTokenClient).mockReturnValue(false);
    const { result } = renderHook(() => useAppEngine());
    await act(async () => {
      result.current.actions.handleConnectDrive();
    });
    expect(mockUiActions.showToast).toHaveBeenCalledWith('driveInitError', 'error');

    // Test success
    vi.mocked(googleDriveService.initTokenClient).mockImplementation((callback: any) => {
      callback({ access_token: 'test-token' });
      return true;
    });
    await act(async () => {
      result.current.actions.handleConnectDrive();
    });
    expect(googleDriveService.requestAccessToken).toHaveBeenCalled();
    expect(mockUiActions.showToast).toHaveBeenCalledWith('driveConnected', 'success');
  });

  it('should return early in handleRestoreFromDrive if not authenticated', async () => {
    state.ui.driveSyncState.isAuthenticated = false;
    const { result } = renderHook(() => useAppEngine());
    await act(async () => {
      await result.current.actions.handleRestoreFromDrive();
    });
    expect(googleDriveService.downloadBackup).not.toHaveBeenCalled();
  });

  it('should return early in handleSyncToDrive if not authenticated', async () => {
    state.ui.driveSyncState.isAuthenticated = false;
    const { result } = renderHook(() => useAppEngine());
    await act(async () => {
      await result.current.actions.handleSyncToDrive();
    });
    expect(googleDriveService.getBackupMetadata).not.toHaveBeenCalled();
  });

  it('should handle handleSyncToDrive with conflict', async () => {
    const { getBackupMetadata } = await import('../../src/services/googleDriveService');
    vi.mocked(getBackupMetadata).mockResolvedValue({ 
      timestamp: Date.now() + 10000,
      modifiedTime: new Date(Date.now() + 10000).toISOString() 
    } as any);

    state.ui.driveSyncState.isAuthenticated = true;
    state.ui.driveSyncState.lastSyncTime = new Date(Date.now() - 10000);

    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      await result.current.actions.handleSyncToDrive();
    });

    expect(mockUiActions.setSyncConflictModal).toHaveBeenCalled();
  });

  it('should handle handleImportData with generic file', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['some content'], 'data.csv', { type: 'text/csv' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockResolvedValue({
      students: [{ id: 's1', nome: 'Mario' } as any],
      evaluations: [],
      errors: []
    });

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockStudentActions.importStudents).toHaveBeenCalled();
  });

  it('should handle handleImportData with JSON file', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['{}'], 'test.json', { type: 'application/json' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockResolvedValue({
      students: [{ id: '1', nome: 'Test', cognome: 'Student', classe: '1A' }],
      evaluations: [{ id: 'e1', studenteId: '1', voto: '8' }],
      errors: []
    } as any);

    // Mock FileReader
    const mockReader = {
      readAsText: vi.fn(function(this: any) {
        if (this.onload) this.onload({ target: { result: '{}' } });
      }),
      onload: null as any
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function(this: any) {
      return mockReader as any;
    });

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockStudentActions.importStudents).toHaveBeenCalled();
    expect(mockStudentActions.importEvaluations).toHaveBeenCalled();
    expect(mockUiActions.showToast).toHaveBeenCalledWith('imported', 'success');
  });

  it('should handle handleImportData with JSON file error', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['invalid'], 'test.json', { type: 'application/json' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockRejectedValue(new Error('Parse error'));

    const mockReader = {
      readAsText: vi.fn(function(this: any) {
        if (this.onload) this.onload({ target: { result: 'invalid' } });
      }),
      onload: null as any
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function(this: any) {
      return mockReader as any;
    });

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockUiActions.showToast).toHaveBeenCalledWith('invalidFile', 'error');
  });

  it('should handle handleImportData with generic file and evaluations', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockResolvedValue({
      students: [{ id: '1', nome: 'Test', cognome: 'Student', classe: '1A' }],
      evaluations: [{ id: 'e1', studenteId: '1', voto: '8' }],
      errors: []
    } as any);

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockStudentActions.importEvaluations).toHaveBeenCalled();
  });

  it('should handle handleImportData with generic file and errors', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockResolvedValue({
      students: [],
      evaluations: [],
      errors: ['Error 1']
    } as any);

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockUiActions.showToast).toHaveBeenCalledWith('invalidFile', 'error');
  });

  it('should handle handleImportData with generic file and no data', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockResolvedValue({
      students: [],
      evaluations: [],
      errors: []
    } as any);

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockUiActions.showToast).toHaveBeenCalledWith('invalidFile', 'error');
  });

  it('should handle handleImportData with generic file error', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockRejectedValue(new Error('Parse error'));

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockUiActions.showToast).toHaveBeenCalledWith('invalidFile', 'error');
  });

  it('should handle handleImportData with full backup JSON', async () => {
    const { result } = renderHook(() => useAppEngine());
    const backupData = {
      students: [{ id: 's1', nome: 'Mario' }],
      settings: { annoScolasticoCorrente: '2023/24' }
    };
    const file = new File([JSON.stringify(backupData)], 'backup.json', { type: 'application/json' });
    
    const mockReader = {
      readAsText: vi.fn(function(this: any) {
        if (this.onload) this.onload({ target: { result: JSON.stringify(backupData) } });
      }),
      onload: null as any
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function(this: any) {
      return mockReader as any;
    });

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockStudentActions.loadFromBackup).toHaveBeenCalled();
    expect(mockUiActions.showToast).toHaveBeenCalledWith('imported', 'success');
  });

  it('should handle handleAiSuggestionFromHome with non-navigate action', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      result.current.actions.handleAiSuggestionFromHome({ type: 'other' });
    });

    // Should not navigate
    expect(result.current.view).toBe('home');
  });

  it('should handle loadFromBackup action', () => {
    const { result } = renderHook(() => useAppEngine());
    const mockData = { students: [] };
    
    act(() => {
      result.current.actions.loadFromBackup(mockData);
    });
    
    expect(mockStudentActions.loadFromBackup).toHaveBeenCalledWith(mockData);
    expect(mockAcademicActions.loadFromBackup).toHaveBeenCalledWith(mockData);
    expect(mockSystemActions.loadFromBackup).toHaveBeenCalledWith(mockData);
  });

  it('should handle loading modal actions in actions proxy', () => {
    const { result } = renderHook(() => useAppEngine());
    
    act(() => {
      result.current.actions.setIsLoadingModalOpen(true);
    });
    expect(mockUiActions.setLoading).toHaveBeenCalledWith(true);

    act(() => {
      result.current.actions.setLoadingModalMessage('Test Message');
    });
    expect(mockUiActions.setLoading).toHaveBeenCalledWith(true, 'Test Message');
  });

  it('should handle onMarkAttendance with missing draftKey', async () => {
    const { result } = renderHook(() => useAppEngine());
    
    await act(async () => {
      result.current.actions.onMarkAttendance({ studentName: 'Mario Rossi', status: 'presente' });
    });

    expect(mockAcademicActions.setDraftRegister).not.toHaveBeenCalled();
  });

  it('should generate AI suggestions after delay', async () => {
    vi.useFakeTimers();
    const mockSuggestion = { id: '1', title: 'Test Suggestion', content: 'Content', type: 'info' };
    vi.mocked(analyzeSystemState).mockReturnValue(mockSuggestion as any);

    renderHook(() => useAppEngine());

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(analyzeSystemState).toHaveBeenCalled();
    expect(mockSystemActions.setActiveSuggestion).toHaveBeenCalledWith(mockSuggestion);
    vi.useRealTimers();
  });

  it('should handle AI suggestions generation failure', async () => {
    vi.useFakeTimers();
    vi.mocked(analyzeSystemState).mockImplementation(() => {
      throw new Error('AI Error');
    });
    
    renderHook(() => useAppEngine());

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      try {
        vi.advanceTimersByTime(5000);
      } catch (e) {
        // Expected
      }
    });
    
    expect(analyzeSystemState).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should handle beforeinstallprompt event', () => {
    renderHook(() => useAppEngine());
    
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };
    
    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: mockEvent.preventDefault });
      (event as any).prompt = mockEvent.prompt;
      (event as any).userChoice = mockEvent.userChoice;
      window.dispatchEvent(event);
    });
  });

  it('should handle auto-sync interval', async () => {
    vi.useFakeTimers();
    const mockSettings = { autoSyncEnabled: true, autoSyncInterval: 30 };
    vi.mocked(analyzeSystemState).mockReturnValue([] as any);
    
    state.settings.settings = mockSettings;
    state.ui.driveSyncState.isAuthenticated = true;
    
    const { result } = renderHook(() => useAppEngine());

    // Wait for initial load and isDataLoaded to become true
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });
    
    // Wait for async handleSyncToDrive
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(googleDriveService.uploadBackup).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should handle initial load with valid backup', async () => {
    (window as any).__TEST_MODE = false;
    const { loadBackup } = await import('../../src/services/backupService');
    const { validateBackupData } = await import('../../src/utils/dataValidator');
    
    const mockData = { 
      students: [], 
      settings: {}, 
      aiSettings: {}, 
      themeState: {},
      knowledgeBase: [{ id: 'kb1', content: 'old' }]
    };
    vi.mocked(loadBackup).mockResolvedValue(mockData as any);
    vi.mocked(validateBackupData).mockReturnValue(mockData as any);
    
    const { loadKbContentFromIndexedDB } = await import('../../src/services/indexedDbService');
    vi.mocked(loadKbContentFromIndexedDB).mockResolvedValue({ kb1: { content: 'new' } });

    renderHook(() => useAppEngine());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockStudentActions.loadFromBackup).toHaveBeenCalled();
    expect(mockSystemActions.setKnowledgeBase).toHaveBeenCalledWith([{ id: 'kb1', content: 'new' }]);
    (window as any).__TEST_MODE = true;
  });

  it('should handle initial load with KB error', async () => {
    (window as any).__TEST_MODE = false;
    const { loadBackup } = await import('../../src/services/backupService');
    const mockData = { students: [], knowledgeBase: [{ id: 'kb1' }] };
    vi.mocked(loadBackup).mockResolvedValue(mockData as any);
    
    const { loadKbContentFromIndexedDB } = await import('../../src/services/indexedDbService');
    vi.mocked(loadKbContentFromIndexedDB).mockRejectedValue(new Error('KB Error'));

    renderHook(() => useAppEngine());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockStudentActions.loadFromBackup).toHaveBeenCalled();
    (window as any).__TEST_MODE = true;
  });

  it('should handle initial load failure', async () => {
    (window as any).__TEST_MODE = false;
    const { loadBackup } = await import('../../src/services/backupService');
    vi.mocked(loadBackup).mockRejectedValue(new Error('Load failed'));

    renderHook(() => useAppEngine());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockStudentActions.resetStudentData).toHaveBeenCalled();
    expect(mockUiActions.setBackupState).toHaveBeenCalledWith({ status: 'error', lastBackup: null });
    (window as any).__TEST_MODE = true;
  });

  it('should handle handleImportData with JSON file and no students', async () => {
    const { result } = renderHook(() => useAppEngine());
    const file = new File(['{}'], 'test.json', { type: 'application/json' });
    
    const { ImportService } = await import('../../src/services/importService');
    vi.mocked(ImportService.parseFile).mockResolvedValue({
      students: [],
      evaluations: [],
      errors: []
    } as any);

    const mockReader = {
      readAsText: vi.fn(function(this: any) {
        if (this.onload) this.onload({ target: { result: '{}' } });
      }),
      onload: null as any
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function(this: any) {
      return mockReader as any;
    });

    await act(async () => {
      await result.current.actions.handleImportData(file);
    });

    expect(mockUiActions.showToast).toHaveBeenCalledWith('invalidFile', 'error');
  });

  it('should handle onSaveUda update existing and new', () => {
    const mockUda = [{ id: 'uda-1', titolo: 'Old' }];
    state.academic.uda = mockUda;

    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.onSaveUda({ id: 'uda-1', titolo: 'New' } as any);
    });
    expect(mockAcademicActions.setUda).toHaveBeenCalled();
    expect(mockUiActions.showToast).toHaveBeenCalledWith('udaSaved', 'success');
    
    const updater = mockAcademicActions.setUda.mock.calls[0][0];
    
    // Branch: existing
    const nextUpdate = updater(mockUda);
    expect(nextUpdate[0].titolo).toBe('New');
    
    // Branch: new
    const nextNew = updater([]);
    expect(nextNew).toHaveLength(1);
    expect(nextNew[0].id).toBe('uda-1');
  });

  it('should handle onSaveReport', () => {
    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.onSaveReport({ id: 'rep-1' } as any);
    });
    expect(mockAcademicActions.setReportistica).toHaveBeenCalled();
    const updater = mockAcademicActions.setReportistica.mock.calls[0][0];
    const next = updater([]);
    expect(next).toHaveLength(1);
  });

  it('should handle onSaveEvent update existing and new', () => {
    const mockEvents = [{ id: 'ev-1', title: 'Old' }];
    state.academic.eventi = mockEvents;

    const { result } = renderHook(() => useAppEngine());
    act(() => {
      result.current.actions.onSaveEvent({ id: 'ev-1', title: 'New' } as any);
    });
    expect(mockAcademicActions.setEventi).toHaveBeenCalled();
    
    const updater = mockAcademicActions.setEventi.mock.calls[0][0];
    
    // Branch: existing
    const nextUpdate = updater(mockEvents);
    expect(nextUpdate[0].title).toBe('New');

    // Branch: new
    const nextNew = updater([]);
    expect(nextNew).toHaveLength(1);
    expect(nextNew[0].id).toBe('ev-1');
  });

  describe('Coverage Improvements', () => {
    it.skip('should handle test mode with no backup (lines 106, 109)', async () => {
      if (typeof window !== 'undefined') {
        (window as any).__TEST_MODE = true;
        (window as any).__TEST_BACKUP = null;
      }
      const { loadBackup } = await import('../../src/services/backupService');
      vi.mocked(loadBackup).mockResolvedValue(null);

      renderHook(() => useAppEngine());

      await act(async () => {
        await vi.runAllTimersAsync();
      });
      
      // Wait for dynamic imports and microtasks
      await act(async () => {
        for (let i = 0; i < 50; i++) await Promise.resolve();
      });

      // In test mode with no backup, handleLoadDemoData is called via setTimeout which triggers dynamic import
      // This eventually calls studentActions.loadFromBackup via the DEMO_DATA
      expect(mockStudentActions.loadFromBackup).toHaveBeenCalled();
      if (typeof window !== 'undefined') {
        (window as any).__TEST_MODE = false;
      }
    });

    it('should handle test mode with restore failure (line 113)', async () => {
      if (typeof window !== 'undefined') {
        (window as any).__TEST_MODE = true;
      }
      const { loadBackup } = await import('../../src/services/backupService');
      vi.mocked(loadBackup).mockRejectedValue(new Error('Restore failed'));
      const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderHook(() => useAppEngine());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('Test backup restore attempt failed'), expect.any(Error));
      spyWarn.mockRestore();
      if (typeof window !== 'undefined') {
        (window as any).__TEST_MODE = false;
      }
    });

    it.skip('should handle initial load with no backup (lines 157, 159, 160)', async () => {
      if (typeof window !== 'undefined') {
        (window as any).__TEST_MODE = false;
      }
      const { loadBackup } = await import('../../src/services/backupService');
      vi.mocked(loadBackup).mockResolvedValue(null);

      renderHook(() => useAppEngine());

      await act(async () => {
        await vi.runAllTimersAsync();
      });
      
      // Flush microtasks for the dynamic import
      for (let i = 0; i < 20; i++) await Promise.resolve();

      expect(mockStudentActions.loadFromBackup).toHaveBeenCalled();
    });

    it.skip('should handle test mode with setTimeout failure (line 109)', async () => {
      vi.useRealTimers();
      if (typeof window !== 'undefined') {
        (window as any).__TEST_MODE = true;
        (window as any).__TEST_BACKUP = null;
      }
      vi.stubGlobal('setTimeout', () => {
        throw new Error('setTimeout failed');
      });
      const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      renderHook(() => useAppEngine());

      // Wait for async init
      for (let i = 0; i < 20; i++) await Promise.resolve();

      expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to trigger demo load in test mode'), expect.any(Error));
      
      spyWarn.mockRestore();
      vi.unstubAllGlobals();
      vi.useFakeTimers();
      if (typeof window !== 'undefined') {
        (window as any).__TEST_MODE = false;
      }
    });

    it('should register beforeinstallprompt listener on mount (line 249/188)', () => {
      const spyAddEvent = vi.spyOn(window, 'addEventListener');
      renderHook(() => useAppEngine());
      expect(spyAddEvent).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      spyAddEvent.mockRestore();
    });

    it('should handle AI suggestions generation failure (line 249)', async () => {
      const { loadBackup } = await import('../../src/services/backupService');
      vi.mocked(loadBackup).mockResolvedValue(null); // Reset from any previous mockRejectedValue
      const { generateAiSuggestions } = await import('../../src/utils/aiSuggestionGenerator');
      vi.mocked(generateAiSuggestions).mockRejectedValue(new Error('AI Error'));
      const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => useAppEngine());

      await act(async () => {
        // Need many cycles: backup load → isDataLoaded=true → re-render → AI effect → dynamic import → rejection
        for (let i = 0; i < 20; i++) await Promise.resolve();
      });

      expect(spyError).toHaveBeenCalledWith(expect.stringContaining('AI suggestions generation failed'), expect.any(Error));
      spyError.mockRestore();
    });

    it('should handle handleNavigate error (lines 274, 275)', async () => {
      mockUiActions.addNavigationEntry.mockImplementationOnce(() => {
        throw new Error('Nav error');
      });
      const { result } = renderHook(() => useAppEngine());
      
      act(() => {
        result.current.actions.handleNavigate('studenti' as any);
      });

      expect(mockUiActions.showToast).toHaveBeenCalledWith('Errore durante la navigazione', 'error');
    });

    it('should handle handleBack fallback to home (lines 286, 287)', () => {
      state.ui.navigationHistory = [];
      
      const { result } = renderHook(() => useAppEngine());
      
      // Set view to something else than home without adding to history
      mockUiActions.addNavigationEntry.mockImplementationOnce(() => {});
      act(() => {
        result.current.actions.handleNavigate('studenti' as any);
      });
      
      // Ensure history is empty
      state.ui.navigationHistory = [];
      mockUiActions.popNavigationEntry.mockClear();
      
      act(() => {
        result.current.actions.handleBack();
      });

      expect(mockUiActions.popNavigationEntry).not.toHaveBeenCalled();
    });

    it('should handle handleConnectDrive init failure (line 300)', async () => {
      const { initTokenClient } = await import('../../src/services/googleDriveService');
      vi.mocked(initTokenClient).mockReturnValue(false);

      const { result } = renderHook(() => useAppEngine());
      act(() => {
        result.current.actions.handleConnectDrive();
      });

      expect(mockUiActions.showToast).toHaveBeenCalledWith('driveInitError', 'error');
    });

    it('should handle handleSyncToDrive auth check (line 318)', async () => {
      state.ui.driveSyncState.isAuthenticated = false;
      const { result } = renderHook(() => useAppEngine());
      
      await act(async () => {
        await result.current.actions.handleSyncToDrive();
      });

      expect(mockUiActions.setDriveSyncState).not.toHaveBeenCalledWith(expect.objectContaining({ isSyncing: true }));
    });

    it('should handle handleSyncToDrive conflict (line 330)', async () => {
      state.ui.driveSyncState.isAuthenticated = true;
      state.ui.driveSyncState.lastSyncTime = new Date('2023-01-01');
      
      const { getBackupMetadata } = await import('../../src/services/googleDriveService');
      vi.mocked(getBackupMetadata).mockResolvedValue({
        modifiedTime: new Date('2023-01-02').toISOString()
      } as any);

      const { result } = renderHook(() => useAppEngine());
      await act(async () => {
        await result.current.actions.handleSyncToDrive();
      });

      expect(mockUiActions.setSyncConflictModal).toHaveBeenCalledWith(expect.objectContaining({ isOpen: true }));
    });

    it('should handle handleSyncToDrive success and error (lines 375, 379)', async () => {
      state.ui.driveSyncState.isAuthenticated = true;
      state.ui.driveSyncState.lastSyncTime = new Date('2023-01-03');
      
      const { getBackupMetadata, uploadBackup } = await import('../../src/services/googleDriveService');
      vi.mocked(getBackupMetadata).mockResolvedValue({
        modifiedTime: new Date('2023-01-01').toISOString()
      } as any);

      const { result } = renderHook(() => useAppEngine());
      
      // Success
      vi.mocked(uploadBackup).mockResolvedValue({ id: 'file-1' } as any);
      await act(async () => {
        await result.current.actions.handleSyncToDrive();
      });
      expect(mockUiActions.showToast).toHaveBeenCalledWith('success', 'success');

      // Error
      vi.mocked(uploadBackup).mockRejectedValue(new Error('Upload failed'));
      await act(async () => {
        await result.current.actions.handleSyncToDrive();
      });
      expect(mockUiActions.showToast).toHaveBeenCalledWith('Si è verificato un errore. Riprova.', 'error');
    });

    it('should handle handleRestoreFromDrive auth check (line 397)', async () => {
      state.ui.driveSyncState.isAuthenticated = false;
      const { result } = renderHook(() => useAppEngine());
      
      // Wait for initial load to finish
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      mockUiActions.setIsRestoring.mockClear();
      await act(async () => {
        await result.current.actions.handleRestoreFromDrive();
      });

      expect(mockUiActions.setIsRestoring).not.toHaveBeenCalled();
    });

    it('should handle handleRestoreFromDrive success and error (lines 430, 432)', async () => {
      state.ui.driveSyncState.isAuthenticated = true;
      const { downloadBackup } = await import('../../src/services/googleDriveService');
      
      const { result } = renderHook(() => useAppEngine());

      // Success
      vi.mocked(downloadBackup).mockResolvedValue({ students: [] } as any);
      await act(async () => {
        await result.current.actions.handleRestoreFromDrive();
      });
      expect(mockUiActions.showToast).toHaveBeenCalledWith('restoreSuccess', 'success');

      // Error
      vi.mocked(downloadBackup).mockRejectedValue(new Error('Download failed'));
      await act(async () => {
        await result.current.actions.handleRestoreFromDrive();
      });
      expect(mockUiActions.showToast).toHaveBeenCalledWith('restoreError', 'error');
    });

    it('should handle handleCleanDemoData (lines 488, 490)', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const { result } = renderHook(() => useAppEngine());
      
      await act(async () => {
        await result.current.actions.handleCleanDemoData();
      });

      expect(mockStudentActions.resetStudentData).toHaveBeenCalled();
      expect(mockUiActions.showToast).toHaveBeenCalledWith('Elemento eliminato.', 'success');
    });

    it('should handle handleGradeSubmission (line 527)', () => {
      const mockSubmissions = [{ id: 'sub-1', studentId: 'st-1', lessonId: 'les-1' }];
      const mockLessons = { 'les-1': { materia: 'Math', contenuto: 'Algebra' } };
      state.academic.submissions = mockSubmissions;
      state.academic.lessons = mockLessons;

      const { result } = renderHook(() => useAppEngine());
      act(() => {
        result.current.actions.handleGradeSubmission('sub-1', '10', 'Good');
      });

      expect(mockStudentActions.setEvaluations).toHaveBeenCalled();
    });

    it('should handle handleAddEvaluation (line 543)', () => {
      const { result } = renderHook(() => useAppEngine());
      act(() => {
        result.current.actions.handleAddEvaluation({ studenteId: 'st-1', voto: '10' } as any);
      });
      expect(mockStudentActions.setEvaluations).toHaveBeenCalled();
    });

    it('should handle handleCreateUda (line 549)', () => {
      const { result } = renderHook(() => useAppEngine());
      act(() => {
        result.current.actions.handleCreateUda({} as any);
      });
      expect(mockAcademicActions.setUda).toHaveBeenCalled();
    });

    it('should handle handleExportData (line 570)', async () => {
      const { result } = renderHook(() => useAppEngine());
      const spyCreateElement = vi.spyOn(document, 'createElement');
      const spyAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => ({} as any));
      const spyRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => ({} as any));
      
      await act(async () => {
        await result.current.actions.handleExportData();
      });

      expect(spyCreateElement).toHaveBeenCalledWith('a');
      spyCreateElement.mockRestore();
      spyAppendChild.mockRestore();
      spyRemoveChild.mockRestore();
    });

    it('should handle handleStartClassroom with new draft (line 716)', () => {
      state.academic.draftRegister = {};
      const { result } = renderHook(() => useAppEngine());
      
      act(() => {
        result.current.actions.handleStartClassroom('1A', 'Math', 'slot-1', { id: 'les-1' } as any);
      });

      expect(mockAcademicActions.setDraftRegister).toHaveBeenCalled();
    });

    it('should handle onMarkAttendance (line 742)', () => {
      state.academic.draftRegister = { 'slot-1': { studentAttendance: {} } };
      
      const { result } = renderHook(() => useAppEngine());
      
      act(() => {
        result.current.actions.handleNavigate('aula-session' as any, { draftKey: 'slot-1' });
      });

      act(() => {
        result.current.actions.onMarkAttendance({ studentName: 'Mario Rossi', status: 'presente' });
      });

      expect(mockAcademicActions.setDraftRegister).toHaveBeenCalled();
      expect(mockUiActions.showToast).toHaveBeenCalledWith('attendanceMarked', 'success');
    });

    it('should map navigationHistory in appStateObject (line 808)', () => {
      const historyEntry = { view: 'studenti' as any, context: { id: '123' } };
      state.ui.navigationHistory = [historyEntry];
      
      const { result } = renderHook(() => useAppEngine());
      
      expect(result.current.appState.navigationHistory).toHaveLength(1);
      expect(result.current.appState.navigationHistory[0].view).toBe('studenti');
      expect(result.current.appState.navigationHistory[0].context).toEqual({ id: '123' });
    });

    it('should handle handleAddNote (line 808)', () => {
      const { result } = renderHook(() => useAppEngine());
      act(() => {
        result.current.actions.handleAddNote({ note: 'Test note' });
        result.current.actions.handleAddNote({ note: 'Test note', studentName: 'Mario' });
      });
      expect(mockUiActions.showToast).toHaveBeenCalled();
    });

    it('should handle handleImportData with generic JSON (not a backup)', async () => {
      const { result } = renderHook(() => useAppEngine());
      const genericData = { someOtherKey: 'value' };
      const file = new File([JSON.stringify(genericData)], 'data.json', { type: 'application/json' });

      vi.mocked(ImportService.parseFile).mockResolvedValue({
        students: [{ id: '1', nome: 'Mario' }],
        evaluations: [],
        errors: []
      } as any);

      const mockReader = {
        readAsText: vi.fn(function(this: any) {
          if (this.onload) this.onload({ target: { result: JSON.stringify(genericData) } });
        }),
        onload: null as any
      };
      vi.spyOn(window, 'FileReader').mockImplementation(function(this: any) {
        return mockReader as any;
      });

      await act(async () => {
        await result.current.actions.handleImportData(file);
      });

      expect(mockStudentActions.importStudents).toHaveBeenCalled();
    });

    it('should handle handleInstallApp when prompt is dismissed', async () => {
      const mockPrompt = {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      };
      state.ui.installPrompt = mockPrompt;

      const { result } = renderHook(() => useAppEngine());
      
      await act(async () => {
        await result.current.actions.handleInstallApp();
      });

      expect(mockPrompt.prompt).toHaveBeenCalled();
    });

    it('should handle handleInstallApp when prompt is null', async () => {
      state.ui.installPrompt = null;
      const { result } = renderHook(() => useAppEngine());
      
      await act(async () => {
        await result.current.actions.handleInstallApp();
      });
      // Should not throw
    });

    it('should handle handleGradeSubmission with existing submission', async () => {
      state.academic.submissions = [{ id: 'sub-1', studentId: 's1', lessonId: 'l1' }];
      state.academic.lessons = { 'l1': { materia: 'Math', contenuto: 'Algebra' } };
      
      const { result } = renderHook(() => useAppEngine());
      
      act(() => {
        result.current.actions.handleGradeSubmission('sub-1', '8', 'Bravo');
      });
      
      expect(mockAcademicActions.setSubmissions).toHaveBeenCalled();
      expect(mockStudentActions.setEvaluations).toHaveBeenCalled();
    });

    it('should handle handleGradeSubmission with non-existent submission', async () => {
      state.academic.submissions = [{ id: 'sub-1', lessonId: 'lesson-1' }];
      const { result } = renderHook(() => useAppEngine());
      
      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(50);
      });
      
      vi.clearAllMocks();
      
      act(() => {
        result.current.actions.handleGradeSubmission('sub-2', '8', 'Feedback');
      });
      
      expect(mockStudentActions.setEvaluations).not.toHaveBeenCalled();
    });

    it('should handle handleInstallApp with invalid prompt', async () => {
      const { result } = renderHook(() => useAppEngine());
      
      state.ui.installPrompt = { prompt: 'not a function' };
      
      act(() => {
        result.current.actions.handleInstallApp();
      });
      
      expect(mockUiActions.showToast).not.toHaveBeenCalled();
    });
  });
});
