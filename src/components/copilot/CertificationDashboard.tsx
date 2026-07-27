/**
 * CertificationDashboard.tsx
 * Certification Package — pannello MD3 Gold Compliant.
 *
 * Sezioni:
 *   1. Score gauge (0–100) con breakdown dimensioni
 *   2. AI Act classification badge
 *   3. Gap analysis summary (conteggi + tabella top items)
 *   4. Azioni: genera pacchetto · esporta JSON
 *   5. Roadmap fasi (Collapse)
 */

import React, { useState } from 'react';
import Box            from '@mui/material/Box';
import Stack          from '@mui/material/Stack';
import Typography     from '@mui/material/Typography';
import Chip           from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Button         from '@mui/material/Button';
import Divider        from '@mui/material/Divider';
import Collapse       from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import M3Surface         from '../ui/M3Surface';
import { useCertification } from '../../hooks/useCertification';
import LiveCompliancePanel  from './LiveCompliancePanel';
import type { GapItem } from '../../self-compliance/certification/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(n: number): string {
  if (n >= 80) return 'var(--md-sys-color-primary)';
  if (n >= 60) return 'var(--md-sys-color-tertiary)';
  return 'var(--md-sys-color-error)';
}

function scoreLabel(n: number): string {
  if (n >= 80) return 'Pronto';
  if (n >= 60) return 'Parziale';
  return 'Non Pronto';
}

function gapStatusColor(s: GapItem['status']): string {
  switch (s) {
    case 'compliant': return 'var(--md-sys-color-primary)';
    case 'partial':   return 'var(--md-sys-color-tertiary)';
    case 'missing':   return 'var(--md-sys-color-error)';
  }
}

function gapStatusLabel(s: GapItem['status']): string {
  switch (s) {
    case 'compliant': return 'OK';
    case 'partial':   return 'Parziale';
    case 'missing':   return 'Mancante';
  }
}

// ── DimensionBar ─────────────────────────────────────────────────────────────

interface DimBarProps {
  label: string;
  value: number;
}

const DimBar: React.FC<DimBarProps> = ({ label, value }) => {
  const color = scoreColor(value);
  return (
    <Stack gap="var(--md-sys-spacing-1)">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
          {label}
        </Typography>
        <Typography variant="labelSmall" sx={{ color, fontVariantNumeric: 'tabular-nums' }}>
          {value}/100
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'var(--md-sys-color-surface-variant)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
        }}
      />
    </Stack>
  );
};

// ── GapRow ────────────────────────────────────────────────────────────────────

const GapRow: React.FC<{ item: GapItem }> = ({ item }) => (
  <Stack
    direction="row"
    alignItems="flex-start"
    gap="var(--md-sys-spacing-2)"
    py="var(--md-sys-spacing-1)"
  >
    <Box
      component="span"
      className="material-symbols-outlined"
      aria-hidden="true"
      sx={{
        fontSize: 'var(--md-sys-icon-size-sm)',
        color: gapStatusColor(item.status),
        flexShrink: 0,
        mt: '2px',
      }}
    >
      {item.status === 'compliant' ? 'check_circle' : item.status === 'partial' ? 'pending' : 'cancel'}
    </Box>
    <Stack gap={0} minWidth={0}>
      <Typography
        variant="bodySmall"
        sx={{ color: 'var(--md-sys-color-on-surface)', lineHeight: 1.4 }}
      >
        {item.requirement}
      </Typography>
      <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
        {item.standard} {item.article ? `· ${item.article}` : ''} · {gapStatusLabel(item.status)}
      </Typography>
    </Stack>
  </Stack>
);

// ── CertificationDashboard ────────────────────────────────────────────────────

