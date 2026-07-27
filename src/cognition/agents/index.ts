/**
 * agents/index.ts — Barrel export for the Agent System.
 */

export type { AgentContext, AgentSuggestion, AgentOutput } from './types';
export { runAllAgents } from './agentOrchestrator';
export { runRegulatoryAgent,  AGENT_ID as REGULATORY_AGENT_ID }   from './regulatoryAgent';
export { runFinancialAgent,   AGENT_ID as FINANCIAL_AGENT_ID }    from './financialAgent';
export { runIntegrationAgent, AGENT_ID as INTEGRATION_AGENT_ID }  from './integrationAgent';
export { runOnboardingAgent,  AGENT_ID as ONBOARDING_AGENT_ID }   from './onboardingAgent';
export { runAnalyticsAgent,   AGENT_ID as ANALYTICS_AGENT_ID }    from './analyticsAgent';
export { runArtisticCulturalAgent, AGENT_ID as ARTISTIC_AGENT_ID } from './artisticCulturalAgent';
