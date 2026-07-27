/**
 * EscalationConfigPanel.tsx — C16: Visualizzazione configurazione escalation e cicli audit.
 *
 * Legge la configurazione da buildContinuousComplianceModel() e mostra:
 *   1. Regole di escalation (trigger, severity, target, tempo risposta, azione automatica)
 *   2. Cicli audit pianificati (daily / weekly / monthly / quarterly / annual)
 *
 * View-only — la configurazione risiede in continuousComplianceModel.ts.
 */

import React, { useMemo } from 'react';
import Box          from '@mui/material/Box';
import Chip         from '@mui/material/Chip';
import Divider      from '@mui/material/Divider';
import Stack        from '@mui/material/Stack';
import Table        from '@mui/material/Table';
import TableBody    from '@mui/material/TableBody';
import TableCell    from '@mui/material/TableCell';
import TableHead    from '@mui/material/TableHead';
import TableRow     from '@mui/material/TableRow';
import Typography   from '@mui/material/Typography';
import M3Surface    from '../ui/M3Surface';
import { buildContinuousComplianceModel } from '../../self-compliance/certification/continuousComplianceModel';
import type { EscalationRule, AuditCycle } from '../../self-compliance/certification/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function severityColor(s: EscalationRule['severity']): string {
  const map: Record<EscalationRule['severity'], string> = {
    critical: 'var(--md-sys-color-error-container)',
    high:     'var(--md-sys-color-error-container)',
    medium:   'var(--md-sys-color-secondary-container)',
    low:      'var(--md-sys-color-surface-variant)',
  };
  return map[s];
}

function severityTextColor(s: EscalationRule['severity']): string {
  const map: Record<EscalationRule['severity'], string> = {
    critical: 'var(--md-sys-color-on-error-container)',
    high:     'var(--md-sys-color-on-error-container)',
    medium:   'var(--md-sys-color-on-secondary-container)',
    low:      'var(--md-sys-color-on-surface-variant)',
  };
  return map[s];
}

function frequencyLabel(f: AuditCycle['frequency']): string {
  const map: Record<AuditCycle['frequency'], string> = {
    daily:     'Giornaliero',
    weekly:    'Settimanale',
    monthly:   'Mensile',
    quarterly: 'Trimestrale',
    annual:    'Annuale',
  };
  return map[f];
}

function frequencyColor(f: AuditCycle['frequency']): string {
  const map: Record<AuditCycle['frequency'], string> = {
    daily:     'var(--md-sys-color-primary-container)',
    weekly:    'var(--md-sys-color-secondary-container)',
    monthly:   'var(--md-sys-color-tertiary-container)',
    quarterly: 'var(--md-sys-color-surface-variant)',
    annual:    'var(--md-sys-color-surface-variant)',
  };
  return map[f];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EscalationConfigPanel(): React.JSX.Element {
  const model = useMemo(() => buildContinuousComplianceModel(), []);

  return (
    <Stack gap="var(--md-sys-spacing-5)">
      {/* ── Header ── */}
      <Stack gap="var(--md-sys-spacing-1)">
        <Typography variant="titleLarge">Configurazione Escalation</Typography>
        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Regole di escalation automatica e piano cicli audit — aggiornato al {model.generatedAt}
        </Typography>
      </Stack>

      {/* ── Escalation rules ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          overflow: 'hidden',
          border: '1px solid var(--md-sys-color-outline-variant)',
        }}
      >
        <Box sx={{ p: 'var(--md-sys-spacing-3)', bgcolor: 'var(--md-sys-color-surface-variant)' }}>
          <Typography variant="titleSmall">Regole di escalation ({model.escalationRules.length})</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Regole di escalation">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}><Typography variant="labelSmall">Trigger</Typography></TableCell>
                <TableCell><Typography variant="labelSmall">Severity</Typography></TableCell>
                <TableCell sx={{ minWidth: 160 }}><Typography variant="labelSmall">Destinatario</Typography></TableCell>
                <TableCell align="center"><Typography variant="labelSmall">Risposta (h)</Typography></TableCell>
                <TableCell sx={{ minWidth: 200 }}><Typography variant="labelSmall">Azione automatica</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {model.escalationRules.map((rule, i) => (
                <TableRow key={i} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="bodySmall">{rule.triggerCondition}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.severity.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor:    severityColor(rule.severity),
                        color:      severityTextColor(rule.severity),
                        fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                        fontSize:   'var(--md-sys-typescale-label-small-font-size)',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="bodySmall">{rule.escalationTarget}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="labelMedium"
                      sx={{
                        color: rule.responseTimeHours <= 4
                          ? 'var(--md-sys-color-error)'
                          : rule.responseTimeHours <= 24
                            ? 'var(--md-sys-color-secondary)'
                            : 'var(--md-sys-color-on-surface-variant)',
                      }}
                    >
                      {rule.responseTimeHours}h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {rule.automatedAction}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </M3Surface>

      {/* ── Audit cycles ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        <Typography variant="titleSmall">Piano cicli audit ({model.auditCycles.length})</Typography>
        <Stack gap="var(--md-sys-spacing-2)">
          {model.auditCycles.map((cycle, i) => (
            <M3Surface
              key={i}
              elevation={0}
              sx={{
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                p: 'var(--md-sys-spacing-3)',
                border: '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              <Stack gap="var(--md-sys-spacing-2)">
                <Stack direction="row" gap="var(--md-sys-spacing-2)" alignItems="center" flexWrap="wrap">
                  <Chip
                    label={frequencyLabel(cycle.frequency)}
                    size="small"
                    sx={{
                      bgcolor:    frequencyColor(cycle.frequency),
                      color:      'var(--md-sys-color-on-surface)',
                      fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                    }}
                  />
                  <Typography variant="labelMedium">{cycle.type.replace(/_/g, ' ')}</Typography>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Responsabile: {cycle.owner}
                  </Typography>
                </Stack>
                <Typography variant="bodySmall">{cycle.description}</Typography>
                {cycle.artifacts.length > 0 && (
                  <Stack direction="row" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
                    {cycle.artifacts.map((a, j) => (
                      <Chip
                        key={j}
                        label={a}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 'var(--md-sys-typescale-label-small-font-size)', height: 22 }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </M3Surface>
          ))}
        </Stack>
      </Stack>

      <Divider />
      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        Configurazione definita in <code>continuousComplianceModel.ts</code> — modificabile lato codice dal team compliance.
        Obbligatorio per AI Act Art. 9 (sistema di gestione del rischio) e GDPR Art. 24 (misure tecniche).
      </Typography>
    </Stack>
  );
}