const CertificationDashboard: React.FC = () => {
  const { pkg, generating, generatePackage, exportAsJSON, score, gapAnalysis, aiActClassification } =
    useCertification();

  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [gapsOpen, setGapsOpen]       = useState(false);
  const [exportLabel, setExportLabel] = useState('Esporta JSON');

  const today = new Date().toISOString().slice(0, 10);

  function handleExport(): void {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `certification_package_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportLabel('Esportato!');
    setTimeout(() => setExportLabel('Esporta JSON'), 2500);
  }

  const color = score ? scoreColor(score.total) : 'var(--md-sys-color-outline)';

  // Top 5 high-priority missing gaps for quick view
  const topGaps = (gapAnalysis?.items ?? [])
    .filter(i => i.priority === 'high' && i.status !== 'compliant')
    .slice(0, 5);

  return (
    <M3Surface
      elevation={1}
      sx={{
        borderRadius: 'var(--md-sys-shape-corner-large)',
        p: 'var(--md-sys-spacing-5)',
      }}
    >
      <Stack gap="var(--md-sys-spacing-4)">

        {/* ── Live Compliance Runtime ── */}
        <LiveCompliancePanel />

        <Divider />

        {/* ── Header Certification Package ── */}
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-3)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 'var(--md-sys-icon-size-lg)', color: 'var(--md-sys-color-primary)' }}
          >
            workspace_premium
          </Box>
          <Stack gap={0} flexGrow={1}>
            <Typography variant="titleLarge" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              Certification Package
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              AI Act · GDPR · AgID · ISO 42001
            </Typography>
          </Stack>
          {aiActClassification && (
            <Chip
              label="Alto Rischio"
              size="small"
              sx={{
                bgcolor: 'var(--md-sys-color-error-container)',
                color: 'var(--md-sys-color-on-error-container)',
                fontWeight: 'var(--md-sys-typescale-weight-bold)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
              }}
            />
          )}
        </Stack>

        {/* ── Score gauge ── */}
        {score ? (
          <M3Surface
            elevation={0}
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              p: 'var(--md-sys-spacing-4)',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-4)">
              {/* Circular gauge */}
              <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                <CircularProgress
                  variant="determinate"
                  value={score.total}
                  size={72}
                  thickness={5}
                  sx={{ color }}
                />
                <Stack
                  sx={{
                    position: 'absolute', inset: 0,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="titleMedium"
                    sx={{ color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
                  >
                    {score.total}
                  </Typography>
                  <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    /100
                  </Typography>
                </Stack>
              </Box>

              <Stack gap="var(--md-sys-spacing-1)" flexGrow={1} minWidth={0}>
                <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
                  <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Readiness Score
                  </Typography>
                  <Chip
                    label={scoreLabel(score.total)}
                    size="small"
                    sx={{
                      bgcolor: color,
                      color: 'white',
                      fontWeight: 'var(--md-sys-typescale-weight-bold)',
                      borderRadius: 'var(--md-sys-shape-corner-full)',
                    }}
                  />
                </Stack>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Generato il {pkg?.generatedAt ? new Date(pkg.generatedAt).toLocaleDateString('it-IT') : '—'}
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: 'var(--md-sys-spacing-3)' }} />

            {/* Dimension breakdown */}
            <Stack gap="var(--md-sys-spacing-2)">
              <DimBar label="Governance AI Act"   value={score.breakdown.governance} />
              <DimBar label="Trasparenza"          value={score.breakdown.transparency} />
              <DimBar label="Auditabilità"         value={score.breakdown.auditability} />
              <DimBar label="Sicurezza"            value={score.breakdown.security} />
              <DimBar label="Supervisione umana"  value={score.breakdown.humanOversight} />
              <DimBar label="Documentazione"      value={score.breakdown.documentation} />
              <DimBar label="Protezione dati"      value={score.breakdown.dataProtection} />
            </Stack>
          </M3Surface>
        ) : (
          <M3Surface
            elevation={0}
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              p: 'var(--md-sys-spacing-4)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              textAlign: 'center',
            }}
          >
            <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Nessun pacchetto generato. Premi &quot;Genera Pacchetto&quot; per iniziare.
            </Typography>
          </M3Surface>
        )}

        {/* ── Gap summary ── */}
        {gapAnalysis && (
          <>
            <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
              <Chip
                label={`${gapAnalysis.compliantCount} conformi`}
                size="small"
                sx={{ bgcolor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', borderRadius: 'var(--md-sys-shape-corner-full)' }}
              />
              <Chip
                label={`${gapAnalysis.partialCount} parziali`}
                size="small"
                sx={{ bgcolor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)', borderRadius: 'var(--md-sys-shape-corner-full)' }}
              />
              <Chip
                label={`${gapAnalysis.missingCount} mancanti`}
                size="small"
                sx={{ bgcolor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)', borderRadius: 'var(--md-sys-shape-corner-full)' }}
              />
              <Chip
                label={`${Math.round(gapAnalysis.complianceRate * 100)}% compliance`}
                size="small"
                sx={{ bgcolor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface-variant)', borderRadius: 'var(--md-sys-shape-corner-full)' }}
              />
            </Stack>

            {topGaps.length > 0 && (
              <>
                <Button
                  onClick={() => setGapsOpen(v => !v)}
                  variant="text"
                  size="small"
                  endIcon={
                    <Box
                      component="span"
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
                    >
                      {gapsOpen ? 'expand_less' : 'expand_more'}
                    </Box>
                  }
                  sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                  aria-expanded={gapsOpen}
                  aria-label="Mostra/nascondi gap prioritari"
                >
                  Gap Prioritari ({topGaps.length})
                </Button>
                <Collapse in={gapsOpen}>
                  <Stack
                    gap={0}
                    sx={{
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      px: 'var(--md-sys-spacing-3)',
                    }}
                  >
                    {topGaps.map((item, i) => (
                      <React.Fragment key={item.id}>
                        <GapRow item={item} />
                        {i < topGaps.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </Stack>
                </Collapse>
              </>
            )}
          </>
        )}

        {/* ── Roadmap (Collapse) ── */}
        {pkg?.roadmap && pkg.roadmap.length > 0 && (
          <>
            <Divider />
            <Button
              onClick={() => setRoadmapOpen(v => !v)}
              variant="text"
              size="small"
              endIcon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
                >
                  {roadmapOpen ? 'expand_less' : 'expand_more'}
                </Box>
              }
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
              aria-expanded={roadmapOpen}
              aria-label="Mostra/nascondi roadmap di remediation"
            >
              Piano Remediation ({pkg.roadmap.length} fasi)
            </Button>
            <Collapse in={roadmapOpen}>
              <Stack gap="var(--md-sys-spacing-2)">
                {pkg.roadmap.map(phase => (
                  <M3Surface
                    key={phase.phase}
                    elevation={0}
                    sx={{
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      p: 'var(--md-sys-spacing-3)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)">
                      <Chip
                        label={`Fase ${phase.phase}`}
                        size="small"
                        sx={{
                          bgcolor: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                          borderRadius: 'var(--md-sys-shape-corner-full)',
                          flexShrink: 0,
                        }}
                      />
                      <Stack gap="var(--md-sys-spacing-1)" minWidth={0}>
                        <Typography
                          variant="labelMedium"
                          sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}
                        >
                          {phase.title}
                        </Typography>
                        {phase.actions.map((action, i) => (
                          <Typography
                            key={i}
                            variant="bodySmall"
                            sx={{ color: 'var(--md-sys-color-on-surface-variant)', pl: 'var(--md-sys-spacing-2)' }}
                          >
                            • {action}
                          </Typography>
                        ))}
                      </Stack>
                    </Stack>
                  </M3Surface>
                ))}
              </Stack>
            </Collapse>
          </>
        )}

        {/* ── Azioni ── */}
        <Divider />
        <Stack direction="row" gap="var(--md-sys-spacing-2)" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={generatePackage}
            disabled={generating}
            startIcon={
              generating ? (
                <CircularProgress size={16} sx={{ color: 'inherit' }} />
              ) : (
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
                >
                  refresh
                </Box>
              )
            }
            aria-label="Genera pacchetto di certificazione"
          >
            {generating ? 'Generazione…' : pkg ? 'Rigenera Pacchetto' : 'Genera Pacchetto'}
          </Button>

          {pkg && (
            <Button
              variant="outlined"
              onClick={handleExport}
              startIcon={
                <Box
                  component="span"
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }}
                >
                  download
                </Box>
              }
              aria-label="Esporta pacchetto certificazione come JSON"
            >
              {exportLabel}
            </Button>
          )}
        </Stack>

      </Stack>
    </M3Surface>
  );
};

export default CertificationDashboard;
