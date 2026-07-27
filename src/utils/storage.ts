/**
 * Safe storage utilities
 * Wraps localStorage/sessionStorage with error handling for private browsing mode
 */

const isStorageAvailable = (): boolean => {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
};

const storageAvailable = isStorageAvailable();

export const storage = {
    getItem: (key: string): string | null => {
        if (!storageAvailable) return null;
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },

    setItem: (key: string, value: string): boolean => {
        if (!storageAvailable) return false;
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    },

    removeItem: (key: string): boolean => {
        if (!storageAvailable) return false;
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },

    getBoolean: (key: string, defaultValue: boolean = false): boolean => {
        const value = storage.getItem(key);
        return value !== null ? value === 'true' : defaultValue;
    },

    setBoolean: (key: string, value: boolean): boolean => {
        return storage.setItem(key, String(value));
    },

    getJSON: <T>(key: string, defaultValue: T | null = null): T | null => {
        const value = storage.getItem(key);
        if (value === null) return defaultValue;
        try {
            return JSON.parse(value) as T;
        } catch {
            return defaultValue;
        }
    },

    setJSON: <T>(key: string, value: T): boolean => {
        try {
            return storage.setItem(key, JSON.stringify(value));
        } catch {
            return false;
        }
    },
};

export const session = {
    getItem: (key: string): string | null => {
        try {
            return sessionStorage.getItem(key);
        } catch {
            return null;
        }
    },

    setItem: (key: string, value: string): boolean => {
        try {
            sessionStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    },
};
