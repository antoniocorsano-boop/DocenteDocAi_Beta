// HelpModal.tsx - Refactored: extracted sub-panels into help/ directory
import React, { useState } from 'react';
import { View, HelpModalProps } from '../types';
// Fase 4: FULL routing for help generation (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { printFullAppGuide } from '../utils/printUtils';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { M3Dialog } from './ui';
import HelpSetupGuide from './help/HelpSetupGuide';
import { useUIStore } from '../stores/useUIStore';
import HelpDigitalTeacherManual from './help/HelpDigitalTeacherManual';
import HelpVocalAssistantGuide from './help/HelpVocalAssistantGuide';
import HelpUserGuide from './help/HelpUserGuide';
import HelpTechnicalSpecs from './help/HelpTechnicalSpecs';
import HelpNormativa from './help/HelpNormativa';
import HelpFaq from './help/HelpFaq';
import HelpNKAGuide from './help/HelpNKAGuide';
import { faqContentData } from './help/HelpFaq';
import { specsContentData } from './help/HelpTechnicalSpecs';
import { vocalAssistantGuideData } from './help/HelpVocalAssistantGuide';
import { logger } from '../utils/logger';

type HelpTab = 'improvements' | 'manual' | 'guide' | 'setup' | 'assistant' | 'faq' | 'specs' | 'normativa' | 'nka';

const ImprovementsList: React.FC<{onNavigate: (v: View) => void; onClose: () => void; onGenerate: () => void; isGenerating: boolean;}> = ({onNavigate, onClose, onGenerate, isGenerating}) => {
    const ImprovementCard: React.FC<{ title: string; children: React.ReactNode; actionView?: View; icon?: string }> = ({ title, children, actionView, icon = "new_relvar(--md-sys-motion-easing-standard)s" }) => (
        <div style={{
            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            padding: 'var(--md-sys-spacing-4)'
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    flex: "1",
                    minWidth: "0"
                }}>
                    <div style={{
                        transition: "transform var(--md-sys-motion-duration-medium)",
                        width: 'var(--md-sys-sizing-icon-large)',
                        height: 'var(--md-sys-sizing-icon-large)',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        color: 'var(--md-sys-color-primary)',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: "0",
                        backgroundColor: 'var(--md-sys-color-primary-container)'
                    }}>
                        <span style={{}}>{icon}</span>
                    </div>
                    <Typography variant="subtitle1" sx={{
                        fontWeight: "var(--md-sys-typescale-weight-bold)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginLeft: 'var(--md-sys-spacing-3)'
                    }}>{title}</Typography>
                </div>
                <Typography variant="button" sx={{
                    color: 'var(--md-sys-color-primary)',
                    flexShrink: "0",
                    fontSize: 'var(--md-sys-typescale--font-size)'
                }}>v4.1.0</Typography>
            </div>
            <Typography variant="body2" sx={{
                opacity: "var(--md-sys-state-opacity-supporting)",
                lineHeight: "1.625",
                display: "-webkit-box",
                WebkitLineClamp: "2",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                marginTop: 'var(--md-sys-spacing-2)'
            }}>{children}</Typography>
            {actionView && actionView !== 'home' && (
                <div style={{ width: 'var(--md-sys-percent-100)' }}>
                    <Button
                        onClick={() => { onClose(); onNavigate(actionView); }}
                        variant="contained"
                        color="secondary"
                        sx={{
                            textTransform: "uppercase",
                            letterSpacing: "var(--md-sys-typescale-label-large-tracking)",
                            marginTop: 'var(--md-sys-spacing-3)'
                        }}
                    >
                        <span style={{
                            marginRight: 'var(--md-sys-spacing-2)',
                            fontSize: 'var(--md-sys-typescale--font-size)'
                        }}>arrow_forward</span>
                        Vai alla funzione
                    </Button>
                </div>
            )}
        </div>
    );
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <Typography variant="h6">Novità della versione 4.1.0</Typography>
            
            <div style={{
                display: "grid",
                gridTemplateColumns: "var(--md-sys-grid-fr-1)",
                gap: 'var(--md-sys-spacing-6)'
            }}>
                <ImprovementCard title="Design M3 Expressive" actionView="settings" icon="palette">
                    Interfaccia completamente rinnovata con il nuovo design system Material 3 Expressive: layout adattivi, motion system e colori dinamici.
                </ImprovementCard>

                <ImprovementCard title="Calendario Migliorato" actionView="calendario" icon="calendar_month">
                    Vista calendario completamente ridisegnata con migliore leggibilità, navigazione fluida e integrazione eventi più chiara.
                </ImprovementCard>

                <ImprovementCard title="Stabilità Backup" actionView="settings" icon="cloud_sync">
                    Risolto problema critico di sincronizzazione. Il salvataggio automatico viene sospeso durante l'importazione dati.
                </ImprovementCard>

                <ImprovementCard title="Assistente Vocale iOS" actionView="live-assistant" icon="mic">
                    Corretto il blocco dell'audio su Safari/iPhone. L'assistente ora si inizializza correttamente al tocco.
                </ImprovementCard>

                <ImprovementCard title="Zero-FOUC Theme" actionView="settings" icon="dark_mode">
                    Il tema personalizzato viene caricato istantaneamente all'avvio, eliminando lo sfarfallio dei colori.
                </ImprovementCard>

                <ImprovementCard title="Header & Avatar Migliorati" actionView="settings" icon="account_circle">
                    L'avatar ora mostra le iniziali del nome docente. Header più compatto e informativo.
                </ImprovementCard>
            </div>

            <div style={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                padding: 'var(--md-sys-spacing-6)',
                border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center"
                }}>
                    <div style={{
                        width: 'var(--md-sys-spacing-12)',
                        height: 'var(--md-sys-spacing-12)',
                        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        backgroundColor: 'var(--md-sys-color-primary)'
                    }}>
                        <span style={{
                            color: 'var(--md-sys-color-on-primary)'
                        }}>picture_as_pdf</span>
                    </div>
                    <div style={{
                        flexGrow: 1,
                        textAlign: "center"
                    }}>
                        <Typography variant="h6">Manuale Completo PDF</Typography>
                        <Typography variant="body2" sx={{
                            opacity: "var(--md-sys-state-opacity-supporting)"
                        }}>
                            Scarica il manuale PDF aggiornato alla versione 4.1.0 con la guida al Centro Operativo e le specifiche tecniche.
                        </Typography>
                    </div>
                </div>
                 <div style={{ width: 'var(--md-sys-percent-100)' }}>
                     <Button onClick={onGenerate} disabled={isGenerating} variant="contained" sx={{
                         fontSize: 'var(--md-sys-typescale--font-size)',
                         textTransform: "uppercase",
                         letterSpacing: "var(--md-sys-typescale-label-large-tracking)",
                         marginTop: 'var(--md-sys-spacing-4)'
                     }}>
                        <span style={{
                            marginRight: 'var(--md-sys-spacing-2)'
                        }}>{isGenerating ? 'pending' : 'download'}</span>
                        {isGenerating ? 'Generazione...' : 'Scarica Manuale & Guida PDF'}
                    </Button>
                 </div>
        </div>
    </div>
    );
};

