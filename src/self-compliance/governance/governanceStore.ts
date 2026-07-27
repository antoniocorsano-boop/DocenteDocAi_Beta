// governance/governanceStore.ts
// Zustand store persistente per la configurazione governance formale

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GovernanceConfig } from './types';

const DEFAULT: GovernanceConfig = {
  systemName:       'DocenteDoc AI',
  organizationName: 'Istituto Scolastico',
  version:          '1.0.0',
  lastReview:       new Date().toISOString().split('T')[0],
  dpo:              'Da nominare',
  aiOfficer:        'Da nominare',
  auditResponsible: 'Da nominare',
  processorName:    'Dirigente Scolastico',
};

type GovernanceState = {
  config:       GovernanceConfig;
  updateConfig: (partial: Partial<GovernanceConfig>) => void;
  resetConfig:  () => void;
};

export const useGovernanceStore = create<GovernanceState>()(
  persist(
    (set) => ({
      config:       DEFAULT,
      updateConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),
      resetConfig:  () => set({ config: DEFAULT }),
    }),
    { name: 'docente-doc-governance' },
  ),
);
