/**
 * pages/PrivacyPage.tsx — P28 Go-to-Market Tier 1
 *
 * Pagina Privacy Policy — GDPR art.13 + art.14 informativa completa.
 * Route: /privacy (fast-path in main.tsx, non richiede autenticazione)
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

const PrivacyPage: React.FC = () => (
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
        Privacy Policy
      </Typography>
      <Typography variant="bodySmall" sx={{ color: 'var(--md-sys-color-on-surface-variant)', mb: 'var(--md-sys-spacing-6)' }}>
        Ultimo aggiornamento: {LAST_UPDATED}
      </Typography>

      <Divider sx={{ mb: 'var(--md-sys-spacing-8)', borderColor: 'var(--md-sys-color-outline-variant)' }} />

      <Stack spacing="var(--md-sys-spacing-8)">

        <Section title="1. Titolare del trattamento">
          DocenteDocAI — progetto sperimentale. Contatto:{' '}
          <Link href="mailto:privacy@docentedoc.app" color="primary">privacy@docentedoc.app</Link>
        </Section>

        <Section title="2. Finalità e basi giuridiche del trattamento">
          Trattiamo i tuoi dati per le seguenti finalità:
          <ul>
            <li><strong>Erogazione del servizio</strong> — autenticazione, gestione account, recupero sessione (base giuridica: art. 6.1.b GDPR — esecuzione del contratto)</li>
            <li><strong>Pagamenti</strong> — gestione abbonamento Pro tramite Stripe (base giuridica: art. 6.1.b GDPR)</li>
            <li><strong>Sicurezza e antifrode</strong> — log server, rate limiting, audit trail (base giuridica: art. 6.1.f GDPR — interesse legittimo)</li>
            <li><strong>Miglioramento del servizio</strong> — metriche anonimizzate (base giuridica: art. 6.1.f GDPR)</li>
          </ul>
          Non trattiamo i dati degli alunni: tutti i dati relativi a terzi (alunni, classi, valutazioni) rimangono
          esclusivamente sul dispositivo del docente e non vengono trasmessi ai nostri server.
        </Section>

        <Section title="3. Dati raccolti">
          <ul>
            <li><strong>Account</strong>: nome, email, foto profilo — forniti tramite Google OAuth</li>
            <li><strong>Piano di abbonamento</strong>: stato Free / Pro</li>
            <li><strong>Log tecnici</strong>: IP, user-agent, timestamp delle richieste (finalità di sicurezza)</li>
            <li><strong>Telemetria anonima</strong>: latenza API, errori client (nessun dato personale) — solo se consenso accordato</li>
          </ul>
        </Section>

        <Section title="4. Dati NON raccolti dal server">
          I seguenti dati rimangono <strong>localmente sul dispositivo del docente</strong> e non vengono mai trasmessi ai nostri server:
          <ul>
            <li>Dati degli alunni (nomi, voti, annotazioni)</li>
            <li>UDA e piani di lavoro</li>
            <li>Contenuti delle chat con l'AI</li>
          </ul>
        </Section>

        <Section title="5. Conservazione dei dati">
          <ul>
            <li>Dati account: conservati per tutta la durata dell'account + 12 mesi dopo la cancellazione</li>
            <li>Log tecnici: 90 giorni</li>
            <li>Artefatti AI (telemetria): eliminati automaticamente dopo 365 giorni (funzione di data retention attiva)</li>
          </ul>
        </Section>

        <Section title="6. Condivisione con terze parti">
          <ul>
            <li><strong>Google LLC</strong> — autenticazione OAuth 2.0 (Google Identity Services)</li>
            <li><strong>Stripe Inc.</strong> — elaborazione pagamenti (piano Pro)</li>
            <li><strong>Sentry.io</strong> — monitoraggio errori anonimizzato (solo se VITE_SENTRY_DSN configurato e consenso accordato)</li>
            <li><strong>Render.com</strong> — hosting del server backend (dati in UE)</li>
            <li><strong>Vercel Inc.</strong> — hosting del frontend</li>
          </ul>
          Non vendiamo né cediamo dati a terzi per finalità di marketing.
        </Section>

        <Section title="7. Diritti dell'interessato (GDPR cap. III)">
          Hai il diritto di:
          <ul>
            <li>Accedere ai tuoi dati personali</li>
            <li>Rettificare dati inesatti</li>
            <li>Richiedere la cancellazione ("diritto all'oblio")</li>
            <li>Limitare od opporti al trattamento</li>
            <li>Richiedere la portabilità dei tuoi dati</li>
          </ul>
          Esercita i tuoi diritti contattando:{' '}
          <Link href="mailto:privacy@docentedoc.app" color="primary">privacy@docentedoc.app</Link>
          {' '}— risponderemo entro 30 giorni. Puoi anche presentare reclamo al{' '}
          <Link href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" color="primary">
            Garante per la protezione dei dati personali
          </Link>.
        </Section>

        <Section title="8. Cookie e tracciamento">
          Utilizziamo un cookie di sessione (<code>connect.sid</code>) strettamente necessario per mantenere
          l'autenticazione. Non usiamo cookie di profilazione o tracker di terze parti sulla pagina principale.
          Stripe utilizza cookie propri durante il checkout.
        </Section>

        <Section title="9. Sicurezza">
          I dati sono trasmessi via HTTPS (TLS 1.2+). Le sessioni utilizzano cookie HttpOnly + SameSite=Strict.
          Il backend applica rate limiting, helmet.js e validazione di input su tutti gli endpoint.
        </Section>

        <Section title="10. Modifiche alla Privacy Policy">
          In caso di modifiche significative, ne daremo comunicazione via email almeno 14 giorni prima dell'entrata
          in vigore. La versione aggiornata sarà sempre disponibile a questo URL.
        </Section>

      </Stack>
    </Container>
  </Box>
);

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

export default PrivacyPage;
