// runtime/audit/auditTrailStore.ts
// Zustand store persistente per la storia degli audit PA.
// Conserva i run in localStorage — survives page reload.

import { create }  from "zustand";
import { persist } from "zustand/middleware";
import type { AuditRun } from "./types";

/** Numero massimo di run conservati — i più vecchi vengono scartati */
const MAX_RUNS = 50;

type AuditTrailState = {
  runs:         AuditRun[];
  addRun:       (run: AuditRun) => void;
  clearHistory: () => void;
};

/**
 * Store persistente della storia degli audit PA.
 * I run sono ordinati con il più recente in testa (index 0).
 */
export const useAuditTrailStore = create<AuditTrailState>()(
  persist(
    (set) => ({
      runs: [],

      addRun: (run) =>
        set(state => ({
          runs: [run, ...state.runs].slice(0, MAX_RUNS),
        })),

      clearHistory: () => set({ runs: [] }),
    }),
    {
      name: "docente-doc-audit-trail",
    },
  ),
);
