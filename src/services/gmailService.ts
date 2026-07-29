
 
import { loadGapiClient, requestAccessToken } from './googleDriveService';
import { logger } from '../utils/logger';
const GMAIL_MODIFY_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

/**
 * Initializes the Gmail API client.
 */
const ensureGmailApiLoaded = async () => {
    await loadGapiClient();
    if (!gapi.client.gmail) {
        await gapi.client.load('gmail', 'v1');
    }
};

/**
 * Helper to encode message for Gmail API (RFC 2822)
 */
const createEmailRaw = (to: string, subject: string, body: string) => {
    const emailLines = [
        `To: ${to}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        body
    ];
    const email = emailLines.join('\r\n').trim();
    // Base64Url encoding required by Gmail API
    return btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

interface GmailMessage {
    id: string;
    threadId: string;
}

interface GmailHeader {
    name: string;
    value: string;
}

export const listUnreadEmails = async (limit = 5): Promise<{ id: string; snippet: string; from: string; subject: string }[]> => {
    try {
        await ensureGmailApiLoaded();
        const response = await gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'q': 'is:unread',
            'maxResults': limit
        });
        
        const messages = (response.result.messages || []) as GmailMessage[];
        if (messages.length === 0) return [];

        const details = await Promise.all(messages.map(async (msg) => {
            const detail = await gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': msg.id,
                'format': 'metadata',
                'metadataHeaders': ['From', 'Subject']
            });
            const headers = (detail.result.payload?.headers || []) as GmailHeader[];
            const from = headers.find((h) => h.name === 'From')?.value || 'Sconosciuto';
            const subject = headers.find((h) => h.name === 'Subject')?.value || '(Nessun oggetto)';
            return {
                id: msg.id,
                snippet: detail.result.snippet || '',
                from,
                subject
            };
        }));
        
        return details;

    } catch (error: unknown) {
        logger.error("Gmail List Error", error);
        const gmailError = error as { result?: { error?: { code?: number } } };
        if (gmailError.result?.error?.code === 403 || gmailError.result?.error?.code === 401) {
            // Permission missing, request it
            requestAccessToken(GMAIL_MODIFY_SCOPE);
            throw new Error("Permessi Gmail mancanti. Ho richiesto l'autorizzazione. Riprova dopo aver accettato.");
        }
        throw new Error("Impossibile leggere le email. Verifica la connessione.");
    }
};

export const sendEmail = async (to: string, subject: string, body: string): Promise<void> => {
    try {
        await ensureGmailApiLoaded();
        const raw = createEmailRaw(to, subject, body);
        await gapi.client.gmail.users.messages.send({
            'userId': 'me',
            'resource': {
                'raw': raw
            }
        });
    } catch (error: unknown) {
        logger.error("Gmail Send Error", error);
        const gmailError = error as { result?: { error?: { code?: number } } };
        if (gmailError.result?.error?.code === 403 || gmailError.result?.error?.code === 401) {
             requestAccessToken(GMAIL_MODIFY_SCOPE);
             throw new Error("Permessi invio mail mancanti. Ho richiesto l'autorizzazione. Riprova dopo aver accettato.");
        }
        throw new Error("Impossibile inviare la mail. Verifica l'indirizzo e la connessione.");
    }
};

