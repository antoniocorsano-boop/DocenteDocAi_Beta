/**
 * automation/index.ts — Public barrel for the Autonomous Actions Layer.
 *
 * CLIENT-SIDE ONLY — do not import in api/ Edge Functions.
 *
 * Quick start:
 *
 *   // 1. Register default rules once at app startup
 *   import { registerDefaultRules, automationEngine } from '@/services/automation';
 *   registerDefaultRules();
 *
 *   // 2. Subscribe to confirmation requests (wire to your chat UI)
 *   const unsub = automationEngine.onConfirmationRequired((req) => {
 *     chatStore.addMessage(req.chatMessage);
 *   });
 *
 *   // 3. Subscribe to informational messages
 *   automationEngine.onChatMessage((msg) => chatStore.addMessage(msg));
 *
 *   // 4. Fire a trigger after document processing
 *   import { processImageInputWithAutomation } from '@/services/documentAI';
 *   const result = await processImageInputWithAutomation(input, sourceKey);
 *   // automation engine was already triggered internally ↑
 *
 *   // 5. Answer a pending confirmation from chat
 *   await automationEngine.answer(confirmationId, 'yes'); // 'yes' | 'no' | 'always'
 */

// Types
export type {
  AutomationRule,
  AutomationTriggerType,
  AutomationTriggerPayload,
  DocumentProcessedPayload,
  AssessmentCreatedPayload,
  KgNodeLinkedPayload,
  AutomationConditionFn,
  AutomationActionDef,
  AutomationExecution,
  ExecutionStatus,
  ConfirmationRequest,
  ConfirmationAnswer,
  ConfirmationListener,
  ChatMessageListener,
} from './types';

// Engine singleton
export { automationEngine } from './automationEngine';

// Default rules
export { registerDefaultRules, RULE_IDS } from './defaultRules';
