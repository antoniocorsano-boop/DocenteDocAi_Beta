/**
 * CapabilityPanel.tsx
 *
 * Pannello admin per la visualizzazione e gestione delle capability per tenant.
 *
 * Features:
 *   - Lista capability raggruppate per categoria
 *   - Stato visivo: ACTIVE (verde), LOCKED (arancio + CTA), HIDDEN (grigio)
 *   - Sblocco diretto capability da UI (solo admin)
 *   - Filtro per categoria
 *
 * Props:
 *   tenantId  — tenant corrente
 *   isAdmin   — se true mostra i controlli di unlock
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  Alert,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CheckCircle as ActiveIcon,
  Lock as LockIcon,
  VisibilityOff as HiddenIcon,
  Extension as ExtensionIcon,
} from '@mui/icons-material';
import M3Surface from '../../components/ui/M3Surface';

import { listCapabilities, unlockCapability } from '../../modules/capabilitySystem/capabilityService';
import { CAPABILITY_MODULES } from '../../modules/capabilitySystem/capabilityRegistry';
import type { Capability, CapabilityTier, CapabilityCategory } from '../../modules/capabilitySystem/types';

const M3Typography = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  tenantId: string;
  isAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATE_CHIP: Record<string, { label: string; color: 'success' | 'warning' | 'default'; icon: JSX.Element }> = {
  active: { label: 'Attiva', color: 'success', icon: <ActiveIcon fontSize="small" aria-hidden /> },
  locked: { label: 'Bloccata', color: 'warning', icon: <LockIcon fontSize="small" aria-hidden /> },
  hidden: { label: 'Nascosta', color: 'default', icon: <HiddenIcon fontSize="small" aria-hidden /> },
};

const TIER_ORDER: CapabilityTier[] = ['free', 'pilot', 'standard', 'enterprise'];

const CATEGORY_LABELS: Record<CapabilityCategory, string> = {
  ai: 'AI',
  compliance: 'Compliance',
  commercial: 'Commerciale',
  pedagogical: 'Didattica',
  administrative: 'Amministrativo',
  integration: 'Integrazioni',
  advanced: 'Avanzato',
};

function CapabilityCard({
  capability,
  tenantId,
  isAdmin,
  onUnlock,
}: {
  capability: Capability;
  tenantId: string;
  isAdmin: boolean;
  onUnlock: (id: string) => void;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const stateInfo = STATE_CHIP[capability.state] ?? STATE_CHIP['locked'];

  async function handleUnlock(): Promise<void> {
    setUnlocking(true);
    try {
      await unlockCapability(tenantId, capability.id, capability.requiredTier, 'admin');
      setUnlocked(true);
      onUnlock(capability.id);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: capability.state === 'hidden' ? 0.5 : 1,
      }}
      aria-label={`Capability: ${capability.name}`}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
          <M3Typography variant="titleSmall">{capability.name}</M3Typography>
          <Chip
            label={stateInfo.label}
            color={stateInfo.color}
            size="small"
            icon={stateInfo.icon}
            aria-label={`Stato: ${stateInfo.label}`}
          />
        </Stack>

        <M3Typography variant="bodySmall" color="text.secondary" sx={{ mb: 1.5 }}>
          {capability.description}
        </M3Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={CATEGORY_LABELS[capability.category] ?? capability.category}
            size="small"
            variant="outlined"
            aria-label={`Categoria: ${capability.category}`}
          />
          <Chip
            label={`Tier: ${capability.requiredTier}`}
            size="small"
            variant="outlined"
            color={capability.requiredTier === 'free' ? 'success' : 'default'}
            aria-label={`Tier richiesto: ${capability.requiredTier}`}
          />
        </Stack>
      </CardContent>

      {isAdmin && capability.state !== 'active' && (
        <CardActions sx={{ pt: 0 }}>
          {unlocked ? (
            <Alert severity="success" sx={{ width: '100%', py: 0.5 }}>
              Sbloccata ✓
            </Alert>
          ) : (
            <Tooltip title={`Sblocca ${capability.name} per ${tenantId}`}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                disabled={unlocking}
                onClick={handleUnlock}
                startIcon={unlocking ? <CircularProgress size={14} aria-hidden /> : <LockIcon fontSize="small" aria-hidden />}
                aria-label={`Sblocca capability ${capability.name}`}
              >
                {unlocking ? 'Sblocco…' : (capability.upgradeCta ?? 'Sblocca')}
              </Button>
            </Tooltip>
          )}
        </CardActions>
      )}

      {!isAdmin && capability.state === 'locked' && capability.upgradeCta && (
        <CardActions sx={{ pt: 0 }}>
          <M3Typography variant="labelSmall" color="text.secondary">
            {capability.upgradeCta}
          </M3Typography>
        </CardActions>
      )}
    </Card>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function CapabilityPanel({ tenantId, isAdmin }: Props): React.JSX.Element {
  const [filter, setFilter] = useState<'all' | CapabilityCategory>('all');
  const [_unlockCount, setUnlockCount] = useState(0);

  // Ricalcola quando viene sbloccata una capability
  const handleUnlock = useCallback(() => {
    setUnlockCount(n => n + 1);
  }, []);

  const capabilities = listCapabilities(tenantId, isAdmin);

  const filtered = filter === 'all'
    ? capabilities
    : capabilities.filter(c => c.category === filter);

  const activeCount = capabilities.filter(c => c.state === 'active').length;
  const lockedCount = capabilities.filter(c => c.state === 'locked').length;

  const categories: CapabilityCategory[] = Array.from(
    new Set(capabilities.map(c => c.category)),
  );

  // Raggruppa per modulo se filtro = all
  const groupedByModule = CAPABILITY_MODULES.map(mod => ({
    ...mod,
    items: filtered.filter(c => mod.capabilityIds.includes(c.id)),
  })).filter(mod => mod.items.length > 0);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <M3Surface elevation={0} sx={{ p: 3, borderRadius: 3 }} aria-label="Capability System header">
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Stack direction="row" spacing={2} alignItems="center">
            <ExtensionIcon color="primary" fontSize="large" aria-hidden />
            <Box>
              <M3Typography variant="titleLarge">Capability System</M3Typography>
              <M3Typography variant="bodySmall" color="text.secondary">
                {activeCount} attive · {lockedCount} bloccate · {tenantId}
              </M3Typography>
            </Box>
          </Stack>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="capability-filter-label">Categoria</InputLabel>
            <Select
              labelId="capability-filter-label"
              label="Categoria"
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              aria-label="Filtra per categoria"
            >
              <MenuItem value="all">Tutte</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </M3Surface>

      {/* Summary bar */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {TIER_ORDER.map(tier => {
          const count = capabilities.filter(c => c.requiredTier === tier && c.state === 'active').length;
          return (
            <Chip
              key={tier}
              label={`${tier}: ${count} attive`}
              size="small"
              variant="outlined"
              color={tier === 'free' ? 'success' : tier === 'enterprise' ? 'secondary' : 'default'}
              aria-label={`Tier ${tier}: ${count} capability attive`}
            />
          );
        })}
      </Stack>

      {/* Capability cards grouped by module */}
      {groupedByModule.map(mod => (
        <Box key={mod.moduleId}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <M3Typography variant="titleMedium">{mod.name}</M3Typography>
            <Chip label={`${mod.items.length}`} size="small" aria-label={`${mod.items.length} capability`} />
          </Stack>
          <Grid container spacing={2}>
            {mod.items.map((cap: Capability) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cap.id}>
                <CapabilityCard
                  capability={cap}
                  tenantId={tenantId}
                  isAdmin={isAdmin}
                  onUnlock={handleUnlock}
                />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 2 }} />
        </Box>
      ))}

      {filtered.length === 0 && (
        <M3Typography variant="bodySmall" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nessuna capability trovata per il filtro selezionato.
        </M3Typography>
      )}
    </Stack>
  );
}
