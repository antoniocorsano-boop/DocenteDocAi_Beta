import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listUnreadEmails, sendEmail } from '../../src/services/gmailService';
import { loadGapiClient, requestAccessToken } from '../../src/services/googleDriveService';

vi.mock('../../src/services/googleDriveService', () => ({
  loadGapiClient: vi.fn(),
  requestAccessToken: vi.fn()
}));

// Mock global gapi
const mockGapi = {
  client: {
    gmail: {
      users: {
        messages: {
          list: vi.fn(),
          get: vi.fn(),
          send: vi.fn()
        }
      }
    },
    load: vi.fn()
  }
};

(global as any).gapi = mockGapi;

describe('GmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGapi.client.gmail = {
      users: {
        messages: {
          list: vi.fn(),
          get: vi.fn(),
          send: vi.fn()
        }
      }
    } as any;
  });

  describe('listUnreadEmails', () => {
    it('should list unread emails and return details', async () => {
      (mockGapi.client.gmail.users.messages.list as any).mockResolvedValue({
        result: {
          messages: [{ id: 'msg1', threadId: 't1' }]
        }
      });

      (mockGapi.client.gmail.users.messages.get as any).mockResolvedValue({
        result: {
          id: 'msg1',
          snippet: 'Hello world',
          payload: {
            headers: [
              { name: 'From', value: 'sender@test.com' },
              { name: 'Subject', value: 'Test Subject' }
            ]
          }
        }
      });

      const result = await listUnreadEmails();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'msg1',
        snippet: 'Hello world',
        from: 'sender@test.com',
        subject: 'Test Subject'
      });
    });

    it('should return empty array if no messages found', async () => {
      (mockGapi.client.gmail.users.messages.list as any).mockResolvedValue({
        result: { messages: [] }
      });

      const result = await listUnreadEmails();
      expect(result).toEqual([]);
    });

    it('should handle missing headers or snippet', async () => {
      (mockGapi.client.gmail.users.messages.list as any).mockResolvedValue({
        result: { messages: [{ id: 'msg1' }] }
      });

      (mockGapi.client.gmail.users.messages.get as any).mockResolvedValue({
        result: {
          id: 'msg1',
          payload: { headers: [] }
        }
      });

      const result = await listUnreadEmails();
      expect(result[0].from).toBe('Sconosciuto');
      expect(result[0].subject).toBe('(Nessun oggetto)');
      expect(result[0].snippet).toBe('');
    });

    it('should handle missing payload or headers property', async () => {
      (mockGapi.client.gmail.users.messages.list as any).mockResolvedValue({
        result: { messages: [{ id: 'msg1' }] }
      });

      (mockGapi.client.gmail.users.messages.get as any).mockResolvedValue({
        result: {
          id: 'msg1',
          // payload missing
        }
      });

      const result = await listUnreadEmails();
      expect(result[0].from).toBe('Sconosciuto');
    });

    it('should request access token on 401/403 error', async () => {
      (mockGapi.client.gmail.users.messages.list as any).mockRejectedValue({
        result: { error: { code: 401 } }
      });

      await expect(listUnreadEmails()).rejects.toThrow('Permessi Gmail mancanti');
      expect(requestAccessToken).toHaveBeenCalled();
    });

    it('should throw generic error on other errors', async () => {
      (mockGapi.client.gmail.users.messages.list as any).mockRejectedValue(new Error('Network Error'));

      await expect(listUnreadEmails()).rejects.toThrow('Impossibile leggere le email');
    });
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      (mockGapi.client.gmail.users.messages.send as any).mockResolvedValue({});

      await sendEmail('to@test.com', 'Subject', 'Body');
      expect(mockGapi.client.gmail.users.messages.send).toHaveBeenCalled();
    });

    it('should request access token on 401/403 error during send', async () => {
      (mockGapi.client.gmail.users.messages.send as any).mockRejectedValue({
        result: { error: { code: 403 } }
      });

      await expect(sendEmail('to@test.com', 'Subject', 'Body')).rejects.toThrow('Permessi invio mail mancanti');
      expect(requestAccessToken).toHaveBeenCalled();
    });

    it('should throw generic error on other send errors', async () => {
      (mockGapi.client.gmail.users.messages.send as any).mockRejectedValue(new Error('Send Error'));

      await expect(sendEmail('to@test.com', 'Subject', 'Body')).rejects.toThrow('Impossibile inviare la mail');
    });
  });

  describe('ensureGmailApiLoaded', () => {
    it('should load gmail client if not already loaded', async () => {
      // We need to test the private function indirectly or by calling a public function that uses it
      // Since listUnreadEmails calls it:
      (mockGapi.client.gmail.users.messages.list as any).mockResolvedValue({ result: {} });
      
      // Temporarily remove gmail client to trigger load
      const originalGmail = mockGapi.client.gmail;
      (mockGapi.client as any).gmail = undefined;
      
      // Mock gapi.client.load to restore it
      (mockGapi.client.load as any).mockImplementation(() => {
        (mockGapi.client as any).gmail = originalGmail;
        return Promise.resolve();
      });

      await listUnreadEmails();
      expect(mockGapi.client.load).toHaveBeenCalledWith('gmail', 'v1');
    });
  });
});
