// src/hooks/useCertification.ts
// React hook per il Certification Package

import { useState, useCallback } from "react";
import { generateCertificationPackage } from "../self-compliance/certification/certificationPackage";
import type { CertificationPackage } from "../self-compliance/certification/types";

export type UseCertificationReturn = {
  /** Pacchetto di certificazione corrente (null se non ancora generato). */
  pkg: CertificationPackage | null;
  /** True durante la generazione sincrona. */
  generating: boolean;
  /** Genera (o rigenera) il pacchetto completo. */
  generatePackage: () => void;
  /** Esporta il pacchetto come stringa JSON indentata. */
  exportAsJSON: () => string;
  /** Scorciatoie per le sezioni più usate nella UI. */
  score: CertificationPackage["certificationScore"] | null;
  gapAnalysis: CertificationPackage["gapAnalysis"] | null;
  aiActClassification: CertificationPackage["aiActClassification"] | null;
};

export function useCertification(): UseCertificationReturn {
  const [pkg, setPkg] = useState<CertificationPackage | null>(null);
  const [generating, setGenerating] = useState(false);

  const generatePackage = useCallback(() => {
    setGenerating(true);
    try {
      const result = generateCertificationPackage();
      setPkg(result);
    } finally {
      setGenerating(false);
    }
  }, []);

  const exportAsJSON = useCallback((): string => {
    if (!pkg) return "{}";
    return JSON.stringify(pkg, null, 2);
  }, [pkg]);

  return {
    pkg,
    generating,
    generatePackage,
    exportAsJSON,
    score: pkg?.certificationScore ?? null,
    gapAnalysis: pkg?.gapAnalysis ?? null,
    aiActClassification: pkg?.aiActClassification ?? null,
  };
}
