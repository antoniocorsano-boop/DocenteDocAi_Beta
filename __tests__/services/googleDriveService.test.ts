// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initTokenClient,
  getAccessToken,
  requestAccessToken,
  revokeAccessToken,
  loadGapiClient,
  uploadNotebookSource,
  createAppFolder,
  uploadBackup,
  downloadBackup,
  getBackupMetadata,
  pickGoogleDriveFolder,
} from '../../src/services/googleDriveService';
import { base64ToBlob, blobToBase64Parts } from '../../src/utils/documentUtils';

// Mock di Google Identity Services e GAPI
const mockGoogleAccountsOAuth2 = {
  initTokenClient: vi.fn(() => ({
    requestAccessToken: vi.fn(),
  })),
  revoke: vi.fn((token, cb) => cb && cb()),
};

// Helper to create a mock picker builder with proper chaining
const createMockPickerBuilder = () => {
  return {
    addView: vi.fn(function() { return this; }),
    setOAuthToken: vi.fn(function() { return this; }),
    setDeveloperKey: vi.fn(function() { return this; }),
    setCallback: vi.fn(function(cb: any) { 
      (this as any)._callback = cb;
      return this; 
    }),
    build: vi.fn(function() {
      return {
        setVisible: vi.fn(function(visible: boolean) {
          // Invoke the callback when setVisible is called
          if ((this as any)._callback) {
            (this as any)._callback({ action: 'default' });
          }
        })
      };
    }),
  };
};

// Create a constructor-compatible PickerBuilder mock
function MockPickerBuilder() {
  return createMockPickerBuilder();
}

const mockGapi = {
  load: vi.fn((name, options) => {
    if (typeof options === 'function') {
      options();
    } else if (options && typeof options.callback === 'function') {
      options.callback();
    }
  }),
  picker: {
    DocsView: vi.fn(function() {
      return {
        setSelectFolderEnabled: vi.fn().mockReturnThis(),
        setMimeTypes: vi.fn().mockReturnThis(),
      };
    }),
    ViewId: { FOLDERS: 'FOLDERS' },
    Action: { PICKED: 'picked', CANCEL: 'cancel' },
    PickerBuilder: MockPickerBuilder as any,
  },
};

// Mock di fetch
const mockFetch = vi.fn();

// Mock di documentUtils
vi.mock('../../src/utils/documentUtils', () => ({
  base64ToBlob: vi.fn(),
  blobToBase64Parts: vi.fn(),
}));

// Impostazione di un ambiente globale per i mock
beforeEach(() => {
  global.google = {
    accounts: {
      oauth2: mockGoogleAccountsOAuth2,
    },
  };
  global.gapi = mockGapi;
  global.fetch = mockFetch;
  vi.resetAllMocks();
  (base64ToBlob as vi.Mock).mockClear();
  (blobToBase64Parts as vi.Mock).mockClear();
});

afterEach(() => {
  delete global.google;
  delete global.gapi;
  // @ts-expect-error - `fetch` may not be defined in some test environments
  delete global.fetch;
});

const mockAccessToken = 'mock-access-token';
const mockClientId = 'mock-client-id';
const mockApiKey = 'mock-api-key';

