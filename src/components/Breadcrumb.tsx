// MD3 Gold Compliant — nessun valore hardcoded, solo token MD3
// WCAG 2.4.8 Location (Level AAA): indica la posizione corrente nella navigazione

import React from 'react';
import { View, NavigationParams } from '../types';
import { VIEW_LABELS, VIEW_PARENT } from './viewRegistry';
import Typography from '@mui/material/Typography';

interface BreadcrumbProps {
  /** View corrente */
  currentView: View;
  /** Callback di navigazione */
  onNavigate: (view: View, context?: NavigationParams) => void;
}

interface BreadcrumbItem {
  view: View;
  label: string;
}

/**
 * Costruisce la lista di breadcrumb dal currentView risalendo via VIEW_PARENT.
 * Esempio: 'evaluations' → [Home, Classi, Valutazioni]
 */
function buildBreadcrumb(view: View): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  let current: View | undefined = view;

  // Risali la gerarchia
  while (current && current !== 'home') {
    items.unshift({ view: current, label: VIEW_LABELS[current] ?? current });
    current = VIEW_PARENT[current] as View | undefined;
  }

  // Aggiungi Home in testa solo se non siamo già su home
  if (view !== 'home') {
    items.unshift({ view: 'home', label: VIEW_LABELS['home'] });
  }

  return items;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentView, onNavigate }) => {
  const items = buildBreadcrumb(currentView);

  // Non mostrare breadcrumb sulla home o se c'è solo un elemento
  if (items.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--md-sys-spacing-1)',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.view}>
            {isLast ? (
              // Elemento corrente: non cliccabile, evidenziato
              <Typography
                variant="caption"
                component="span"
                aria-current="page"
                sx={{
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 'var(--md-sys-typescale-weight-semibold)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'calc(var(--md-sys-spacing-20) * 5)',
                }}
              >
                {item.label}
              </Typography>
            ) : (
              // Elemento precedente: cliccabile
              <button
                onClick={() => onNavigate(item.view)}
                aria-label={`Torna a ${item.label}`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 var(--md-sys-spacing-1)',
                  cursor: 'pointer',
                  borderRadius: 'var(--md-sys-shape-corner-extra-small)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    color: 'inherit',
                    fontWeight: 'var(--md-sys-typescale-weight-medium)',
                  }}
                >
                  {item.label}
                </Typography>
              </button>
            )}
            {/* Separatore MD3 */}
            {!isLast && (
              <span
                aria-hidden="true"
                className="material-symbols-outlined"
                style={{
                  fontSize: 'var(--md-sys-typescale-body-small-font-size)',
                  color: 'var(--md-sys-color-outline)',
                  flexShrink: 0,
                  userSelect: 'none',
                }}
              >
                chevron_right
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
