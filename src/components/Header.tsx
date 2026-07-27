// =============================
// MD3 GOLD COMPLIANT HEADER
// @mui-migrated Fase 2C
// =============================

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { HeaderProps, BeforeInstallPromptEvent, Notifica, View } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import Avatar from './ui/Avatar';
import Logo from './Logo';
import Breadcrumb from './Breadcrumb';
import { UserLevelBadge } from './journey';

interface ExtendedHeaderProps extends Omit<HeaderProps, 'onOpenImageAnalysis' | 'onOpenVideoAnalysis' | 'onOpenHelp' | 'onOpenCircularAnalysis' | 'setNotifiche' | 'installPrompt' | 'onInstallApp'> {
  onOpenImageAnalysis?: () => void;
  onOpenVideoAnalysis?: () => void;
  onOpenHelp?: () => void;
  onOpenCircularAnalysis?: (url: string, title: string) => void;
  setNotifiche?: React.Dispatch<React.SetStateAction<Notifica[]>>;
  installPrompt?: BeforeInstallPromptEvent | null;
  onInstallApp?: () => void;
  /** Apre il drawer secondario (voce «Altro» del menù principale) */
  onOpenMore?: () => void;
  /** Stato aperto/chiuso del drawer secondario */
  moreOpen?: boolean;
  /** View corrente — necessaria per il Breadcrumb */
  currentView?: View;
}

export const Header: React.FC<ExtendedHeaderProps> = ({
  showBackButton,
  onBack,
  user,
  settings,
  notifiche,
  onNavigate,
  isAiProcessing,
  hasSuggestion,
  onOpenOperations,
  onOpenMore,
  currentView,
}) => {
  const teacherName = settings?.nomeInsegnante || '';
  const teacherSurname = settings?.cognomeInsegnante || '';
  const isOnline = useOnlineStatus();
  const unreadCount = notifiche.filter(n => !n.letta).length;

  // Scroll elevation: tint header when main content is scrolled
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const main = document.querySelector('main, [data-scroll-content]');
    if (!main) return;
    const onScroll = () => setScrolled((main as HTMLElement).scrollTop > 4);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  // NOTE: className="material-symbols-outlined" is permitted for MD3 icon font usage only (see copilot-instructions.md)
  return (
    <AppBar
      component="header"
      role="banner"
      position="sticky"
      className="app-header-bar"
      elevation={scrolled ? 2 : 0}
      sx={{
        top: 0,
        zIndex: 'var(--md-sys-z-app-bar)',
        bgcolor: scrolled
          ? 'var(--md-sys-color-surface-container)'
          : 'var(--md-sys-color-surface)',
        borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-surface-container)',
        color: 'var(--md-sys-color-on-surface)',
        transition: [
          'background-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
          'box-shadow var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
        ].join(', '),
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 'var(--md-sys-spacing-14) !important', sm: 'var(--md-sys-spacing-16) !important' },
          px: 'var(--md-sys-spacing-4) !important',
          gap: 'var(--md-sys-spacing-1)',
        }}
      >
        {/* Logo: SEMPRE al primo posto — posizione fissa, non si sposta mai tra le schermate */}
        <Logo isAiThinking={isAiProcessing} onHomeNavigate={onOpenMore} />

        {/* Leading nav: Back + Quick Operations */}
        <Box component="nav" aria-label="Azioni principali" sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
          {showBackButton && (
            <IconButton
              aria-label="Indietro"
              onClick={onBack}
              sx={{ color: 'var(--md-sys-color-on-surface)' }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">arrow_back</Box>
            </IconButton>
          )}
          <IconButton
            aria-label="Operazioni rapide"
            onClick={onOpenOperations}
            sx={hasSuggestion ? {
              bgcolor: 'var(--md-sys-color-secondary-container)',
              color: 'var(--md-sys-color-on-secondary-container)',
              '&:hover': { bgcolor: 'color-mix(in srgb, var(--md-sys-color-secondary-container) 88%, var(--md-sys-color-on-secondary-container))' },
            } : { color: 'var(--md-sys-color-on-surface)' }}
          >
            <Box component="span" className="material-symbols-outlined" aria-hidden="true">bolt</Box>
          </IconButton>
        </Box>

        {/* Titolo / Breadcrumb — occupa lo spazio rimasto */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-2)', ml: 'var(--md-sys-spacing-1)', minWidth: 0 }}>
          {showBackButton && currentView ? (
            <Breadcrumb currentView={currentView} onNavigate={onNavigate} />
          ) : (
            <Typography
              variant="subtitle2"
              component="span"
              sx={{ color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              DocenteDoc
            </Typography>
          )}
        </Box>

        {/* Trailing: Status, Settings, Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--md-sys-spacing-1)' }}>
          {user && <UserLevelBadge />}
          <IconButton
            aria-label="Vai al portale DocenteDocAI"
            onClick={() => { window.location.href = '/landing'; }}
            title="Portale"
            sx={{ color: 'var(--md-sys-color-on-surface-variant)' }}
          >
            <Box component="span" className="material-symbols-outlined" aria-hidden="true">home</Box>
          </IconButton>
          {!isOnline && (
            <Box
              role="status"
              aria-label="Modalità Offline"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--md-sys-spacing-1)',
                px: 'var(--md-sys-spacing-2)',
                py: 'var(--md-sys-spacing-1)',
                borderRadius: 'var(--md-sys-shape-corner-large)',
                bgcolor: 'var(--md-sys-color-error-container)',
                color: 'var(--md-sys-color-on-error-container)',
              }}
            >
              <Box component="span" className="material-symbols-outlined" aria-hidden="true">cloud_off</Box>
              <Typography variant="caption" component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Offline</Typography>
            </Box>
          )}
          <IconButton
            aria-label="Menu utente"
            onClick={() => onNavigate('settings')}
            sx={{
              width: 'var(--md-sys-spacing-12)',
              aspectRatio: '1',
              borderRadius: 'var(--md-sys-shape-corner-full)',
              p: 0,
              position: 'relative',
            }}
          >
            <Avatar
              name={`${teacherSurname || ''} ${teacherName || 'Docente'}`.trim()}
              src={user?.photoURL}
              size="sm"
            />
            {unreadCount > 0 && (
              <Box
                component="span"
                aria-label={`${unreadCount} notifiche non lette`}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  minWidth: 'var(--md-sys-spacing-4)',
                  height: 'var(--md-sys-spacing-4)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  bgcolor: 'var(--md-sys-color-error)',
                  border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 'var(--md-sys-spacing-1)',
                }}
              >
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    color: 'var(--md-sys-color-on-error)',
                    lineHeight: 1,
                    // eslint-disable-next-line no-restricted-syntax -- sub-MD3-scale: 0.6rem intentional for compact notification badge (no token below label-small)
                    fontSize: '0.6rem',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Typography>
              </Box>
            )}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
