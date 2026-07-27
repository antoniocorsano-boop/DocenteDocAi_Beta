/**
 * FeatureGate — centralised feature visibility via CapabilityLevel.
 *
 * Single source of truth for "is this feature available at this level?".
 * Wraps getAvailableFeatures() for call-site convenience.
 */

import { getAvailableFeatures } from './CapabilityEngine';
import type { FeatureKey } from './CapabilityEngine';
import type { CapabilityLevel } from '../types/teacherModel.types';

export type { FeatureKey };

/**
 * Returns true when the given feature is available at the provided level.
 *
 * Usage:
 *   if (!isFeatureAvailable('ARTISTIC_TOOLS', model.capabilityLevel)) return null;
 */
export function isFeatureAvailable(feature: FeatureKey, level: CapabilityLevel): boolean {
  return getAvailableFeatures(level).includes(feature);
}
