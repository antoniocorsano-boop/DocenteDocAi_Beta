
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.

/* M3Expressive - RubricheManager Component */

import React, { useState } from 'react';
import { Competenza, Rubrica, View, NavigationParams } from '../types';
import RubricEditor from './RubricEditor';
import { InfoCard, EmptyState, SectionHeader, ActionTile } from './ui';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ContextualAskAI from './ui/ContextualAskAI';

interface RubricheManagerProps {
    competenze: Competenza[];
    rubriche: Rubrica[];
    onSaveRubrica: (rubrica: Rubrica) => void;
    onDeleteRubrica: (id: string) => void;
    onNavigate: (view: View, context?: NavigationParams) => void;
}

const RubricheManager: React.FC<RubricheManagerProps> = ({ competenze, rubriche, onSaveRubrica, onNavigate }) => {
    const [editingRubric, setEditingRubric] = useState<Rubrica | 'new' | null>(null);

    const handleSave = (rubrica: Rubrica) => {
        onSaveRubrica(rubrica);
        setEditingRubric(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div>Rubriche di Valutazione</div>
                <p>Crea e gestisci le griglie di competenza.</p>
            </div>

            {/* Contextual AI (Fase 2) */}
            <ContextualAskAI
              onNavigate={onNavigate}
             
              context={{ source: 'rubriche' }}
              compact
            />

                <Button onClick={() => setEditingRubric('new')} variant="contained" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">add</Box>}>
                    Crea Nuova
                </Button>
            </div>

            <InfoCard 
                title="Griglie Personalizzate"
                description="Crea rubriche di valutazione riutilizzabili basate sulle tue competenze. Usale durante le interrogazioni o le prove pratiche per una valutazione oggettiva."
                icon="schema"
                variant="outlined"
                
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                {rubriche.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        {rubriche.map(rubrica => (
                            <ActionTile 
                                key={rubrica.id}
                                title={rubrica.titolo}
                                subtitle={`${rubrica.criteri.length} Criteri di competenza`}
                                icon="assignment"
                                variant="surface"
                                onClick={() => setEditingRubric(rubrica)}
                                
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        title="Nessuna rubrica"
                        description="Inizia creando il tuo primo modello di valutazione."
                        icon="schema"
                    />
                )}
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <SectionHeader title="Riferimenti" icon="menu_book" variant="tertiary" />
                <ActionTile 
                    title="Descrittori Livelli"
                    subtitle="Visualizza scala A-D"
                    icon="visibility"
                    variant="tertiary"
                    onClick={() => onNavigate('competency-levels')}
                    
                />
            </div>

            {editingRubric && (
                <RubricEditor
                    rubricToEdit={editingRubric === 'new' ? undefined : editingRubric}
                    allCompetenze={competenze}
                    onClose={() => setEditingRubric(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}

export default RubricheManager;

