
import { create } from 'zustand';
import type { Modals, Lezione, SyncConflictData, View } from '../types';

// ============================================================================
// TYPES
// ============================================================================

// Define PWA install prompt event type
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Define backup and sync state types
interface BackupState {
  status: 'synced' | 'drive_pending' | 'error';
  lastBackup: Date | null;
}

interface DriveSyncState {
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncTime: string | Date | null;
  error?: string;
}

// UI State interface - defines the shape of the store state
export interface UIState {
  modals: Modals & {
    toast: { message: string; type: 'success' | 'error' | 'info'; visible: boolean };
  };
  chaosStage: 'none' | 'chaos' | 'implosion' | 'peace' | 'settled';
  circularAnalysisModal: { isOpen: boolean; url: string; title: string } | null;
  syncConflictModal: { isOpen: boolean; data: SyncConflictData | null } | null;
  createLessonContext: { isOpen: boolean; slotKey: string | null; lezione: Lezione | null } | null;
  editingSlotKey: string | null;
  activeSlotKey: string | null;
  lessonViewContext: Lezione | null;
  loadingModalMessage: string;
  toast: { message: string; type: 'success' | 'error' | 'info'; visible: boolean } | null;
  installPrompt: BeforeInstallPromptEvent | null;
  canShowInstallPrompt: boolean;
  isGlobalAiLoading: boolean;
  navigationHistory: { view: View; context: unknown }[];
  backupState: BackupState;
  driveSyncState: DriveSyncState;
}

// UI Actions interface - defines all available actions
export interface UIActions {
  toggleModal: (modalKey: keyof Modals, value?: boolean) => void;
  setLoading: (isOpen: boolean, message?: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setCanShowInstallPrompt: (can: boolean) => void;
  setIsGlobalAiLoading: (loading: boolean) => void;
  setNavigationHistory: (history: { view: View; context: unknown }[]) => void;
  addNavigationEntry: (entry: { view: View; context: unknown }) => void;
  popNavigationEntry: () => void;
  clearNavigationHistory: () => void;
  setBackupState: (
    stateOrFn: BackupState | ((prev: BackupState) => BackupState)
  ) => void;
  setDriveSyncState: (
    stateOrFn: DriveSyncState | ((prev: DriveSyncState) => DriveSyncState)
  ) => void;
  setIsRestoring: (value: boolean) => void;
  setCircularAnalysisModal: (modal: { isOpen: boolean; url: string; title: string } | null) => void;
  setSyncConflictModal: (modal: { isOpen: boolean; data: SyncConflictData | null } | null) => void;
  setCreateLessonContext: (context: { isOpen: boolean; slotKey: string | null; lezione: Lezione | null } | null) => void;
  setEditingSlotKey: (key: string | null) => void;
  setActiveSlotKey: (key: string | null) => void;
  setLessonViewContext: (lesson: Lezione | null) => void;
  setIsVideoAnalysisOpen: (value: boolean) => void;
  setChaosStage: (stage: 'none' | 'chaos' | 'implosion' | 'peace' | 'settled') => void;
}

// Complete store type - combines state and actions
export type UIStore = UIState & { actions: UIActions };

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

// Initial modals state with proper typing
const initialModals: Modals & { toast: { message: string; type: 'success' | 'error' | 'info'; visible: boolean } } = {
  isOperationsCenterOpen: false,
  isImageAnalysisOpen: false,
  isLiveAssistantModalOpen: false,
  isHelpOpen: false,
  isBackupInfoModalOpen: false,
  isRegisterImportOpen: false,
  isYearTransitionOpen: false,
  isLoadingModalOpen: false,
  isVideoAnalysisOpen: false,
  isRestoring: false,
  isNkaMapOpen: false,
  circularAnalysisModal: null,
  syncConflictModal: null,
  createLessonContext: null,
  editingSlotKey: null,
  activeSlotKey: null,
  lessonViewContext: null,
  loadingModalMessage: '',
  toast: { message: '', type: 'info', visible: false },
  // Modal setter functions (required by Modals interface)
  setCreateLessonContext: () => {},
  setLessonViewContext: () => {},
  setIsLiveAssistantModalOpen: () => {},
  setIsOperationsCenterOpen: () => {},
  setIsImageAnalysisOpen: () => {},
  setIsHelpOpen: () => {},
  setCircularAnalysisModal: () => {},
  setIsLoadingModalOpen: () => {},
  setLoadingModalMessage: () => {},
  setEditingSlotKey: () => {},
  setActiveSlotKey: () => {},
  setIsBackupInfoModalOpen: () => {},
  setIsRegisterImportOpen: () => {},
  setSyncConflictModal: () => {},
  setIsYearTransitionOpen: () => {},
  setIsVideoAnalysisOpen: () => {},
  setIsRestoring: () => {},
  setIsNkaMapOpen: () => {},
  setNotifiche: () => {},
};

// Create the Zustand store with proper typing
export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  modals: { ...initialModals },
  chaosStage: 'none',
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
  driveSyncState: { isAuthenticated: false, isSyncing: false, lastSyncTime: null, error: undefined },

