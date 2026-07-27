import { KnowledgeBaseEntry } from '../types';
import { logger } from '../utils/logger';

// This service manages storing and retrieving Knowledge Base content
// to/from IndexedDB in a dedicated store.

const DB_NAME = 'OrarioDocAI_Data'; // Separate DB for heavy content
const DB_VERSION = 2; // Incremented to force store recreation
const STORE_NAME = 'kb_content';
const MAIN_DB_NAME = 'OrarioDocAI_BackupDB'; // Main app state DB

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Inizializza il database IndexedDB per KB content in modo sicuro
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
                logger.error('[IndexedDbService] Database open error:', request.error);
                dbInitPromise = null;
                reject(new Error(`KB Database open failed: ${request.error?.message || 'Unknown error'}`));
            };
            
            request.onsuccess = () => {
                dbInstance = request.result;
                
                // Verifica che lo store esista
                    if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                    logger.warn('[IndexedDbService] Store not found, recreating database...');
                    dbInstance.close();
                    dbInstance = null;
                    dbInitPromise = null;
                    
                    // Elimina e ricrea il database
                    const deleteRequest = indexedDB.deleteDatabase(DB_NAME) as IDBOpenDBRequest | undefined;

                    if (!deleteRequest) {
                        reject(new Error('Failed to recreate KB database'));
                        return;
                    }

                    deleteRequest.onsuccess = () => {
                        getDb().then(resolve).catch(reject);
                    };
                    deleteRequest.onerror = () => {
                        reject(new Error('Failed to recreate KB database'));
                    };
                    return;
                }
                
                // Gestisci chiusura inaspettata
                dbInstance.onclose = () => {
                    logger.warn('[IndexedDbService] Database connection closed unexpectedly');
                    dbInstance = null;
                    dbInitPromise = null;
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
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                logger.debug('[IndexedDbService] KB object store created/upgraded');
            };

            request.onblocked = () => {
                logger.warn('[IndexedDbService] Database upgrade blocked - close other tabs');
                dbInitPromise = null;
                reject(new Error('KB Database upgrade blocked'));
            };

        } catch (error) {
            dbInitPromise = null;
            reject(error);
        }
    });

    return dbInitPromise;
};

/**
 * Saves heavy content of Knowledge Base entries to a dedicated IndexedDB store.
 * Only saves 'content', 'htmlContent', and 'fileContent'.
 * @param kbEntries The KnowledgeBaseEntry array to save.
 */
export const saveKbContentToIndexedDB = async (kbEntries: KnowledgeBaseEntry[]): Promise<void> => {
    // Skip if no entries to save
    if (!kbEntries || kbEntries.length === 0) {
        return;
    }
    
    try {
        const db = await getDb();
        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                kbEntries.forEach(entry => {
                    if (entry.content || entry.htmlContent || entry.fileContent) {
                        const contentToSave = {
                            id: entry.id,
                            content: entry.content || '',
                            htmlContent: entry.htmlContent || '',
                            fileContent: entry.fileContent || undefined
                        };
                        store.put(contentToSave);
                    }
                });

                transaction.oncomplete = () => {
                    logger.debug('[IndexedDbService] KB content saved successfully');
                    resolve();
                };
                transaction.onerror = () => {
                    logger.error('[IndexedDbService] Save KB transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        logger.error("[IndexedDbService] Failed to save KB content:", error);
        // Non bloccare l'app se il salvataggio KB fallisce
    }
};

/**
 * Loads heavy content of Knowledge Base entries from IndexedDB.
 * @returns A map of {id: {content, htmlContent, fileContent}}
 */
export const loadKbContentFromIndexedDB = async (): Promise<Record<string, Partial<KnowledgeBaseEntry>>> => {
    try {
        const db = await getDb();
        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const result: Record<string, Partial<KnowledgeBaseEntry>> = {};
                    if (request.result) {
                        request.result.forEach(entry => {
                            result[entry.id] = {
                                content: entry.content,
                                htmlContent: entry.htmlContent,
                                fileContent: entry.fileContent
                            };
                        });
                    }
                    logger.debug('[IndexedDbService] KB content loaded, entries:', Object.keys(result).length);
                    resolve(result);
                };
                request.onerror = () => {
                    logger.error('[IndexedDbService] Load KB request error:', request.error);
                    reject(request.error);
                };
                
                transaction.onerror = () => {
                    logger.error('[IndexedDbService] Load KB transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        logger.error("[IndexedDbService] Failed to load KB content:", error);
        return {}; // Ritorna oggetto vuoto invece di throw
    }
};

/**
 * Deletes a specific KB content entry from IndexedDB.
 * @param id The ID of the KB entry to delete.
 */
export const deleteKbContentFromIndexedDB = async (id: string): Promise<void> => {
    try {
        const db = await getDb();
        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                void store.delete(id);
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => {
                    logger.error('Delete KB entry transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        logger.error("Failed to initiate delete KB entry:", error);
        throw error;
    }
};

/**
 * Clears all entries from the KB content IndexedDB store.
 */
export const clearIndexedDB = async (): Promise<void> => {
    try {
        const db = await getDb();
        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                if (typeof store.clear === 'function') {
                    void store.clear();
                } else {
                    logger.warn('[IndexedDbService] Store clear not available; skipping');
                    resolve();
                    return;
                }
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => {
                    logger.error('Clear KB store transaction error:', transaction.error);
                    reject(transaction.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    } catch (error) {
        logger.error("Failed to initiate clear KB store:", error);
        throw error;
    }
};

// Also add a function to delete the main app state backup from the main DB
// This function needs to open the *other* DB
export const deleteMainAppBackup = async (): Promise<void> => {
    try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(MAIN_DB_NAME, 3); // Use version 3 to match backupService
            request.onerror = () => reject(new Error('Failed to open main app backup DB.'));
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = () => { /* no upgrade needed here */ };
        });

        return await new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction('app_state', 'readwrite'); // Assuming store name is 'app_state'
                const store = transaction.objectStore('app_state');
                void store.delete('latest_backup'); // Assuming key is 'latest_backup'
                transaction.oncomplete = () => {
                    db.close();
                    resolve();
                };
                transaction.onerror = () => {
                    logger.error('Delete main app backup transaction error:', transaction.error);
                    db.close();
                    reject(transaction.error);
                };
            } catch (error) {
                db.close();
                reject(error);
            }
        });
    } catch (error) {
        logger.error("Failed to initiate delete main app backup:", error);
        throw error;
    }
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
    logger.debug('[IndexedDbService] Database connection closed');
};

/**
 * Reset internal state for testing purposes
 */
export const resetDbForTesting = (): void => {
    dbInstance = null;
    dbInitPromise = null;
};

