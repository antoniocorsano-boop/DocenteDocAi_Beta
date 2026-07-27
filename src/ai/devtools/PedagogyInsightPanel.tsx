/**
 * PedagogyInsightPanel.tsx — Sprint 6: Pedagogical Alignment
 *
 * DevTools panel that visualises pedagogical alignment of a simulated
 * lesson register and UDA set.
 *
 * Layout:
 *   Header: overall score badge + title + "Ricalcola" button
 *   Row 1: Bloom taxonomy distribution — horizontal bar per level
 *   Row 2: 5 alignment dimension score-cards
 *   Row 3: Strengths (green) / Opportunities (amber) lists
 */

import React, { useCallback, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import {
  BLOOM_LEVELS,
  BLOOM_LEVEL_LABELS_IT,
  type BloomDistribution,
} from '../pedagogy/bloomsClassifier';
import {
  type AlignmentDimension,
  type AlignmentScore,
} from '../pedagogy/alignmentScorer';
import {
  generatePedagogyReport,
  type PedagogyReport,
} from '../pedagogy/pedagogyReport';
import type { Lezione } from '@/types/uda.types';
import type { Uda } from '@/types/uda.types';

// ── token helper ──────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

// ── dimension labels (Italian) ────────────────────────────────────────────────

const DIMENSION_LABELS: Record<AlignmentDimension, string> = {
  bloomCoverage:        'Copertura Bloom',
  cognitiveProgression: 'Progressione cognitiva',
  activeLearningRatio:  'Apprendimento attivo',
  inclusionSignals:     'Segnali inclusivi',
  diversityOfMethods:   'Varietà metodologica',
};

const BLOOM_COLORS: Record<string, string> = {
  remember:  tok('primary'),
  understand: tok('secondary'),
  apply:     tok('tertiary'),
  analyze:   tok('primary-container'),
  evaluate:  tok('secondary-container'),
  create:    tok('tertiary-container'),
};

// ── mock data builder ─────────────────────────────────────────────────────────

const MOCK_LESSONS: Lezione[] = [
  {
    id: 'l1', classe: '3A', materia: 'Matematica', svolta: true,
    data: '2024-09-15',
    tipoLezione: 'Teoria',
    contenuto: 'Introduzione alle funzioni: definizione, dominio e codominio. Gli studenti ricordano e identificano le proprietà fondamentali.',
    obiettivi: 'Ricordare la definizione di funzione e identificare dominio e codominio.',
    adattamenti: '',
    materialiDidattici: [],
  },
  {
    id: 'l2', classe: '3A', materia: 'Matematica', svolta: true,
    data: '2024-09-22',
    tipoLezione: 'Teoria',
    contenuto: 'Funzioni lineari: comprensione del concetto di pendenza. Gli studenti spiegano e descrivono il comportamento delle funzioni lineari.',
    obiettivi: 'Comprendere il significato geometrico della pendenza e descrivere le funzioni lineari.',
  },
  {
    id: 'l3', classe: '3A', materia: 'Matematica', svolta: true,
    data: '2024-10-01',
    tipoLezione: 'Laboratorio',
    contenuto: 'Applicazione pratica: gli studenti utilizzano GeoGebra per tracciare grafici e risolvono problemi di equazioni lineari.',
    obiettivi: 'Applicare le conoscenze acquisite per risolvere equazioni e tracciare grafici.',
    materialiDidattici: [{ id: 'm1', type: 'link' as const, label: 'GeoGebra' }],
  },
  {
    id: 'l4', classe: '3A', materia: 'Matematica', svolta: true,
    data: '2024-10-10',
    tipoLezione: 'Laboratorio',
    contenuto: 'Analisi critica di dati statistici: gli studenti esaminano e scompongono dataset reali, distinguono tendenze e identificano anomalie.',
    obiettivi: 'Analizzare dataset reali, scomporre i dati e distinguere tendenze significative.',
    adattamenti: 'Supporto scaffolding per studenti BES. Schede strutturate per DSA.',
    materialiDidattici: [{ id: 'm2', type: 'link' as const, label: 'Foglio Excel' }],
  },
  {
    id: 'l5', classe: '3A', materia: 'Matematica', svolta: true,
    data: '2024-10-20',
    tipoLezione: 'Verifica',
    contenuto: 'Prova scritta: valutazione delle competenze acquisite. Gli studenti giustificano le soluzioni e argomentano le scelte metodologiche adottate.',
    obiettivi: 'Valutare competenze e capacità di giustificazione matematica.',
  },
  {
    id: 'l6', classe: '3A', materia: 'Matematica', svolta: false,
    data: '2024-11-05',
    tipoLezione: 'Laboratorio',
    contenuto: 'Progetto creativo: gli studenti progettano e producono un report di analisi statistica su un tema scelto autonomamente, elaborando soluzioni originali.',
    obiettivi: 'Produrre un report originale che dimostri capacità di crea e sviluppa autonomamente.',
    adattamenti: 'Lavoro cooperativo; peer tutoring per studenti in difficoltà.',
  },
];

const MOCK_UDA: Uda = {
  id: 'uda-demo', title: 'Statistica e Probabilità — 3A', classe: '3A', materia: 'Matematica',
  introduction: 'Questa UDA introduce gli studenti al mondo della statistica descrittiva e della probabilità attraverso un approccio per problemi reali. Gli studenti ricordano concetti base, comprendono distribuzioni, applicano calcoli, analizzano dataset, valutano affidabilità dei risultati e creano un report originale.',
  finalProduct: 'Report statistico prodotto dagli studenti su un fenomeno reale scelto dal gruppo.',
  competencyIds: [],
  evaluation: 'Valutazione formativa in itinere e sommativa finale tramite rubrica di valutazione condivisa.',
  tools: 'GeoGebra, Excel, materiali inclusivi per DSA/BES.',
  startPos: 0, width: 100, color: '#1565c0', borderColor: '#0d47a1', textColor: '#fff',
  phases: [
    {
      id: 'p1', title: 'Esplorazione',
      description: 'Gli studenti ricordano e identificano i concetti base di statistica descrittiva: media, mediana, moda.',
      activities: 'Lezione frontale, discussione guidata, schede di lavoro.',
      duration: '2 settimane',
    },
    {
      id: 'p2', title: 'Comprensione',
      description: 'Gli studenti comprendono e descrivono le distribuzioni di frequenza, spiegano il concetto di variabilità.',
      activities: 'Analisi di grafici, esercitazioni in coppia.',
      duration: '2 settimane',
    },
    {
      id: 'p3', title: 'Applicazione',
      description: 'Gli studenti applicano calcolo della probabilità per risolvere problemi concreti, utilizzano strumenti digitali.',
      activities: 'Laboratorio GeoGebra, problem-solving cooperativo.',
      duration: '2 settimane',
    },
    {
      id: 'p4', title: 'Analisi',
      description: 'Gli studenti analizzano ed esaminano dataset reali, scompongono i fenomeni statistici, distinguono correlazione e causalità.',
      activities: 'Indagine dati reali, mappa concettuale, ricerca.',
      duration: '2 settimane',
    },
    {
      id: 'p5', title: 'Valutazione',
      description: 'Gli studenti valutano e giudicano soluzioni alternative, giustificano le scelte metodologiche tramite argomenti fondati.',
      activities: 'Debate strutturato, presentazione e critica tra pari.',
      duration: '1 settimana',
    },
    {
      id: 'p6', title: 'Produzione',
      description: 'Gli studenti producono e progettano un report originale su un fenomeno scelto, sviluppando grafici, analisi e conclusioni creative.',
      activities: 'Progetto di gruppo, produzione elaborato, presentazione finale.',
      duration: '2 settimane',
    },
  ],
};

// ── sub-components ────────────────────────────────────────────────────────────

const BloomBar: React.FC<{ dist: BloomDistribution }> = ({ dist }) => (
  <Box>
    <Typography
      variant="titleSmall"
      sx={{ color: tok('on-surface-variant'), mb: 1.5, display: 'block' }}
    >
      Distribuzione tassonomica (Bloom)
    </Typography>
    <Stack spacing={1}>
      {BLOOM_LEVELS.map(level => {
        const frac = dist.fractions[level] ?? 0;
        return (
          <Stack key={level} direction="row" alignItems="center" spacing={1.5}>
            <Typography
              variant="bodySmall"
              sx={{ minWidth: 120, color: tok('on-surface'), textTransform: 'capitalize' }}
            >
              {BLOOM_LEVEL_LABELS_IT[level]}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={frac * 100}
                aria-label={`Livello ${BLOOM_LEVEL_LABELS_IT[level]}: ${Math.round(frac * 100)}%`}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: tok('surface-container-high'),
                  '& .MuiLinearProgress-bar': { bgcolor: BLOOM_COLORS[level] },
                }}
              />
            </Box>
            <Typography
              variant="labelSmall"
              sx={{
                minWidth: 36,
                textAlign: 'right',
                color: tok('on-surface-variant'),
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(frac * 100)}%
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  </Box>
);

const DimensionCard: React.FC<{ dim: AlignmentDimension; score: number }> = ({ dim, score }) => {
  const good = score >= 0.60;
  return (
    <Box
      sx={{
        p: 'var(--md-sys-spacing-3)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        bgcolor: tok('surface-container'),
        border: `1px solid ${good ? tok('outline-variant') : tok('error')}`,
        flex: '1 1 140px',
        minWidth: 130,
      }}
      role="region"
      aria-label={`Dimensione ${DIMENSION_LABELS[dim]}: ${Math.round(score * 100)}%`}
    >
      <Typography
        variant="labelSmall"
        sx={{ color: tok('on-surface-variant'), display: 'block', mb: 0.5 }}
      >
        {DIMENSION_LABELS[dim]}
      </Typography>
      <Typography
        variant="titleLarge"
        sx={{
          color: good ? tok('primary') : tok('error'),
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 'var(--md-sys-typescale-weight-semibold)',
        }}
      >
        {Math.round(score * 100)}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={score * 100}
        sx={{
          mt: 1,
          height: 4,
          borderRadius: 2,
          bgcolor: tok('surface-container-high'),
          '& .MuiLinearProgress-bar': { bgcolor: good ? tok('primary') : tok('error') },
        }}
      />
    </Box>
  );
};

function scoreChipProps(score: number): { label: string; bg: string; color: string } {
  if (score >= 0.80) return { label: 'Eccellente', bg: tok('primary-container'), color: tok('on-primary-container') };
  if (score >= 0.60) return { label: 'Buono', bg: tok('secondary-container'), color: tok('on-secondary-container') };
  if (score >= 0.40) return { label: 'In via di sviluppo', bg: tok('tertiary-container'), color: tok('on-tertiary-container') };
  return { label: 'Da migliorare', bg: tok('error-container'), color: tok('on-error-container') };
}

function buildReport(): PedagogyReport {
  return generatePedagogyReport(MOCK_LESSONS, [MOCK_UDA]);
}

function aggregateDimensions(score: AlignmentScore | null, udaScores: AlignmentScore[]): Record<AlignmentDimension, number> {
  const all = [...(score ? [score] : []), ...udaScores];
  if (all.length === 0) {
    return {
      bloomCoverage: 0,
      cognitiveProgression: 0,
      activeLearningRatio: 0,
      inclusionSignals: 0,
      diversityOfMethods: 0,
    };
  }
  const dims: AlignmentDimension[] = [
    'bloomCoverage', 'cognitiveProgression', 'activeLearningRatio', 'inclusionSignals', 'diversityOfMethods',
  ];
  const totals = Object.fromEntries(dims.map(d => [d, 0])) as Record<AlignmentDimension, number>;
  for (const s of all) for (const d of dims) totals[d] += s.dimensions[d];
  const n = all.length;
  return Object.fromEntries(dims.map(d => [d, totals[d] / n])) as Record<AlignmentDimension, number>;
}

// ── main component ────────────────────────────────────────────────────────────

const PedagogyInsightPanel: React.FC = () => {
  const [report, setReport] = useState<PedagogyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        setReport(buildReport());
      } finally {
        setLoading(false);
      }
    }, 0);
  }, []);

  const chipProps = report
    ? scoreChipProps(report.overallScore)
    : { label: 'N/A', bg: tok('surface-container'), color: tok('on-surface-variant') };

  // Aggregate bloom distribution from all sources
  const allDist: BloomDistribution | null = report?.lessonScore?.bloomDistribution ?? null;
  const dimensions = report
    ? aggregateDimensions(report.lessonScore, report.udaScores)
    : null;

  return (
    <Box sx={{ p: 'var(--md-sys-spacing-4)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <AutoStoriesIcon sx={{ color: tok('primary') }} aria-hidden />
        <Typography variant="titleMedium" sx={{ color: tok('on-surface'), flex: 1 }}>
          Allineamento Pedagogico
        </Typography>
        {report && (
          <Chip
            size="small"
            label={chipProps.label}
            sx={{
              bgcolor: chipProps.bg,
              color: chipProps.color,
              fontWeight: 'var(--md-sys-typescale-weight-semibold)',
              fontSize: 'var(--md-sys-typescale-label-small-font-size)',
            }}
          />
        )}
        {report && (
          <Tooltip title="Punteggio complessivo di allineamento pedagogico" arrow>
            <Typography
              variant="titleLarge"
              sx={{ color: tok('primary'), fontVariantNumeric: 'tabular-nums', minWidth: 52, textAlign: 'right' }}
            >
              {Math.round(report.overallScore * 100)}%
            </Typography>
          </Tooltip>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={run}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} aria-hidden /> : <RefreshIcon fontSize="small" aria-hidden />}
          aria-label="Ricalcola allineamento pedagogico"
          sx={{
            borderColor: tok('outline'),
            color: tok('primary'),
            textTransform: 'none',
            '&:hover': { borderColor: tok('primary'), bgcolor: tok('primary-container') },
          }}
        >
          {loading ? 'Calcolo…' : 'Ricalcola'}
        </Button>
      </Stack>

      {!report && !loading && (
        <Alert
          severity="info"
          icon={<AutoStoriesIcon fontSize="inherit" />}
          sx={{ bgcolor: tok('secondary-container'), color: tok('on-secondary-container') }}
        >
          Premi <strong>Ricalcola</strong> per analizzare l&apos;allineamento pedagogico del registro lezioni e delle UDA.
        </Alert>
      )}

      {loading && (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} aria-label="Calcolo allineamento pedagogico in corso" />
          <Typography variant="bodySmall" sx={{ mt: 1.5, color: tok('on-surface-variant') }}>
            Analisi in corso…
          </Typography>
        </Stack>
      )}

      {report && !loading && (
        <Stack spacing={3}>
          {/* ── Bloom distribution ─────────────────────────────────────────── */}
          {allDist && (
            <>
              <BloomBar dist={allDist} />
              <Divider />
            </>
          )}

          {/* ── Dimension score cards ───────────────────────────────────────── */}
          {dimensions && (
            <>
              <Box>
                <Typography
                  variant="titleSmall"
                  sx={{ color: tok('on-surface-variant'), mb: 1.5, display: 'block' }}
                >
                  Dimensioni di allineamento
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {(Object.keys(dimensions) as AlignmentDimension[]).map(dim => (
                    <DimensionCard key={dim} dim={dim} score={dimensions[dim]} />
                  ))}
                </Stack>
              </Box>
              <Divider />
            </>
          )}

          {/* ── Strengths ───────────────────────────────────────────────────── */}
          {report.strengths.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <CheckCircleOutlineIcon
                  fontSize="small"
                  sx={{ color: tok('primary') }}
                  aria-hidden
                />
                <Typography variant="titleSmall" sx={{ color: tok('on-surface') }}>
                  Punti di forza
                </Typography>
              </Stack>
              <Stack spacing={0.75}>
                {report.strengths.map((s, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <Typography variant="bodySmall" sx={{ color: tok('primary'), lineHeight: 1.6, mt: 0.1 }}>•</Typography>
                    <Typography variant="bodySmall" sx={{ color: tok('on-surface'), lineHeight: 1.6 }}>
                      {s}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* ── Opportunities ───────────────────────────────────────────────── */}
          {report.opportunities.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <LightbulbOutlinedIcon
                  fontSize="small"
                  sx={{ color: tok('tertiary') }}
                  aria-hidden
                />
                <Typography variant="titleSmall" sx={{ color: tok('on-surface') }}>
                  Opportunità di miglioramento
                </Typography>
              </Stack>
              <Stack spacing={0.75}>
                {report.opportunities.map((o, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <WarningAmberIcon
                      fontSize="small"
                      sx={{ color: tok('tertiary'), mt: 0.1, flexShrink: 0 }}
                      aria-hidden
                    />
                    <Typography variant="bodySmall" sx={{ color: tok('on-surface'), lineHeight: 1.6 }}>
                      {o}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* ── No issues detected ─────────────────────────────────────────── */}
          {report.opportunities.length === 0 && report.strengths.length > 0 && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlineIcon fontSize="inherit" />}
              sx={{ bgcolor: tok('primary-container'), color: tok('on-primary-container') }}
            >
              Nessuna criticità rilevata. Il percorso didattico è pienamente allineato ai principi pedagogici MD3.
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default PedagogyInsightPanel;
