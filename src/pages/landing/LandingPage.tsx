/**
 * LandingPage.tsx
 *
 * Portale di ingresso guidato DocenteDocAI.
 *
 * Sections (anchor IDs match NAV_LINKS in LandingNav):
 *   #hero           — Hero "Ti guidiamo noi"
 *   #demo           — CopilotDemo interattivo (wow moment)
 *   #come-funziona  — 3 passi semplicissimi
 *   #per-chi        — Docenti persi → guidati, esperti → accelerati
 *   #cta            — Final CTA
 *   #valori         — Valori del progetto (4 card)
 *   #etica-ai       — AI Responsabile
 *   #partecipa      — Partecipa al progetto + Trasparenza
 *   footer          — Privacy / ToS / Contatti
 *
 * Design:
 *   - MUI v7 + MD3 CSS tokens only (no hardcoded values)
 *   - WCAG 2.1 AA (landmark roles, aria-labels, skip-link friendly)
 *   - Mobile-first, thumb-interaction optimized
 */
import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import RouteIcon from '@mui/icons-material/Route';
import LandingNav from './LandingNav';
import CopilotDemoWidget from './CopilotDemoWidget';

// ── shared helpers ────────────────────────────────────────────────────────────

/** Full-width section wrapper with consistent vertical rhythm */
const Section: React.FC<{
  id: string;
  ariaLabel: string;
  bg?: 'default' | 'container' | 'primary-container';
  children: React.ReactNode;
}> = ({ id, ariaLabel, bg = 'default', children }) => {
  const bgMap = {
    'default':           'var(--md-sys-color-surface)',
    'container':         'var(--md-sys-color-surface-container-low)',
    'primary-container': 'var(--md-sys-color-primary-container)',
  };

  return (
    <Box
      id={id}
      component="section"
      aria-label={ariaLabel}
      sx={{
        py: { xs: 'var(--md-sys-spacing-10)', md: 'var(--md-sys-spacing-12)' },
        bgcolor: bgMap[bg],
        scrollMarginTop: 64,
      }}
    >
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
};

/** Section heading */
const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Box mb={{ xs: 'var(--md-sys-spacing-6)', md: 'var(--md-sys-spacing-8)' }}>
    <Typography
      variant="headlineMedium"
      component="h2"
      sx={{ color: 'var(--md-sys-color-on-surface)', mb: subtitle ? 'var(--md-sys-spacing-2)' : 0 }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="bodyLarge" sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 600 }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

// ── TRUST BADGES ──────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  'Privacy by design',
  'GDPR compliant',
  'Nessun dato condiviso',
  'Open source',
] as const;

// ── HERO ──────────────────────────────────────────────────────────────────────

