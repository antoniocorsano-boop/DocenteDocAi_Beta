// MD3 Gold Compliant
// Active indicator: animated pill (scale + opacity) using spring expressive tokens.
// MD3 spec: pill 64×32dp, corner-full, secondary-container color.
import React, { useState } from 'react';
import { View } from '../types';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { FIVE_VOICE_NAV } from './navConfig';

interface BottomNavProps {
  activeView: View;
  onNavigate: (view: View) => void;
  /** Apre il drawer con tutte le sezioni secondarie */
  onOpenMore?: () => void;
  /** Indica se il drawer secondario è aperto */
  moreOpen?: boolean;
}

// 5 canonical voices (shared) + "Altro" entry
const navItems: { id: View | '__more__'; label: string; icon: string; activeIcon: string }[] = [
  ...FIVE_VOICE_NAV.map(item => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    activeIcon: item.activeIcon,
  })),
  { id: '__more__' as const, label: 'Altro', icon: 'more_horiz', activeIcon: 'menu_open' },
];

// Spring tokens for pill expansion — fast spatial for snappy feel
const SPRING_SPATIAL =
  'var(--md-sys-motion-spring-expressive-fast-spatial-duration) ' +
  'var(--md-sys-motion-spring-expressive-fast-spatial)';

const SPRING_EFFECTS =
  'var(--md-sys-motion-spring-expressive-fast-effects-duration) ' +
  'var(--md-sys-motion-spring-expressive-fast-effects)';

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate, onOpenMore, moreOpen = false }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <>
      <style>{`
        /* 1024px = var(--md-sys-breakpoint-desktop) — CSS custom properties cannot be used in @media queries */
        @media (min-width: 1024px) {
          .bottom-nav-container { display: none !important; }
        }
        /* Remove default button focus outline — replaced by MD3 state layer */
        .bottom-nav-item:focus-visible .bottom-nav-pill {
          outline: var(--md-sys-border-width-medium) solid var(--md-sys-color-primary);
          outline-offset: var(--md-sys-spacing-0-5);
        }
      `}</style>
      <Box
        component="nav"
        className="bottom-nav-container"
        aria-label="Navigazione principale"
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 'var(--md-sys-z-nav)',
          background: 'var(--md-sys-color-surface-container)',
          boxShadow: 'var(--md-sys-elevation-level2)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          padding: 'var(--md-sys-spacing-2) 0',
          paddingBottom: 'calc(var(--md-sys-spacing-2) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {navItems.map(item => {
          const isActive = item.id === '__more__' ? moreOpen : activeView === item.id;
          return (
            <ButtonBase
              key={item.id}
              className="bottom-nav-item"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              aria-expanded={item.id === '__more__' ? moreOpen : undefined}
              onClick={() => item.id === '__more__' ? onOpenMore?.() : onNavigate(item.id as View)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
                flex: 1,
                minHeight: 'var(--md-sys-spacing-14)',
                padding: 'var(--md-sys-spacing-2) 0',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Icon wrapper — pill lives here */}
              <span
                className="bottom-nav-pill"
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'var(--md-sys-spacing-16)',
                  height: 'var(--md-sys-spacing-8)',
                  borderRadius: 'var(--md-sys-shape-corner-full)',
                  backgroundColor: !isActive && hoveredId === item.id
                    ? 'var(--md-sys-color-surface-container-high)'
                    : 'transparent',
                  transition: `background-color ${SPRING_EFFECTS}`,
                }}
              >
                {/* Animated pill indicator */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'var(--md-sys-shape-corner-full)',
                    backgroundColor: 'var(--md-sys-color-secondary-container)',
                    transform: isActive ? 'scaleX(1) scaleY(1)' : 'scaleX(0) scaleY(0)',
                    opacity: isActive ? 1 : 0,
                    transition: [
                      `transform ${SPRING_SPATIAL}`,
                      `opacity ${SPRING_EFFECTS}`,
                    ].join(', '),
                    transformOrigin: 'center',
                  }}
                />
                {/* Icon — sits on top of pill via z-index */}
                <span
                  className="material-symbols-outlined"
                  aria-hidden="true"
                  style={{
                    position: 'relative',
                    zIndex: 'var(--md-sys-z-content)',
                    fontSize: 'var(--md-sys-spacing-6)', // 24px
                    color: isActive
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                    fontVariationSettings: isActive
                      ? '"FILL" 1, "wght" 600'
                      : '"FILL" 0, "wght" 400',
                    transition: [
                      `color ${SPRING_EFFECTS}`,
                      `font-variation-settings ${SPRING_EFFECTS}`,
                    ].join(', '),
                  }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </span>
              </span>


            </ButtonBase>
          );
        })}
      </Box>
    </>
  );
};

export default BottomNav;
