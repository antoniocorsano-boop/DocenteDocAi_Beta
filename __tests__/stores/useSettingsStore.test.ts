// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { DEFAULT_TIMETABLE_SETTINGS } from '../../src/constants';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().actions.reset();
  });

  it('dovrebbe avere i valori predefiniti', () => {
    const state = useSettingsStore.getState();
    expect(state.settings).toEqual(DEFAULT_TIMETABLE_SETTINGS);
    expect(state.aiSettings.model).toBe('gemini-3-flash-preview');
    expect(state.themeState.mode).toBe('light');
  });

  it('dovrebbe aggiornare le impostazioni', () => {
    const { updateSettings } = useSettingsStore.getState().actions;
    updateSettings({ nomeIstituto: 'Test School' });
    expect(useSettingsStore.getState().settings.nomeIstituto).toBe('Test School');
  });

  it('dovrebbe impostare le impostazioni tramite funzione', () => {
    const { setSettings } = useSettingsStore.getState().actions;
    setSettings((prev) => ({ ...prev, nomeIstituto: 'Function School' }));
    expect(useSettingsStore.getState().settings.nomeIstituto).toBe('Function School');
  });

  it('dovrebbe impostare le impostazioni AI', () => {
    const { setAiSettings } = useSettingsStore.getState().actions;
    setAiSettings({ model: 'gemini-pro' });
    expect(useSettingsStore.getState().aiSettings.model).toBe('gemini-pro');
  });

  it('dovrebbe impostare le impostazioni AI tramite funzione', () => {
    const { setAiSettings } = useSettingsStore.getState().actions;
    setAiSettings((prev) => ({ ...prev, model: 'gemini-ultra' }));
    expect(useSettingsStore.getState().aiSettings.model).toBe('gemini-ultra');
  });

  it('dovrebbe impostare lo stato del tema', () => {
    const { setThemeState } = useSettingsStore.getState().actions;
    setThemeState({ mode: 'dark', visualStyle: 'aura', customizationName: 'M3 Default', glassBlur: 30, radiusMultiplier: 1 });
    expect(useSettingsStore.getState().themeState.mode).toBe('dark');
  });

  it('dovrebbe impostare lo stato del tema tramite funzione', () => {
    const { setThemeState } = useSettingsStore.getState().actions;
    setThemeState((prev) => ({ ...prev, mode: 'light' }));
    expect(useSettingsStore.getState().themeState.mode).toBe('light');
  });

  it('dovrebbe caricare dal backup', () => {
    const { loadFromBackup } = useSettingsStore.getState().actions;
    const backupData = {
      settings: { ...DEFAULT_TIMETABLE_SETTINGS, nomeIstituto: 'Backup School' },
      aiSettings: { model: 'backup-model' },
    };
    loadFromBackup(backupData);
    expect(useSettingsStore.getState().settings.nomeIstituto).toBe('Backup School');
    expect(useSettingsStore.getState().aiSettings.model).toBe('backup-model');
  });

  it('dovrebbe resettare lo stato', () => {
    const { updateSettings, reset } = useSettingsStore.getState().actions;
    updateSettings({ nomeIstituto: 'Modified' });
    reset();
    expect(useSettingsStore.getState().settings.nomeIstituto).toBe(DEFAULT_TIMETABLE_SETTINGS.nomeIstituto);
  });
});

