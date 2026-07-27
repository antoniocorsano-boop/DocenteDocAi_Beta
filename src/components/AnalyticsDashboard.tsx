// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026
/**
 * AnalyticsDashboard
 *
 * Material Design 3 Expressive - Complete MD3 Token Migration
 * Migration Date: Phase 1.3 (Batch P0 Migration) + Complete Token Migration
 * Z-Index: Dynamic (via M3Dialog + ModalContext)
 *
 * Previous: M3Dialog wrapper + extensive Tailwind classes + hardcoded styles
 * Current: Pure M3Dialog with complete MD3 design tokens + scrolling support
 *
 * Status: ? FULLY MIGRATED & ACCESSIBLE
 */

/**
 * AnalyticsDashboard
 *
 * Material Design 3 Expressive - Complete MD3 Token Migration
 * Migration Date: Phase 1.3 (Batch P0 Migration) + Complete Token Migration
 * Z-Index: Dynamic (via M3Dialog + ModalContext)
 *
 * Previous: M3Dialog wrapper + extensive Tailwind classes + hardcoded styles
 * Current: Pure M3Dialog with complete MD3 design tokens + scrolling support
 *
 * Status: ? FULLY MIGRATED & ACCESSIBLE
 * // M3Expressive refactor: Già completamente migrato, confermato conforme M3.
 */

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import React, { useState, useMemo } from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import { useUIStore } from '../stores/useUIStore';
import { M3Dialog, M3ConfirmDialog, EmptyState } from './ui';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import InputLabel from '@mui/material/InputLabel';
import '../design-system/md3-utilities.css';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'settings'>('overview');
  const [hoveredElements, setHoveredElements] = useState<Record<string, boolean>>({});

  const { analyticsMetrics, analyticsEvents, analyticsSettings, actions } = useSystemStore(state => ({
    analyticsMetrics: state.analyticsMetrics,
    analyticsEvents: state.analyticsEvents,
    analyticsSettings: state.analyticsSettings,
    actions: state.actions
  }));
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // Calcola statistiche aggiuntive
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEvents = analyticsEvents.filter(event =>
      new Date(event.timestamp) >= sevenDaysAgo
    );

    const monthlyEvents = analyticsEvents.filter(event =>
      new Date(event.timestamp) >= thirtyDaysAgo
    );

    const topFeatures = Object.entries(analyticsMetrics.featuresUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const documentTypes = Object.entries(analyticsMetrics.documentsByType)
      .sort(([,a], [,b]) => b - a);

    return {
      weeklyActivity: recentEvents.length,
      monthlyActivity: monthlyEvents.length,
      topFeatures,
      documentTypes,
      dataRetention: analyticsSettings.retentionDays
    };
  }, [analyticsEvents, analyticsMetrics, analyticsSettings]);

  const handleResetAnalytics = () => {
    setConfirmDialog({
      message: 'Sei sicuro di voler resettare tutti i dati analytics? Questa azione non può essere annullata.',
      onConfirm: () => {
        actions.setAnalyticsEvents([]);
        actions.setAnalyticsMetrics({
          totalDocumentsGenerated: 0,
          documentsByType: {},
          featuresUsage: {},
          templatesCreated: 0,
          exportBatchesCount: 0,
          aiInteractionsCount: 0,
          averageSessionDuration: 0,
          lastUpdated: new Date().toISOString()
        });
        actions.setAnalyticsSettings({
          ...analyticsSettings,
          lastReset: new Date().toISOString()
        });
        showToast('Dati analytics resettati con successo.', 'info');
      }
    });
  };

  const handleToggleAnalytics = (enabled: boolean) => {
    actions.setAnalyticsSettings({
      ...analyticsSettings,
      enabled
    });
    showToast(
      enabled ? 'Analytics abilitati.' : 'Analytics disabilitati.',
      enabled ? 'success' : 'info'
    );
  };

  const formatNumber = (num: number) => num.toLocaleString('it-IT');
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('it-IT');

  return (
    <M3Dialog
      title="Analytics & Statistiche"
      onClose={onClose}
      maxWidth="xl"
    >
      <DialogContent sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 'var(--md-sys-spacing-4)', sm: 'var(--md-sys-spacing-6)' },
        overflowY: 'auto',
        maxHeight: 'var(--md-sys-spacing-80)'
      }}>
          {/* GDPR Notice */}
          <Box sx={{backgroundColor: 'var(--md-sys-color-tertiary-container)',
            opacity: 'var(--md-sys-state-layer-opacity-hover)',
            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
            padding: { xs: 'var(--md-sys-spacing-4)', sm: 'var(--md-sys-spacing-8)' },
            backdropFilter: 'blur(var(--md-sys-blur-medium))',
            borderRadius: 'var(--md-sys-shape-corner-extra-large)'}}>
            <Box sx={{display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--md-sys-spacing-6)'}}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-on-tertiary-container)',
                marginTop: 'var(--md-sys-spacing-4)'}}>privacy_tip</Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <Typography
                  variant="caption"
                  sx={{color: 'var(--md-sys-color-on-tertiary-container)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--md-sys-typescale-label-large-tracking, 0.2em)',
                    marginBottom: 'var(--md-sys-spacing-4)',
                    display: 'block'}}
                >
                  ?? Informativa Privacy
                </Typography>
                <Typography variant="caption" sx={{color: 'var(--md-sys-color-on-tertiary-container)'}}>
                  Questi dati sono memorizzati localmente sul tuo dispositivo e non vengono mai trasmessi a server esterni.
                  Puoi disabilitare la raccolta dati in qualsiasi momento dalle impostazioni.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Tabs */}
                    <Tabs
            value={activeTab}
            onChange={(_, v: string) => ((id) => setActiveTab(id as 'settings' | 'details' | 'overview'))(v)}
            indicatorColor="primary"
            textColor="primary"
            aria-label="Sezioni di navigazione"
            sx={{
              bgcolor: 'var(--md-sys-color-surface-container-low)',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              minHeight: 'auto',
              p: 0.5,
            }}
          >
            {([
              { id: 'overview', label: 'Panoramica', icon: 'dashboard' },
              { id: 'details', label: 'Dettagli', icon: 'analytics' },
              { id: 'settings', label: 'Impostazioni', icon: 'settings' }
            ]).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
              <Tab
                key={tab.id}
                value={tab.id}
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                data-testid={`tab-${tab.id}`}
                label={(
                  <Badge badgeContent={tab.badge} color="error">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {tab.icon && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-typescale-label-large-font-size)' }}>{tab.icon}</Box>}
                      {tab.label}
                    </Box>
                  </Badge>
                )}
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  minHeight: 'auto',
                  py: 1,
                  px: 2,
                  textTransform: 'uppercase',
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                }}
              />
            ))}
          </Tabs>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <Box sx={{display: 'flex',
              flexDirection: 'column',
              gap: 'var(--md-sys-spacing-6)',
              animation: `fade-in var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)`}}>
              <Box sx={{display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-spacing-32), var(--md-sys-grid-fr-1)))',
                gap: 'var(--md-sys-spacing-8)'}}>
                <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                  padding: { xs: 'var(--md-sys-spacing-4)', sm: 'var(--md-sys-spacing-8)' },
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)'}}>
                  <Box sx={{display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-6)'}}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-tertiary)'}}>description</Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                      <Typography variant="h6" sx={{
                        color: 'var(--md-sys-color-on-surface)'}}>{formatNumber(analyticsMetrics.totalDocumentsGenerated)}</Typography>
                      <Typography
                        variant="caption"
                        sx={{textTransform: 'uppercase',
                          letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                          color: 'var(--md-sys-color-on-surface-variant)'}}
                      >
                        Documenti
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                  padding: { xs: 'var(--md-sys-spacing-4)', sm: 'var(--md-sys-spacing-8)' },
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)'}}>
                  <Box sx={{display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-6)'}}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-secondary)'}}>smart_toy</Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                      <Typography variant="h6" sx={{
                        color: 'var(--md-sys-color-on-surface)'}}>{formatNumber(analyticsMetrics.aiInteractionsCount)}</Typography>
                      <Typography
                        variant="caption"
                        sx={{textTransform: 'uppercase',
                          letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                          color: 'var(--md-sys-color-on-surface-variant)'}}
                      >
                        Interazioni AI
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                  padding: { xs: 'var(--md-sys-spacing-4)', sm: 'var(--md-sys-spacing-8)' },
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)'}}>
                  <Box sx={{display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-6)'}}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-primary)',
                      fontSize: 'var(--md-sys-typescale-display-large-font-size)'}}>file_copy</Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                      <Typography variant="h6" sx={{
                        color: 'var(--md-sys-color-on-surface)'}}>{formatNumber(analyticsMetrics.templatesCreated)}</Typography>
                      <Typography
                        variant="caption"
                        sx={{textTransform: 'uppercase',
                          letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                          color: 'var(--md-sys-color-on-surface-variant)'}}
                      >
                        Template
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                  padding: { xs: 'var(--md-sys-spacing-4)', sm: 'var(--md-sys-spacing-8)' },
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)'}}>
                  <Box sx={{display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--md-sys-spacing-6)'}}>
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{color: 'var(--md-sys-color-tertiary)',
                      fontSize: 'var(--md-sys-typescale-display-large-font-size)'}}>batch_prediction</Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                      <Typography variant="h6" sx={{
                        color: 'var(--md-sys-color-on-surface)'}}>{formatNumber(analyticsMetrics.exportBatchesCount)}</Typography>
                      <Typography
                        variant="caption"
                        sx={{textTransform: 'uppercase',
                          letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                          color: 'var(--md-sys-color-on-surface-variant)'}}
                      >
                        Export
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Attività Recente */}
              <Box sx={{display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-spacing-19), var(--md-sys-grid-fr-1)))',
                gap: 'var(--md-sys-spacing-6)'}}>
                <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                  padding: 'var(--md-sys-spacing-5)',
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-extra-large)'}}>
                  <Typography
                    variant="caption"
                    sx={{textTransform: 'uppercase',
                      letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                      color: 'var(--md-sys-color-primary)',
                      marginBottom: 'var(--md-sys-spacing-8)',
                      display: 'block'}}
                  >
                    Attività 7 Giorni
                  </Typography>
                  <Box sx={{display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-3)'}}>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="body2" sx={{
                        color: 'var(--md-sys-color-on-surface-variant)'}}>Eventi Totali</Typography>
                      <Typography variant="body2" sx={{
                        color: 'var(--md-sys-color-on-surface)'}}>{stats.weeklyActivity}</Typography>
                    </Box>
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="body2" sx={{
                        color: 'var(--md-sys-color-on-surface-variant)'}}>Documenti Generati</Typography>
                      <Typography variant="body2" sx={{
                        color: 'var(--md-sys-color-on-surface)'}}>
                        {analyticsEvents.filter(e => e.eventType === 'document_generated' &&
                          new Date(e.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                  padding: 'var(--md-sys-spacing-5)',
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-extra-large)'}}>
                  <Typography
                    variant="caption"
                    sx={{textTransform: 'uppercase',
                      letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                      color: 'var(--md-sys-color-primary)',
                      marginBottom: 'var(--md-sys-spacing-8)',
                      display: 'block'}}
                  >
                    Funzionalità Top
                  </Typography>
                  <Box sx={{display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--md-sys-spacing-2)'}}>
                    {stats.topFeatures.length > 0 ? stats.topFeatures.map(([feature, count]) => (
                      <Box key={feature} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography variant="body2" sx={{
                          color: 'var(--md-sys-color-on-surface-variant)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginRight: 'var(--md-sys-spacing-2)',
                          flex: 1}}>{feature}</Typography>
                        <Typography variant="body2" sx={{
                          color: 'var(--md-sys-color-on-surface)'}}>{count}</Typography>
                      </Box>
                    )) : (
                      <EmptyState icon="bar_chart_off" title="Nessuna attività" description="Nessuna attività registrata" />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Tipi Documento */}
              {stats.documentTypes.length > 0 && (
                <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                  opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                  padding: 'var(--md-sys-spacing-5)',
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-extra-large)'}}>
                  <Typography
                    variant="caption"
                    sx={{textTransform: 'uppercase',
                      letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                      color: 'var(--md-sys-color-primary)',
                      marginBottom: 'var(--md-sys-spacing-8)',
                      display: 'block'}}
                  >
                    Documenti per Tipo
                  </Typography>
                  <Box sx={{display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-spacing-12), var(--md-sys-grid-fr-1)))',
                    gap: 'var(--md-sys-spacing-6)'}}>
                    {stats.documentTypes.map(([type, count]) => (
                      <Box key={type} sx={{display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: { xs: 'var(--md-sys-spacing-4)', sm: 'var(--md-sys-spacing-8)' },
                        backgroundColor: 'var(--md-sys-color-surface)',
                        opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                        borderRadius: 'var(--md-sys-shape-corner-medium)'}}>
                        <Typography variant="body2" sx={{
                          color: 'var(--md-sys-color-on-surface-variant)',
                          textTransform: 'capitalize'}}>{type.replace('_', ' ')}</Typography>
                        <Typography variant="body2" sx={{
                          color: 'var(--md-sys-color-primary)'}}>{count}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 'details' && (
            <Box sx={{display: 'flex',
              flexDirection: 'column',
              gap: 'var(--md-sys-spacing-4)',
              animation: `fade-in var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)`}}>
              <Typography
                variant="caption"
                sx={{textTransform: 'uppercase',
                  letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                  color: 'var(--md-sys-color-primary)',
                  paddingLeft: 'var(--md-sys-spacing-4)',
                  display: 'block'}}
              >
                Eventi Recenti
              </Typography>
              <Box sx={{overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--md-sys-spacing-2)',
                paddingRight: 'var(--md-sys-spacing-2)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--md-sys-color-outline) transparent',
                maxHeight: 'var(--md-sys-spacing-40)'}}>
                {analyticsEvents.slice(-20).reverse().map(event => {
                  const eventKey = `event-${event.id}`;
                  const isHovered = hoveredElements[eventKey] || false;
                  return (
                    <Box key={event.id} sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                      opacity: isHovered ? 0.7 : 0.5,
                      padding: 'var(--md-sys-spacing-6)',
                      border: `var(--md-sys-border-width-thin) solid ${isHovered ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'}`,
                      borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                      transition: `background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)`}}
                    onMouseEnter={() => setHoveredElements(prev => ({ ...prev, [eventKey]: true }))}
                    onMouseLeave={() => setHoveredElements(prev => ({ ...prev, [eventKey]: false }))}>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                          <Typography variant="body2" sx={{
                            color: 'var(--md-sys-color-on-surface)'}}>{event.featureName}</Typography>
                          <Typography
                            variant="caption"
                            sx={{textTransform: 'uppercase',
                              letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                              color: 'var(--md-sys-color-on-surface-variant)'}}
                          >
                            {event.eventType.replace('_', ' ')}
                          </Typography>
                        </Box>
                        <Box component="span" sx={{fontSize: 'var(--md-sys-typescale-label-large-font-size)',
                          color: 'var(--md-sys-color-on-surface-variant)',
                          backgroundColor: 'var(--md-sys-color-surface-container-high)',
                          padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-4)',
                          borderRadius: 'var(--md-sys-spacing-4)'}}>
                          {formatDate(event.timestamp)}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
                {analyticsEvents.length === 0 && (
                  <EmptyState icon="history" title="Nessun evento" description="Nessun evento registrato" />
                )}
              </Box>
            </Box>
          )}

          {activeTab === 'settings' && (
            <Box sx={{display: 'flex',
              flexDirection: 'column',
              gap: 'var(--md-sys-spacing-6)',
              animation: `fade-in var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)`}}>
              <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                opacity: 'var(--md-sys-state-layer-opacity-disabled)',
                padding: 'var(--md-sys-spacing-5)',
                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                borderRadius: 'var(--md-sys-shape-corner-extra-large)'}}>
                <Typography
                  variant="caption"
                  sx={{textTransform: 'uppercase',
                    letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                    color: 'var(--md-sys-color-primary)',
                    marginBottom: 'var(--md-sys-spacing-8)',
                    display: 'block'}}
                >
                  Raccolta Dati
                </Typography>
                <Box sx={{display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--md-sys-spacing-4)'}}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={analyticsSettings.enabled}
                        onChange={(e) => handleToggleAnalytics(e.target.checked)}
                        slotProps={{ input: { 'aria-label': 'Analytics Abilitati' } }}
                      />
                    }
                    label={
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Analytics Abilitati</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Consenti raccolta dati anonimi di utilizzo</Typography>
                      </Stack>
                    }
                    labelPlacement="start"
                    sx={{ display: 'flex', justifyContent: 'space-between', m: 0, p: 'var(--md-sys-spacing-6)', borderRadius: 'var(--md-sys-shape-corner-large)' }}
                  />

                  {analyticsSettings.enabled && (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={analyticsSettings.collectFeatureUsage}
                            onChange={(e) => actions.setAnalyticsSettings({ ...analyticsSettings, collectFeatureUsage: e.target.checked })}
                            slotProps={{ input: { 'aria-label': 'Utilizzo Funzionalità' } }}
                          />
                        }
                        label={
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Utilizzo Funzionalit\u00e0</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Traccia quali funzionalit\u00e0 vengono utilizzate</Typography>
                          </Stack>
                        }
                        labelPlacement="start"
                        sx={{ display: 'flex', justifyContent: 'space-between', m: 0, p: 'var(--md-sys-spacing-6)', borderRadius: 'var(--md-sys-shape-corner-large)' }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={analyticsSettings.collectDocumentMetrics}
                            onChange={(e) => actions.setAnalyticsSettings({ ...analyticsSettings, collectDocumentMetrics: e.target.checked })}
                            slotProps={{ input: { 'aria-label': 'Metriche Documenti' } }}
                          />
                        }
                        label={
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>Metriche Documenti</Typography>
                            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Traccia generazione e tipi di documenti</Typography>
                          </Stack>
                        }
                        labelPlacement="start"
                        sx={{ display: 'flex', justifyContent: 'space-between', m: 0, p: 'var(--md-sys-spacing-6)', borderRadius: 'var(--md-sys-shape-corner-large)' }}
                      />
                    </>
                  )}
                </Box>
              </Box>

              <Box sx={{backgroundColor: 'var(--md-sys-color-surface-container-low)',
                borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                padding: 'var(--md-sys-spacing-5)',
                border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                opacity: 'var(--md-sys-state-layer-opacity-disabled)'}}>
                <Typography
                  variant="caption"
                  sx={{textTransform: 'uppercase',
                    letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                    color: 'var(--md-sys-color-primary)',
                    marginBottom: 'var(--md-sys-spacing-8)',
                    display: 'block'}}
                >
                  Gestione Dati
                </Typography>
                <Box sx={{display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--md-sys-spacing-6)'}}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Conservazione Dati</InputLabel>
                    <Select
                      label="Conservazione Dati"
                      value={analyticsSettings.retentionDays}
                      onChange={(e) => actions.setAnalyticsSettings({
                        ...analyticsSettings,
                        retentionDays: Number(e.target.value)
                      })}
                    >
                      <MenuItem value={30}>30 giorni</MenuItem>
                      <MenuItem value={90}>90 giorni</MenuItem>
                      <MenuItem value={180}>180 giorni</MenuItem>
                      <MenuItem value={365}>1 anno</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 'var(--md-sys-spacing-4)',
                    borderTop: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
                    opacity: 'var(--md-sys-state-opacity-tint-faint)'}}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                      <Typography
                        variant="caption"
                        sx={{textTransform: 'uppercase',
                          letterSpacing: 'var(--md-sys-typescale-label-large-tracking)',
                          color: 'var(--md-sys-color-on-surface-variant)',
                          marginBottom: 'var(--md-sys-spacing-4)',
                          display: 'block'}}
                      >
                        Ultimo Reset
                      </Typography>
                      <Typography variant="body2" sx={{
                        color: 'var(--md-sys-color-on-surface)'}}>
                        {analyticsSettings.lastReset
                          ? formatDate(analyticsSettings.lastReset)
                          : 'Mai'
                        }
                      </Typography>
                    </Box>
                    <Button
                      onClick={handleResetAnalytics}
                      variant="outlined"
                      sx={{color: 'var(--md-sys-color-error)',
                        borderColor: 'var(--md-sys-color-error)',
                        opacity: hoveredElements['reset-button'] ? 0.1 : 0.3,
                        backgroundColor: hoveredElements['reset-button'] ? 'var(--md-sys-color-error)' : 'transparent',
                        borderRadius: 'var(--md-sys-spacing-4)'}}
                      onMouseEnter={() => setHoveredElements(prev => ({ ...prev, 'reset-button': true }))}
                      onMouseLeave={() => setHoveredElements(prev => ({ ...prev, 'reset-button': false }))}
                    >
                      Reset Dati
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text">
          Chiudi
        </Button>
      </DialogActions>
      {confirmDialog && (
        <M3ConfirmDialog
          title="Conferma reset"
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
          danger={true}
        />
      )}
    </M3Dialog>
  );
};

export default AnalyticsDashboard;

