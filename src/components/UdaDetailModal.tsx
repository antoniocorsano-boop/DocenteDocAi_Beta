// MD3 GOLD COMPLIANT — Migrated to M3Dialog (marzo 2026)
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import { Uda, AiSettings, KnowledgeBaseEntry } from '../types';
import InfoCard from './ui/InfoCard';
import { M3Dialog } from './ui';
// Fase 4: FULL routing for UDA validation via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { logger } from '../utils/logger';
import { useUIStore } from '../stores/useUIStore';
interface UdaDetailModalProps {
    uda: Uda;
    onClose: () => void;
    onEdit: () => void;
    aiSettings: AiSettings;
    knowledgeBase: KnowledgeBaseEntry[];
}

const UdaDetailModal: React.FC<UdaDetailModalProps> = ({ uda, onClose, onEdit, aiSettings, knowledgeBase }) => {
  const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
  const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<string | null>(null);

    useEffect(() => {
        logger.debug(`Audit: Opened UDA detail modal for ${uda.id}: ${uda.title}`);
    }, [uda.id, uda.title]);

    const handleValidate = async () => {
        logger.debug(`Audit: Started AI validation for UDA ${uda.id}`);
        setIsValidating(true);
        setValidationResult(null);
        try {
            // Post-Fase 4: central prompt + generateWithCentralPrompt for UDA validation
            const ctx = AIBrain.buildContext({
                source: 'uda-detail-modal',
                extra: { udaId: uda.id, title: uda.title, phases: uda.phases.length }
            });
            await AIBrain.migrateLegacyAsk(`Validate UDA vertical curriculum for ${uda.title}`, ctx);

            const result = await AIBrain.generateWithCentralPrompt('validate-uda', { uda, kb: knowledgeBase }, aiSettings);
            setValidationResult(result);
            logger.debug(`Audit: Completed AI validation for UDA ${uda.id}`);
        } catch (error) {
            logger.error("Validation error:", error);
            showToast('Errore durante la validazione AI.', 'error');
        } finally {
            setIsValidating(false);
        }
    };

    const handleClose = () => {
        logger.debug(`Audit: Closed UDA detail modal for ${uda.id}`);
        onClose();
    };

    const handleEdit = () => {
        logger.debug(`Audit: Clicked edit button for UDA ${uda.id}`);
        onEdit();
    };

    return (
        <M3Dialog
            title={uda.title}
            onClose={handleClose}
            maxWidth="lg"
            buttons={
                <>
                    <Button variant="text" onClick={handleClose}>Chiudi</Button>
                    <Button variant="contained" onClick={handleEdit} startIcon={<EditIcon />}>
                        Modifica nel Planner
                    </Button>
                </>
            }
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-5)', pt: 'var(--md-sys-spacing-2)' }}>
                {/* Fase 4 visible block - daily UDA validation gesture routed via AIBrain */}
                <Box sx={{ fontSize: '0.72rem', px: 2, py: 0.5, mb: 1, bgcolor: 'var(--md-sys-color-surface-container-low)', borderRadius: 'var(--md-sys-shape-corner-small)' }}>
                    AIBrain (Post-Fase 4): UdaDetailModal — buildPrompt + generateWithCentralPrompt + buildContext + migrateLegacyAsk (validate-uda)
                </Box>
                {/* Metadata Chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
                    <Chip icon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>school</Box>} label={`Classe ${uda.classe}`} color="primary" variant="outlined" />
                    <Chip icon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>menu_book</Box>} label={uda.materia} color="secondary" variant="outlined" />
                    <Chip icon={<Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 16 }}>event</Box>} label={`${new Date(uda.startDate!).toLocaleDateString()} - ${new Date(uda.endDate!).toLocaleDateString()}`} variant="outlined" />
                </Box>

                {/* AI Validation Section */}
                <Box sx={{ bgcolor: 'var(--md-sys-color-primary-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid var(--md-sys-color-outline-variant)', p: 'var(--md-sys-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-primary-container)' }}>
                            Validazione Curricolo Verticale
                        </Typography>
                        <Button variant="contained" onClick={handleValidate} disabled={isValidating} size="small">
                            {isValidating ? 'Validazione...' : 'Valida con AI'}
                        </Button>
                    </Box>
                    {validationResult && (
                        <Box sx={{ bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', p: 'var(--md-sys-spacing-4)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.625 }}>{validationResult}</Typography>
                        </Box>
                    )}
                </Box>

                {/* Description */}
                <InfoCard title="Introduzione">
                    <Typography variant="body1" sx={{ lineHeight: 1.625 }}>{uda.introduction}</Typography>
                </InfoCard>

                {/* Phases Timeline */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography variant="overline" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Fasi di Lavoro</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
                        {uda.phases.map((phase) => (
                            <Box key={phase.id} sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-1)', p: 'var(--md-sys-spacing-4)', bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-medium)', borderLeft: '4px solid var(--md-sys-color-primary)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-primary)' }}>{phase.title}</Typography>
                                    <Chip label={`${phase.duration}h`} size="small" color="secondary" />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>{phase.description}</Typography>
                                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{phase.activities}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Additional Info Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-sys-spacing-4)' }}>
                    <InfoCard title="Prodotto Finale" icon="inventory_2">
                        <Typography variant="body2">{uda.finalProduct}</Typography>
                    </InfoCard>
                    <InfoCard title="Valutazione" icon="fact_check">
                        <Typography variant="body2">{uda.evaluation}</Typography>
                    </InfoCard>
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default UdaDetailModal;

