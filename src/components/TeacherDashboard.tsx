/**
 * TeacherDashboard.tsx — Dashboard principale del docente.
 *
 * Features:
 * - Sticky header M3Surface elevation=4 con GlobalProgressBar + 6 SectionBadge
 * - Class selector da useSettingsStore
 * - 6 tab lazy-loaded in Suspense (Orario, Classe, Didattica, Comunità, Innovazione AI, Finanziamenti)
 * - Onboarding modal trigger (localStorage flag docente_onboarding_v1)
 * - Accesso diretto agli store (no prop drilling)
 *
 * Props: onNavigate(view, context?)
 * MD3 Gold Compliant.
 */
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import M3Surface        from './ui/M3Surface';
import GlobalProgressBar from './copilot/maturita/GlobalProgressBar';
import SectionBadge      from './copilot/maturita/SectionBadge';
import TeacherOnboardingModal, { ONBOARDING_KEY } from './teacher-dashboard/TeacherOnboardingModal';
import { useAIMaturitaStore }  from '../stores/useAIMaturitaStore';
import { useStudentStore }     from '../stores/useStudentStore';
import { useSettingsStore }    from '../stores/useSettingsStore';
import type { View, NavigationParams } from '../types';
import ContextualAskAI from './ui/ContextualAskAI';

// ── Lazy tabs ─────────────────────────────────────────────────────────────────

const OrarioTab         = lazy(() => import('./teacher-dashboard/tabs/OrarioTab'));
const ClasseTab         = lazy(() => import('./teacher-dashboard/tabs/ClasseTab'));
const DidatticaTab      = lazy(() => import('./teacher-dashboard/tabs/DidatticaTab'));
const ComunitaTab       = lazy(() => import('./teacher-dashboard/tabs/ComunitaTab'));
const InnovazioneAITab  = lazy(() => import('./teacher-dashboard/tabs/InnovazioneAITab'));
const FinanziamentiTab  = lazy(() => import('./teacher-dashboard/tabs/FinanziamentiTab'));

// ── helpers ───────────────────────────────────────────────────────────────────

function tok(name: string) {
  return `var(--md-sys-color-${name})`;
}

const TAB_DEFS: { label: string; icon: string; ariaLabel: string }[] = [
  { label: 'Orario',        icon: 'schedule',       ariaLabel: 'Tab Orario lezioni'                },
  { label: 'Classe',        icon: 'groups',         ariaLabel: 'Tab Studenti e salute della classe' },
  { label: 'Didattica',     icon: 'auto_awesome',   ariaLabel: 'Tab Raccomandazioni AI didattica'  },
  { label: 'Comunità',      icon: 'people',         ariaLabel: 'Tab Consiglio di Classe'           },
  { label: 'Innovazione AI',icon: 'psychology',     ariaLabel: 'Tab Maturità AI'                   },
  { label: 'Finanziamenti', icon: 'savings',        ariaLabel: 'Tab Opportunità di finanziamento'  },
];

// ── TabPanel ──────────────────────────────────────────────────────────────────

