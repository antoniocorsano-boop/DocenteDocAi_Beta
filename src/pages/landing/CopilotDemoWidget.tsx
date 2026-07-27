/**
 * CopilotDemoWidget.tsx
 *
 * Simula il comportamento del FloatingSatelliteCopilot sulla landing page.
 * Mostra il "wow moment": bottone flottante → tap → overlay con prossimo passo.
 * Completamente self-contained, nessuna dipendenza dalle store real.
 * MD3 Gold Compliant.
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';

// ── Demo sequence ─────────────────────────────────────────────────────────────

interface DemoAction {
  id: string;
  label: string;
  description: string;
  cta: string;
  level: number; // 1-4 capability level
  icon: React.ReactNode;
  color: string;
}

const DEMO_ACTIONS: DemoAction[] = [
  {
    id: 'add_student',
    label: 'Aggiungi il tuo primo studente',
    description: 'Inizia registrando la tua classe. Il sistema costruirà il profilo della classe attorno agli studenti.',
    cta: 'Aggiungi studente',
    level: 1,
    icon: <AddIcon />,
    color: 'var(--md-sys-color-primary)',
  },
  {
    id: 'create_lesson',
    label: 'Crea la prossima lezione',
    description: "Hai già aggiunto studenti. Ora il sistema può analizzare la distribuzione cognitiva delle tue lezioni.",
    cta: 'Crea lezione',
    level: 2,
    icon: <SchoolIcon />,
    color: 'var(--md-sys-color-secondary)',
  },
  {
    id: 'analyze_class',
    label: 'Analizza la performance della classe',
    description: 'Con 3+ lezioni registrate, il sistema predice le aree di attenzione e suggerisce interventi personalizzati.',
    cta: 'Analizza ora',
    level: 3,
    icon: <BarChartIcon />,
    color: 'var(--md-sys-color-tertiary)',
  },
];

// ── Fake app screen ───────────────────────────────────────────────────────────

const FakeAppScreen: React.FC = memo(() => (
  <Box
    aria-hidden="true"
    sx={{
      position: 'relative',
      width: '100%',
      height: 320,
      borderRadius: 'var(--md-sys-shape-corner-extra-large)',
      bgcolor: 'var(--md-sys-color-surface-container)',
      border: '1px solid var(--md-sys-color-outline-variant)',
      overflow: 'hidden',
      userSelect: 'none',
    }}
  >
    {/* Fake top bar */}
    <Box sx={{
      height: 52,
      bgcolor: 'var(--md-sys-color-surface-container-high)',
      borderBottom: '1px solid var(--md-sys-color-outline-variant)',
      display: 'flex',
      alignItems: 'center',
      px: 'var(--md-sys-spacing-4)',
      gap: 'var(--md-sys-spacing-3)',
    }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--md-sys-color-error)', opacity: 0.5 }} />
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--md-sys-color-tertiary)', opacity: 0.5 }} />
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--md-sys-color-secondary)', opacity: 0.5 }} />
      <Box sx={{ flex: 1, height: 10, borderRadius: 4, bgcolor: 'var(--md-sys-color-outline-variant)', ml: 1, opacity: 0.4 }} />
    </Box>

    {/* Fake sidebar + content */}
    <Box sx={{ display: 'flex', height: 'calc(100% - 52px)' }}>
      {/* Sidebar */}
      <Box sx={{
        width: 56,
        bgcolor: 'var(--md-sys-color-surface-container-low)',
        borderRight: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 'var(--md-sys-spacing-3)',
        gap: 'var(--md-sys-spacing-3)',
      }}>
        {[
          'var(--md-sys-color-primary)',
          'var(--md-sys-color-outline-variant)',
          'var(--md-sys-color-outline-variant)',
          'var(--md-sys-color-outline-variant)',
        ].map((color, i) => (
          <Box key={i} sx={{
            width: 32, height: 32, borderRadius: 'var(--md-sys-shape-corner-medium)',
            bgcolor: color, opacity: i === 0 ? 0.2 : 0.1,
          }} />
        ))}
      </Box>

      {/* Main content skeleton */}
      <Box sx={{ flex: 1, p: 'var(--md-sys-spacing-3)', display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-2)' }}>
        <Box sx={{ height: 20, width: '60%', borderRadius: 4, bgcolor: 'var(--md-sys-color-outline-variant)', opacity: 0.5 }} />
        <Box sx={{ height: 12, width: '40%', borderRadius: 4, bgcolor: 'var(--md-sys-color-outline-variant)', opacity: 0.3 }} />
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--md-sys-spacing-2)' }}>
          {[...Array(4)].map((_, i) => (
            <Box key={i} sx={{
              height: 56,
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              bgcolor: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              opacity: 0.6,
            }} />
          ))}
        </Box>
        <Box sx={{ height: 12, width: '80%', borderRadius: 4, bgcolor: 'var(--md-sys-color-outline-variant)', opacity: 0.2 }} />
        <Box sx={{ height: 12, width: '55%', borderRadius: 4, bgcolor: 'var(--md-sys-color-outline-variant)', opacity: 0.15 }} />
      </Box>
    </Box>

    {/* Overlay gradient at bottom */}
    <Box sx={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: 60,
      background: 'linear-gradient(to bottom, transparent, var(--md-sys-color-surface-container))',
    }} />
  </Box>
));
FakeAppScreen.displayName = 'FakeAppScreen';

