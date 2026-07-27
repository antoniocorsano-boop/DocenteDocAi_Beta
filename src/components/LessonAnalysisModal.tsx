// MD3 Gold Compliant
// Tutti gli stili usano esclusivamente token MD3 (nessun valore hardcoded)
// Audit: gennaio 2026

// M3Expressive: LessonAnalysisModal - AI-powered lesson analysis results with M3 tokens
import React from 'react';
import { LessonAnalysisResult } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { M3Dialog, AiMemoryChip } from './ui';

interface LessonAnalysisModalProps {
    result: LessonAnalysisResult;
    onClose: () => void;
    title: string;
    contextLabel?: string;
}

const LessonAnalysisModal: React.FC<LessonAnalysisModalProps> = ({ result, onClose, contextLabel }) => {
    return (
        <M3Dialog
            title="Analisi Pedagogica AI"
            onClose={onClose}
            maxWidth="xl"
            buttons={<Button onClick={onClose} variant="contained">Ho capito</Button>}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                {contextLabel && <AiMemoryChip label={contextLabel} />}

                {/* Section 1: Engagement */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                            <Typography component="span" className="material-symbols-outlined">rocket_launch</Typography>
                        </Box>
                        <Typography variant="h6" component="h3">Strategie di Coinvolgimento</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        {result.engagementSuggestions.map((item, index) => (
                            <Box key={index}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                                    <Typography variant="subtitle2" component="h4">{item.title}</Typography>
                                    <Typography component="span">{item.activityType}</Typography>
                                </Box>
                                <Typography variant="body2" component="p">{item.description}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Section 2: Inclusivity */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                            <Typography component="span">diversity_3</Typography>
                        </Box>
                        <Typography variant="h6" component="h3">Adattamenti per l'Inclusività (UDL)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        {result.inclusivityAdaptations.map((item, index) => (
                            <Box key={index}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-3)' }}>
                                    <Typography component="span">{item.targetGroup}</Typography>
                                </Box>
                                <Typography variant="body2" component="p">{item.suggestion}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </M3Dialog>
    );
};

export default LessonAnalysisModal;

