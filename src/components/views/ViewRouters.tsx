// MD3 Compliant
/**
 * ViewRouters.ts
 * Centralizza i router per tutte le categorie di viste
 * Usato da ViewManager per il rendering dinamico
 * 
 * NOTE: Preferire i nomi canonici in italiano per le view (es. 'calendario', 'uda', 'reportistica').
 * English aliases (eg. 'calendar', 'udas', 'reports') **non sono più accettati**; usare i token canonici italiani (es. 'calendario', 'uda', 'reportistica').
 * Questo file ora richiede i nomi canonici: le occorrenze inglesi devono essere migrate.
 *
 * Categorie di viste:
 * - Scheduling (Timetable, Calendar, Lessons)
 * - Evaluation (Evaluations, Register, Competency)
 * - Planning (UDA, Rubric, Inclusion, Curriculum)
 * - Analytics (Analytics, Reports, ConsiglioClasse)
 * - Settings (Home, Settings, KnowledgeBase, Studio, FeedManager)
 */

/**
 * ViewRouters.ts
 * // M3Expressive refactor: File di routing senza stili, già conforme M3.
 * Centralizza i router per tutte le categorie di viste
 * Usato da ViewManager per il rendering dinamico
 *
 * NOTE: Preferire i nomi canonici in italiano per le view (es. 'calendario', 'uda', 'reportistica').
 * English aliases (eg. 'calendar', 'udas', 'reports') **non sono più accettati**; usare i token canonici italiani (es. 'calendario', 'uda', 'reportistica').
 * Questo file ora richiede i nomi canonici: le occorrenze inglesi devono essere migrate.
 *
 * Categorie di viste:
 * - Scheduling (Timetable, Calendar, Lessons)
 * - Evaluation (Evaluations, Register, Competency)
 * - Planning (UDA, Rubric, Inclusion, Curriculum)
 * - Analytics (Analytics, Reports, ConsiglioClasse)
 * - Settings (Home, Settings, KnowledgeBase, Studio, FeedManager)
 */

import * as React from 'react';
import { messages } from '../../messages';
import { SchedulingViewsRenderer } from './SchedulingViews';
import { EvaluationViewsRenderer } from './EvaluationViews';
import { PlanningViewsRenderer } from './PlanningViews';
import { AnalyticsViewsRenderer } from './AnalyticsViews';
import { SettingsViewsRenderer } from './SettingsViews';

// Tipi delle props dei renderer (type-only imports)
import type { SchedulingViewsProps } from './SchedulingViews';
import type { EvaluationViewsProps } from './EvaluationViews';
import type { PlanningViewsProps } from './PlanningViews';
import type { AnalyticsViewsProps } from './AnalyticsViews';
import type { SettingsViewsProps } from './SettingsViews';

// Tipo per mapping automatico view → router
export type ViewCategory = 'scheduling' | 'evaluation' | 'planning' | 'analytics' | 'settings';

export type SchedulingViewType = 'timetable' | 'calendario' | 'lessons';
export type EvaluationViewType = 'evaluations' | 'register' | 'class-competency-dashboard' | 'competency-levels';
export type PlanningViewType = 'uda' | 'rubriche' | 'didattica-inclusiva' | 'curriculum-manager';
export type AnalyticsViewType = 'analytics' | 'reportistica' | 'improvement-guide' | 'consiglio-di-classe';
export type SettingsViewType = 'home' | 'settings' | 'knowledge-base' | 'studio' | 'feed-manager' | 'copilot';

export type AnyViewType = 
    | SchedulingViewType 
    | EvaluationViewType 
    | PlanningViewType 
    | AnalyticsViewType 
    | SettingsViewType;

/**
 * Mappa una vista al suo router e tipo
 * Usato da ViewManager per renderizzare dinamicamente
 */
