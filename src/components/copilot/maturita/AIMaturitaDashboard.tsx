/**
 * AIMaturitaDashboard.tsx — Dashboard principale plugin Maturità AI
 *
 * Assembla tutti i pannelli del plugin:
 *   - GlobalProgressBar (score globale pesato)
 *   - InteractionModeSelector (classica / semi-osmotica / osmotica)
 *   - 6 sezioni collassabili con pannelli adattivi:
 *       pedagogia     → PedagogyInsightPanel
 *       trust         → TrustScorePanel
 *       curriculum    → CompactSection (con raccomandazioni)
 *       gdpr          → CompactSection (con blockers critici)
 *       accessibilita → CompactSection (con blockers)
 *       pa_readiness  → CompactSection (con blockers)
 *   - Pannello raccomandazioni globali: MaturitaRecommendationPanel
 *
 * Integrazione store: useAIMaturitaStore (Zustand + persist)
 * MD3 Gold Compliant — M3Surface + solo token MD3.
 */
import React, { useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AccessibilityNewOutlinedIcon from '@mui/icons-material/AccessibilityNewOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import M3Surface from '../../ui/M3Surface';
import { useAIMaturitaStore } from '../../../stores/useAIMaturitaStore';
import type { MaturitaSection, SectionId } from '../../../types/aiMaturita.types';

import GlobalProgressBar from './GlobalProgressBar';
import InteractionModeSelector from './InteractionModeSelector';
import MaturitaSectionWrapper from './MaturitaSectionWrapper';
import MaturitaRecommendationPanel from './MaturitaRecommendationPanel';
import PedagogyInsightPanel from './PedagogyInsightPanel';
import TrustScorePanel from './TrustScorePanel';

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── Icon map per sezione ──────────────────────────────────────────────────────

const SECTION_ICON: Record<SectionId, React.ReactElement> = {
  pedagogia: <SchoolOutlinedIcon fontSize="small" aria-hidden />,
  trust: <VerifiedUserOutlinedIcon fontSize="small" aria-hidden />,
  curriculum: <MenuBookOutlinedIcon fontSize="small" aria-hidden />,
  gdpr: <LockOutlinedIcon fontSize="small" aria-hidden />,
  accessibilita: <AccessibilityNewOutlinedIcon fontSize="small" aria-hidden />,
  pa_readiness: <AccountBalanceOutlinedIcon fontSize="small" aria-hidden />,
};

// ── Compact section content: blockers + recommendations generici ──────────────

interface CompactSectionContentProps {
  section: MaturitaSection;
  showActionHints: boolean;
}

function CompactSectionContent({ section, showActionHints }: CompactSectionContentProps) {
  return (
    <Stack spacing={1.5}>
      {section.blockers.length > 0 && (
        <Stack spacing={1}>
          {section.blockers.map((b) => (
            <Stack
              key={b.id}
              direction="row"
              spacing={1}
              alignItems="flex-start"
              sx={{
                p: 'var(--md-sys-spacing-2)',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                bgcolor: b.severita === 'critica' ? tok('error-container') : tok('surface-container-low'),
              }}
            >
              {b.severita === 'critica'
                ? <ErrorOutlineIcon fontSize="small" sx={{ color: tok('on-error-container'), mt: '2px', flexShrink: 0 }} aria-hidden />
                : <WarningAmberOutlinedIcon fontSize="small" sx={{ color: tok('on-surface-variant'), mt: '2px', flexShrink: 0 }} aria-hidden />
              }
              <Box>
                <Typography
                  variant="bodySmall"
                  sx={{ color: b.severita === 'critica' ? tok('on-error-container') : tok('on-surface') }}
                >
                  {b.descrizione}
                </Typography>
                {showActionHints && (
                  <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant'), mt: 0.25, display: 'block' }}>
                    → {b.azioneSuggerita}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}

      {section.blockers.length === 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CheckCircleOutlineIcon sx={{ color: tok('tertiary'), fontSize: 18 }} aria-hidden />
          <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
            Nessun blocker — sezione in ottimo stato.
          </Typography>
        </Stack>
      )}

      {section.recommendations.length > 0 && (
        <>
          {section.blockers.length > 0 && (
            <Divider sx={{ borderColor: tok('outline-variant') }} />
          )}
          <Stack spacing={0.5}>
            <Typography variant="labelSmall" sx={{ color: tok('on-surface-variant'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
              Suggerimenti
            </Typography>
            {section.recommendations.slice(0, 2).map((rec, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: tok('secondary'), mt: 1, flexShrink: 0 }} aria-hidden />
                <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>{rec}</Typography>
              </Stack>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}

// ── Score summary chips (header) ──────────────────────────────────────────────

interface ScoreSummaryProps {
  sections: MaturitaSection[];
}

function ScoreSummary({ sections }: ScoreSummaryProps) {
  const okCount = sections.filter((s) => s.score >= 70).length;
  const warnCount = sections.filter((s) => s.score >= 40 && s.score < 70).length;
  const critCount = sections.filter((s) => s.score < 40).length;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Tooltip title="Sezioni con punteggio ≥ 70%: nessun intervento urgente" arrow>
        <Chip
          icon={<CheckCircleOutlineIcon fontSize="small" aria-hidden />}
          label={`${okCount} ottime`}
          size="small"
          sx={{ bgcolor: tok('tertiary-container'), color: tok('on-tertiary-container'), fontSize: 12 }}
        />
      </Tooltip>
      <Tooltip title="Sezioni con punteggio 40–69%: miglioramenti consigliati" arrow>
        <Chip
          icon={<WarningAmberOutlinedIcon fontSize="small" aria-hidden />}
          label={`${warnCount} da migliorare`}
          size="small"
          sx={{ bgcolor: tok('secondary-container'), color: tok('on-secondary-container'), fontSize: 12 }}
        />
      </Tooltip>
      {critCount > 0 && (
        <Tooltip title="Sezioni con punteggio < 40%: azione urgente richiesta" arrow>
          <Chip
            icon={<ErrorOutlineIcon fontSize="small" aria-hidden />}
            label={`${critCount} critica${critCount > 1 ? 'he' : ''}`}
            size="small"
            sx={{ bgcolor: tok('error-container'), color: tok('on-error-container'), fontSize: 12 }}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const AIMaturitaDashboard: React.FC = () => {
  const sections = useAIMaturitaStore((state) => state.sections);
  const globalScore = useAIMaturitaStore((state) => state.globalScore);
  const interactionMode = useAIMaturitaStore((state) => state.interactionMode);
  const { setInteractionMode, toggleSection, recalculate, reset } = useAIMaturitaStore(
    (state) => state.actions
  );

  const okCount = useMemo(() => sections.filter((s) => s.score >= 70).length, [sections]);
  const showActionHints = interactionMode !== 'classica';

  // Numero totale blockers critici attivi
  const totalCritical = useMemo(
    () => sections.reduce((acc, s) => acc + s.blockers.filter((b) => b.severita === 'critica').length, 0),
    [sections]
  );

  return (
    <Stack spacing={3}>
      {/* Header: score globale + modalità */}
      <M3Surface
        elevation={3}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-4)',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="titleMedium" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
                Dashboard Maturità AI
              </Typography>
              <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
                Stato del progetto DocenteDocAI — {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Ricalcola punteggi" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={recalculate}
                  startIcon={<RefreshOutlinedIcon aria-hidden />}
                  aria-label="Ricalcola punteggi Maturità AI"
                  sx={{
                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                    borderColor: tok('outline'),
                    color: tok('on-surface-variant'),
                  }}
                >
                  Ricalcola
                </Button>
              </Tooltip>
              <Tooltip title="Ripristina dati demo" arrow>
                <Button
                  size="small"
                  variant="text"
                  onClick={reset}
                  aria-label="Ripristina dati demo Maturità AI"
                  sx={{
                    fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                    color: tok('on-surface-variant'),
                  }}
                >
                  Reset
                </Button>
              </Tooltip>
            </Stack>
          </Stack>

          <GlobalProgressBar score={globalScore} sectionCount={sections.length} okCount={okCount} />

          <ScoreSummary sections={sections} />

          <Divider sx={{ borderColor: tok('outline-variant') }} />

          <InteractionModeSelector value={interactionMode} onChange={setInteractionMode} />
        </Stack>
      </M3Surface>

      {/* Alert blockers critici */}
      {totalCritical > 0 && (
        <Alert
          icon={<ErrorOutlineIcon aria-hidden />}
          severity="error"
          sx={{
            bgcolor: tok('error-container'),
            color: tok('on-error-container'),
            '& .MuiAlert-icon': { color: tok('error') },
            borderRadius: 'var(--md-sys-shape-corner-medium)',
          }}
        >
          <Typography variant="labelMedium" fontWeight={600}>
            {totalCritical} blocker critico{totalCritical > 1 ? 'i' : ''} rilevato{totalCritical > 1 ? 'i' : ''}
          </Typography>
          <Typography variant="bodySmall" sx={{ mt: 0.5, display: 'block' }}>
            Alcune sezioni richiedono azione immediata per la conformità PA/PNRR. Espandi le sezioni in rosso per dettagli.
          </Typography>
        </Alert>
      )}

      {/* Sezioni */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 'var(--md-sys-spacing-2)' }}>
          <Typography variant="titleSmall" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}>
            Sezioni di valutazione
          </Typography>
        </Stack>

        <Stack spacing={1.5}>
          {sections.map((section) => (
            <MaturitaSectionWrapper
              key={section.id}
              section={section}
              onToggle={toggleSection}
              icon={SECTION_ICON[section.id]}
            >
              {section.id === 'pedagogia' && (
                <PedagogyInsightPanel section={section} mode={interactionMode} />
              )}
              {section.id === 'trust' && (
                <TrustScorePanel section={section} mode={interactionMode} />
              )}
              {(section.id === 'curriculum' ||
                section.id === 'gdpr' ||
                section.id === 'accessibilita' ||
                section.id === 'pa_readiness') && (
                <CompactSectionContent section={section} showActionHints={showActionHints} />
              )}
            </MaturitaSectionWrapper>
          ))}
        </Stack>
      </Box>

      {/* Pannello raccomandazioni globali */}
      <M3Surface
        elevation={2}
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          p: 'var(--md-sys-spacing-4)',
          border: `1px solid ${tok('outline-variant')}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 'var(--md-sys-spacing-3)' }}>
          <LightbulbOutlinedIcon sx={{ color: tok('secondary') }} aria-hidden />
          <Typography variant="titleSmall" sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>
            Raccomandazioni
          </Typography>
          <Chip
            label={interactionMode}
            size="small"
            sx={{
              bgcolor: tok('secondary-container'),
              color: tok('on-secondary-container'),
              fontSize: 11,
              height: 20,
            }}
          />
        </Stack>
        <MaturitaRecommendationPanel sections={sections} mode={interactionMode} />
      </M3Surface>
    </Stack>
  );
};

export default AIMaturitaDashboard;