// ── Floating button ───────────────────────────────────────────────────────────

interface FloatingButtonProps {
  visible: boolean;
  pulsing: boolean;
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ visible, pulsing, onClick }) => (
  <Fade in={visible}>
    <Box
      sx={{
        position: 'absolute',
        bottom: 'var(--md-sys-spacing-4)',
        right: 'var(--md-sys-spacing-4)',
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
        }}
      >
        {/* Pulse ring */}
        {pulsing && (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              bgcolor: 'var(--md-sys-color-primary)',
              opacity: 0,
              animation: 'demo-pulse 1.6s ease-out infinite',
              '@keyframes demo-pulse': {
                '0%': { opacity: 0.5, transform: 'scale(1)' },
                '100%': { opacity: 0, transform: 'scale(1.6)' },
              },
            }}
          />
        )}
        <Box
          component="button"
          onClick={onClick}
          aria-label="Apri il Copilot AI"
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--md-sys-elevation-level3)',
            transition: 'transform 0.15s ease',
            '&:hover': { transform: 'scale(1.08)' },
            '&:active': { transform: 'scale(0.96)' },
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-lg)' }} aria-hidden />
        </Box>

        {/* Badge dot */}
        {pulsing && (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'var(--md-sys-color-tertiary)',
              border: '2px solid var(--md-sys-color-surface)',
            }}
          />
        )}
      </Box>
    </Box>
  </Fade>
);

// ── Overlay panel ─────────────────────────────────────────────────────────────

interface OverlayPanelProps {
  visible: boolean;
  action: DemoAction;
  actionIndex: number;
  onClose: () => void;
  onCta: () => void;
}

