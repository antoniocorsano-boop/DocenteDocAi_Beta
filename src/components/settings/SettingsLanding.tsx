/**
 * settings/SettingsLanding.tsx — Settings Hub intelligente di Orbit Jarvis.
 *
 * Fullscreen overlay con:
 *   - Sidebar 280px (desktop) / chip bar (mobile) — categorie con badge badge Jarvis
 *   - Banner Jarvis — hint proattivo per la categoria corrente
 *   - Strisce preset (Jarvis suggerisce il preset contestuale)
 *   - Pannello contenuto — sezioni Settings esistenti riusate (expanded=true)
 *   - Shortcuts tastiera: Esc→close, Alt+1-6→categoria, /→focus search
 *
 * Props autonome: legge tutto dagli store, non ha prop drilling.
 * MD3 compliant: M3Surface, niente <div> per container visivi, token MD3.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Chip,
  InputBase,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
  Fade,
  Alert,
  AlertTitle,
} from '@mui/material';
import CloseIcon          from '@mui/icons-material/Close';
import SearchIcon         from '@mui/icons-material/Search';
import AutoAwesomeIcon    from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';

import M3Surface from '../ui/M3Surface';

import { SettingsInterfaceSection }    from './SettingsInterface';
import { SettingsProfileSection }      from './SettingsProfile';
import { SettingsAISection }           from './SettingsAI';
import { SettingsAISuggestionsSection } from './SettingsAISuggestions';
import { SettingsCloudSection }         from './SettingsCloud';
import { SettingsDebugSection }         from './SettingsDebug';
import { SettingsAdvancedSection }      from './SettingsAdvanced';
import SettingsIntegrationsSection      from './SettingsIntegrations';
import SettingsSkillsPanel              from './SettingsSkillsPanel';
import { PrivacyPolicyPanel }           from './PrivacyPolicyPanel';

import { useSettingsLogic }      from '../../hooks/useSettingsLogic';
import { useJarvisSettings }     from '../../hooks/useJarvisSettings';
import { useNotificationEngine } from '../../hooks/useNotificationEngine';

import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUIStore }       from '../../stores/useUIStore';
import { useSystemStore }   from '../../stores/useSystemStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsLandingProps {
  onClose:           () => void;
  tenantId?:         string;
  initialCategory?:  string;
}

type CategoryId = 'generali' | 'interfaccia' | 'ai' | 'skills' | 'integrazioni' | 'avanzate' | 'privacy';

interface Category {
  id:       CategoryId;
  label:    string;
  icon:     string;
  shortcut: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: 'generali',     label: 'Generali',     icon: 'tune',             shortcut: 'Alt+1' },
  { id: 'interfaccia',  label: 'Interfaccia',  icon: 'palette',          shortcut: 'Alt+2' },
  { id: 'ai',           label: 'AI & Jarvis',  icon: 'auto_awesome',     shortcut: 'Alt+3' },
  { id: 'skills',       label: 'Skills',       icon: 'extension',        shortcut: 'Alt+4' },
  { id: 'integrazioni', label: 'Integrazioni', icon: 'cloud_sync',       shortcut: 'Alt+5' },
  { id: 'avanzate',     label: 'Avanzate',     icon: 'developer_mode',   shortcut: 'Alt+6' },
  { id: 'privacy',      label: 'Privacy & Sicurezza', icon: 'lock',          shortcut: 'Alt+7' },
];

// ─── SettingsLanding ─────────────────────────────────────────────────────────

export default function SettingsLanding({
  onClose,
  tenantId = 'default',
  initialCategory = 'generali',
}: SettingsLandingProps): React.JSX.Element {
  const theme   = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // ── Store reads ─────────────────────────────────────────────────────────────
  const settings   = useSettingsStore(s => s.settings);
  const themeState = useSettingsStore(s => s.themeState);
  const aiSettings = useSettingsStore(s => s.aiSettings);
  const storeActions = useSettingsStore(s => s.actions);

  const driveSyncState        = useUIStore(s => s.driveSyncState);
  const dismissedSuggestions  = useSystemStore(s => s.dismissedSuggestions);
  const reactivateSuggestion  = useSystemStore(s => s.actions.reactivateSuggestion);

  const { showToast } = useNotificationEngine();

  // ── Local state ─────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<CategoryId>(
    initialCategory as CategoryId,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [presetApplied, setPresetApplied] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Settings logic (sections control) ───────────────────────────────────────
  const settingsLogic = useSettingsLogic({
    settings,
    onSaveSettings: storeActions.setSettings,
    aiSettings,
    onSaveAiSettings: storeActions.setAiSettings,
    themeState,
    onSaveTheme: storeActions.setThemeState,
    showToast,
    onCleanDemoData: () => { /* no-op — full cleanup via main Settings */ },
  });

  const {
    localSettings,
    localAiSettings,
    handleChange,
    handleAiProfileChange,
    themePrompt,
    setThemePrompt,
    isGeneratingTheme,
    handleGenerateThemeFromPrompt,
    setIsResetModalOpen,
    handleBulkAssign,
    toggleAssociation,
    updateAssignmentHours,
    handleThemeChange,
  } = settingsLogic;

  // ── Jarvis settings hook ─────────────────────────────────────────────────────
  const {
    hints,
    badgeCounts,
    presets,
    suggestedPreset,
    skillSettingsList,
    applyPreset,
    dismissHint,
  } = useJarvisSettings(tenantId);

  // ── Drive (no-op in landing context) ────────────────────────────────────────
  const handleConnectDrive  = useCallback(() => { showToast('Apri le impostazioni complete per gestire Google Drive', 'info'); }, [showToast]);
  const handleSyncToDrive   = useCallback(() => { showToast('Apri le impostazioni complete per sincronizzare', 'info'); }, [showToast]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.altKey) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < CATEGORIES.length) {
          e.preventDefault();
          setActiveCategory(CATEGORIES[idx].id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ── Preset apply ─────────────────────────────────────────────────────────────
  const handleApplyPreset = useCallback((presetId: string) => {
    applyPreset(presetId);
    setPresetApplied(presetId);
    showToast('Preset applicato', 'success');
    setTimeout(() => setPresetApplied(null), 2500);
  }, [applyPreset, showToast]);

  // ── Active hint for current category ────────────────────────────────────────
  const activeHint = hints.find(h => h.categoryId === activeCategory) ?? hints[0] ?? null;

  // ── Render content by category ───────────────────────────────────────────────
  const renderContent = (): React.JSX.Element => {
    switch (activeCategory) {
      case 'generali':
        return (
          <SettingsProfileSection
            expanded={true}
            onToggle={() => undefined}
            localSettings={localSettings}
            handleChange={handleChange}
          />
        );

      case 'interfaccia':
        return (
          <SettingsInterfaceSection
            expanded={true}
            onToggle={() => undefined}
            themeState={themeState}
            onSaveTheme={storeActions.setThemeState}
            handleThemeChange={handleThemeChange}
            themePrompt={themePrompt}
            setThemePrompt={setThemePrompt}
            isGeneratingTheme={isGeneratingTheme}
            handleGenerateThemeFromPrompt={handleGenerateThemeFromPrompt}
            showToast={showToast}
          />
        );

      case 'ai':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4, 16px)' }}>
            <SettingsAISection
              expanded={true}
              onToggle={() => undefined}
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
              expanded={true}
              onToggle={() => undefined}
              dismissedSuggestions={dismissedSuggestions}
              onReactivateSuggestion={reactivateSuggestion}
              showToast={showToast}
            />
          </Box>
        );

      case 'skills':
        return (
          <SettingsSkillsPanel
            skills={skillSettingsList}
          />
        );

      case 'integrazioni':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4, 16px)' }}>
            <SettingsCloudSection
              expanded={true}
              onToggle={() => undefined}
              driveState={driveSyncState}
              settings={settings}
              onConnectDrive={handleConnectDrive}
              onSyncToDrive={handleSyncToDrive}
              onExportData={() => undefined}
              onImportData={() => undefined}
            />
            <SettingsIntegrationsSection
              expanded={true}
              onToggle={() => undefined}
              onConnectDrive={handleConnectDrive}
              onSyncToDrive={handleSyncToDrive}
              isDriveConnected={driveSyncState.isAuthenticated}
              driveConnectedAt={driveSyncState.lastSyncTime ? String(driveSyncState.lastSyncTime) : undefined}
            />
          </Box>
        );

      case 'avanzate':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4, 16px)' }}>
            <SettingsDebugSection
              expanded={true}
              onToggle={() => undefined}
              showToast={showToast}
            />
            <SettingsAdvancedSection
              expanded={true}
              onToggle={() => undefined}
              localSettings={localSettings}
              handleChange={handleChange}
              setIsResetModalOpen={setIsResetModalOpen}
            />
          </Box>
        );

      case 'privacy':
        return <PrivacyPolicyPanel expanded />;

      default:
        return <Box />;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <M3Surface
      elevation={2}
      sx={{
        width:          '100%',
        height:         '100%',
        display:        'flex',
        flexDirection:  'column',
        overflow:       'hidden',
        bgcolor:        'var(--md-sys-color-surface)',
        borderRadius:   0,
      }}
    >
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <M3Surface
        elevation={1}
        component="header"
        sx={{
          display:        'flex',
          alignItems:     'center',
          flexShrink:     0,
          px:             'var(--md-sys-spacing-4, 16px)',
          py:             'var(--md-sys-spacing-3, 12px)',
          gap:            'var(--md-sys-spacing-3, 12px)',
          borderBottom:   '1px solid var(--md-sys-color-outline-variant)',
          bgcolor:        'var(--md-sys-color-surface-container)',
        }}
      >
        <IconButton
          aria-label="Chiudi impostazioni"
          onClick={onClose}
          size="small"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 24px)' }} />
        </IconButton>

        <Typography
          variant="titleLarge"
          sx={{
            flex:       1,
            fontFamily: 'var(--md-sys-typescale-title-large-font)',
            fontSize:   'var(--md-sys-typescale-title-large-size)',
            color:      'var(--md-sys-color-on-surface)',
          }}
        >
          Impostazioni
        </Typography>

        {/* Search */}
        <M3Surface
          elevation={0}
          sx={{
            display:     'flex',
            alignItems:  'center',
            gap:         1,
            px:          'var(--md-sys-spacing-3, 12px)',
            py:          'var(--md-sys-spacing-1, 4px)',
            borderRadius: '28px',
            border:      '1px solid var(--md-sys-color-outline-variant)',
            bgcolor:     'var(--md-sys-color-surface-container-highest)',
            width:       isDesktop ? 240 : 160,
          }}
        >
          <SearchIcon
            sx={{
              fontSize: 'var(--md-sys-icon-size-sm, 20px)',
              color:    'var(--md-sys-color-on-surface-variant)',
            }}
          />
          <InputBase
            inputRef={searchRef}
            placeholder="Cerca impostazioni (/)…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            inputProps={{ 'aria-label': 'Cerca impostazioni' }}
            sx={{
              flex:     1,
              fontSize: 'var(--md-sys-typescale-body-medium-size)',
              color:    'var(--md-sys-color-on-surface)',
              '& input::placeholder': {
                color:   'var(--md-sys-color-on-surface-variant)',
                opacity: 1,
              },
            }}
          />
        </M3Surface>

        {/* Jarvis AI badge */}
        <Tooltip title="Jarvis ha suggerimenti attivi" placement="bottom">
          <Badge badgeContent={hints.length} color="secondary" max={9}>
            <AutoAwesomeIcon
              sx={{
                fontSize: 'var(--md-sys-icon-size-md, 24px)',
                color:    hints.length > 0
                  ? 'var(--md-sys-color-tertiary)'
                  : 'var(--md-sys-color-outline)',
              }}
            />
          </Badge>
        </Tooltip>
      </M3Surface>

      {/* ── Presets bar ────────────────────────────────────────────────────── */}
      <Box
        component="nav"
        aria-label="Preset Jarvis"
        sx={{
          display:        'flex',
          alignItems:     'center',
          gap:            'var(--md-sys-spacing-2, 8px)',
          px:             'var(--md-sys-spacing-4, 16px)',
          py:             'var(--md-sys-spacing-2, 8px)',
          overflowX:      'auto',
          flexShrink:     0,
          bgcolor:        'var(--md-sys-color-surface-container-low)',
          borderBottom:   '1px solid var(--md-sys-color-outline-variant)',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Typography
          variant="labelSmall"
          sx={{
            fontFamily:  'var(--md-sys-typescale-label-small-font)',
            fontSize:    'var(--md-sys-typescale-label-small-size)',
            color:       'var(--md-sys-color-on-surface-variant)',
            whiteSpace:  'nowrap',
            flexShrink:  0,
          }}
        >
          Preset:
        </Typography>

        {presets.map(preset => {
          const isSuggested = suggestedPreset?.id === preset.id;
          const isApplied   = presetApplied === preset.id;

          return (
            <Tooltip key={preset.id} title={preset.description} placement="bottom">
              <Chip
                label={preset.label}
                icon={
                  isApplied ? (
                    <CheckCircleIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 16px)' }} />
                  ) : undefined
                }
                onClick={() => handleApplyPreset(preset.id)}
                variant={isSuggested ? 'filled' : 'outlined'}
                color={isSuggested ? 'tertiary' as 'default' : 'default'}
                size="small"
                aria-label={`Applica preset ${preset.label}`}
                sx={{
                  cursor: 'pointer',
                  bgcolor: isSuggested
                    ? 'var(--md-sys-color-tertiary-container)'
                    : undefined,
                  color: isSuggested
                    ? 'var(--md-sys-color-on-tertiary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                  border: isSuggested
                    ? '1px solid var(--md-sys-color-tertiary)'
                    : '1px solid var(--md-sys-color-outline-variant)',
                  fontFamily: 'var(--md-sys-typescale-label-medium-font)',
                  fontSize:   'var(--md-sys-typescale-label-medium-size)',
                  '&:hover': {
                    bgcolor: 'var(--md-sys-color-secondary-container)',
                    color:   'var(--md-sys-color-on-secondary-container)',
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Sidebar (desktop) / Chip bar (mobile) ───────────────────────── */}
        {isDesktop ? (
          <M3Surface
            elevation={0}
            component="nav"
            aria-label="Categorie impostazioni"
            sx={{
              width:         280,
              flexShrink:    0,
              overflowY:     'auto',
              borderRight:   '1px solid var(--md-sys-color-outline-variant)',
              bgcolor:       'var(--md-sys-color-surface-container-low)',
              pt:            'var(--md-sys-spacing-2, 8px)',
              pb:            'var(--md-sys-spacing-6, 24px)',
              display:       'flex',
              flexDirection: 'column',
              gap:           'var(--md-sys-spacing-1, 4px)',
              px:            'var(--md-sys-spacing-2, 8px)',
            }}
          >
            {CATEGORIES.map((cat, idx) => {
              const isActive = activeCategory === cat.id;
              const badge    = badgeCounts[cat.id] ?? 0;

              return (
                <Box
                  key={cat.id}
                  component="button"
                  role="button"
                  aria-pressed={isActive}
                  aria-label={`${cat.label}${badge > 0 ? `, ${badge} suggerimenti Jarvis` : ''} (${cat.shortcut})`}
                  onClick={() => setActiveCategory(cat.id)}
                  sx={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            'var(--md-sys-spacing-3, 12px)',
                    px:             'var(--md-sys-spacing-4, 16px)',
                    py:             'var(--md-sys-spacing-3, 12px)',
                    borderRadius:   '28px',
                    border:         'none',
                    cursor:         'pointer',
                    bgcolor:        isActive
                      ? 'var(--md-sys-color-secondary-container)'
                      : 'transparent',
                    color:          isActive
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                    transition:     'background-color 150ms ease',
                    '&:hover': {
                      bgcolor: isActive
                        ? 'var(--md-sys-color-secondary-container)'
                        : 'var(--md-sys-color-surface-container-highest)',
                    },
                    '&:focus-visible': {
                      outline: `2px solid var(--md-sys-color-primary)`,
                    },
                  }}
                >
                  <Badge badgeContent={badge} color="error" max={9}>
                    <Box
                      component="span"
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      sx={{
                        fontSize: 'var(--md-sys-icon-size-md, 24px)',
                        color:    isActive
                          ? 'var(--md-sys-color-on-secondary-container)'
                          : 'var(--md-sys-color-on-surface-variant)',
                      }}
                    >
                      {cat.icon}
                    </Box>
                  </Badge>

                  <Typography
                    variant="labelLarge"
                    sx={{
                      flex:       1,
                      fontFamily: 'var(--md-sys-typescale-label-large-font)',
                      fontSize:   'var(--md-sys-typescale-label-large-size)',
                      color:      'inherit',
                    }}
                  >
                    {cat.label}
                  </Typography>

                  <Typography
                    variant="labelSmall"
                    sx={{
                      fontFamily: 'var(--md-sys-typescale-label-small-font)',
                      fontSize:   'var(--md-sys-typescale-label-small-size)',
                      color:      'var(--md-sys-color-outline)',
                      opacity:    0.7,
                    }}
                  >
                    {idx + 1}
                  </Typography>
                </Box>
              );
            })}
          </M3Surface>
        ) : (
          /* Mobile chip bar */
          <Box
            component="nav"
            aria-label="Categorie impostazioni"
            sx={{
              position:       'absolute',
              top:            0,
              left:           0,
              right:          0,
              zIndex:         1,
              display:        'flex',
              gap:            'var(--md-sys-spacing-2, 8px)',
              px:             'var(--md-sys-spacing-3, 12px)',
              py:             'var(--md-sys-spacing-2, 8px)',
              overflowX:      'auto',
              bgcolor:        'var(--md-sys-color-surface-container)',
              borderBottom:   '1px solid var(--md-sys-color-outline-variant)',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {CATEGORIES.map(cat => (
              <Chip
                key={cat.id}
                label={cat.label}
                onClick={() => setActiveCategory(cat.id)}
                variant={activeCategory === cat.id ? 'filled' : 'outlined'}
                size="small"
                aria-pressed={activeCategory === cat.id}
                aria-label={cat.label}
                sx={{
                  flexShrink: 0,
                  bgcolor: activeCategory === cat.id
                    ? 'var(--md-sys-color-secondary-container)'
                    : undefined,
                  color: activeCategory === cat.id
                    ? 'var(--md-sys-color-on-secondary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                  fontFamily: 'var(--md-sys-typescale-label-medium-font)',
                  fontSize:   'var(--md-sys-typescale-label-medium-size)',
                }}
              />
            ))}
          </Box>
        )}

        {/* ── Main content ────────────────────────────────────────────────── */}
        <Box
          component="main"
          sx={{
            flex:      1,
            overflowY: 'auto',
            display:   'flex',
            flexDirection: 'column',
            gap:       'var(--md-sys-spacing-3, 12px)',
            pt:        !isDesktop ? '56px' : 'var(--md-sys-spacing-4, 16px)',
            px:        'var(--md-sys-spacing-4, 16px)',
            pb:        'var(--md-sys-spacing-6, 24px)',
          }}
        >
          {/* Category title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2, 8px)', mb: 'var(--md-sys-spacing-1, 4px)' }}>
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{
                fontSize: 'var(--md-sys-icon-size-lg, 28px)',
                color:    'var(--md-sys-color-primary)',
              }}
            >
              {CATEGORIES.find(c => c.id === activeCategory)?.icon}
            </Box>
            <Typography
              variant="headlineSmall"
              sx={{
                fontFamily: 'var(--md-sys-typescale-headline-small-font)',
                fontSize:   'var(--md-sys-typescale-headline-small-size)',
                color:      'var(--md-sys-color-on-surface)',
              }}
            >
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </Typography>
            {(badgeCounts[activeCategory] ?? 0) > 0 && (
              <Chip
                label={`${badgeCounts[activeCategory]} suggeriti`}
                size="small"
                icon={<AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs, 12px)' }} />}
                sx={{
                  bgcolor: 'var(--md-sys-color-tertiary-container)',
                  color:   'var(--md-sys-color-on-tertiary-container)',
                  fontSize: 'var(--md-sys-typescale-label-small-size)',
                  height:  22,
                  fontFamily: 'var(--md-sys-typescale-label-small-font)',
                }}
              />
            )}
          </Box>

          <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

          {/* Jarvis hint banner */}
          {activeHint && (
            <Fade in={Boolean(activeHint)}>
              <Alert
                severity="info"
                icon={<AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} />}
                onClose={() => dismissHint(activeHint.id)}
                sx={{
                  bgcolor:    'var(--md-sys-color-tertiary-container)',
                  color:      'var(--md-sys-color-on-tertiary-container)',
                  border:     '1px solid var(--md-sys-color-tertiary)',
                  borderRadius: 2,
                  '& .MuiAlert-icon': { color: 'var(--md-sys-color-tertiary)' },
                  '& .MuiAlert-action button': { color: 'var(--md-sys-color-on-tertiary-container)' },
                  fontFamily: 'var(--md-sys-typescale-body-medium-font)',
                  fontSize:   'var(--md-sys-typescale-body-medium-size)',
                }}
              >
                <AlertTitle
                  sx={{
                    fontFamily: 'var(--md-sys-typescale-label-large-font)',
                    fontSize:   'var(--md-sys-typescale-label-large-size)',
                  }}
                >
                  Jarvis suggerisce
                </AlertTitle>
                {activeHint.message}
              </Alert>
            </Fade>
          )}

          {/* Section content */}
          {renderContent()}
        </Box>
      </Box>
    </M3Surface>
  );
}