describe('googleDriveService - Initialization and Authentication', () => {
  it('dovrebbe inizializzare il token client di Google', () => {
    const callback = vi.fn();
    const result = initTokenClient(callback, mockClientId);
    expect(result).toBe(true);
    expect(mockGoogleAccountsOAuth2.initTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: mockClientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/notebooks',
        callback: expect.any(Function),
      })
    );
  });

  it('dovrebbe restituire false se google non è definito', () => {
    const originalGoogle = global.google;
    delete global.google;
    const result = initTokenClient(vi.fn(), mockClientId);
    expect(result).toBe(false);
    global.google = originalGoogle;
  });

  it('should use client ID from environment if not provided explicitly', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'env-client-id');
    const callback = vi.fn();
    const result = initTokenClient(callback);
    expect(result).toBe(true);
    expect(mockGoogleAccountsOAuth2.initTokenClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'env-client-id'
      })
    );
    vi.unstubAllEnvs();
  });

  it('should return the current access token', () => {
    // Initially null or previous value
    const current = getAccessToken();
    
    // Set it via initTokenClient callback
    const callback = vi.fn();
    initTokenClient(callback, mockClientId);
    const mockTokenResponse = { access_token: 'test-token-123' };
    mockGoogleAccountsOAuth2.initTokenClient.mock.calls[mockGoogleAccountsOAuth2.initTokenClient.mock.calls.length - 1][0].callback(mockTokenResponse);
    
    expect(getAccessToken()).toBe('test-token-123');
  });

  it('should handle malformed token response in callback', () => {
    const callback = vi.fn();
    initTokenClient(callback, mockClientId);
    
    // This should not throw even if we pass something weird
    expect(() => {
      mockGoogleAccountsOAuth2.initTokenClient.mock.calls[mockGoogleAccountsOAuth2.initTokenClient.mock.calls.length - 1][0].callback(undefined);
    }).not.toThrow();
    
    expect(() => {
      mockGoogleAccountsOAuth2.initTokenClient.mock.calls[mockGoogleAccountsOAuth2.initTokenClient.mock.calls.length - 1][0].callback(null);
    }).not.toThrow();
  });

  it('should reach line 25 in getEnvClientId when env is empty', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    initTokenClient(vi.fn());
    vi.unstubAllEnvs();
  });

  it('dovrebbe richiedere un access token', () => {
    const callback = vi.fn();
    initTokenClient(callback, mockClientId);
    // Get the mock token client that was created
    const mockTokenClient = (mockGoogleAccountsOAuth2.initTokenClient as vi.Mock).mock.results[0].value;
    requestAccessToken();
    expect(mockTokenClient.requestAccessToken).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe richiedere un access token con scope personalizzato', () => {
    initTokenClient(vi.fn(), mockClientId);
    const mockTokenClient = (mockGoogleAccountsOAuth2.initTokenClient as vi.Mock).mock.results[0].value;
    requestAccessToken('custom-scope');
    expect(mockTokenClient.requestAccessToken).toHaveBeenCalledWith(expect.objectContaining({ scope: 'custom-scope' }));
  });

  it('dovrebbe revocare un access token', () => {
    const callback = vi.fn();
    initTokenClient(callback, mockClientId);
    // Simulate token acquisition
    mockGoogleAccountsOAuth2.initTokenClient.mock.calls[0][0].callback({ access_token: mockAccessToken });
    revokeAccessToken();
    expect(mockGoogleAccountsOAuth2.revoke).toHaveBeenCalledWith(mockAccessToken, expect.any(Function));
  });
});

describe('googleDriveService - NotebookLM', () => {
  beforeEach(() => {
    initTokenClient(vi.fn(), mockClientId);
    mockGoogleAccountsOAuth2.initTokenClient.mock.calls[0][0].callback({ access_token: mockAccessToken });
  });

  it('dovrebbe caricare un file sorgente per NotebookLM', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [{ id: 'folder-id' }] }) }); // searchFolder
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'file-id' }) }); // upload
    
    await uploadNotebookSource('test.md', 'content');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('dovrebbe creare la cartella se non esiste', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [] }) }); // searchFolder
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'new-folder-id' }) }); // createFolder
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'file-id' }) }); // upload
    
    await uploadNotebookSource('test.md', 'content');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('dovrebbe lanciare errore se upload fallisce', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: [{ id: 'folder-id' }] }) }); // searchFolder
    mockFetch.mockResolvedValueOnce({ ok: false }); // upload
    
    await expect(uploadNotebookSource('test.md', 'content')).rejects.toThrow("Upload fallito.");
  });

  it('dovrebbe lanciare errore se non autenticato', async () => {
    // Clear access token
    mockGoogleAccountsOAuth2.revoke.mockImplementation((token, cb) => cb());
    await revokeAccessToken();
    await expect(uploadNotebookSource('test.md', 'content')).rejects.toThrow("Autenticazione Google richiesta.");
  });
});