  // Actions
  actions: {
    toggleModal: (modalKey: keyof Modals, value?: boolean) => set((state) => {
      const newValue = typeof value === 'boolean' ? value : !state.modals[modalKey];
      const nextModals = { ...state.modals, [modalKey]: newValue };
      const nextState: Partial<UIState> = { modals: nextModals };

      // Sync mirrored keys if they are in Modals
      if (modalKey === 'isLoadingModalOpen') nextState.loadingModalMessage = state.loadingModalMessage;
      if (modalKey === 'circularAnalysisModal') nextState.circularAnalysisModal = newValue ? state.modals.circularAnalysisModal : null;

      return nextState;
    }),

    setLoading: (isOpen: boolean, message?: string) => set((state) => {
      const msg = message ?? state.loadingModalMessage;
      return {
        modals: { ...state.modals, isLoadingModalOpen: isOpen, loadingModalMessage: msg },
        loadingModalMessage: msg
      };
    }),

    showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const toast = { message, type, visible: true };
      set((state) => ({
        modals: { ...state.modals, toast },
        toast
      }));
    },

    clearToast: () => set((state) => ({
      modals: { ...state.modals, toast: { ...state.modals.toast, visible: false } },
      toast: null
    })),

    setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => set(() => ({ installPrompt: prompt })),

    setCanShowInstallPrompt: (can: boolean) => set(() => ({ canShowInstallPrompt: can })),

    setIsGlobalAiLoading: (loading: boolean) => set(() => ({ isGlobalAiLoading: loading })),

    setNavigationHistory: (history: { view: View; context: unknown }[]) => set(() => ({ navigationHistory: history })),

    addNavigationEntry: (entry: { view: View; context: unknown }) => set((state) => ({
      navigationHistory: [...state.navigationHistory, entry]
    })),

    popNavigationEntry: () => set((state) => ({
      navigationHistory: state.navigationHistory.slice(0, -1)
    })),

    clearNavigationHistory: () => set(() => ({ navigationHistory: [] })),

    setBackupState: (stateOrFn) => set((state) => ({
      backupState: typeof stateOrFn === 'function' ? stateOrFn(state.backupState) : { ...state.backupState, ...stateOrFn }
    })),

    setDriveSyncState: (stateOrFn) => set((state) => ({
      driveSyncState: typeof stateOrFn === 'function' ? stateOrFn(state.driveSyncState) : { ...state.driveSyncState, ...stateOrFn }
    })),

    setIsRestoring: (value: boolean) => set((state) => ({
      modals: { ...state.modals, isRestoring: value }
    })),

    setCircularAnalysisModal: (modal) => set((state) => ({
      modals: { ...state.modals, circularAnalysisModal: modal },
      circularAnalysisModal: modal
    })),

    setSyncConflictModal: (modal) => set((state) => ({
      modals: { ...state.modals, syncConflictModal: modal },
      syncConflictModal: modal
    })),

    setCreateLessonContext: (context) => set((state) => ({
      modals: { ...state.modals, createLessonContext: context },
      createLessonContext: context
    })),

    setEditingSlotKey: (key) => set((state) => ({
      modals: { ...state.modals, editingSlotKey: key },
      editingSlotKey: key
    })),

    setActiveSlotKey: (key) => set((state) => ({
      modals: { ...state.modals, activeSlotKey: key },
      activeSlotKey: key
    })),

    setLessonViewContext: (lesson) => set((state) => ({
      modals: { ...state.modals, lessonViewContext: lesson },
      lessonViewContext: lesson
    })),

    setIsVideoAnalysisOpen: (value: boolean) => set((state) => ({
      modals: { ...state.modals, isVideoAnalysisOpen: value }
    })),

    setChaosStage: (stage) => set(() => ({ chaosStage: stage })),
  }
}));
const legacyKeys = [
    'circularAnalysisModal',
    'syncConflictModal',
    'createLessonContext',
    'editingSlotKey',
    'activeSlotKey',
    'lessonViewContext',
    'loadingModalMessage'
];
// Getter legacy per compatibilità test (proxy su stato centralizzato modals)
// Funzione di normalizzazione per compat test: copia i campi legacy root in modals
export function normalizeLegacyState(state: Partial<UIState>): Partial<UIState> {
    if (!state.modals) state.modals = {} as UIState['modals'];
    legacyKeys.forEach((key) => {
        if (key in state) {
            (state.modals as unknown as Record<string, unknown>)[key] = (state as unknown as Record<string, unknown>)[key];
        }
    });
    if ('toast' in state) {
        (state.modals as unknown as Record<string, unknown>).toast = (state as unknown as Record<string, unknown>).toast;
    }
    return state;
}

