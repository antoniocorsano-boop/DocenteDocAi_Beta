/**
 * SystemPanel.tsx — Admin Panel unificato.
 *
 * Cruscotto operativo che mostra in un'unica vista lo stato dei tre layer:
 *   [System Health]     — colpo d'occhio: trust, capability, cognitive, compliance
 *   [Cognitive Activity]— CognitiveLayerPanel
 *   [Capability Status] — CapabilityPanel
 *   [Trust Chain]       — TrustChainPanel
 *
 * NON duplica logica — riusa i pannelli esistenti come sezioni collassabili.
 * Distingue da GovernanceDashboard (compliance/GDPR): questo è operational.
 *
 * MD3 Gold Compliant:
 *   - M3Surface, Accordion MUI v7, token var(--md-sys-color-*)
 *   - aria-label su ogni sezione interattiva
 *   - nessun layout <div> generico
 */

import React, { useEffect, useState } from 'react';
import Accordion          from '@mui/material/Accordion';
import AccordionDetails   from '@mui/material/AccordionDetails';
import AccordionSummary   from '@mui/material/AccordionSummary';
import Box                from '@mui/material/Box';
import Chip               from '@mui/material/Chip';
import Stack              from '@mui/material/Stack';
import Typography         from '@mui/material/Typography';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import VerifiedUserOutlinedIcon  from '@mui/icons-material/VerifiedUserOutlined';
import WarningAmberOutlinedIcon  from '@mui/icons-material/WarningAmberOutlined';
import RemoveCircleOutlineIcon   from '@mui/icons-material/RemoveCircleOutline';
import PsychologyOutlinedIcon    from '@mui/icons-material/PsychologyOutlined';
import ExtensionOutlinedIcon     from '@mui/icons-material/ExtensionOutlined';
import LockOpenOutlinedIcon      from '@mui/icons-material/LockOpenOutlined';
import PolicyOutlinedIcon        from '@mui/icons-material/PolicyOutlined';

import M3Surface         from '../../components/ui/M3Surface';
import CognitiveLayerPanel   from './CognitiveLayerPanel';
import CapabilityPanel       from './CapabilityPanel';
import { TrustChainPanel }   from './TrustChainPanel';
import GovernanceDashboard   from '../governance/GovernanceDashboard';

import { useCognitiveStore }   from '../../modules/cognitiveLayer/cognitiveStore';
import { listCapabilities }    from '../../modules/capabilitySystem/capabilityService';
import { useTrustStore }       from '../../modules/trustLayer/trustStore';
import { verifyChain }         from '../../modules/trustLayer/trustService';
import { useComplianceRuntime } from '../../hooks/useComplianceRuntime';
import type { TrustStatus }    from '../../modules/orchestration/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SystemPanelProps {
  tenantId: string;
  isAdmin?: boolean;
}

// ─── System Health metrics hook ───────────────────────────────────────────────

interface HealthMetrics {
  trustStatus:       TrustStatus;
  capabilityActive:  number;
  capabilityTotal:   number;
  cognitiveEntries:  number;
  complianceScore:   number;
}

function useHealthMetrics(tenantId: string): HealthMetrics {
  const { liveScore } = useComplianceRuntime();

  const [trustStatus, setTrustStatus] = useState<TrustStatus>('empty');

  useEffect(() => {
    const records = useTrustStore.getState().getByTenant(tenantId);
    if (records.length === 0) { setTrustStatus('empty'); return; }
    verifyChain(tenantId)
      .then(r => { setTrustStatus(r.valid ? 'verified' : 'broken'); })
      .catch(() => { setTrustStatus('broken'); });
  }, [tenantId]);

  const capabilities     = listCapabilities(tenantId);
  const capabilityActive = capabilities.filter(c => c.state === 'active').length;
  const capabilityTotal  = capabilities.length;

  const cognitiveEntries = useCognitiveStore.getState().listRecent(50, tenantId).length;

  return { trustStatus, capabilityActive, capabilityTotal, cognitiveEntries, complianceScore: liveScore };
}

// ─── Trust badge ──────────────────────────────────────────────────────────────

const TRUST_CONFIG: Record<TrustStatus, { label: string; color: string; icon: React.ReactNode }> = {
  verified: {
    label: 'Trust verificata',
    color: 'var(--md-sys-color-primary)',
    icon:  <VerifiedUserOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} />,
  },
  broken: {
    label: 'Trust corrotta',
    color: 'var(--md-sys-color-error)',
    icon:  <WarningAmberOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} />,
  },
  empty: {
    label: 'Nessun record',
    color: 'var(--md-sys-color-on-surface-variant)',
    icon:  <RemoveCircleOutlineIcon  sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} />,
  },
};

// ─── System Health Banner ─────────────────────────────────────────────────────

