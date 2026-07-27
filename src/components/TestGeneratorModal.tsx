// MD3 Compliant - Block J Migration Complete (2 violations eliminated)

import React, { useState } from 'react';
import { QuestionType } from '../types';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { M3Dialog,
    TextField
} from './ui';
import { useUIStore } from '../stores/useUIStore';

// M3Expressive: Refactored to use dedicated CSS classes with M3 tokens for colors, spacing, typography, and animations

interface TestGeneratorModalProps {
    onClose: () => void;
    onGenerate: (config: {
        topic: string;
        difficulty: 'easy' | 'medium' | 'hard';
        questionCount: number;
        questionTypes: QuestionType[];
    }) => void;
}

interface TestGeneratorModalProps {
    onClose: () => void;
    onGenerate: (config: {
        topic: string;
        difficulty: 'easy' | 'medium' | 'hard';
        questionCount: number;
        questionTypes: QuestionType[];
    }) => void;
}

const TestGeneratorModal: React.FC<TestGeneratorModalProps> = ({ onClose, onGenerate }) => {
    const { showToast } = useUIStore(state => ({ showToast: state.actions.showToast }));
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [questionCount, setQuestionCount] = useState(10);
    const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['multiple_choice']);

    const toggleQuestionType = (type: QuestionType) => {
        setQuestionTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const handleSubmit = () => {
        if (questionTypes.length === 0) { showToast('Seleziona un tipo di domanda.', 'error'); return; }
        onGenerate({ topic: topic || 'Argomenti KB', difficulty, questionCount, questionTypes });
    };

    return (
        <M3Dialog
            onClose={onClose}
            title="Generatore Verifiche"
            headline="Crea una verifica personalizzata con AI"
            buttons={
                <>
                    <Button variant="text" onClick={onClose}>Annulla</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                    >
                        <Typography component="span" className="material-symbols-outlined" sx={{ mr: 'var(--md-sys-spacing-2)' }}>auto_awesome</Typography>
                        Genera
                    </Button>
                </>
            }
        >
            <TextField
                id="test-topic-input"
                label="Argomento Specifico"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Es. Rivoluzione Francese"
            />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography component="label">Difficoltà</Typography>
                                        <Tabs
                      value={difficulty}
                      onChange={(_, v: string) => ((id) => setDifficulty(id as 'easy' | 'medium' | 'hard'))(v)}
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
                      {([{ id: 'easy', label: 'Base' }, { id: 'medium', label: 'Intermedio' }, { id: 'hard', label: 'Avanzato' }]).map((tab: { id: string; label: string; icon?: string; badge?: number | string }) => (
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
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <Typography component="label" htmlFor="test-qcount-slider">Numero Quesiti</Typography>
                        <Typography component="span">{questionCount}</Typography>
                    </Box>
                    <input
                        id="test-qcount-slider"
                        name="test-qcount-slider"
                        type="range"
                        min="5"
                        max="20"
                        value={questionCount}
                        onChange={e => setQuestionCount(parseInt(e.target.value))}
                        
                    />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                    <Typography component="label">Tipi di Domande</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)' }}>
                        <label style={{
                            // test-generator-modal-question-type-chip styles
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: questionTypes.includes('multiple_choice') ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container)',
                            color: questionTypes.includes('multiple_choice') ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
                            border: `var(--md-sys-border-width-normal) solid ${questionTypes.includes('multiple_choice') ? 'var(--md-sys-color-outline)' : 'var(--md-sys-color-outline-variant)'}`,
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                style={{ display: "none" }}
                                checked={questionTypes.includes('multiple_choice')}
                                onChange={() => toggleQuestionType('multiple_choice')}
                            />
                            {questionTypes.includes('multiple_choice') && <Box component="span" className="material-symbols-outlined" aria-hidden="true">check</Box>}
                            <span>Scelta Multipla</span>
                        </label>

                        <label style={{
                            // test-generator-modal-question-type-chip styles
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--md-sys-spacing-2)',
                            padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                            borderRadius: 'var(--md-sys-shape-corner-large)',
                            backgroundColor: questionTypes.includes('true_false') ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-surface-container)',
                            color: questionTypes.includes('true_false') ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
                            border: `var(--md-sys-border-width-normal) solid ${questionTypes.includes('true_false') ? 'var(--md-sys-color-outline)' : 'var(--md-sys-color-outline-variant)'}`,
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                style={{ display: "none" }}
                                checked={questionTypes.includes('true_false')}
                                onChange={() => toggleQuestionType('true_false')}
                            />
                            {questionTypes.includes('true_false') && <Box component="span" className="material-symbols-outlined" aria-hidden="true">check</Box>}
                            <span>Vero/Falso</span>
                        </label>
                    </Box>
                </Box>
        </M3Dialog>
    );
};

export default TestGeneratorModal;

