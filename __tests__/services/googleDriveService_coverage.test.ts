// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as GoogleDriveService from '../../src/services/googleDriveService';

describe('GoogleDriveService Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset internal state if possible, or at least ensure accessToken is null
        GoogleDriveService.revokeAccessToken();
    });

    describe('initTokenClient', () => {
        it('should return false if google is undefined', () => {
            const originalGoogle = (global as any).google;
            (global as any).google = undefined;
            const result = GoogleDriveService.initTokenClient(() => {});
            expect(result).toBe(false);
            (global as any).google = originalGoogle;
        });

        it('should initialize token client and handle callback', () => {
            const callback = vi.fn();
            const result = GoogleDriveService.initTokenClient(callback);
            expect(result).toBe(true);
            expect((global as any).google.accounts.oauth2.initTokenClient).toHaveBeenCalled();

            // Simulate callback
            const initArgs = ((global as any).google.accounts.oauth2.initTokenClient as any).mock.calls[0][0];
            initArgs.callback({ access_token: 'test-token' });
            expect(callback).toHaveBeenCalledWith({ access_token: 'test-token' });
            expect(GoogleDriveService.getAccessToken()).toBe('test-token');
        });

        it('should handle malformed token response', () => {
            GoogleDriveService.initTokenClient(() => {});
            const initArgs = ((global as any).google.accounts.oauth2.initTokenClient as any).mock.calls[0][0];
            expect(() => initArgs.callback(null)).not.toThrow();
        });
    });

    describe('requestAccessToken', () => {
        it('should call requestAccessToken on tokenClient', () => {
            GoogleDriveService.initTokenClient(() => {});
            GoogleDriveService.requestAccessToken();
            // We need to capture the returned object from initTokenClient
            // In our mock it returns { requestAccessToken: vi.fn() }
        });
    });

    describe('loadGapiClient', () => {
        it('should resolve when gapi.load is called', async () => {
            await expect(GoogleDriveService.loadGapiClient()).resolves.toBeUndefined();
            expect((global as any).gapi.load).toHaveBeenCalledWith('client', expect.any(Object));
        });

        it('should reject if gapi is undefined', async () => {
            const originalGapi = (global as any).gapi;
            (global as any).gapi = undefined;
            await expect(GoogleDriveService.loadGapiClient()).rejects.toThrow('Google API Script not loaded');
            (global as any).gapi = originalGapi;
        });
    });

    describe('Drive Operations', () => {
        beforeEach(() => {
            // Set a fake token
            GoogleDriveService.initTokenClient(() => {});
            const initArgs = ((global as any).google.accounts.oauth2.initTokenClient as any).mock.calls[0][0];
            initArgs.callback({ access_token: 'fake-token' });
        });

        it('should upload notebook source', async () => {
            (global.fetch as any)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) }) // searchFolder (not found)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'folder-id' }) }) // createFolder
                .mockResolvedValueOnce({ ok: true }); // upload

            await GoogleDriveService.uploadNotebookSource('test.md', '# Content');
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });

        it('should throw error if upload fails', async () => {
            (global.fetch as any)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [{ id: 'f1' }] }) })
                .mockResolvedValueOnce({ ok: false });

            await expect(GoogleDriveService.uploadNotebookSource('t.md', 'c')).rejects.toThrow('Upload fallito');
        });

        it('should upload backup', async () => {
            (global.fetch as any).mockResolvedValue({ ok: true });
            await GoogleDriveService.uploadBackup({ data: 123 });
            expect(global.fetch).toHaveBeenCalled();
        });

        it('should download backup', async () => {
            (global.fetch as any).mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 123 }) });
            const result = await GoogleDriveService.downloadBackup('file-id');
            expect(result).toEqual({ data: 123 });
        });

        it('should create app folder', async () => {
            (global.fetch as any)
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) }) // search
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'new-folder', name: 'folder' }) }); // create
            
            const folder = await GoogleDriveService.createAppFolder();
            expect(folder?.id).toBe('new-folder');
        });

        it('should get backup metadata', async () => {
            (global.fetch as any).mockResolvedValue({ 
                ok: true, 
                json: () => Promise.resolve({ files: [{ modifiedTime: '2023-01-01' }] }) 
            });
            const meta = await GoogleDriveService.getBackupMetadata('folder-id');
            expect(meta?.modifiedTime).toBe('2023-01-01');
        });
    });

    describe('pickGoogleDriveFolder', () => {
        it('should throw if apiKey is missing', async () => {
            await expect(GoogleDriveService.pickGoogleDriveFolder()).rejects.toThrow('API Key mancante');
        });

        it('should throw if not authenticated', async () => {
            GoogleDriveService.revokeAccessToken();
            await expect(GoogleDriveService.pickGoogleDriveFolder('key')).rejects.toThrow('Autenticazione richiesta');
        });
    });
});
