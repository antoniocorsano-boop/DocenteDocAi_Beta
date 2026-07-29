// MD3 Compliant - Block M Migration (13 violations eliminated)
// Note: Typography font sizes and functional border radius retained with eslint-disable comments
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Studente, DidatticaInclusivaProps } from '../types';
import HubShell from './ui/HubShell';
import PianoInclusioneEditor from './PianoInclusioneEditor';
import { calculatePerformance } from '../utils/evaluationUtils';
import { InfoCard, EmptyState, Avatar } from './ui';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Fase 3 (sequenza): Central buildContext + unified recommendations
import { AIBrain } from '../ai/brain/AIBrain';

const DidatticaInclusiva: React.FC<DidatticaInclusivaProps> = (props) => {
  const { students, pianiInclusione, onSavePiano, studentToEdit, onClearStudentToEdit, evaluations, onNavigate } = props;
    const [editingStudent, setEditingStudent] = useState<Studente | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'suggested'>('overview');

    // Fase 3 (sequenza): useMemo for central AIBrain APIs (no module-level calls)
    const inclusivaContext = useMemo(() => AIBrain.buildContext({ source: 'didattica-inclusiva' }), []);
    const inclusivaRecs = useMemo(() => AIBrain.getUnifiedRecommendations(inclusivaContext), [inclusivaContext]);

    // Fase 3 continuation: Real AIBrain.ask consumption (user-centric daily gesture for inclusion strategies)
    const [inclusivaAiSuggestion, setInclusivaAiSuggestion] = useState<string | null>(null);
    const [inclusivaAiLoading, setInclusivaAiLoading] = useState(false);

    const fetchInclusivaAiSuggestion = useCallback(async () => {
      setInclusivaAiLoading(true);
      try {
        const ctx = AIBrain.buildContext({
          source: 'didattica-inclusiva',
          extra: { activePlans: activePlansStudents.length, suggested: suggestedStudents.length }
        });
        const res = await AIBrain.ask({
          prompt: 'Suggerisci una strategia rapida di inclusione o supporto per studenti senza piano attivo.',
          context: ctx,
          mode: 'balanced'
        });
        setInclusivaAiSuggestion(res.content);
      } catch {
        setInclusivaAiSuggestion('Impossibile ottenere suggerimento AI.');
      } finally {
        setInclusivaAiLoading(false);
      }
    }, [activePlansStudents.length, suggestedStudents.length]);

    useEffect(() => {
        if (studentToEdit) {
            setEditingStudent(studentToEdit);
        }
    }, [studentToEdit]);

    const handleCloseEditor = () => {
        setEditingStudent(null);
        if (onClearStudentToEdit) {
            onClearStudentToEdit();
        }
    };

    const studentsByClass = useMemo(() => {
        return students.reduce((acc, student) => {
            (acc[student.classe] = acc[student.classe] || []).push(student);
            return acc;
        }, {} as Record<string, Studente[]>);
    }, [students]);

    const activePlansStudents = useMemo(() => {
        return students.filter(s => !!pianiInclusione[s.id]);
    }, [students, pianiInclusione]);

    const suggestedStudents = useMemo(() => {
        return students.filter(s => {
            const hasPlan = !!pianiInclusione[s.id];
            if (hasPlan) return false;
            const studentEvals = evaluations.filter(e => e.studenteId === s.id);
            const { grade } = calculatePerformance(s.id, 'Complessivo', studentEvals);
            return grade && parseFloat(grade) < 6;
        });
    }, [students, pianiInclusione, evaluations]);

    const sortedClasses = Object.keys(studentsByClass).sort();

    const renderOverview = () => (
        <div style={{marginTop: 'var(--md-sys-spacing-8)'}}>
            <InfoCard
                variant="tertiary"
                sx={{padding: 'var(--md-sys-spacing-5)'}}
            >
                <div style={{display: "flex", alignItems: "flex-start", gap: 'var(--md-sys-spacing-8)'}}>
                    <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-tertiary) 10%, transparent)', width: 'var(--md-sys-spacing-8)', height: 'var(--md-sys-spacing-8)', display: "flex", alignItems: "center", justifyContent: "center", color: "var(--md-sys-color-tertiary)"}}>
                        <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ color: 'var(--md-sys-color-on-tertiary)' }}>folder_shared</Box>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Typography component="h3" variant="h6" sx={{ fontSize: "var(--md-sys-typescale-title-large-font-size)" , color: "var(--md-sys-color-tertiary)", marginBottom: 'var(--md-sys-spacing-4)'}}>Gestione Piani Centralizzata</Typography>
                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Crea o modifica PDP/PEI per ogni studente. L'AI ti guida nella compilazione suggerendo strategie personalizzate.</Typography>
                    </div>
                </div>
            </InfoCard>

            {sortedClasses.map(className => (
                <div key={className} style={{marginTop: 'var(--md-sys-spacing-4)'}}>
                    <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)', paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)'}}>
                        <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-outline-variant) 30%, transparent)' ,  flexGrow: "1" }}></div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: "var(--md-sys-typescale-body-medium-font-size)", fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-large-tracking)" }}>Classe {className}</span>
                        <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-outline-variant) 30%, transparent)' ,  flexGrow: "1" }}></div>
                    </div>
                    
                    <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)'}}>
                        {studentsByClass[className].sort((a, b) => a.cognome.localeCompare(b.cognome)).map(student => {
                            const hasPlan = !!pianiInclusione[student.id];
                            return (
                                <InfoCard 
                                    key={student.id} 
                                    elevation={1}
                                     sx={{ transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', cursor: "pointer" }}
                                    onClick={() => setEditingStudent(student)}
                                >
                                    <div style={{padding: 'var(--md-sys-spacing-8)', display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                                        <Avatar name={`${student.nome} ${student.cognome}`} size="md" />
                                        <div style={{ flexGrow: "1", minWidth: "0" }}>
                                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-bold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.cognome} {student.nome}</Typography>
                                            <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)', marginTop: 'var(--md-sys-spacing-4)'}}>
                                                {hasPlan ? (
                                                    <span style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-tertiary-container) 50%, transparent)' , fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-small-tracking)", color: "var(--md-sys-color-tertiary)", paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', borderRadius: 'var(--md-sys-spacing-4)'}}>
                                                        Piano Attivo
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)' , fontWeight: "var(--md-sys-typescale-weight-bold)", textTransform: "uppercase", letterSpacing: "var(--md-sys-typescale-label-small-tracking)", paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", borderRadius: 'var(--md-sys-spacing-4)'}}>
                                                        Standard
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{
                                            width: 'var(--md-sys-spacing-10)',
                                            height: 'var(--md-sys-spacing-10)',
                                            
                                            borderRadius: 'var(--md-sys-shape-corner-full)',
                                            
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
                                            backgroundColor: hasPlan ? 'var(--md-sys-color-tertiary-container)' : 'var(--md-sys-color-surface-container-high)',
                                            color: hasPlan ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-on-surface-variant)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!hasPlan) {
                                                e.currentTarget.style.backgroundColor = 'var(--md-sys-color-primary-container)';
                                                e.currentTarget.style.color = 'var(--md-sys-color-primary)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!hasPlan) {
                                                e.currentTarget.style.backgroundColor = 'var(--md-sys-color-surface-container-high)';
                                                e.currentTarget.style.color = 'var(--md-sys-color-on-surface-variant)';
                                            }
                                        }}>
                                            <span style={{
}}>{hasPlan ? 'edit' : 'add'}</span>
                                        </div>
                                    </div>
                                </InfoCard>
                            );
                        })}
                    </div>
                </div>
            ))}
            {students.length === 0 && (
                <EmptyState
                    title="Nessuno studente"
                    description="Aggiungi i tuoi studenti dalla sezione Classi per iniziare a gestire l'inclusione."
                    icon="group_off"
                />
            )}
        </div>
    );

    const renderActivePlans = () => (
        <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)'}}>
            {activePlansStudents.length > 0 ? activePlansStudents.map(student => {
                return (
                    <InfoCard 
                        key={student.id} 
                        variant="outlined"
                         sx={{padding: 'var(--md-sys-spacing-8)', transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-medium) var(--md-sys-motion-easing-standard)', cursor: "pointer"}}
                        onClick={() => setEditingStudent(student)}
                    >
                        <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-8)'}}>
                            <Avatar name={`${student.nome} ${student.cognome}`} size="md" />
                            <div style={{ flexGrow: "1" }}>
                                <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-bold)" }}>{student.cognome} {student.nome}</Typography>
                                <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,  fontSize: "var(--md-sys-typescale-body-medium-font-size)" }}>Classe {student.classe}</Typography>
                            </div>
                            <Button variant="text" size="small">
                                Modifica
                            </Button>
                        </div>
                    </InfoCard>
                )
            }) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <EmptyState
                        title="Nessun piano attivo"
                        description="Non hai ancora creato nessun PDP o PEI."
                        icon="folder_off"
                    />
                </div>
            )}
        </div>
    );

    const renderSuggested = () => (
        <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-6)'}}>
            {suggestedStudents.length > 0 ? suggestedStudents.map(student => {
                const studentEvals = evaluations.filter(e => e.studenteId === student.id);
                const { grade } = calculatePerformance(student.id, 'Complessivo', studentEvals);

                return (
                    <InfoCard 
                        key={student.id} 
                        elevation={1}
                         sx={{ borderLeft: "var(--md-sys-border-width-normal) solid" }}
                    >
                        <div style={{padding: 'var(--md-sys-spacing-4)'}}>
                            <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 'var(--md-sys-spacing-8)'}}>
                                <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)'}}>
                                    <Avatar name={`${student.nome} ${student.cognome}`} size="md" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                        <Typography component="h3" variant="h6" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-bold)" }}>{student.cognome} {student.nome}</Typography>
                                        <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' ,   fontSize: "var(--md-sys-typescale-label-large-font-size)"  }}>Classe {student.classe}</Typography>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)' , color: "var(--md-sys-color-error)", paddingLeft: 'var(--md-sys-spacing-4)', paddingRight: 'var(--md-sys-spacing-4)',  borderRadius: "var(--md-sys-shape-corner-small)", fontSize: "var(--md-sys-typescale-label-large-font-size)" , fontWeight: "var(--md-sys-typescale-weight-bold)"}}>
                                    Media: {grade}
                                </div>
                            </div>
                            <Typography component="p" variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' , fontSize: "var(--md-sys-typescale-body-medium-font-size)", marginBottom: 'var(--md-sys-spacing-8)'}}>
                                Le performance recenti suggeriscono la necessit� di un piano personalizzato.
                            </Typography>
                            <Button 
                                onClick={() => setEditingStudent(student)} 
                                variant="outlined"
                                 sx={{ width: "var(--md-sys-percent-100)" }}
                            >\n                                <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ marginRight: "var(--md-sys-spacing-2)" }}>add_circle</Box>
                                Crea Piano
                            </Button>
                        </div>
                    </InfoCard>
                )
            }) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <EmptyState
                        title="Tutto sotto controllo"
                        description="Non ci sono studenti con media insufficiente sprovvisti di piano."
                        icon="check_circle"
                    />
                </div>
            )}
        </div>
    );

    return (
        <HubShell
            title="Didattica Inclusiva"
            subtitle="Piani personalizzati (PDP/PEI) e monitoraggio assistito dall'AI"
            icon="accessibility"
            onNavigate={onNavigate || (() => {})}
            aiContext={{ source: 'didattica-inclusiva' }}
        >
            <div style={{ marginTop: 'var(--md-sys-spacing-8)' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, v: string) => (id => setActiveTab(id as 'active' | 'overview' | 'suggested'))(v)}
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
                            { id: 'overview', label: 'Panoramica', icon: 'grid_view' },
                            { id: 'active', label: 'Piani Attivi', icon: 'description', badge: activePlansStudents.length > 0 ? activePlansStudents.length : undefined },
                            { id: 'suggested', label: 'Da Attenzionare', icon: 'warning', badge: suggestedStudents.length > 0 ? suggestedStudents.length : undefined }
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
                </div>
                <div style={{ marginTop: 'var(--md-sys-spacing-8)' }}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'active' && renderActivePlans()}
                    {activeTab === 'suggested' && renderSuggested()}
                </div>

                {/* Fase 3 (sequenza): Visible AIBrain unified recommendation in DidatticaInclusiva */}
                {inclusivaRecs?.primary && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 'var(--md-sys-shape-corner-medium)', bgcolor: 'var(--md-sys-color-tertiary-container)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-tertiary-container)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>
                      AIBrain (Fase 3): {inclusivaRecs.primary.label || inclusivaRecs.primary.title}
                    </Typography>
                  </Box>
                )}

                {/* Fase 3 continuation: Real AIBrain.ask consumption (visible daily gesture) */}
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={fetchInclusivaAiSuggestion}
                    disabled={inclusivaAiLoading}
                    startIcon={<Box component="span" className="material-symbols-outlined" sx={{ fontSize: '1rem' }}>auto_awesome</Box>}
                  >
                    {inclusivaAiLoading ? 'AIBrain…' : 'Suggerimento inclusione rapido (AIBrain)'}
                  </Button>
                  {inclusivaAiSuggestion && (
                    <Box sx={{ mt: 1, p: 1, borderRadius: 'var(--md-sys-shape-corner-small)', bgcolor: 'var(--md-sys-color-secondary-container)' }}>
                      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-secondary-container)' }}>
                        AIBrain (Fase 3): {inclusivaAiSuggestion}
                      </Typography>
                    </Box>
                  )}
                </Box>
            </div>
            {editingStudent && (
                <PianoInclusioneEditor
                    {...props}
                    student={editingStudent}
                    existingPiano={pianiInclusione[editingStudent.id]}
                    onClose={handleCloseEditor}
                    onSave={onSavePiano}
                />
            )}
        </HubShell>
    );
};

export default DidatticaInclusiva;


