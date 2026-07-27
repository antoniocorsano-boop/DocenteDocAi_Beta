/**
 * MaturitaRecommendationPanel.tsx — Pannello raccomandazioni adattivo Maturità AI
 *
 * Comportamento per modalità:
 *   classica:      Lista testuale raccomandazioni da tutte le sezioni
 *   semi-osmotica: Lista prioritizzata per impatto + severità blockers
 *   osmotica:      Auto-suggest next step singolo con contest d'azione e
 *                  lista completa prioritizzata
 *
 * Aggrega in un unico pannello le raccomandazioni di tutte le sezioni,
 * permettendo al docente di avere una visione completa degli interventi.
 * MD3 Gold Compliant — solo MUI v7 + token MD3.
 */
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AssistantOutlinedIcon from '@mui/icons-material/AssistantOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import type { InteractionMode, MaturitaSection, SectionId } from '../../../types/aiMaturita.types';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── Aggregazione raccomandazioni ──────────────────────────────────────────────

interface AggregatedRec {
  text: string;
  sectionId: SectionId;
  sectionLabel: string;
  priorityScore: number; // calcolato
}

function buildPrioritizedRecs(sections: MaturitaSection[]): AggregatedRec[] {
  const recs: AggregatedRec[] = [];

  for (const section of sections) {
    const criticalBlockers = section.blockers.filter((b) => b.severita === 'critica').length;
    const medianBlockers = section.blockers.filter((b) => b.severita === 'media').length;

    // Score di priorità: sezioni con punteggio basso e molti blockers critici = priorità alta
    const priorityScore =
      (100 - section.score) * 0.6 +
      criticalBlockers * 20 +
      medianBlockers * 8;

    for (const rec of section.recommendations) {
      recs.push({
        text: rec,
        sectionId: section.id,
        sectionLabel: section.label,
        priorityScore,
      });
    }
  }

  // Ordina per priorityScore desc, limita a 10
  return recs.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 10);
}

// ── Section icon map ──────────────────────────────────────────────────────────

const SECTION_ICON: Record<SectionId, React.ReactElement> = {
  pedagogia: <CheckCircleOutlineIcon fontSize="small" aria-hidden />,
  trust: <BoltOutlinedIcon fontSize="small" aria-hidden />,
  curriculum: <LightbulbOutlinedIcon fontSize="small" aria-hidden />,
  gdpr: <PriorityHighIcon fontSize="small" aria-hidden />,
  accessibilita: <WarningAmberOutlinedIcon fontSize="small" aria-hidden />,
  pa_readiness: <ErrorOutlineIcon fontSize="small" aria-hidden />,
};

const SECTION_COLOR: Record<SectionId, string> = {
  pedagogia: tok('primary'),
  trust: tok('secondary'),
  curriculum: tok('tertiary'),
  gdpr: tok('error'),
  accessibilita: tok('secondary'),
  pa_readiness: tok('error'),
};

// ── Sub-component: Rec row ────────────────────────────────────────────────────

interface RecRowProps {
  rec: AggregatedRec;
  index: number;
  showPriority: boolean;
}

function RecRow({ rec, index, showPriority }: RecRowProps) {
  const accentColor = SECTION_COLOR[rec.sectionId];
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      {showPriority && (
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: index === 0 ? tok('primary') : tok('surface-container-high'),
            color: index === 0 ? tok('on-primary') : tok('on-surface-variant'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
            mt: '2px',
          }}
          aria-hidden
        >
          {index + 1}
        </Box>
      )}
      {!showPriority && (
        <Box
          sx={{ mt: '6px', width: 6, height: 6, borderRadius: '50%', bgcolor: accentColor, flexShrink: 0 }}
          aria-hidden
        />
      )}

      <Box flex={1}>
        <Typography variant="bodySmall" sx={{ color: tok('on-surface') }}>
          {rec.text}
        </Typography>
        <Tooltip title={`Sezione: ${rec.sectionLabel}`} arrow>
          <Chip
            icon={SECTION_ICON[rec.sectionId]}
            label={rec.sectionLabel}
            size="small"
            sx={{
              mt: 0.5,
              height: 20,
              fontSize: 10,
              bgcolor: tok('surface-container-low'),
              color: tok('on-surface-variant'),
              '& .MuiChip-icon': { color: accentColor, fontSize: 13 },
            }}
          />
        </Tooltip>
      </Box>
    </Stack>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface MaturitaRecommendationPanelProps {
  sections: MaturitaSection[];
  mode: InteractionMode;
}

const MaturitaRecommendationPanel: React.FC<MaturitaRecommendationPanelProps> = ({
  sections,
  mode,
}) => {
  const prioritizedRecs = buildPrioritizedRecs(sections);

  if (prioritizedRecs.length === 0) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
        <CheckCircleOutlineIcon sx={{ color: tok('tertiary') }} aria-hidden />
        <Typography variant="bodyMedium" sx={{ color: tok('on-surface') }}>
          Nessuna raccomandazione attiva — tutti gli obiettivi sono raggiunti!
        </Typography>
      </Stack>
    );
  }

  const topRec = prioritizedRecs[0];
  const showOsmoticSuggestion = mode === 'osmotica';
  const showPriority = mode !== 'classica';

  return (
    <Stack spacing={2}>
      {/* Osmotica: auto-suggest next step in evidenza */}
      {showOsmoticSuggestion && (
        <Alert
          icon={<AssistantOutlinedIcon fontSize="small" aria-hidden />}
          severity="info"
          sx={{
            bgcolor: tok('primary-container'),
            color: tok('on-primary-container'),
            '& .MuiAlert-icon': { color: tok('primary') },
            borderRadius: 'var(--md-sys-shape-corner-small)',
          }}
        >
          <Typography variant="labelSmall" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
            Next step consigliato dall'AI
          </Typography>
          <Typography variant="bodySmall">
            {topRec.text}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            <Chip
              label={topRec.sectionLabel}
              size="small"
              sx={{ height: 18, fontSize: 10, bgcolor: `${tok('on-primary-container')}22`, color: tok('on-primary-container') }}
            />
            <Chip
              label="Priorità massima"
              size="small"
              icon={<BoltOutlinedIcon sx={{ fontSize: 12 }} aria-hidden />}
              sx={{ height: 18, fontSize: 10, bgcolor: tok('tertiary-container'), color: tok('on-tertiary-container') }}
            />
          </Stack>
        </Alert>
      )}

      {/* Lista completa */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 'var(--md-sys-spacing-2)' }}>
          <LightbulbOutlinedIcon fontSize="small" sx={{ color: tok('secondary') }} aria-hidden />
          <Typography variant="labelMedium" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
            {showPriority ? 'Raccomandazioni prioritizzate' : 'Raccomandazioni'}
          </Typography>
          <Chip
            label={prioritizedRecs.length}
            size="small"
            sx={{ height: 18, bgcolor: tok('surface-container-high'), color: tok('on-surface-variant'), fontSize: 11 }}
          />
        </Stack>

        <Stack spacing={1.5} divider={<Divider sx={{ borderColor: tok('outline-variant') }} />}>
          {prioritizedRecs.map((rec, i) => (
            <RecRow key={`${rec.sectionId}-${i}`} rec={rec} index={i} showPriority={showPriority} />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
};

export default MaturitaRecommendationPanel;