export function getViewRouter(viewName: string): {
    category: ViewCategory;
    viewType: AnyViewType;
} | null {
    // Scheduling
    if (viewName === 'timetable') return { category: 'scheduling', viewType: 'timetable' as SchedulingViewType };
    if (viewName === 'calendario') return { category: 'scheduling', viewType: 'calendario' as SchedulingViewType };
    if (viewName === 'lessons') return { category: 'scheduling', viewType: 'lessons' as SchedulingViewType };

    // Evaluation
    if (viewName === 'evaluations') return { category: 'evaluation', viewType: 'evaluations' as EvaluationViewType };
    if (viewName === 'register') return { category: 'evaluation', viewType: 'register' as EvaluationViewType };
    if (viewName === 'class-competency-dashboard') return { category: 'evaluation', viewType: 'class-competency-dashboard' as EvaluationViewType };
    if (viewName === 'competency-levels') return { category: 'evaluation', viewType: 'competency-levels' as EvaluationViewType };

    // Planning
    if (viewName === 'uda') return { category: 'planning', viewType: 'uda' as PlanningViewType };
    if (viewName === 'rubriche') return { category: 'planning', viewType: 'rubriche' as PlanningViewType };
    if (viewName === 'didattica-inclusiva') return { category: 'planning', viewType: 'didattica-inclusiva' as PlanningViewType };
    if (viewName === 'curriculum-manager') return { category: 'planning', viewType: 'curriculum-manager' as PlanningViewType };

    // Analytics
    if (viewName === 'analytics') return { category: 'analytics', viewType: 'analytics' as AnalyticsViewType };
    if (viewName === 'reportistica') return { category: 'analytics', viewType: 'reportistica' as AnalyticsViewType };
    if (viewName === 'improvement-guide') return { category: 'analytics', viewType: 'improvement-guide' as AnalyticsViewType };
    if (viewName === 'consiglio-di-classe') return { category: 'analytics', viewType: 'consiglio-di-classe' as AnalyticsViewType };

    // Settings
    if (viewName === 'home') return { category: 'settings', viewType: 'home' as SettingsViewType };
    if (viewName === 'settings') return { category: 'settings', viewType: 'settings' as SettingsViewType };
    if (viewName === 'knowledge-base') return { category: 'settings', viewType: 'knowledge-base' as SettingsViewType };
    if (viewName === 'studio') return { category: 'settings', viewType: 'studio' as SettingsViewType };
    if (viewName === 'feed-manager') return { category: 'settings', viewType: 'feed-manager' as SettingsViewType };
    if (viewName === 'copilot') return { category: 'settings', viewType: 'copilot' as SettingsViewType };

    return null;
}

/**
 * Renderer principale che dispatcha al router corretto
 * Usato direttamente dal ViewManager
 */
export interface ViewRouterProps {
    viewName: string;
    props?: Record<string, unknown>; // Props generici da ViewManager
}

export const ViewRouter: React.FC<ViewRouterProps> = ({ viewName, props }) => {
    const routing = getViewRouter(viewName);
    
    if (!routing) {
        return <div>{messages.generic.error} ({viewName})</div>;
    }

    const { category, viewType } = routing;

    switch (category) {
        case 'scheduling':
            return <SchedulingViewsRenderer viewType={viewType as SchedulingViewType} props={props as unknown as SchedulingViewsProps} />;
        case 'evaluation':
            return <EvaluationViewsRenderer viewType={viewType as EvaluationViewType} props={props as unknown as EvaluationViewsProps} />;
        case 'planning':
            return <PlanningViewsRenderer viewType={viewType as PlanningViewType} props={props as unknown as PlanningViewsProps} />;
        case 'analytics':
            return <AnalyticsViewsRenderer viewType={viewType as AnalyticsViewType} props={props as unknown as AnalyticsViewsProps} />;
        case 'settings':
            return <SettingsViewsRenderer viewType={viewType as SettingsViewType} props={props as unknown as SettingsViewsProps} />;
        default:
            return null;
    }
};

