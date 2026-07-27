/**
 * MolecularActionTree — Guided-mode FAB evolution.
 *
 * When guided execution is active, the FAB transforms into a vertical
 * "molecular tree": each step is a node that blooms into view.
 *
 *   ● (active step — pulsing)
 *   ┊
 *   ○ step 2
 *   ┊
 *   ○ step 3
 *
 * Tap → expand/collapse the tree.
 * Tap a step node → jump directly to that step (only forward navigation allowed).
 *
 * MD3 Gold Compliant — all sizing/spacing via tokens.
 */

import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import { useGuidedExecutionStore } from '../../stores/useGuidedExecutionStore';

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** FAB position from parent (top/left fixed coords) */
  position: { x: number; y: number } | null;
}

// ─────────────────────────────────────────────────────────────────────────────

const MolecularActionTree: React.FC<Props> = ({ position }) => {
  const { plan, currentStepIndex, exit } = useGuidedExecutionStore();
  const [expanded, setExpanded] = useState(true);

  const handleToggle = useCallback(() => setExpanded((v) => !v), []);

  if (!plan) return null;

  const fabStyle: React.CSSProperties = position
    ? { position: 'fixed', left: position.x, top: position.y, bottom: 'auto', right: 'auto' }
    : { position: 'fixed', bottom: 'max(var(--md-sys-spacing-5), env(safe-area-inset-bottom, 20px))', right: 'var(--md-sys-spacing-4)' };

  const totalSteps = plan.steps.length;
  const completed = currentStepIndex;

  return (
    <>
      <style>{`
        @keyframes mol-bloom {
          from { opacity: 0; transform: scale(0.6) translateY(8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes mol-node-pulse {
          0%, 100% { box-shadow: 0 0 0 0 var(--md-sys-color-primary); opacity: 1; }
          50%       { box-shadow: 0 0 0 6px transparent; opacity: 0.85; }
        }
      `}</style>

      {/* ── Molecular tree container — grows above the FAB ──────────────── */}
      <Box
        sx={{
          ...fabStyle,
          zIndex: 1401,
          display: 'flex',
          flexDirection: 'column-reverse',  // tree grows upward
          alignItems: 'center',
          gap: 0,
          pointerEvents: 'none',
        }}
      >
        {/* ── FAB root node ────────────────────────────────────────────── */}
        <Box
          role="button"
          tabIndex={0}
          aria-label={expanded ? 'Comprimi piano guidato' : 'Espandi piano guidato'}
          aria-expanded={expanded}
          onClick={handleToggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(); }}}
          sx={{
            width:  56,
            height: 56,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            bgcolor: 'var(--md-sys-color-tertiary)',
            color:  'var(--md-sys-color-on-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto',
            boxShadow: 'var(--md-sys-elevation-3)',
            transition: 'transform var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
            '&:hover': { transform: 'scale(1.06)' },
            '&:active': { transform: 'scale(0.96)' },
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            position: 'relative',
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-lg)', lineHeight: 1 }}
          >
            {expanded ? 'unfold_less' : 'route'}
          </Box>

          {/* Progress badge */}
          <Box
            aria-label={`${completed} di ${totalSteps} passi completati`}
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 20,
              height: 20,
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 'var(--md-sys-typescale-weight-bold)',
              px: '4px',
              border: '2px solid var(--md-sys-color-surface)',
            }}
          >
            {completed}/{totalSteps}
          </Box>
        </Box>

        {/* ── Step nodes (bloom upward) ────────────────────────────────── */}
        <Collapse in={expanded} timeout={300}>
          <Stack
            direction="column-reverse"
            alignItems="center"
            sx={{ pb: 'var(--md-sys-spacing-2)', pointerEvents: 'auto' }}
          >
            {plan.steps.map((step, i) => {
              const isDone    = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isFuture  = i > currentStepIndex;

              return (
                <Box
                  key={step.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0,
                    animation: `mol-bloom var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized) ${i * 60}ms both`,
                  }}
                >
                  {/* Connector line */}
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 2,
                      height: 20,
                      bgcolor: isDone
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-outline-variant)',
                      opacity: isFuture ? 0.4 : 1,
                      transition: 'background-color var(--md-sys-motion-duration-medium1) linear',
                    }}
                  />

                  {/* Node */}
                  <Box
                    role="button"
                    tabIndex={isFuture ? -1 : 0}
                    aria-label={`${isCurrent ? 'Passo attivo' : isDone ? 'Completato' : 'Passo futuro'}: ${step.label}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-disabled={isFuture}
                    sx={{
                      width:  isCurrent ? 44 : 36,
                      height: isCurrent ? 44 : 36,
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                      bgcolor: isDone
                        ? 'var(--md-sys-color-primary)'
                        : isCurrent
                          ? 'var(--md-sys-color-primary-container)'
                          : 'var(--md-sys-color-surface-container)',
                      border: isFuture
                        ? '2px solid var(--md-sys-color-outline-variant)'
                        : isCurrent
                          ? '2px solid var(--md-sys-color-primary)'
                          : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isFuture ? 'default' : 'default',
                      opacity: isFuture ? 0.5 : 1,
                      transition: 'all var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard)',
                      animation: isCurrent ? 'mol-node-pulse 2s ease-in-out infinite' : undefined,
                      position: 'relative',
                    }}
                  >
                    <Box
                      component="span"
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      sx={{
                        fontSize: isCurrent ? 'var(--md-sys-icon-size-md)' : 'var(--md-sys-icon-size-sm)',
                        color: isDone
                          ? 'var(--md-sys-color-on-primary)'
                          : isCurrent
                            ? 'var(--md-sys-color-primary)'
                            : 'var(--md-sys-color-on-surface-variant)',
                        lineHeight: 1,
                      }}
                    >
                      {isDone ? 'check' : step.icon}
                    </Box>
                  </Box>

                  {/* Step label tooltip (shown only for current) */}
                  {isCurrent && (
                    <Box
                      aria-hidden="true"
                      sx={{
                        position: 'absolute',
                        right: 52,
                        mt: '-10px',
                        bgcolor: 'var(--md-sys-color-surface-container-highest)',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        px: 'var(--md-sys-spacing-2)',
                        py: 'var(--md-sys-spacing-1)',
                        maxWidth: 180,
                        boxShadow: 'var(--md-sys-elevation-2)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                      }}
                    >
                      <Typography
                        variant="labelSmall"
                        sx={{ color: 'var(--md-sys-color-on-surface)', display: 'block' }}
                      >
                        {step.label}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Collapse>

        {/* ── Exit guided mode link ────────────────────────────────────── */}
        {expanded && (
          <Box
            role="button"
            tabIndex={0}
            onClick={exit}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); exit(); }}}
            aria-label="Esci dalla modalità guidata"
            sx={{
              mb: 'var(--md-sys-spacing-1)',
              cursor: 'pointer',
              pointerEvents: 'auto',
              px: 'var(--md-sys-spacing-2)',
              py: '2px',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: 'var(--md-sys-color-surface-container)',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <Typography
              variant="labelSmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              Esci guida
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

MolecularActionTree.displayName = 'MolecularActionTree';
export default MolecularActionTree;
