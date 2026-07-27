/**
 * RegisterImportWizard.tsx
 *
 * Guided 4-step wizard for importing students / evaluations from Italian
 * school registers (Argo, ClasseViva/Spaggiari, Axios, SIDI, or any CSV/XLSX).
 *
 * Step 0 — Scegli il registro
 * Step 1 — Guida all'esportazione + scarica template CSV
 * Step 2 — Carica file + anteprima dati riconosciuti
 * Step 3 — Conferma importazione
 *
 * On confirm, calls `onImportFile(file)` — the caller handles persisting the data
 * via the existing handleImportData / ImportService pipeline.
 */
import React, { useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getRegisterImportGuidance, RegisterProvider } from '../../services/registerService';
import { ImportService } from '../../services/importService';

// ── types ─────────────────────────────────────────────────────────────────────

interface RegisterImportWizardProps {
  open: boolean;
  onClose: () => void;
  /** Calls the existing handleImportData action in useAppEngine */
  onImportFile: (file: File) => void;
}

interface ProviderOption {
  id: RegisterProvider;
  label: string;
  desc: string;
  icon: string;
}

// ── constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Registro', 'Esporta', 'Carica file', 'Conferma'];

const PROVIDERS: ProviderOption[] = [
  { id: 'argo',      label: 'Argo (DidUP)',         desc: 'Il registro elettronico più diffuso nelle scuole italiane.',      icon: 'school' },
  { id: 'spaggiari', label: 'ClasseViva (Spaggiari)', desc: 'Spaggiari Classeviva e Spaggiari RE.',                           icon: 'class' },
  { id: 'axios',     label: 'Axios RE',              desc: 'Registro elettronico Axios / Portale dell\'istruzione.',          icon: 'menu_book' },
  { id: 'sidi',      label: 'SIDI / MIUR',           desc: 'Anagrafe Nazionale Studenti del Ministero dell\'Istruzione.',    icon: 'account_balance' },
  { id: 'generic',   label: 'Altro / CSV generico',  desc: 'Qualsiasi CSV o Excel con Cognome, Nome e opz. Classe / Voto.', icon: 'table_view' },
];

/** Minimal CSV template downloadable at step 1 */
const CSV_TEMPLATE =
  'Cognome,Nome,Classe,Materia,Tipo,Voto,Data,Argomento\n' +
  'Rossi,Mario,3A,Matematica,Scritto,8,15/03/2026,Frazioni\n' +
  'Bianchi,Lucia,3A,Italiano,Orale,9,15/03/2026,\n';

// ── component ─────────────────────────────────────────────────────────────────

