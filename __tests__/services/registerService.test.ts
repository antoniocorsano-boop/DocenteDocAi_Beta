import { describe, it, expect } from 'vitest';
import { getRegisterImportGuidance } from '../../src/services/registerService';

describe('registerService', () => {
  describe('getRegisterImportGuidance', () => {
    it('dovrebbe restituire la guida per Argo', () => {
      const guidance = getRegisterImportGuidance('argo');
      expect(guidance.providerName).toBe('Argo (DidUP)');
      expect(guidance.steps.length).toBeGreaterThan(0);
      expect(guidance.steps[0]).toContain('Argo');
    });

    it('dovrebbe restituire la guida per Spaggiari', () => {
      const guidance = getRegisterImportGuidance('spaggiari');
      expect(guidance.providerName).toBe('ClasseViva (Spaggiari)');
      expect(guidance.steps.length).toBeGreaterThan(0);
    });

    it('dovrebbe restituire la guida per Axios', () => {
      const guidance = getRegisterImportGuidance('axios');
      expect(guidance.providerName).toBe('Axios');
      expect(guidance.steps.length).toBeGreaterThan(0);
    });

    it('dovrebbe restituire la guida per SIDI', () => {
      const guidance = getRegisterImportGuidance('sidi');
      expect(guidance.providerName).toBe('SIDI / MIUR');
      expect(guidance.steps.length).toBeGreaterThan(0);
    });

    it('dovrebbe restituire una guida generica per provider sconosciuti', () => {
      const guidance = getRegisterImportGuidance('unknown' as any);
      expect(guidance.providerName).toBe('Registro Elettronico');
      expect(guidance.steps.length).toBeGreaterThan(0);
    });
  });
});