const Hero: React.FC = memo(() => (
  <Box
    id="hero"
    component="section"
    aria-label="Ingresso guidato DocenteDocAI"
    sx={{
      pt: { xs: 'var(--md-sys-spacing-10)', md: 'var(--md-sys-spacing-14)' },
      pb: { xs: 'var(--md-sys-spacing-8)', md: 'var(--md-sys-spacing-12)' },
      bgcolor: 'var(--md-sys-color-surface)',
      scrollMarginTop: 64,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Decorative background blobs */}
    <Box aria-hidden="true" sx={{
      position: 'absolute',
      top: '-15%',
      right: '-10%',
      width: { xs: 260, md: 420 },
      height: { xs: 260, md: 420 },
      borderRadius: '50%',
      bgcolor: 'var(--md-sys-color-primary-container)',
      opacity: 0.35,
      filter: 'blur(60px)',
      pointerEvents: 'none',
    }} />
    <Box aria-hidden="true" sx={{
      position: 'absolute',
      bottom: '-10%',
      left: '-8%',
      width: { xs: 200, md: 320 },
      height: { xs: 200, md: 320 },
      borderRadius: '50%',
      bgcolor: 'var(--md-sys-color-secondary-container)',
      opacity: 0.3,
      filter: 'blur(60px)',
      pointerEvents: 'none',
    }} />

    <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 6, md: 10 }}
        alignItems={{ md: 'center' }}
      >
        {/* Text block */}
        <Box sx={{ flex: 1, maxWidth: 560 }}>
          <Chip
            icon={<AutoAwesomeIcon fontSize="small" aria-hidden />}
            label="Guida AI attiva · Marzo 2026"
            size="small"
            sx={{
              bgcolor: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
              mb: 'var(--md-sys-spacing-4)',
              fontWeight: 'var(--md-sys-typescale-weight-medium)',
            }}
          />

          <Typography
            variant="displaySmall"
            component="h1"
            sx={{
              color: 'var(--md-sys-color-on-surface)',
              mb: 'var(--md-sys-spacing-4)',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
            }}
          >
            Non devi capire{' '}
            <Box component="span" sx={{ color: 'var(--md-sys-color-primary)' }}>
              cosa fare.
            </Box>
            <br />
            Ti guidiamo noi.
          </Typography>

          <Typography
            variant="bodyLarge"
            sx={{
              color: 'var(--md-sys-color-on-surface-variant)',
              mb: 'var(--md-sys-spacing-6)',
              lineHeight: 1.7,
              maxWidth: 480,
            }}
          >
            DocenteDocAI legge il tuo contesto e ti suggerisce il prossimo passo giusto.
            Non un elenco di funzionalità — una guida sempre presente.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              href="/"
              component="a"
              endIcon={<ArrowForwardIcon />}
              aria-label="Inizia subito con DocenteDocAI"
              sx={{
                borderRadius: 'var(--md-sys-shape-corner-full)',
                px: 'var(--md-sys-spacing-6)',
                py: 'var(--md-sys-spacing-3)',
              }}
            >
              Inizia subito
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="#demo"
              component="a"
              aria-label="Guarda la demo del Copilot"
              sx={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
            >
              Vedi come funziona
            </Button>
          </Stack>

          {/* Trust badges */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 'var(--md-sys-spacing-5)' }}
          >
            {TRUST_BADGES.map(b => (
              <Chip
                key={b}
                label={b}
                size="small"
                icon={<CheckCircleOutlineIcon fontSize="small" aria-hidden />}
                sx={{
                  bgcolor: 'transparent',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  fontSize: 11,
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Visual block */}
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: '100%', md: 380 },
          }}
        >
          {/* Satellite icon preview */}
          <Box
            aria-hidden="true"
            sx={{
              width: '100%',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
              bgcolor: 'var(--md-sys-color-primary-container)',
              p: 'var(--md-sys-spacing-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--md-sys-spacing-4)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}
          >
            {/* Decorative rings */}
            <Box sx={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '1px solid var(--md-sys-color-primary)',
              opacity: 0.15,
            }} />
            {/* "AI is reading context..." indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'var(--md-sys-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-on-primary)' }} />
              </Box>
              <Box>
                <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', display: 'block' }}>
                  Copilot AI
                </Typography>
                <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.75 }}>
                  Analisi contesto…
                </Typography>
              </Box>
            </Box>

            {/* Fake suggestion card */}
            <Box sx={{
              bgcolor: 'var(--md-sys-color-surface)',
              borderRadius: 'var(--md-sys-shape-corner-large)',
              p: 'var(--md-sys-spacing-3)',
              border: '1px solid var(--md-sys-color-outline-variant)',
            }}>
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-primary)', display: 'block', mb: '4px' }}>
                Prossimo passo
              </Typography>
              <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                Aggiungi il tuo primo studente
              </Typography>
              <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: '4px' }}>
                Il sistema costruirà il profilo della classe attorno agli studenti reali.
              </Typography>
              <Box sx={{
                mt: 'var(--md-sys-spacing-2)', display: 'inline-flex', alignItems: 'center',
                gap: 'var(--md-sys-spacing-1)', color: 'var(--md-sys-color-primary)',
              }}>
                <Typography variant="labelSmall">Vai →</Typography>
              </Box>
            </Box>

            {/* Reasoning label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
              <PsychologyAltIcon sx={{ fontSize: 'var(--md-sys-icon-size-xs)', color: 'var(--md-sys-color-on-primary-container)', opacity: 0.6 }} />
              <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.6 }}>
                Perché: workspace nuovo, nessun studente registrato
              </Typography>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Container>
  </Box>
));
Hero.displayName = 'Hero';

// ── DEMO SECTION ──────────────────────────────────────────────────────────────

const DemoSection: React.FC = memo(() => (
  <Box
    id="demo"
    component="section"
    aria-label="Demo interattiva del Copilot AI"
    sx={{
      py: { xs: 'var(--md-sys-spacing-10)', md: 'var(--md-sys-spacing-12)' },
      bgcolor: 'var(--md-sys-color-surface-container-low)',
      scrollMarginTop: 64,
    }}
  >
    <Container maxWidth="lg">
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 6, lg: 10 }} alignItems={{ lg: 'center' }}>
        {/* Left: explanation */}
        <Box sx={{ flex: 1, maxWidth: 440 }}>
          <Chip
            icon={<TouchAppIcon fontSize="small" aria-hidden />}
            label="Prova la demo"
            size="small"
            sx={{
              bgcolor: 'var(--md-sys-color-secondary-container)',
              color: 'var(--md-sys-color-on-secondary-container)',
              mb: 'var(--md-sys-spacing-3)',
              fontWeight: 'var(--md-sys-typescale-weight-medium)',
            }}
          />
          <Typography
            variant="headlineMedium"
            component="h2"
            sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-3)', lineHeight: 1.15 }}
          >
            Il tuo Copilot personale — sempre presente
          </Typography>
          <Typography
            variant="bodyLarge"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-5)', lineHeight: 1.7 }}
          >
            Un bottone flottante che osserva il tuo stato, capisce dove sei nel flusso di lavoro,
            e ti mostra <strong>esattamente il prossimo passo</strong> — con motivazione trasparente.
          </Typography>

          <Stack spacing="var(--md-sys-spacing-3)">
            {[
              { n: '01', text: 'Il bottone appare con un badge pulsante' },
              { n: '02', text: 'Tocca — l\'overlay si apre con il suggerimento contestuale' },
              { n: '03', text: 'Agisci — il sistema avanza al passo successivo' },
            ].map(({ n, text }) => (
              <Box
                key={n}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--md-sys-spacing-3)',
                  p: 'var(--md-sys-spacing-3)',
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  bgcolor: 'var(--md-sys-color-surface)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                }}
              >
                <Typography
                  variant="labelLarge"
                  sx={{
                    color: 'var(--md-sys-color-primary)',
                    fontWeight: 'var(--md-sys-typescale-weight-bold)',
                    flexShrink: 0,
                    width: 28,
                  }}
                >
                  {n}
                </Typography>
                <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                  {text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Right: interactive demo */}
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', lg: 480 } }}>
          <CopilotDemoWidget />
          <Typography
            variant="labelSmall"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 'var(--md-sys-spacing-2)',
              color: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.6,
            }}
          >
            Demo interattiva — tocca il bottone ✦
          </Typography>
        </Box>
      </Stack>
    </Container>
  </Box>
));
DemoSection.displayName = 'DemoSection';

