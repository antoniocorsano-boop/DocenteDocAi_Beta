/**
 * Drive Connector (integration surface)
 *
 * Thin re-export of the existing googleDriveService, wrapped with the
 * integration contract so it can be used uniformly alongside other connectors.
 *
 * All actual Drive logic lives in src/services/googleDriveService.ts.
 */

export {
    initTokenClient,
    requestAccessToken,
    getAccessToken,
    revokeAccessToken,
    loadGapiClient,
    uploadBackup,
    downloadBackup,
    pickGoogleDriveFolder,
    createAppFolder,
} from '../../services/googleDriveService';
