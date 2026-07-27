import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGoogleAIClient, callAiWithRetry, isAiConfigured } from '../../src/services/aiClient';

describe('AiClient Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    });

    describe('isAiConfigured', () => {
        it('should return true if API key is present', () => {
            expect(isAiConfigured()).toBe(true);
        });

        it('should return false if API key is missing', () => {
            vi.stubEnv('VITE_GEMINI_API_KEY', '');
            expect(isAiConfigured()).toBe(false);
        });
    });

    describe('callAiWithRetry', () => {
        it('should return result on success', async () => {
            const op = vi.fn().mockResolvedValue('success');
            const result = await callAiWithRetry(op);
            expect(result).toBe('success');
            expect(op).toHaveBeenCalledTimes(1);
        });

        it('should retry on 429 error', async () => {
            const op = vi.fn()
                .mockRejectedValueOnce({ status: 429, message: 'Quota exceeded' })
                .mockResolvedValueOnce('success');
            
            const result = await callAiWithRetry(op, 1, 10);
            expect(result).toBe('success');
            expect(op).toHaveBeenCalledTimes(2);
        });

        it('should throw after max retries', async () => {
            const op = vi.fn().mockRejectedValue({ status: 429, message: 'Quota exceeded' });
            await expect(callAiWithRetry(op, 1, 10)).rejects.toThrow('Limite di utilizzo AI raggiunto. Riprova più tardi.');
            expect(op).toHaveBeenCalledTimes(2);
        });

        it('should not retry on non-retryable error', async () => {
            const op = vi.fn().mockRejectedValue({ status: 400, message: 'Bad Request' });
            await expect(callAiWithRetry(op)).rejects.toThrow('Si è verificato un errore imprevisto. Riprova.');
            expect(op).toHaveBeenCalledTimes(1);
        });
    });
});
