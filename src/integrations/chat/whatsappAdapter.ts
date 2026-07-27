/**
 * WhatsApp Chat Adapter
 *
 * Implements the ChatAdapter interface for the WhatsApp Business API.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  NOTA: L'integrazione WhatsApp richiede un backend server.  │
 * │                                                             │
 * │  Architettura prevista:                                     │
 * │    WhatsApp Cloud API → POST /api/webhook/whatsapp          │
 * │    (Vercel Edge Function) → parseIntent() → execAction()    │
 * │    → pushEvent() → risposta all'utente                      │
 * │                                                             │
 * │  Questo adapter fornisce:                                   │
 * │  - Parsing dei messaggi in ingresso                         │
 * │  - Formattazione delle risposte in uscita                   │
 * │  - URL del webhook da registrare                            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Per attivare:
 * 1. Crea un'app su https://developers.facebook.com
 * 2. Configura WhatsApp Business API con il numero di telefono
 * 3. Aggiungi l'Edge Function in api/webhook-whatsapp.ts
 * 4. Registra il webhook URL su Meta Developer Console
 */

import type { ChatAdapter, ChatChannelMessage, ChatResponse } from '../../types/integration.types';
import { parseIntent } from '../commandInterpreter';

// ─── Types for WhatsApp Cloud API ─────────────────────────────────────────────

interface WhatsAppWebhookBody {
    object: string;
    entry: Array<{
        changes: Array<{
            value: {
                messages?: Array<{
                    id: string;
                    from: string;
                    timestamp: string;
                    text?: { body: string };
                }>;
            };
        }>;
    }>;
}

interface WhatsAppOutgoing {
    messaging_product: 'whatsapp';
    to: string;
    type: 'text';
    text: { body: string };
}

// ─── Adapter implementation ───────────────────────────────────────────────────

export const whatsappAdapter: ChatAdapter = {
    integrationId: 'whatsapp',

    parseIncoming(raw: unknown): ChatChannelMessage {
        const body = raw as WhatsAppWebhookBody;
        const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!msg || !msg.text) {
            return {
                id: 'unknown',
                from: 'unknown',
                text: '',
                timestamp: new Date().toISOString(),
            };
        }
        const intent = parseIntent(msg.text.body, 'whatsapp');
        return {
            id: msg.id,
            from: msg.from,
            text: msg.text.body,
            timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
            intent,
        } as ChatChannelMessage;
    },

    formatOutgoing(response: ChatResponse): WhatsAppOutgoing {
        return {
            messaging_product: 'whatsapp',
            to: '', // filled by the Edge Function with the sender's number
            type: 'text',
            text: { body: response.text },
        };
    },

    getWebhookUrl(baseUrl: string): string {
        return `${baseUrl}/api/webhook-whatsapp`;
    },
};

/**
 * Edge Function template (place in api/webhook-whatsapp.ts when ready):
 *
 * ```ts
 * import { whatsappAdapter } from '../src/integrations/chat/whatsappAdapter';
 * import { parseIntent, buildConfirmationMessage } from '../src/integrations/commandInterpreter';
 *
 * export const config = { runtime: 'edge' };
 *
 * export default async function handler(req: Request): Promise<Response> {
 *   // Webhook verification (GET)
 *   if (req.method === 'GET') {
 *     const { searchParams } = new URL(req.url);
 *     if (searchParams.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN) {
 *       return new Response(searchParams.get('hub.challenge'));
 *     }
 *     return new Response('Forbidden', { status: 403 });
 *   }
 *
 *   // Incoming message (POST)
 *   const body = await req.json();
 *   const message = whatsappAdapter.parseIncoming(body);
 *   const intent = parseIntent(message.text, 'whatsapp');
 *   const reply = buildConfirmationMessage(intent);
 *
 *   // TODO: execute intent against the data store, then push IntegrationEvent
 *
 *   return new Response(JSON.stringify({ reply }), { headers: { 'Content-Type': 'application/json' } });
 * }
 * ```
 */
