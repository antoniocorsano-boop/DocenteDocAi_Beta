/* eslint-disable @typescript-eslint/no-explicit-any */
// Force-directed neural map for NKA (SVG, animated, M3-compliant)
import * as React from 'react';
import { useRef } from 'react';
import { NKANode } from './types';
import { useNKAStore } from './useNKAStore';
import { getAINeuralLayout } from './aiLayout';
import { getLLMNeuralLayout } from './aiLayoutLLM';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { logger } from '../utils/logger';

interface NKAForceMapProps {
  nodes: readonly NKANode[];
  onNodeSelect: (node: NKANode) => void;
  width?: number;
  height?: number;
}

export function separatePositions<T extends { x: number; y: number }>(positions: T[], minDistance: number): T[] {
  // Simple iterative repulsion to resolve small overlaps
  const pts = positions.map(p => ({ ...p }));
  const maxIter = 100;
  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x;
        const dy = pts[j].y - pts[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        if (dist < minDistance) {
          const overlap = (minDistance - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          pts[i].x -= nx * overlap;
          pts[i].y -= ny * overlap;
          pts[j].x += nx * overlap;
          pts[j].y += ny * overlap;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return pts;
}

const NKAForceMap: React.FC<NKAForceMapProps> = ({ nodes, onNodeSelect, width = 340, height = 220 }: NKAForceMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRadius = Math.max(18, Math.min(32, Math.min(width, height) / 15));
  const [positions, setPositions] = React.useState<(NKANode & { x: number; y: number })[]>(
    separatePositions(getAINeuralLayout(nodes, width, height), nodeRadius * 2 + 8)
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sound = useNKAStore((s) => s.settings.sound);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!cancelled) {
        logger.warn('[NKA] LLM layout timeout, using fallback');
        setError('Timeout nel calcolo della disposizione AI');
        setLoading(false);
      }
    }, 5000);

    getLLMNeuralLayout(nodes, width, height, {})
      .then(pos => {
        if (!cancelled) {
          clearTimeout(timeout);
          // Apply separation to avoid overlaps
          const separated = separatePositions(pos as any, nodeRadius * 2 + 8);
          setPositions(separated as any);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          clearTimeout(timeout);
          logger.warn('[NKA] LLM layout error:', err);
          setError('Errore nel calcolo della disposizione AI');
          setLoading(false);
        }
      });
    
    return () => { 
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [nodes, width, height]);

  const isEmpty = nodes.length === 0;

  return (
    <Paper
      sx={{ 
        width, 
        height, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        margin: '0 auto'
      }}
    >
      {isEmpty && (
        <Box sx={{ textAlign: 'center', p: 'var(--md-sys-spacing-6)' }}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-hero)', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: 'var(--md-sys-spacing-2)' }}>hub</Box>
          <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Nessun nodo disponibile
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-2)' }}>
            Aggiungi dei nodi per visualizzare la mappa neurale
          </Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ textAlign: 'center', p: 'var(--md-sys-spacing-6)' }}>
          <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 'var(--icon-size-hero)', color: 'var(--md-sys-color-error)', display: 'block', marginBottom: 'var(--md-sys-spacing-2)' }}>error</Box>
          <Typography variant="body1" sx={{ color: 'var(--md-sys-color-error)' }}>
            Errore di caricamento
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-2)' }}>
            {error}
          </Typography>
        </Box>
      )}

      {loading && !error && (
        <Box sx={{ textAlign: 'center', p: 'var(--md-sys-spacing-6)' }}>
          <Typography variant="body1" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Calcolo disposizione AI…
          </Typography>
        </Box>
      )}

      {!loading && !error && !isEmpty && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          role="img"
          aria-label="Mappa neurale interattiva con nodi collegati"
          style={{
            display: 'block',
            outline: 'none',
          }}
        >
          {/* Render nodes */}
          {positions.map((node, index) => (
            <g
              key={node.id}
              tabIndex={0}
              role="button"
              aria-label={`Nodo ${node.label}, posizione ${index + 1} di ${positions.length}`}
              onClick={() => {
                if (sound) {
                  // Optionally play a sound here for node focus/hover
                }
                onNodeSelect(node);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNodeSelect(node);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={`var(--md-sys-color-primary${node.color})`}
                stroke="var(--md-sys-color-outline)"
                strokeWidth={2}
                className={`nka-shape-${node.shape}`}
              />
              <text 
                x={node.x} 
                y={node.y + 4} 
                textAnchor="middle" 
                fontSize="var(--md-sys-typescale-body-small-font-size)"
                fontFamily="var(--md-sys-typescale-body-small-font-family-name)"
                fontWeight="var(--md-sys-typescale-body-small-font-weight)"
                fill="var(--md-sys-color-on-primary-container)"
                aria-hidden="true"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </Paper>
  );
};

export default NKAForceMap;
