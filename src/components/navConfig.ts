// Shared 5-voice navigation model (Fase 1)
// Single source of truth for BottomNav, NavigationRail, SecondaryNavDrawer PRIMARY
import { View } from '../types';

export interface NavItem {
  id: View;
  label: string;
  icon: string;
  activeIcon: string;
  /** Optional badge count (for notifications) */
  badge?: number;
}

export const FIVE_VOICE_NAV: NavItem[] = [
  { id: 'home',              label: 'Oggi',      icon: 'home',            activeIcon: 'home' },
  { id: 'aula',              label: 'Aula',      icon: 'groups',          activeIcon: 'groups' },
  { id: 'progettazione-hub', label: 'Pianifica', icon: 'design_services', activeIcon: 'edit_document' },
  { id: 'analytics',         label: 'Analisi',   icon: 'analytics',       activeIcon: 'bar_chart' },
  { id: 'assistente',        label: 'Assistente',icon: 'auto_awesome',    activeIcon: 'auto_awesome' },
];

// For drawer "Principale" section
export const PRIMARY_NAV_ITEMS = FIVE_VOICE_NAV.map(item => ({
  id: item.id,
  icon: item.icon,
}));
