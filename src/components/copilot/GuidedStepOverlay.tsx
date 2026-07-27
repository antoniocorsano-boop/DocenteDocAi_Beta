/**
 * GuidedStepOverlay — Non-blocking step-by-step guidance panel.
 *
 * Shows the current ExecutionStep as a bottom-anchored card.
 * The user can still navigate freely — the overlay follows along.
 *
 * MD3 Gold Compliant — all sizing/spacing via tokens.
 */

import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import M3Surface from '../ui/M3Surface';
import { useGuidedExecutionStore } from '../../stores/useGuidedExecutionStore';
import { resolveCurrentStep } from '../../cognition/guidedExecution';

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onNavigate?: (view: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

const GuidedStepOverlay: React.FC<Props> = ({ onNavigate }) => {
  const { isActive, plan, currentStepIndex, nextStep, exit } = useGuidedExecutionStore();

  const handleNext = useCallback(() => {
    if (!plan) return;
    nextStep();
    // Navigate to the next step's view if defined
    const nextIdx = currentStepIndex + 1;
    const nextStepObj = plan.steps[nextIdx];
    if (nextStepObj?.targetView && onNavigate) {
      onNavigate(nextStepObj.targetView);
    }
  }, [plan, currentStepIndex, nextStep, onNavigate]);

  if (!isActive || !plan) return null;

  const step = resolveCurrentStep(plan, currentStepIndex);
  if (!step) return null;

  const isLast = currentStepIndex === plan.steps.length - 1;
  const progress = ((currentStepIndex) / plan.steps.length) * 100;
  const stepNum = currentStepIndex + 1;
  const total = plan.steps.length;

  return (
    <>
      {/* ── CSS keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes guided-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes guided-step-appear {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* ── Overlay panel — anchored bottom, left-aligned, above FAB ──────── */}
      <Box
        role="status"
        aria-live="polite"
        aria-label={`Guida passo ${stepNum} di ${total}: ${step.label}`}
        sx={{
          position: 'fixed',
          bottom: 'calc(56px + var(--md-sys-spacing-4) + max(var(--md-sys-spacing-5), env(safe-area-inset-bottom, 20px)))',
          left:   'var(--md-sys-spacing-4)',
          right:  'calc(56px + var(--md-sys-spacing-5))',
          maxWidth: 420,
          zIndex: 1397,
          animation: 'guided-slide-up var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized) forwards',
          willChange: 'transform, opacity',
        }}
      >
        <M3Surface
          elevation={2}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            overflow: 'hidden',
            bgcolor: 'var(--md-sys-color-surface-container-high)',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-hidden="true"
            sx={{
              height: 3,
              borderRadius: 0,
              bgcolor: 'var(--md-sys-color-surface-container)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'var(--md-sys-color-primary)',
              },
            }}
          />

          <Stack sx={{ p: 'var(--md-sys-spacing-4)', gap: 'var(--md-sys-spacing-3)' }}>

            {/* ── Step counter + icon row ──────────────────────────────── */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    bgcolor: 'var(--md-sys-color-primary-container)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }}
                  >
                    {step.icon}
                  </Box>
                </Box>
                <Typography
                  variant="labelMedium"
                  sx={{ color: 'var(--md-sys-color-primary)' }}
                >
                  Passo {stepNum} di {total}
                </Typography>
              </Stack>

              {/* Exit link */}
              <Button
                size="small"
                variant="text"
                onClick={exit}
                aria-label="Esci dalla guida passo-passo"
                sx={{
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                  minWidth: 0,
                  px: 'var(--md-sys-spacing-2)',
                }}
              >
                Esci
              </Button>
            </Stack>

            {/* ── Step content ────────────────────────────────────────── */}
            <Box
              key={step.id}
              sx={{ animation: 'guided-step-appear var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard) forwards' }}
            >
              <Typography
                variant="titleSmall"
                component="h2"
                sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-1)' }}
              >
                {step.label}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}
              >
                {step.instruction}
              </Typography>
            </Box>

            {/* ── Step dots ───────────────────────────────────────────── */}
            <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center" aria-hidden="true">
              {plan.steps.map((s, i) => (
                <Box
                  key={s.id}
                  sx={{
                    width:  i === currentStepIndex ? 16 : 6,
                    height: 6,
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    bgcolor: i < currentStepIndex
                      ? 'var(--md-sys-color-primary)'
                      : i === currentStepIndex
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-outline-variant)',
                    opacity: i > currentStepIndex ? 0.5 : 1,
                    transition: 'width var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard), background-color var(--md-sys-motion-duration-short2) linear',
                  }}
                />
              ))}
            </Stack>

            {/* ── Next step CTA ────────────────────────────────────────── */}
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={handleNext}
              aria-label={isLast ? 'Completa la guida' : `Avanza al passo ${stepNum + 1}`}
              endIcon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
                >
                  {isLast ? 'check_circle' : 'arrow_forward'}
                </Box>
              }
              sx={{
                borderRadius: 'var(--md-sys-shape-corner-full)',
                fontSize: 'var(--md-sys-typescale-label-medium-font-size)',
              }}
            >
              {isLast ? 'Fatto!' : 'Prossimo passo'}
            </Button>

          </Stack>
        </M3Surface>
      </Box>
    </>
  );
};

GuidedStepOverlay.displayName = 'GuidedStepOverlay';
export default GuidedStepOverlay;