// ── COME FUNZIONA ─────────────────────────────────────────────────────────────

const ComeFunzionaSection: React.FC = memo(() => (
  <Section id="come-funziona" ariaLabel="Come funziona DocenteDocAI">
    <SectionHeading
      title="Come funziona"
      subtitle="Tre passi. Niente da imparare."
    />
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 'var(--md-sys-spacing-5)',
      }}
    >
      {[
        {
          n: '1',
          icon: <RouteIcon sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-primary)' }} />,
          title: 'Entri',
          body: 'Apri l\'app. Il sistema rileva immediatamente il tuo stato: prima volta, docente esperto, classe nuova — capisce.',
        },
        {
          n: '2',
          icon: <PsychologyAltIcon sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-secondary)' }} />,
          title: 'Il sistema capisce',
          body: 'Analizza il contesto — classi, lezioni, progressioni — e calcola in tempo reale il passo che vale di più per te in quel momento.',
        },
        {
          n: '3',
          icon: <AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-xl)', color: 'var(--md-sys-color-tertiary)' }} />,
          title: 'Ricevi la guida',
          body: 'Il Copilot ti mostra il suggerimento, spiega il perché, e ti porta direttamente dove serve con un tap.',
        },
      ].map(({ n, icon, title, body }) => (
        <Box
          key={n}
          sx={{
            p: 'var(--md-sys-spacing-5)',
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            bgcolor: 'var(--md-sys-color-surface-container)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="displayLarge"
            component="span"
            aria-hidden="true"
            sx={{
              position: 'absolute',
              top: 'var(--md-sys-spacing-3)',
              right: 'var(--md-sys-spacing-4)',
              color: 'var(--md-sys-color-outline-variant)',
              lineHeight: 1,
              fontWeight: 'var(--md-sys-typescale-weight-black)',
              opacity: 0.4,
            }}
          >
            {n}
          </Typography>

          <Box sx={{ mb: 'var(--md-sys-spacing-3)' }} aria-hidden="true">
            {icon}
          </Box>
          <Typography
            variant="titleMedium"
            component="h3"
            sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-2)' }}
          >
            {title}
          </Typography>
          <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.7 }}>
            {body}
          </Typography>
        </Box>
      ))}
    </Box>
  </Section>
));
ComeFunzionaSection.displayName = 'ComeFunzionaSection';

// ── FUNZIONALITÀ ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'hub',
    title: 'Knowledge Graph',
    body: 'Ogni dato entra in una rete semantica: studenti, lezioni, valutazioni e azioni collegati e interrogabili.',
    color: 'var(--md-sys-color-primary)',
  },
  {
    icon: 'sync',
    title: 'Sincronizzazione registro',
    body: 'Connetti Spaggiari, Argo o qualsiasi sistema scolastico HTTP. Dati di classe e voti sincronizzati automaticamente.',
    color: 'var(--md-sys-color-secondary)',
  },
  {
    icon: 'bolt',
    title: 'Automazioni intelligenti',
    body: 'Il sistema pianifica azioni autonomamente — notifiche, aggiornamenti registro, report — con log di audit completo.',
    color: 'var(--md-sys-color-tertiary)',
  },
  {
    icon: 'groups',
    title: 'Multi-classe e multi-istituto',
    body: 'Gestisci più classi su più scuole con RBAC nativo. Ogni dato è isolato e protetto per tenant.',
    color: 'var(--md-sys-color-primary)',
  },
  {
    icon: 'description',
    title: 'Analisi documenti',
    body: 'Circolari, foto, elaborati: l\'AI estrae dati strutturati via OCR e li integra nel profilo della classe.',
    color: 'var(--md-sys-color-secondary)',
  },
  {
    icon: 'verified_user',
    title: 'Compliance automatica',
    body: 'Log di conformità su ogni azione e sincronizzazione. Audit-ready per la PA. GDPR by design.',
    color: 'var(--md-sys-color-tertiary)',
  },
] as const;

const FunzionalitaSection: React.FC = memo(() => (
  <Section id="funzionalita" ariaLabel="Funzionalità principali di DocenteDocAI" bg="container">
    <SectionHeading
      title="Tutto il tuo lavoro, connesso"
      subtitle="Dalle annotazioni quotidiane all'integrazione con il registro — un sistema unico che impara dal tuo contesto."
    />
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        gap: 'var(--md-sys-spacing-4)',
      }}
    >
      {FEATURES.map(f => (
        <Box
          key={f.title}
          sx={{
            p: 'var(--md-sys-spacing-4)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            bgcolor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--md-sys-spacing-2)',
            transition: 'border-color 0.15s, transform 0.15s',
            '&:hover': { transform: 'translateY(-2px)', borderColor: f.color },
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ fontSize: 28, color: f.color }}
          >
            {f.icon}
          </Box>
          <Typography variant="titleSmall" component="h3" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
            {f.title}
          </Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
            {f.body}
          </Typography>
        </Box>
      ))}
    </Box>
  </Section>
));
FunzionalitaSection.displayName = 'FunzionalitaSection';

