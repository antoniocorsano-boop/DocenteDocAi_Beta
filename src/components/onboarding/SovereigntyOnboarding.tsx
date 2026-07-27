/**
 * SovereigntyOnboarding.tsx — 4-step Sovereignty Configuration Wizard.
 *
 * Blocking dialog shown (after PrivacyConsentModal) when the user has not yet
 * configured their sovereignty settings.  Not closeable via ESC or backdrop click.
 *
 * Steps:
 *   1. Modalità operativa  — choose offline_only / assistive_ai / autonomous_ai
 *   2. Consenso dati       — toggle telemetry / audit / openData
 *   3. Personalizzazione   — toggle localOnly / adaptiveLearning
 *   4. Trasparenza         — read-only recap of AI behaviour + what is saved
 *
 * MD3 Gold Compliant: M3Surface, MD3 spacing tokens, no inline font values,
 * every interactive element has aria-label.
 */

import React, { useState } from 'react';
import Box            from '@mui/material/Box';
import Button         from '@mui/material/Button';
import Chip           from '@mui/material/Chip';
import Dialog         from '@mui/material/Dialog';
import DialogActions  from '@mui/material/DialogActions';
import DialogContent  from '@mui/material/DialogContent';
import DialogTitle    from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio          from '@mui/material/Radio';
import RadioGroup     from '@mui/material/RadioGroup';
import Stack          from '@mui/material/Stack';
import Step           from '@mui/material/Step';
import StepLabel      from '@mui/material/StepLabel';
import Stepper        from '@mui/material/Stepper';
import Switch         from '@mui/material/Switch';
import Typography     from '@mui/material/Typography';
import M3Surface      from '../ui/M3Surface';
import { useSovereigntyStore } from '../../stores/useSovereigntyStore';
import type { SystemMode } from '../../types/sovereignty.types';

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEPS = [
  'Modalità operativa',
  'Consenso dati',
  'Personalizzazione',
  'Trasparenza',
];

// ─── Mode options ─────────────────────────────────────────────────────────────

