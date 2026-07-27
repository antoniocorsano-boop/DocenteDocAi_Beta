import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  uploadNotebookFile, 
  fetchNotebookFiles, 
  deleteNotebookFile, 
  syncNotebookFiles, 
  isNotebookLMAuthenticated 
} from '../../src/services/notebooklmService';
import * as googleDriveService from '../../src/services/googleDriveService';

// Mock fetch
global.fetch = vi.fn();

// Polyfill for File.text() if missing in test environment
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function() {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(this);
    });
  };
}

// Mock googleDriveService
vi.mock('../../src/services/googleDriveService', () => ({
  getAccessToken: vi.fn()
}));

describe('notebooklmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadNotebookFile', () => {
    it('should upload a file when authenticated', async () => {
      const mockToken = 'mock-token';
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = { documentId: 'doc-123', notebookId: 'nb-456' };

      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue(mockToken);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await uploadNotebookFile(mockFile);

      expect(result.id).toBe('doc-123');
      expect(result.status).toBe('processing');
      expect(result.name).toBe('test.txt');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notebooks/documents:upload'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Authorization': `Bearer ${mockToken}` }
        })
      );
    });

    it('should fallback to local storage when not authenticated', async () => {
      const mockFile = new File(['local content'], 'local.txt', { type: 'text/plain' });
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue(null);

      const result = await uploadNotebookFile(mockFile);

      expect(result.id).toContain('nb-local-');
      expect(result.status).toBe('ready');
      expect(result.content).toBe('local content');
    });

    it('should throw error on API failure', async () => {
      const mockFile = new File(['content'], 'test.txt');
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('token');
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(uploadNotebookFile(mockFile)).rejects.toThrow('Errore durante upload: HTTP 500: Internal Server Error');
    });
  });

  describe('fetchNotebookFiles', () => {
    it('should fetch files when authenticated', async () => {
      const mockToken = 'mock-token';
      const mockApiResponse = {
        documents: [
          { documentId: '1', displayName: 'Doc 1', updateTime: '2023-01-01T00:00:00Z', processingState: 'READY' },
          { documentId: '2', name: 'Doc 2', createTime: '2023-01-02T00:00:00Z', processingState: 'PROCESSING' }
        ]
      };

      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue(mockToken);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      } as Response);

      const files = await fetchNotebookFiles();

      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('Doc 1');
      expect(files[0].status).toBe('ready');
      expect(files[1].name).toBe('Doc 2');
      expect(files[1].status).toBe('processing');
    });

    it('should return empty array when not authenticated', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue(null);
      const files = await fetchNotebookFiles();
      expect(files).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('valid-token');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(fetchNotebookFiles()).rejects.toThrow('Errore durante fetch: HTTP 401: Unauthorized');
    });

    it('should handle non-Error objects in catch block', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('valid-token');
      global.fetch = vi.fn().mockRejectedValue('string error');

      await expect(fetchNotebookFiles()).rejects.toThrow('Errore durante fetch: Errore sconosciuto');
    });
  });

  describe('deleteNotebookFile', () => {
    it('should delete file when authenticated', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('token');
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      await deleteNotebookFile('doc-123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notebooks/documents/doc-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should return early when not authenticated', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue(null);
      await deleteNotebookFile('doc-123');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error on API failure', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('token');
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(deleteNotebookFile('doc-123')).rejects.toThrow('Errore durante delete: HTTP 404: Not Found');
    });
  });

  describe('isNotebookLMAuthenticated', () => {
    it('should return true when token exists', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('token');
      expect(await isNotebookLMAuthenticated()).toBe(true);
    });

    it('should return false when token is null', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue(null);
      expect(await isNotebookLMAuthenticated()).toBe(false);
    });
  });

  describe('syncNotebookFiles', () => {
    const mockLocalFiles = [
      { id: '1', name: 'Local 1', content: 'local content 1', lastModified: '2023-01-01T00:00:00Z', status: 'ready' as const },
      { id: '2', name: 'Local 2', content: 'local content 2', lastModified: '2023-01-01T00:00:00Z', status: 'ready' as const }
    ];

    it('should sync files when authenticated', async () => {
      const mockRemoteFiles = {
        documents: [
          { documentId: '1', displayName: 'Remote 1', updateTime: '2023-01-02T00:00:00Z', processingState: 'READY' }, // Newer
          { documentId: '3', displayName: 'Remote 3', updateTime: '2023-01-01T00:00:00Z', processingState: 'READY' }  // New file
        ]
      };

      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('token');
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockRemoteFiles
      } as Response);

      const getLocalFiles = vi.fn().mockResolvedValue(mockLocalFiles);
      const saveLocalFiles = vi.fn().mockResolvedValue(undefined);

      await syncNotebookFiles(getLocalFiles, saveLocalFiles);

      expect(saveLocalFiles).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: '1', name: 'Remote 1' }), // Updated from remote
        expect.objectContaining({ id: '2', name: 'Local 2' }),  // Kept local
        expect.objectContaining({ id: '3', name: 'Remote 3' })  // Added remote
      ]));
    });

    it('should handle conflicts using the handler', async () => {
      const mockRemoteFiles = {
        documents: [
          { documentId: '1', displayName: 'Remote 1', updateTime: '2023-01-02T00:00:00Z', processingState: 'READY' }
        ]
      };

      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('token');
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockRemoteFiles
      } as Response);

      const getLocalFiles = vi.fn().mockResolvedValue([{ 
        id: '1', name: 'Local 1', content: 'local content', lastModified: '2023-01-01T00:00:00Z', status: 'ready' 
      }]);
      const saveLocalFiles = vi.fn().mockResolvedValue(undefined);
      const handleConflict = vi.fn().mockResolvedValue('remote');

      await syncNotebookFiles(getLocalFiles, saveLocalFiles, handleConflict);

      expect(handleConflict).toHaveBeenCalled();
      expect(saveLocalFiles).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: '1', name: 'Remote 1' })
      ]));
    });

    it('should return early when not authenticated', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue(null);
      const saveLocalFiles = vi.fn();
      await syncNotebookFiles(vi.fn(), saveLocalFiles);
      expect(saveLocalFiles).not.toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      vi.mocked(googleDriveService.getAccessToken).mockResolvedValue('valid-token');
      // Force an error by making fetch throw
      global.fetch = vi.fn().mockRejectedValue(new Error('Sync failed'));
      
      await expect(syncNotebookFiles(vi.fn(), vi.fn()))
        .rejects.toThrow('Errore durante sync: Errore durante fetch: Sync failed');
    });
  });
});