// ── PER CHI ────────────────────────────────────────────────────────────────────

const PerChiSection: React.FC = memo(() => (
  <Section id="per-chi" ariaLabel="A chi si rivolge DocenteDocAI" bg="primary-container">
    <SectionHeading
      title="Per qualunque professionale"
    />
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 'var(--md-sys-spacing-5)',
      }}
    >
      {[
        {
          label: 'Docente alle prime armi',
          tag: 'Guidato',
          tagColor: 'var(--md-sys-color-primary)',
          tagBg: 'var(--md-sys-color-surface)',
          description: 'Non sai da dove partire? Il sistema lo sa. Ti guida dal primo studente fino alla prima UDA, passo dopo passo, senza che tu debba esplorare menù o leggere manuali.',
          steps: ['Prima schermata → guida immediata', 'Ogni azione spiega il perché', 'Progredisci senza ansia'],
        },
        {
          label: 'Docente esperto',
          tag: 'Accelerato',
          tagColor: 'var(--md-sys-color-tertiary)',
          tagBg: 'var(--md-sys-color-surface)',
          description: 'Già navigato? Il Copilot si adatta: suggerisce ottimizzazioni avanzate, analisi predittive sulla classe, azioni ad alto impatto che risparmiano ore di lavoro.',
          steps: ['Predizione trend di apprendimento', 'Insight automatici per classe', 'Azioni strategiche ad alto impatto'],
        },
        {
          label: 'Dirigente scolastico',
          tag: 'Strategico',
          tagColor: 'var(--md-sys-color-secondary)',
          tagBg: 'var(--md-sys-color-surface)',
          description: 'Vista d\'insieme su classi, docenti e istituto. Dashboard predittive per identificare criticità, monitorare compliance e preparare audit e rendicontazioni.',
          steps: ['Dashboard multi-classe e multi-docente', 'Monitoraggio rischio e dropout', 'Report compliance automatici'],
        },
      ].map(({ label, tag, tagColor, tagBg, description, steps }) => (
        <Card
          key={label}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            bgcolor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CardContent sx={{ p: 'var(--md-sys-spacing-5) !important', flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb="var(--md-sys-spacing-3)">
              <Typography
                variant="titleMedium"
                component="h3"
                sx={{ color: 'var(--md-sys-color-on-surface)', flex: 1 }}
              >
                {label}
              </Typography>
              <Chip
                label={tag}
                size="small"
                sx={{
                  bgcolor: tagBg,
                  color: tagColor,
                  border: `1px solid ${tagColor}`,
                  fontWeight: 'var(--md-sys-typescale-weight-bold)',
                }}
              />
            </Stack>

            <Typography
              variant="bodyMedium"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-4)', lineHeight: 1.7 }}
            >
              {description}
            </Typography>

            <Stack spacing="var(--md-sys-spacing-2)">
              {steps.map(s => (
                <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: tagColor, flexShrink: 0 }}
                    aria-hidden
                  />
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {s}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Section>
));
PerChiSection.displayName = 'PerChiSection';

// ── GUIDA ─────────────────────────────────────────────────────────────────────

const GUIDA_STEPS = [
  {
    step: '01',
    icon: 'person_add',
    title: 'Configura il profilo',
    body: 'Inserisci nome, disciplina e scuola. Il sistema rileva il tuo livello di esperienza e calibra la guida AI di conseguenza.',
  },
  {
    step: '02',
    icon: 'groups',
    title: 'Aggiungi studenti e classi',
    body: 'Importa da Spaggiari/Argo o aggiungi manualmente. Il Knowledge Graph costruisce le relazioni in tempo reale.',
  },
  {
    step: '03',
    icon: 'menu_book',
    title: 'Prima lezione',
    body: 'Registra l\'argomento e le osservazioni. Il Copilot suggerisce UDA, obiettivi di apprendimento e prossimo passo.',
  },
  {
    step: '04',
    icon: 'analytics',
    title: 'Analisi della classe',
    body: 'Dopo le prime lezioni il sistema produce insight predittivi: trend di apprendimento, alunni a rischio, progressioni.',
  },
  {
    step: '05',
    icon: 'description',
    title: 'Documenti e circolari',
    body: 'Carica una circolare o una foto: l\'AI estrae dati, li aggancia al registro e propone azioni concrete.',
  },
] as const;

const GuidaSection: React.FC = memo(() => (
  <Section id="guida" ariaLabel="Guida rapida all'utilizzo di DocenteDocAI" bg="container">
    <SectionHeading
      title="Guida rapida"
      subtitle="Dal primo accesso ai suggerimenti avanzati — in cinque passi."
    />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-3)' }}>
      {GUIDA_STEPS.map(({ step, icon, title, body }) => (
        <Box
          key={step}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '48px 1fr', md: '64px 1fr' },
            gap: { xs: 'var(--md-sys-spacing-3)', md: 'var(--md-sys-spacing-5)' },
            alignItems: 'flex-start',
            p: 'var(--md-sys-spacing-4)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            bgcolor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          {/* Step badge + icon */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pt: '2px' }}>
            <Typography
              variant="labelSmall"
              sx={{ color: 'var(--md-sys-color-primary)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}
            >
              {step}
            </Typography>
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 22, color: 'var(--md-sys-color-primary)' }}
            >
              {icon}
            </Box>
          </Box>
          {/* Text */}
          <Box>
            <Typography
              variant="titleSmall"
              component="h3"
              sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-1)' }}
            >
              {title}
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.65 }}>
              {body}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>

    {/* CTA embedded */}
    <Box
      sx={{
        mt: 'var(--md-sys-spacing-6)',
        p: 'var(--md-sys-spacing-5)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        bgcolor: 'var(--md-sys-color-primary-container)',
        border: '1px solid var(--md-sys-color-primary)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        gap: 'var(--md-sys-spacing-4)',
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', mb: 'var(--md-sys-spacing-1)' }}>
          Pronto a iniziare?
        </Typography>
        <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.85 }}>
          Il Copilot ti guida dal primo secondo — senza bisogno di leggere nessun manuale.
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="medium"
        href="/"
        component="a"
        endIcon={<ArrowForwardIcon />}
        aria-label="Avvia DocenteDocAI adesso"
        sx={{
          borderRadius: 'var(--md-sys-shape-corner-full)',
          bgcolor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          flexShrink: 0,
          '&:hover': { bgcolor: 'var(--md-sys-color-primary)', filter: 'brightness(0.92)' },
        }}
      >
        Avvia
      </Button>
    </Box>
  </Section>
));
GuidaSection.displayName = 'GuidaSection';

// ── CTA FINALE ────────────────────────────────────────────────────────────────

const CtaSection: React.FC = memo(() => (
  <Box
    id="cta"
    component="section"
    aria-label="Invito all'azione principale"
    sx={{
      py: { xs: 'var(--md-sys-spacing-12)', md: 'var(--md-sys-spacing-16)' },
      bgcolor: 'var(--md-sys-color-surface)',
      scrollMarginTop: 64,
    }}
  >
    <Container maxWidth="md">
      <Box
        sx={{
          textAlign: 'center',
          p: { xs: 'var(--md-sys-spacing-6)', md: 'var(--md-sys-spacing-10)' },
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          bgcolor: 'var(--md-sys-color-primary-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative ring */}
        <Box aria-hidden="true" sx={{
          position: 'absolute',
          right: '-5%',
          top: '-20%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: '1px solid var(--md-sys-color-primary)',
          opacity: 0.12,
        }} />

        <AutoAwesomeIcon
          sx={{ fontSize: 'var(--md-sys-icon-size-2xl)', color: 'var(--md-sys-color-primary)', mb: 'var(--md-sys-spacing-3)' }}
          aria-hidden
        />

        <Typography
          variant="displaySmall"
          component="h2"
          sx={{
            color: 'var(--md-sys-color-on-primary-container)',
            mb: 'var(--md-sys-spacing-3)',
            lineHeight: 1.15,
          }}
        >
          Provalo. Non devi imparare niente.
        </Typography>

        <Typography
          variant="bodyLarge"
          sx={{
            color: 'var(--md-sys-color-on-primary-container)',
            opacity: 0.85,
            mb: 'var(--md-sys-spacing-6)',
            maxWidth: 500,
            mx: 'auto',
            lineHeight: 1.7,
          }}
        >
          Apri l'app e il sistema capirà subito cosa fare. La guida parte dal primo secondo.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            href="/"
            component="a"
            endIcon={<ArrowForwardIcon />}
            aria-label="Avvia DocenteDocAI adesso"
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-full)',
              px: 'var(--md-sys-spacing-8)',
              py: 'var(--md-sys-spacing-3)',
              bgcolor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              '&:hover': { bgcolor: 'var(--md-sys-color-primary)', filter: 'brightness(0.92)' },
            }}
          >
            Avvia DocenteDocAI
          </Button>
          <Button
            variant="outlined"
            size="large"
            href="#partecipa"
            component="a"
            aria-label="Partecipa come scuola pilota"
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-full)',
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-primary)',
              bgcolor: 'var(--md-sys-color-surface)',
              '&:hover': { bgcolor: 'var(--md-sys-color-surface-container)' },
            }}
          >
            Scuola pilota
          </Button>
        </Stack>
      </Box>
    </Container>
  </Box>
));
CtaSection.displayName = 'CtaSection';