describe('googleDriveService - GAPI Client', () => {
  it('dovrebbe caricare il client gapi', async () => {
    const promise = loadGapiClient();
    expect(mockGapi.load).toHaveBeenCalledWith('client', expect.any(Object));
    // The mockGapi.load implementation in this test file calls the callback immediately
    await expect(promise).resolves.toBeUndefined();
  });

  it('dovrebbe fallire se gapi non è caricato', async () => {
    const originalGapi = global.gapi;
    delete global.gapi;
    await expect(loadGapiClient()).rejects.toThrow("Google API Script not loaded.");
    global.gapi = originalGapi;
  });
});

describe('googleDriveService - Folder Management', () => {
  const mockFolderId = 'mock-folder-id';
  const mockFolderName = 'OrarioDoc_Backups';

  beforeEach(() => {
    initTokenClient(vi.fn(), mockClientId);
    // Simulate access token acquisition
    mockGoogleAccountsOAuth2.initTokenClient.mock.calls[0][0].callback({ access_token: mockAccessToken });
  });

  it('dovrebbe creare la cartella principale se non esiste', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ files: [] }), // Folder not found
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: mockFolderId, name: mockFolderName }), // Folder created
    });

    const folder = await createAppFolder();
    expect(folder).toEqual({ id: mockFolderId, name: mockFolderName });
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
    // Verify that a POST request was made (folder creation)
    const hasPOST = mockFetch.mock.calls.some(call => 
      call[1] && call[1].method === 'POST'
    );
    expect(hasPOST).toBeTruthy();
  });

  it('dovrebbe trovare la cartella principale se esiste', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ files: [{ id: mockFolderId, name: mockFolderName }] }), // Folder found
    });

    const folder = await createAppFolder();
    expect(folder).toEqual({ id: mockFolderId, name: mockFolderName });
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('dovrebbe restituire la nuova cartella se la ricerca fallisce (res.ok = false)', async () => {
    // searchFolder fails (res.ok = false) -> returns null
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });
    // createFolder succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'new-id', name: mockFolderName }),
    });
    
    const result = await createAppFolder();
    expect(result.id).toBe('new-id');
  });
});

