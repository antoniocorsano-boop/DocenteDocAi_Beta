import React, { useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Slider from '@mui/material/Slider';
import InputAdornment from '@mui/material/InputAdornment';
import SettingsGroup from './SettingsGroupAccordion';
import { TextField, M3ConfirmDialog } from '../ui';
import ThemeBubble from '../ThemeBubble';
import { AppThemeState } from '../../types';
import { THEME_CUSTOMIZATIONS } from '../../constants';
import { logger } from '../../utils/logger';

interface SettingsInterfaceSectionProps {
    expanded: boolean;
    onToggle: () => void;
    themeState: AppThemeState;
    onSaveTheme: (theme: AppThemeState) => void;
    handleThemeChange: (partial: Partial<AppThemeState>) => void;
    themePrompt: string;
    setThemePrompt: (p: string) => void;
    isGeneratingTheme: boolean;
    handleGenerateThemeFromPrompt: () => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsInterfaceSection: React.FC<SettingsInterfaceSectionProps> = ({
    expanded, onToggle, themeState, onSaveTheme, handleThemeChange,
    themePrompt, setThemePrompt, isGeneratingTheme, handleGenerateThemeFromPrompt, showToast
}) => {
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void | Promise<void> } | null>(null);
    const handleExportTheme = () => {
        try {
            const themeData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                themeState,
                description: `Tema "${themeState.customizationName}" esportato da DocenteDoc AI`
            };
            const dataStr = JSON.stringify(themeData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tema-${themeState.customizationName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('Tema esportato con successo!', 'success');
        } catch (error) {
            logger.error('Errore durante l\'esportazione del tema:', error);
            showToast('Errore durante l\'esportazione del tema', 'error');
        }
    };

    const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const themeData = JSON.parse(content);
                if (!themeData.themeState) throw new Error('File non valido: manca themeState');
                const requiredFields = ['mode', 'visualStyle', 'customizationName'];
                const missingFields = requiredFields.filter(field => !(field in themeData.themeState));
                if (missingFields.length > 0) throw new Error(`File non valido: mancano i campi ${missingFields.join(', ')}`);
                onSaveTheme(themeData.themeState);
                showToast(`Tema "${themeData.themeState.customizationName}" importato con successo!`, 'success');
            } catch (error) {
                logger.error('Errore durante l\'importazione del tema:', error);
                showToast(`Errore durante l'importazione: ${error instanceof Error ? error.message : 'File non valido'}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleForceRefresh = async () => {
        setConfirmDialog({
            message: "Forzare l'aggiornamento del brand? L'app verrà ricaricata per pulire i vecchi file temporanei. I tuoi dati sono al sicuro.",
            onConfirm: async () => {
                try {
                    if ('serviceWorker' in navigator) {
                        const regs = await navigator.serviceWorker.getRegistrations();
                        for (const reg of regs) await reg.unregister();
                    }
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        for (const key of keys) await caches.delete(key);
                    }
                    window.location.reload();
                } catch { window.location.reload(); }
            }
        });
    };

    return (
        <SettingsGroup
            id="interface_experience"
            title="Interfaccia & Esperienza Visiva"
            subtitle="Personalizza l'aspetto e il comportamento dell'app"
            icon="palette"
            variant="primary"
            expanded={expanded}
            onToggle={onToggle}
        >
            <Stack spacing={2}>
                {/* SEZIONE 1: MODALITÀ INTERFACCIA */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="column" spacing={1.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>dashboard_customize</Box>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Modalità Interfaccia</Typography>
                        </Stack>
                        <Tabs
                            value={themeState.uiMode || 'classic'}
                            onChange={(_, v: string) => handleThemeChange({ uiMode: v as 'classic' | 'flow' })}
                            indicatorColor="primary"
                            textColor="primary"
                            aria-label="Modalità interfaccia"
                            sx={{ bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-full)', border: '1px solid var(--md-sys-color-outline-variant)', minHeight: 'auto', p: 0.5 }}
                        >
                            {[
                                { id: 'classic', label: 'Classica', icon: 'grid_view' },
                                { id: 'flow', label: 'Dinamica (Flow)', icon: 'account_tree' }
                            ].map(tab => (
                                <Tab
                                    key={tab.id}
                                    value={tab.id}
                                    id={`tab-${tab.id}`}
                                    aria-controls={`panel-${tab.id}`}
                                    data-testid={`tab-${tab.id}`}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>
                                            {tab.label}
                                        </Box>
                                    }
                                    sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2, textTransform: 'uppercase', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                                />
                            ))}
                        </Tabs>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                            {themeState.uiMode === 'flow'
                                ? 'Modalità Flow: Interfaccia dinamica basata su flussi di lavoro e suggerimenti contestuali.'
                                : 'Modalità Classica: Layout standard con navigazione a griglia e accesso diretto ai moduli.'}
                        </Typography>
                    </Stack>
                </Box>

                {/* SEZIONE 2: ECOSISTEMA VISIVO */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="column" spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>auto_awesome</Box>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Ecosistema Visivo</Typography>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, var(--md-sys-grid-fr-1)))', gap: 2 }}>
                            {[
                                { id: 'aura', label: 'Aura', icon: 'blur_on', desc: 'Glassmorphism' },
                                { id: 'expressive', label: 'Google', icon: 'android', desc: 'Expressive' },
                                { id: 'cupertino', label: 'Cupertino', icon: 'phone_iphone', desc: 'Apple Style' },
                                { id: 'windows', label: 'Windows', icon: 'desktop_windows', desc: 'Fluent Design' },
                                { id: 'flat', label: 'Flat', icon: 'layers', desc: 'Material 3' },
                                { id: 'minimal', label: 'Minimal', icon: 'check_box_outline_blank', desc: 'Essenziale' }
                            ].map(vstyle => {
                                const isSelected = themeState.visualStyle === vstyle.id;
                                return (
                                    <Paper
                                        key={vstyle.id}
                                        component="button"
                                        elevation={isSelected ? 2 : 1}
                                        onClick={() => handleThemeChange({ visualStyle: vstyle.id as AppThemeState['visualStyle'] })}
                                        aria-pressed={isSelected}
                                        aria-label={`Stile visivo: ${vstyle.label}`}
                                        sx={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-2)',
                                            padding: 'var(--md-sys-spacing-4)',
                                            border: isSelected ? 'var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)' : 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                            backgroundColor: isSelected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                                            cursor: 'pointer',
                                            transition: `all var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)`,
                                            textAlign: 'center',
                                            width: 'var(--md-sys-percent-100)',
                                        }}
                                    >
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)' }}>{vstyle.icon}</Box>
                                        <Typography variant="caption" sx={{ color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)', margin: 0 }}>{vstyle.label}</Typography>
                                        <Typography variant="caption" sx={{ color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>{vstyle.desc}</Typography>
                                    </Paper>
                                );
                            })}
                        </Box>
                    </Stack>
                </Box>

                {/* SEZIONE 3: TEMA E COLORI */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="column" spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>palette</Box>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Tema & Colori</Typography>
                        </Stack>
                        <Box sx={{ mb: 2 }}>
                            <Tabs
                                value={themeState.mode}
                                onChange={(_, v: string) => onSaveTheme({ ...themeState, mode: v as typeof themeState.mode })}
                                indicatorColor="primary"
                                textColor="primary"
                                aria-label="Tema colore"
                                sx={{ bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-full)', border: '1px solid var(--md-sys-color-outline-variant)', minHeight: 'auto', p: 0.5 }}
                            >
                                {[
                                    { id: 'light', label: 'Chiaro', icon: 'light_mode' },
                                    { id: 'dark', label: 'Scuro', icon: 'dark_mode' },
                                    { id: 'system', label: 'Sistema', icon: 'brightness_auto' }
                                ].map(tab => (
                                    <Tab
                                        key={tab.id}
                                        value={tab.id}
                                        id={`tab-${tab.id}`}
                                        aria-controls={`panel-${tab.id}`}
                                        data-testid={`tab-${tab.id}`}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>
                                                {tab.label}
                                            </Box>
                                        }
                                        sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2, textTransform: 'uppercase', fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                                    />
                                ))}
                            </Tabs>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, var(--md-sys-grid-fr-1)))', gap: 2, mb: 2 }}>
                            {THEME_CUSTOMIZATIONS.map(theme => (
                                <ThemeBubble
                                    key={theme.name}
                                    name={theme.name}
                                    colors={{
                                        primary: theme.colors.primary ?? 'var(--md-sys-color-primary)',
                                        secondary: theme.colors.secondary ?? 'var(--md-sys-color-secondary)',
                                        tertiary: theme.colors.tertiary ?? 'var(--md-sys-color-tertiary)'
                                    }}
                                    isSelected={themeState.customizationName === theme.name}
                                    onClick={() => onSaveTheme({ ...themeState, customizationName: theme.name, customColors: theme.colors })}
                                />
                            ))}
                            {themeState.generatedColors && (
                                <ThemeBubble
                                    key="ai-generated"
                                    name={themeState.generatedName || 'AI Custom'}
                                    colors={{
                                        primary: themeState.generatedColors.primary ?? 'var(--md-sys-color-primary)',
                                        secondary: themeState.generatedColors.secondary ?? 'var(--md-sys-color-secondary)',
                                        tertiary: themeState.generatedColors.tertiary ?? 'var(--md-sys-color-tertiary)',
                                    }}
                                    isSelected={themeState.customizationName === 'Custom'}
                                    onClick={() => onSaveTheme({ ...themeState, customizationName: 'Custom', customColors: themeState.generatedColors })}
                                />
                            )}
                        </Box>
                        <Box sx={{ borderTop: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)', pt: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>magic_button</Box>
                                <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Generatore AI</Typography>
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="flex-end">
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        label="Descrivi il tuo stile"
                                        value={themePrompt}
                                        onChange={e => setThemePrompt(e.target.value)}
                                        placeholder="Es. 'Colori tramonto'..."
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Box component="span" className="material-symbols-outlined" aria-hidden="true">palette</Box></InputAdornment> } }}
                                    />
                                </Box>
                                <IconButton
                                    onClick={handleGenerateThemeFromPrompt}
                                    disabled={isGeneratingTheme || !themePrompt.trim()}
                                    aria-label="Genera tema AI"
                                    sx={{ bgcolor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', borderRadius: 2, '&:hover': { bgcolor: 'color-mix(in srgb, var(--md-sys-color-primary) 85%, black)' }, '&.Mui-disabled': { bgcolor: 'var(--md-sys-color-surface-container-high)' } }}
                                >
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">{isGeneratingTheme ? 'sync' : 'auto_awesome'}</Box>
                                </IconButton>
                            </Stack>
                        </Box>
                    </Stack>
                </Box>

                {/* SEZIONE 4: PARAMETRI STRUTTURALI */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>tune</Box>
                        <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Parametri Strutturali</Typography>
                    </Stack>
                    <Stack spacing={2}>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography id="label-glass-blur" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Intensità Blur Vetro</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>{themeState.glassBlur || 30}px</Typography>
                            </Stack>
                            <Slider id="range-glass-blur" aria-labelledby="label-glass-blur" min={0} max={100} step={5} value={themeState.glassBlur || 30} onChange={(_e, v) => handleThemeChange({ glassBlur: v as number })} sx={{ width: '100%' }} />
                        </Stack>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography id="label-font-scale" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Scala Font</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>{themeState.fontScale || 1}x</Typography>
                            </Stack>
                            <Slider id="range-font-scale" aria-labelledby="label-font-scale" min={0.8} max={1.4} step={0.1} value={themeState.fontScale || 1} onChange={(_e, v) => handleThemeChange({ fontScale: v as number })} sx={{ width: '100%' }} />
                        </Stack>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography id="label-contrast-level" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Livello Contrasto</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>{themeState.contrastLevel || 0}</Typography>
                            </Stack>
                            <Slider id="range-contrast-level" aria-labelledby="label-contrast-level" min={-50} max={50} step={5} value={themeState.contrastLevel || 0} onChange={(_e, v) => handleThemeChange({ contrastLevel: v as number })} sx={{ width: '100%' }} />
                        </Stack>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>Arrotondamento Bordi</Typography>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>x{themeState.radiusMultiplier || 1}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {[0.5, 1, 1.5, 2].map(m => (
                                    <Button key={m} variant={themeState.radiusMultiplier === m ? 'contained' : 'outlined'} size="small" onClick={() => handleThemeChange({ radiusMultiplier: m })}>
                                        {m === 1 ? 'Standard' : `${m}x`}
                                    </Button>
                                ))}
                            </Stack>
                        </Stack>
                    </Stack>
                </Box>

                {/* SEZIONE 5: EXPORT/IMPORT TEMA */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>import_export</Box>
                        <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Backup Tema</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 2 }}>Salva o carica configurazioni di tema personalizzate per riutilizzarle in futuro.</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button onClick={handleExportTheme} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>}>ESPORTA TEMA</Button>
                        <Box sx={{ position: 'relative' }}>
                            <input type="file" accept=".json" onChange={handleImportTheme} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, overflow: 'hidden' }} id="theme-import" />
                            <label htmlFor="theme-import" style={{ cursor: 'pointer' }}>
                                <Button variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">upload</Box>} component="span">IMPORTA TEMA</Button>
                            </label>
                        </Box>
                    </Stack>
                </Box>

                {/* SEZIONE 6: MANUTENZIONE BRAND */}
                <Box sx={{ p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-primary)' }}>refresh</Box>
                            <Typography variant="overline" sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)', lineHeight: 1.5 }}>Manutenzione Brand</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Se visualizzi ancora il vecchio logo o nomi non corretti, forza il ricaricamento della cache.</Typography>
                        <Button onClick={handleForceRefresh} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">cached</Box>}>AGGIORNA BRAND E CACHE</Button>
                    </Stack>
                </Box>
            </Stack>
            {confirmDialog && (
                <M3ConfirmDialog
                    title="Conferma aggiornamento"
                    message={confirmDialog.message}
                    onConfirm={() => { void confirmDialog.onConfirm(); setConfirmDialog(null); }}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
        </SettingsGroup>
    );
};

export default SettingsInterfaceSection;
