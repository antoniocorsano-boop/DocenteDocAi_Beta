import * as React from 'react';
import './nka-responsive.css';
import { NKANode } from './types';
import NKANodeCard from './NKANodeCard';
import NKAForceMap from './NKAForceMap';
import { playNkaSound } from './sound';
import { generateWizardForNodeLLM } from './wizardAI.llm';
import { NKAWizardStep } from './wizardAI';
import GameMode from './GameMode';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { logger } from '../utils/logger';

interface NKABottomSheetProps {
  open: boolean;
  nodes: readonly NKANode[];
  onClose: () => void;
  onNodeSelect: (node: NKANode) => void;
}

const NKABottomSheet: React.FC<NKABottomSheetProps> = ({ open, nodes, onClose, onNodeSelect }) => {
  const [selectedNode, setSelectedNode] = React.useState<NKANode | null>(null);
  const [showWizard, setShowWizard] = React.useState<boolean>(false);
  const [wizardSteps, setWizardSteps] = React.useState<NKAWizardStep[]>([]);
  const [wizardLoading, setWizardLoading] = React.useState<boolean>(false);
  const [wizardError, setWizardError] = React.useState<string | null>(null);
  const [showGame, setShowGame] = React.useState<boolean>(false);

  const handleNodeSelect = React.useCallback((node: NKANode) => {
    try {
      playNkaSound('node');
    } catch (err) {
      logger.warn('[NKA] Sound play error:', err);
    }
    setSelectedNode(node);
    setShowWizard(true);
    setWizardError(null);
    onNodeSelect(node);
    setWizardLoading(true);

    (async () => {
      try {
        const steps = await generateWizardForNodeLLM(node, {});
        setWizardSteps(steps);
      } catch (err) {
        logger.warn('[NKA] Wizard generation error:', err);
        setWizardError('Errore nella generazione del wizard');
      } finally {
        setWizardLoading(false);
      }
    })();
  }, [onNodeSelect]);

  if (!open) return null;

  return (
    <>
      <Box
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 'var(--md-sys-z-modal)',
          bgcolor: 'rgba(0,0,0,0.32)',
        }}
      />
      <Paper
        elevation={3}
        role="dialog"
        aria-modal="true"
        aria-label="Mappa neurale della conoscenza"
        sx={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          transform: 'translateX(-50%)',
          width: 'min(100vw, 600px)',
          borderTopLeftRadius: 'var(--md-sys-shape-corner-large)',
          borderTopRightRadius: 'var(--md-sys-shape-corner-large)',
          zIndex: 'calc(var(--md-sys-z-modal) + 1)',
          padding: 'var(--md-sys-spacing-6) var(--md-sys-spacing-4)',
          minHeight: '320px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-4)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            flex: 1,
            overflow: 'auto',
            marginBottom: 'var(--md-sys-spacing-4)',
          }}
        >
          {nodes.length === 0 ? (
            <Box
              role="status"
              aria-label="Nessun nodo disponibile"
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 'var(--md-sys-spacing-4)',
                padding: 'var(--md-sys-spacing-8)', textAlign: 'center',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-hero)', color: 'var(--md-sys-color-outline)' }}>psychology</Box>
              <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface)', m: 0 }}>Nessun nodo disponibile</Typography>
              <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', m: 0 }}>Non ci sono nodi nella mappa neurale</Typography>
            </Box>
          ) : (
            <>
              <NKAForceMap 
                nodes={nodes} 
                onNodeSelect={handleNodeSelect}
                aria-label="Visualizzazione interattiva della mappa neurale"
              />
              <Box
                role="list"
                aria-label="Elenco nodi della mappa neurale"
                sx={{ marginTop: 'var(--md-sys-spacing-4)' }}
              >
                {nodes.map((node: NKANode) => (
                  <NKANodeCard 
                    key={node.id} 
                    node={node} 
                    onSelect={() => handleNodeSelect(node)}
                    role="listitem"
                  />
                ))}
              </Box>
            </>
          )}
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Chiudi mappa neurale"
          sx={{
            position: 'absolute',
            top: 'var(--md-sys-spacing-3)',
            right: 'var(--md-sys-spacing-4)',
          }}
        >
          <Box component="span" className="material-symbols-outlined" aria-hidden="true">close</Box>
        </IconButton>

        <Button
          variant="contained"
          color={showGame ? 'secondary' : 'primary'}
          onClick={() => setShowGame(prev => !prev)}
          aria-label={showGame ? 'Nascondi modalità gioco' : 'Mostra modalità gioco'}
          aria-expanded={showGame}
        >
          {showGame ? 'Nascondi' : 'Mostra'} Modalità Gioco
        </Button>
      </Paper>

      {showWizard && selectedNode && (
        <Paper
          elevation={2}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wizard-title"
          aria-describedby="wizard-description"
          sx={{
            position: 'fixed',
            left: '50%',
            top: '10vh',
            transform: 'translateX(-50%)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            padding: 'var(--md-sys-spacing-6)',
            zIndex: 'calc(var(--md-sys-z-modal) + 2)',
            minWidth: '320px',
            maxWidth: '480px',
            width: '90vw',
          }}
        >
          <Typography 
            variant="h6" 
            id="wizard-title"
            sx={{ marginBottom: 'var(--md-sys-spacing-4)' }}
          >
            Wizard: {selectedNode.label}
          </Typography>
          
          {wizardLoading ? (
            <Box sx={{ padding: 'var(--md-sys-spacing-4)' }}>
              <Skeleton sx={{ height: '24px', marginBottom: 'var(--md-sys-spacing-3)' }} />
              <Skeleton sx={{ height: '16px', marginBottom: 'var(--md-sys-spacing-2)' }} />
              <Skeleton sx={{ height: '16px', width: '80%' }} />
            </Box>
          ) : wizardError ? (
            <Box
              role="alert"
              aria-label="Errore nel wizard"
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 'var(--md-sys-spacing-4)',
                padding: 'var(--md-sys-spacing-8)', textAlign: 'center',
                bgcolor: 'var(--md-sys-color-error-container)',
                color: 'var(--md-sys-color-on-error-container)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
              }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-xl)', color: 'var(--md-sys-color-error)' }}>error</Box>
              <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-error-container)', m: 0 }}>Errore nel wizard</Typography>
              <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-error-container)', m: 0 }}>{wizardError}</Typography>
              <Button variant="contained" color="secondary" onClick={() => handleNodeSelect(selectedNode)} startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">refresh</Box>}>
                Riprova
              </Button>
            </Box>
          ) : wizardSteps.length === 0 ? (
            <Box
              role="status"
              aria-label="Wizard non disponibile"
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 'var(--md-sys-spacing-4)',
                padding: 'var(--md-sys-spacing-8)', textAlign: 'center',
                color: 'var(--md-sys-color-on-surface-variant)',
              }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-hero)', color: 'var(--md-sys-color-outline)' }}>auto_fix_high</Box>
              <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface)', m: 0 }}>Wizard non disponibile</Typography>
              <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', m: 0 }}>Non è stato possibile generare passi per questo nodo</Typography>
            </Box>
          ) : (
            <Box 
              role="list"
              aria-label="Passi del wizard"
            >
              {wizardSteps.map((step: NKAWizardStep) => (
                <Box
                  key={step.id}
                  role="listitem"
                  sx={{
                    marginBottom: 'var(--md-sys-spacing-4)',
                    padding: 'var(--md-sys-spacing-3)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    bgcolor: 'var(--md-sys-color-surface-variant)',
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ marginBottom: 'var(--md-sys-spacing-2)' }}
                  >
                    {step.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      marginBottom: 'var(--md-sys-spacing-3)',
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}
                  >
                    {step.description}
                  </Typography>
                  {step.actions.length > 0 && (
                    <Box 
                      sx={{
                        display: 'flex',
                        gap: 'var(--md-sys-spacing-2)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {step.actions.map((action: string, index: number) => (
                        <Button
                          key={`${step.id}-action-${index}`}
                          variant="contained"
                          size="small"
                          aria-label={`Esegui azione: ${action}`}
                        >
                          {action}
                        </Button>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
          
          <Button
            variant="text"
            onClick={() => setShowWizard(false)}
            aria-label="Chiudi wizard"
            sx={{ marginTop: 'var(--md-sys-spacing-4)' }}
          >
            Chiudi wizard
          </Button>
        </Paper>
      )}

      {showGame && (
        <Paper
          elevation={2}
          role="region"
          aria-label="Modalità gioco"
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 'calc(var(--md-sys-z-modal) + 1)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          <GameMode nodes={nodes} />
        </Paper>
      )}
    </>
  );
};

export default NKABottomSheet;
