// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  cleanAndParseJson, 
  getLessonSuggestion, 
  analyzeImage, 
  performWebSearch,
  analyzeCircularDocument,
  getProactiveSuggestions,
  generateQuiz,
  generateStudioOutput,
  addContextToLesson,
  generateInclusivityAdaptations,
  generateThemeFromPrompt,
  generateImageFromPrompt,
  chatWithAi,
  extractEventFromText,
  refactorProgrammazione,
  generateContent,
  buildSystemInstruction,
  analyzeLessonPedagogy,
  generateLessonFromIdea,
  generateSituazionePartenza,
  generateMethodologyStrategies,
  suggestAnnualPlan,
  generateClassPlanningDocument,
  generateAnswerFromCorpus,
  generateTechnicalDocumentContent,
  generateAcademicEssayContent,
  getPeriodicJudgmentSuggestion,
  generateMarkdownReport,
  validateUdaVerticalCurriculum,
  generateLessonSequenceForClass,
  getPIPSuggestion,
  generateCompetencyNote,
  getAIPedagogicalAdvice,
  generateFormattedDocument,
  parseCurriculumFromText,
  refineTextWithAi,
  generateDocumentTable,
  discoverAndCreateFeed,
  fetchAndParseRssFeed,
  generateClassCouncilNarrativeReport,
  generateTemplateWithAi
} from '../../src/services/aiService';
import { getGoogleAIClient } from '../../src/services/aiClient';
import { AiSettings, Lezione, KnowledgeBaseEntry, PianoInclusione, Competenza, Studente } from '../../src/types';
import { GoogleGenAI } from '@google/genai';

// Mock del modulo aiClient per isolare i test dalle chiamate API reali
vi.mock('../../src/services/aiClient', () => ({
  getGoogleAIClient: vi.fn<() => GoogleGenAI>(),
  callAiWithRetry: async (fn: any) => await fn(),
}));

describe('aiService - Utility Functions', () => {
  describe('buildSystemInstruction', () => {
    it('dovrebbe restituire la persona di default se non viene fornito nulla', () => {
      const result = buildSystemInstruction();
      expect(result).toContain('ASSISTANTE DIDATTICO ESPERTO');
    });

    it('dovrebbe aggiungere il contesto della classe e della materia', () => {
      const result = buildSystemInstruction({ classContext: '5B', subject: 'Fisica' });
      expect(result).toContain('Classe Target: 5B');
      expect(result).toContain('Materia: Fisica');
    });

    it('dovrebbe permettere l\'override dell\'istruzione di sistema', () => {
      const result = buildSystemInstruction({}, 'Custom Persona');
      expect(result).toBe('Custom Persona');
    });
  });
});

