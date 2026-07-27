// MD3 Compliant

import type { AppState, AppActions, Modals } from '../types';

export interface UseRestoreAssistState {
  show: boolean;
  error?: string;
  onLoadDemo: () => void;
  onRestoreFile: () => void;
  onConnectDrive: () => void;
  onClose: () => void;
}

export const useRestoreAssist = (
  appState: AppState,
  actions: AppActions,
  modals: Partial<Modals>
): UseRestoreAssistState => {
  // Heuristic: show if no studenti, no lezioni, no user, and not restoring
  const isEmpty = (!appState.students || appState.students.length === 0) &&
    (!appState.lessons || Object.keys(appState.lessons).length === 0) &&
    !appState.user &&
    !modals.isRestoring;

  // Optionally, add error detection logic here
  const error = appState.backupState?.status === 'error' ? 'Backup corrotto o non valido.' : undefined;

  return {
    show: isEmpty,
    error,
    onLoadDemo: actions.handleLoadDemoData,
    onRestoreFile: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) actions.handleImportData(file);
      };
      input.click();
    },
    onConnectDrive: actions.handleConnectDrive,
    onClose: () => window.location.reload(),
  };
};

