/**
 * Vercel Edge Function — WhatsApp Cloud API webhook
 *
 * Endpoint: GET  /api/webhook-whatsapp  (verifica Meta)
 *           POST /api/webhook-whatsapp  (messaggi in arrivo)
 *
 * Setup (gratuito fino a 1000 conversazioni al mese):
 * 1. Crea un'app su https://developers.facebook.com  (tipo: Business)
 * 2. Aggiungi prodotto "WhatsApp" → ottieni:
 *      - Token accesso temporaneo (poi permanente con Business Account)
 *      - Phone Number ID
 * 3. Aggiungi in Vercel Dashboard → Settings → Environment Variables:
 *      WHATSAPP_TOKEN          = EAAx...  (access token Meta)
 *      WHATSAPP_PHONE_ID       = 123456789012345
 *      WHATSAPP_VERIFY_TOKEN   = <stringa custom, es. docentedoc-wh-2026>
 * 4. Nel pannello Meta → Webhooks → configura:
 *      URL: https://tuo-dominio.vercel.app/api/webhook-whatsapp
 *      Verify Token: <stesso valore di WHATSAPP_VERIFY_TOKEN>
 *      Subscription fields: messages
 *
 * Test locale con vercel dev + ngrok:
 *   vercel dev               → localhost:3000
 *   ngrok http 3000          → https://abc.ngrok.io
 *   Usa https://abc.ngrok.io/api/webhook-whatsapp come URL webhook Meta
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

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;

const GRAPH_API = 'https://graph.facebook.com/v19.0';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppMessage {
    from: string;       // E.164 phone number
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'interactive';
    text?: { body: string };
    image?: { id: string; mime_type?: string; sha256?: string };
    document?: { id: string; filename?: string; mime_type?: string };
    interactive?: {
        type: 'button_reply' | 'list_reply';
        button_reply?: { id: string; title: string };
        list_reply?: { id: string; title: string };
    };
}

interface WhatsAppEvent {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: { phone_number_id: string };
                messages?: WhatsAppMessage[];
                statuses?: Array<{ id: string; status: string }>;
            };
            field: string;
        }>;
    }>;
}

// ─── WhatsApp Cloud API helpers ───────────────────────────────────────────────

async function sendTextMessage(to: string, body: string) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return;

    await fetch(`${GRAPH_API}/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body },
        }),
    });
}

/** Send up to 3 quick-reply buttons (WhatsApp limit per message) */
async function sendInteractiveButtons(to: string, bodyText: string, buttons: string[]) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID || buttons.length === 0) {
        await sendTextMessage(to, bodyText);
        return;
    }

    const capped = buttons.slice(0, 3); // WhatsApp max 3 buttons
    await fetch(`${GRAPH_API}/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: bodyText },
                action: {
                    buttons: capped.map((label, idx) => ({
                        type: 'reply',
                        reply: { id: `suggestion_${idx}`, title: label.slice(0, 20) },
                    })),
                },
            },
        }),
    });
}

// ─── WhatsApp media download helper ──────────────────────────────────────────

/**
 * Download a WhatsApp media object by its media ID and return as base64.
 * Used for OCR pipeline when a teacher sends a photo of a document.
 */
async function downloadWhatsAppMedia(mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
    if (!ACCESS_TOKEN) return null;
    try {
        // Step 1: get media URL
        const urlRes = await fetch(`${GRAPH_API}/${mediaId}`, {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        });
        if (!urlRes.ok) return null;
        const urlData = await urlRes.json() as { url?: string; mime_type?: string };
        if (!urlData.url) return null;

        // Step 2: download binary
        const mediaRes = await fetch(urlData.url, {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        });
        if (!mediaRes.ok) return null;

        const buffer = await mediaRes.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return { base64, mimeType: urlData.mime_type ?? 'image/jpeg' };
    } catch {
        return null;
    }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // ── GET: Meta webhook verification challenge ──────────────────────────────
    if (req.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[webhook-whatsapp] Webhook verified ✓');
            return new Response(challenge ?? '', { status: 200 });
        }
        return new Response('Forbidden', { status: 403 });
    }

    // ── POST: incoming message ────────────────────────────────────────────────
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        console.error('[webhook-whatsapp] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID');
        return new Response('Not configured', { status: 500 });
    }

    let event: WhatsAppEvent;
    try {
        event = await req.json() as WhatsAppEvent;
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    // Meta always expects HTTP 200 quickly, so we process synchronously
    for (const entry of event.entry ?? []) {
        for (const change of entry.changes ?? []) {
            const messages = change.value?.messages;
            if (!messages) continue;

            for (const msg of messages) {
                const from = msg.from;

                // ── Image: run Document AI pipeline ──────────────────────────
                if (msg.type === 'image' && msg.image?.id) {
                    await sendTextMessage(from, '📸 Foto ricevuta. Analizzo il documento...');

                    const file = await downloadWhatsAppMedia(msg.image.id);
                    if (!file) {
                        await sendTextMessage(from, '⚠️ Non riesco a scaricare la foto. Riprova.');
                        continue;
                    }

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

                    await sendInteractiveButtons(
                        from,
                        `✅ ${label} (confidenza: ${pct}%)\n\nApri l'app per confermare l'azione.${warns}`,
                        ['Apri app', 'Cosa devo fare'],
                    );
                    continue;
                }

                // ── Document upload ───────────────────────────────────────────
                if (msg.type === 'document') {
                    const mime = msg.document?.mime_type ?? '';
                    if (mime.includes('csv') || mime.includes('excel') || mime.includes('spreadsheet')) {
                        await sendTextMessage(
                            from,
                            '📎 File ricevuto.\n\nPer importare gli studenti:\n' +
                            '1. Apri DocenteDoc AI\n' +
                            '2. Impostazioni → Dati & Cloud → Importa dati\n' +
                            '3. Carica il CSV/Excel\n\n' +
                            '_Import diretto da chat in arrivo prossimamente._'
                        );
                    } else {
                        await sendTextMessage(from, 'Formato file non supportato. Usa CSV o Excel per importare studenti.');
                    }
                    continue;
                }

                // ── Interactive button reply ──────────────────────────────────
                let textToProcess: string | undefined;
                if (msg.type === 'interactive') {
                    textToProcess = msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title;
                } else {
                    textToProcess = msg.text?.body?.trim();
                }

                if (!textToProcess) continue;

                // ── Natural language intent parsing ───────────────────────────
                const intent = parseIntent(textToProcess, 'whatsapp');
                const confirmText = buildConfirmationMessage(intent);
                const suggestions = getSuggestions(intent);
                const reply = buildEdgeResponse(intent, confirmText, suggestions);

                if (reply.suggestions && reply.suggestions.length > 0) {
                    await sendInteractiveButtons(from, reply.text, reply.suggestions);
                } else {
                    await sendTextMessage(from, reply.text);
                }
            }
        }
    }

    return new Response('ok');
}