function SystemHealthBanner({ tenantId }: { tenantId: string }): React.JSX.Element {
  const { trustStatus, capabilityActive, capabilityTotal, cognitiveEntries, complianceScore } =
    useHealthMetrics(tenantId);

  const trust = TRUST_CONFIG[trustStatus];

  return (
    <M3Surface
      elevation={1}
      sx={{ p: 'var(--md-sys-spacing-3, 12px)', borderRadius: 2 }}
    >
      <Typography
        variant="titleMedium"
        component="h2"
        sx={{ mb: 'var(--md-sys-spacing-3, 12px)', color: 'var(--md-sys-color-on-surface)' }}
      >
        Stato sistema
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap="var(--md-sys-spacing-2, 8px)">
        {/* Trust status */}
        <Chip
          icon={<Box sx={{ color: trust.color, display: 'flex', pl: 0.5 }}>{trust.icon}</Box>}
          label={trust.label}
          aria-label={`Stato trust chain: ${trust.label}`}
          size="small"
          sx={{
            bgcolor: 'var(--md-sys-color-surface-variant)',
            color:   trust.color,
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          }}
        />

        {/* Capability */}
        <Chip
          icon={
            <Box sx={{ color: 'var(--md-sys-color-secondary)', display: 'flex', pl: 0.5 }}>
              <ExtensionOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} />
            </Box>
          }
          label={`${capabilityActive} / ${capabilityTotal} capability attive`}
          aria-label={`Capability: ${capabilityActive} su ${capabilityTotal} attive`}
          size="small"
          sx={{
            bgcolor:  'var(--md-sys-color-surface-variant)',
            color:    'var(--md-sys-color-on-surface-variant)',
          }}
        />

        {/* Cognitive entries */}
        <Chip
          icon={
            <Box sx={{ color: 'var(--md-sys-color-tertiary)', display: 'flex', pl: 0.5 }}>
              <PsychologyOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} />
            </Box>
          }
          label={`${cognitiveEntries} input cognitivi`}
          aria-label={`${cognitiveEntries} entry nel Cognitive Layer`}
          size="small"
          sx={{
            bgcolor:  'var(--md-sys-color-surface-variant)',
            color:    'var(--md-sys-color-on-surface-variant)',
          }}
        />

        {/* Compliance score */}
        <Chip
          icon={
            <Box
              sx={{
                color: complianceScore >= 80
                  ? 'var(--md-sys-color-primary)'
                  : complianceScore >= 60
                    ? 'var(--md-sys-color-tertiary)'
                    : 'var(--md-sys-color-error)',
                display: 'flex',
                pl: 0.5,
              }}
            >
              <LockOpenOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm, 20px)' }} />
            </Box>
          }
          label={`Compliance ${complianceScore}%`}
          aria-label={`Score di compliance: ${complianceScore}%`}
          size="small"
          sx={{
            bgcolor: 'var(--md-sys-color-surface-variant)',
            color:   'var(--md-sys-color-on-surface-variant)',
          }}
        />
      </Stack>
    </M3Surface>
  );
}

// ─── Accordion section helper ─────────────────────────────────────────────────

interface SectionAccordionProps {
  id:       string;
  title:    string;
  icon:     React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function SectionAccordion({
  id, title, icon, children, defaultExpanded = false,
}: SectionAccordionProps): React.JSX.Element {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{
        '&:before': { display: 'none' },
        borderRadius: '8px !important',
        border:  '1px solid var(--md-sys-color-outline-variant)',
        bgcolor: 'var(--md-sys-color-surface)',
        '&.Mui-expanded': {
          boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon aria-hidden />}
        aria-controls={`${id}-content`}
        id={`${id}-header`}
        sx={{
          minHeight: '44px !important',
          gap: 'var(--md-sys-spacing-2, 8px)',
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap:        'var(--md-sys-spacing-2, 8px)',
            my:         '8px',
          },
        }}
      >
        <Box
          component="span"
          sx={{ color: 'var(--md-sys-color-primary)', display: 'flex' }}
          aria-hidden
        >
          {icon}
        </Box>
        <Typography
          variant="titleSmall"
          component="span"
          sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
        >
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        id={`${id}-content`}
        sx={{ p: 0, borderTop: '1px solid var(--md-sys-color-outline-variant)' }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SystemPanel — cruscotto operativo unificato.
 *
 * Non è una rotta dedicata: può essere embeddato in qualsiasi layout admin.
 */
export default function SystemPanel({ tenantId, isAdmin = true }: SystemPanelProps): React.JSX.Element {
  return (
    <Stack
      spacing="var(--md-sys-spacing-3, 12px)"
      component="section"
      aria-label="Pannello di sistema"
    >
      {/* Status bar */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width:        6,
            height:       6,
            borderRadius: '50%',
            bgcolor:      'var(--md-sys-color-primary)',
            flexShrink:   0,
          }}
          aria-hidden
        />
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Sistema attivo
        </Typography>
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-outline)' }}>·</Typography>
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          Tutte le attività sono tracciate
        </Typography>
      </Stack>

      {/* Stato sistema — sempre visibile, non collassabile */}
      <SystemHealthBanner tenantId={tenantId} />

      {/* Cognitive Activity */}
      <SectionAccordion
        id="sys-cognitive"
        title="Attività"
        defaultExpanded
        icon={<PsychologyOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 24px)' }} />}
      >
        <CognitiveLayerPanel tenantId={tenantId} isAdmin={isAdmin} />
      </SectionAccordion>

      {/* Capability Status */}
      <SectionAccordion
        id="sys-capability"
        title="Funzionalità"
        defaultExpanded
        icon={<ExtensionOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 24px)' }} />}
      >
        <CapabilityPanel tenantId={tenantId} isAdmin={isAdmin} />
      </SectionAccordion>

      {/* Trust Chain */}
      <SectionAccordion
        id="sys-trust"
        title="Tracciabilità"
        icon={<VerifiedUserOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 24px)' }} />}
      >
        <TrustChainPanel tenantId={tenantId} isAdmin={isAdmin} />
      </SectionAccordion>

      {/* Governance & Compliance — solo admin */}
      {isAdmin && (
        <SectionAccordion
          id="sys-governance"
          title="Governance"
          icon={<PolicyOutlinedIcon sx={{ fontSize: 'var(--md-sys-icon-size-md, 24px)' }} />}
        >
          <Box sx={{ p: 'var(--md-sys-spacing-3, 12px)' }}>
            <GovernanceDashboard />
          </Box>
        </SectionAccordion>
      )}
    </Stack>
  );
}
