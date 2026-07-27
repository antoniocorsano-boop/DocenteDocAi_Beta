/**
 * capabilitySystem/index.ts  —  barrel export
 */

export type {
  Capability,
  CapabilityModule,
  CapabilityState,
  CapabilityTier,
  CapabilityCategory,
  CapabilityGate,
  CapabilityRecord,
} from './types';

export {
  ALL_CAPABILITIES,
  CAPABILITY_MODULES,
  getCapabilityById,
  getCapabilitiesByCategory,
} from './capabilityRegistry';

export { useCapabilityStore } from './capabilityStore';

export {
  checkCapability,
  isCapabilityEnabled,
  listCapabilities,
  unlockCapability,
  lockCapability,
} from './capabilityService';
