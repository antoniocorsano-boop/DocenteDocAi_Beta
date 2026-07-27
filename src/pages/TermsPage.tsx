/**
 * pages/TermsPage.tsx — P28 Go-to-Market Tier 1
 *
 * Pagina Termini di Utilizzo — servizio sperimentale pilota.
 * Route: /terms (fast-path in main.tsx, non richiede autenticazione)
 */

import React from 'react';
import Box           from '@mui/material/Box';
import Button        from '@mui/material/Button';
import Container     from '@mui/material/Container';
import Divider       from '@mui/material/Divider';
import Link          from '@mui/material/Link';
import Stack         from '@mui/material/Stack';
import Typography    from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const LAST_UPDATED = '21 marzo 2026';

const TermsPage: React.FC = () => (
  <Box
    sx={{
      minHeight: '100vh',
      bgcolor: 'var(--md-sys-color-surface)',
      color:   'var(--md-sys-color-on-surface)',
      py: { xs: 'var(--md-sys-spacing-8)', md: 'var(--md-sys-spacing-12)' },
    }}
  >
    <Container maxWidth="md">
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        href="/landing"
        component="a"
        variant="text"
        aria-label="Torna alla home"
        sx={{ mb: 'var(--md-sys-spacing-6)', color: 'var(--md-sys-color-primary)' }}
      >
        Torna alla home
      </Button>

      <Typography variant="displaySmall" component="h1" sx={{ mb: 'var(--md-sys-spacing-2)' }}>
        Termini di Utilizzo
      </Typography>
      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-6)' }}>
        Ultimo aggiornamento: {LAST_UPDATED}
      </Typography>

      <Divider sx={{ mb: 'var(--md-sys-spacing-8)', borderColor: 'var(--md-sys-color-outline-variant)' }} />

      <Stack spacing="var(--md-sys-spacing-8)">

        <Section title="1. Accettazione dei termini">
          Utilizzando DocenteDocAI (il "Servizio"), accetti di essere vincolato dai presenti Termini di Utilizzo.
          Se non accetti, non utilizzare il Servizio.
        </Section>

        <Section title="2. Descrizione del Servizio">
          DocenteDocAI è uno strumento pedagogico sperimentale di supporto alla didattica nelle scuole italiane.
          Il Servizio è in fase pilota e viene fornito <em>così com'è</em>, senza garanzie di continuità o correttezza.
        </Section>

        <Section title="3. Account e autenticazione">
          Il Servizio utilizza Google Sign-In per l'autenticazione. Sei responsabile di mantenere la sicurezza del tuo
          account Google. Non condividere le credenziali con terzi.
        </Section>

        <Section title="4. Piani Free e Pro">
          Il piano <strong>Free</strong> è disponibile senza costi. Il piano <strong>Pro</strong> è soggetto a un canone
          mensile indicato al momento dell'acquisto. I pagamenti sono gestiti da Stripe Inc. secondo i loro{' '}
          <Link href="https://stripe.com/it/legal/consumer" target="_blank" rel="noopener noreferrer">
            termini di servizio
          </Link>.
          Puoi annullare il piano Pro in qualsiasi momento; l'accesso Pro rimane attivo fino alla fine del periodo pagato.
        </Section>

        <Section title="5. Dati e privacy">
          I dati relativi ad alunni, valutazioni e UDA vengono salvati localmente sul dispositivo del docente.
          L'elaborazione AI avviene tramite API di terze parti (Google Gemini / Anthropic Claude) con dati anonimizzati.
          Per maggiori dettagli consulta la nostra{' '}
          <Link href="/privacy" color="primary">Privacy Policy</Link>.
        </Section>

        <Section title="6. Uso accettabile">
          Il Servizio è destinato esclusivamente a docenti per scopi didattici. È vietato:
          <ul>
            <li>Inserire dati personali di minori al di là di quanto strettamente necessario per la didattica</li>
            <li>Utilizzare il Servizio per finalità commerciali non autorizzate</li>
            <li>Tentare di aggirare le misure di sicurezza del Servizio</li>
          </ul>
        </Section>

        <Section title="7. Limitazione di responsabilità">
          Il Servizio è sperimentale. Non garantiamo la correttezza dei contenuti generati dall'AI.
          Il docente rimane sempre responsabile delle decisioni didattiche. Non siamo responsabili di danni
          derivanti dall'uso o dall'impossibilità di utilizzo del Servizio.
        </Section>

        <Section title="8. Modifiche ai Termini">
          Ci riserviamo il diritto di modificare i presenti Termini. Le modifiche significative saranno
          comunicate via email o tramite notifica in-app almeno 14 giorni prima dell'entrata in vigore.
        </Section>

        <Section title="9. Legge applicabile">
          I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il
          Foro di Milano, salvo diversa disposizione di legge.
        </Section>

        <Section title="10. Contatti">
          Per domande sui presenti Termini:{' '}
          <Link href="mailto:info@docentedoc.app" color="primary">info@docentedoc.app</Link>
        </Section>

      </Stack>
    </Container>
  </Box>
);

// Small helper to avoid repetition
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box component="section">
    <Typography variant="titleLarge" component="h2" sx={{ mb: 'var(--md-sys-spacing-3)', color: 'var(--md-sys-color-on-surface)' }}>
      {title}
    </Typography>
    <Typography variant="bodyMedium" component="div" sx={{ color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.8 }}>
      {children}
    </Typography>
  </Box>
);

export default TermsPage;