const HelpModal: React.FC<HelpModalProps> = ({ onClose, onNavigate, aiSettings, setIsLoadingModalOpen, setLoadingModalMessage }) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('improvements');
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));

  const handleGenerateFullDocument = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsLoadingModalOpen(true);
    try {
        setLoadingModalMessage('Generazione contenuti...');

        // Fase 4: route via AIBrain + context before legacy calls (daily help gesture)
        const ctx = AIBrain.buildContext({
            source: 'help-modal',
            extra: { action: 'generate-full-document', hasAiSettings: !!aiSettings }
        });
        await AIBrain.migrateLegacyAsk('Generate full help/manual PDF document', ctx);

        // Post-Fase 4: central prompt builder + gateway for daily full document generation gesture
        const ctx = AIBrain.buildContext({
            source: 'help-modal',
            extra: { action: 'generate-full-document', hasAiSettings: !!aiSettings }
        });
        await AIBrain.migrateLegacyAsk('Generate full help/manual PDF document', ctx);

        // POST-Fase 4 rollout
        const { prompt: essayP } = AIBrain.buildPrompt('academic-essay', {});
        const { prompt: techP } = AIBrain.buildPrompt('technical-document', {});

        const essayContent = await AIBrain.generateWithCentralPrompt('academic-essay', {}, aiSettings);
        const techInfo = await AIBrain.generateWithCentralPrompt('technical-document', {}, aiSettings) || {};
        printFullAppGuide(
            essayContent ?? null,
            faqContentData,
            specsContentData,
            techInfo,
            vocalAssistantGuideData
        );
        onClose();
    } catch (error) {
        logger.error("Full document generation failed:", error);
        showToast('Errore generazione documento.', 'error');
    } finally {
        setIsGenerating(false);
        setIsLoadingModalOpen(false);
    }
  };
  
  const renderContent = () => {
    switch(activeTab) {
      case 'improvements': return <ImprovementsList onNavigate={onNavigate} onClose={onClose} onGenerate={handleGenerateFullDocument} isGenerating={isGenerating} />;
      case 'manual': return <HelpDigitalTeacherManual />;
      case 'guide': return <HelpUserGuide />;
      case 'setup': return <HelpSetupGuide />;
      case 'assistant': return <HelpVocalAssistantGuide />;
      case 'faq': return <HelpFaq />;
      case 'specs': return <HelpTechnicalSpecs />;
      case 'normativa': return <HelpNormativa />;
      case 'nka': return <HelpNKAGuide />;
      default: return null;
    }
  }

  const tabs = [
    { id: 'improvements', label: 'Novità', icon: 'new_relvar(--md-sys-motion-easing-standard)s' },
    { id: 'manual', label: 'Manuale', icon: 'auto_stories' },
    { id: 'setup', label: 'Setup', icon: 'settings' },
    { id: 'guide', label: 'Flusso', icon: 'account_tree' },
    { id: 'assistant', label: 'AI & Voice', icon: 'mic' },
    { id: 'faq', label: 'FAQ', icon: 'quiz' },
    { id: 'specs', label: 'Specs', icon: 'terminal' },
    { id: 'normativa', label: 'Privacy', icon: 'shield' },
    { id: 'nka', label: 'Aura NKA', icon: 'auto_awesome' },
  ];

  return (
    <M3Dialog
      title="Guida, Novità e Manuale"
      onClose={onClose}
      maxWidth="xl"
      hideBackdrop={true}
      buttons={<Button onClick={onClose} variant="text" disabled={isGenerating} sx={{
        fontSize: 'var(--md-sys-typescale--font-size)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--md-sys-typescale-label-large-tracking)'
      }}>Chiudi</Button>}
    >
      <Box sx={{
        backgroundColor: 'var(--md-sys-color-surface-container-high)'
      }}>
        <div style={{marginTop: 'var(--md-sys-spacing-6)'}}>
          <div style={{
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            fontSize: 'var(--md-sys-typescale--font-size)',
            padding: 'var(--md-sys-spacing-4)',
            backgroundColor: 'var(--md-sys-color-surface-container-low)'
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 'var(--md-sys-spacing-2)'
            }}>
                <span style={{
                  color: 'var(--md-sys-color-primary)'
                }}>campaign</span>
                <b style={{
                  color: 'var(--md-sys-color-primary)',
                  textTransform: "uppercase",
                  letterSpacing: "var(--md-sys-typescale-label-large-tracking)"
                }}>Novità Dicembre 2025</b>
            </div>
            <ul style={{
              paddingLeft: 'var(--md-sys-spacing-5)',
              display: "flex",
              flexDirection: "column",
              gap: 'var(--md-sys-spacing-2)'
            }}>
              <li>Tutti i pulsanti ora seguono Material Design 3 (filled, tonal, outlined, icon, segmented)</li>
              <li>Migliorata accessibilità, responsive e coerenza visiva</li>
              <li>Focus visibile, aria-label obbligatorio, test aggiornati</li>
              <li>Consulta la <a href="/docs/MIGRAZIONE_COMPONENTI_M3.md" target="_blank" rel="noopener" style={{
                color: 'var(--md-sys-color-primary)',
                fontWeight: "var(--md-sys-typescale-weight-bold)"
              }}>guida M3 aggiornata</a> per dettagli e best practice</li>
            </ul>
          </div>

          <div style={{ width: 'var(--md-sys-percent-100)' }}>
                        <Tabs
              value={activeTab}
              onChange={(_, v: string) => ((id) => setActiveTab(id as HelpTab))(v)}
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
              {(tabs).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
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
          </div>

          {/* Post-Fase 4 visible block - prompt centralization rollout */}
          <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
            AIBrain (Post-Fase 4): HelpModal — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (document generation)
          </Box>

          <div style={{
            padding: 'var(--md-sys-spacing-4)',
            backgroundColor: 'var(--md-sys-color-surface)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            marginTop: 'var(--md-sys-spacing-4)'
          }}>
            {renderContent()}
          </div>
        </div>
      </Box>
    </M3Dialog>
  );
};

export default HelpModal;

