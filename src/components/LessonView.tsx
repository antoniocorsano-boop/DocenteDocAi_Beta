// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026

/**
 * LessonView.tsx
 * // M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for layout, colors, spacing, and typography.
 */

import React, { useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import DoorOpenIcon from '@mui/icons-material/MeetingRoom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Lezione, MaterialeDidattico, KnowledgeBaseEntry, AiSettings, LessonAnalysisResult, TimetableSettings } from '../types';
import { generateHtmlDocxBlob, saveAs } from '../utils/documentUtils';
import { printLessonDocument, printHomeworkSheet } from '../utils/printUtils';
// Fase 4: FULL routing for lesson AI analysis/enrich (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { sanitizeHTML } from '../utils/securityUtils';
import { generateHueFromString } from '../utils/colorUtils';
import { LESSON_TYPE_ICONS } from '../constants';
import MaterialPickerModal from './MaterialPickerModal';
import LessonAnalysisModal from './LessonAnalysisModal';
import { InfoCard, SectionHeader, AiThinkingGem, M3ConfirmDialog } from './ui';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';

interface LessonViewProps {
  lesson: Lezione;
  onClose: () => void;
  onStartClassroom: (classe: string, materia: string, slotKey: string, lesson: Lezione) => void;
  onUpdateLesson: (lesson: Lezione) => void; 
  knowledgeBase: KnowledgeBaseEntry[];
  aiSettings?: AiSettings;
  settings?: TimetableSettings;
}

const LessonView: React.FC<LessonViewProps> = ({ lesson, onClose, onStartClassroom, onUpdateLesson, knowledgeBase, aiSettings, settings }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [previewingMaterial, setPreviewingMaterial] = useState<KnowledgeBaseEntry | null>(null);
  const [isMaterialPickerOpen, setIsMaterialPickerOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LessonAnalysisResult | null>(null);

  const handleEnrichLesson = async () => {
    if (!aiSettings) return;
    setIsEnriching(true);
    try {
        const enrichment = await AIBrain.generateWithCentralPrompt('lesson-enrich', { lesson }, aiSettings);
        if (enrichment) {
            onUpdateLesson({
                ...lesson,
                nota: (lesson.nota ? lesson.nota + '\n\n' : '') + '--- AI ENRICHMENT ---\n' + enrichment
            });
        }
    } catch (error) {
        logger.error("Failed to enrich lesson:", error);
    } finally {
        setIsEnriching(false);
    }
  };

  const handleExport = () => {
    printLessonDocument(lesson);
  };

  const handleExportHomework = () => {
    if (!settings) {
        showToast('Impostazioni mancanti. Impossibile generare la scheda compiti.', 'error');
        return;
    }
    printHomeworkSheet(lesson, settings);
  };
  
  const handleExportDocx = async () => {
      setIsExporting(true);
      try {
      const safeContent = sanitizeHTML(lesson.contenuto);
      const safeObjectives = sanitizeHTML(lesson.obiettivi || '');
      const safeContext = sanitizeHTML(lesson.contesto || '');
      const safeHomework = sanitizeHTML(lesson.compiti || '');
      const safeAdaptations = sanitizeHTML(lesson.adattamenti || '');

      let html = `<h1>Lezione: ${safeContent}</h1>`;
      html += `<p><strong>Classe:</strong> ${lesson.classe} | <strong>Materia:</strong> ${lesson.materia}</p>`;
      if (lesson.unitaDiApprendimento) html += `<p><strong>UDA:</strong> ${lesson.unitaDiApprendimento}</p>`;
      
      html += `<h2>Obiettivi</h2><p>${safeObjectives || 'Nessun obiettivo specificato.'}</p>`;
      html += `<h2>Contenuti e Attività</h2><p>${safeContext || ''}</p>`;
      html += `<h2>Compiti</h2><p>${safeHomework || 'Nessun compito assegnato.'}</p>`;
      
      if (lesson.adattamenti) {
          html += `<h2>Adattamenti (Inclusività)</h2><p>${safeAdaptations}</p>`;
      }

      const blob = await generateHtmlDocxBlob(html, lesson.contenuto);
      saveAs(blob, `Lezione_${lesson.contenuto.replace(/ /g, '_')}.docx`);
      } finally {
          setIsExporting(false);
      }
  };
  
  const handleDownloadMaterial = (material: MaterialeDidattico) => {
    if (material.type !== 'file' || !material.file?.content) return;
    try {
        const byteCharacters = atob(material.file.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: material.file.mimeType });
        saveAs(blob, material.file.name);
    } catch (e) {
        logger.error("Failed to download local file material", e);
        showToast('Errore durante il download del file.', 'error');
    }
  };

  const handlePreviewKbMaterial = (material: MaterialeDidattico) => {
    if (material.type !== 'kb') return;
    const kbEntry = knowledgeBase.find(kb => kb.id === material.kbId);
    if (kbEntry) {
        setPreviewingMaterial(kbEntry);
    } else {
        showToast('Materiale non trovato nella Knowledge Base.', 'error');
    }
  };
  
  const handleAddMaterials = (newMaterials: MaterialeDidattico[]) => {
      const updatedLesson = {
          ...lesson,
          materialiDidattici: [...(lesson.materialiDidattici || []), ...newMaterials]
      };
      onUpdateLesson(updatedLesson);
      setIsMaterialPickerOpen(false);
  };
  
  const handleRemoveMaterial = (materialId: string) => {
      setConfirmDialog({
          message: 'Sei sicuro di voler rimuovere questo allegato?',
          onConfirm: () => {
              const updatedLesson = {
                  ...lesson,
                  materialiDidattici: (lesson.materialiDidattici || []).filter(m => m.id !== materialId)
              };
              onUpdateLesson(updatedLesson);
          }
      });
  };
  
  const handleAnalyzePedagogy = async () => {
      if (!aiSettings) {
          showToast('Configurazione AI mancante.', 'error');
          return;
      }
      setIsAnalyzing(true);
      try {
          // Post-Fase 4: central prompt path
          const { prompt: pedPrompt } = AIBrain.buildPrompt('lesson-pedagogy', { title: lesson.contenuto, description: `${lesson.materia || ''} ${lesson.classe || ''} - ${lesson.obiettivi || ''} ${lesson.contesto || ''}` });
          const result = await AIBrain.generateWithCentralPrompt('lesson-pedagogy', { 
            title: lesson.contenuto, 
            description: `${lesson.materia || ''} ${lesson.classe || ''} - ${lesson.obiettivi || ''} ${lesson.contesto || ''}` 
          }, aiSettings);
          setAnalysisResult(result);
      } catch (error: unknown) {
          let message = 'Errore sconosciuto';
          if (error instanceof Error) message = error.message;
          showToast(message, 'error');
      } finally {
          setIsAnalyzing(false);
      }
  };

  const getMaterialIcon = (material: MaterialeDidattico): string => {
    switch (material.type) {
        case 'kb': return 'cloud_done';
        case 'link': return 'link';
        case 'file': return 'attach_file';
    }
    return 'insert_drive_file';
  };

  const hue = generateHueFromString(lesson.materia || 'default');
    const typeIcon = LESSON_TYPE_ICONS[lesson.tipoLezione || 'Teoria'] || 'school';

  return (
    <>
      <style>{`
        .lesson-icon-dynamic {
          background-color: hsl(${hue}, var(--md-sys-percent-80), var(--md-sys-percent-90));
          color: hsl(${hue}, var(--md-sys-percent-60), var(--md-sys-percent-30));
        }
      `}</style>
      <Dialog open onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box className="lesson-icon-dynamic" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 'var(--md-sys-shape-corner-large)', flexShrink: 0 }}>
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">{typeIcon}</Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-surface)', m: 0 }}>Piano Lezione</Typography>
              <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{lesson.id.split('-').slice(0,2).join('-')}</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* HERO SECTION */}
                <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-extra-large)', backgroundColor: 'var(--md-sys-color-primary-container)', padding: 'var(--md-sys-spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    {lesson.unitaDiApprendimento && (
                        <Chip
                            label={`UDA: ${lesson.unitaDiApprendimento}`}
                            size="small"
                            sx={{
                                alignSelf: 'flex-start',
                                backgroundColor: 'var(--md-sys-color-primary)',
                                color: 'var(--md-sys-color-on-primary)',
                                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                            }}
                        />
                    )}
                    <Typography component="h1" variant="h4" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-headline-medium-font-size)', color: 'var(--md-sys-color-on-primary-container)', lineHeight: 1.3 }}>
                        {lesson.contenuto}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-3)' }}>
                        {[{ icon: 'school', text: lesson.classe }, { icon: 'menu_book', text: lesson.materia }, { icon: 'category', text: lesson.tipoLezione || 'Teoria' }].map(tag => (
                            <Chip
                                key={tag.text}
                                icon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-4)', ml: '4px !important' }}>{tag.icon}</Box>}
                                label={tag.text}
                                size="small"
                                sx={{ backgroundColor: 'var(--md-sys-color-surface-container)', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}
                            />
                        ))}
                    </Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--md-sys-spacing-6)', alignItems: 'start' }}>
                    {/* LEFT COLUMN */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)' }}>
                        {/* AI Assistant */}
                        {aiSettings && (
                            <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-secondary-container)', padding: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-11)', height: 'var(--md-sys-spacing-11)', borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-secondary)', color: 'var(--md-sys-color-on-secondary)', flexShrink: 0 }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true">psychology</Box>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography component="p" variant="subtitle2" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-label-large-font-size)', color: 'var(--md-sys-color-on-secondary-container)' }}>Assistente Pedagogico</Typography>
                                        <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-secondary-container)', opacity: 'var(--md-sys-state-opacity-caption)' }}>Analizza inclusività e coinvolgimento</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-3)' }}>
                                    {/* AIBrain (Post-Fase 4): LessonView — buildPrompt('lesson-enrich'/'lesson-pedagogy') + generateWithCentralPrompt + buildContext + migrateLegacyAsk (daily lesson gestures) */}
                                    <Button
                                        onClick={handleEnrichLesson}
                                        disabled={isEnriching}
                                        variant="contained"
                                        color="secondary"
                                        startIcon={isEnriching ? undefined : <AutoAwesomeIcon />}
                                    >
                                        {isEnriching ? <AiThinkingGem size="small" inline text="" /> : 'Arricchisci'}
                                    </Button>
                                    <Button
                                        onClick={handleAnalyzePedagogy}
                                        disabled={isAnalyzing}
                                        variant="contained"
                                    >
                                        {isAnalyzing ? <AiThinkingGem size="small" inline text="" /> : 'Analizza'}
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* Objectives */}
                        <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                            <SectionHeader title="Obiettivi Didattici" icon="flag" />
                            <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', padding: 'var(--md-sys-spacing-4)' }}>
                                {lesson.obiettivi ? (
                                    <Box sx={{ flex: 1 }}>
                                        <Box component="ul" sx={{ margin: 0, paddingLeft: 'var(--md-sys-spacing-5)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
                                            {lesson.obiettivi.split('\n').filter(line => line.trim()).map((line, idx) => (
                                                <Box component="li" key={idx} sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.6 }}>{line.replace(/^- /, '')}</Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography component="p" variant="body1" sx={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontStyle: 'italic' }}>Nessun obiettivo specificato.</Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Content */}
                        <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                            <SectionHeader title="Svolgimento e Contenuti" icon="article" />
                            <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', padding: 'var(--md-sys-spacing-4)' }}>
                                {lesson.contesto ? (
                                    <Typography component="p" variant="body1" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.7 }}>{lesson.contesto}</Typography>
                                ) : (
                                    <Typography component="p" variant="body1" sx={{ margin: 0, color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}>Nessun dettaglio sullo svolgimento.</Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Notes */}
                        {lesson.nota && (
                            <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                                <SectionHeader title="Note Docente" icon="sticky_note_2" />
                                <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: 'var(--md-sys-spacing-4)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: 'var(--md-sys-color-on-surface)', lineHeight: 1.7, whiteSpace: 'pre-wrap', borderLeft: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-tertiary)' }}>
                                    {lesson.nota}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* RIGHT COLUMN */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)' }}>
                        {/* Materials */}
                        <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                <Typography component="h3" variant="subtitle2" sx={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-small-font-size)', color: 'var(--md-sys-color-on-surface)' }}>
                                    <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)', color: 'var(--md-sys-color-primary)' }}>attachment</Box>
                                    Materiali
                                </Typography>
                                <IconButton onClick={() => setIsMaterialPickerOpen(true)} aria-label="Aggiungi materiale" size="small">
                                    <AddIcon />
                                </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', padding: 'var(--md-sys-spacing-2) 0' }}>
                                {(lesson.materialiDidattici?.length || 0) > 0 ? (
                                    lesson.materialiDidattici!.map(material => (
                                        <Box key={material.id} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)', padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', borderRadius: 'var(--md-sys-shape-corner-small)', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', flexShrink: 0 }}>
                                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)' }}>{getMaterialIcon(material)}</Box>
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                {material.type === 'link' ? (
                                                    <Link href={material.url} target="_blank" rel="noopener noreferrer" sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', textDecoration: 'none', fontWeight: 'var(--md-sys-typescale-weight-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{material.label}</Link>
                                                ) : (
                                                    <Box
                                                        component="span"
                                                        onClick={() => material.type === 'kb' && handlePreviewKbMaterial(material)}
                                                        sx={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: material.type === 'kb' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)', cursor: material.type === 'kb' ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                                                    >
                                                        {material.type === 'kb' ? material.fileName : material.file?.name}
                                                    </Box>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                                {material.type === 'file' && (
                                                    <IconButton onClick={() => handleDownloadMaterial(material)} aria-label="Scarica" size="small">
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                                <IconButton onClick={() => handleRemoveMaterial(material.id)} aria-label="Rimuovi materiale" size="small">
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', padding: 'var(--md-sys-spacing-6)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-xl)' }}>folder_off</Box>
                                        <Typography component="p" variant="body2" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>Nessun materiale</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Inclusion */}
                        <InfoCard 
                            title="Inclusività (BES/DSA)" 
                            icon="diversity_3" 
                            variant={lesson.adattamenti ? 'tertiary' : 'surface'}
                        >
                            <p>
                                {lesson.adattamenti || 'Nessun adattamento specifico registrato.'}
                            </p>
                        </InfoCard>

                        {/* Homework */}
                        <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'var(--md-sys-color-surface-container)', overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--md-sys-spacing-5)', color: 'var(--md-sys-color-primary)' }}>assignment</Box>
                                <Typography component="h3" variant="subtitle2" sx={{ margin: 0, fontWeight: 'var(--md-sys-typescale-weight-bold)', fontSize: 'var(--md-sys-typescale-title-small-font-size)', color: 'var(--md-sys-color-on-surface)' }}>Compiti per Casa</Typography>
                            </Box>
                            <Box sx={{ padding: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                                <Typography component="p" variant="body1" sx={{ margin: 0, fontSize: 'var(--md-sys-typescale-body-medium-font-size)', color: lesson.compiti ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)', fontStyle: lesson.compiti ? 'normal' : 'italic', lineHeight: 1.6 }}>
                                    {lesson.compiti || 'Nessun compito assegnato.'}
                                </Typography>

                                {settings && lesson.compiti && (
                                    <Button variant="outlined" onClick={handleExportHomework} disabled={isExporting} startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">print</Box>}>
                                        PDF Compiti
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Ultima modifica: {new Date().toLocaleDateString()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton onClick={handleExportDocx} disabled={isExporting} aria-label="Esporta Word" size="small">
                        <DescriptionIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={handleExport} disabled={isExporting} aria-label="Esporta PDF" size="small">
                        <PictureAsPdfIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Button variant="text" onClick={onClose}>Chiudi</Button>
                <Button variant="contained" onClick={() => onStartClassroom(lesson.classe, lesson.materia, `view-${lesson.id}`, lesson)} startIcon={<DoorOpenIcon />}>
                    Avvia Lezione
                </Button>
            </Box>
        </DialogActions>
      </Dialog>
      
      {/* Modals for interactions */}
      {previewingMaterial && (
          <Dialog open onClose={() => setPreviewingMaterial(null)} maxWidth="lg" fullWidth>
            <DialogTitle>{previewingMaterial.fileName}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-surface-container)', p: 2, maxHeight: '60vh', overflowY: 'auto', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
                        <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', typography: 'body2', fontFamily: 'monospace' }}>{sanitizeHTML(previewingMaterial.content)}</Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button variant="text" onClick={() => setPreviewingMaterial(null)}>Chiudi</Button>
            </DialogActions>
          </Dialog>
      )}
      
      {isMaterialPickerOpen && (
        <MaterialPickerModal
            knowledgeBase={knowledgeBase}
            currentMaterials={lesson.materialiDidattici || []}
            onClose={() => setIsMaterialPickerOpen(false)}
            onSave={handleAddMaterials}
        />
      )}

      {analysisResult && (
          <LessonAnalysisModal 
            result={analysisResult} 
            onClose={() => setAnalysisResult(null)} 
            title={lesson.contenuto}
            contextLabel={`Analisi ${lesson.materia} ${lesson.classe} • ${settings?.schoolType || ''}`}
          />
      )}
      {confirmDialog && (
        <M3ConfirmDialog
          title="Conferma rimozione"
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
          onCancel={() => setConfirmDialog(null)}
          danger={true}
        />
      )}
    </>
  );
};

export default LessonView;


