// MD3 Compliant - Block J Migration Complete (4 violations eliminated)
import React, { useState, useMemo } from 'react';
import { Studente, Lezione, Uda, TimetableSettings, AiSettings, Valutazione, ValutazioneCompetenza, DocumentTemplate } from '../types';
import { generateHtmlDocxBlob } from '../utils/documentUtils';
import { saveAs } from '../utils/documentUtils';
import { buildStudentProfileHtmlBlob, buildLessonHtmlBlob } from '../utils/printUtils';
import { useSystemStore } from '../stores/useSystemStore';
import { useUIStore } from '../stores/useUIStore';
import TemplateManager from './TemplateManager';
import JSZip from 'jszip';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog } from './ui';
import { logger } from '../utils/logger';
// Type guards migliorati
const isStudent = (data: unknown): data is Studente => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'nome' in data &&
    'cognome' in data &&
    typeof (data as Record<string, unknown>).nome === 'string' &&
    typeof (data as Record<string, unknown>).cognome === 'string'
  );
};

const isLesson = (data: unknown): data is Lezione => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'contenuto' in data &&
    'materia' in data &&
    typeof (data as Record<string, unknown>).contenuto === 'string' &&
    typeof (data as Record<string, unknown>).materia === 'string'
  );
};

const isUda = (data: unknown): data is Uda => {
  return (
    data !== null &&
    typeof data === 'object' &&
    'title' in data &&
    'classe' in data &&
    typeof (data as Record<string, unknown>).title === 'string' &&
    typeof (data as Record<string, unknown>).classe === 'string'
  );
};

// Tipi per l'export multiplo
export interface BatchDocument {
  id: string;
  type: 'student_profile' | 'lesson_plan' | 'uda' | 'syllabus' | 'council_report';
  title: string;
  subtitle: string;
  data: Studente | Lezione | Uda | { class: string; subject: string; lessons: Lezione[] }; // Tipi specifici invece di any
  format: 'pdf' | 'docx';
  selected: boolean;
}

interface BatchExportWizardProps {
  onClose: () => void;
  students: Studente[];
  lessons: Record<string, Lezione>;
  uda: Uda[];
  evaluations: Valutazione[];
  competencyEvaluations: ValutazioneCompetenza[];
  settings: TimetableSettings;
  aiSettings: AiSettings;
  userClasses: string[];
}

