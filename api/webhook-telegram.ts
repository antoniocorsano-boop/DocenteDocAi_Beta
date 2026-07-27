/**
 * Vercel Edge Function — Telegram Bot webhook
 *
 * Endpoint: POST /api/webhook-telegram
 *
 * Setup (one-time, gratuito):
 * 1. Crea bot: scrivi a @BotFather su Telegram → /newbot → ottieni TELEGRAM_BOT_TOKEN
 * 2. Aggiungi in Vercel Dashboard → Settings → Environment Variables:
 *      TELEGRAM_BOT_TOKEN = <token>
 *      TELEGRAM_WEBHOOK_SECRET = <stringa random, es. openssl rand -hex 20>
 * 3. Dopo il deploy, registra il webhook una sola volta:
 *      curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tuo-dominio.vercel.app/api/webhook-telegram&secret_token=<SECRET>"
 * 4. Verifica: curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
 *
 * Test locale con vercel dev + ngrok:
 *   vercel dev               → localhost:3000
 *   ngrok http 3000          → https://abc.ngrok.io
 *   curl ".../setWebhook?url=https://abc.ngrok.io/api/webhook-telegram&secret_token=..."
 *
 * Comandi supportati (italiano naturale):
 *   "crea classe 2B"             → crea classe
 *   "importa studenti"           → mostra guida import
 *   "backup drive"               → avvia sync Drive
 *   "mostra studenti classe 3A"  → lista studenti
 *   ... (tutti i 12 intent del commandInterpreter)
 */

import { parseIntent, buildConfirmationMessage, getSuggestions } from '../src/integrations/commandInterpreter';
import { buildEdgeResponse } from '../src/integrations/chat/responseBuilder';
import { extractText } from '../src/services/documentAI/ocrService';
import { parseDocument } from '../src/services/documentAI/documentParser';
import { detectDocumentIntent } from '../src/services/documentAI/intentDetector';

export const config = { runtime: 'edge' };

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

// ─── Types ────────────────────────────────────────────────────────────────────

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: { id: number; first_name: string; username?: string };
        chat: { id: number; type: string };
        date: number;
        text?: string;
        document?: { file_id: string; file_name?: string; mime_type?: string };
        /** Telegram sends photos as an array of sizes — use the last (largest) */
        photo?: Array<{ file_id: string; width: number; height: number; file_size?: number }>;
    };
}

// ─── Telegram API helper ──────────────────────────────────────────────────────

