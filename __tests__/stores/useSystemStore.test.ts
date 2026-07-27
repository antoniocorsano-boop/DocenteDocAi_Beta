// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { useSystemStore } from "../../src/stores/useSystemStore";
import { UserProfile, KnowledgeBaseEntry, AiSuggestion, SystemSuggestion, Notifica, AnalyticsMetrics, AnalyticsSettings } from "../../src/types";

describe("useSystemStore", () => {
  beforeEach(() => {
    useSystemStore.getState().actions.resetSystemData();
  });

  // User Profile Tests
  describe("User Profile", () => {
    it("dovrebbe inizializzare con user null", () => {
      const state = useSystemStore.getState();
      expect(state.user).toBeNull();
    });

    it("dovrebbe impostare l utente", () => {
      const mockUser: UserProfile = {
        id: "user1",
        displayName: "Prof Rossi",
        email: "prof@test.it",
      };

      useSystemStore.getState().actions.setUser(mockUser);
      const state = useSystemStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.user?.displayName).toBe("Prof Rossi");
    });

    it("dovrebbe permettere di azzerare l utente", () => {
      const mockUser: UserProfile = {
        id: "user1",
        displayName: "Prof Rossi",
        email: "prof@test.it",
      };

      useSystemStore.getState().actions.setUser(mockUser);
      useSystemStore.getState().actions.setUser(null);
      expect(useSystemStore.getState().user).toBeNull();
    });
  });

  // Knowledge Base Tests
  describe("Knowledge Base", () => {
    it("dovrebbe inizializzare con KB guide di default", () => {
      const kb = useSystemStore.getState().knowledgeBase;
      expect(Array.isArray(kb)).toBe(true);
      expect(kb.length).toBeGreaterThan(0);
    });

    it("dovrebbe aggiungere entry alla knowledge base", () => {
      const initialKB = useSystemStore.getState().knowledgeBase;
      const newEntry: KnowledgeBaseEntry = {
        id: "kb1",
        fileName: "Nota Importante",
        content: "Questo � importante",
      };

      useSystemStore.getState().actions.setKnowledgeBase((prev: KnowledgeBaseEntry[]) => [
        ...prev,
        newEntry,
      ]);

      const newKB = useSystemStore.getState().knowledgeBase;
      expect(newKB.length).toBe(initialKB.length + 1);
    });

    it("dovrebbe impostare KB direttamente", () => {
      const kb = [{ id: "kb1", fileName: "F1", content: "C1" }];
      useSystemStore.getState().actions.setKnowledgeBase(kb);
      expect(useSystemStore.getState().knowledgeBase).toEqual(kb);
    });
  });

  // AI Suggestions Tests
  describe("AI Suggestions & Context", () => {
    it("dovrebbe inizializzare senza suggerimenti", () => {
      const state = useSystemStore.getState();
      expect(state.suggestions).toEqual([]);
      expect(state.activeSuggestion).toBeNull();
    });

    it("dovrebbe impostare suggerimenti AI", () => {
      const suggestions: AiSuggestion[] = [
        {
          id: "sugg1",
          icon: "info",
          title: "Suggerimento",
          description: "Suggerimento 1",
          action: { type: "view", payload: {} },
        },
      ];

      useSystemStore.getState().actions.setSuggestions(suggestions);
      expect(useSystemStore.getState().suggestions).toEqual(suggestions);
    });

    it("dovrebbe impostare suggerimento attivo", () => {
      const activeSugg: SystemSuggestion = {
        id: "sys1",
        message: "Suggerimento Attivo",
        targetView: "home",
        actionLabel: "Aggiungi",
        action: { type: "add", payload: {} },
      };

      useSystemStore.getState().actions.setActiveSuggestion(activeSugg);
      expect(useSystemStore.getState().activeSuggestion).toEqual(activeSugg);
    });

    it("dovrebbe cancellare suggerimento attivo", () => {
      const activeSugg: SystemSuggestion = {
        id: "sys1",
        message: "Suggerimento Attivo",
        targetView: "home",
        actionLabel: "Aggiungi",
        action: { type: "add", payload: {} },
      };

      useSystemStore.getState().actions.setActiveSuggestion(activeSugg);
      useSystemStore.getState().actions.setActiveSuggestion(null);
      expect(useSystemStore.getState().activeSuggestion).toBeNull();
    });

    it("dovrebbe dismissare e riattivare suggerimenti", () => {
      useSystemStore.getState().actions.dismissSuggestion("sugg1");
      expect(useSystemStore.getState().dismissedSuggestions.has("sugg1")).toBe(true);
      
      useSystemStore.getState().actions.reactivateSuggestion("sugg1");
      expect(useSystemStore.getState().dismissedSuggestions.has("sugg1")).toBe(false);
    });
  });

  // Notifications Tests
  describe("Notifications", () => {
    it("dovrebbe inizializzare con notifiche vuote", () => {
      expect(useSystemStore.getState().notifiche).toEqual([]);
    });

    it("dovrebbe impostare notifiche", () => {
      const notifications: Notifica[] = [
        {
          id: "notif1",
          titolo: "Avviso",
          messaggio: "Messaggio importante",
          type: "circular",
          data: new Date().toISOString(),
          letta: false,
        },
      ];

      useSystemStore.getState().actions.setNotifiche(notifications);
      expect(useSystemStore.getState().notifiche).toEqual(notifications);
    });

    it("dovrebbe impostare notifiche tramite funzione", () => {
      useSystemStore.getState().actions.setNotifiche([{ id: "n1", titolo: "T1", messaggio: "M1", type: "circular", data: "D1", letta: false }]);
      useSystemStore.getState().actions.setNotifiche((prev) => [...prev, { id: "n2", titolo: "T2", messaggio: "M2", type: "circular", data: "D2", letta: false }]);
      expect(useSystemStore.getState().notifiche).toHaveLength(2);
    });
  });

  describe("Analytics", () => {
    it("dovrebbe tracciare eventi analytics", () => {
      const { trackAnalyticsEvent } = useSystemStore.getState().actions;
      trackAnalyticsEvent("document_generated", "UDA");
      trackAnalyticsEvent("document_generated", "UDA"); // Track twice to cover existing entry branch
      const state = useSystemStore.getState();
      expect(state.analyticsEvents).toHaveLength(2);
      expect(state.analyticsMetrics.totalDocumentsGenerated).toBe(2);
      expect(state.analyticsMetrics.documentsByType["UDA"]).toBe(2);
    });

    it("dovrebbe tracciare feature usage", () => {
      const { trackAnalyticsEvent } = useSystemStore.getState().actions;
      trackAnalyticsEvent("feature_usage", "Chat");
      expect(useSystemStore.getState().analyticsMetrics.featuresUsage["Chat"]).toBe(1);
    });

    it("dovrebbe tracciare template creation", () => {
      const { trackAnalyticsEvent } = useSystemStore.getState().actions;
      trackAnalyticsEvent("template_created", "MyTemplate");
      expect(useSystemStore.getState().analyticsMetrics.templatesCreated).toBe(1);
    });

    it("dovrebbe tracciare export batch", () => {
      const { trackAnalyticsEvent } = useSystemStore.getState().actions;
      trackAnalyticsEvent("export_batch", "Batch1");
      expect(useSystemStore.getState().analyticsMetrics.exportBatchesCount).toBe(1);
    });

    it("dovrebbe tracciare ai interaction", () => {
      const { trackAnalyticsEvent } = useSystemStore.getState().actions;
      trackAnalyticsEvent("ai_interaction", "Gemini");
      expect(useSystemStore.getState().analyticsMetrics.aiInteractionsCount).toBe(1);
    });

    it("non dovrebbe tracciare se disabilitato", () => {
      const { setAnalyticsSettings, trackAnalyticsEvent } = useSystemStore.getState().actions;
      setAnalyticsSettings({ enabled: false });
      trackAnalyticsEvent("feature_usage", "Chat");
      expect(useSystemStore.getState().analyticsEvents).toHaveLength(0);
    });

    it("dovrebbe impostare eventi analytics tramite funzione", () => {
      useSystemStore.getState().actions.setAnalyticsEvents([{ id: "e1", timestamp: "T1", eventType: "feature_usage", featureName: "F1", metadata: {}, sessionId: "S1" }]);
      useSystemStore.getState().actions.setAnalyticsEvents((prev) => [...prev, { id: "e2", timestamp: "T2", eventType: "feature_usage", featureName: "F2", metadata: {}, sessionId: "S2" }]);
      expect(useSystemStore.getState().analyticsEvents).toHaveLength(2);
    });

    it("dovrebbe impostare metriche analytics tramite funzione", () => {
      useSystemStore.getState().actions.setAnalyticsMetrics((prev) => ({ ...prev, totalDocumentsGenerated: 10 }));
      expect(useSystemStore.getState().analyticsMetrics.totalDocumentsGenerated).toBe(10);
    });

    it("dovrebbe impostare impostazioni analytics tramite funzione", () => {
      useSystemStore.getState().actions.setAnalyticsSettings((prev) => ({ ...prev, enabled: false }));
      expect(useSystemStore.getState().analyticsSettings.enabled).toBe(false);
    });
  });

  describe("Other Data", () => {
    it("dovrebbe impostare corpora tramite funzione", () => {
      const corpora = [{ id: "c1", name: "Test Corpus" }];
      useSystemStore.getState().actions.setCorpora(corpora);
      useSystemStore.getState().actions.setCorpora((prev) => [...prev, { id: "c2", name: "C2" }]);
      expect(useSystemStore.getState().corpora).toHaveLength(2);
    });

    it("dovrebbe impostare templates tramite funzione", () => {
      const templates = [{ id: "t1", name: "Test Template" }];
      useSystemStore.getState().actions.setTemplates(templates);
      useSystemStore.getState().actions.setTemplates((prev) => [...prev, { id: "t2", name: "T2" }]);
      expect(useSystemStore.getState().templates).toHaveLength(2);
    });

    it("dovrebbe impostare feed sources tramite funzione", () => {
      const sources = [{ id: "f1", name: "Test Feed" }];
      useSystemStore.getState().actions.setFeedSources(sources);
      useSystemStore.getState().actions.setFeedSources((prev) => [...prev, { id: "f2", name: "F2" }]);
      expect(useSystemStore.getState().feedSources).toHaveLength(2);
    });

    it("dovrebbe caricare dal backup", () => {
      const backup = { corpora: [{ id: "c-b" }], dismissedSuggestions: ["s1"] };
      useSystemStore.getState().actions.loadFromBackup(backup as any);
      expect(useSystemStore.getState().corpora).toEqual(backup.corpora);
      expect(useSystemStore.getState().dismissedSuggestions.has("s1")).toBe(true);
    });

    it("dovrebbe caricare dal backup senza dismissedSuggestions", () => {
      const backup = { corpora: [{ id: "c-b" }] };
      useSystemStore.getState().actions.loadFromBackup(backup as any);
      expect(useSystemStore.getState().dismissedSuggestions.size).toBe(0);
    });
  });
});