describe('aiService - cleanAndParseJson', () => {
  it('dovrebbe parsare un JSON semplice', () => {
    const jsonString = '{"key": "value"}';
    expect(cleanAndParseJson(jsonString)).toEqual({ key: 'value' });
  });

  it('dovrebbe parsare un JSON racchiuso in un blocco markdown', () => {
    const jsonString = '```json\n{"key": "value"}\n```';
    expect(cleanAndParseJson(jsonString)).toEqual({ key: 'value' });
  });

  it('dovrebbe parsare un JSON racchiuso in un blocco markdown senza specificare "json"', () => {
    const jsonString = '```\n{"key": "value"}\n```';
    expect(cleanAndParseJson(jsonString)).toEqual({ key: 'value' });
  });

  it('dovrebbe parsare un JSON con testo extra prima e dopo', () => {
    const jsonString = 'Some text before. {"key": "value"} text after.';
    expect(cleanAndParseJson(jsonString)).toEqual({ key: 'value' });
  });

  it('dovrebbe parsare un array JSON', () => {
    const jsonString = '[{"item": 1}, {"item": 2}]';
    expect(cleanAndParseJson(jsonString)).toEqual([{ item: 1 }, { item: 2 }]);
  });

  it('dovrebbe lanciare un errore per JSON non valido', () => {
    const jsonString = '{"key": "value"';
    expect(() => cleanAndParseJson(jsonString)).toThrow("Il formato della risposta AI non è valido. Riprova.");
  });

  it('dovrebbe lanciare un errore per JSON vuoto', () => {
    const jsonString = '';
    expect(() => cleanAndParseJson(jsonString)).toThrow("Il formato della risposta AI non è valido. Riprova.");
  });

  it('dovrebbe trovare JSON tramite parentesi graffe se non c\'� markdown', () => {
    const text = 'Ecco il tuo JSON: {"a": 1} spero ti piaccia';
    expect(cleanAndParseJson(text)).toEqual({ a: 1 });
  });

  it('dovrebbe trovare JSON tramite parentesi quadre se non c\'� markdown', () => {
    const text = 'Ecco la lista: [1, 2, 3] fine.';
    expect(cleanAndParseJson(text)).toEqual([1, 2, 3]);
  });

  it('dovrebbe preferire parentesi graffe se appaiono prima delle quadre', () => {
    const text = 'Test {"a": [1]}';
    expect(cleanAndParseJson(text)).toEqual({ a: [1] });
  });

  it('dovrebbe preferire parentesi quadre se appaiono prima delle graffe', () => {
    const text = 'Test [{"a": 1}]';
    expect(cleanAndParseJson(text)).toEqual([{ a: 1 }]);
  });

  it('dovrebbe trovare JSON tramite parentesi quadre se appaiono prima delle graffe (senza markdown)', () => {
    const text = 'Ecco la lista: [1, 2, 3]';
    expect(cleanAndParseJson(text)).toEqual([1, 2, 3]);
  });

  it('dovrebbe lanciare errore se il markdown contiene JSON non valido', () => {
    const text = '```json\n{"key": "value"\n```';
    expect(() => cleanAndParseJson(text)).toThrow("Il formato della risposta AI non è valido. Riprova.");
  });

  it('dovrebbe lanciare errore se le parentesi contengono JSON non valido', () => {
    const text = 'Ecco il tuo JSON: {"a": 1 spero ti piaccia';
    expect(() => cleanAndParseJson(text)).toThrow("Il formato della risposta AI non è valido. Riprova.");
  });
});

