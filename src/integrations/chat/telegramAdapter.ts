/**
 * Telegram Chat Adapter
 *
 * Implements the ChatAdapter interface for the Telegram Bot API.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  NOTA: L'integrazione Telegram richiede un backend server.  │
 * │                                                             │
 * │  Architettura prevista:                                     │
 * │    Telegram Bot → POST /api/webhook-telegram                │
 * │    (Vercel Edge Function) → parseIntent() → execAction()    │
 * │    → pushEvent() → risposta all'utente                      │
 * │                                                             │
 * │  Questo adapter fornisce:                                   │
 * │  - Parsing degli Update in ingresso                         │
 * │  - Formattazione dei messaggi in uscita                     │
 * │  - URL del webhook da registrare                            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Per attivare:
 * 1. Crea un bot tramite @BotFather su Telegram → ottieni il token
 * 2. Imposta TELEGRAM_BOT_TOKEN nelle variabili Vercel
 * 3. Aggiungi l'Edge Function in api/webhook-telegram.ts
 * 4. Registra il webhook: POST https://api.telegram.org/bot{token}/setWebhook
 */

import type { ChatAdapter, ChatChannelMessage, ChatResponse } from '../../types/integration.types';
import { parseIntent } from '../commandInterpreter';

// ─── Types for Telegram Bot API ───────────────────────────────────────────────

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: { id: number; username?: string; first_name: string };
        chat: { id: number };
        date: number;
        text?: string;
    };
}

interface TelegramSendMessage {
    chat_id: number;
    text: string;
    parse_mode?: 'Markdown' | 'HTML';
    reply_markup?: {
        keyboard: Array<Array<{ text: string }>>;
        one_time_keyboard: boolean;
        resize_keyboard: boolean;
    };
}

// ─── Adapter implementation ───────────────────────────────────────────────────

export const telegramAdapter: ChatAdapter = {
    integrationId: 'telegram',

    parseIncoming(raw: unknown): ChatChannelMessage {
        const update = raw as TelegramUpdate;
        const msg = update.message;
        if (!msg || !msg.text) {
            return {
                id: String(update.update_id),
                from: 'unknown',
                text: '',
                timestamp: new Date().toISOString(),
            };
        }
        const intent = parseIntent(msg.text, 'telegram');
        return {
            id: String(msg.message_id),
            from: String(msg.from.id),
            text: msg.text,
            timestamp: new Date(msg.date * 1000).toISOString(),
            intent,
        };
    },

    formatOutgoing(response: ChatResponse): TelegramSendMessage {
        const base: TelegramSendMessage = {
            chat_id: 0, // filled by the Edge Function
            text: response.text,
            parse_mode: 'Markdown',
        };

        if (response.suggestions && response.suggestions.length > 0) {
            base.reply_markup = {
                keyboard: response.suggestions.map((s) => [{ text: s }]),
                one_time_keyboard: true,
                resize_keyboard: true,
            };
        }

        return base;
    },

    getWebhookUrl(baseUrl: string): string {
        return `${baseUrl}/api/webhook-telegram`;
    },
};

/**
 * Edge Function template (place in api/webhook-telegram.ts when ready):
 *
 * ```ts
 * import { telegramAdapter } from '../src/integrations/chat/telegramAdapter';
 * import { parseIntent, buildConfirmationMessage, getSuggestions } from '../src/integrations/commandInterpreter';
 *
 * export const config = { runtime: 'edge' };
 *
 * const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
 *
 * export default async function handler(req: Request): Promise<Response> {
 *   const update = await req.json();
 *   const message = telegramAdapter.parseIncoming(update);
 *   const intent = parseIntent(message.text, 'telegram');
 *   const replyText = buildConfirmationMessage(intent);
 *   const suggestions = getSuggestions(intent);
 *
 *   const outgoing = telegramAdapter.formatOutgoing({ text: replyText, suggestions });
 *   const chatId = (update as any).message?.chat?.id;
 *   outgoing.chat_id = chatId;
 *
 *   await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(outgoing),
 *   });
 *
 *   return new Response('ok');
 * }
 * ```
 */
