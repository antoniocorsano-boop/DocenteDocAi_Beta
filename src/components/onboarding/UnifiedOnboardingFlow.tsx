/**
 * UnifiedOnboardingFlow.tsx
 *
 * Percorso unico di benvenuto — sostituisce la cascata di 3 gate separati
 * (PrivacyConsentModal → SovereigntyOnboarding → PilotaOnboardingModal)
 * con un singolo flusso progressivo di 4 step:
 *
 *   0 · Benvenuto         — hook emotivo, nessuna frizione
 *   1 · Come funziono     — 3 card adattive (sistema emotivo, stile, privacy locale)
 *   2 · Modalità AI       — scelta operativa (offline / assistiva / autonoma)
 *   3 · Privacy & Consenso — GDPR art. 13 (obbligatorio, ora contestuale)
 *
 * Tutte le chiavi localStorage esistenti sono preservate per backward compat:
 *   privacy_consent_v1, sovereignty_config_v1, pilot_onboarding_v1
 *
 * MD3 Gold Compliant: M3Surface, token MD3, nessun valore tipografico inline,
 * ogni elemento interattivo ha aria-label.
 */

import React, { useState } from 'react';
import Box               from '@mui/material/Box';
import Button            from '@mui/material/Button';
import Checkbox          from '@mui/material/Checkbox';
import FormControlLabel  from '@mui/material/FormControlLabel';
import IconButton        from '@mui/material/IconButton';
import LinearProgress    from '@mui/material/LinearProgress';
import Radio             from '@mui/material/Radio';
import RadioGroup        from '@mui/material/RadioGroup';
import Stack             from '@mui/material/Stack';
import Typography        from '@mui/material/Typography';
import ArrowBackIcon           from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon        from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon         from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon  from '@mui/icons-material/CheckCircleOutline';
import ShieldOutlinedIcon      from '@mui/icons-material/ShieldOutlined';
import M3Surface         from '../ui/M3Surface';
import { recordConsent }       from '../PrivacyConsentModal';
import { useSovereigntyStore } from '../../stores/useSovereigntyStore';
import TermsOfUseModal         from '../TermsOfUseModal';
import type { SystemMode }     from '../../types/sovereignty.types';

// ─── LocalStorage key (pilot intro) ──────────────────────────────────────────

const PILOT_KEY = 'pilot_onboarding_v1';

// ─── Step count ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

// ─── Feature cards (da PilotaOnboardingModal, integrate nel percorso) ─────────

const FEATURES: Array<{ icon: string; title: string; desc: string }> = [
  {
    icon:  '🧠',
    title: 'Sistema emotivo adattivo',
    desc:  'Ad ogni messaggio rileva il tuo stato cognitivo — focus, carico, esplorazione — e modula tono, struttura e profondità delle risposte in tempo reale.',
  },
  {
    icon:  '📈',
    title: 'Stile di lavoro personalizzato',
    desc:  'Con il tempo impara le tue preferenze: quanto dettaglio vuoi, quanto esplorazione, quanto controllo. Il sistema si affina ad ogni interazione.',
  },
  {
    icon:  '🔒',
    title: 'Tutto resta sul tuo dispositivo',
    desc:  'Il tuo profilo cognitivo e lo stile adattivo sono salvati solo in locale. Nessun dato di preferenza viene inviato a server esterni. Puoi resettare in qualsiasi momento.',
  },
];

// ─── Opzioni modalità AI (semplificato da SovereigntyOnboarding) ──────────────

