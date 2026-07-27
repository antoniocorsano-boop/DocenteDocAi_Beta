import { describe, it, expect } from 'vitest';
import { RegisterService, getRegisterImportGuidance, RegisterProvider } from '../../src/services/registerService';

describe('RegisterService Coverage', () => {
    const providers: RegisterProvider[] = ['argo', 'spaggiari', 'axios', 'sidi', 'generic'];

    describe('getRegisterImportGuidance', () => {
        it('should return guidance for all providers', () => {
            providers.forEach(provider => {
                const guidance = getRegisterImportGuidance(provider);
                expect(guidance.providerName).toBeDefined();
                expect(guidance.steps.length).toBeGreaterThan(0);
            });
        });

        it('should return default guidance for unknown provider', () => {
            // @ts-ignore
            const guidance = getRegisterImportGuidance('unknown');
            expect(guidance.providerName).toBe('Registro Elettronico');
        });
    });

    describe('RegisterService', () => {
        it('should return guidance as a string', () => {
            const guidance = RegisterService.getExportGuidance('argo');
            expect(typeof guidance).toBe('string');
            expect(guidance).toContain('Argo');
        });

        it('should return error for syncDirect', async () => {
            const result = await RegisterService.syncDirect({ provider: 'argo' });
            expect(result.errors[0]).toContain('non è ancora disponibile');
        });
    });
});