const BatchExportWizard: React.FC<BatchExportWizardProps> = (props) => {
  const [selectedDocuments, setSelectedDocuments] = useState<BatchDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentDoc: string } | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplate | null>(null);

  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const { trackAnalyticsEvent } = useSystemStore(state => ({ trackAnalyticsEvent: state.actions.trackAnalyticsEvent }));

  // Track apertura wizard
  React.useEffect(() => {
    trackAnalyticsEvent('feature_usage', 'batch_export_wizard');
  }, [trackAnalyticsEvent]);

  // Genera la lista di tutti i documenti disponibili
  const availableDocuments = useMemo((): BatchDocument[] => {
    const docs: BatchDocument[] = [];

    // Profili Studente
    props.students.forEach(student => {
      docs.push({
        id: `student-${student.id}`,
        type: 'student_profile',
        title: `Profilo ${student.cognome} ${student.nome}`,
        subtitle: `Classe ${student.classe}`,
        data: student,
        format: 'pdf',
        selected: false
      });
    });

    // Piani Lezione
    Object.values(props.lessons).forEach(lesson => {
      docs.push({
        id: `lesson-${lesson.id}`,
        type: 'lesson_plan',
        title: `Piano: ${lesson.contenuto}`,
        subtitle: `${lesson.materia} - ${lesson.classe}`,
        data: lesson,
        format: 'pdf',
        selected: false
      });
    });

    // UDA
    props.uda.forEach(uda => {
      docs.push({
        id: `uda-${uda.id}`,
        type: 'uda',
        title: `UDA: ${uda.title}`,
        subtitle: `Classe ${uda.classe}`,
        data: uda,
        format: 'docx', // Corretto: UDA genera DOCX
        selected: false
      });
    });

    return docs;
  }, [props.students, props.lessons, props.uda]);

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.some(d => d.id === docId)
        ? prev.filter(d => d.id !== docId)
        : [...prev, availableDocuments.find(d => d.id === docId)!]
    );
  };

  const selectAll = () => {
    setSelectedDocuments(availableDocuments);
  };

  const selectNone = () => {
    setSelectedDocuments([]);
  };

  const handleApplyTemplate = (template: DocumentTemplate) => {
    setActiveTemplate(template);
    setShowTemplateManager(false);

    // Filtra la selezione ai documenti compatibili con il tipo del template
    const compatible = availableDocuments.filter(d => d.type === template.type);
    if (compatible.length === 0) {
      showToast(`Nessun documento compatibile con il template "${template.name}" (tipo: ${template.type}).`, 'info');
      return;
    }

    // Se erano già selezionati solo documenti compatibili, mantienili; altrimenti seleziona tutti compatibili
    const currentCompatibleSelected = selectedDocuments.filter(d => d.type === template.type);
    setSelectedDocuments(currentCompatibleSelected.length > 0 ? currentCompatibleSelected : compatible);

    showToast(
      `Template "${template.name}" applicato: ${compatible.length} documenti compatibili selezionati.`,
      'success'
    );
  };

  const generateBatch = async () => {
    if (selectedDocuments.length === 0) {
      showToast('Seleziona almeno un documento da generare', 'info');
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: selectedDocuments.length, currentDoc: '' });

    // Track inizio generazione batch
    trackAnalyticsEvent('export_batch', 'batch_generation', {
      documentCount: selectedDocuments.length,
      documentTypes: selectedDocuments.map(d => d.type).join(', ')
    });

    try {
      const generatedFiles: { name: string; blob: Blob }[] = [];

      for (let i = 0; i < selectedDocuments.length; i++) {
        const doc = selectedDocuments[i];
        setProgress({ current: i + 1, total: selectedDocuments.length, currentDoc: doc.title });
        // Yield to event loop so React can render the progress indicator
        await new Promise(resolve => setTimeout(resolve, 0));

        let blob: Blob;
        let fileName: string;

        switch (doc.type) {
          case 'student_profile': {
            if (!isStudent(doc.data)) continue;
            const student = doc.data;
            const studentEvals = props.evaluations.filter(e => e.studenteId === student.id);
            const studentCompEvals = props.competencyEvaluations.filter(e => e.studenteId === student.id);
            blob = buildStudentProfileHtmlBlob(student, studentEvals, studentCompEvals, props.settings);
            fileName = `Profilo_${student.cognome}_${student.nome}.html`;
            break;
          }

          case 'lesson_plan': {
            if (!isLesson(doc.data)) continue;
            const lesson = doc.data;
            blob = buildLessonHtmlBlob(lesson);
            fileName = `Piano_Lezione_${lesson.id}.html`;
            break;
          }

          case 'uda': {
            if (!isUda(doc.data)) continue;
            const uda = doc.data;
            const udaConfig = activeTemplate?.type === 'uda' ? activeTemplate.config : null;
            const udaHtml = `
              <h1>${uda.title}</h1>
              <p><strong>Classe:</strong> ${uda.classe}</p>
              ${udaConfig?.customIntroduction ? `<p>${udaConfig.customIntroduction}</p>` : ''}
              <p><strong>Descrizione:</strong> ${uda.introduction || 'N/A'}</p>
              <p><strong>Obiettivi:</strong> ${uda.evaluation || 'N/A'}</p>
              ${udaConfig?.includePhases && uda.phases?.length ? `<h2>Fasi</h2><ul>${uda.phases.map((p: { title: string; description: string; activities: string; duration: string }) => `<li><strong>${p.title}</strong> (${p.duration}h): ${p.description}</li>`).join('')}</ul>` : ''}
              ${udaConfig?.customConclusion ? `<p>${udaConfig.customConclusion}</p>` : ''}
            `;
            blob = await generateHtmlDocxBlob(udaHtml, `UDA_${uda.title}`);
            fileName = `UDA_${uda.title.replace(/\s+/g, '_')}.docx`;
            break;
          }

          default:
            throw new Error(`Tipo documento non supportato: ${doc.type}`);
        }

        generatedFiles.push({ name: fileName, blob });

        // Track generazione documento
        trackAnalyticsEvent('document_generated', doc.type, {
          format: doc.format,
          source: 'batch_export'
        });
      }

      if (generatedFiles.length > 1) {
        const zip = new JSZip();
        generatedFiles.forEach(file => {
          zip.file(file.name, file.blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'Documenti_Export.zip');
      } else if (generatedFiles.length === 1) {
        saveAs(generatedFiles[0].blob, generatedFiles[0].name);
      }

      showToast(`Generati con successo ${generatedFiles.length} documenti!`, "success");
      props.onClose();

    } catch (error) {
      logger.error("Errore generazione batch:", error);
      showToast("Errore durante la generazione dei documenti. Riprova.", "error");
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, BatchDocument[]> = {};
    availableDocuments.forEach(doc => {
      const groupKey = doc.type === 'student_profile' ? 'Profili Studente' :
                      doc.type === 'lesson_plan' ? 'Piani Lezione' :
                      doc.type === 'uda' ? 'UDA' : 'Altri';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(doc);
    });
    return groups;
  }, [availableDocuments]);

  return (
    <M3Dialog
      title="Export Multiplo Documenti"
      onClose={props.onClose}
      maxWidth="xl"
      buttons={<>
          <Button onClick={props.onClose} variant="text" disabled={isGenerating}>Annulla</Button>
          <Button
            onClick={generateBatch}
            variant="contained"
            disabled={isGenerating || selectedDocuments.length === 0}
          >
            {isGenerating ? `Generazione... (${progress?.current || 0}/${progress?.total || 0})` : `Genera ${selectedDocuments.length} Documenti`}
          </Button>
      </>}
    >
      <>
          {/* Progress Bar durante generazione */}
          {progress && (
            <div style={{ backgroundColor: 'var(--md-sys-color-on-primary)', borderRadius: 'var(--md-sys-shape-corner-large)' , padding: 'var(--md-sys-spacing-8)'}}>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 'var(--md-sys-spacing-8)'}}>
                <span  style={{ fontWeight: "var(--md-sys-typescale-weight-medium)" }}>Generazione in corso...</span>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{progress.current}/{progress.total}</span>
              </div>
              <div style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' , width: 'var(--md-sys-percent-100)', borderRadius: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-2)', marginBottom: 'var(--md-sys-spacing-8)'}}>
                <div
                   style={{backgroundColor: "var(--md-sys-color-primary)", height: 'var(--md-sys-spacing-2)', borderRadius: 'var(--md-sys-spacing-4)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{progress.currentDoc}</Typography>
            </div>
          )}

          {/* Controlli selezione */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
              <span  style={{ fontWeight: "var(--md-sys-typescale-weight-medium)" }}>
                Selezionati: {selectedDocuments.length} di {availableDocuments.length}
              </span>
              <div style={{display: "flex", gap: 'var(--md-sys-spacing-8)'}}>
                <Button onClick={selectAll} variant="text"  disabled={isGenerating}>
                  Seleziona Tutto
                </Button>
                <Button onClick={selectNone} variant="text"  disabled={isGenerating}>
                  Deseleziona Tutto
                </Button>
                <Button
                  onClick={() => {
                    setShowTemplateManager(true);
                    trackAnalyticsEvent('feature_usage', 'template_manager');
                  }}
                  variant={activeTemplate ? 'contained' : 'outlined'}
                  disabled={isGenerating}
                  startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">description</Box>}
                >
                  {activeTemplate ? `Template: ${activeTemplate.name}` : 'Template'}
                </Button>
                {activeTemplate && (
                  <Button
                    onClick={() => { setActiveTemplate(null); }}
                    variant="text"
                    disabled={isGenerating}
                    aria-label="Rimuovi template attivo"
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true">close</Box>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lista documenti raggruppati */}
          <div  style={{gap: 'var(--md-sys-spacing-4)', overflowY: "auto"}}>
            {Object.entries(groupedDocuments).map(([groupName, docs]) => (
              <div key={groupName}>
                <Typography component="h3" variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-small-tracking)", marginBottom: 'var(--md-sys-spacing-8)'}}>
                  {groupName} ({docs.length})
                </Typography>
                <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)'}}>
                  {docs.map(doc => {
                    const isSelected = selectedDocuments.some(d => d.id === doc.id);
                    return (
                      <div
                        key={doc.id}
                        style={{
                          padding: 'var(--md-sys-spacing-6)',
                          border: isSelected ? 'var(--md-sys-border-width-thick) solid var(--md-sys-color-primary)' : 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)',
                          borderRadius: 'var(--md-sys-shape-corner-small)',
                          cursor: isGenerating ? 'not-allowed' : 'pointer',
                          transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                          backgroundColor: isSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent',
                          opacity: isGenerating ? 0.6 : 1
                        }}
                        onClick={() => !isGenerating && toggleDocumentSelection(doc.id)}
                      >
                        <div style={{display: "flex", alignItems: "flex-start", gap: 'var(--md-sys-spacing-6)'}}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            disabled={isGenerating}
                            
                            aria-label={`Seleziona ${doc.title}`}
                          />
                          <div style={{ flex: "1", minWidth: "0" }}>
                            <Typography component="p" variant="body1" sx={{ fontWeight: "var(--md-sys-typescale-weight-medium)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</Typography>
                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.subtitle}</Typography>
                            <span style={{
                              display: 'inline-block',
                              padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-4)',
                              marginTop: 'var(--md-sys-spacing-4)',
                              borderRadius: 'var(--md-sys-shape-corner-full)',
                              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                              fontWeight: 'var(--md-sys-typescale-label-small-font-weight)',
                              lineHeight: 'var(--md-sys-typescale-label-large-line-height)',
                              backgroundColor: doc.format === 'pdf' ? 'var(--md-sys-color-error-container)' : 'var(--md-sys-color-primary-container)',
                              color: doc.format === 'pdf' ? 'var(--md-sys-color-on-error-container)' : 'var(--md-sys-color-on-primary-container)'
                            }}>
                              {doc.format.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
      </>

      {/* Template Manager */}
      {showTemplateManager && (
        <TemplateManager
          onClose={() => setShowTemplateManager(false)}
          onApplyTemplate={handleApplyTemplate}
        />
      )}
    </M3Dialog>
  );
};

export default BatchExportWizard;