// ── VALORI ────────────────────────────────────────────────────────────────────

const VALORI = [
  {
    icon: 'school',
    title: 'Educazione prima della tecnologia',
    body: "L'AI è uno strumento. La decisione pedagogica resta always al docente.",
    color: 'var(--md-sys-color-primary)',
  },
  {
    icon: 'visibility',
    title: 'Trasparenza',
    body: 'Ogni suggerimento AI mostra le sue ragioni. Nessuna black-box nella didattica.',
    color: 'var(--md-sys-color-secondary)',
  },
  {
    icon: 'balance',
    title: 'Responsabilità',
    body: 'Il docente è titolare del trattamento dei dati e responsabile delle scelte educative.',
    color: 'var(--md-sys-color-tertiary)',
  },
  {
    icon: 'lock',
    title: 'Rispetto dei dati',
    body: "Privacy by design: i dati degli studenti non escono dal dispositivo senza consenso esplicito.",
    color: 'var(--md-sys-color-error)',
  },
];

const ValoriSection: React.FC = memo(() => (
  <Section id="valori" ariaLabel="Valori del progetto DocenteDocAI">
    <SectionHeading
      title="Valori del progetto"
      subtitle="I principi che guidano ogni scelta tecnica e pedagogica."
    />
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 'var(--md-sys-spacing-4)',
      }}
    >
      {VALORI.map(v => (
        <Card
          key={v.title}
          variant="outlined"
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-large)',
            borderColor: 'var(--md-sys-color-outline-variant)',
            bgcolor: 'var(--md-sys-color-surface-container-low)',
            p: 'var(--md-sys-spacing-2)',
            transition: 'transform 0.15s, border-color 0.15s',
            '&:hover': { transform: 'translateY(-2px)', borderColor: v.color },
          }}
        >
          <CardContent>
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{ fontSize: 32, color: v.color, display: 'block', mb: 'var(--md-sys-spacing-3)' }}
            >
              {v.icon}
            </Box>
            <Typography
              variant="titleSmall"
              component="h3"
              sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-2)' }}
            >
              {v.title}
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {v.body}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Section>
));
ValoriSection.displayName = 'ValoriSection';

