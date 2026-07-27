// Settings - Interface & Visual Experience Section
import React from 'react';
import { SettingsGroup } from './SettingsGroup';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import MuiTextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import ThemeBubble from '../ThemeBubble';
import { ThemeSettingsPanel } from './ThemeSettingsPanel';
import { TimetableSettings, AppThemeState } from '../../types';
import { THEME_CUSTOMIZATIONS } from '../../constants';

interface InterfaceSettingsProps {
    localSettings: TimetableSettings;
    themeState: AppThemeState;
    themePrompt: string;
    isGeneratingTheme: boolean;
    onSettingChange: (key: string, value: unknown) => void;
    onThemeChange: (key: string, value: unknown) => void;
    onSaveTheme: (theme: AppThemeState) => void;
    onGenerateTheme: () => void;
    onExportTheme: () => void;
    onImportTheme: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onForceRefresh: () => void;
    setThemePrompt: (prompt: string) => void;
}

export const InterfaceSettings: React.FC<InterfaceSettingsProps> = ({
    localSettings,
    themeState,
    themePrompt,
    isGeneratingTheme,
    onSettingChange,
    onThemeChange,
    onSaveTheme,
    onGenerateTheme,
    onExportTheme,
    onImportTheme,
    onForceRefresh,
    setThemePrompt
}) => {
    return (
        <SettingsGroup
            id="interface_experience"
            title="Interfaccia & Esperienza Visiva"
            subtitle="Personalizza l'aspetto e il comportamento dell'app"
            icon="palette"
            variant="contained"
            defaultOpen={true}
        >
            <div
                role="region"
                aria-label="Interfaccia & Esperienza Visiva"
                tabIndex={0}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-4)',
                    padding: 'var(--md-sys-spacing-4)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    background: 'var(--md-sys-color-surface-container-low)',
                    boxShadow: 'var(--md-sys-elevation-level1)'
                }}
            >
                <Typography variant="overline" sx={{
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 'var(--md-sys-typescale-weight-black)',
                    marginBottom: 'var(--md-sys-spacing-3)'
                }}>
                    Interfaccia & Esperienza Visiva
                </Typography>
                <Typography variant="caption" sx={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    marginBottom: 'var(--md-sys-spacing-4)',
                    opacity: 'var(--md-sys-state-opacity-caption)'
                }}>
                    Personalizza l'aspetto e il comportamento dell'app
                </Typography>

                {/* SEZIONE 1: MODALITÀ INTERFACCIA */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-3)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-3)'
                    }}>
                        <Box component="span" className="material-symbols-outlined" sx={{
                            fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                            color: 'var(--md-sys-color-primary)'
                        }}>dashboard_customize</Box>
                        <Typography variant="caption" sx={{color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-black)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em'}}>Modalità Interfaccia</Typography>
                    </div>
                    <Tabs
                        value={localSettings.uiMode || 'classic'}
                        onChange={(_, id) => onSettingChange('uiMode', id)}
                        aria-label="Modalità interfaccia"
                        sx={{ bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-full)', border: '1px solid var(--md-sys-color-outline-variant)', minHeight: 'auto', p: 0.5 }}
                    >
                        <Tab value="classic" label="Classica" sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2 }} />
                        <Tab value="flow" label="Dinamica (Flow)" sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2 }} />
                    </Tabs>
                    <Typography variant="body2" sx={{color: 'var(--md-sys-color-on-surface-variant)',
                        margin: 0}}>
                        {localSettings.uiMode === 'flow'
                            ? 'Modalità Flow: Interfaccia dinamica basata su flussi di lavoro e suggerimenti contestuali.'
                            : 'Modalità Classica: Layout standard con navigazione a griglia e accesso diretto ai moduli.'}
                    </Typography>
                </div>

                {/* SEZIONE 2: ECOISTEMA VISIVO */}
                <div style={{display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-4)'}}>
                    <div style={{display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-4)'}}>
                        <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            color: 'var(--md-sys-color-primary)'}}>auto_awesome</Box>
                        <Typography variant="caption" sx={{color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-black)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em'}}>Ecosistema Visivo</Typography>
                    </div>
                    <div style={{display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-sizing-grid-large), var(--md-sys-grid-fr-1)))',
                        gap: 'var(--md-sys-spacing-4)'}}>
                        {[
                            { id: 'aura', label: 'Aura', icon: 'blur_on', desc: 'Glassmorphism' },
                            { id: 'expressive', label: 'Google', icon: 'android', desc: 'Expressive' },
                            { id: 'cupertino', label: 'Cupertino', icon: 'phone_iphone', desc: 'Apple Style' },
                            { id: 'windows', label: 'Windows', icon: 'desktop_windows', desc: 'Fluent Design' },
                            { id: 'flat', label: 'Flat', icon: 'layers', desc: 'Material 3' },
                            { id: 'minimal', label: 'Minimal', icon: 'check_box_outline_blank', desc: 'Essenziale' }
                        ].map(style => (
                            <button
                                key={style.id}
                                onClick={() => onThemeChange('visualStyle', style.id)}
                                style={{display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--md-sys-spacing-4)',
                                    padding: 'var(--md-sys-spacing-4)',
                                    borderRadius: 'var(--md-sys-shape-corner-large)',
                                    border: themeState.visualStyle === style.id
                                        ? 'var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)'
                                        : 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                                    backgroundColor: themeState.visualStyle === style.id
                                        ? 'var(--md-sys-color-primary-container)'
                                        : 'var(--md-sys-color-surface-container-high)',
                                    cursor: 'pointer',
                                    transition: `all var(--md-sys-motion-duration-short1) var(--md-sys-motion-easing-standard)`,
                                    textAlign: 'center'}}
                            >
                                <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                    color: themeState.visualStyle === style.id
                                        ? 'var(--md-sys-color-on-primary-container)'
                                        : 'var(--md-sys-color-on-surface-variant)'}}>{style.icon}</Box>
                                <Typography variant="caption" sx={{color: themeState.visualStyle === style.id
                                        ? 'var(--md-sys-color-on-primary-container)'
                                        : 'var(--md-sys-color-on-surface)',
                                    fontWeight: themeState.visualStyle === style.id ? 'var(--md-sys-typescale-weight-semibold)' : 'var(--md-sys-typescale-weight-medium)',
                                    margin: 0}}>{style.label}</Typography>
                                <Typography variant="caption" sx={{color: themeState.visualStyle === style.id
                                        ? 'var(--md-sys-color-on-primary-container)'
                                        : 'var(--md-sys-color-on-surface-variant)',
                                    margin: 0,
                                    opacity: 'var(--md-sys-state-opacity-caption)'}}>{style.desc}</Typography>
                            </button>
                        ))}
                    </div>
                </div>

                {/* SEZIONE 3: TEMA E COLORI */}
                <div style={{display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-4)'}}>
                    <div style={{display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-4)'}}>
                        <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            color: 'var(--md-sys-color-primary)'}}>palette</Box>
                        <Typography variant="caption" sx={{color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-black)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em'}}>Tema & Colori</Typography>
                    </div>

                    <div style={{marginBottom: 'var(--md-sys-spacing-4)'}}>
                        <Tabs
                            value={themeState.mode}
                            onChange={(_, id) => onSaveTheme({ ...themeState, mode: id as typeof themeState.mode })}
                            aria-label="Modalità tema"
                            sx={{ bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-full)', border: '1px solid var(--md-sys-color-outline-variant)', minHeight: 'auto', p: 0.5 }}
                        >
                            <Tab value="light" label="Chiaro" sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2 }} />
                            <Tab value="dark" label="Scuro" sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2 }} />
                            <Tab value="system" label="Sistema" sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', minHeight: 'auto', py: 1, px: 2 }} />
                        </Tabs>
                    </div>

                    <div style={{display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-sizing-grid-medium), var(--md-sys-grid-fr-1)))',
                        gap: 'var(--md-sys-spacing-4)',
                        marginBottom: 'var(--md-sys-spacing-4)'}}>
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
                                onClick={() => onSaveTheme({ ...themeState, customizationName: theme.name, customColors: theme.colors })} />
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
                                onClick={() => onSaveTheme({ ...themeState, customizationName: 'Custom', customColors: themeState.generatedColors })} />
                        )}
                    </div>

                    <div style={{borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
                        paddingTop: 'var(--md-sys-spacing-4)'}}>
                        <div style={{display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-4)',
                            marginBottom: 'var(--md-sys-spacing-4)'}}>
                            <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                                color: 'var(--md-sys-color-primary)'}}>magic_button</Box>
                            <Typography variant="caption" sx={{color: 'var(--md-sys-color-primary)',
                                fontWeight: 'var(--md-sys-typescale-weight-black)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em'}}>Generatore AI</Typography>
                        </div>
                        <div style={{display: 'flex',
                            gap: 'var(--md-sys-spacing-4)',
                            alignItems: 'flex-end'}}>
                            <div style={{ flex: 1 }}>
                                <MuiTextField
                                    label="Descrivi il tuo stile"
                                    value={themePrompt}
                                    onChange={e => setThemePrompt(e.target.value)}
                                    placeholder="Es. 'Colori tramonto'..."
                                    variant="outlined"
                                    fullWidth
                                    slotProps={{ htmlInput: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">palette</Box>
                                            </InputAdornment>
                                        ),
                                    } }}
                                    sx={{ mb: 2 }} />
                            </div>
                            <Button
                                onClick={onGenerateTheme}
                                disabled={isGeneratingTheme || !themePrompt.trim()}
                                variant="contained"
                                sx={{minWidth: '0',
                                    width: 'var(--md-sys-spacing-4)',
                                    height: 'var(--md-sys-spacing-4)',
                                    padding: '0',
                                    boxShadow: 'var(--md-sys-elevation-level2)',
                                    borderRadius: 'var(--md-sys-shape-corner-large)'}}
                            >
                                <Box component="span" className="material-symbols-outlined">{isGeneratingTheme ? 'sync' : 'auto_awesome'}</Box>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* SEZIONE 4: PARAMETRI AVANZATI */}
                <div style={{marginTop: 'var(--md-sys-spacing-4)',
                    padding: 'var(--md-sys-spacing-4)',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'}}>
                    <div style={{display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-4)',
                        marginBottom: 'var(--md-sys-spacing-4)',
                        paddingBottom: 'var(--md-sys-spacing-4)',
                        borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'}}>
                        <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            color: 'var(--md-sys-color-primary)'}}>tune</Box>
                        <Typography
                            variant="caption"
                            sx={{color: 'var(--md-sys-color-primary)',
                                fontWeight: 'var(--md-sys-typescale-weight-black)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase'}}
                        >
                            Parametri Strutturali
                        </Typography>
                    </div>
                    <div style={{display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--md-sys-spacing-4)'}}>
                        <div style={{display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--md-sys-spacing-4)'}}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography
                                    variant="body2"
                                    sx={{color: 'var(--md-sys-color-on-surface)',
                                        fontWeight: 'var(--md-sys-typescale-weight-medium)'}}
                                >
                                    Intensità Blur Vetro
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{color: 'var(--md-sys-color-on-surface-variant)',
                                        fontWeight: 'var(--md-sys-typescale-weight-semibold)'}}
                                >
                                    {themeState.glassBlur || 30}px
                                </Typography>
                            </div>
                            <input
                                id="settings-glass-blur"
                                aria-label="Intensità Blur Vetro"
                                type="range" min="0" max="100" step="5"
                                value={themeState.glassBlur || 30}
                                onChange={e => onThemeChange('glassBlur', parseInt(e.target.value))}
                                style={{width: 'var(--md-sys-percent-100)'}} />
                        </div>
                        <div style={{display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--md-sys-spacing-4)'}}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography
                                    variant="body2"
                                    sx={{color: 'var(--md-sys-color-on-surface)',
                                        fontWeight: 'var(--md-sys-typescale-weight-medium)'}}
                                >
                                    Scala Font
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{color: 'var(--md-sys-color-on-surface-variant)',
                                        fontWeight: 'var(--md-sys-typescale-weight-semibold)'}}
                                >
                                    {themeState.fontScale || 1}x
                                </Typography>
                            </div>
                            <input
                                id="settings-font-scale"
                                aria-label="Scala Font"
                                type="range" min="0.8" max="1.4" step="0.1"
                                value={themeState.fontScale || 1}
                                onChange={e => onThemeChange('fontScale', parseFloat(e.target.value))}
                                style={{width: 'var(--md-sys-percent-100)'}} />
                        </div>
                        <div style={{display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--md-sys-spacing-4)'}}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography
                                    variant="body2"
                                    sx={{color: 'var(--md-sys-color-on-surface)',
                                        fontWeight: 'var(--md-sys-typescale-weight-medium)'}}
                                >
                                    Livello Contrasto
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{color: 'var(--md-sys-color-on-surface-variant)',
                                        fontWeight: 'var(--md-sys-typescale-weight-semibold)'}}
                                >
                                    {themeState.contrastLevel || 0}
                                </Typography>
                            </div>
                            <input
                                id="settings-contrast-level"
                                aria-label="Livello Contrasto"
                                type="range" min="-50" max="50" step="5"
                                value={themeState.contrastLevel || 0}
                                onChange={e => onThemeChange('contrastLevel', parseInt(e.target.value))}
                                style={{width: 'var(--md-sys-percent-100)'}} />
                        </div>
                        <div style={{display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--md-sys-spacing-4)'}}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography
                                    variant="body2"
                                    sx={{color: 'var(--md-sys-color-on-surface)',
                                        fontWeight: 'var(--md-sys-typescale-weight-medium)'}}
                                >
                                    Arrotondamento Bordi
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{color: 'var(--md-sys-color-on-surface-variant)',
                                        fontWeight: 'var(--md-sys-typescale-weight-semibold)'}}
                                >
                                    x{themeState.radiusMultiplier || 1}
                                </Typography>
                            </div>
                            <div style={{display: 'flex',
                                gap: 'var(--md-sys-spacing-4)',
                                flexWrap: 'wrap'}}>
                                {[0.5, 1, 1.5, 2].map(m => (
                                    <Button
                                        key={m}
                                        variant={themeState.radiusMultiplier === m ? 'contained' : 'outlined'}
                                        size="small"
                                        onClick={() => onThemeChange('radiusMultiplier', m)}
                                        sx={{
                                            minWidth: 'var(--md-sys-spacing-4)'
                                        }}
                                    >
                                        {m === 1 ? 'Standard' : `${m}x`}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEZIONE 5: EXPORT/IMPORT TEMA */}
                <div style={{marginTop: 'var(--md-sys-spacing-4)',
                    padding: 'var(--md-sys-spacing-4)',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)'}}>
                    <div style={{display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-4)',
                        marginBottom: 'var(--md-sys-spacing-4)'}}>
                        <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            color: 'var(--md-sys-color-primary)'}}>import_export</Box>
                        <Typography
                            variant="caption"
                            sx={{color: 'var(--md-sys-color-primary)',
                                fontWeight: 'var(--md-sys-typescale-weight-black)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase'}}
                        >
                            Backup Tema
                        </Typography>
                    </div>
                    <Typography
                        variant="body2"
                        sx={{color: 'var(--md-sys-color-on-surface-variant)',
                            marginBottom: 'var(--md-sys-spacing-4)',
                            lineHeight: 1.5}}
                    >
                        Salva o carica configurazioni di tema personalizzate per riutilizzarle in futuro.
                    </Typography>
                    <div style={{display: 'flex',
                        gap: 'var(--md-sys-spacing-4)',
                        alignItems: 'center'}}>
                        <Button
                            onClick={onExportTheme}
                            variant="outlined"
                            startIcon={<Box component="span" className="material-symbols-outlined">download</Box>}
                        >
                            ESPORTA TEMA
                        </Button>
                        <div style={{
                            position: 'relative'
                        }}>
                            <input
                                type="file"
                                accept=".json"
                                onChange={onImportTheme}
                                style={{
                                    position: 'absolute',
                                    opacity: 0,
                                    width: 0,
                                    height: 0,
                                    overflow: 'hidden'
                                }}
                                id="theme-import" />
                            <label htmlFor="theme-import" style={{
                                cursor: 'pointer'
                            }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Box component="span" className="material-symbols-outlined">upload</Box>}
                                >
                                    IMPORTA TEMA
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>

                {/* SEZIONE 6: MANUTENZIONE BRAND */}
                <div style={{display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-4)'}}>
                    <div style={{display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-4)'}}>
                        <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            color: 'var(--md-sys-color-primary)'}}>refresh</Box>
                        <Typography variant="caption" sx={{color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-black)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em'}}>Manutenzione Brand</Typography>
                    </div>
                    <Typography variant="body2" sx={{color: 'var(--md-sys-color-on-surface-variant)',
                        margin: 0}}>Se visualizzi ancora il vecchio logo o nomi non corretti, forza il ricaricamento della cache.</Typography>
                    <Button
                        onClick={onForceRefresh}
                        variant="outlined"
                        startIcon={<Box component="span" className="material-symbols-outlined">cached</Box>}
                    >
                        AGGIORNA BRAND E CACHE
                    </Button>
                </div>

                {/* SEZIONE 7: M3 THEME SETTINGS PANEL */}
                <div style={{display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-4)'}}>
                    <div style={{display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--md-sys-spacing-4)'}}>
                        <Box component="span" className="material-symbols-outlined" sx={{fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                            color: 'var(--md-sys-color-primary)'}}>tune</Box>
                        <Typography variant="caption" sx={{color: 'var(--md-sys-color-primary)',
                            fontWeight: 'var(--md-sys-typescale-weight-black)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em'}}>M3 Theme Panel</Typography>
                    </div>
                    <Typography variant="body2" sx={{color: 'var(--md-sys-color-on-surface-variant)',
                        margin: 0}}>Personalizza i token M3 per colori, tipografia, spacing e motion con anteprima live.</Typography>
                    <ThemeSettingsPanel />
                </div>
            </div>
        </SettingsGroup>
    );
};

export default InterfaceSettings;
