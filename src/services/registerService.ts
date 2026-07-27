import { ImportResult } from './importService';
import { logger } from '../utils/logger';

export type RegisterProvider = 'argo' | 'spaggiari' | 'axios' | 'sidi' | 'generic';

export interface RegisterSyncConfig {
    provider: RegisterProvider;
    credentials?: {
        username: string;
        token?: string;
    };
}

/**
 * Provides detailed guidance on how to export data from specific registers
 */
export const getRegisterImportGuidance = (provider: RegisterProvider): { providerName: string; steps: string[] } => {
    switch (provider) {
        case 'argo':
            return {
                providerName: 'Argo (DidUP)',
                steps: [
                    "Accedi ad Argo DidUP con le tue credenziali.",
                    "Vai nella sezione 'Scrutinio' o 'Registri'.",
                    "Cerca la funzione 'Esporta in Excel' o 'Stampe'.",
                    "Seleziona l'elenco alunni o il tabellone voti.",
                    "Salva il file sul tuo dispositivo e caricalo qui."
                ]
            };
        case 'spaggiari':
            return {
                providerName: 'ClasseViva (Spaggiari)',
                steps: [
                    "Accedi a ClasseViva.",
                    "Vai in 'Registro di Classe' o 'Scrutinio'.",
                    "Usa l'icona di esportazione (solitamente un foglio Excel) in alto a destra.",
                    "Scegli il formato CSV o Excel.",
                    "Carica il file scaricato in DocenteDoc AI."
                ]
            };
        case 'axios':
            return {
                providerName: 'Axios',
                steps: [
                    "Accedi al portale Axios.",
                    "Naviga verso 'Segreteria Digitale' o 'Registro Elettronico'.",
                    "Utilizza le funzioni di export presenti nelle liste alunni.",
                    "Assicurati di includere i dati anagrafici di base.",
                    "Importa il file risultante."
                ]
            };
        case 'sidi':
            return {
                providerName: 'SIDI / MIUR',
                steps: [
                    "Accedi al portale SIDI.",
                    "Vai in 'Anagrafe Nazionale Studenti'.",
                    "Esegui un'estrazione dati per la tua scuola/classe.",
                    "Scarica il file in formato Excel.",
                    "Carica il file qui per sincronizzare l'elenco studenti."
                ]
            };
        default:
            return {
                providerName: 'Registro Elettronico',
                steps: [
                    "Cerca la funzione di esportazione nel tuo registro.",
                    "Esporta i dati in formato CSV o Excel.",
                    "Verifica che siano presenti Cognome, Nome e Classe.",
                    "Carica il file in questa sezione."
                ]
            };
    }
};

/**
 * Service to manage integration with electronic registers (Argo, Spaggiari, Axios, etc.)
 */
export const RegisterService = {
    getExportGuidance: (provider: RegisterProvider): string => getRegisterImportGuidance(provider).steps.join(' '),

    /**
     * Placeholder for future direct API synchronization
     * Direct integration with Italian registers usually requires specific agreements or 
     * reverse-engineering private APIs which is not recommended for production without official support.
     */
    async syncDirect(config: RegisterSyncConfig): Promise<ImportResult> {
        logger.debug(`Syncing with ${config.provider}...`);
        // This will be implemented when official or stable unofficial APIs are available
        return { 
            students: [], 
            evaluations: [], 
            errors: [`La sincronizzazione diretta con ${config.provider} non è ancora disponibile. Utilizza l'importazione file CSV/Excel.`] 
        };
    }
};