async function sendMessage(chatId: number, text: string, suggestions?: string[]) {
    if (!BOT_TOKEN) return;

    const body: Record<string, unknown> = {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
    };

    // Show quick-reply chips as a one-time keyboard
    if (suggestions && suggestions.length > 0) {
        body.reply_markup = {
            keyboard: suggestions.map((s) => [{ text: s }]),
            one_time_keyboard: true,
            resize_keyboard: true,
        };
    } else {
        body.reply_markup = { remove_keyboard: true };
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

// ─── Telegram file download helper ───────────────────────────────────────────

/**
 * Download a Telegram file by file_id and return as base64.
 * Used for OCR pipeline when a teacher sends a photo of a document.
 */
async function downloadTelegramFile(fileId: string): Promise<{ base64: string; mimeType: string } | null> {
    if (!BOT_TOKEN) return null;
    try {
        const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json() as { ok: boolean; result?: { file_path: string } };
        if (!fileData.ok || !fileData.result?.file_path) return null;

        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        const imgRes = await fetch(fileUrl);
        if (!imgRes.ok) return null;

        const buffer = await imgRes.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';
        return { base64, mimeType };
    } catch {
        return null;
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
    // ── Security: verify Telegram secret header ───────────────────────────────
    if (WEBHOOK_SECRET) {
        const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token');
        if (incomingSecret !== WEBHOOK_SECRET) {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (!BOT_TOKEN) {
        console.error('[webhook-telegram] TELEGRAM_BOT_TOKEN not set');
        return new Response('Bot non configurato', { status: 500 });
    }

    let update: TelegramUpdate;
    try {
        update = await req.json() as TelegramUpdate;
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    const msg = update.message;
    if (!msg) {
        // Telegram can send other update types (edited_message, etc.) — ignore them
        return new Response('ok');
    }

    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // ── Photo: run Document AI pipeline ──────────────────────────────────────
    if (msg.photo && msg.photo.length > 0) {
        const largest = msg.photo[msg.photo.length - 1];
        const file = await downloadTelegramFile(largest.file_id);

        if (!file) {
            await sendMessage(chatId, '⚠️ Non riesco a scaricare la foto. Riprova.', ['Aiuto']);
            return new Response('ok');
        }

        await sendMessage(chatId, '📸 Foto ricevuta. Analizzo il documento...');

        const ocr = await extractText(file.base64, file.mimeType);
        const parsed = parseDocument(ocr.rawText, ocr.confidence);
        const docIntent = detectDocumentIntent(parsed);

        const intentLabels: Record<string, string> = {
            add_students_from_doc: 'Lista studenti rilevata',
            import_grades:         'Tabella voti rilevata',
            generate_email:        'Documento ufficiale rilevato',
            parse_document:        'Piano di lavoro rilevato',
            show_next_step:        'Documento non riconosciuto',
        };

        const label = intentLabels[docIntent.action] ?? 'Documento analizzato';
        const pct   = Math.round(docIntent.confidence * 100);
        const warns = parsed.warnings?.length ? `\n\n⚠️ ${parsed.warnings.join('\n⚠️ ')}` : '';

        await sendMessage(
            chatId,
            `✅ ${label} (confidenza: ${pct}%)\n\nApri l'app per confermare ed eseguire l'azione.${warns}`,
            ['Apri app', 'Cosa devo fare'],
        );
        return new Response('ok');
    }

    // ── File upload: document sent via chat ───────────────────────────────────
    if (msg.document) {
        const mime = msg.document.mime_type ?? '';
        if (mime.includes('csv') || mime.includes('excel') || mime.includes('spreadsheet')) {
            await sendMessage(chatId,
                '📎 File ricevuto. Per importare gli studenti:\n' +
                '1. Apri l\'app DocenteDoc AI\n' +
                '2. Vai in Impostazioni → Dati & Cloud → Importa dati\n' +
                '3. Carica questo file CSV/Excel\n\n' +
                '_L\'importazione diretta da chat sarà disponibile prossimamente._',
                ['Apri app', 'Guida import', 'Annulla']
            );
        } else {
            await sendMessage(chatId, 'Formato file non supportato. Usa CSV o Excel per importare studenti.');
        }
        return new Response('ok');
    }

    if (!text) {
        return new Response('ok');
    }

    // ── /start command ────────────────────────────────────────────────────────
    if (text === '/start') {
        await sendMessage(
            chatId,
            `👋 *Ciao ${msg.from.first_name}!*\n\n` +
            'Sono il Copilot di *DocenteDoc AI*. Puoi parlarmi in italiano naturale:\n\n' +
            '• "crea classe 2B"\n' +
            '• "importa studenti"\n' +
            '• "backup Drive"\n' +
            '• "crea una UDA di matematica"\n\n' +
            '_Stesso cervello dell\'app, comodità della chat._',
            ['Crea classe', 'Importa studenti', 'Backup Drive']
        );
        return new Response('ok');
    }

    // ── /help command ─────────────────────────────────────────────────────────
    if (text === '/help') {
        await sendMessage(
            chatId,
            '*Comandi disponibili:*\n\n' +
            '📚 `crea classe [nome]` — crea una nuova classe\n' +
            '👤 `aggiungi studente [nome]` — aggiunge uno studente\n' +
            '📥 `importa studenti` — guida per l\'import\n' +
            '📋 `crea UDA [argomento]` — crea unità didattica\n' +
            '📅 `segna evento [descrizione]` — aggiunge evento al calendario\n' +
            '✅ `registra presenze classe [nome]` — appello\n' +
            '☁️ `backup Drive` — sincronizza Google Drive\n' +
            '🏫 `importa da Classroom` — collega Google Classroom',
            ['Crea classe', 'Importa studenti', 'Backup Drive']
        );
        return new Response('ok');
    }

    // ── Natural language intent parsing ──────────────────────────────────────
    const intent = parseIntent(text, 'telegram');
    const confirmText = buildConfirmationMessage(intent);
    const suggestions = getSuggestions(intent);
    const reply = buildEdgeResponse(intent, confirmText, suggestions);

    await sendMessage(chatId, reply.text, reply.suggestions);

    return new Response('ok');
}
