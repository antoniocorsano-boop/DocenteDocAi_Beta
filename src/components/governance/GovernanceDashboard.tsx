/**
 * GovernanceDashboard.tsx — C13: Dashboard governance avanzata.
 *
 * Mostra in un'unica vista:
 *   1. Score compliance live (gauge progress) con colore semantico
 *   2. Breakdown per framework (GDPR / AI Act / AgID — LinearProgress)
 *   3. Stato AI e modalità sovranità corrente
 *   4. Violazioni critiche attive (lista prioritizzata)
 *   5. Use case bloccati (badge con lista)
 *   6. Drift negativo (use case degradanti)
 *   7. Azioni rapide: Avvia ciclo compliance, Simula audit, Report
 *
 * MD3 Gold Compliant: M3Surface, token MD3, aria-label su interattivi.
 */

import React, { useMemo, useState } from 'react';
import Box            from '@mui/material/Box';
import Button         from '@mui/material/Button';
import Chip           from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider        from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import List           from '@mui/material/List';
import ListItem       from '@mui/material/ListItem';
import ListItemText   from '@mui/material/ListItemText';
import Stack          from '@mui/material/Stack';
import Typography     from '@mui/material/Typography';
import M3Surface      from '../ui/M3Surface';
import { useComplianceRuntime } from '../../hooks/useComplianceRuntime';
import { useSovereigntyStore }  from '../../stores/useSovereigntyStore';
import {
  getDegradingUseCases,
}                              from '../../cognition/adaptiveAssistant';
import {
  getBlockedUseCases,
  checkConsistency,
}                              from '../../cognition/runtimeConsistency';
import { USE_CASE_LABELS }     from '../../cognition/useCaseTelemetry';
import { useComplianceStore }  from '../../self-compliance/useComplianceStore';
import type { RuleFramework }  from '../../self-compliance/runtime/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FRAMEWORK_LABELS: Record<RuleFramework, string> = {
  GDPR:    'GDPR Art. 5-46',
  AI_ACT:  'AI Act Titolo III',
  AGID:    'AgID / CAD',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--md-sys-color-primary)';
  if (score >= 60) return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-error)';
}

function severityColor(sev: string): string {
  if (sev === 'critical') return 'var(--md-sys-color-error)';
  if (sev === 'high')     return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-on-surface-variant)';
}

// ─── Component ────────────────────────────────────────────────────────────────

