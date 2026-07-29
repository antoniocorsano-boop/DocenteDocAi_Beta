// MD3 Compliant - Settings orchestrator (sections extracted to settings/ subdir)
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { SettingsProps, View, NavigationParams } from '../types';
import { SectionHeader } from './ui';
import '../design-system/md3-utilities.css';
import { useSettingsLogic } from '../hooks/useSettingsLogic';
import { SettingsInterfaceSection } from './settings/SettingsInterface';
import { SettingsProfileSection } from './settings/SettingsProfile';
import { SettingsAISection } from './settings/SettingsAI';
import { SettingsAISuggestionsSection } from './settings/SettingsAISuggestions';
import { SettingsCloudSection } from './settings/SettingsCloud';
import { SettingsDebugSection } from './settings/SettingsDebug';
import { SettingsAdvancedSection } from './settings/SettingsAdvanced';
import SettingsIntegrationsSection from './settings/SettingsIntegrations';
import { OrbitControlPanel } from './orbit/OrbitControlPanel';
import ContextualAskAI from './ui/ContextualAskAI';

const Settings: React.FC<SettingsProps> = (props) => {
    const onNavigate = (props as Record<string, unknown>).onNavigate as ((view: View, context?: NavigationParams) => void) | undefined;
    const {
        settings, themeState, aiSettings, onSaveSettings, onSaveTheme, onSaveAiSettings,
        onExportData, onImportData, showToast, onCleanDemoData,
        onLogout, driveState, onConnectDrive, onSyncToDrive, onClose,
        dismissedSuggestions, onReactivateSuggestion,
    } = props;

    const {
        localSettings, localAiSettings, handleChange, handleAiProfileChange,
        themePrompt, setThemePrompt, isGeneratingTheme, handleGenerateThemeFromPrompt,
        setIsResetModalOpen, handleBulkAssign, toggleAssociation, updateAssignmentHours,
        handleThemeChange,
    } = useSettingsLogic({ settings, onSaveSettings, aiSettings, onSaveAiSettings, themeState, onSaveTheme, showToast, onCleanDemoData });

    const [expandedId, setExpandedId] = useState<string | null>(() => {
        try { return localStorage.getItem('settings_expanded_id') ?? 'interface_experience'; }
        catch { return 'interface_experience'; }
    });
    const handleGroupToggle = (id: string) => {
        const next = expandedId === id ? null : id;
        setExpandedId(next);
        try { localStorage.setItem('settings_expanded_id', next ?? ''); } catch { /* noop */ }
    };

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
            <Paper sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, px: 3, py: 2, borderBottom: 1, borderColor: 'var(--md-sys-color-outline-variant)', gap: 1.5 }}>
                <IconButton aria-label="Chiudi impostazioni" onClick={onClose}><Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box></IconButton>
                <SectionHeader title="Impostazioni" subtitle="Configura il tuo profilo, l'AI e le preferenze dell'app." icon="settings" />
                {onNavigate && (
                    <Box sx={{ mt: 1, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <ContextualAskAI 
                            onNavigate={onNavigate} 
                            context={{ source: 'settings' }}
                        />
                    </Box>
                )}
            </Paper>
            <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <SettingsInterfaceSection
                    expanded={expandedId === 'interface_experience'}
                    onToggle={() => handleGroupToggle('interface_experience')}
                    themeState={themeState}
                    onSaveTheme={onSaveTheme}
                    handleThemeChange={handleThemeChange}
                    themePrompt={themePrompt}
                    setThemePrompt={setThemePrompt}
                    isGeneratingTheme={isGeneratingTheme}
                    handleGenerateThemeFromPrompt={handleGenerateThemeFromPrompt}
                    showToast={showToast}
                />
                <SettingsProfileSection
                    expanded={expandedId === 'profile'}
                    onToggle={() => handleGroupToggle('profile')}
                    localSettings={localSettings}
                    handleChange={handleChange}
                />
                <SettingsAISection
                    expanded={expandedId === 'ai_didattica'}
                    onToggle={() => handleGroupToggle('ai_didattica')}
                    localSettings={localSettings}
                    localAiSettings={localAiSettings}
                    handleChange={handleChange}
                    handleAiProfileChange={handleAiProfileChange}
                    showToast={showToast}
                    toggleAssociation={toggleAssociation}
                    updateAssignmentHours={updateAssignmentHours}
                    handleBulkAssign={handleBulkAssign}
                />
                <SettingsAISuggestionsSection
                    expanded={expandedId === 'ai_suggestions'}
                    onToggle={() => handleGroupToggle('ai_suggestions')}
                    dismissedSuggestions={dismissedSuggestions}
                    onReactivateSuggestion={onReactivateSuggestion}
                    showToast={showToast}
                />
                <SettingsCloudSection
                    expanded={expandedId === 'cloud'}
                    onToggle={() => handleGroupToggle('cloud')}
                    driveState={driveState}
                    settings={settings}
                    onConnectDrive={onConnectDrive}
                    onSyncToDrive={onSyncToDrive}
                    onExportData={onExportData}
                    onImportData={onImportData}
                />
                <SettingsIntegrationsSection
                    expanded={expandedId === 'integrations'}
                    onToggle={() => handleGroupToggle('integrations')}
                    onConnectDrive={onConnectDrive}
                    onSyncToDrive={onSyncToDrive}
                    isDriveConnected={driveState.isAuthenticated}
                    driveConnectedAt={driveState.lastSyncTime ? String(driveState.lastSyncTime) : undefined}
                />
                {import.meta.env.DEV && (
                  <SettingsDebugSection
                      expanded={expandedId === 'debug_logging'}
                      onToggle={() => handleGroupToggle('debug_logging')}
                      showToast={showToast}
                  />
                )}
                <OrbitControlPanel
                    expanded={expandedId === 'orbit_control'}
                    onToggle={() => handleGroupToggle('orbit_control')}
                />
                <SettingsAdvancedSection
                    expanded={expandedId === 'advanced'}
                    onToggle={() => handleGroupToggle('advanced')}
                    localSettings={localSettings}
                    handleChange={handleChange}
                    setIsResetModalOpen={setIsResetModalOpen}
                />

                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="caption" component="div" sx={{ color: 'var(--md-sys-color-outline)' }}>
                        DocenteDoc AI v4.0.8 • Stable
                        <Box sx={{ pt: 1 }}>
                            <Typography component="span" variant="caption" sx={{ fontWeight: 'var(--md-sys-typescale-weight-black)', color: 'var(--md-sys-color-outline)' }}>Owner:</Typography> Antonio Corsano
                            <Typography variant="caption" component="div" sx={{ mt: 0.5, color: 'var(--md-sys-color-outline)' }}>antonio.corsano@gmail.com</Typography>
                        </Box>
                    </Typography>
                    <Button
                        onClick={onLogout}
                        variant="text"
                        color="error"
                        startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">logout</Box>}
                        sx={{ mt: 1, mx: 'auto', display: 'flex' }}
                    >
                        Esci dall'account
                    </Button>
                </Box>
            </Box>

        </Paper>
    );
};

export default Settings;

