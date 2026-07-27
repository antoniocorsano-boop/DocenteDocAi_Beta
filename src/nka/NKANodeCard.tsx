import React from 'react';
import { NKANode } from './types';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

interface NKANodeCardProps {
  node?: NKANode;
  onSelect: () => void;
  loading?: boolean;
  error?: string;
  role?: string;
}

function NKANodeCard({ node, onSelect, loading = false, error }: NKANodeCardProps): React.JSX.Element {
  if (loading) {
    return (
      <Paper
        elevation={0}
        role="status"
        aria-label="Caricamento nodo NKA in corso"
        sx={{
          bgcolor: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          padding: 'var(--md-sys-spacing-4)',
          marginBottom: 'var(--md-sys-spacing-4)',
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-2)',
        }}
      >
        <Skeleton variant="text" width="80%" height="24px" />
        <Skeleton variant="text" width="60%" height="16px" />
        <Box sx={{ display: 'flex', gap: 'var(--md-sys-spacing-2)', marginTop: 'var(--md-sys-spacing-2)' }}>
          <Skeleton variant="rectangular" width="80px" height="32px" />
          <Skeleton variant="rectangular" width="80px" height="32px" />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper
        elevation={0}
        role="alert"
        aria-label={`Errore nel caricamento del nodo: ${error}`}
        sx={{
          bgcolor: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          padding: 'var(--md-sys-spacing-4)',
          marginBottom: 'var(--md-sys-spacing-4)',
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-2)',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'error.main' }}>
          Errore
        </Typography>
        <Typography variant="body2" sx={{ color: 'error.main', textAlign: 'center' }}>
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!node) {
    return (
      <Paper
        elevation={0}
        role="status"
        aria-label="Nessun nodo NKA disponibile"
        sx={{
          bgcolor: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          padding: 'var(--md-sys-spacing-6)',
          marginBottom: 'var(--md-sys-spacing-4)',
          minWidth: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-2)',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Nessun nodo disponibile
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
          Non ci sono nodi NKA da visualizzare
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      tabIndex={0}
      role="button"
      aria-label={`Nodo NKA: ${node.label}, profondità ${Math.round(node.depth * 100)}%`}
      aria-describedby={`nka-node-details-${node.id}`}
      onClick={onSelect}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
          e.preventDefault();
        }
      }}
      sx={{
        bgcolor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        padding: 'var(--md-sys-spacing-4)',
        marginBottom: 'var(--md-sys-spacing-4)',
        minWidth: 220,
        outline: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-2)',
      }}
    >
      <Typography variant="subtitle2" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
        {node.label}
      </Typography>

      <Typography
        variant="body2"
        id={`nka-node-details-${node.id}`}
        sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
      >
        Profondità {Math.round(node.depth * 100)}%
      </Typography>

      {node.actions && node.actions.length > 0 && (
        <Box
          role="group"
          aria-label="Azioni disponibili per il nodo"
          sx={{
            display: 'flex',
            gap: 'var(--md-sys-spacing-2)',
            marginTop: 'var(--md-sys-spacing-2)',
            flexWrap: 'wrap',
          }}
        >
          {node.actions.map((action: string) => (
            <Button
              key={action}
              variant="contained"
              size="small"
              tabIndex={0}
              aria-label={`Azione: ${action}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {action}
            </Button>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default NKANodeCard;
