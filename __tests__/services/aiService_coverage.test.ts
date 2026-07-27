// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as aiService from '../../src/services/aiService';
import * as aiClient from '../../src/services/aiClient';

// Mock aiClient
vi.mock('../../src/services/aiClient', () => ({
    getGoogleAIClient: vi.fn(),
    callAiWithRetry: vi.fn((fn) => fn()),
    isAiConfigured: vi.fn(() => true)
}));

describe('aiService', () => {
    const mockAiSettings = { model: 'gemini-3-flash-preview' };
    
    const mockGenerateContent = vi.fn();
    const mockAiClient = {
        models: {
            generateContent: mockGenerateContent
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (aiClient.getGoogleAIClient as any).mockResolvedValue(mockAiClient);
    });

    describe('cleanAndParseJson', () => {
        it('should parse simple JSON', () => {
            const result = aiService.cleanAndParseJson('{"key": "value"}');
            expect(result).toEqual({ key: 'value' });
        });

        it('should parse JSON inside markdown blocks', () => {
            const result = aiService.cleanAndParseJson('```json\n{"key": "value"}\n```');
            expect(result).toEqual({ key: 'value' });
        });

        it('should extract JSON from text with extra content', () => {
            const result = aiService.cleanAndParseJson('Here is the result: {"key": "value"} hope you like it.');
            expect(result).toEqual({ key: 'value' });
        });

        it('should extract array from text', () => {
            const result = aiService.cleanAndParseJson('Result: [{"a": 1}]');
            expect(result).toEqual([{ a: 1 }]);
        });

        it('should throw error for invalid JSON', () => {
            expect(() => aiService.cleanAndParseJson('invalid')).toThrow();
        });
    });

    describe('buildSystemInstruction', () => {
        it('should return default persona', () => {
            const result = aiService.buildSystemInstruction();
            expect(result).toContain('ASSISTANTE DIDATTICO ESPERTO');
        });

        it('should include context', () => {
            const result = aiService.buildSystemInstruction({ classContext: '1A', subject: 'Math' });
            expect(result).toContain('Classe Target: 1A');
            expect(result).toContain('Materia: Math');
        });

        it('should allow override', () => {
            const result = aiService.buildSystemInstruction(undefined, 'Custom Persona');
            expect(result).toBe('Custom Persona');
        });
    });

    describe('analyzeCircularDocument', () => {
        it('should call AI and return parsed result', async () => {
            mockGenerateContent.mockResolvedValue({
                text: '```json\n{"title": "Test Circular", "summary": "Test Summary", "actions": []}\n```'
            });

            const result = await aiService.analyzeCircularDocument(mockAiSettings, { fileContent: 'test content' });
            
            expect(mockGenerateContent).toHaveBeenCalled();
            expect((result as any).title).toBe('Test Circular');
        });
    });

    describe('performWebSearch', () => {
        it('should return text and sources', async () => {
            mockGenerateContent.mockResolvedValue({
                text: 'Search result',
                candidates: [{
                    groundingMetadata: {
                        groundingChunks: [
                            { web: { title: 'Source 1', uri: 'http://test.com' } }
                        ]
                    }
                }]
            });

            const result = await aiService.performWebSearch(mockAiSettings, 'test query');
            
            expect(result.text).toBe('Search result');
            expect(result.sources).toHaveLength(1);
            expect(result.sources[0].title).toBe('Source 1');
        });

        it('should handle no sources', async () => {
            mockGenerateContent.mockResolvedValue({
                text: 'No sources'
            });

            const result = await aiService.performWebSearch(mockAiSettings, 'test query');
            expect(result.sources).toHaveLength(0);
        });
    });

    describe('getLessonSuggestion', () => {
        it('should return lesson suggestion', async () => {
            mockGenerateContent.mockResolvedValue({
                text: '{"contenuto": "Suggested lesson content"}'
            });

            const result = await aiService.getLessonSuggestion(mockAiSettings, {
                classe: '1A',
                materia: 'Italiano',
                existingLessonsInUda: [],
                allCompetenze: []
            });

            expect(result.contenuto).toBe('Suggested lesson content');
        });

        it('should handle AI failure gracefully', async () => {
            mockGenerateContent.mockResolvedValue({
                text: 'invalid json'
            });

            const result = await aiService.getLessonSuggestion(mockAiSettings, {
                classe: '1A',
                materia: 'Italiano',
                existingLessonsInUda: [],
                allCompetenze: []
            });

            expect(result.contenuto).toContain('non ha fornito una risposta valida');
        });
    });

    describe('generateContent', () => {
        it('should generate content with options', async () => {
            mockGenerateContent.mockResolvedValue({
                text: 'Generated text'
            });

            const result = await aiService.generateContent('test prompt', { temperature: 0.5 });
            expect(result.content).toBe('Generated text');
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                config: expect.objectContaining({ temperature: 0.5 })
            }));
        });
    });

    describe('analyzeLessonPedagogy', () => {
        it('should return pedagogical analysis', async () => {
            mockGenerateContent.mockResolvedValue({
                text: '{"strengths": ["Good"], "weaknesses": ["None"]}'
            });

            const result = await aiService.analyzeLessonPedagogy(mockAiSettings, { title: 'T', description: 'D' });
            expect((result as any).strengths).toContain('Good');
        });
    });

    describe('chatWithAi', () => {
        it('should handle chat messages', async () => {
            mockGenerateContent.mockResolvedValue({
                text: 'AI response'
            });

            const messages = [{ role: 'user', text: 'Hello' }];
            const result = await aiService.chatWithAi(mockAiSettings, messages as any);
            
            expect(result.role).toBe('model');
            expect(result.text).toBe('AI response');
        });
    });

    describe('Other Generation Functions', () => {
        it('generateLessonFromIdea should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{"title": "T", "htmlContent": "H"}' });
            const result = await aiService.generateLessonFromIdea(mockAiSettings, 'idea', '1A');
            expect(result.title).toBe('T');
        });

        it('generateSituazionePartenza should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Situazione' });
            const result = await aiService.generateSituazionePartenza(mockAiSettings, { classe: '1A', tags: [] });
            expect(result).toBe('Situazione');
        });

        it('generateMethodologyStrategies should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Metodologie' });
            const result = await aiService.generateMethodologyStrategies(mockAiSettings, 'ctx');
            expect(result).toBe('Metodologie');
        });

        it('suggestAnnualPlan should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '[{"title": "UDA 1"}]' });
            const result = await aiService.suggestAnnualPlan(mockAiSettings, 'kb', 'Italiano', '1A');
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('UDA 1');
        });

        it('generateClassPlanningDocument should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Document' });
            const result = await aiService.generateClassPlanningDocument(mockAiSettings, {
                situazionePartenza: '',
                studentiStats: '',
                inclusioneStats: '',
                udaList: '',
                kbContext: 'some context',
                metodologie: ''
            });
            expect(result).toBe('Document');
        });

        it('generateAnswerFromCorpus should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Answer' });
            const result = await aiService.generateAnswerFromCorpus(mockAiSettings, 'corpus', 'q');
            expect(result.text).toBe('Answer');
        });

        it('generateTechnicalDocumentContent should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{"title": "Tech"}' });
            const result = await aiService.generateTechnicalDocumentContent(mockAiSettings);
            expect(result?.title).toBe('Tech');
        });

        it('generateAcademicEssayContent should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{"title": "Essay"}' });
            const result = await aiService.generateAcademicEssayContent(mockAiSettings);
            expect(result?.title).toBe('Essay');
        });

        it('getPeriodicJudgmentSuggestion should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Judgment' });
            const result = await aiService.getPeriodicJudgmentSuggestion(mockAiSettings, {} as any, '1', [], [], []);
            expect(result).toBe('Judgment');
        });

        it('generateMarkdownReport should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Report' });
            const result = await aiService.generateMarkdownReport(mockAiSettings, 'type', {});
            expect(result).toBe('Report');
        });

        it('validateUdaVerticalCurriculum should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Validation' });
            const result = await aiService.validateUdaVerticalCurriculum(mockAiSettings, {} as any, []);
            expect(result).toBe('Validation');
        });

        it('generateLessonSequenceForClass should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '[{"title": "L1"}]' });
            const result = await aiService.generateLessonSequenceForClass(mockAiSettings, [], '1A', 'kb');
            expect(result).toHaveLength(1);
        });

        it('getPIPSuggestion should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'PIP' });
            const result = await aiService.getPIPSuggestion(mockAiSettings, {} as any, [], [], [], 'sec');
            expect(result).toBe('PIP');
        });

        it('generateCompetencyNote should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Note' });
            const result = await aiService.generateCompetencyNote(mockAiSettings, {} as any, {} as any, 'A' as any);
            expect(result).toBe('Note');
        });

        it('getAIPedagogicalAdvice should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{"advice": "A"}' });
            const result = await aiService.getAIPedagogicalAdvice(mockAiSettings, {} as any, 'type', []);
            expect(result.advice).toBe('A');
        });

        it('generateFormattedDocument should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Doc' });
            const result = await aiService.generateFormattedDocument(mockAiSettings, 'corpus', 'prompt');
            expect(result).toBe('Doc');
        });

        it('generateQuiz should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{"questions": []}' });
            const result = await aiService.generateQuiz(mockAiSettings, 'corpus', { topic: 'T', numQuestions: 5, difficulty: 'medio', type: 'scelta-multipla' });
            expect(result.questions).toBeDefined();
        });

        it('generateStudioOutput should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Output' });
            const result = await aiService.generateStudioOutput(mockAiSettings, 'corpus', 'task');
            expect(result).toBe('Output');
        });

        it('addContextToLesson should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Context' });
            const result = await aiService.addContextToLesson(mockAiSettings, {} as any);
            expect(result).toBe('Context');
        });

        it('generateInclusivityAdaptations should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Adaptations' });
            const result = await aiService.generateInclusivityAdaptations(mockAiSettings, { lesson: {} as any }, []);
            expect(result).toBe('Adaptations');
        });

        it('getProactiveSuggestions should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '[{"title": "S1"}]' });
            const result = await aiService.getProactiveSuggestions(mockAiSettings, { students: [], evaluations: [], competencyEvaluations: [], udas: [] });
            expect(result).toHaveLength(1);
        });

        it('generateThemeFromPrompt should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{"theme": "T"}' });
            const result = await aiService.generateThemeFromPrompt(mockAiSettings, 'p');
            expect(result.theme).toBe('T');
        });

        it('generateImageFromPrompt should work', async () => {
            mockGenerateContent.mockResolvedValue({
                candidates: [{
                    content: {
                        parts: [{ inlineData: { data: 'base64', mimeType: 'image/png' } }]
                    }
                }]
            });
            const result = await aiService.generateImageFromPrompt(mockAiSettings, 'p');
            expect(result.data).toBe('base64');
        });

        it('generateImageFromPrompt should throw if no image', async () => {
            mockGenerateContent.mockResolvedValue({ candidates: [] });
            await expect(aiService.generateImageFromPrompt(mockAiSettings, 'p')).rejects.toThrow('Immagine non generata');
        });

        it('extractEventFromText should work', async () => {
            mockGenerateContent.mockResolvedValue({ text: '{"title": "Event"}' });
            const result = await aiService.extractEventFromText(mockAiSettings, 'text');
            expect(result.title).toBe('Event');
        });
    });
});
