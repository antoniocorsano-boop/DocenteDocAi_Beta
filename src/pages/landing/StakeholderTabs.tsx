/**
 * StakeholderTabs.tsx
 *
 * Interactive tab component showing tailored value propositions
 * for each stakeholder group.
 *
 * Tabs: Docenti | Scuole | Dirigenti scolastici | Ricercatori
 * Each tab renders a 2-col card grid (a11y: full keyboard support, ARIA roles).
 */
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ScienceIcon from '@mui/icons-material/Science';

// ── data ──────────────────────────────────────────────────────────────────────

interface StakeholderCard {
  icon: string;
  title: string;
  body: string;
}

interface StakeholderEntry {
  id: string;
  label: string;
  Icon: React.ElementType;
  headline: string;
  cards: StakeholderCard[];
}

const STAKEHOLDERS: StakeholderEntry[] = [
  {
    id: 'docenti',
    label: 'Docenti',
    Icon: AutoStoriesIcon,
    headline: 'Un assistente pedagogico che rispetta la tua autonomia professionale.',
    cards: [
      {
        icon: 'analytics',
        title: 'Analisi delle lezioni',
        body: 'Visualizza la distribuzione dei livelli cognitivi (Tassonomia di Bloom) nelle tue UDA e individua gli squilibri in modo immediato.',
      },
      {
        icon: 'recommend',
        title: 'Suggerimenti mirati',
        body: 'Ricevi raccomandazioni didattiche personalizzate basate sulle performance della classe, con spiegazione del ragionamento AI.',
      },
      {
        icon: 'privacy_tip',
        title: 'Dati solo tuoi',
        body: 'I dati degli studenti restano sul tuo dispositivo. Nessuna condivisione con server terzi senza il tuo consenso esplicito.',
      },
      {
        icon: 'verified',
        title: 'Trust Score trasparente',
        body: 'Ogni raccomandazione AI include un indicatore di affidabilità e le motivazioni del sistema, così puoi valutare criticamente ogni suggerimento.',
      },
    ],
  },
  {
    id: 'scuole',
    label: 'Scuole',
    Icon: AccountBalanceIcon,
    headline: "Uno strumento istituzionalmente affidabile per l'innovazione didattica.",
    cards: [
      {
        icon: 'school',
        title: 'Nessuna infrastruttura richiesta',
        body: 'Applicazione web progressiva (PWA) accessibile da qualsiasi browser scolastico, senza installazioni lato server.',
      },
      {
        icon: 'gpp_good',
        title: 'GDPR-ready',
        body: 'Architettura privacy-by-design: i dati sensibili degli studenti non escono mai dalla rete scolastica se non con consenso esplicito.',
      },
      {
        icon: 'groups',
        title: 'Per tutto il corpo docente',
        body: 'Ogni docente gestisce autonomamente le proprie classi. Nessuna dipendenza da un account admin centralizzato.',
      },
      {
        icon: 'open_source',
        title: 'Trasparenza completa',
        body: 'Codice sorgente documentato, architettura pubblica, roadmap visibile. Nessuna black-box.',
      },
    ],
  },
  {
    id: 'dirigenti',
    label: 'Dirigenti scolastici',
    Icon: ManageAccountsIcon,
    headline: 'Dati pedagogici aggregati per decisioni informate sulla qualità della didattica.',
    cards: [
      {
        icon: 'bar_chart',
        title: 'Visione di istituto',
        body: 'Aggregazione anonima dei dati di classe per identificare trend di apprendimento a livello di istituto, nel pieno rispetto della privacy dei docenti.',
      },
      {
        icon: 'task_alt',
        title: 'Conformità normativa',
        body: 'Strumento progettato con la normativa italiana in mente: GDPR, Linee guida MIM, Codice della Privacy.',
      },
      {
        icon: 'support',
        title: 'Formazione docenti',
        body: 'Il sistema spiega i costrutti pedagogici (Bloom, UDA, competenze) in-app: strumento di auto-formazione per il corpo docente.',
      },
      {
        icon: 'trending_up',
        title: 'Miglioramento continuo',
        body: 'Ciclo di feedback AI → docente → revisione UDA supporta il miglioramento iterativo della progettazione didattica.',
      },
    ],
  },
  {
    id: 'ricercatori',
    label: 'Ricercatori',
    Icon: ScienceIcon,
    headline: 'Una piattaforma aperta per la ricerca applicata in educational AI.',
    cards: [
      {
        icon: 'data_object',
        title: 'Architettura documentata',
        body: 'Pipeline AI tracciata end-to-end, con log pedagogici strutturati. Adatta a studi su Human-AI interaction in contesti educativi.',
      },
      {
        icon: 'psychology',
        title: 'Explainability integrata',
        body: "Ogni output AI include spiegazione strutturata (fattori, confidence, Bloom level). Pronto per studi sull'interpretabilità pedagogica.",
      },
      {
        icon: 'science',
        title: 'Simulation Lab',
        body: "Ambiente di simulazione integrato per testare scenari didattici con distribuzioni di rischio personalizzabili. Utile per ricerca sull'apprendimento adattivo.",
      },
      {
        icon: 'handshake',
        title: 'Collaborazioni aperte',
        body: 'Siamo attivamente aperti a partnership con università e centri di ricerca per validazione empirica dei modelli pedagogici.',
      },
    ],
  },
];

