/**
 * TermsOfUseModal.tsx
 *
 * Termini di Utilizzo — DocenteDoc AI.
 * Versione 1.0 — Marzo 2026.
 *
 * Accessibile in qualsiasi momento da Settings → Avanzate → Privacy.
 * Il contenuto definisce chiaramente che il docente è Titolare del Trattamento
 * e che lo sviluppatore fornisce il servizio "as-is" per uso personale/professionale.
 */
import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';

export const TERMS_VERSION = '1.0';
export const TERMS_DATE = 'Marzo 2026';

interface TermsOfUseModalProps {
  open: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Stack spacing={1} sx={{ mt: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 'var(--md-sys-typescale-weight-bold)', color: 'var(--md-sys-color-on-surface)' }}>
      {title}
    </Typography>
    {children}
  </Stack>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
    {children}
  </Typography>
);

const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="terms-of-use-title"
    maxWidth="md"
    fullWidth
    PaperProps={{
      sx: { borderRadius: 'var(--md-sys-shape-corner-extra-large)', p: 1 },
    }}
  >
    <DialogTitle id="terms-of-use-title">
      <Stack direction="row" spacing={1.5} alignItems="center">
        <GavelOutlinedIcon sx={{ color: 'var(--md-sys-color-primary)' }} aria-hidden />
        <Stack spacing={0}>
          <Typography variant="h6" component="span">Termini di Utilizzo</Typography>
          <Typography variant="caption" sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            DocenteDoc AI — Versione {TERMS_VERSION} — {TERMS_DATE}
          </Typography>
        </Stack>
      </Stack>
    </DialogTitle>

    <DialogContent dividers sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
      <Stack spacing={0.5}>

        <Section title="1. Descrizione del servizio">
          <Body>
            DocenteDoc AI è un'applicazione web per docenti che offre strumenti di pianificazione
            didattica, gestione della classe e supporto decisionale tramite intelligenza artificiale.
            Il servizio è fornito gratuitamente per uso personale e professionale del docente.
          </Body>
        </Section>

        <Divider sx={{ mt: 2 }} />

        <Section title="2. Titolarità del trattamento dei dati">
          <Body>
            <strong>Il docente che utilizza l'applicazione è il Titolare del Trattamento</strong> ai
            sensi del Regolamento UE 2016/679 (GDPR). L'applicazione elabora i dati inseriti
            (nomi studenti, valutazioni, annotazioni) esclusivamente sul dispositivo del docente
            tramite localStorage del browser. Nessun dato personale degli studenti viene
            trasmesso a server esterni senza esplicita azione dell'utente (es. backup Google Drive).
          </Body>
        </Section>

        <Divider sx={{ mt: 2 }} />

        <Section title="3. Responsabilità del docente">
          <Body>
            Il docente si impegna a:
          </Body>
          <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
            {[
              'Utilizzare l\'applicazione in conformità alle normative vigenti sulla protezione dei dati personali.',
              'Ottenere le autorizzazioni necessarie dall\'istituzione scolastica di appartenenza prima di inserire dati di studenti minori.',
              'Non condividere le proprie credenziali o l\'accesso all\'applicazione con persone non autorizzate.',
              'Adottare misure di sicurezza adeguate per il dispositivo utilizzato (password, blocco schermo).',
              'Informare gli studenti e le famiglie del trattamento dati in conformità all\'art. 13 GDPR.',
            ].map((item, i) => (
              <Typography key={i} component="li" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
                {item}
              </Typography>
            ))}
          </Stack>
        </Section>

        <Divider sx={{ mt: 2 }} />

        <Section title="4. Limitazioni di responsabilità dello sviluppatore">
          <Body>
            L'applicazione è fornita <strong>"così com'è" (as-is)</strong>, senza garanzie di alcun tipo,
            esplicite o implicite. Lo sviluppatore non è responsabile per:
          </Body>
          <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
            {[
              'Perdita di dati dovuta a malfunzionamenti del browser, del dispositivo o a pulizia della memoria del browser.',
              'Inesattezze o errori nelle analisi e raccomandazioni generate dall\'intelligenza artificiale.',
              'Interruzioni del servizio dovute a manutenzione o problemi tecnici della piattaforma di hosting.',
              'Usi non conformi alla normativa da parte del docente.',
              'Danni diretti o indiretti derivanti dall\'utilizzo o dall\'impossibilità di utilizzo del servizio.',
            ].map((item, i) => (
              <Typography key={i} component="li" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
                {item}
              </Typography>
            ))}
          </Stack>
          <Body>
            Le funzionalità AI sono strumenti di supporto decisionale. Le decisioni finali
            riguardanti gli studenti spettano sempre al docente.
          </Body>
        </Section>

        <Divider sx={{ mt: 2 }} />

        <Section title="5. Servizi di terze parti">
          <Body>
            L'applicazione si avvale di servizi di terze parti soggetti ai rispettivi termini:
          </Body>
          <Stack component="ul" spacing={0.5} sx={{ pl: 2.5, m: 0 }}>
            {[
              'Vercel Inc. — hosting e distribuzione dell\'applicazione (vercel.com/legal)',
              'Google LLC — modelli AI Gemini, servizi di autenticazione e Google Drive (policies.google.com)',
              'Anthropic PBC — modelli AI Claude (anthropic.com/legal)',
            ].map((item, i) => (
              <Typography key={i} component="li" variant="body2" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.6 }}>
                {item}
              </Typography>
            ))}
          </Stack>
          <Body>
            Le richieste AI vengono instradate attraverso un proxy server-side (Vercel Edge Function)
            che non registra permanentemente i dati. Le chiavi API non sono mai esposte nel browser.
          </Body>
        </Section>

        <Divider sx={{ mt: 2 }} />

        <Section title="6. Utilizzo accettabile">
          <Body>
            È vietato utilizzare l'applicazione per trattare dati di studenti senza le necessarie
            basi giuridiche (consenso o legittimo interesse istituzionale), per scopi commerciali
            non autorizzati, o in violazione di norme scolastiche, contrattuali o di legge.
          </Body>
        </Section>

        <Divider sx={{ mt: 2 }} />

        <Section title="7. Modifiche ai termini">
          <Body>
            Lo sviluppatore si riserva il diritto di modificare i presenti termini. In caso di
            modifiche sostanziali, al successivo accesso sarà richiesta una nuova accettazione.
            La versione corrente è sempre consultabile in questa sezione.
          </Body>
        </Section>

        <Divider sx={{ mt: 2 }} />

        <Section title="8. Legge applicabile e foro competente">
          <Body>
            I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è
            competente in via esclusiva il Foro del comune di residenza dello sviluppatore.
          </Body>
        </Section>

      </Stack>
    </DialogContent>

    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button
        onClick={onClose}
        variant="contained"
        aria-label="Chiudi termini di utilizzo"
      >
        Chiudi
      </Button>
    </DialogActions>
  </Dialog>
);

export default TermsOfUseModal;
