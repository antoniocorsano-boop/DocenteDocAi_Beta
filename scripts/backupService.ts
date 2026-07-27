// This service is intentionally left empty to avoid conflicts with src/services/backupService.ts
// which provides the real implementation. This mock is for build/test environments that
// might try to include it.
export const saveBackup = async (state: object): Promise<void> => {
    console.warn("Mock backupService: saveBackup called, no action taken.");
    return Promise.resolve();
};

export const loadBackup = async (): Promise<unknown | null> => {
    console.warn("Mock backupService: loadBackup called, returning null.");
    return Promise.resolve(null);
};

export const deleteBackup = async (): Promise<void> => {
    console.warn("Mock backupService: deleteBackup called, no action taken.");
    return Promise.resolve();
};
