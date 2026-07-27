import { logger } from '../utils/logger';
// Removed unused import KnowledgeBaseEntry

// This service manages storing and retrieving the entire application state
// to/from IndexedDB for robust automatic backups.

const DB_NAME = 'OrarioDocAI_BackupDB';
const DB_VERSION = 3; // Incremented to force store recreation
const STORE_NAME = 'app_state';
const BACKUP_KEY = 'latest_backup';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

// --- PERSISTENCE MANAGER ---
export const initPersistentStorage = async (): Promise<boolean> => {
    try {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            return isPersisted;
        }
    } catch (error) {
        logger.error('[BackupService] Error initializing persistent storage:', error);
    }
    return false;
};

export const checkStorageQuota = async (): Promise<StorageEstimate | null> => {
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return estimate;
        }
    } catch (error) {
        logger.error('[BackupService] Error checking storage quota:', error);
    }
    return null;
};

/**
 * Inizializza il database IndexedDB in modo sicuro
 * - Singleton pattern per evitare connessioni multiple
 * - Gestione robusta degli errori con auto-recovery
 */
const getDb = (): Promise<IDBDatabase> => {
    // Se abbiamo già un'istanza valida, riutilizzala
    if (dbInstance && dbInstance.objectStoreNames.contains(STORE_NAME)) {
        return Promise.resolve(dbInstance);
    }

    // Se c'è già un'inizializzazione in corso, attendi quella
    if (dbInitPromise) {
        return dbInitPromise;
    }

    dbInitPromise = new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                logger.error('[BackupService] Database open error:', request.error);
                dbInitPromise = null;
                reject(new Error(`Database open failed: ${request.error?.message || 'Unknown error'}`));
            };
            
            request.onsuccess = () => {
                dbInstance = request.result;
                
                // Verifica che lo store esista
                if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                    logger.warn('[BackupService] Store not found, recreating database...');
                    dbInstance.close();
                    dbInstance = null;
                    dbInitPromise = null;
                    
                    // Elimina e ricrea il database
                    const deleteRequest = indexedDB.deleteDatabase(DB_NAME) as IDBOpenDBRequest | undefined;

                    if (!deleteRequest) {
                        reject(new Error('Failed to recreate database'));
                        return;
                    }

                    deleteRequest.onsuccess = () => {
                        // Riprova l'apertura
                        getDb().then(resolve).catch(reject);
                    };
                    deleteRequest.onerror = () => {
                        reject(new Error('Failed to recreate database'));
                    };
                    return;
                }
                
                // Gestisci chiusura inaspettata
                dbInstance.onclose = () => {
                    logger.warn('[BackupService] Database connection closed unexpectedly');
                    dbInstance = null;
                    dbInitPromise = null;
                };
                
                dbInstance.onerror = (event) => {
                    logger.error('[BackupService] Database error:', event);
                };

                resolve(dbInstance);
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Elimina store esistente se presente (per upgrade pulito)
                if (db.objectStoreNames.contains(STORE_NAME)) {
                    db.deleteObjectStore(STORE_NAME);
                }
                
                // Crea nuovo store
                db.createObjectStore(STORE_NAME);
                logger.debug('[BackupService] Object store created/upgraded');
            };

            request.onblocked = () => {
                logger.warn('[BackupService] Database upgrade blocked - close other tabs');
                dbInitPromise = null;
                reject(new Error('Database upgrade blocked'));
            };

        } catch (error) {
            dbInitPromise = null;
            reject(error);
        }
    });

    return dbInitPromise;
};

/**
 * Saves the entire application state to IndexedDB.
 * @param state The application state object to save.
 * @returns A promise that resolves when the save is complete.
 */
export const saveBackup = async (state: object): Promise<void> => {
    try {
        // Try to request persistence on save if not already granted implicitly
        if (!navigator.storage?.persisted || !(await navigator.storage.persisted())) {
            initPersistentStorage().catch(() => {}); // Ignora errori silenziosamente
        }

        const db = await getDb();
        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                
                // Clona lo stato in modo sicuro usando structuredClone quando disponibile
                const safeState = typeof structuredClone === 'function'
                    ? structuredClone(state)
                    : state;
                void store.put(safeState, BACKUP_KEY);
                
                transaction.oncomplete = () => {
                    logger.debug('[BackupService] Backup saved successfully');
                    resolve();
                };
                transaction.onerror = () => {
                    logger.error('[BackupService] Save transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        logger.error("[BackupService] Failed to save backup:", error);
        throw error;
    }
};

/**
 * Loads the application state from IndexedDB.
 * @returns A promise that resolves with the saved state object, or null if no backup is found.
 */
export const loadBackup = async (): Promise<unknown | null> => {
    try {
        const db = await getDb();
        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(BACKUP_KEY);
                
                request.onsuccess = () => {
                    if (request.result) {
                        logger.debug('[BackupService] Backup loaded successfully');
                    } else {
                        logger.debug('[BackupService] No backup found');
                    }
                    resolve(request.result || null);
                };
                request.onerror = () => {
                    logger.error('[BackupService] Load request error:', request.error);
                    reject(request.error);
                };
                
                transaction.onerror = () => {
                    logger.error('[BackupService] Load transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        logger.error("[BackupService] Failed to load backup:", error);
        return null; // Ritorna null invece di throw per non bloccare l'app
    }
};

/**
 * Deletes the automatic backup from IndexedDB.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteBackup = async (): Promise<void> => {
    try {
        const db = await getDb();
        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                void store.delete(BACKUP_KEY);
                
                transaction.oncomplete = () => {
                    logger.debug('[BackupService] Backup deleted');
                    resolve();
                };
                transaction.onerror = () => {
                    logger.error('[BackupService] Delete transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        logger.error("[BackupService] Failed to delete backup:", error);
        throw error;
    }
};

/**
 * Esporta il backup corrente come stringa JSON
 */
export const exportBackupAsJson = async (): Promise<string> => {
    const state = await loadBackup();
    return JSON.stringify(state || {});
};

/**
 * Chiude la connessione al database (utile per cleanup)
 */
export const closeDatabase = (): void => {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
    dbInitPromise = null;
    logger.debug('[BackupService] Database connection closed');
};

/**
 * Reset internal state for testing purposes
 */
export const resetDbForTesting = (): void => {
    dbInstance = null;
    dbInitPromise = null;
};

