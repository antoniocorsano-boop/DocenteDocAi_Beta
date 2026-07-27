/**
 * TeacherOnboardingModal.tsx — Wizard di onboarding a 3 step.
 *
 * Step 1 — Welcome + pulsante "Carica dati demo"
 * Step 2 — Upload CSV studenti e/o lezioni (opzionale)
 * Step 3 — Conferma e chiusura
 *
 * Persistenza: flag 'docente_onboarding_v1' in localStorage.
 * Riattivabile cancellando il flag.
 * MD3 Gold Compliant.
 */
import React, { useCallback, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import MobileStepper from '@mui/material/MobileStepper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useAcademicStore }  from '../../stores/useAcademicStore';
import { useStudentStore }   from '../../stores/useStudentStore';
import {
  MOCK_LESSONS,
  MOCK_STUDENTS,
  MOCK_EVALUATIONS,
  MOCK_SLOTS,
} from './mockTeacherData';
import { parseStudentsCsv, parseLessonsCsv } from './csvImporter';

export const ONBOARDING_KEY = 'docente_onboarding_v1';

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

interface CsvUploadFieldProps {
  label:     string;
  accept:    string;
  onParsed:  (text: string) => void;
  hint:      string;
}

const CsvUploadField: React.FC<CsvUploadFieldProps> = ({
  label,
  accept,
  onParsed,
  hint,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string') onParsed(text);
      };
      reader.readAsText(file, 'UTF-8');
    },
    [onParsed]
  );

  return (
    <Box>
      <Typography
        variant="labelMedium"
        sx={{ color: tok('on-surface'), display: 'block', mb: 'var(--md-sys-spacing-1)' }}
      >
        {label}
      </Typography>
      <Typography
        variant="bodySmall"
        sx={{ color: tok('on-surface-variant'), mb: 'var(--md-sys-spacing-2)', display: 'block' }}
      >
        {hint}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<UploadFileOutlinedIcon aria-hidden />}
        onClick={() => inputRef.current?.click()}
        aria-label={`Seleziona file ${label}`}
        sx={{
          borderColor: tok('outline'),
          color:       tok('primary'),
          fontWeight:  'var(--md-sys-typescale-weight-semibold)',
        }}
      >
        {fileName ?? 'Scegli file .csv'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </Box>
  );
};

// ── Step content ──────────────────────────────────────────────────────────────

const STEPS = ['Benvenuto', 'Importa dati', 'Tutto pronto!'];

export interface TeacherOnboardingModalProps {
  open:    boolean;
  onClose: () => void;
}

