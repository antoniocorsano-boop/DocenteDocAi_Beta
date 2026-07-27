import { describe, it, expect } from 'vitest';
import { generateHueFromString, getAvatarColors } from '../../src/utils/colorUtils';

describe('colorUtils', () => {
  describe('generateHueFromString', () => {
    it('should return 0 for empty string', () => {
      expect(generateHueFromString('')).toBe(0);
    });

    it('should return a consistent hue for a string', () => {
      const hue1 = generateHueFromString('Matematica');
      const hue2 = generateHueFromString('Matematica');
      expect(hue1).toBe(hue2);
      expect(hue1).toBeGreaterThanOrEqual(0);
      expect(hue1).toBeLessThan(360);
    });

    it('should handle short strings with additional mixing', () => {
      const hue1 = generateHueFromString('1A');
      const hue2 = generateHueFromString('1A');
      expect(hue1).toBe(hue2);
    });
  });

  describe('getAvatarColors', () => {
    it('should return default palette for empty string', () => {
      const colors = getAvatarColors('');
      expect(colors).toEqual({ bg: '#EADDFF', textColor: '#21005D' });
    });

    it('should return a consistent palette for a string', () => {
      const colors1 = getAvatarColors('Mario Rossi');
      const colors2 = getAvatarColors('Mario Rossi');
      expect(colors1).toEqual(colors2);
      expect(colors1).toHaveProperty('bg');
      expect(colors1).toHaveProperty('textColor');
    });
  });
});
