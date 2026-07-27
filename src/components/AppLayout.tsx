// MD3 Gold Compliant
// App Shell: height-constrained flex column for proper scroll containment
// Fase 1: Desktop Navigation Rail + 5-voice model + secondary drawer
// Audit: 2026-07-25
import React from 'react';
import Box from '@mui/material/Box';
import BottomNav from './BottomNav';
import SecondaryNavDrawer from './SecondaryNavDrawer';
import NavigationRail from './NavigationRail';
import { Header } from './Header';
import { View, UserProfile, TimetableSettings, Notifica, BeforeInstallPromptEvent, NavigationParams } from '../types';
import { VIEW_LABELS } from './viewRegistry';
import '../design-system/app-layout-responsive.css';

interface AppLayoutProps {
  children: React.ReactNode;
  view: View;
  onNavigate: (view: View, context?: unknown) => void;
  user: UserProfile | null;
  settings: TimetableSettings;
  notifiche: Notifica[];
  setNotifiche: (input: Notifica[] | ((prev: Notifica[]) => Notifica[])) => void;
  onBack: () => void;
  canGoBack?: boolean;
  onOpenImageAnalysis: () => void;
  onOpenVideoAnalysis: () => void;
  onOpenHelp: () => void;
  onOpenCircularAnalysis: (url: string, title: string) => void;
  isAiProcessing: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallApp: () => void;
  onOpenOperations: () => void;
  hasSuggestion: boolean;
}

// === 5-VOICE CANONICAL NAV (Fase 1) ===
const CANONICAL_NAV_ITEMS = [
  { id: 'home' as View,              label: 'Oggi',      icon: 'home',            activeIcon: 'home' },
  { id: 'aula' as View,              label: 'Aula',      icon: 'groups',          activeIcon: 'groups' },
  { id: 'progettazione-hub' as View, label: 'Pianifica', icon: 'design_services', activeIcon: 'edit_document' },
  { id: 'analytics' as View,         label: 'Analisi',   icon: 'analytics',       activeIcon: 'bar_chart' },
  { id: 'assistente' as View,        label: 'Assistente',icon: 'auto_awesome',    activeIcon: 'auto_awesome' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  view,
  onNavigate,
  user,
  settings,
  notifiche,
  setNotifiche,
  onBack,
  canGoBack,
  onOpenImageAnalysis,
  onOpenVideoAnalysis,
  onOpenHelp,
  onOpenCircularAnalysis,
  isAiProcessing,
  installPrompt,
  onInstallApp,
  onOpenOperations,
  hasSuggestion,
}) => {
  const [mainNavOpen, setMainNavOpen] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  // Detect desktop for Rail vs BottomNav
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', update as any);
    return () => mq.removeEventListener('change', update as any);
  }, []);

  // Chiudi il drawer al cambio di vista
  React.useEffect(() => {
    setMainNavOpen(false);
  }, [view]);

  // Aggiorna document.title al cambio di view (accessibilità + SEO)
  React.useEffect(() => {
    const label = VIEW_LABELS[view] ?? view;
    document.title = view === 'home' ? 'DocenteDoc AI' : `${label} — DocenteDoc AI`;
  }, [view]);

  // NavigationRail items (exactly the 5 voices)
  const railItems = CANONICAL_NAV_ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    activeIcon: item.activeIcon,
  }));

  return (
    // Outer shell: full viewport height, no overflow — contains everything
    <Box className="app-shell-container" sx={{
      display: 'flex',
      flexDirection: 'column',
      height: 'var(--md-sys-viewport-height-dvh)',
      overflow: 'hidden',
      bgcolor: 'var(--md-sys-color-surface)',
    }}>
      {/* Header: static in flow, never overlaps content */}
      <Header
        showBackButton={canGoBack ?? (view !== 'home')}
        onBack={onBack}
        onOpenImageAnalysis={onOpenImageAnalysis}
        onOpenVideoAnalysis={onOpenVideoAnalysis}
        onOpenHelp={onOpenHelp}
        user={user}
        settings={settings}
        notifiche={notifiche}
        setNotifiche={setNotifiche}
        onOpenCircularAnalysis={onOpenCircularAnalysis}
        onNavigate={onNavigate}
        isAiProcessing={isAiProcessing}
        installPrompt={installPrompt}
        onInstallApp={onInstallApp}
        onOpenOperations={onOpenOperations}
        hasSuggestion={hasSuggestion}
        onOpenMore={() => setMainNavOpen(p => !p)}
        moreOpen={mainNavOpen}
        currentView={view}
      />

      {/* Desktop: flex row with Rail + Main content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Navigation Rail — desktop only (≥1024px) */}
        {isDesktop && (
          <Box
            sx={{
              width: 'var(--md-sys-spacing-20)', // 80px rail width (MD3 spec)
              flexShrink: 0,
              borderRight: '1px solid var(--md-sys-color-outline-variant)',
              bgcolor: 'var(--md-sys-color-surface)',
              overflowY: 'auto',
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <NavigationRail
              items={railItems}
              activeView={view}
              onNavigate={onNavigate}
              onOpenMore={() => setMainNavOpen(p => !p)}
              moreOpen={mainNavOpen}
            />
          </Box>
        )}

        {/* Main scrollable content */}
        <Box
          component="main"
          className="app-main-content"
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: 'var(--md-sys-color-surface)',
            pb: { xs: 'calc(var(--md-sys-spacing-14) + env(safe-area-inset-bottom, 0px))', lg: 0 },
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>

      {/* BottomNav: only visible on mobile/tablet (hidden via CSS + isDesktop) */}
      {!isDesktop && (
        <BottomNav
          activeView={view}
          onNavigate={(v) => onNavigate(v)}
          onOpenMore={() => setMainNavOpen(p => !p)}
          moreOpen={mainNavOpen}
        />
      )}

      {/* Unified Nav Drawer — secondary ("Altro") + full mapping */}
      <SecondaryNavDrawer
        open={mainNavOpen}
        onClose={() => setMainNavOpen(false)}
        onNavigate={(v) => onNavigate(v)}
        activeView={view}
      />
    </Box>
  );
};