const MODE_OPTIONS: Array<{
  value:  SystemMode;
  emoji:  string;
  label:  string;
  desc:   string;
}> = [
  {
    value: 'offline_only',
    emoji: '⚡',
    label: 'Solo locale, senza AI',
    desc:  'Tutte le funzionalità base disponibili. Nessuna chiamata AI. Raccomandato per ambienti PA con restrizioni normative.',
  },
  {
    value: 'assistive_ai',
    emoji: '🤝',
    label: 'AI assistiva (bilanciata)',
    desc:  "L'AI suggerisce, tu decidi. Ogni azione AI richiede la tua approvazione. Bilanciamento ottimale fra controllo e produttività.",
  },
  {
    value: 'autonomous_ai',
    emoji: '🚀',
    label: 'AI autonoma (avanzata)',
    desc:  "L'AI può eseguire azioni a bassa priorità entro i limiti definiti. Azioni critiche richiedono sempre la tua approvazione.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface UnifiedOnboardingFlowProps {
  /** Chiamato al termine del percorso — aggiorna tutti e 3 i gate in AppWithConsent. */
  onComplete: () => void;
}

export default function UnifiedOnboardingFlow({ onComplete }: UnifiedOnboardingFlowProps): React.ReactElement {
  const [step,         setStep]         = useState(0);
  const [aiMode,       setAiMode]       = useState<SystemMode>('assistive_ai');
  const [checkedInfo,  setCheckedInfo]  = useState(false);
  const [checkedTreat, setCheckedTreat] = useState(false);
  const [showTerms,    setShowTerms]    = useState(false);

  const { setMode, recordConsentUpdate, updatePersonalization } = useSovereigntyStore();

  const canAccept = checkedInfo && checkedTreat;

  // Progresso visivo: step 0 = barra assente, step 1-3 = 33%/66%/100%
  const progressValue = step === 0 ? 0 : Math.round((step / (TOTAL_STEPS - 1)) * 100);

  const handleBack = () => setStep((s) => Math.max(0, s - 1));
  const handleNext = () => setStep((s) => s + 1);

  const handleFinish = () => {
    // 1. Modalità AI + consenso sovranità
    setMode(aiMode);
    updatePersonalization({ adaptiveLearning: true });
    recordConsentUpdate();
    // 2. Consenso GDPR
    recordConsent();
    // 3. Flag intro pilota
    try { localStorage.setItem(PILOT_KEY, 'done'); } catch { /* localStorage non disponibile */ }
    // 4. Restituisce controllo ad AppWithConsent
    onComplete();
  };

  return (
    <Box
      role="main"
      aria-label="Percorso di benvenuto DocenteDoc AI"
      sx={{
        minHeight:      '100dvh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        bgcolor:        'var(--md-sys-color-surface)',
        p:              'var(--md-sys-spacing-4)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520 }}>

        {/* ── Barra di progresso (visibile da step 1) ─────────────────── */}
        {step > 0 && (
          <LinearProgress
            variant="determinate"
            value={progressValue}
            aria-label={`Percorso onboarding: step ${step + 1} di ${TOTAL_STEPS}`}
            sx={{ borderRadius: 4, height: 4, mb: 'var(--md-sys-spacing-3)' }}
          />
        )}

        {/* ── Pulsante Indietro (visibile da step 1) ────────────────────── */}
        {step > 0 && (
          <Box sx={{ mb: 'var(--md-sys-spacing-2)' }}>
            <IconButton
              aria-label="Torna al passo precedente"
              onClick={handleBack}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 0 — Benvenuto
        ════════════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <M3Surface
            elevation={1}
            sx={{
              p:            'var(--md-sys-spacing-6)',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
              textAlign:    'center',
            }}
          >
            <Box sx={{ mb: 'var(--md-sys-spacing-4)' }}>
              <AutoAwesomeIcon
                sx={{
                  fontSize: 'var(--md-sys-icon-size-2xl)',
                  color:    'var(--md-sys-color-primary)',
                }}
                aria-hidden="true"
              />
            </Box>

            <Typography
              variant="headlineLarge"
              component="h1"
              sx={{ mb: 'var(--md-sys-spacing-3)', color: 'var(--md-sys-color-on-surface)' }}
            >
              Ciao, benvenuto!
            </Typography>

            <Typography
              variant="bodyLarge"
              sx={{ mb: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}
            >
              Sono <strong>DocenteDoc AI</strong> — il tuo assistente intelligente per la didattica.
            </Typography>

            <Typography
              variant="bodyMedium"
              sx={{ mb: 'var(--md-sys-spacing-6)', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              Imparo dal tuo stile di lavoro e mi adatto a te. In 2 minuti configuriamo tutto insieme.
            </Typography>

            <Button
              variant="contained"
              size="large"
              fullWidth
              endIcon={<ArrowForwardIcon />}
              aria-label="Inizia il percorso di configurazione"
              onClick={handleNext}
            >
              Inizia il percorso
            </Button>
          </M3Surface>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 1 — Come funziono
        ════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <M3Surface
            elevation={1}
            sx={{
              p:            'var(--md-sys-spacing-6)',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            }}
          >
            <Typography
              variant="headlineMedium"
              component="h2"
              sx={{ mb: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}
            >
              Come funziono
            </Typography>

            <Typography
              variant="bodyMedium"
              sx={{ mb: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              Tre caratteristiche che mi rendono diverso dai normali assistenti:
            </Typography>

            <Stack spacing="var(--md-sys-spacing-3)" sx={{ mb: 'var(--md-sys-spacing-5)' }}>
              {FEATURES.map((f) => (
                <M3Surface
                  key={f.title}
                  elevation={0}
                  sx={{
                    p:       'var(--md-sys-spacing-3)',
                    borderRadius: 'var(--md-sys-shape-corner-large)',
                    bgcolor: 'var(--md-sys-color-surface-container)',
                  }}
                >
                  <Stack direction="row" spacing="var(--md-sys-spacing-3)" alignItems="flex-start">
                    <Typography
                      variant="headlineSmall"
                      aria-hidden="true"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {f.icon}
                    </Typography>
                    <Box>
                      <Typography variant="titleSmall" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                        {f.title}
                      </Typography>
                      <Typography
                        variant="bodySmall"
                        sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-1)' }}
                      >
                        {f.desc}
                      </Typography>
                    </Box>
                  </Stack>
                </M3Surface>
              ))}
            </Stack>

            <Button
              variant="contained"
              size="large"
              fullWidth
              endIcon={<ArrowForwardIcon />}
              aria-label="Vai al passo successivo"
              onClick={handleNext}
            >
              Perfetto, avanti
            </Button>
          </M3Surface>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2 — Modalità AI
        ════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <M3Surface
            elevation={1}
            sx={{
              p:            'var(--md-sys-spacing-6)',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            }}
          >
            <Typography
              variant="headlineMedium"
              component="h2"
              sx={{ mb: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}
            >
              Come preferisci lavorare?
            </Typography>

            <Typography
              variant="bodyMedium"
              sx={{ mb: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              Puoi cambiare questa scelta in qualsiasi momento dalle Impostazioni.
            </Typography>

            <RadioGroup
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value as SystemMode)}
              aria-label="Seleziona la modalità operativa AI"
            >
              <Stack spacing="var(--md-sys-spacing-2)" sx={{ mb: 'var(--md-sys-spacing-5)' }}>
                {MODE_OPTIONS.map((opt) => (
                  <Box
                    key={opt.value}
                    component="label"
                    htmlFor={`ai-mode-${opt.value}`}
                    sx={{
                      display:      'block',
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      border:       '2px solid',
                      borderColor:  aiMode === opt.value
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-outline-variant)',
                      bgcolor: aiMode === opt.value
                        ? 'var(--md-sys-color-primary-container)'
                        : 'var(--md-sys-color-surface-container)',
                      p:       'var(--md-sys-spacing-3)',
                      cursor:  'pointer',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    }}
                  >
                    <Stack direction="row" spacing="var(--md-sys-spacing-3)" alignItems="flex-start">
                      <Radio
                        id={`ai-mode-${opt.value}`}
                        value={opt.value}
                        aria-label={opt.label}
                        sx={{ p: 0, mt: 'var(--md-sys-spacing-1)' }}
                      />
                      <Box>
                        <Typography
                          variant="titleSmall"
                          sx={{ color: 'var(--md-sys-color-on-surface)' }}
                        >
                          {opt.emoji}{' '}{opt.label}
                        </Typography>
                        <Typography
                          variant="bodySmall"
                          sx={{
                            color: 'var(--md-sys-color-on-surface-variant)',
                            mt:    'var(--md-sys-spacing-1)',
                          }}
                        >
                          {opt.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>

            <Button
              variant="contained"
              size="large"
              fullWidth
              endIcon={<ArrowForwardIcon />}
              aria-label="Vai al passo successivo"
              onClick={handleNext}
            >
              Continua
            </Button>
          </M3Surface>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3 — Privacy & Consenso GDPR
        ════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <M3Surface
            elevation={1}
            sx={{
              p:            'var(--md-sys-spacing-6)',
              borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            }}
          >
            <Box sx={{ mb: 'var(--md-sys-spacing-3)', textAlign: 'center' }}>
              <ShieldOutlinedIcon
                sx={{
                  fontSize: 'var(--md-sys-icon-size-xl)',
                  color:    'var(--md-sys-color-primary)',
                }}
                aria-hidden="true"
              />
            </Box>

            <Typography
              variant="headlineMedium"
              component="h2"
              sx={{ mb: 'var(--md-sys-spacing-2)', color: 'var(--md-sys-color-on-surface)' }}
            >
              Un ultimo passaggio
            </Typography>

            <Typography
              variant="bodyMedium"
              sx={{ mb: 'var(--md-sys-spacing-5)', color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              Prima di aprire il tuo spazio di lavoro, è richiesto il consenso al trattamento dei dati
              (GDPR art. 13). I tuoi dati non vengono condivisi con terze parti.
            </Typography>

            <Stack spacing="var(--md-sys-spacing-3)" sx={{ mb: 'var(--md-sys-spacing-5)' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checkedInfo}
                    onChange={(e) => setCheckedInfo(e.target.checked)}
                    inputProps={{ 'aria-required': 'true' }}
                  />
                }
                label={
                  <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Ho letto l'informativa sulla privacy e acconsento al trattamento dei dati personali
                    ai sensi del GDPR.{' '}
                    <Button
                      variant="text"
                      size="small"
                      aria-label="Leggi i termini e le condizioni"
                      onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                      sx={{
                        p:             0,
                        minWidth:      'unset',
                        verticalAlign: 'baseline',
                        textTransform: 'none',
                        fontSize:      'inherit',
                        lineHeight:    'inherit',
                      }}
                    >
                      Leggi i termini
                    </Button>
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={checkedTreat}
                    onChange={(e) => setCheckedTreat(e.target.checked)}
                    inputProps={{ 'aria-required': 'true' }}
                  />
                }
                label={
                  <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Acconsento al trattamento dei dati per il funzionamento del sistema adattivo
                    (archiviazione locale, nessuna trasmissione a terzi).
                  </Typography>
                }
              />
            </Stack>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!canAccept}
              endIcon={<CheckCircleOutlineIcon />}
              aria-label="Accetta e inizia a usare DocenteDoc AI"
              onClick={handleFinish}
            >
              Accetto e inizia
            </Button>
          </M3Surface>
        )}

      </Box>

      {/* Modal termini — sempre montato fuori dalla card per non rompere il layout */}
      {showTerms && (
        <TermsOfUseModal
          open
          onClose={() => setShowTerms(false)}
        />
      )}
    </Box>
  );
}
