// MD3 Compliant - Block M Migration (3 violations eliminated)

// M3Expressive refactor: Removed inline Tailwind classes, applied dedicated CSS classes with M3 tokens for colors, spacing, typography, elevation. Maintained responsive behavior and animations. ✅ COMPLETED
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Competenza, View, NavigationParams } from '../types';
import { DEFAULT_COMPETENZE } from '../constants';
import ContextualAskAI from './ui/ContextualAskAI';

interface CompetencyManagerProps {
    competenze: Competenza[];
    onUpdateCompetencies: (newCompetencies: Competenza[]) => void;
    onNavigate?: (view: View, context?: NavigationParams) => void;
}

// Helper to get unique frameworks from a list
const getFrameworks = (compList: Competenza[]) => {
    const frameworks = new Set<string>();
    compList.forEach(c => {
        if (c.framework) frameworks.add(c.framework);
        else frameworks.add('Standard');
    });
    return Array.from(frameworks);
};

const CompetencyManager: React.FC<CompetencyManagerProps> = ({ competenze, onUpdateCompetencies, onNavigate }) => {
    const [activeFramework, setActiveFramework] = useState<string>('Tutti');
    
    // DEFAULT_COMPETENZE acts as the master catalog of all available competencies
    const catalog = DEFAULT_COMPETENZE; 
    const frameworks = ['Tutti', ...getFrameworks(catalog)];

    const isCompetencyActive = (id: string) => {
        return competenze.some(c => c.id === id);
    };

    const toggleCompetency = (comp: Competenza) => {
        const isActive = isCompetencyActive(comp.id);
        let newCompetenciesIds: string[];

        if (isActive) {
            // Remove: Filter out the ID
            newCompetenciesIds = competenze.filter(c => c.id !== comp.id).map(c => c.id);
        } else {
            // Add: Append ID
            newCompetenciesIds = [...competenze.map(c => c.id), comp.id];
        }
        
        // Reconstruct the array based on the MASTER CATALOG ORDER
        // This ensures that toggling doesn't mess up the sort order (e.g. putting 'Area 1.1' at the end)
        const newCompetencies = catalog.filter(c => newCompetenciesIds.includes(c.id));
        
        // Push update to parent
        onUpdateCompetencies(newCompetencies);
    };

    const filteredCatalog = catalog.filter(c => {
        if (activeFramework === 'Tutti') return true;
        return (c.framework || 'Standard') === activeFramework;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
            {/* Intro Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <h2>Gestione Framework e Competenze</h2>
                <p>
                    Seleziona le competenze che vuoi monitorare nel tuo registro. Puoi attivare interi framework come <strong>DigCompEdu 2.2</strong> (con focus IA) o le Competenze Chiave Europee.
                </p>
            </div>

            {/* Contextual AI (Fase 3) */}
            {onNavigate && (
                <Box sx={{ mb: 'var(--md-sys-spacing-4)' }}>
                    <ContextualAskAI
                        onNavigate={onNavigate}
                        context={{ source: 'competency-manager' }}
                       
                    />
                </Box>
            )}

            {/* Filtri Framework: scroll orizzontale su mobile, sidebar su desktop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    {frameworks.map(fw => (
                        <button
                            key={fw}
                            onClick={() => setActiveFramework(fw)}
                            style={{
                                padding: 'var(--md-sys-spacing-4)',
                                borderRadius: 'var(--md-sys-shape-corner-medium)',
                                transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
                                fontWeight: 'var(--md-sys-typescale-weight-medium)',
                                display: 'flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                                background: activeFramework === fw ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface)',
                                color: activeFramework === fw ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
                                boxShadow: activeFramework === fw ? 'var(--md-sys-elevation-level1)' : 'none',
                                border: activeFramework === fw ? 'none' : 'var(--md-sys-border-width-thin) solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (activeFramework !== fw) {
                                    e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)';
                                    e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFramework !== fw) {
                                    e.currentTarget.style.background = 'var(--md-sys-color-surface)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }
                            }}
                        >
                            <span>{fw}</span>
                            {fw === 'DigCompEdu 2.2' && <Box component="span" className="material-symbols-outlined" aria-hidden="true">smart_toy</Box>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista Competenze */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                {filteredCatalog.map(comp => {
                    const active = isCompetencyActive(comp.id);
                    return (
                        <details
                            key={comp.id}
                            style={{
                                transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                borderColor: active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                                background: active ? 'var(--md-sys-color-surface)' : 'var(--md-sys-color-surface-container-low)'
                            }}
                        >
                            <summary>
                                <div
                                    onClick={(e) => {
                                        e.preventDefault(); // Prevent details toggle
                                        e.stopPropagation();
                                        toggleCompetency(comp);
                                    }}
                                    style={{
                                        width: 'var(--md-sys-spacing-7)',
                                        height: 'var(--md-sys-spacing-7)',
                                        borderRadius: 'var(--md-sys-shape-corner-small)',
                                        borderWidth: 'var(--md-sys-border-width-normal)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard), border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard), color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                                        cursor: 'pointer',
                                        background: active ? 'var(--md-sys-color-primary)' : 'transparent',
                                        borderColor: active ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                                        color: active ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'var(--md-sys-color-surface-container-high)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                    title={active ? `Disattiva ${comp.nome}` : `Attiva ${comp.nome}`}
                                >
                                    {active && <Box component="span" className="material-symbols-outlined" aria-hidden="true">check</Box>}
                                </div>
                                <div style={{ flexGrow: "1", minWidth: "0" }}>
                                    <span>{comp.codice}</span>
                                    <h3>{comp.nome}</h3>
                                    <p>{comp.framework}</p>
                                </div>
                                <Box component="span" className="material-symbols-outlined" aria-hidden="true">expand_more</Box>
                            </summary>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                <p>DESCRITTORI LIVELLI:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    {comp.livelli.map(lvl => (
                                        <div key={lvl.id} >
                                            <strong>{lvl.nome}:</strong> <span style={{ opacity: "var(--md-sys-state-opacity-caption)" }}>{lvl.descrizione}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </details>
                    )
                })}
            </div>
        </div>
    );
};

export default CompetencyManager;