// ── ETICA AI ──────────────────────────────────────────────────────────────────

const ETICA_ITEMS = [
  { icon: 'visibility',          title: 'Trasparenza algoritmica', body: "Ogni output dell'AI è accompagnato da spiegazione leggibile. Il docente vede i fattori che hanno determinato il suggerimento e il loro peso relativo." },
  { icon: 'manage_accounts',     title: 'Controllo docente',       body: 'Il sistema fornisce suggerimenti, non decisioni. La valutazione e la scelta pedagogica restano sempre nella responsabilità del professionista.' },
  { icon: 'privacy_tip',         title: 'Protezione dei dati',     body: 'Dati studenti gestiti con architettura privacy-by-design. Conformità ai principi GDPR UE 2016/679 e alle Linee guida MIM sulla digitalizzazione.' },
  { icon: 'quiz',                title: 'Spiegabilità (XAI)',      body: "Il sistema espone il suo ragionamento in linguaggio pedagogico comprensibile al docente, non in termini tecnici opachi." },
];

const EticaAISection: React.FC = memo(() => (
  <Section id="etica-ai" ariaLabel="AI responsabile e principi etici" bg="container">
    <SectionHeading
      title="AI Responsabile"
      subtitle="Il sistema è progettato attorno a principi di AI etica applicata all'educazione."
    />

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
        gap: 'var(--md-sys-spacing-4)',
        mb: 'var(--md-sys-spacing-6)',
      }}
    >
      {ETICA_ITEMS.map(item => (
        <Stack
          key={item.title}
          direction="row"
          spacing={2}
          alignItems="flex-start"
          sx={{
            p: 'var(--md-sys-spacing-4)',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            bgcolor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ color: 'var(--md-sys-color-secondary)', fontSize: 24, flexShrink: 0, mt: 0.25 }}
          >
            {item.icon}
          </Box>
          <Stack spacing={0.5}>
            <Typography variant="labelLarge" component="h3" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
              {item.title}
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {item.body}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Box>

    {/* Compliance badges */}
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      {['GDPR UE 2016/679', 'Linee guida AI MIM', 'Privacy by Design', 'Ethical AI Guidelines'].map(label => (
        <Chip
          key={label}
          label={label}
          icon={<CheckCircleOutlineIcon fontSize="small" aria-hidden />}
          sx={{
            bgcolor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            fontWeight: 'var(--md-sys-typescale-weight-medium)',
          }}
        />
      ))}
    </Stack>
  </Section>
));
EticaAISection.displayName = 'EticaAISection';

// ── PARTECIPA ─────────────────────────────────────────────────────────────────

const PARTECIPA_CARDS = [
  {
    icon: 'school',
    title: 'Scuole pilota',
    body: 'La prima fase pilota è aperta a istituti scolastici interessati a sperimentare DocenteDocAI in contesti reali. Collaboriamo per adottare e validare il sistema.',
    cta: 'Contattaci per il pilota',
    href: 'mailto:info@docentedoc.app?subject=Richiesta%20scuola%20pilota',
  },
  {
    icon: 'person',
    title: 'Docenti interessati',
    body: 'Se sei un docente e vuoi partecipare alla beta, accedere alla demo o contribuire con feedback pedagogico, scrivici.',
    cta: 'Accedi alla demo',
    href: '/',
  },
  {
    icon: 'biotech',
    title: 'Collaborazioni accademiche',
    body: 'Ricercatori e università interessati a partnership per la validazione empirica dei modelli pedagogici sono benvenuti.',
    cta: 'Scrivici',
    href: 'mailto:info@docentedoc.app?subject=Collaborazione%20accademica',
  },
];

const PartecipaSection: React.FC = memo(() => (
  <Section id="partecipa" ariaLabel="Partecipa al progetto DocenteDocAI">
    <SectionHeading
      title="Partecipa al progetto"
      subtitle="Stiamo costruendo qualcosa di utile. Aiutaci a farlo meglio."
    />

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 'var(--md-sys-spacing-4)',
        mb: 'var(--md-sys-spacing-10)',
      }}
    >
      {PARTECIPA_CARDS.map(card => (
        <Card
          key={card.title}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            bgcolor: 'var(--md-sys-color-surface-container)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          <CardContent sx={{ flex: 1, p: 'var(--md-sys-spacing-5) !important' }}>
            <Box
              component="span"
              className="material-symbols-outlined"
              aria-hidden="true"
              sx={{
                display: 'block',
                fontSize: 36,
                color: 'var(--md-sys-color-primary)',
                mb: 'var(--md-sys-spacing-3)',
              }}
            >
              {card.icon}
            </Box>
            <Typography
              variant="titleMedium"
              component="h3"
              sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-2)' }}
            >
              {card.title}
            </Typography>
            <Typography
              variant="bodySmall"
              sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-4)', lineHeight: 1.6 }}
            >
              {card.body}
            </Typography>
          </CardContent>
          <Box px="var(--md-sys-spacing-5)" pb="var(--md-sys-spacing-4)">
            <Button
              variant="outlined"
              size="small"
              href={card.href}
              component="a"
              endIcon={<ArrowForwardIcon />}
              aria-label={card.cta}
              sx={{ borderRadius: 'var(--md-sys-shape-corner-full)' }}
            >
              {card.cta}
            </Button>
          </Box>
        </Card>
      ))}
    </Box>

    {/* Trasparenza ─────────────────────────────────────────────────────────── */}
    <Box
      sx={{
        p: 'var(--md-sys-spacing-5)',
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        border: '1px solid var(--md-sys-color-primary)',
        bgcolor: 'var(--md-sys-color-primary-container)',
      }}
    >
      <Typography
        variant="titleMedium"
        component="h3"
        sx={{ color: 'var(--md-sys-color-on-primary-container)', mb: 'var(--md-sys-spacing-3)' }}
      >
        Trasparenza del progetto
      </Typography>
      <Typography
        variant="bodyMedium"
        sx={{ color: 'var(--md-sys-color-on-primary-container)', mb: 'var(--md-sys-spacing-4)', maxWidth: 560 }}
      >
        Il progetto è sviluppato in modo aperto. Puoi esaminare la documentazione tecnica,
        la roadmap e i principi etici che guidano le scelte di design.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
        {[
          { label: 'Documentazione tecnica', href: '/docs/ARCHITECTURE.md' },
          { label: 'Roadmap di sviluppo',    href: '/docs/ROADMAP.md' },
          { label: 'Principi etici',         href: '/docs/PIANI_SVILUPPO.md' },
          { label: 'Stato di sviluppo',      href: '/docs/CLAUDE.md' },
        ].map(link => (
          <Button
            key={link.label}
            variant="outlined"
            size="small"
            href={link.href}
            component="a"
            aria-label={link.label}
            sx={{
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-primary)',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: 'var(--md-sys-color-surface)',
              '&:hover': { bgcolor: 'var(--md-sys-color-surface-container)' },
            }}
          >
            {link.label}
          </Button>
        ))}
      </Stack>
    </Box>
  </Section>
));
PartecipaSection.displayName = 'PartecipaSection';

