// ============================================================================
// ANALYTICS DOMAIN — analytics events, metrics, and settings
// ============================================================================

export interface AnalyticsEvent {
    id: string;
    timestamp: string;
    eventType: 'feature_usage' | 'document_generated' | 'template_created' | 'export_batch' | 'ai_interaction' | 'navigation';
    featureName: string;
    metadata?: Record<string, string | number | boolean>;
    sessionId: string;
}

export interface AnalyticsMetrics {
    totalDocumentsGenerated: number;
    documentsByType: Record<string, number>;
    featuresUsage: Record<string, number>;
    templatesCreated: number;
    exportBatchesCount: number;
    aiInteractionsCount: number;
    averageSessionDuration: number;
    lastUpdated: string;
}

export interface AnalyticsSettings {
    enabled: boolean;
    collectFeatureUsage: boolean;
    collectDocumentMetrics: boolean;
    collectPerformanceMetrics: boolean;
    retentionDays: number; // Giorni di conservazione dati
    lastReset: string | null;
}
