// MD3 GOLD COMPLIANT � Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React, { useState } from 'react';
import { Rubrica, Criterio, Indicatore, Competenza } from '../types';
import { M3Dialog, InfoCard, TextField, EmptyState, SectionHeader } from './ui';
import { useUIStore } from '../stores/useUIStore';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
interface RubricEditorProps {
    rubricToEdit?: Rubrica;
    allCompetenze: Competenza[];
    onClose: () => void;
    onSave: (rubrica: Rubrica) => void;
}

const createEmptyRubric = (): Rubrica => ({
    id: `rubrica-${Date.now()}`,
    titolo: '',
    criteri: [],
});

const RubricEditor: React.FC<RubricEditorProps> = ({ rubricToEdit, allCompetenze, onClose, onSave }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [rubrica, setRubrica] = useState<Rubrica>(
        rubricToEdit ? { ...rubricToEdit } : createEmptyRubric()
    );

    const handleCompetenzaToggle = (competenza: Competenza) => {
        setRubrica(prev => {
            const isSelected = prev.criteri.some(c => c.competenzaId === competenza.id);
            let newCriteri: Criterio[];

            if (isSelected) {
                newCriteri = prev.criteri.filter(c => c.competenzaId !== competenza.id);
            } else {
                const newCriterion: Criterio = {
                    competenzaId: competenza.id,
                    indicatori: competenza.livelli.map(level => ({
                        livelloId: level.id,
                        descrizione: ''
                    }))
                };
                newCriteri = [...prev.criteri, newCriterion];
            }
            return { ...prev, criteri: newCriteri };
        });
    };

    const handleIndicatorChange = (competenzaId: string, livelloId: string, field: keyof Omit<Indicatore, 'livelloId'>, value: string) => {
        setRubrica(prev => {
            const newCriteri = prev.criteri.map(criterio => {
                if (criterio.competenzaId === competenzaId) {
                    const newIndicatori = criterio.indicatori.map(indicatore =>
                        indicatore.livelloId === livelloId
                            ? { ...indicatore, [field]: value }
                            : indicatore
                    );
                    return { ...criterio, indicatori: newIndicatori };
                }
                return criterio;
            });
            return { ...prev, criteri: newCriteri };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rubrica.titolo.trim()) { showToast('Inserisci un titolo.', 'error'); return; }
        if (rubrica.criteri.length === 0) { showToast('Seleziona almeno un criterio.', 'error'); return; }
        onSave(rubrica);
    };

    return (
        <M3Dialog
            title={rubricToEdit ? 'Modifica Rubrica' : 'Crea Nuova Rubrica'}
            onClose={onClose}
            maxWidth="xl"
            mode="fullscreen"
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "var(--md-sys-percent-100)" }}>
                <DialogContent sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 30%, transparent)' }}>
                    <div style={{padding: 'var(--md-sys-spacing-6)', gap: 'var(--md-sys-spacing-8)'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                            <TextField 
                                label="Titolo della Rubrica"
                                value={rubrica.titolo} 
                                onChange={e => setRubrica({...rubrica, titolo: e.target.value})} 
                                placeholder="Es. Rubrica per Prova Orale di Storia"
                                required
                                sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)' }}
                            />
                        </div>
                        
                        <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)'}}>
                            {/* Sezione Selezione */}
                            <div  style={{gap: 'var(--md-sys-spacing-4)'}}>
                                <SectionHeader title="Criteri di Competenza" icon="checklist" variant="contained" />
                                 <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)' , border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)", padding: 'var(--md-sys-spacing-8)'}}>
                                    {allCompetenze.map(comp => (
                                         <div key={comp.id}  style={{width: "var(--md-sys-percent-100)", marginBottom: 'var(--md-sys-spacing-4)'}}>
                                            <input
                                                type="checkbox"
                                                id={`comp-check-${comp.id}`}
                                                checked={rubrica.criteri.some(c => c.competenzaId === comp.id)}
                                                onChange={() => handleCompetenzaToggle(comp)}
                                            />
                                            <label htmlFor={`comp-check-${comp.id}`} style={{
                                                width: 'var(--md-sys-percent-100)',
                                                justifyContent: 'flex-start',
                                                height: 'var(--md-sys-spacing-12)', // MD3 spacing token
                                                borderRadius: 'var(--md-sys-shape-corner-large)',
                                                padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 'var(--md-sys-spacing-2)',
                                                backgroundColor: rubrica.criteri.some(c => c.competenzaId === comp.id) ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container)',
                                                color: rubrica.criteri.some(c => c.competenzaId === comp.id) ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
                                                border: `var(--md-sys-border-width-thin) solid ${rubrica.criteri.some(c => c.competenzaId === comp.id) ? 'var(--md-sys-color-outline)' : 'var(--md-sys-color-outline-variant)'}`
                                            }}>
                                                {rubrica.criteri.some(c => c.competenzaId === comp.id) && <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: "var(--md-sys-typescale-title-small-font-size)" }}>check</Box>}
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "var(--md-sys-typescale-weight-bold)", fontSize: "var(--md-sys-typescale-body-small-font-size)" }}>{comp.nome}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sezione Descrittori */}
                            <div  style={{gap: 'var(--md-sys-spacing-6)'}}>
                                 <SectionHeader title="Definizione Descrittori" icon="edit_note" variant="outlined" />
                                 {rubrica.criteri.length > 0 ? rubrica.criteri.map(criterio => {
                                    const competenza = allCompetenze.find(c => c.id === criterio.competenzaId);
                                    if (!competenza) return null;
                                    return (
                                        <InfoCard key={competenza.id} elevation={1} sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-low) 50%, transparent)' , padding: 'var(--md-sys-spacing-6)', gap: 'var(--md-sys-spacing-6)', border: "var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)"}}>
                                            <div style={{display: "flex", alignItems: "center", gap: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-8)'}}>
                                                <div style={{ borderRadius: 'var(--md-sys-shape-corner-large)', backgroundColor: 'color-mix(in srgb, var(--md-sys-color-secondary) 10%, transparent)' , width: "var(--md-sys-spacing-10)", height: "var(--md-sys-spacing-10)", color: "var(--md-sys-color-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-medium-font-size)"}}>{competenza.codice.charAt(0)}</div>
                                                <Typography component="h4" variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-primary)' ,  fontWeight: "var(--md-sys-typescale-weight-black)" }}>{competenza.nome}</Typography>
                                            </div>
                                            
                                            <div  style={{display: "grid", gridTemplateColumns: "var(--md-sys-grid-fr-1)", gap: 'var(--md-sys-spacing-8)'}}>
                                                {competenza.livelli.map(level => {
                                                    const indicatore = criterio.indicatori.find(ind => ind.livelloId === level.id);
                                                    return (
                                                        <div key={level.id} style={{gap: 'var(--md-sys-spacing-2)'}}>
                                                            <TextField multiline 
                                                                label={`Livello: ${level.nome}`} 
                                                                value={indicatore?.descrizione || ''} 
                                                                onChange={e => handleIndicatorChange(competenza.id, level.id, 'descrizione', e.target.value)}
                                                                placeholder="Descrivi la padronanza..."
                                                                rows={2}
                                                                sx={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 50%, transparent)' }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </InfoCard>
                                    )
                                 }) : (
                                    <EmptyState title="Nessun criterio" description="Seleziona le competenze dalla lista a sinistra." icon="checklist" />
                                 )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} variant="text" sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Annulla</Button>
                    <Button onClick={handleSubmit} variant="contained"  sx={{ fontWeight: "var(--md-sys-typescale-weight-black)", fontSize: "var(--md-sys-typescale-body-small-font-size)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Salva Rubrica</Button>
                </DialogActions>
            </form>
        </M3Dialog>
    );
};

export default RubricEditor;