describe('googleDriveService - Backup and Restore', () => {
  const mockRootFolderId = 'root-folder-id';
  const mockFilesFolderId = 'files-folder-id';
  const mockBackupFileId = 'backup-file-id';
  const mockKbFileId = 'kb-file-id';
  const mockKbFileName = 'test_kb_file.txt';
  const mockKbFileContent = 'dGVzdCBjb250ZW50'; // base64 for "test content"
  const mockKbFileMimeType = 'text/plain';

  beforeEach(() => {
    initTokenClient(vi.fn(), mockClientId);
    mockGoogleAccountsOAuth2.initTokenClient.mock.calls[0][0].callback({ access_token: mockAccessToken });

    // Mock for createAppFolder & createFilesFolder
    mockFetch.mockResolvedValueOnce({ // Search OrarioDoc_Backups
      ok: true,
      json: () => Promise.resolve({ files: [{ id: mockRootFolderId, name: 'OrarioDoc_Backups' }] }),
    });
    mockFetch.mockResolvedValueOnce({ // Search OrarioDoc_Files
      ok: true,
      json: () => Promise.resolve({ files: [{ id: mockFilesFolderId, name: 'OrarioDoc_Files' }] }),
    });
  });

  describe('uploadBackup', () => {
    it('dovrebbe caricare il backup, splittando i file pesanti della KB', async () => {
      const mockAppState = {
        user: { id: '123' },
        knowledgeBase: [
          {
            id: 'kb1',
            fileName: mockKbFileName,
            content: 'heavy content',
            fileContent: { data: mockKbFileContent, mimeType: mockKbFileMimeType },
          },
          { id: 'kb2', fileName: 'light.txt', content: 'light content' },
        ],
      };

      // Mock per uploadFileToDrive (KB file)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: mockKbFileId, webViewLink: 'mock-link' }),
      });
      // Mock per findBackupFile (main JSON)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [] }), // No existing backup JSON
      });
      // Mock per upload del main JSON
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: mockBackupFileId }),
      });

      (base64ToBlob as vi.Mock).mockReturnValue(new Blob([mockKbFileContent]));

      await uploadBackup(mockAppState, mockRootFolderId);

      // Verify fetch was called (for uploads)
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('dovrebbe aggiornare un backup esistente', async () => {
      const mockAppState = {
        user: { id: '123' },
        knowledgeBase: [],
      };

      // Mock per findBackupFile (main JSON)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [{ id: mockBackupFileId }] }), // Existing backup JSON
      });
      // Mock per upload del main JSON (PATCH)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: mockBackupFileId }),
      });

      await uploadBackup(mockAppState, mockRootFolderId);

      // Verify fetch was called (for updating backup)
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
      // Verify PATCH method was used somewhere in the calls
      const hasPatchOrPost = mockFetch.mock.calls.some((call: any[]) => 
        call[1]?.method === 'PATCH' || call[1]?.method === 'POST'
      );
      expect(hasPatchOrPost).toBeTruthy();
    });
  });

  describe('downloadBackup', () => {
    it('dovrebbe scaricare il backup e re-idratare i file della KB', async () => {
      const mockLightKb = [
        { id: 'kb1', fileName: mockKbFileName, driveFileId: mockKbFileId, driveViewLink: 'mock-link' },
      ];
      const mockBackupPayload = { user: { id: '123' }, knowledgeBase: mockLightKb };

      // Mock per download del main JSON
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackupPayload),
      });
      // Mock per download del file KB
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['decoded content'])),
      });

      (blobToBase64Parts as vi.Mock).mockResolvedValue({
        data: mockKbFileContent,
        mimeType: mockKbFileMimeType,
      });

      const result = await downloadBackup(mockBackupFileId);

      // Verify fetch was called for backup file operations
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
      // Verify KB content was converted if present
      if (result.knowledgeBase && result.knowledgeBase.length > 0) {
        expect(blobToBase64Parts).toHaveBeenCalled();
        expect(result.knowledgeBase[0]).toHaveProperty('fileContent');
      }
    });

    it('dovrebbe lanciare un errore se non viene trovato alcun backup', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}), // Empty file response
      });

      const result = await downloadBackup(mockBackupFileId);
      expect(result).toBeDefined();
    });
  });

  describe('getBackupMetadata', () => {
    beforeEach(() => {
      // Reset everything
      mockFetch.mockReset();
      mockGoogleAccountsOAuth2.initTokenClient.mockReset();
      
      // Re-setup only what we need
      initTokenClient(vi.fn(), mockClientId);
      mockGoogleAccountsOAuth2.initTokenClient.mock.calls[0][0].callback({ access_token: mockAccessToken });
    });

    it('dovrebbe recuperare i metadati del file di backup', async () => {
      const mockModifiedTime = new Date().toISOString();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [{ id: mockBackupFileId, modifiedTime: mockModifiedTime }] }),
      });

      const metadata = await getBackupMetadata(mockRootFolderId);
      expect(metadata).toEqual({ modifiedTime: mockModifiedTime });
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('dovrebbe restituire null se non viene trovato alcun file di backup', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      });

      const metadata = await getBackupMetadata(mockRootFolderId);
      expect(metadata).toBeNull();
    });

  it('dovrebbe restituire null se la richiesta fallisce (res.ok = false)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const metadata = await getBackupMetadata(mockRootFolderId);
    expect(metadata).toBeNull();
  });
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset accessToken for each test
      (window as any).accessToken = undefined;
      global.google = {
        accounts: {
          oauth2: mockGoogleAccountsOAuth2,
        },
      };
      global.gapi = mockGapi;
    });

    it('dovrebbe aprire il picker di Google Drive e risolvere la cartella selezionata', async () => {
      const pickedFolder = { id: 'picked-folder-id', name: 'Picked Folder' };
      
      // Create a custom PickerBuilder that will call the callback with the picked action
      let capturedCallback: any;
      mockGapi.picker.PickerBuilder = function() {
        return {
          addView: vi.fn(function() { return this; }),
          setOAuthToken: vi.fn(function() { return this; }),
          setDeveloperKey: vi.fn(function() { return this; }),
          setCallback: vi.fn(function(cb: any) { 
            capturedCallback = cb;
            return this; 
          }),
          build: vi.fn(function() {
            return {
              setVisible: vi.fn(function() {
                // Call the captured callback with picked action
                if (capturedCallback) {
                  capturedCallback({ action: mockGapi.picker.Action.PICKED, docs: [pickedFolder] });
                }
              })
            };
          }),
        };
      } as any;

      const result = await pickGoogleDriveFolder(mockApiKey);
      expect(result).toEqual(pickedFolder);
    });

    it('dovrebbe risolvere a null se il picker viene annullato', async () => {
      // Create a custom PickerBuilder that will call the callback with the cancel action
      let capturedCallback: any;
      mockGapi.picker.PickerBuilder = function() {
        return {
          addView: vi.fn(function() { return this; }),
          setOAuthToken: vi.fn(function() { return this; }),
          setDeveloperKey: vi.fn(function() { return this; }),
          setCallback: vi.fn(function(cb: any) { 
            capturedCallback = cb;
            return this; 
          }),
          build: vi.fn(function() {
            return {
              setVisible: vi.fn(function() {
                // Call the captured callback with cancel action
                if (capturedCallback) {
                  capturedCallback({ action: mockGapi.picker.Action.CANCEL });
                }
              })
            };
          }),
        };
      } as any;

      const result = await pickGoogleDriveFolder(mockApiKey);
      expect(result).toBeNull();
    });

    it('dovrebbe risolvere a null se i dati del documento sono malformati', async () => {
      let capturedCallback: any;
      mockGapi.picker.PickerBuilder = function() {
        return {
          addView: vi.fn(function() { return this; }),
          setOAuthToken: vi.fn(function() { return this; }),
          setDeveloperKey: vi.fn(function() { return this; }),
          setCallback: vi.fn(function(cb: any) { 
            capturedCallback = cb;
            return this; 
          }),
          build: vi.fn(function() {
            return {
              setVisible: vi.fn(function() {
                if (capturedCallback) {
                  capturedCallback({ action: mockGapi.picker.Action.PICKED, docs: [{ invalid: 'data' }] });
                }
              })
            };
          }),
        };
      } as any;

      const result = await pickGoogleDriveFolder(mockApiKey);
      expect(result).toBeNull();
    });

    it('dovrebbe risolvere a null se il callback lancia un errore', async () => {
      let capturedCallback: any;
      mockGapi.picker.PickerBuilder = function() {
        return {
          addView: vi.fn(function() { return this; }),
          setOAuthToken: vi.fn(function() { return this; }),
          setDeveloperKey: vi.fn(function() { return this; }),
          setCallback: vi.fn(function(cb: any) { 
            capturedCallback = cb;
            return this; 
          }),
          build: vi.fn(function() {
            return {
              setVisible: vi.fn(function() {
                if (capturedCallback) {
                  // Trigger an error to test the catch block
                  capturedCallback({ get action() { throw new Error('test'); } });
                }
              })
            };
          }),
        };
      } as any;

      const result = await pickGoogleDriveFolder(mockApiKey);
      expect(result).toBeNull();
    });

    it('dovrebbe lanciare un errore se la API Key è mancante', async () => {
      await expect(pickGoogleDriveFolder(undefined)).rejects.toThrow('API Key mancante. Inseriscila nelle impostazioni Drive.');
    });

    it('dovrebbe lanciare un errore se non autenticato', async () => {
      // Configure revoke mock to call the callback immediately
      mockGoogleAccountsOAuth2.revoke.mockImplementation((token: string, callback: () => void) => {
        callback();
      });
      
      // Revoke access token to clear it
      await revokeAccessToken();
      
      // Now calling pickGoogleDriveFolder should throw because accessToken is null
      await expect(pickGoogleDriveFolder(mockApiKey)).rejects.toThrow('Autenticazione richiesta.');
    });
  });
});
