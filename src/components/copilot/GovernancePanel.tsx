/**
 * GovernancePanel.tsx
 * Pannello governance formale — AI Act + GDPR — MD3 Gold Compliant.
 *
 * Mostra e consente di modificare:
 *   1. Informazioni sistema (nome, ente, versione, data revisione)
 *   2. Ruoli e responsabilità obbligatori per AI Act + GDPR
 *      (DPO, Responsabile AI, Responsabile Audit, Titolare Trattamento)
 *
 * I valori sono persistiti nel Zustand store e confluiscono nel PDF verbale PA.
 */

import React from 'react';
import Box            from '@mui/material/Box';
import Stack          from '@mui/material/Stack';
import Typography     from '@mui/material/Typography';
import TextField      from '@mui/material/TextField';
import Button         from '@mui/material/Button';
import Chip           from '@mui/material/Chip';
import Divider        from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip        from '@mui/material/Tooltip';
import M3Surface      from '../ui/M3Surface';
import GovernanceControlPanel from '../governance/GovernanceControlPanel';
import { useGovernanceStore } from '../../self-compliance/governance';
import type { GovernanceConfig } from '../../self-compliance/governance';

// ── Ruoli nominati: configurazione roles ─────────────────────────────────────

type RoleKey = 'dpo' | 'aiOfficer' | 'auditResponsible' | 'processorName';

const ROLES: Array<{
  key:   RoleKey;
  label: string;
  ref:   string;
}> = [
  {
    key:   'dpo',
    label: 'DPO — Data Protection Officer',
    ref:   'GDPR Art. 37 — obbligatorio per PA che trattano dati su larga scala',
  },
  {
    key:   'aiOfficer',
    label: 'Responsabile AI',
    ref:   'AI Act Art. 9(2) — supervisione del sistema di gestione del rischio',
  },
  {
    key:   'auditResponsible',
    label: 'Responsabile Audit Interno',
    ref:   'AI Act Art. 17 — gestione del sistema di qualità e audit periodici',
  },
  {
    key:   'processorName',
    label: 'Titolare del Trattamento',
    ref:   'GDPR Art. 4(7) — determina finalità e mezzi del trattamento',
  },
];

// ── GovernancePanel ────────────────────────────────────────────────────────────

