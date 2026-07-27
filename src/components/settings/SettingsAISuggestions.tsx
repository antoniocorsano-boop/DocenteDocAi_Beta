import React from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SettingsGroup from './SettingsGroupAccordion';

interface SettingsAISuggestionsSectionProps {
    expanded: boolean;
    onToggle: () => void;
    dismissedSuggestions: Set<string>;
    onReactivateSuggestion: (id: string) => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsAISuggestionsSection: React.FC<SettingsAISuggestionsSectionProps> = ({
    expanded, onToggle, dismissedSuggestions, onReactivateSuggestion, showToast
}) => (
    <SettingsGroup
        id="ai_suggestions"
        title="Suggerimenti AI"
        subtitle="Gestisci suggerimenti ignorati"
        icon="lightbulb"
        variant="tertiary"
        expanded={expanded}
        onToggle={onToggle}
    >
        <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Qui puoi vedere i suggerimenti AI che hai ignorato e riattivarli se desideri.
            </Typography>
            {dismissedSuggestions.size === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', textAlign: 'center', p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-medium)' }}>
                    Nessun suggerimento ignorato.
                </Typography>
            ) : (
                <Stack spacing={2}>
                    {Array.from(dismissedSuggestions).map((id) => (
                        <Box key={id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 'var(--md-sys-shape-corner-large)', border: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                            <Stack spacing={0.5}>
                                <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-medium)' }}>
                                    Suggerimento {id}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                    Ignorato in precedenza
                                </Typography>
                            </Stack>
                            <Button onClick={() => onReactivateSuggestion(id)} variant="outlined" startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">refresh</Box>}>
                                Riattiva
                            </Button>
                        </Box>
                    ))}
                </Stack>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, borderTop: '1px solid', borderColor: 'var(--md-sys-color-outline-variant)' }}>
                <Button
                    onClick={() => {
                        Array.from(dismissedSuggestions).forEach(id => onReactivateSuggestion(id));
                        showToast('Tutti i suggerimenti riattivati', 'success');
                    }}
                    disabled={dismissedSuggestions.size === 0}
                    variant="text"
                    fullWidth
                >
                    Riattiva Tutti i Suggerimenti
                </Button>
            </Box>
        </Stack>
    </SettingsGroup>
);

export default SettingsAISuggestionsSection;
