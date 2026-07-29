
import { DEFAULT_TIMETABLE_SETTINGS } from '../constants';

declare const google: Record<string, unknown>;
declare const gapi: Record<string, unknown>;

interface TokenClient {
    requestAccessToken: (options: { prompt?: string; scope?: string }) => void;
}

const BACKUP_FILE_NAME = 'OrarioDoc_Backup.json';
const BACKUP_MIME_TYPE = 'application/json';
const DEFAULT_BACKUP_FOLDER_NAME = 'OrarioDoc_Backups';
const NOTEBOOKLM_FOLDER_NAME = 'OrarioDoc_NotebookLM';
// removed unused `FILES_SUBFOLDER_NAME`
let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;

const DEFAULT_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/notebooks'
];

const getEnvClientId = () => {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
            return import.meta.env.VITE_GOOGLE_CLIENT_ID;
        }
    } catch {
        // ignore environment read errors
    }
    return undefined;
};

export const initTokenClient = (callback: (tokenResponse: unknown) => void, explicitClientId?: string, customScopes?: string[]): boolean => {
    if (typeof google === 'undefined' || typeof google.accounts === 'undefined' || typeof google.accounts.oauth2 === 'undefined') {
        return false;
    }
    const clientId = explicitClientId || getEnvClientId() || DEFAULT_TIMETABLE_SETTINGS.googleClientId;
    if (!clientId) return false;
    
    const scopes = customScopes ? customScopes.join(' ') : DEFAULT_SCOPES.join(' ');

    tokenClient = (google as unknown as { accounts: { oauth2: { initTokenClient: (config: unknown) => TokenClient } } }).accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes,
        callback: (tokenResponse: unknown) => {
            // tokenResponse shape is runtime-provided; guard before use
            try {
                const tr = tokenResponse as { access_token?: string } | undefined;
                accessToken = tr?.access_token ?? accessToken;
            } catch {
                // ignore malformed response
            }
            callback(tokenResponse);
        },
    });
    return true;
};

/**
 * Request access token. Can accept specific scopes for incremental auth (e.g. Gmail).
 */
// FIX: Updated requestAccessToken to accept an optional overrideScope parameter to satisfy gmailService requirements
export const requestAccessToken = (overrideScope?: string): void => {
    if (tokenClient && typeof tokenClient === 'object' && 'requestAccessToken' in tokenClient) {
        if (overrideScope) {
            tokenClient.requestAccessToken({ prompt: 'consent', scope: overrideScope });
        } else {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    }
};

export const getAccessToken = (): string | null => accessToken;
export const revokeAccessToken = (): void => { if (accessToken) { google.accounts.oauth2.revoke(accessToken, () => accessToken = null); } };

/**
 * Initializes the GAPI client.
 */
// FIX: Added loadGapiClient export to satisfy gmailService requirements
export const loadGapiClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof gapi === 'undefined') {
            reject(new Error("Google API Script not loaded."));
            return;
        }
        gapi.load('client', { callback: resolve });
    });
};

const searchFolder = async (name: string, parentId?: string): Promise<{ id: string; name: string } | null> => {
    let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) query += ` and '${parentId}' in parents`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0] : null;
};

const createFolder = async (name: string, parentId?: string): Promise<{ id: string; name: string }> => {
    const metadata: Record<string, unknown> = { name, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) metadata.parents = [parentId];
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata)
    });
    return await res.json();
};

export const uploadNotebookSource = async (fileName: string, content: string): Promise<void> => {
    if (!accessToken) throw new Error("Autenticazione Google richiesta.");

    let folder = await searchFolder(NOTEBOOKLM_FOLDER_NAME);
    if (!folder) folder = await createFolder(NOTEBOOKLM_FOLDER_NAME);

    const metadata = { name: fileName, mimeType: 'text/markdown', parents: [folder.id] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/markdown' }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form,
    });
    if (!res.ok) throw new Error("Upload fallito.");
};

export const uploadBackup = async (data: unknown, folderId?: string): Promise<void> => {
    if (!accessToken) return;
    const fileContent = JSON.stringify(data);
    const metadata = { name: BACKUP_FILE_NAME, mimeType: BACKUP_MIME_TYPE, parents: folderId ? [folderId] : [] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: BACKUP_MIME_TYPE }));
    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form,
    });
};

export const downloadBackup = async (fileId: string): Promise<unknown> => {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    return await res.json();
};

export const pickGoogleDriveFolder = async (apiKey?: string): Promise<{ id: string; name: string } | null> => {
    if (!apiKey) throw new Error('API Key mancante. Inseriscila nelle impostazioni Drive.');
    if (!accessToken) throw new Error('Autenticazione richiesta.');
    
    return new Promise((resolve) => {
        gapi.load('picker', () => {
            const pickerBuilder = new gapi.picker.PickerBuilder()
                .addView(new gapi.picker.DocsView().setSelectFolderEnabled(true).setMimeTypes('application/vnd.google-apps.folder'))
                .setOAuthToken(accessToken)
                .setDeveloperKey(apiKey)
                .setCallback((data: unknown) => {
                    try {
                        const dd = data as { action?: string; docs?: unknown[] } | undefined;
                        if (dd && dd.action === gapi.picker.Action.PICKED) {
                            const doc = dd.docs?.[0] as { id?: string; name?: string } | undefined;
                            if (doc && typeof doc.id === 'string' && typeof doc.name === 'string') {
                                resolve({ id: doc.id, name: doc.name });
                            } else {
                                resolve(null);
                            }
                        } else if (dd && dd.action === gapi.picker.Action.CANCEL) {
                            resolve(null);
                        }
                    } catch {
                        resolve(null);
                    }
                });
            pickerBuilder.build().setVisible(true);
        });
    });
};

export const createAppFolder = async (): Promise<{ id: string; name: string }> => {
    const folder = await searchFolder(DEFAULT_BACKUP_FOLDER_NAME);
    if (folder) return folder;
    return await createFolder(DEFAULT_BACKUP_FOLDER_NAME);
};

export const getBackupMetadata = async (folderId: string): Promise<unknown> => {
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`)}&fields=files(id,modifiedTime)`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.files?.[0] ? { modifiedTime: data.files[0].modifiedTime } : null;
};