// ── component ─────────────────────────────────────────────────────────────────

interface TabPanelProps {
  value: number;
  index: number;
  entry: StakeholderEntry;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, entry }) => (
  <Box
    role="tabpanel"
    id={`stakeholder-panel-${entry.id}`}
    aria-labelledby={`stakeholder-tab-${entry.id}`}
    hidden={value !== index}
  >
    {value === index && (
      <Box pt="var(--md-sys-spacing-6)">
        <Typography
          variant="bodyLarge"
          sx={{
            color: 'var(--md-sys-color-on-surface-variant)',
            mb: 'var(--md-sys-spacing-5)',
            display: 'block',
            maxWidth: 640,
            fontStyle: 'italic',
          }}
        >
          {entry.headline}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 'var(--md-sys-spacing-3)',
          }}
        >
          {entry.cards.map(card => (
            <Card
              key={card.title}
              variant="outlined"
              sx={{
                borderRadius: 'var(--md-sys-shape-corner-large)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                bgcolor: 'var(--md-sys-color-surface-container-low)',
                transition: 'border-color 0.15s, background-color 0.15s',
                '&:hover': {
                  borderColor: 'var(--md-sys-color-primary)',
                  bgcolor: 'var(--md-sys-color-surface-container)',
                },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{
                      color: 'var(--md-sys-color-secondary)',
                      fontSize: 22,
                      mt: 0.25,
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="labelLarge"
                      sx={{ color: 'var(--md-sys-color-on-surface)' }}
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
                    >
                      {card.body}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    )}
  </Box>
);

const StakeholderTabs: React.FC = () => {
  const [value, setValue] = useState(0);

  return (
    <Box>
      <Tabs
        value={value}
        onChange={(_, v) => setValue(v)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Valore per stakeholder"
        sx={{
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          '& .MuiTab-root': {
            color: 'var(--md-sys-color-on-surface-variant)',
            fontWeight: 'var(--md-sys-typescale-weight-medium)',
            textTransform: 'none',
          },
          '& .Mui-selected': {
            color: 'var(--md-sys-color-primary)',
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
          },
          '& .MuiTabs-indicator': {
            bgcolor: 'var(--md-sys-color-primary)',
          },
        }}
      >
        {STAKEHOLDERS.map((entry, i) => (
          <Tab
            key={entry.id}
            id={`stakeholder-tab-${entry.id}`}
            aria-controls={`stakeholder-panel-${entry.id}`}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <entry.Icon fontSize="small" aria-hidden />
                <span>{entry.label}</span>
              </Stack>
            }
            value={i}
          />
        ))}
      </Tabs>

      {STAKEHOLDERS.map((entry, i) => (
        <TabPanel key={entry.id} value={value} index={i} entry={entry} />
      ))}
    </Box>
  );
};

export default StakeholderTabs;