const GovernanceDashboard: React.FC = () => {
  const { result, liveScore, violations, remediate } = useComplianceRuntime();
  const { config }    = useSovereigntyStore();
  const runCycle      = useComplianceStore((s) => s.runCycle);
  const [running,     setRunning]   = useState(false);
  const [lastCycleMsg, setLastMsg]  = useState('');

  const degrading  = useMemo(() => getDegradingUseCases(), []);
  const blocked    = useMemo(() => getBlockedUseCases(),   []);
  const consistency = useMemo(() => checkConsistency(),   []);

  const criticalViols = violations.filter((v) => v.severity === 'critical' || v.severity === 'high');

  const handleRunCycle = () => {
    setRunning(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      runCycle(today);
      setLastMsg(`Ciclo completato — score: ${liveScore}%`);
    } catch {
      setLastMsg('Errore durante il ciclo compliance.');
    } finally {
      setRunning(false);
    }
  };

  const modeColor =
    config.mode === 'offline_only'
      ? 'var(--md-sys-color-secondary-container)'
      : config.mode === 'assistive_ai'
        ? 'var(--md-sys-color-primary-container)'
        : 'var(--md-sys-color-tertiary-container)';

  const modeLabel: Record<string, string> = {
    offline_only:  'Solo locale',
    assistive_ai:  'AI assistiva',
    autonomous_ai: 'AI autonoma',
  };

  return (
    <Stack gap="var(--md-sys-spacing-4)">

      {/* ── Consistency issues banner ── */}
      {consistency.issues.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-error-container)',
            border:  '1px solid var(--md-sys-color-error)',
          }}
        >
          <Stack gap="var(--md-sys-spacing-1)">
            <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-error)' }}
              >
                warning
              </Box>
              <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
                Inconsistenze rilevate
              </Typography>
            </Stack>
            {consistency.issues.map((iss, i) => (
              <Typography key={i} variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-error-container)' }}>
                • {iss}
              </Typography>
            ))}
          </Stack>
        </M3Surface>
      )}

      {/* ── Score globale ── */}
      <M3Surface
        elevation={1}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-large)',
          p: 'var(--md-sys-spacing-4)',
        }}
      >
        <Stack direction="row" gap="var(--md-sys-spacing-4)" alignItems="center" flexWrap="wrap">
          {/* Gauge */}
          <Box
            sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
            role="img"
            aria-label={`Score compliance: ${liveScore}%`}
          >
            <CircularProgress
              variant="determinate"
              value={liveScore}
              size={88}
              thickness={5}
              sx={{ color: scoreColor(liveScore) }}
            />
            <Box
              sx={{
                top: 0, left: 0, bottom: 0, right: 0,
                position: 'absolute',
                display:  'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="titleLarge"
                sx={{ color: scoreColor(liveScore), fontVariantNumeric: 'tabular-nums' }}
              >
                {liveScore}%
              </Typography>
            </Box>
          </Box>

          <Stack gap="var(--md-sys-spacing-2)" flex={1} minWidth={200}>
            <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center" flexWrap="wrap">
              <Chip
                label={result.compliant ? 'PA-Ready' : 'Non PA-Ready'}
                size="small"
                sx={{
                  bgcolor: result.compliant
                    ? 'var(--md-sys-color-primary-container)'
                    : 'var(--md-sys-color-error-container)',
                  color: result.compliant
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-error-container)',
                }}
              />
              <Chip
                label={modeLabel[config.mode] ?? config.mode}
                size="small"
                sx={{ bgcolor: modeColor }}
              />
              {!config.aiEnabled && (
                <Chip
                  label="AI disabilitata"
                  size="small"
                  sx={{ bgcolor: 'var(--md-sys-color-secondary-container)' }}
                />
              )}
            </Stack>

            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {result.passedRules}/{result.totalRules} regole superate ·
              {criticalViols.length > 0
                ? ` ${criticalViols.length} violazioni critiche/alte`
                : ' Nessuna violazione critica'}
            </Typography>

            {lastCycleMsg && (
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-primary)' }}>
                {lastCycleMsg}
              </Typography>
            )}
          </Stack>
        </Stack>
      </M3Surface>

      {/* ── Framework breakdown ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-3)',
          bgcolor: 'var(--md-sys-color-surface-variant)',
        }}
      >
        <Stack gap="var(--md-sys-spacing-3)">
          <Typography variant="labelMedium">Punteggi per framework</Typography>
          {(Object.entries(result.frameworkScores) as [RuleFramework, typeof result.frameworkScores[RuleFramework]][]).map(
            ([fw, fs]) => {
              const score = Math.round(fs.score);
              return (
                <Stack key={fw} gap="var(--md-sys-spacing-1)">
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="bodySmall">{FRAMEWORK_LABELS[fw]}</Typography>
                    <Typography
                      variant="labelSmall"
                      sx={{ color: scoreColor(score), fontVariantNumeric: 'tabular-nums' }}
                    >
                      {score}% ({fs.passed}/{fs.total})
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    aria-label={`${FRAMEWORK_LABELS[fw]}: ${score}%`}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'var(--md-sys-color-surface)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: scoreColor(score),
                        borderRadius: 3,
                      },
                    }}
                  />
                </Stack>
              );
            },
          )}
        </Stack>
      </M3Surface>

      {/* ── Violazioni critiche ── */}
      {criticalViols.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-surface-variant)',
          }}
        >
          <Stack gap="var(--md-sys-spacing-2)">
            <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-error)' }}
              >
                gpp_bad
              </Box>
              <Typography variant="labelMedium">Violazioni prioritarie</Typography>
              <Chip
                label={criticalViols.length}
                size="small"
                sx={{ bgcolor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}
              />
            </Stack>
            <List disablePadding dense>
              {criticalViols.slice(0, 5).map((v) => (
                <ListItem key={v.ruleId} disableGutters sx={{ py: 'var(--md-sys-spacing-1)' }}>
                  <ListItemText
                    primary={
                      <Typography variant="bodySmall" sx={{ color: severityColor(v.severity) }}>
                        [{v.severity.toUpperCase()}] {v.message}
                      </Typography>
                    }
                    secondary={
                      v.suggestedFix
                        ? <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            → {v.suggestedFix}
                          </Typography>
                        : null
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
        </M3Surface>
      )}

      {/* ── Use case bloccati ── */}
      {blocked.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-surface-variant)',
          }}
        >
          <Stack gap="var(--md-sys-spacing-2)">
            <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-secondary)' }}
              >
                block
              </Box>
              <Typography variant="labelMedium">Use case non disponibili in modalità corrente</Typography>
            </Stack>
            <Stack direction="row" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
              {blocked.map((b) => (
                <Chip
                  key={b.useCaseId}
                  label={USE_CASE_LABELS[b.useCaseId] ?? b.useCaseId}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)' }}
                />
              ))}
            </Stack>
          </Stack>
        </M3Surface>
      )}

      {/* ── Drift negativo ── */}
      {degrading.length > 0 && (
        <M3Surface
          elevation={0}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            p: 'var(--md-sys-spacing-3)',
            bgcolor: 'var(--md-sys-color-surface-variant)',
          }}
        >
          <Stack gap="var(--md-sys-spacing-2)">
            <Stack direction="row" gap="var(--md-sys-spacing-1)" alignItems="center">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-tertiary)' }}
              >
                trending_down
              </Box>
              <Typography variant="labelMedium">Use case in drift negativo ({degrading.length})</Typography>
            </Stack>
            <Stack direction="row" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
              {degrading.map((p) => (
                <Chip
                  key={p.useCaseId}
                  label={p.label}
                  size="small"
                  sx={{
                    bgcolor: 'var(--md-sys-color-tertiary-container)',
                    color:   'var(--md-sys-color-on-tertiary-container)',
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </M3Surface>
      )}

      <Divider />

      {/* ── Azioni rapide ── */}
      <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
        <Button
          variant="outlined"
          size="small"
          disabled={running}
          onClick={handleRunCycle}
          aria-label="Avvia un ciclo di valutazione compliance immediato"
          sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
          startIcon={
            running
              ? <CircularProgress size={14} />
              : <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>refresh</Box>
          }
        >
          Avvia ciclo compliance
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => remediate('export_audit')}
          aria-label="Esporta il pacchetto audit"
          sx={{ textTransform: 'none', borderRadius: 'var(--md-sys-shape-corner-full)' }}
          startIcon={
            <Box component="span" className="material-symbols-outlined" aria-hidden="true"
              sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}>download</Box>
          }
        >
          Esporta audit
        </Button>
      </Stack>

    </Stack>
  );
};

export default GovernanceDashboard;