describe('aiService - AI Generation Functions', () => {
  const mockGenerateContent = vi.fn();
  const mockAiClient = {
    models: {
      generateContent: mockGenerateContent,
    },
  };

  const mockAiSettings: AiSettings = { model: 'gemini-2.5-flash' };

  beforeEach(() => {
    (getGoogleAIClient as vi.Mock).mockReturnValue(mockAiClient);
    mockGenerateContent.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getLessonSuggestion', () => {
    const mockLessonContext = {
      classe: '3A',
      materia: 'Storia',
      existingLessonsInUda: [],
      allCompetenze: [],
      topic: 'Rivoluzione Francese',
      pianiInclusione: [],
    };

    it('dovrebbe generare un suggerimento di lezione correttamente', async () => {
      const mockApiResponse = { text: '{"contenuto": "La Rivoluzione", "tipoLezione": "Teoria", "obiettivi": "- Obiettivo 1", "compiti": "Studio pp. 1-10", "adattamenti": ""}' };
      mockGenerateContent.mockResolvedValue(mockApiResponse);

      const result = await getLessonSuggestion(mockAiSettings, mockLessonContext);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ contenuto: 'La Rivoluzione', tipoLezione: 'Teoria', obiettivi: '- Obiettivo 1', compiti: 'Studio pp. 1-10', adattamenti: '' });
    });

    it('dovrebbe gestire risposte AI non valide per i suggerimenti di lezione', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Testo non JSON' });
      const result = await getLessonSuggestion(mockAiSettings, mockLessonContext);
      expect(result).toEqual({ contenuto: "L'AI non ha fornito una risposta valida." });
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      await getLessonSuggestion({} as any, mockLessonContext);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('analyzeImage', () => {
    it('dovrebbe analizzare un\'immagine con un prompt', async () => {
      const mockImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const mockPrompt = 'Cosa c\'� in questa immagine?';
      const mockApiResponse = { text: 'Una singola immagine a pixel.' };
      mockGenerateContent.mockResolvedValue(mockApiResponse);

      const result = await analyzeImage(mockAiSettings, mockImageDataUrl, mockPrompt);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result).toBe('Una singola immagine a pixel.');
    });

    it('dovrebbe lanciare un errore per URL immagine non valido', async () => {
      await expect(analyzeImage(mockAiSettings, 'invalid-data-url', 'prompt')).rejects.toThrow('Invalid image data URL provided for analysis.');
    });

    it('dovrebbe usare mimeType di default se non trovato', async () => {
      const mockImageDataUrl = 'not-a-data-url,base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await analyzeImage(mockAiSettings, mockImageDataUrl, 'P');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        contents: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({ inlineData: expect.objectContaining({ mimeType: 'image/jpeg' }) })
          ])
        })
      }));
    });
  });

  describe('performWebSearch', () => {
    it('dovrebbe eseguire una ricerca web e estrarre le fonti', async () => {
      const mockQuery = 'ultime normative GDPR scuola';
      const mockApiResponse = {
        text: 'Sintesi delle normative GDPR.',
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'http://example.com/doc1', title: 'Doc 1' } },
              { web: { uri: 'http://example.com/doc2', title: 'Doc 2' } },
            ],
          },
        }],
      };
      mockGenerateContent.mockResolvedValue(mockApiResponse);

      const result = await performWebSearch(mockAiSettings, mockQuery);

      expect(result.text).toBe('Sintesi delle normative GDPR.');
      expect(result.sources).toEqual([
        { title: 'Doc 1', uri: 'http://example.com/doc1' },
        { title: 'Doc 2', uri: 'http://example.com/doc2' },
      ]);
    });

    it('dovrebbe ignorare fonti senza uri o titolo', async () => {
      const mockApiResponse = {
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'http://example.com/doc1' } },
              { web: { title: 'Doc 2' } },
              { web: { uri: 'http://example.com/doc3', title: 'Doc 3' } },
            ],
          },
        }],
      };
      mockGenerateContent.mockResolvedValue(mockApiResponse);
      const result = await performWebSearch(mockAiSettings, 'query');
      expect(result.sources).toEqual([{ title: 'Doc 3', uri: 'http://example.com/doc3' }]);
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await performWebSearch({} as any, 'query');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });

    it('dovrebbe restituire nessuna fonte se groundingMetadata � assente', async () => {
      const mockApiResponse = { text: 'No sources found.' };
      mockGenerateContent.mockResolvedValue(mockApiResponse);
      const result = await performWebSearch(mockAiSettings, 'query');
      expect(result.sources).toEqual([]);
    });
  });

  describe('analyzeCircularDocument', () => {
    it('dovrebbe analizzare un documento circolare', async () => {
      const mockResponse = { text: '{"titolo": "Circolare 1", "data": "2023-01-01", "sintesi": "Test"}' };
      mockGenerateContent.mockResolvedValue(mockResponse);
      const result = await analyzeCircularDocument(mockAiSettings, { fileContent: 'Test content' });
      expect(result.titolo).toBe('Circolare 1');
    });
  });

  describe('getProactiveSuggestions', () => {
    it('dovrebbe generare suggerimenti proattivi', async () => {
      const mockResponse = { text: '[{"id": "1", "title": "Suggerimento", "description": "Test", "priority": "high", "category": "didattica"}]' };
      mockGenerateContent.mockResolvedValue(mockResponse);
      const result = await getProactiveSuggestions(mockAiSettings, {
        students: [], evaluations: [], competencyEvaluations: [], udas: []
      });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Suggerimento');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[]' });
      await getProactiveSuggestions({} as any, { students: [], evaluations: [], competencyEvaluations: [], udas: [] });
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('generateQuiz', () => {
    it('dovrebbe generare un quiz', async () => {
      const mockResponse = { text: '{"title": "Quiz Test", "questions": []}' };
      mockGenerateContent.mockResolvedValue(mockResponse);
      const result = await generateQuiz(mockAiSettings, 'Corpus', {
        topic: 'Test', numQuestions: 5, difficulty: 'medio', type: 'scelta-multipla'
      });
      expect(result.title).toBe('Quiz Test');
    });
  });

  describe('generateStudioOutput', () => {
    it('dovrebbe generare output di studio', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Output di studio' });
      const result = await generateStudioOutput(mockAiSettings, 'Corpus', 'Task');
      expect(result).toBe('Output di studio');
    });
  });

  describe('addContextToLesson', () => {
    it('dovrebbe aggiungere contesto a una lezione', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Contesto aggiunto' });
      const mockLesson: Lezione = { id: '1', slotKey: '1', data: '2023-01-01', materia: 'Storia', classe: '3A', contenuto: 'Test', tipoLezione: 'frontale' };
      const result = await addContextToLesson(mockAiSettings, mockLesson);
      expect(result).toBe('Contesto aggiunto');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await addContextToLesson({} as any, {} as any);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('generateInclusivityAdaptations', () => {
    it('dovrebbe generare adattamenti per inclusione', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Adattamenti' });
      const mockLesson: Lezione = { id: '1', slotKey: '1', data: '2023-01-01', materia: 'Storia', classe: '3A', contenuto: 'Test', tipoLezione: 'frontale' };
      const result = await generateInclusivityAdaptations(mockAiSettings, { lesson: mockLesson }, []);
      expect(result).toBe('Adattamenti');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateInclusivityAdaptations({} as any, { lesson: {} as any }, []);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('generateThemeFromPrompt', () => {
    it('dovrebbe generare un tema da un prompt', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{"titolo": "Tema", "svolgimento": "Test"}' });
      const result = await generateThemeFromPrompt(mockAiSettings, 'Prompt');
      expect(result.titolo).toBe('Tema');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      await generateThemeFromPrompt({} as any, 'Prompt');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('generateImageFromPrompt', () => {
    it('dovrebbe generare un\'immagine da un prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{ inlineData: { data: 'base64data', mimeType: 'image/png' } }]
          }
        }]
      });
      const result = await generateImageFromPrompt(mockAiSettings, 'Prompt');
      expect(result.data).toBe('base64data');
      expect(result.mimeType).toBe('image/png');
    });

    it('dovrebbe usare valori di default per data e mimeType se mancanti in inlineData', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{ inlineData: {} }]
          }
        }]
      });
      const result = await generateImageFromPrompt(mockAiSettings, 'Prompt');
      expect(result.data).toBe('');
      expect(result.mimeType).toBe('image/png');
    });

    it('dovrebbe lanciare errore se l\'immagine non viene generata', async () => {
      mockGenerateContent.mockResolvedValue({ candidates: [] });
      await expect(generateImageFromPrompt(mockAiSettings, 'Prompt')).rejects.toThrow('Immagine non generata');
    });

    it('dovrebbe lanciare errore se parts � vuoto', async () => {
      mockGenerateContent.mockResolvedValue({ candidates: [{ content: { parts: [] } }] });
      await expect(generateImageFromPrompt(mockAiSettings, 'Prompt')).rejects.toThrow('Immagine non generata');
    });

    it('dovrebbe lanciare errore se nessuna part ha inlineData', async () => {
      mockGenerateContent.mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'No image' }] } }] });
      await expect(generateImageFromPrompt(mockAiSettings, 'Prompt')).rejects.toThrow('Immagine non generata');
    });
  });

  describe('chatWithAi', () => {
    it('dovrebbe gestire una chat con l\'AI', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Risposta chat' });
      const result = await chatWithAi(mockAiSettings, [{ role: 'user', text: 'Ciao' }]);
      expect(result.text).toBe('Risposta chat');
      expect(result.role).toBe('model');
    });

    it('dovrebbe gestire ruoli diversi da user nella cronologia', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await chatWithAi(mockAiSettings, [
        { role: 'model', text: 'Ciao' },
        { role: 'user', text: 'Come va?' }
      ]);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await chatWithAi({} as any, [{ role: 'user', text: 'Ciao' }]);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });

    it('dovrebbe usare response.text vuoto se assente', async () => {
      mockGenerateContent.mockResolvedValue({});
      const result = await chatWithAi(mockAiSettings, [{ role: 'user', text: 'Ciao' }]);
      expect(result.text).toBe('');
    });
  });

  describe('extractEventFromText', () => {
    it('dovrebbe estrarre un evento dal testo', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{"titolo": "Evento", "data": "2023-01-01"}' });
      const result = await extractEventFromText(mockAiSettings, 'Testo evento');
      expect(result.titolo).toBe('Evento');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      await extractEventFromText({} as any, 'Testo');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('refactorProgrammazione', () => {
    it('dovrebbe rifattorizzare una programmazione', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Programmazione rifattorizzata' });
      const result = await refactorProgrammazione(mockAiSettings, 'Testo');
      expect(result).toBe('Programmazione rifattorizzata');
    });
  });

  describe('generateContent (generic)', () => {
    it('dovrebbe generare contenuto generico', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Generico' });
      const result = await generateContent('Prompt', { temperature: 0.5, maxTokens: 500, stop: 'STOP' });
      expect(result.content).toBe('Generico');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        config: expect.objectContaining({
          temperature: 0.5,
          maxOutputTokens: 500,
          stopSequences: ['STOP']
        })
      }));
    });

    it('dovrebbe usare valori di default per temperature, maxTokens e stop', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Generico' });
      await generateContent('Prompt', {});
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        config: expect.objectContaining({
          temperature: 0.7,
          maxOutputTokens: 1000,
          stopSequences: undefined
        })
      }));
    });

    it('dovrebbe restituire stringa vuota se response.text è assente', async () => {
      mockGenerateContent.mockResolvedValue({});
      const result = await generateContent('Prompt', {});
      expect(result.content).toBe('');
    });

    it('dovrebbe gestire oggetti tramite ensureString', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateContent({ key: 'value' } as any, {});
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        contents: '{"key":"value"}'
      }));
    });

    it('dovrebbe gestire null/undefined tramite ensureString', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateContent(null as any, {});
      await generateContent(undefined as any, {});
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        contents: ''
      }));
    });

    it('dovrebbe gestire altri tipi tramite ensureString', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateContent(123 as any, {});
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        contents: '123'
      }));
    });
  });

  describe('analyzeLessonPedagogy', () => {
    it('dovrebbe analizzare la pedagogia di una lezione', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{"puntiForza": ["A"], "suggerimenti": ["B"]}' });
      const result = await analyzeLessonPedagogy(mockAiSettings, { title: 'T', description: 'D' });
      expect(result.puntiForza).toContain('A');
    });
  });

  describe('generateLessonFromIdea', () => {
    it('dovrebbe generare una lezione da un\'idea', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{"title": "Idea", "htmlContent": "<p>Test</p>"}' });
      const result = await generateLessonFromIdea(mockAiSettings, 'Idea', '3A', 'KB');
      expect(result.title).toBe('Idea');
    });
  });

  describe('generateSituazionePartenza', () => {
    it('dovrebbe generare una situazione di partenza', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Situazione' });
      const result = await generateSituazionePartenza(mockAiSettings, { classe: '3A', tags: [] });
      expect(result).toBe('Situazione');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateSituazionePartenza({} as any, { classe: '3A', tags: [] });
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('generateMethodologyStrategies', () => {
    it('dovrebbe generare strategie metodologiche', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Strategie' });
      const result = await generateMethodologyStrategies(mockAiSettings, 'Contesto');
      expect(result).toBe('Strategie');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateMethodologyStrategies({} as any, 'Contesto');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('suggestAnnualPlan', () => {
    it('dovrebbe suggerire un piano annuale', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[{"mese": "Gennaio", "argomento": "Test"}]' });
      const result = await suggestAnnualPlan(mockAiSettings, 'KB', 'Materia', 'Classe');
      expect(result).toHaveLength(1);
    });
  });

  describe('generateClassPlanningDocument', () => {
    it('dovrebbe generare un documento di programmazione classe', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Documento' });
      const result = await generateClassPlanningDocument(mockAiSettings, {
        situazionePartenza: 'S', studentiStats: 'ST', inclusioneStats: 'I', udaList: 'U', kbContext: 'K', metodologie: 'M'
      });
      expect(result).toBe('Documento');
    });
  });

  describe('generateAnswerFromCorpus', () => {
    it('dovrebbe generare una risposta da un corpus', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Risposta' });
      const result = await generateAnswerFromCorpus(mockAiSettings, 'Corpus', 'Domanda');
      expect(result.text).toBe('Risposta');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateAnswerFromCorpus({} as any, 'Corpus', 'Domanda');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('generateTechnicalDocumentContent', () => {
    it('dovrebbe generare contenuto per documento tecnico', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{"sections": []}' });
      const result = await generateTechnicalDocumentContent(mockAiSettings);
      expect(result?.sections).toBeDefined();
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      await generateTechnicalDocumentContent({} as any);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('generateAcademicEssayContent', () => {
    it('dovrebbe generare contenuto per saggio accademico', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{"introduction": "Intro"}' });
      const result = await generateAcademicEssayContent(mockAiSettings);
      expect(result?.introduction).toBe('Intro');
    });
  });

  describe('getPeriodicJudgmentSuggestion', () => {
    it('dovrebbe suggerire un giudizio periodico', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Giudizio' });
      const result = await getPeriodicJudgmentSuggestion(mockAiSettings, {} as any, '1', [], [], []);
      expect(result).toBe('Giudizio');
    });
  });

  describe('generateMarkdownReport', () => {
    it('dovrebbe generare un report in markdown', async () => {
      mockGenerateContent.mockResolvedValue({ text: '# Report' });
      const result = await generateMarkdownReport(mockAiSettings, 'Type', {});
      expect(result).toBe('# Report');
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateMarkdownReport({} as any, 'Type', {});
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });

  describe('validateUdaVerticalCurriculum', () => {
    it('dovrebbe validare una UDA', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      const result = await validateUdaVerticalCurriculum(mockAiSettings, {} as any, []);
      expect(result).toBe('OK');
    });
  });

  describe('generateLessonSequenceForClass', () => {
    it('dovrebbe generare una sequenza di lezioni', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[]' });
      const result = await generateLessonSequenceForClass(mockAiSettings, [], '3A', 'KB');
      expect(result).toEqual([]);
    });
  });

  describe('getPIPSuggestion', () => {
    it('dovrebbe suggerire contenuti per il PIP', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'PIP' });
      const result = await getPIPSuggestion(mockAiSettings, {} as any, [], [], [], 'S');
      expect(result).toBe('PIP');
    });
  });

  describe('generateCompetencyNote', () => {
    it('dovrebbe generare una nota per competenza', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Nota' });
      const result = await generateCompetencyNote(mockAiSettings, {} as any, {} as any, 'A' as any);
      expect(result).toBe('Nota');
    });
    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'OK' });
      await generateCompetencyNote({} as any, {} as any, {} as any, 'Avanzato');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });  });

  describe('getAIPedagogicalAdvice', () => {
    it('dovrebbe fornire consigli pedagogici', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      const result = await getAIPedagogicalAdvice(mockAiSettings, { lesson: {} as any, students: [], evaluations: [] }, 'T', []);
      expect(result).toEqual({});
    });
  });

  describe('generateFormattedDocument', () => {
    it('dovrebbe generare un documento formattato', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Doc' });
      const result = await generateFormattedDocument(mockAiSettings, 'C', 'P');
      expect(result).toBe('Doc');
    });
  });

  describe('parseCurriculumFromText', () => {
    it('dovrebbe parsare un curricolo', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      const result = await parseCurriculumFromText(mockAiSettings, 'T', 'S', 'G');
      expect(result).toEqual({});
    });
  });

  describe('refineTextWithAi', () => {
    it('dovrebbe rifinire il testo', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Refined' });
      const result = await refineTextWithAi(mockAiSettings, 'T', 'I');
      expect(result).toBe('Refined');
    });
  });

  describe('generateDocumentTable', () => {
    it('dovrebbe generare una tabella', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Table' });
      const result = await generateDocumentTable(mockAiSettings, 'D');
      expect(result).toBe('Table');
    });
  });

  describe('RSS Feed Functions (Disabled)', () => {
    it('discoverAndCreateFeed dovrebbe lanciare errore', async () => {
      await expect(discoverAndCreateFeed('url')).rejects.toThrow('RSS Disabilitato.');
    });
    it('fetchAndParseRssFeed dovrebbe lanciare errore', async () => {
      await expect(fetchAndParseRssFeed('url')).rejects.toThrow('RSS Disabilitato.');
    });
  });

  describe('generateClassCouncilNarrativeReport', () => {
    it('dovrebbe generare un verbale narrativo', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Verbale' });
      const result = await generateClassCouncilNarrativeReport(mockAiSettings, {
        classe: '3A', periodo: '1', stats: 'S', criticalities: [], strengths: []
      });
      expect(result).toBe('Verbale');
    });
  });

  describe('generateTemplateWithAi', () => {
    it('dovrebbe generare un template', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      const result = await generateTemplateWithAi(mockAiSettings, 'D', 'T');
      expect(result).toEqual({});
    });

    it('dovrebbe usare il modello di default se non specificato', async () => {
      mockGenerateContent.mockResolvedValue({ text: '{}' });
      await generateTemplateWithAi({} as any, 'D', 'T');
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-3-flash-preview'
      }));
    });
  });
});
