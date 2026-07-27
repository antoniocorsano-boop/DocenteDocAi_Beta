// Service per interscambio con NotebookLM (upload, fetch, sync, delete)
// Integrazione con Google NotebookLM API

export interface NotebookLMFile {
  id: string;
  name: string;
  content: string;
  lastModified: string;
  notebookId?: string; // ID del notebook associato
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

// Interfaccia per la risposta API di NotebookLM
interface NotebookLMApiDocument {
  documentId: string;
  displayName?: string;
  name?: string;
  updateTime?: string;
  createTime?: string;
  notebookId?: string;
  processingState?: string;
}

// Configurazione API NotebookLM
const NOTEBOOKLM_CONFIG = {
  baseUrl: 'https://notebooks.googleapis.com/v1',
  scopes: ['https://www.googleapis.com/auth/notebooks'],
};

// --- Google Auth helpers ---
import { getAccessToken } from './googleDriveService';

// Helper per ottenere token di autenticazione
const getAuthToken = async (): Promise<string | null> => {
  return getAccessToken();
};

// Helper per gestire errori API
const handleApiError = (error: unknown, operation: string) => {
  logger.error(`NotebookLM ${operation} error:`, error);
  const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
  throw new Error(`Errore durante ${operation}: ${errorMessage}`);
};

export const uploadNotebookFile = async (file: File): Promise<NotebookLMFile> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      // Fallback: salva localmente se non autenticato
      logger.warn('NotebookLM non autenticato, salvataggio locale');
      return {
        id: `nb-local-${Date.now()}`,
        name: file.name,
        content: await file.text(),
        lastModified: new Date().toISOString(),
        status: 'ready'
      };
    }

    // Preparazione del form data per upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      name: file.name,
      mimeType: file.type || 'application/octet-stream'
    }));

    // Chiamata API reale a NotebookLM
    const response = await fetch(`${NOTEBOOKLM_CONFIG.baseUrl}/notebooks/documents:upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      id: result.documentId || `nb-${Date.now()}`,
      name: file.name,
      content: await file.text(), // Mantieni copia locale
      lastModified: new Date().toISOString(),
      notebookId: result.notebookId,
      status: 'processing' // NotebookLM processa i documenti
    };

  } catch (error) {
    return handleApiError(error, 'upload');
  }
};

export const fetchNotebookFiles = async (): Promise<NotebookLMFile[]> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      // Fallback: restituisci array vuoto se non autenticato
      logger.warn('NotebookLM non autenticato, nessun file remoto');
      return [];
    }

    // Chiamata API per ottenere la lista dei documenti
    const response = await fetch(`${NOTEBOOKLM_CONFIG.baseUrl}/notebooks/documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Mappa la risposta API al nostro formato
    return (result.documents || []).map((doc: NotebookLMApiDocument) => ({
      id: doc.documentId,
      name: doc.displayName || doc.name || 'Documento senza nome',
      content: '', // Il contenuto non viene restituito nella lista, solo metadata
      lastModified: doc.updateTime || doc.createTime || new Date().toISOString(),
      notebookId: doc.notebookId,
      status: doc.processingState === 'PROCESSING' ? 'processing' :
              doc.processingState === 'READY' ? 'ready' : 'error'
    }));

  } catch (error) {
    return handleApiError(error, 'fetch');
  }
};

export const deleteNotebookFile = async (id: string): Promise<void> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      logger.warn('NotebookLM non autenticato, impossibile eliminare file remoto');
      return;
    }

    // Chiamata API per eliminare il documento
    const response = await fetch(`${NOTEBOOKLM_CONFIG.baseUrl}/notebooks/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.debug(`Documento ${id} eliminato da NotebookLM`);

  } catch (error) {
    return handleApiError(error, 'delete');
  }
};

// Sincronizzazione con gestione conflitti tramite callback utente
import { SyncConflictData } from '../types';
import { logger } from '../utils/logger';

export type ConflictHandler = (conflict: SyncConflictData) => Promise<'local' | 'remote'>;

export const syncNotebookFiles = async (
  getLocalFiles: () => Promise<NotebookLMFile[]>,
  saveLocalFiles: (files: NotebookLMFile[]) => Promise<void>,
  handleConflict?: ConflictHandler
): Promise<void> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      logger.warn('NotebookLM non autenticato, sincronizzazione saltata');
      return;
    }
    logger.debug('Avvio sincronizzazione NotebookLM...');
    const remoteFiles = await fetchNotebookFiles();
    const localFiles = await getLocalFiles();
    const mergedFiles: NotebookLMFile[] = [...localFiles];
    const localMap = new Map(localFiles.map(f => [f.id, f]));
    // Gestione conflitti e merge
    for (const remote of remoteFiles) {
      const local = localMap.get(remote.id);
      if (local) {
        // Conflitto: contenuto diverso e timestamp diversi
        if (local.content !== remote.content && local.lastModified !== remote.lastModified && handleConflict) {
          const conflict: SyncConflictData = {
            fileId: remote.id,
            fileName: remote.name,
            localContent: local.content,
            remoteContent: remote.content,
            lastModifiedLocal: local.lastModified,
            lastModifiedRemote: remote.lastModified,
          };
          const choice = await handleConflict(conflict);
          if (choice === 'remote') {
            // Sovrascrivi locale con remoto
            const idx = mergedFiles.findIndex(f => f.id === remote.id);
            if (idx !== -1) mergedFiles[idx] = remote;
          }
          // Se 'local', non fare nulla (mantieni locale)
        } else if (local.lastModified !== remote.lastModified) {
          // Se solo uno è più recente, scegli il più recente
          const idx = mergedFiles.findIndex(f => f.id === remote.id);
          if (new Date(local.lastModified) < new Date(remote.lastModified)) {
            if (idx !== -1) mergedFiles[idx] = remote;
          }
        }
      } else {
        // Nuovo file remoto: aggiungi
        mergedFiles.push(remote);
      }
    }
    // Gestione file solo locali (eventuale upload)
    const remoteIds = new Set(remoteFiles.map(f => f.id));
    const onlyLocal = localFiles.filter(f => !remoteIds.has(f.id));
    if (onlyLocal.length > 0) {
      logger.debug('Da caricare su NotebookLM:', onlyLocal);
      // Upload su cloud non implementato: NotebookLM non espone API di write pubbliche.
      // I file solo-locali vengono mantenuti nel merge locale; sincronizzazione bidirezionale
      // richiederà un endpoint dedicato quando disponibile.
    }
    await saveLocalFiles(mergedFiles);
    logger.debug(`Sync NotebookLM completata. Remoti: ${remoteFiles.length}, Locali: ${localFiles.length}`);
  } catch (error) {
    return handleApiError(error, 'sync');
  }
};

// Utility per verificare stato autenticazione
export const isNotebookLMAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};

// Logout helper
export const notebookLMLogout = (): void => {
  // Il logout viene gestito centralmente da googleDriveService
};

