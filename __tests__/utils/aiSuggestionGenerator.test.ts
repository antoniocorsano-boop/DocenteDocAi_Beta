import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAiSuggestions } from '../../src/utils/aiSuggestionGenerator';
import { getProactiveSuggestions } from '../../src/services/aiService';
import { AppState } from '../../src/types';

vi.mock('../../src/services/aiService', () => ({
  getProactiveSuggestions: vi.fn()
}));

describe('aiSuggestionGenerator', () => {
  const mockAppState: Partial<AppState> = {
    user: { id: 'user1' } as any,
    students: [],
    lessons: {},
    evaluations: [],
    aiSettings: {} as any
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
  });

  it('should call AI service even without VITE_GEMINI_API_KEY', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    (getProactiveSuggestions as any).mockResolvedValue([{ id: 'ai1', title: 'AI' }]);
    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result[0].id).toBe('ai1');
    expect(getProactiveSuggestions).toHaveBeenCalled();
  });

  it('should return cached suggestions if valid', async () => {
    const cachedData = {
      suggestions: [{ id: 'cached1', title: 'Cached' }],
      timestamp: Date.now(),
      userId: 'user1'
    };
    localStorage.setItem('ai_suggestions_cache', JSON.stringify(cachedData));

    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result).toEqual(cachedData.suggestions);
    expect(getProactiveSuggestions).not.toHaveBeenCalled();
  });

  it('should ignore cache if userId mismatch', async () => {
    const cachedData = {
      suggestions: [{ id: 'cached1', title: 'Cached' }],
      timestamp: Date.now(),
      userId: 'other-user'
    };
    localStorage.setItem('ai_suggestions_cache', JSON.stringify(cachedData));
    (getProactiveSuggestions as any).mockResolvedValue([{ id: 'ai1', title: 'AI' }]);

    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result[0].id).toBe('ai1');
  });

  it('should ignore cache if expired', async () => {
    const cachedData = {
      suggestions: [{ id: 'cached1', title: 'Cached' }],
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      userId: 'user1'
    };
    localStorage.setItem('ai_suggestions_cache', JSON.stringify(cachedData));
    (getProactiveSuggestions as any).mockResolvedValue([{ id: 'ai1', title: 'AI' }]);

    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result[0].id).toBe('ai1');
  });

  it('should generate and cache new suggestions', async () => {
    const aiSuggestions = [{ id: 'ai1', title: 'AI' }];
    (getProactiveSuggestions as any).mockResolvedValue(aiSuggestions);

    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result).toEqual(aiSuggestions);
    
    const cached = JSON.parse(localStorage.getItem('ai_suggestions_cache')!);
    expect(cached.suggestions).toEqual(aiSuggestions);
  });

  it('should return fallback suggestions on error', async () => {
    (getProactiveSuggestions as any).mockRejectedValue(new Error('AI Error'));
    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe('fallback_import_students');
  });

  it('should handle localStorage errors gracefully', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage error'); });
    (getProactiveSuggestions as any).mockResolvedValue([{ id: 'ai1' }]);
    
    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result[0].id).toBe('ai1');
  });

  it('should handle localStorage setItem errors gracefully', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage error'); });
    (getProactiveSuggestions as any).mockResolvedValue([{ id: 'ai1' }]);
    
    const result = await generateAiSuggestions(mockAppState as AppState);
    expect(result[0].id).toBe('ai1');
  });

  it('should handle missing user id in cache and state', async () => {
    const stateNoUser: Partial<AppState> = {
      ...mockAppState,
      user: undefined
    };
    (getProactiveSuggestions as any).mockResolvedValue([{ id: 'ai1' }]);
    
    const result = await generateAiSuggestions(stateNoUser as AppState);
    expect(result[0].id).toBe('ai1');
    
    const cached = JSON.parse(localStorage.getItem('ai_suggestions_cache')!);
    expect(cached.userId).toBe('anonymous');
  });

  it('should provide different fallback suggestions based on state', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const stateWithStudents: Partial<AppState> = {
      ...mockAppState,
      students: [{ id: 's1' } as any],
      lessons: { 'l1': {} as any },
      evaluations: [{ id: 'e1' } as any]
    };
    const result = await generateAiSuggestions(stateWithStudents as AppState);
    // Should not have "Aggiungi Studenti" or "Crea Prima Lezione"
    expect(result.find(s => s.id === 'fallback_import_students')).toBeUndefined();
    expect(result.find(s => s.id === 'fallback_create_lesson')).toBeUndefined();
  });
});