const MODE_OPTIONS: Array<{
  value:         SystemMode;
  label:         string;
  desc:          string;
  paRecommended: boolean;
}> = [
  {
    value:         'offline_only',
    label:         'Solo locale, senza AI',
    desc:          'Tutte le funzionalità base disponibili. Nessuna chiamata AI. Raccomandato per ambienti PA con restrizioni normative.',
    paRecommended: true,
  },
  {
    value:         'assistive_ai',
    label:         'AI assistiva (bilanciata)',
    desc:          "L'AI suggerisce, tu decidi. Ogni azione AI richiede la tua approvazione esplicita. Bilanciamento ottimale controllo/produttività.",
    paRecommended: false,
  },
  {
    value:         'autonomous_ai',
    label:         'AI autonoma (avanzata)',
    desc:          "L'AI può eseguire azioni a bassa priorità entro i limiti definiti. Azioni ad alto rischio richiedono sempre approvazione.",
    paRecommended: false,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface SovereigntyOnboardingProps {
  /** Called when the user saves their configuration (last step CTA). */
  onCompleted: () => void;
}

const SovereigntyOnboarding: React.FC<SovereigntyOnboardingProps> = ({ onCompleted }) => {
  const [step, setStep] = useState(0);
  const {
    config,
    setMode,
    setAiEnabled,
    updateDataSharing,
    updatePersonalization,
    recordConsentUpdate,
  } = useSovereigntyStore();

  const isLastStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setStep((s) => s + 1);
    } else {
      recordConsentUpdate();
      onCompleted();
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  return (
    <Dialog
      open
      disableEscapeKeyDown
      aria-labelledby="sovereignty-onboarding-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          p: 1,
        },
      }}
    >
      <DialogTitle id="sovereignty-onboarding-title">
        <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-2)">
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{ color: 'var(--md-sys-color-primary)', fontSize: 'var(--md-sys-icon-size-lg)' }}
          >
            shield_lock
          </Box>
          <Typography variant="titleLarge" component="span">
            Configurazione Sovranità Operativa
          </Typography>
        </Stack>
        <Typography
          variant="bodySmall"
          sx={{ color: 'var(--md-sys-color-on-surface-variant)', mt: 'var(--md-sys-spacing-1)', display: 'block' }}
        >
          Stabilisci come il sistema opera e quali dati gestisce.
          Puoi modificare queste impostazioni in qualsiasi momento da Pannello Governance.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack gap="var(--md-sys-spacing-4)">
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* ── Step 0: Modalità operativa ── */}
          {step === 0 && (
            <Stack gap="var(--md-sys-spacing-3)">
              <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Scegli il livello di coinvolgimento dell'AI nel sistema.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={config.aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    aria-label={config.aiEnabled ? 'Disabilita AI — passa a modalità solo locale' : 'Abilita funzionalità AI'}
                  />
                }
                label={
                  <Typography variant="labelMedium">
                    {config.aiEnabled ? 'Funzionalità AI abilitate' : 'AI disabilitata — solo locale'}
                  </Typography>
                }
              />

              <RadioGroup
                value={config.mode}
                onChange={(e) => setMode(e.target.value as SystemMode)}
                aria-label="Seleziona modalità operativa del sistema"
              >
                {MODE_OPTIONS.map((opt) => {
                  const isDisabled = !config.aiEnabled && opt.value !== 'offline_only';
                  return (
                    <M3Surface
                      key={opt.value}
                      elevation={0}
                      sx={{
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        p: 'var(--md-sys-spacing-3)',
                        mb: 'var(--md-sys-spacing-2)',
                        border: config.mode === opt.value
                          ? '2px solid var(--md-sys-color-primary)'
                          : '1px solid var(--md-sys-color-outline-variant)',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.45 : 1,
                      }}
                      onClick={() => { if (!isDisabled) setMode(opt.value); }}
                    >
                      <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)">
                        <Radio
                          value={opt.value}
                          disabled={isDisabled}
                          inputProps={{ 'aria-label': `Seleziona modalità: ${opt.label}` }}
                          sx={{ mt: -0.5, flexShrink: 0 }}
                        />
                        <Stack flex={1} gap="var(--md-sys-spacing-1)">
                          <Stack direction="row" alignItems="center" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
                            <Typography variant="labelMedium">{opt.label}</Typography>
                            {opt.paRecommended && (
                              <Chip
                                label="Raccomandato PA"
                                size="small"
                                sx={{
                                  bgcolor: 'var(--md-sys-color-secondary-container)',
                                  color:   'var(--md-sys-color-on-secondary-container)',
                                  fontSize: 'var(--md-sys-typescale-label-small-font-size)',
                                  height:  20,
                                }}
                              />
                            )}
                          </Stack>
                          <Typography
                            variant="bodySmall"
                            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                          >
                            {opt.desc}
                          </Typography>
                        </Stack>
                      </Stack>
                    </M3Surface>
                  );
                })}
              </RadioGroup>
            </Stack>
          )}

          {/* ── Step 1: Consenso dati ── */}
          {step === 1 && (
            <Stack gap="var(--md-sys-spacing-3)">
              <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Scegli quali tipologie di dati possono essere registrate.
                Ogni opzione rispetta il principio GDPR di minimizzazione dei dati (Art. 5(1)(c)).
              </Typography>
              {([
                {
                  key:   'telemetry' as const,
                  label: 'Telemetria di utilizzo',
                  desc:  'Statistiche interne sugli Use Case (frequenza, outcome compliance). Nessun dato personale.',
                },
                {
                  key:   'audit' as const,
                  label: 'Log di audit compliance',
                  desc:  'Registra le attività di compliance nel log di sistema. Raccomandato per tracciabilità PA (AgID + AI Act Art. 17).',
                },
                {
                  key:   'openData' as const,
                  label: 'Pubblicazione open data',
                  desc:  'Contribuisce a statistiche aggregate anonimizzate in formato DCAT-AP_IT. Nessun dato identificativo.',
                },
              ] as const).map((item) => (
                <M3Surface
                  key={item.key}
                  elevation={0}
                  sx={{
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    p: 'var(--md-sys-spacing-3)',
                    bgcolor: 'var(--md-sys-color-surface-variant)',
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)">
                    <Switch
                      checked={config.dataSharing[item.key]}
                      onChange={(e) => updateDataSharing({ [item.key]: e.target.checked })}
                      aria-label={item.label}
                      sx={{ flexShrink: 0, mt: -0.5 }}
                    />
                    <Stack gap="var(--md-sys-spacing-1)">
                      <Typography variant="labelMedium">{item.label}</Typography>
                      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {item.desc}
                      </Typography>
                    </Stack>
                  </Stack>
                </M3Surface>
              ))}
            </Stack>
          )}

          {/* ── Step 2: Personalizzazione ── */}
          {step === 2 && (
            <Stack gap="var(--md-sys-spacing-3)">
              <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Configura come il sistema apprende dalle tue interazioni.
              </Typography>
              {([
                {
                  key:   'localOnly' as const,
                  label: 'Solo locale',
                  desc:  'Il profilo di personalizzazione resta nel browser. Nessuna sincronizzazione esterna. Raccomandato per privacy massima.',
                },
                {
                  key:   'adaptiveLearning' as const,
                  label: 'Apprendimento adattivo',
                  desc:  "Il sistema impara dalle tue scelte (azioni eseguite o ignorate) per migliorare i suggerimenti nel tempo.",
                },
              ] as const).map((item) => (
                <M3Surface
                  key={item.key}
                  elevation={0}
                  sx={{
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    p: 'var(--md-sys-spacing-3)',
                    bgcolor: 'var(--md-sys-color-surface-variant)',
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" gap="var(--md-sys-spacing-2)">
                    <Switch
                      checked={config.personalization[item.key]}
                      onChange={(e) => updatePersonalization({ [item.key]: e.target.checked })}
                      aria-label={item.label}
                      sx={{ flexShrink: 0, mt: -0.5 }}
                    />
                    <Stack gap="var(--md-sys-spacing-1)">
                      <Typography variant="labelMedium">{item.label}</Typography>
                      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {item.desc}
                      </Typography>
                    </Stack>
                  </Stack>
                </M3Surface>
              ))}
            </Stack>
          )}

          {/* ── Step 3: Trasparenza ── */}
          {step === 3 && (
            <Stack gap="var(--md-sys-spacing-3)">
              <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Riepilogo della tua configurazione e di come il sistema AI opererà.
              </Typography>

              {/* Recap chips */}
              <M3Surface
                elevation={0}
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  p: 'var(--md-sys-spacing-3)',
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                }}
              >
                <Stack gap="var(--md-sys-spacing-2)">
                  <Typography variant="labelMedium">La tua configurazione</Typography>
                  <Stack direction="row" gap="var(--md-sys-spacing-1)" flexWrap="wrap">
                    <Chip
                      label={`Modalità: ${
                        config.mode === 'offline_only'  ? 'Solo locale' :
                        config.mode === 'assistive_ai'  ? 'AI assistiva' :
                                                          'AI autonoma'
                      }`}
                      size="small"
                      sx={{
                        bgcolor: 'var(--md-sys-color-primary-container)',
                        color:   'var(--md-sys-color-on-primary-container)',
                      }}
                    />
                    <Chip
                      label={config.aiEnabled ? 'AI abilitata' : 'AI disabilitata'}
                      size="small"
                      sx={{
                        bgcolor: config.aiEnabled
                          ? 'var(--md-sys-color-secondary-container)'
                          : 'var(--md-sys-color-error-container)',
                        color: config.aiEnabled
                          ? 'var(--md-sys-color-on-secondary-container)'
                          : 'var(--md-sys-color-on-error-container)',
                      }}
                    />
                  </Stack>
                </Stack>
              </M3Surface>

              {/* What the AI does */}
              <M3Surface
                elevation={0}
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  p: 'var(--md-sys-spacing-3)',
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                }}
              >
                <Stack gap="var(--md-sys-spacing-2)">
                  <Typography variant="labelMedium">Come funziona il sistema AI</Typography>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    • Analizza il contesto didattico (studenti, UDA, valutazioni) per suggerire azioni rilevanti.
                  </Typography>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    • Interviene solo quando lo hai autorizzato — mai in background senza che tu lo sappia.
                  </Typography>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    • In modalità <strong>assistiva</strong>, ogni azione AI richiede la tua approvazione esplicita
                    prima di essere eseguita.
                  </Typography>
                </Stack>
              </M3Surface>

              {/* What is saved */}
              <M3Surface
                elevation={0}
                sx={{
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  p: 'var(--md-sys-spacing-3)',
                  bgcolor: 'var(--md-sys-color-surface-variant)',
                }}
              >
                <Stack gap="var(--md-sys-spacing-2)">
                  <Typography variant="labelMedium">Cosa viene salvato</Typography>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    • Dati studenti, UDA, valutazioni: <strong>solo nel browser, mai inviati a server esterni.</strong>
                  </Typography>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    • Testo libero all'AI: inviato in forma pseudonimizzata all'API Gemini/Anthropic tramite proxy sicuro.
                  </Typography>
                  <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    • Puoi modificare questa configurazione in qualsiasi momento da{' '}
                    <strong>Pannello Governance → Controllo AI e Dati.</strong>
                  </Typography>
                </Stack>
              </M3Surface>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 'var(--md-sys-spacing-2)', flexWrap: 'wrap' }}>
        {step > 0 && (
          <Button
            variant="text"
            onClick={handleBack}
            aria-label="Torna al passo precedente"
            sx={{ mr: 'auto', textTransform: 'none' }}
          >
            Indietro
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleNext}
          aria-label={
            isLastStep
              ? 'Salva la configurazione sovranità e continua'
              : 'Vai al passo successivo'
          }
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-full)',
            textTransform: 'none',
            px: 3,
          }}
        >
          {isLastStep ? 'Salva e continua' : 'Avanti'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SovereigntyOnboarding;