interface TabPanelProps {
  value:    number;
  index:    number;
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`teacher-tabpanel-${index}`}
    aria-labelledby={`teacher-tab-${index}`}
    sx={{ pt: 'var(--md-sys-spacing-4)' }}
  >
    {value === index && (
      <Suspense
        fallback={
          <Box
            sx={{
              display:        'flex',
              justifyContent: 'center',
              alignItems:     'center',
              minHeight:      200,
            }}
          >
            <CircularProgress aria-label="Caricamento tab in corso" size={32} />
          </Box>
        }
      >
        {children}
      </Suspense>
    )}
  </Box>
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TeacherDashboardProps {
  onNavigate: (view: View, context?: NavigationParams) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab]       = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedClass, setSelectedClass]   = useState('');

  // ── Store selectors ────────────────────────────────────────────────────────
  const sections    = useAIMaturitaStore((s) => s.sections);
  const globalScore = useAIMaturitaStore((s) => s.globalScore);
  const students    = useStudentStore((s)    => s.students);
  const settings    = useSettingsStore((s)   => s.settings);

  // Derive available classes from settings + students
  const availableClasses = useMemo(() => {
    const fromSettings = settings.classi ?? [];
    const fromStudents = [...new Set(students.map((s) => s.classe).filter(Boolean))];
    const all = [...new Set([...fromSettings, ...fromStudents])].sort();
    return all;
  }, [settings.classi, students]);

  // Auto-select first class
  useEffect(() => {
    if (!selectedClass && availableClasses.length > 0) {
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  // Onboarding check on mount
  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShowOnboarding(true);
  }, []);

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newVal: number) => setActiveTab(newVal),
    []
  );

  const handleNavigate = useCallback(
    (view: View) => onNavigate(view),
    [onNavigate]
  );

  // Maturita section counts for SectionBadge tooltip
  const okCount = useMemo(
    () => sections.filter((s) => s.score >= 70).length,
    [sections]
  );

  return (
    <Box
      component="main"
      aria-label="Dashboard Docente"
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      {/* ── Sticky header ─────────────────────────────────────── */}
      <M3Surface
        elevation={4}
        component="header"
        aria-label="Intestazione dashboard docente"
        sx={{
          position: 'sticky',
          top:      0,
          zIndex:   100,
          px:       { xs: 'var(--md-sys-spacing-3)', md: 'var(--md-sys-spacing-6)' },
          py:       'var(--md-sys-spacing-3)',
          borderBottom: `1px solid ${tok('outline-variant')}`,
        }}
      >
        {/* Title row */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          mb="var(--md-sys-spacing-3)"
          flexWrap="wrap"
          useFlexGap
        >
          <Box
            component="span"
            className="material-symbols-outlined"
            aria-hidden="true"
            sx={{
              fontSize:             28,
              color:                tok('primary'),
              fontVariationSettings: '"FILL" 1',
              flexShrink:           0,
            }}
          >
            space_dashboard
          </Box>
          <Typography
            variant="titleLarge"
            component="h1"
            sx={{
              color:      tok('on-surface'),
              fontWeight: 'var(--md-sys-typescale-weight-bold)',
              flex:       1,
            }}
          >
            Dashboard Docente
          </Typography>

          {/* Class selector */}
          <FormControl size="small" aria-label="Seleziona classe">
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Classe selezionata' }}
              sx={{
                minWidth:     120,
                bgcolor:      tok('surface-container'),
                color:        tok('on-surface'),
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: tok('outline-variant') },
              }}
            >
              {availableClasses.length === 0 && (
                <MenuItem value="" disabled>
                  <em>Nessuna classe</em>
                </MenuItem>
              )}
              {availableClasses.map((cls) => (
                <MenuItem key={cls} value={cls}>
                  {cls}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Onboarding trigger */}
          <Tooltip title="Apri wizard di configurazione" arrow>
            <IconButton
              onClick={() => setShowOnboarding(true)}
              aria-label="Apri wizard di configurazione docente"
              size="small"
              sx={{
                color:     tok('on-surface-variant'),
                '&:hover': { bgcolor: tok('surface-container-high') },
              }}
            >
              <Box
                component="span"
                className="material-symbols-outlined"
                aria-hidden="true"
                sx={{ fontSize: 20 }}
              >
                tune
              </Box>
            </IconButton>
          </Tooltip>

          {/* Navigate shortcuts */}
          <Tooltip title="Vai a Lezioni" arrow>
            <IconButton
              onClick={() => handleNavigate('lessons')}
              aria-label="Vai alla sezione Lezioni"
              size="small"
              sx={{ color: tok('on-surface-variant'), '&:hover': { bgcolor: tok('surface-container-high') } }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>
                library_books
              </Box>
            </IconButton>
          </Tooltip>
          <Tooltip title="Vai a Valutazioni" arrow>
            <IconButton
              onClick={() => handleNavigate('evaluations')}
              aria-label="Vai alla sezione Valutazioni"
              size="small"
              sx={{ color: tok('on-surface-variant'), '&:hover': { bgcolor: tok('surface-container-high') } }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true" sx={{ fontSize: 20 }}>
                grade
              </Box>
            </IconButton>
          </Tooltip>

          {/* Contextual AI Button (Fase 2) */}
          <ContextualAskAI 
            onNavigate={onNavigate} 
            context={{ source: 'teacher-dashboard', classe: selectedClass }}
           
            compact
          />
        </Stack>

        {/* Global progress bar */}
        <Box sx={{ mb: 'var(--md-sys-spacing-3)', maxWidth: 600 }}>
          <GlobalProgressBar
            score={globalScore}
            sectionCount={sections.length}
            okCount={okCount}
          />
        </Box>

        {/* Section badges */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          aria-label="Badge sezioni Maturità AI"
        >
          {sections.map((section) => (
            <SectionBadge key={section.id} section={section} />
          ))}
        </Stack>
      </M3Surface>

      {/* ── Page body ─────────────────────────────────────────── */}
      <Box
        sx={{
          flex:    1,
          px:      { xs: 'var(--md-sys-spacing-3)', md: 'var(--md-sys-spacing-6)' },
          py:      'var(--md-sys-spacing-4)',
          maxWidth: 1200,
          width:   '100%',
          mx:      'auto',
        }}
      >
        {/* Tabs nav */}
        <M3Surface
          elevation={2}
          sx={{
            borderRadius: 'var(--md-sys-shape-corner-large)',
            overflow:     'hidden',
            mb:           'var(--md-sys-spacing-4)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Tab della Dashboard Docente"
            sx={{
              px:            'var(--md-sys-spacing-2)',
              '& .MuiTabs-indicator': {
                bgcolor:      tok('primary'),
                height:       3,
                borderRadius: 'var(--md-sys-shape-corner-full)',
              },
            }}
          >
            {TAB_DEFS.map((tab, idx) => (
              <Tab
                key={idx}
                id={`teacher-tab-${idx}`}
                aria-controls={`teacher-tabpanel-${idx}`}
                aria-label={tab.ariaLabel}
                icon={
                  <Box
                    component="span"
                    className="material-symbols-outlined"
                    aria-hidden="true"
                    sx={{
                      fontSize:             18,
                      fontVariationSettings: activeTab === idx ? '"FILL" 1' : '"FILL" 0',
                    }}
                  >
                    {tab.icon}
                  </Box>
                }
                label={tab.label}
                sx={{
                  color:      tok('on-surface-variant'),
                  fontWeight: 'var(--md-sys-typescale-weight-regular)',
                  '&.Mui-selected': {
                    color:      tok('primary'),
                    fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                  },
                  textTransform: 'none',
                  minHeight:     48,
                }}
              />
            ))}
          </Tabs>
        </M3Surface>

        {/* Tab panels */}
        <TabPanel value={activeTab} index={0}>
          <OrarioTab
            selectedClass={selectedClass}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ClasseTab
            selectedClass={selectedClass}
            showRisk
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <DidatticaTab selectedClass={selectedClass} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <ComunitaTab selectedClass={selectedClass} />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <InnovazioneAITab selectedClass={selectedClass} />
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <FinanziamentiTab selectedClass={selectedClass} />
        </TabPanel>
      </Box>

      {/* ── Onboarding ────────────────────────────────────────── */}
      <TeacherOnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </Box>
  );
};

export default TeacherDashboard;