const GovernancePanel: React.FC = () => {
  const { config, updateConfig, resetConfig } = useGovernanceStore();

  const nominatedCount = ROLES.filter(r => config[r.key] !== 'Da nominare').length;
  const completeness   = (nominatedCount / ROLES.length) * 100;

  const statusMsg =
    nominatedCount === ROLES.length
      ? 'Governance AI Act Art. 9 conforme — tutti i ruoli nominati'
      : nominatedCount >= 2
        ? `Governance parziale — ${ROLES.length - nominatedCount} ruoli non ancora nominati`
        : 'Governance incompleta — AI Act Art. 9 non soddisfatto';

  const statusColor =
    nominatedCount === ROLES.length
      ? 'var(--md-sys-color-primary)'
      : nominatedCount >= 2
        ? 'var(--md-sys-color-tertiary)'
        : 'var(--md-sys-color-error)';

  const field = (
    key:         keyof GovernanceConfig,
    label:       string,
    ariaLabel:   string,
    flexValue?:  number | string,
    minW?:       number,
  ) => (
    <TextField
      label={label}
      value={config[key]}
      size="small"
      onChange={(e) => updateConfig({ [key]: e.target.value })}
      inputProps={{ 'aria-label': ariaLabel }}
      sx={{ flexGrow: flexValue ?? 1, minWidth: minW ?? 140 }}
    />
  );

  return (
    <Stack gap="var(--md-sys-spacing-4)">

      {/* ── Completeness indicator ── */}
      <M3Surface
        elevation={0}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-3)',
          border: `1px solid ${statusColor}`,
        }}
      >
        <Stack gap="var(--md-sys-spacing-2)">
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="var(--md-sys-spacing-1)">
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)">
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: statusColor }}
              >
                {nominatedCount === ROLES.length ? 'verified_user' : 'policy'}
              </Box>
              <Typography variant="labelMedium" sx={{ color: statusColor }}>
                {statusMsg}
              </Typography>
            </Stack>
            <Typography
              variant="labelSmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontVariantNumeric: 'tabular-nums' }}
            >
              {nominatedCount}/{ROLES.length} ruoli nominati
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={completeness}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'var(--md-sys-color-surface-variant)',
              '& .MuiLinearProgress-bar': { bgcolor: statusColor, borderRadius: 3 },
            }}
          />
        </Stack>
      </M3Surface>

      {/* ── Informazioni sistema ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Informazioni sistema
        </Typography>
        <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
          {field('systemName',       'Nome sistema',        'Nome del sistema IA',               2, 160)}
          {field('organizationName', 'Ente / Istituzione',  'Nome ente o istituzione erogatrice', 3, 200)}
          {field('version',          'Versione',            'Versione del sistema',               0, 90)}
          {field('lastReview',       'Ultima revisione',    'Data ultima revisione documentazione (AAAA-MM-GG)', 0, 140)}
        </Stack>
      </Stack>

      <Divider />

      {/* ── Ruoli e responsabilità ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Ruoli e responsabilità — richiesti da AI Act + GDPR
        </Typography>
        <Stack gap="var(--md-sys-spacing-3)">
          {ROLES.map((role) => {
            const isNominated = config[role.key] !== 'Da nominare';
            return (
              <M3Surface
                key={role.key}
                elevation={0}
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  p: 'var(--md-sys-spacing-3)',
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                  borderLeft: isNominated
                    ? '3px solid var(--md-sys-color-primary)'
                    : '3px solid var(--md-sys-color-error)',
                }}
              >
                <Stack gap="var(--md-sys-spacing-2)">
                  <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
                    <Box
                      component="span"
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      sx={{
                        fontSize: 'var(--md-sys-icon-size-xs)',
                        color: isNominated
                          ? 'var(--md-sys-color-primary)'
                          : 'var(--md-sys-color-error)',
                        flexShrink: 0,
                      }}
                    >
                      {isNominated ? 'verified_user' : 'person_off'}
                    </Box>
                    <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                      {role.label}
                    </Typography>
                    <Chip
                      label={role.ref}
                      size="small"
                      sx={{
                        fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                        height: 'auto',
                        bgcolor: 'transparent',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        '& .MuiChip-label': { whiteSpace: 'normal', py: '2px', px: 'var(--md-sys-spacing-2)' },
                      }}
                    />
                  </Stack>
                  <TextField
                    value={config[role.key]}
                    size="small"
                    placeholder="Inserisci nome e ruolo"
                    onChange={(e) => updateConfig({ [role.key]: e.target.value })}
                    fullWidth
                    inputProps={{ 'aria-label': `${role.label} — nominativo` }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isNominated
                          ? 'transparent'
                          : 'var(--md-sys-color-error-container)',
                      },
                    }}
                  />
                </Stack>
              </M3Surface>
            );
          })}
        </Stack>
      </Stack>

      {/* ── Reset ── */}
      <Box>
        <Tooltip title="Ripristina i valori predefiniti — i ruoli torneranno a 'Da nominare'">
          <Button
            variant="text"
            size="small"
            onClick={resetConfig}
            startIcon={
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 'var(--md-sys-icon-size-xs)' }}
              >
                restart_alt
              </Box>
            }
            sx={{ textTransform: 'none', color: 'var(--md-sys-color-on-surface-variant)' }}
            aria-label="Ripristina configurazione governance ai valori predefiniti"
          >
            Ripristina predefiniti
          </Button>
        </Tooltip>
      </Box>

      <Divider />

      {/* ── Controllo AI e Dati (Layer Zero — Sovranità Operativa) ── */}
      <Stack gap="var(--md-sys-spacing-2)">
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Controllo AI e Dati
        </Typography>
        <GovernanceControlPanel />
      </Stack>

    </Stack>
  );
};

export default GovernancePanel;