const TeacherOnboardingModal: React.FC<TeacherOnboardingModalProps> = ({
  open,
  onClose,
}) => {
  const [step, setStep]             = useState(0);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const setLessons  = useAcademicStore((s) => s.actions.setLessons);
  const setSlots    = useAcademicStore((s) => s.actions.setSlots);
  const setStudents = useStudentStore((s)  => s.actions.setStudents);
  const setEvaluations = useStudentStore((s) => s.actions.setEvaluations);

  // ── Demo data ──────────────────────────────────────────────────────────────

  const handleLoadDemo = useCallback(() => {
    const lessonsMap: Record<string, typeof MOCK_LESSONS[number]> = {};
    MOCK_LESSONS.forEach((l) => { lessonsMap[l.id] = l; });
    setLessons(lessonsMap);
    setSlots(MOCK_SLOTS);
    setStudents(MOCK_STUDENTS);
    setEvaluations(MOCK_EVALUATIONS);
    setDemoLoaded(true);
  }, [setLessons, setSlots, setStudents, setEvaluations]);

  // ── CSV parsers ────────────────────────────────────────────────────────────

  const handleStudentsCsv = useCallback(
    (raw: string) => {
      const parsed = parseStudentsCsv(raw);
      if (parsed.length > 0) setStudents(parsed);
    },
    [setStudents]
  );

  const handleLessonsCsv = useCallback(
    (raw: string) => {
      const parsed = parseLessonsCsv(raw);
      if (parsed.length === 0) return;
      const map: Record<string, (typeof parsed)[number]> = {};
      parsed.forEach((l) => { map[l.id] = l; });
      setLessons(map);
    },
    [setLessons]
  );

  // ── Confirm ────────────────────────────────────────────────────────────────

  const handleConfirm = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'done');
    onClose();
  }, [onClose]);

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  // ── Render steps ───────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <Stack spacing={3} alignItems="center" py={2}>
      <Box
        component="span"
        className="material-symbols-outlined"
        aria-hidden="true"
        sx={{ fontSize: 56, color: tok('primary'), fontVariationSettings: '"FILL" 1' }}
      >
        school
      </Box>
      <Box textAlign="center">
        <Typography
          variant="headlineSmall"
          sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-bold)', mb: 1 }}
        >
          Benvenuto nella Dashboard Docente
        </Typography>
        <Typography variant="bodyMedium" sx={{ color: tok('on-surface-variant') }}>
          Visualizza orario, classi, raccomandazioni AI, consiglio di classe e molto altro
          in un'unica schermata personalizzata.
        </Typography>
      </Box>
      <Button
        variant="contained"
        onClick={() => { handleLoadDemo(); handleNext(); }}
        aria-label="Carica dati dimostrativi"
        sx={{
          bgcolor:    tok('primary'),
          color:      tok('on-primary'),
          fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          px:         'var(--md-sys-spacing-5)',
          '&:hover':  { bgcolor: tok('primary') },
        }}
      >
        {demoLoaded ? '✓ Demo caricato' : 'Carica dati demo'}
      </Button>
      <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
        oppure importa i tuoi dati nel passo successivo
      </Typography>
    </Stack>
  );

  const renderStep1 = () => (
    <Stack spacing={3} py={1}>
      <Typography
        variant="titleMedium"
        sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
      >
        Importa dati (opzionale)
      </Typography>
      <Typography variant="bodySmall" sx={{ color: tok('on-surface-variant') }}>
        Carica un file CSV per popolare studenti e lezioni. Puoi saltare questo passo e
        inserire i dati successivamente dalle sezioni dedicate.
      </Typography>
      <CsvUploadField
        label="Studenti CSV"
        accept=".csv,text/csv"
        onParsed={handleStudentsCsv}
        hint="Colonne attese: cognome, nome, classe, dataNascita, hasDSA, hasBES, has104"
      />
      <Divider />
      <CsvUploadField
        label="Lezioni CSV"
        accept=".csv,text/csv"
        onParsed={handleLessonsCsv}
        hint="Colonne attese: classe, materia, contenuto, data, tipoLezione, svolta, obiettivi, unitaDiApprendimento"
      />
    </Stack>
  );

  const renderStep2 = () => (
    <Stack spacing={3} alignItems="center" py={2}>
      <CheckCircleOutlineIcon
        sx={{ fontSize: 56, color: tok('tertiary') }}
        aria-hidden
      />
      <Box textAlign="center">
        <Typography
          variant="headlineSmall"
          sx={{ color: tok('on-surface'), fontWeight: 'var(--md-sys-typescale-weight-bold)', mb: 1 }}
        >
          Tutto pronto!
        </Typography>
        <Typography variant="bodyMedium" sx={{ color: tok('on-surface-variant') }}>
          La Dashboard Docente è configurata. Puoi riaprire questo wizard cancellando
          il flag <em>docente_onboarding_v1</em> da localStorage.
        </Typography>
      </Box>
    </Stack>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="onboarding-title"
      slotProps={{
        paper: {
          sx: {
            bgcolor:      tok('surface-container'),
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            p:            'var(--md-sys-spacing-2)',
          },
        },
      }}
    >
      <DialogContent>
        <Typography
          id="onboarding-title"
          variant="labelLarge"
          sx={{
            color:      tok('primary'),
            textAlign:  'center',
            display:    'block',
            mb:         'var(--md-sys-spacing-2)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          }}
        >
          {STEPS[step]}
        </Typography>

        {stepContent[step]?.()}

        <MobileStepper
          variant="dots"
          steps={STEPS.length}
          position="static"
          activeStep={step}
          sx={{
            bgcolor:        'transparent',
            justifyContent: 'center',
            mt:             'var(--md-sys-spacing-3)',
            '& .MuiMobileStepper-dot': { bgcolor: tok('outline-variant') },
            '& .MuiMobileStepper-dotActive': { bgcolor: tok('primary') },
          }}
          nextButton={
            step < STEPS.length - 1 ? (
              <Button
                size="small"
                onClick={handleNext}
                aria-label="Passo successivo"
                sx={{ color: tok('primary'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
              >
                Avanti
              </Button>
            ) : (
              <Button
                size="small"
                onClick={handleConfirm}
                aria-label="Conferma e chiudi wizard"
                sx={{ color: tok('primary'), fontWeight: 'var(--md-sys-typescale-weight-semibold)' }}
              >
                Inizia
              </Button>
            )
          }
          backButton={
            <Button
              size="small"
              onClick={step === 0 ? onClose : handleBack}
              aria-label={step === 0 ? 'Chiudi wizard' : 'Passo precedente'}
              sx={{ color: tok('on-surface-variant') }}
            >
              {step === 0 ? 'Salta' : 'Indietro'}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default TeacherOnboardingModal;
