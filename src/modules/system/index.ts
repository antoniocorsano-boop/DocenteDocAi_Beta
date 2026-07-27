/**
 * modules/system/index.ts  —  P22 Stabilization Layer barrel
 *
 * Single import surface for all P22 system modules.
 *
 *   import { sanitizeInput, isSimulation, evaluateAPICall } from '@/modules/system'
 */

export {
  canUseTokens,
  consumeTokens,
  resetTokens,
  setTokenLimit,
  getTokenState,
} from './TokenController';

export {
  setPrivacyMode,
  getPrivacyMode,
  sanitizeInput,
  canSendToCloud,
  canLogExternally,
} from './PrivacyGuard';

export type { PrivacyMode } from './PrivacyGuard';

export {
  evaluateAPICall,
  recordAPIUsage,
  estimateTokens,
} from './APIGatekeeper';

export type { TaskComplexity, APICallParams, APICallDecision } from './APIGatekeeper';

export {
  setSimulationMode,
  isSimulation,
  localFallback,
} from './SimulationGuard';

// P24: Key management — deterministic PBKDF2 key per user identity
export {
  initKeyVault,
  clearKeyVault,
  getActiveKey,
  hasPersistentKey,
} from './KeyVault';

export type { UserIdentity } from './KeyVault';

// P23: AES-GCM localStorage encryption utility
export { encrypt, decrypt } from './StorageCrypto';
