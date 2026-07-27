/**
 * PrivacyConsentModal.tsx
 *
 * First-run privacy consent screen (GDPR art. 13 informativa).
 * Shown once when the app loads and no consent record exists in localStorage.
 * Blocking modal — app is not usable until the teacher accepts.
 *
 * Consent is stored as: localStorage.setItem('privacy_consent_v1', JSON.stringify({ accepted: true, ts }))
 */
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TermsOfUseModal from './TermsOfUseModal';

export const CONSENT_KEY = 'privacy_consent_v1';

/** Returns true if the teacher has already given consent in a previous session. */
export function hasPrivacyConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { accepted?: boolean };
    return parsed.accepted === true;
  } catch {
    return false;
  }
}

/** Persist consent record with ISO timestamp. */
export function recordConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, ts: new Date().toISOString() }));
  } catch {
    /* localStorage not available — allow app to proceed anyway */
  }
}

// ── component ─────────────────────────────────────────────────────────────────

interface PrivacyConsentModalProps {
  /** Called when the teacher clicks "Accetto" after checking both boxes. */
  onAccepted: () => void;
}

const PrivacyConsentModal: React.FC<PrivacyConsentModalProps> = ({ onAccepted }) => {
  const [checkedInformativa, setCheckedInformativa] = useState(false);
  const [checkedTrattamento, setCheckedTrattamento] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const canAccept = checkedInformativa && checkedTrattamento;

  const handleAccept = () => {
    if (!canAccept) return;
    recordConsent();
    onAccepted();
  };

  return (
    <Dialog
      open
      disableEscapeKeyDown
      aria-labelledby="privacy-consent-title"
      aria-describedby="privacy-consent-desc"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--md-sys-shape-corner-extra-large)',
          p: 1,
        },
      }}
    >
      <DialogTitle id="privacy-consent-title">
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ShieldOutlinedIcon sx={{ color: 'var(--md-sys-color-primary)' }} />
          <Typography variant="titleLarge" component="span">
            Informativa Privacy — DocenteDoc AI
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} id="privacy-consent-desc">
          <Typography variant="bodyMedium" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Prima di utilizzare l'applicazione, leggi attentamente le informazioni sul trattamento dei tuoi dati personali e
            dei dati degli studenti che gestisci tramite questa app.
          </Typography>

          <Divider />

          {/* Informativa sintetica */}
          <Stack spacing={1}>
            <Typography variant="titleSmall">📌 Titolare del trattamento</Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Il docente stesso, in qualità di titolare autonomo del trattamento dei dati della propria classe.
              DocenteDoc AI è uno strumento software — non raccoglie né trasmette dati a server propri.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="titleSmall">📌 Dati trattati</Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Nomi, valutazioni, annotazioni, UDA e dati didattici degli studenti archiviati localmente nel browser
              (localStorage / IndexedDB). Nessun dato viene inviato a server di terze parti eccetto:
              (a) testo libero alle API Gemini/Anthropic per l'assistente AI, in forma pseudonimizzata;
              (b) backup su Google Drive personale del docente (solo su esplicita richiesta).
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="titleSmall">📌 Finalità</Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Supporto alla pianificazione didattica, analisi pedagogica e generazione di raccomandazioni AI
              per migliorare la qualità dell'insegnamento. Nessun profilazione commerciale.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="titleSmall">📌 Conservazione</Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              I dati rimangono nel dispositivo del docente. Vengono eliminati automaticamente dopo
              <strong> 365 giorni di inattività</strong>. Il docente può cancellarli in qualsiasi momento
              dalla sezione Impostazioni → Privacy.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="titleSmall">📌 Diritti dell'interessato</Typography>
            <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Accesso, rettifica, cancellazione («diritto all'oblio»), portabilità — esercitabili tramite
              le Impostazioni dell'app. Per i dati degli studenti, la responsabilità è del docente
              verso il proprio Istituto scolastico.
            </Typography>
          </Stack>

          <Divider />

          {/* Checkboxes */}
          <FormControlLabel
            control={
              <Checkbox
                checked={checkedInformativa}
                onChange={e => setCheckedInformativa(e.target.checked)}
                aria-label="Dichiaro di aver letto l'informativa privacy"
              />
            }
            label={
              <Typography variant="bodySmall">
                Ho letto e compreso l'informativa sul trattamento dei dati personali.
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={checkedTrattamento}
                onChange={e => setCheckedTrattamento(e.target.checked)}
                aria-label="Acconsento al trattamento dei dati per le finalità indicate"
              />
            }
            label={
              <Typography variant="bodySmall">
                Acconsento al trattamento dei dati degli studenti della mia classe
                per le sole finalità didattiche descritte sopra.
              </Typography>
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="text"
          onClick={() => setShowTerms(true)}
          aria-label="Leggi i termini di utilizzo"
          sx={{ mr: 'auto', textTransform: 'none' }}
        >
          Termini di utilizzo
        </Button>
        <Button
          variant="contained"
          onClick={handleAccept}
          disabled={!canAccept}
          aria-label="Accetto le condizioni e avvio l'applicazione"
          sx={{ borderRadius: 'var(--md-sys-shape-corner-full)', textTransform: 'none', px: 3 }}
        >
          Accetto e continuo
        </Button>
      </DialogActions>

      <TermsOfUseModal open={showTerms} onClose={() => setShowTerms(false)} />
    </Dialog>
  );
};

export default PrivacyConsentModal;
