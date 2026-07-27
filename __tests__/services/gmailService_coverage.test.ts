import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as GmailService from '../../src/services/gmailService';

describe('GmailService Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listUnreadEmails', () => {
        it('should return empty array if no messages', async () => {
            ((global as any).gapi.client.gmail.users.messages.list as any).mockResolvedValue({
                result: { messages: [] }
            });
            const result = await GmailService.listUnreadEmails();
            expect(result).toEqual([]);
        });

        it('should return message details', async () => {
            ((global as any).gapi.client.gmail.users.messages.list as any).mockResolvedValue({
                result: { messages: [{ id: 'msg1' }] }
            });
            ((global as any).gapi.client.gmail.users.messages.get as any).mockResolvedValue({
                result: {
                    id: 'msg1',
                    snippet: 'Hello',
                    payload: {
                        headers: [
                            { name: 'From', value: 'sender@test.com' },
                            { name: 'Subject', value: 'Test Subject' }
                        ]
                    }
                }
            });

            const result = await GmailService.listUnreadEmails();
            expect(result).toHaveLength(1);
            expect(result[0].from).toBe('sender@test.com');
            expect(result[0].subject).toBe('Test Subject');
        });

        it('should handle 403 error and request access token', async () => {
            ((global as any).gapi.client.gmail.users.messages.list as any).mockRejectedValue({
                result: { error: { code: 403 } }
            });

            await expect(GmailService.listUnreadEmails()).rejects.toThrow('Permessi Gmail mancanti');
        });
    });

    describe('sendEmail', () => {
        it('should send email successfully', async () => {
            ((global as any).gapi.client.gmail.users.messages.send as any).mockResolvedValue({});
            await expect(GmailService.sendEmail('to@test.com', 'Sub', 'Body')).resolves.toBeUndefined();
            expect(((global as any).gapi.client.gmail.users.messages.send as any)).toHaveBeenCalled();
        });

        it('should handle send error', async () => {
            ((global as any).gapi.client.gmail.users.messages.send as any).mockRejectedValue(new Error('Send failed'));
            await expect(GmailService.sendEmail('to@test.com', 'Sub', 'Body')).rejects.toThrow('Impossibile inviare la mail');
        });
    });
});