// ── PRICING ───────────────────────────────────────────────────────────────────

const PRICING_FREE_FEATURES = [
  'Registro di classe completo',
  'Pianificazione UDA illimitata',
  'Valutazioni e annotazioni',
  'Backup Google Drive',
  'AI di base (1 000 token/sessione)',
];

const PRICING_PRO_FEATURES = [
  'Tutto il piano Free',
  'AI avanzata (10 000 token/sessione)',
  'Analisi predittiva della classe',
  'Copilot Docente — 14 moduli AI',
  'Report intelligenti e spiegabilità',
  'Priorità nel supporto',
];

const PricingSection: React.FC = memo(() => (
  <Section id="prezzi" ariaLabel="Piani e prezzi" bg="container">
    <SectionHeading
      title="Un piano per ogni docente"
      subtitle="Inizia gratis, passa a Pro quando ne hai bisogno."
    />
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={{ xs: 'var(--md-sys-spacing-4)', md: 'var(--md-sys-spacing-6)' }}
      justifyContent="center"
      alignItems={{ xs: 'stretch', md: 'flex-start' }}
    >
      {/* Free card */}
      <Card
        variant="outlined"
        sx={{
          flex: 1,
          maxWidth: { md: 380 },
          borderRadius: 'var(--md-sys-shape-corner-large)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <CardContent sx={{ p: 'var(--md-sys-spacing-6)' }}>
          <Typography variant="titleLarge" sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-1)' }}>
            Free
          </Typography>
          <Typography variant="displaySmall" sx={{ color: 'var(--md-sys-color-on-surface)', mb: 'var(--md-sys-spacing-1)' }}>
            €0
          </Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-5)' }}>
            per sempre
          </Typography>
          <Stack spacing="var(--md-sys-spacing-2)" mb="var(--md-sys-spacing-6)">
            {PRICING_FREE_FEATURES.map(f => (
              <Stack key={f} direction="row" spacing="var(--md-sys-spacing-2)" alignItems="center">
                <CheckCircleOutlineIcon sx={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'var(--md-sys-icon-size-sm)' }} />
                <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{f}</Typography>
              </Stack>
            ))}
          </Stack>
          <Button
            variant="outlined"
            fullWidth
            href="/landing#hero"
            component="a"
            aria-label="Inizia gratis con piano Free"
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-full)',
              borderColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-primary)',
            }}
          >
            Inizia gratis
          </Button>
        </CardContent>
      </Card>

      {/* Pro card */}
      <Card
        sx={{
          flex: 1,
          maxWidth: { md: 380 },
          borderRadius: 'var(--md-sys-shape-corner-large)',
          bgcolor: 'var(--md-sys-color-primary)',
          color:   'var(--md-sys-color-on-primary)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* "Consigliato" chip */}
        <Chip
          label="Consigliato"
          size="small"
          sx={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'var(--md-sys-color-tertiary)',
            color:   'var(--md-sys-color-on-tertiary)',
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
          }}
        />
        <CardContent sx={{ p: 'var(--md-sys-spacing-6)' }}>
          <Typography variant="titleLarge" sx={{ color: 'var(--md-sys-color-on-primary)', mb: 'var(--md-sys-spacing-1)' }}>
            Pro
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1} mb="var(--md-sys-spacing-1)">
            <Typography variant="displaySmall" sx={{ color: 'var(--md-sys-color-on-primary)' }}>
              €7
            </Typography>
            <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-primary)', opacity: 0.8 }}>
              /mese
            </Typography>
          </Stack>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-primary)', opacity: 0.7, mb: 'var(--md-sys-spacing-5)' }}>
            fatturazione mensile, annulla quando vuoi
          </Typography>
          <Stack spacing="var(--md-sys-spacing-2)" mb="var(--md-sys-spacing-6)">
            {PRICING_PRO_FEATURES.map(f => (
              <Stack key={f} direction="row" spacing="var(--md-sys-spacing-2)" alignItems="center">
                <CheckCircleOutlineIcon sx={{ color: 'var(--md-sys-color-on-primary)', opacity: 0.9, fontSize: 'var(--md-sys-icon-size-sm)' }} />
                <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-primary)' }}>{f}</Typography>
              </Stack>
            ))}
          </Stack>
          <Button
            variant="contained"
            fullWidth
            href="/landing#hero"
            component="a"
            aria-label="Passa al piano Pro"
            sx={{
              borderRadius: 'var(--md-sys-shape-corner-full)',
              bgcolor: 'var(--md-sys-color-on-primary)',
              color:   'var(--md-sys-color-primary)',
              '&:hover': { bgcolor: 'var(--md-sys-color-primary-container)' },
            }}
          >
            Passa a Pro
          </Button>
        </CardContent>
      </Card>
    </Stack>
  </Section>
));
PricingSection.displayName = 'PricingSection';

