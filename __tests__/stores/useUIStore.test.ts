// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore, normalizeLegacyState } from '../../src/stores/useUIStore.ts';
import { View, Lezione } from '../../src/types';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store state (compatibilità legacy)
    useUIStore.setState(normalizeLegacyState({
      modals: {
        isOperationsCenterOpen: false,
        isImageAnalysisOpen: false,
        isLiveAssistantModalOpen: false,
        isHelpOpen: false,
        isBackupInfoModalOpen: false,
        isYearTransitionOpen: false,
        isLoadingModalOpen: false,
        isVideoAnalysisOpen: false,
        isRestoring: false,
        setCreateLessonContext: () => {},
        setLessonViewContext: () => {},
        setIsLiveAssistantModalOpen: () => {},
        setCircularAnalysisModal: () => {},
        setIsLoadingModalOpen: () => {},
        setLoadingModalMessage: () => {},
        setEditingSlotKey: () => {},
        setActiveSlotKey: () => {},
        setIsBackupInfoModalOpen: () => {},
        setSyncConflictModal: () => {},
        setIsYearTransitionOpen: () => {},
        setIsImageAnalysisOpen: () => {},
        setIsHelpOpen: () => {},
        setIsVideoAnalysisOpen: () => {},
        setIsRestoring: () => {},
        showToast: () => {},
        clearToast: () => {},
        toast: { message: '', type: 'success', visible: false },
      },
      circularAnalysisModal: null,
      syncConflictModal: null,
      createLessonContext: null,
      editingSlotKey: null,
      activeSlotKey: null,
      lessonViewContext: null,
      loadingModalMessage: '',
      toast: null,
      installPrompt: null,
      canShowInstallPrompt: false,
      isGlobalAiLoading: false,
      navigationHistory: [],
      backupState: { status: 'synced', lastBackup: null },
      driveSyncState: { isAuthenticated: false, isSyncing: false, lastSyncTime: null },
    }));
  });

  // Modal Tests
  describe('Modals', () => {
    it('dovrebbe inizializzare tutti i modali come chiusi', () => {
      const modals = useUIStore.getState().modals;
      expect(modals.isOperationsCenterOpen).toBe(false);
      expect(modals.isImageAnalysisOpen).toBe(false);
      expect(modals.isLiveAssistantModalOpen).toBe(false);
      expect(modals.isHelpOpen).toBe(false);
      expect(modals.isBackupInfoModalOpen).toBe(false);
      expect(modals.isYearTransitionOpen).toBe(false);
      expect(modals.isLoadingModalOpen).toBe(false);
      expect(modals.isVideoAnalysisOpen).toBe(false);
      expect(modals.isRestoring).toBe(false);
    });

    it('dovrebbe aprire il modal Operations Center', () => {
      useUIStore.getState().actions.toggleModal('isOperationsCenterOpen', true);
      expect(useUIStore.getState().modals.isOperationsCenterOpen).toBe(true);
    });

    it('dovrebbe chiudere il modal Operations Center', () => {
      useUIStore.getState().actions.toggleModal('isOperationsCenterOpen', true);
      useUIStore.getState().actions.toggleModal('isOperationsCenterOpen', false);
      expect(useUIStore.getState().modals.isOperationsCenterOpen).toBe(false);
    });

    it('dovrebbe toggleare il modal Image Analysis', () => {
      useUIStore.getState().actions.toggleModal('isImageAnalysisOpen');
      expect(useUIStore.getState().modals.isImageAnalysisOpen).toBe(true);
      useUIStore.getState().actions.toggleModal('isImageAnalysisOpen');
      expect(useUIStore.getState().modals.isImageAnalysisOpen).toBe(false);
    });

    it('dovrebbe sincronizzare isLoadingModalOpen tramite toggleModal', () => {
      useUIStore.getState().actions.toggleModal('isLoadingModalOpen', true);
      expect(useUIStore.getState().modals.isLoadingModalOpen).toBe(true);
      expect(useUIStore.getState().loadingModalMessage).toBe('');
    });

    it('dovrebbe sincronizzare circularAnalysisModal tramite toggleModal', () => {
      const mockData = { isOpen: true, url: 'test', title: 'test' };
      useUIStore.getState().actions.setCircularAnalysisModal(mockData);
      useUIStore.getState().actions.toggleModal('circularAnalysisModal', false);
      expect(useUIStore.getState().circularAnalysisModal).toBeNull();
    });

    it('dovrebbe aprire il modal Live Assistant', () => {
      useUIStore.getState().actions.toggleModal('isLiveAssistantModalOpen', true);
      expect(useUIStore.getState().modals.isLiveAssistantModalOpen).toBe(true);
    });

    it('dovrebbe aprire il modal Help', () => {
      useUIStore.getState().actions.toggleModal('isHelpOpen', true);
      expect(useUIStore.getState().modals.isHelpOpen).toBe(true);
    });

    it('dovrebbe gestire il modal Loading', () => {
      useUIStore.getState().actions.setLoading(true, 'Caricamento...');
      expect(useUIStore.getState().modals.isLoadingModalOpen).toBe(true);
      expect(useUIStore.getState().loadingModalMessage).toBe('Caricamento...');
    });

    it('dovrebbe chiudere il modal Loading', () => {
      useUIStore.getState().actions.setLoading(true, 'Caricamento...');
      useUIStore.getState().actions.setLoading(false);
      expect(useUIStore.getState().modals.isLoadingModalOpen).toBe(false);
    });

    it('dovrebbe impostare isRestoring flag', () => {
      useUIStore.getState().actions.setIsRestoring(true);
      expect(useUIStore.getState().modals.isRestoring).toBe(true);
      
      useUIStore.getState().actions.setIsRestoring(false);
      expect(useUIStore.getState().modals.isRestoring).toBe(false);
    });
  });

  // Circular Analysis Modal Tests
  describe('Circular Analysis Modal', () => {
    it('dovrebbe inizializzare come null', () => {
      expect(useUIStore.getState().circularAnalysisModal).toBeNull();
    });

    it('dovrebbe impostare dati circular analysis', () => {
      const data = {
        isOpen: true,
        url: 'http://example.com/circolare.pdf',
        title: 'Circolare 123',
      };

      useUIStore.getState().actions.setCircularAnalysisModal(data);
      expect(useUIStore.getState().circularAnalysisModal).toEqual(data);
      expect(useUIStore.getState().circularAnalysisModal?.isOpen).toBe(true);
    });

    it('dovrebbe permettere di chiudere circular analysis modal', () => {
      const data = {
        isOpen: true,
        url: 'http://example.com/circolare.pdf',
        title: 'Circolare 123',
      };

      useUIStore.getState().actions.setCircularAnalysisModal(data);
      useUIStore.getState().actions.setCircularAnalysisModal(null);
      expect(useUIStore.getState().circularAnalysisModal).toBeNull();
    });
  });

  // Sync Conflict Modal Tests
  describe('Sync Conflict Modal', () => {
    it('dovrebbe inizializzare come null', () => {
      expect(useUIStore.getState().syncConflictModal).toBeNull();
    });

    it('dovrebbe impostare dati sync conflict', () => {
      const conflictData = {
        fileId: 'file123',
        fileName: 'backup.json',
        localContent: '{}',
        remoteContent: '{}',
        lastModifiedLocal: new Date().toISOString(),
        lastModifiedRemote: new Date().toISOString(),
      };
      const conflict = {
        isOpen: true,
        data: conflictData,
      };
      useUIStore.getState().actions.setSyncConflictModal(conflict);
      expect(useUIStore.getState().syncConflictModal).toEqual(conflict);
    });
  });

  // Lesson Context Tests
  describe('Lesson Context', () => {
    it('dovrebbe inizializzare create lesson context come null', () => {
      expect(useUIStore.getState().createLessonContext).toBeNull();
    });

    it('dovrebbe impostare context per creare lezione', () => {
      const context = {
        isOpen: true,
        slotKey: null,
        lezione: null,
      };
      useUIStore.getState().actions.setCreateLessonContext(context);
      expect(useUIStore.getState().createLessonContext).toEqual(context);
    });

    it('dovrebbe cancellare lesson context', () => {
      const context = {
        isOpen: true,
        slotKey: null,
        lezione: null,
      };
      useUIStore.getState().actions.setCreateLessonContext(context);
      useUIStore.getState().actions.setCreateLessonContext(null);
      expect(useUIStore.getState().createLessonContext).toBeNull();
    });
  });

  // Slot Editing Tests
  describe('Slot Editing', () => {
    it('dovrebbe inizializzare editing slot key come null', () => {
      expect(useUIStore.getState().editingSlotKey).toBeNull();
    });

    it('dovrebbe impostare editing slot key', () => {
      useUIStore.getState().actions.setEditingSlotKey('slot123');
      expect(useUIStore.getState().editingSlotKey).toBe('slot123');
    });

    it('dovrebbe resettare editing slot key', () => {
      useUIStore.getState().actions.setEditingSlotKey('slot123');
      useUIStore.getState().actions.setEditingSlotKey(null);
      expect(useUIStore.getState().editingSlotKey).toBeNull();
    });

    it('dovrebbe inizializzare active slot key come null', () => {
      expect(useUIStore.getState().activeSlotKey).toBeNull();
    });

    it('dovrebbe impostare active slot key', () => {
      useUIStore.getState().actions.setActiveSlotKey('activeSlot123');
      expect(useUIStore.getState().activeSlotKey).toBe('activeSlot123');
    });
  });

  // Toast Tests
  describe('Toast Notifications', () => {
    it('dovrebbe inizializzare toast come null', () => {
      expect(useUIStore.getState().toast).toBeNull();
    });

    it('dovrebbe mostrare toast di successo', () => {
      useUIStore.getState().actions.showToast('Operazione riuscita', 'success');
      const toast = useUIStore.getState().toast;
      expect(toast?.message).toBe('Operazione riuscita');
      expect(toast?.type).toBe('success');
    });

    it('dovrebbe mostrare toast di errore', () => {
      useUIStore.getState().actions.showToast('Errore!', 'error');
      const toast = useUIStore.getState().toast;
      expect(toast?.message).toBe('Errore!');
      expect(toast?.type).toBe('error');
    });

    it('dovrebbe mostrare toast di info', () => {
      useUIStore.getState().actions.showToast('Informazione', 'info');
      const toast = useUIStore.getState().toast;
      expect(toast?.message).toBe('Informazione');
      expect(toast?.type).toBe('info');
    });

    it('dovrebbe cancellare toast', () => {
      useUIStore.getState().actions.showToast('Messaggio', 'success');
      useUIStore.getState().actions.clearToast();
      const toast = useUIStore.getState().toast;
      expect(toast).toBeNull();
    });
  });

  // Backup State Tests
  describe('Backup State', () => {
    it('dovrebbe inizializzare backup state', () => {
      const backupState = useUIStore.getState().backupState;
      expect(backupState.status).toBe('synced');
      expect(backupState.lastBackup).toBeNull();
    });

    it('dovrebbe impostare stato backup in corso', () => {
      useUIStore.getState().actions.setBackupState({ status: 'drive_pending', lastBackup: null });
      const backupState = useUIStore.getState().backupState;
      expect(backupState.status).toBe('drive_pending');
    });

    it('dovrebbe completare backup', () => {
      useUIStore.getState().actions.setBackupState({
        status: 'synced',
        lastBackup: new Date(),
      });
      const backupState = useUIStore.getState().backupState;
      expect(backupState.status).toBe('synced');
    });
  });

  // Drive Sync State Tests
  describe('Drive Sync State', () => {
    it('dovrebbe inizializzare drive sync state', () => {
      const syncState = useUIStore.getState().driveSyncState;
      expect(syncState.isSyncing).toBe(false);
      expect(syncState.lastSyncTime).toBeNull();
      expect(syncState.isAuthenticated).toBe(false);
    });

    it('dovrebbe impostare stato sync in corso', () => {
      useUIStore.getState().actions.setDriveSyncState({ isAuthenticated: false, isSyncing: true, lastSyncTime: null });
      const syncState = useUIStore.getState().driveSyncState;
      expect(syncState.isSyncing).toBe(true);
    });

    it('dovrebbe completare sync', () => {
      useUIStore.getState().actions.setDriveSyncState({
        isAuthenticated: false,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
      });
      const syncState = useUIStore.getState().driveSyncState;
      expect(syncState.isSyncing).toBe(false);
    });
  });

  // PWA & Install Tests
  describe('PWA & Install Prompt', () => {
    it('dovrebbe inizializzare installPrompt come null', () => {
      expect(useUIStore.getState().installPrompt).toBeNull();
    });

    it('dovrebbe impostare canShowInstallPrompt', () => {
      useUIStore.getState().actions.setCanShowInstallPrompt(true);
      expect(useUIStore.getState().canShowInstallPrompt).toBe(true);
    });

    it('dovrebbe impostare installPrompt', () => {
      const mockPrompt = { prompt: vi.fn() };
      useUIStore.getState().actions.setInstallPrompt(mockPrompt);
      expect(useUIStore.getState().installPrompt).toBe(mockPrompt);
    });

    it('dovrebbe disabilitare install prompt', () => {
      useUIStore.getState().actions.setCanShowInstallPrompt(true);
      useUIStore.getState().actions.setCanShowInstallPrompt(false);
      expect(useUIStore.getState().canShowInstallPrompt).toBe(false);
    });
  });

  // AI Loading State Tests
  describe('Global AI Loading State', () => {
    it('dovrebbe inizializzare isGlobalAiLoading come false', () => {
      expect(useUIStore.getState().isGlobalAiLoading).toBe(false);
    });

    it('dovrebbe impostare isGlobalAiLoading come true', () => {
      useUIStore.getState().actions.setIsGlobalAiLoading(true);
      expect(useUIStore.getState().isGlobalAiLoading).toBe(true);
    });

    it('dovrebbe resettare isGlobalAiLoading', () => {
      useUIStore.getState().actions.setIsGlobalAiLoading(true);
      useUIStore.getState().actions.setIsGlobalAiLoading(false);
      expect(useUIStore.getState().isGlobalAiLoading).toBe(false);
    });
  });

  // Navigation History Tests
  describe('Navigation History', () => {
    it('dovrebbe inizializzare navigation history come array vuoto', () => {
      expect(useUIStore.getState().navigationHistory).toEqual([]);
    });

    it('dovrebbe aggiungere entry alla navigation history', () => {
      const entry = { view: 'dashboard' as View, context: null };
      useUIStore.getState().actions.addNavigationEntry(entry);
      expect(useUIStore.getState().navigationHistory).toContainEqual(entry);
    });

    it('dovrebbe aggiungere più entries', () => {
      useUIStore.getState().actions.addNavigationEntry({ view: 'dashboard' as View, context: null });
      useUIStore.getState().actions.addNavigationEntry({ view: 'lessons' as View, context: { id: 'lez1' } });
      expect(useUIStore.getState().navigationHistory.length).toBe(2);
    });

    it('dovrebbe rimuovere ultima entry dalla navigation history', () => {
      useUIStore.getState().actions.addNavigationEntry({ view: 'dashboard' as View, context: null });
      useUIStore.getState().actions.addNavigationEntry({ view: 'lessons' as View, context: null });
      useUIStore.getState().actions.popNavigationEntry();
      expect(useUIStore.getState().navigationHistory.length).toBe(1);
    });

    it('dovrebbe azzerare navigation history', () => {
      useUIStore.getState().actions.addNavigationEntry({ view: 'dashboard' as View, context: null });
      useUIStore.getState().actions.addNavigationEntry({ view: 'lessons' as View, context: null });
      useUIStore.getState().actions.clearNavigationHistory();
      expect(useUIStore.getState().navigationHistory).toEqual([]);
    });

    it('dovrebbe impostare navigation history direttamente', () => {
      const history = [
        { view: 'dashboard' as View, context: null },
        { view: 'lessons' as View, context: { id: 'lez1' } },
      ];
      useUIStore.getState().actions.setNavigationHistory(history);
      expect(useUIStore.getState().navigationHistory).toEqual(history);
    });
  });

  // Lesson View Context Tests
  describe('Lesson View Context', () => {
    it('dovrebbe inizializzare lessonViewContext come null', () => {
      expect(useUIStore.getState().lessonViewContext).toBeNull();
    });

    it('dovrebbe impostare lesson view context', () => {
      const lesson: Lezione = {
        id: 'lez1',
        classe: 'III-A',
        materia: 'Italiano',
        contenuto: '<p>Contenuto</p>',
        svolta: false,
      };

      useUIStore.getState().actions.setLessonViewContext(lesson);
      expect(useUIStore.getState().lessonViewContext).toEqual(lesson);
    });

    it('dovrebbe cancellare lesson view context', () => {
      const lesson: Lezione = {
        id: 'lez1',
        classe: 'III-A',
        materia: 'Italiano',
        contenuto: '<p>Contenuto</p>',
        svolta: false,
      };

      useUIStore.getState().actions.setLessonViewContext(lesson);
      useUIStore.getState().actions.setLessonViewContext(null);
      expect(useUIStore.getState().lessonViewContext).toBeNull();
    });
  });

  // Video Analysis Modal Tests
  describe('Video Analysis Modal', () => {
    it('dovrebbe inizializzare isVideoAnalysisOpen come false', () => {
      expect(useUIStore.getState().modals.isVideoAnalysisOpen).toBe(false);
    });

    it('dovrebbe aprire video analysis modal', () => {
      useUIStore.getState().actions.setIsVideoAnalysisOpen(true);
      expect(useUIStore.getState().modals.isVideoAnalysisOpen).toBe(true);
    });

    it('dovrebbe chiudere video analysis modal', () => {
      useUIStore.getState().actions.setIsVideoAnalysisOpen(true);
      useUIStore.getState().actions.setIsVideoAnalysisOpen(false);
      expect(useUIStore.getState().modals.isVideoAnalysisOpen).toBe(false);
    });
  });

  describe('Functional Updaters', () => {
    it('dovrebbe impostare backupState tramite funzione', () => {
      useUIStore.getState().actions.setBackupState((prev) => ({ ...prev, status: 'error' }));
      expect(useUIStore.getState().backupState.status).toBe('error');
    });

    it('dovrebbe impostare driveSyncState tramite funzione', () => {
      useUIStore.getState().actions.setDriveSyncState((prev) => ({ ...prev, isSyncing: true }));
      expect(useUIStore.getState().driveSyncState.isSyncing).toBe(true);
    });
  });

  describe('Chaos Stage', () => {
    it('dovrebbe impostare chaos stage', () => {
      useUIStore.getState().actions.setChaosStage('chaos');
      expect(useUIStore.getState().chaosStage).toBe('chaos');
    });
  });

  describe('normalizeLegacyState', () => {
    it('dovrebbe normalizzare lo stato con toast', () => {
      const legacyState = {
        toast: { message: 'Test', type: 'success' as const, visible: true }
      };
      const normalized = normalizeLegacyState(legacyState);
      expect(normalized.modals!.toast.message).toBe('Test');
    });

    it('dovrebbe normalizzare chiavi legacy', () => {
      const legacyState = {
        loadingModalMessage: 'Caricamento...'
      };
      const normalized = normalizeLegacyState(legacyState);
      expect(normalized.modals!.loadingModalMessage).toBe('Caricamento...');
    });
  });

  describe('Legacy Getters Edge Cases', () => {
    it('dovrebbe restituire null per toast se non visibile e senza messaggio', () => {
      useUIStore.getState().actions.clearToast();
      expect(useUIStore.getState().toast).toBeNull();
    });
  });
});