const OverlayPanel: React.FC<OverlayPanelProps> = ({
  visible, action, actionIndex, onClose, onCta,
}) => (
  <Fade in={visible} timeout={250}>
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        bgcolor: 'var(--md-sys-color-surface-container-high)',
        borderRadius: 'var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0',
        boxShadow: 'var(--md-sys-elevation-level4)',
        p: 'var(--md-sys-spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-3)',
        animation: visible ? 'demo-slide-up 0.25s ease' : 'none',
        '@keyframes demo-slide-up': {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: -1 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'var(--md-sys-color-outline-variant)' }} aria-hidden="true" />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)' }}>
          <AutoAwesomeIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm)', color: 'var(--md-sys-color-primary)' }} aria-hidden />
          <Typography variant="labelMedium" sx={{ color: 'var(--md-sys-color-primary)' }}>
            Copilot AI
          </Typography>
          <Chip
            label="demo"
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              bgcolor: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
            }}
          />
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Chiudi Copilot"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)', p: '4px' }}
        >
          <CloseIcon sx={{ fontSize: 'var(--md-sys-icon-size-sm)' }} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'var(--md-sys-color-outline-variant)' }} />

      {/* Next step */}
      <Box sx={{
        p: 'var(--md-sys-spacing-3)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        bgcolor: 'var(--md-sys-color-primary-container)',
        border: '1px solid var(--md-sys-color-primary)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-2)' }}>
          <Box sx={{
            color: action.color,
            mt: '2px',
            flexShrink: 0,
          }} aria-hidden>
            {action.icon}
          </Box>
          <Box>
            <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.75, display: 'block', mb: '2px' }}>
              Prossimo passo consigliato
            </Typography>
            <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-primary-container)' }}>
              {action.label}
            </Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-primary-container)', opacity: 0.85, mt: '4px', lineHeight: 1.5 }}>
              {action.description}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Mini progress */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 'var(--md-sys-spacing-1)' }}>
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Progressione
          </Typography>
          <Typography variant="labelSmall" sx={{ color: 'var(--md-sys-color-primary)' }}>
            Livello {action.level}/4
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(action.level / 4) * 100}
          sx={{
            height: 6,
            borderRadius: 'var(--md-sys-shape-corner-full)',
            bgcolor: 'var(--md-sys-color-surface-container)',
            '& .MuiLinearProgress-bar': {
              bgcolor: action.color,
              borderRadius: 'var(--md-sys-shape-corner-full)',
            },
          }}
        />
      </Box>

      {/* CTA */}
      <Button
        variant="contained"
        size="small"
        endIcon={<ArrowForwardIcon />}
        onClick={onCta}
        aria-label={action.cta}
        sx={{
          bgcolor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          borderRadius: 'var(--md-sys-shape-corner-full)',
          alignSelf: 'flex-start',
        }}
      >
        {action.cta}
      </Button>

      {/* Step indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 'var(--md-sys-spacing-1)' }} aria-hidden="true">
        {DEMO_ACTIONS.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: i === actionIndex ? 20 : 8,
              height: 4,
              borderRadius: 2,
              bgcolor: i === actionIndex
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-outline-variant)',
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  </Fade>
);

// ── Root widget ───────────────────────────────────────────────────────────────

const CopilotDemoWidget: React.FC = () => {
  const [phase, setPhase] = useState<'idle' | 'fab-visible' | 'overlay-open'>('idle');
  const [actionIndex, setActionIndex] = useState(0);
  const [pulsing, setPulsing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Auto-start sequence
  useEffect(() => {
    // Show FAB after 1.5s
    timerRef.current = setTimeout(() => {
      setPhase('fab-visible');
      setPulsing(true);
    }, 1500);
    return clearTimer;
  }, [clearTimer]);

  const handleFabClick = useCallback(() => {
    clearTimer();
    setPhase('overlay-open');
    setPulsing(false);
  }, [clearTimer]);

  const handleClose = useCallback(() => {
    setPhase('fab-visible');
    setPulsing(true);
  }, []);

  const handleCta = useCallback(() => {
    // Cycle to next demo action
    const next = (actionIndex + 1) % DEMO_ACTIONS.length;
    setActionIndex(next);
    setPulsing(true);
    setPhase('fab-visible');
    // Auto-open again after 1s to show continuity
    timerRef.current = setTimeout(() => {
      setPulsing(true);
    }, 400);
  }, [actionIndex]);

  // Restart after 8s idle if overlay never opened
  useEffect(() => {
    if (phase === 'fab-visible') {
      timerRef.current = setTimeout(() => {
        setPhase('overlay-open');
        setPulsing(false);
      }, 5000);
      return clearTimer;
    }
  }, [phase, clearTimer]);

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        overflow: 'hidden',
      }}
    >
      <FakeAppScreen />

      <FloatingButton
        visible={phase === 'fab-visible' || phase === 'overlay-open'}
        pulsing={pulsing && phase === 'fab-visible'}
        onClick={handleFabClick}
      />

      <OverlayPanel
        visible={phase === 'overlay-open'}
        action={DEMO_ACTIONS[actionIndex]}
        actionIndex={actionIndex}
        onClose={handleClose}
        onCta={handleCta}
      />

      {/* Initial hint */}
      <Fade in={phase === 'idle'} timeout={600}>
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.04)',
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
        }}>
          <Typography
            variant="labelMedium"
            sx={{
              color: 'var(--md-sys-color-on-surface-variant)',
              opacity: 0.5,
              letterSpacing: 1,
            }}
          >
            caricamento demo…
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default memo(CopilotDemoWidget);