// ── FOOTER ────────────────────────────────────────────────────────────────────

const LandingFooter: React.FC = memo(() => (
  <Box
    component="footer"
    sx={{
      py: 'var(--md-sys-spacing-8)',
      bgcolor: 'var(--md-sys-color-surface-container-high)',
      borderTop: '1px solid var(--md-sys-color-outline-variant)',
    }}
  >
    <Container maxWidth="lg">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={{ xs: 4, md: 2 }}
      >
        {/* Brand */}
        <Stack spacing={1}>
          <Typography
            variant="titleSmall"
            sx={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'var(--md-sys-typescale-weight-bold)' }}
          >
            DocenteDocAI
          </Typography>
          <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 280 }}>
            Intelligenza artificiale al servizio della didattica italiana. Progetto in fase pilota — Marzo 2026.
          </Typography>
        </Stack>

        {/* Links */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} flexWrap="wrap" useFlexGap>
          <Link
            href="/privacy"
            color="inherit"
            underline="hover"
            variant="bodySmall"
            aria-label="Privacy policy"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Privacy policy
          </Link>
          <Link
            href="/terms"
            color="inherit"
            underline="hover"
            variant="bodySmall"
            aria-label="Termini di utilizzo"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Termini di utilizzo
          </Link>
          <Link
            href="mailto:info@docentedoc.app"
            color="inherit"
            underline="hover"
            variant="bodySmall"
            aria-label="Contatti email"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            Contatti
          </Link>
          <Typography
            variant="bodySmall"
            sx={{ color: 'var(--md-sys-color-outline)', cursor: 'default' }}
            title="Dichiarazione di accessibilità in preparazione"
          >
            Dichiarazione di accessibilità (in preparazione)
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 'var(--md-sys-spacing-4)', borderColor: 'var(--md-sys-color-outline-variant)' }} />

      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-outline)', textAlign: 'center' }}>
        © 2026 DocenteDocAI — Strumento pedagogico sperimentale. Tutti i dati rimangono sul dispositivo del docente.
      </Typography>
    </Container>
  </Box>
));
LandingFooter.displayName = 'LandingFooter';

// ── ROOT COMPONENT ────────────────────────────────────────────────────────────

const LandingPage: React.FC = () => (
  <Box
    sx={{
      minHeight: '100vh',
      bgcolor: 'var(--md-sys-color-surface)',
      color: 'var(--md-sys-color-on-surface)',
    }}
  >
    {/* Skip link for keyboard/screen-reader users */}
    <Box
      component="a"
      href="#hero"
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: 1,
        height: 1,
        overflow: 'hidden',
        '&:focus': {
          position: 'fixed',
          left: 'var(--md-sys-spacing-3)',
          top: 'var(--md-sys-spacing-3)',
          width: 'auto',
          height: 'auto',
          zIndex: 9999,
          p: 'var(--md-sys-spacing-2)',
          bgcolor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
        },
      }}
    >
      Vai al contenuto principale
    </Box>

    <LandingNav />

    <Box component="main" id="hero">
      <Hero />
      <DemoSection />
      <ComeFunzionaSection />
      <FunzionalitaSection />
      <PerChiSection />
      <GuidaSection />
      <PricingSection />
      <CtaSection />
      <ValoriSection />
      <EticaAISection />
      <PartecipaSection />
    </Box>

    <LandingFooter />
  </Box>
);

export default LandingPage;