const RegisterImportWizard: React.FC<RegisterImportWizardProps> = ({ open, onClose, onImportFile }) => {
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<RegisterProvider | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ students: number; evaluations: number; errors: string[] } | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep(0);
    setProvider(null);
    setFile(null);
    setPreview(null);
    onClose();
  };

  const handleSelectProvider = (p: RegisterProvider) => {
    setProvider(p);
    setStep(1);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_importazione_docentedoc.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsing(true);
    setPreview(null);
    try {
      const result = await ImportService.parseFile(f);
      setPreview({
        students: result.students.length,
        evaluations: result.evaluations.length,
        errors: result.errors,
      });
    } catch {
      setPreview({ students: 0, evaluations: 0, errors: ['Impossibile leggere il file.'] });
    } finally {
      setParsing(false);
      setStep(2);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (!file) return;
    onImportFile(file);
    handleClose();
  };

  const guidance = provider ? getRegisterImportGuidance(provider) : null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="register-import-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 'var(--md-sys-shape-corner-extra-large)', p: 1 } }}
    >
      <DialogTitle id="register-import-title">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SchoolIcon sx={{ color: 'var(--md-sys-color-primary)' }} aria-hidden />
          <Stack spacing={0}>
            <Typography variant="h6" component="span">Importa da Registro</Typography>
            <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Studenti e valutazioni da Argo, ClasseViva, Axios, SIDI o CSV
            </Typography>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* ── Step 0: scegli registro ───────────────────────────────────── */}
          {step === 0 && (
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Seleziona il registro da cui esporterai i dati.
              </Typography>
              <Stack spacing={1}>
                {PROVIDERS.map(p => (
                  <Box
                    key={p.id}
                    onClick={() => handleSelectProvider(p.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Seleziona ${p.label}`}
                    onKeyDown={e => e.key === 'Enter' && handleSelectProvider(p.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 'var(--md-sys-shape-corner-large)',
                      border: '1px solid',
                      borderColor: provider === p.id ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                      bgcolor: provider === p.id ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'var(--md-sys-color-primary)', bgcolor: 'var(--md-sys-color-primary-container)' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <Box component="span" className="material-symbols-outlined" aria-hidden="true"
                      sx={{ color: 'var(--md-sys-color-primary)', fontSize: 28 }}>
                      {p.icon}
                    </Box>
                    <Stack spacing={0}>
                      <Typography variant="subtitle2">{p.label}</Typography>
                      <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{p.desc}</Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Stack>
          )}

          {/* ── Step 1: guida esportazione ───────────────────────────────── */}
          {step === 1 && guidance && (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Segui questi passaggi in <strong>{guidance.providerName}</strong> per esportare i tuoi dati.
              </Typography>
              <List dense disablePadding>
                {guidance.steps.map((s, i) => (
                  <ListItem key={i} disableGutters sx={{ alignItems: 'flex-start', py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                      <Chip label={i + 1} size="small" color="primary" sx={{ width: 24, height: 24, fontSize: 11 }} />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">{s}</Typography>} />
                  </ListItem>
                ))}
              </List>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Se il tuo registro non ha un'opzione di esportazione diretta, puoi usare il nostro template CSV.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Box component="span" className="material-symbols-outlined" aria-hidden="true">download</Box>}
                  onClick={handleDownloadTemplate}
                  aria-label="Scarica template CSV per importazione manuale"
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Scarica template CSV
                </Button>
              </Stack>
            </Stack>
          )}

          {/* ── Step 2: carica file + preview ────────────────────────────── */}
          {step === 2 && (
            <Stack spacing={2}>
              {preview && preview.errors.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
                  <Typography variant="body2">
                    File elaborato: <strong>{preview.students} studenti</strong>
                    {preview.evaluations > 0 && <>, <strong>{preview.evaluations} valutazioni</strong></>} trovati.
                  </Typography>
                </Alert>
              ) : preview && preview.errors.length > 0 ? (
                <Stack spacing={1}>
                  {preview.students > 0 && (
                    <Alert severity="warning">
                      {preview.students} studenti trovati, ma con {preview.errors.length} errori di parsing.
                    </Alert>
                  )}
                  {preview.students === 0 && (
                    <Alert severity="error">Nessun dato riconosciuto nel file.</Alert>
                  )}
                  <Box sx={{ maxHeight: 120, overflowY: 'auto', bgcolor: 'var(--md-sys-color-surface-container)', borderRadius: 1, p: 1 }}>
                    {preview.errors.slice(0, 10).map((e, i) => (
                      <Typography key={i} variant="caption" display="block" sx={{ color: 'var(--md-sys-color-error)' }}>{e}</Typography>
                    ))}
                  </Box>
                </Stack>
              ) : null}

              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: file ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                  borderRadius: 'var(--md-sys-shape-corner-large)',
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: file ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
                  transition: 'all 0.15s',
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Clicca per selezionare un file CSV o Excel"
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <UploadFileIcon sx={{ color: 'var(--md-sys-color-primary)', fontSize: 40, mb: 1 }} aria-hidden />
                {parsing ? (
                  <Typography variant="body2">Analisi in corso…</Typography>
                ) : file ? (
                  <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>{file.name}</Typography>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)' }}>Clicca per selezionare</Typography>
                    <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      CSV, Excel (.xlsx/.xls) — max 5 MB
                    </Typography>
                  </>
                )}
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                id="register-import-file"
                name="registerImportFile"
                aria-label="Seleziona file CSV o Excel da importare"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {file && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => { setFile(null); setPreview(null); }}
                  aria-label="Rimuovi il file selezionato e scegline un altro"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Cambia file
                </Button>
              )}
            </Stack>
          )}

          {/* ── Step 3: conferma ─────────────────────────────────────────── */}
          {step === 3 && preview && (
            <Stack spacing={2}>
              <Alert severity="info">
                <Typography variant="body2">
                  Verranno importati <strong>{preview.students} studenti</strong>
                  {preview.evaluations > 0 && <> e <strong>{preview.evaluations} valutazioni</strong></>}.
                  I dati esistenti non verranno sovrascritti — gli studenti saranno aggiunti se non già presenti.
                </Typography>
              </Alert>
              <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                File: <strong>{file?.name}</strong>
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="text" aria-label="Annulla importazione">Annulla</Button>
        <Box sx={{ flex: 1 }} />

        {/* Back */}
        {step > 0 && step < 3 && (
          <Button
            onClick={() => setStep(s => s - 1)}
            variant="outlined"
            aria-label="Torna allo step precedente"
          >
            Indietro
          </Button>
        )}

        {/* Next — step 1 → 2 */}
        {step === 1 && (
          <Button
            onClick={() => setStep(2)}
            variant="contained"
            aria-label="Procedi al caricamento del file"
          >
            Carica file
          </Button>
        )}

        {/* Next — step 2 → 3 (only when file + preview OK) */}
        {step === 2 && file && preview && preview.students > 0 && (
          <Button
            onClick={() => setStep(3)}
            variant="contained"
            aria-label="Procedi alla conferma importazione"
          >
            Avanti
          </Button>
        )}

        {/* Confirm — step 3 */}
        {step === 3 && (
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            aria-label="Conferma e importa i dati"
          >
            Importa
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RegisterImportWizard;
