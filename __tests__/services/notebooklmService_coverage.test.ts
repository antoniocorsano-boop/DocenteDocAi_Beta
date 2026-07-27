
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as notebooklmService from '../../src/services/notebooklmService';
import * as googleDriveService from '../../src/services/googleDriveService';

// Mock googleDriveService
vi.mock('../../src/services/googleDriveService', () => ({
    getAccessToken: vi.fn()
}));

// Mock global fetch
global.fetch = vi.fn();

describe('notebooklmService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadNotebookFile', () => {
        it('should fallback to local save if not authenticated', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue(null);
            const file = {
                name: 'test.txt',
                type: 'text/plain',
                text: vi.fn().mockResolvedValue('test content')
            } as any;
            
            const result = await notebooklmService.uploadNotebookFile(file);
            
            expect(result.id).toContain('nb-local-');
            expect(result.content).toBe('test content');
            expect(result.status).toBe('ready');
        });

        it('should upload to API if authenticated', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue('fake-token');
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ documentId: 'remote-id', notebookId: 'nb-id' })
            });
            
            const file = {
                name: 'test.txt',
                type: 'text/plain',
                text: vi.fn().mockResolvedValue('test content')
            } as any;
            const result = await notebooklmService.uploadNotebookFile(file);
            
            expect(result.id).toBe('remote-id');
            expect(result.status).toBe('processing');
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('upload'), expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'Authorization': 'Bearer fake-token' })
            }));
        });

        it('should handle API error', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue('fake-token');
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });
            
            const file = {
                name: 'test.txt',
                type: 'text/plain',
                text: vi.fn().mockResolvedValue('test content')
            } as any;
            await expect(notebooklmService.uploadNotebookFile(file)).rejects.toThrow('Errore durante upload');
        });
    });

    describe('fetchNotebookFiles', () => {
        it('should return empty array if not authenticated', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue(null);
            const result = await notebooklmService.fetchNotebookFiles();
            expect(result).toEqual([]);
        });

        it('should return files from API', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue('fake-token');
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    documents: [
                        { documentId: '1', displayName: 'Doc 1', processingState: 'READY' },
                        { documentId: '2', name: 'Doc 2', processingState: 'PROCESSING' }
                    ]
                })
            });
            
            const result = await notebooklmService.fetchNotebookFiles();
            
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('1');
            expect(result[0].status).toBe('ready');
            expect(result[1].status).toBe('processing');
        });
    });

    describe('deleteNotebookFile', () => {
        it('should call DELETE API', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue('fake-token');
            (global.fetch as any).mockResolvedValue({ ok: true });
            
            await notebooklmService.deleteNotebookFile('123');
            
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('123'), expect.objectContaining({
                method: 'DELETE'
            }));
        });
    });

    describe('syncNotebookFiles', () => {
        it('should skip if not authenticated', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue(null);
            const getLocal = vi.fn();
            const saveLocal = vi.fn();
            
            await notebooklmService.syncNotebookFiles(getLocal, saveLocal);
            
            expect(getLocal).not.toHaveBeenCalled();
        });

        it('should sync files without conflicts', async () => {
            (googleDriveService.getAccessToken as any).mockResolvedValue('fake-token');
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ documents: [{ documentId: 'remote-1', displayName: 'Remote 1' }] })
            });
            
            const localFiles = [{ id: 'local-1', name: 'Local 1', content: 'C1', lastModified: 'T1', status: 'ready' }];
            const getLocal = vi.fn().mockResolvedValue(localFiles);
            const saveLocal = vi.fn().mockResolvedValue(undefined);
            
            await notebooklmService.syncNotebookFiles(getLocal, saveLocal as any);
            
            expect(saveLocal).toHaveBeenCalled();
            const savedFiles = saveLocal.mock.calls[0][0];
            expect(savedFiles.some((f: any) => f.id === 'remote-1')).toBe(true);
        });
    });
});
