import React, { useState } from 'react';
import { NKANode } from './types';
import { getInitialGameState, unlockNode, GameState } from './gameLogic';
import { playNkaSound } from './sound';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

interface GameModeProps {
  nodes?: readonly NKANode[];
}

const GameMode: React.FC<GameModeProps> = ({ nodes = [] as readonly NKANode[] }) => {
  const [state, setState] = useState<GameState>(() => getInitialGameState(nodes));
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUnlock = async (nodeId: string) => {
    setIsLoading(true);
    try {
      setState(prev => {
        const next = unlockNode(prev, nodeId);
        if (next.unlocked.length > prev.unlocked.length) playNkaSound('badge');
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Paper
        elevation={1}
        role="region"
        aria-label="Caricamento modalità gioco"
        sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-4)' }}
      >
        <CircularProgress aria-label="Caricamento in corso" />
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
          Elaborazione...
        </Typography>
      </Paper>
    );
  }

  if (nodes.length === 0) {
    return (
      <Paper
        elevation={1}
        role="region"
        aria-label="Nessun nodo disponibile"
        sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-4)' }}
      >
        <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
          Nessun neurone disponibile
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Carica dei nodi per iniziare la modalità gioco
        </Typography>
      </Paper>
    );
  }

  const availableNodes = nodes.filter(n => !state.unlocked.includes(n.id));

  return (
    <Paper
      elevation={1}
      role="region"
      aria-label="Modalità gioco NKA"
      sx={{ borderRadius: 'var(--md-sys-shape-corner-large)', padding: 'var(--md-sys-spacing-4)' }}
    >
      <Typography variant="h6" sx={{ color: 'var(--md-sys-color-on-surface)' }} gutterBottom>
        Modalità Gioco: Progresso
      </Typography>
      
      <LinearProgress 
        variant="determinate"
        value={state.progress}
        aria-label={`Progresso: ${Math.round(state.progress)}% completato`}
        sx={{ mb: 2 }}
      />
      
      {state.unlocked.length > 0 && (
        <Box role="region" aria-label="Neuroni sbloccati">
          <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface)' }} gutterBottom>
            Neuroni Sbloccati
          </Typography>
          <Box role="group" aria-label="Lista neuroni sbloccati" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {state.unlocked.map((id, index) => (
              <Chip 
                key={id} 
                label={id} 
                variant="filled" 
                aria-label={`Neurone sbloccato: ${id}`}
                tabIndex={0}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {availableNodes.length > 0 && (
        <Box role="region" aria-label="Neuroni da sbloccare">
          <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface)' }} gutterBottom>
            Sblocca Neuroni
          </Typography>
          <Box role="group" aria-label="Pulsanti per sbloccare neuroni" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {availableNodes.map((n, index) => (
              <Button 
                key={n.id} 
                onClick={() => handleUnlock(n.id)} 
                variant="contained"
                aria-label={`Sblocca neurone ${n.label}`}
                tabIndex={0}
              >
                Sblocca {n.label}
              </Button>
            ))}
          </Box>
        </Box>
      )}
      
      {state.badges.length > 0 && (
        <Box role="region" aria-label="Badge ottenuti">
          <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface)' }} gutterBottom>
            Badge Ottenuti
          </Typography>
          <Box role="group" aria-label="Lista badge ottenuti" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {state.badges.map((b, index) => (
              <Chip 
                key={b} 
                label={b} 
                variant="outlined"
                aria-label={`Badge ottenuto: ${b}`}
                tabIndex={0}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default GameMode;
