import { createTheme, applyTheme } from '../design-system';
// Fase 4: FULL routing for theme generation (daily gesture) via AIBrain (no direct aiService)
import { AIBrain } from '../ai/brain/AIBrain';
import { AppThemeState, AiSettings, ColorTokens, EmotionalPreset, EmotionalPresetTokens } from '../types';

/**
 * ThemeService centralizes the logic for theme application and generation.
 * It acts as a bridge between the application state (Zustand) and the design system.
 */
export const ThemeService = {
  /**
   * Emotional preset token definitions - Phase 1 Foundation
   * Each preset defines specific token overrides for emotional UI adaptation
   */
  emotionalPresets: {
    calm: {
      primary: 'var(--md-sys-color-primary-light)',
      secondary: 'var(--md-sys-color-secondary-light)',
      tertiary: 'var(--md-sys-color-tertiary-light)',
      motionDuration: 'var(--md-sys-motion-duration-long3)',
      motionEasing: 'var(--md-sys-motion-easing-emphasized-decelerate)',
      cornerRadius: 'var(--md-sys-shape-corner-extra-large)',
      spacingScale: 1.2,
      elevationLevel: 1,
      backdropBlur: 'var(--md-sys-elevation-blur-level1)',
      opacity: 'var(--md-sys-state-opacity-hover-overlay)'
    } as unknown as EmotionalPresetTokens,
    energetic: {
      primary: 'var(--md-sys-color-primary)',
      secondary: 'var(--md-sys-color-secondary)',
      tertiary: 'var(--md-sys-color-tertiary)',
      motionDuration: 'var(--md-sys-motion-duration-short2)',
      motionEasing: 'var(--md-sys-motion-easing-emphasized-accelerate)',
      cornerRadius: 'var(--md-sys-shape-corner-medium)',
      spacingScale: 0.9,
      elevationLevel: 3,
      contrastLevel: 1.1
    } as unknown as EmotionalPresetTokens,
    creative: {
      primary: 'var(--md-sys-color-tertiary)',
      secondary: 'var(--md-sys-color-secondary-container)',
      tertiary: 'var(--md-sys-color-primary-container)',
      motionDuration: 'var(--md-sys-motion-duration-long2)',
      motionEasing: 'var(--md-sys-motion-easing-emphasized)',
      cornerRadius: 'var(--md-sys-shape-corner-extra-large)',
      spacingScale: 1.3,
      fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)',
      elevationLevel: 2
    } as unknown as EmotionalPresetTokens,
    focused: {
      primary: 'var(--md-sys-color-primary)',
      secondary: 'var(--md-sys-color-outline)',
      tertiary: 'var(--md-sys-color-outline-variant)',
      motionDuration: 'var(--md-sys-motion-duration-short1)',
      motionEasing: 'var(--md-sys-motion-easing-standard)',
      cornerRadius: 'var(--md-sys-shape-corner-small)',
      spacingScale: 0.8,
      contrastLevel: 1.2,
      elevationLevel: 0
    } as unknown as EmotionalPresetTokens,
    relaxed: {
      primary: 'var(--md-sys-color-primary-light)',
      secondary: 'var(--md-sys-color-secondary-light)',
      tertiary: 'var(--md-sys-color-tertiary-light)',
      motionDuration: 'var(--md-sys-motion-duration-long4)',
      motionEasing: 'var(--md-sys-motion-easing-emphasized-decelerate)',
      cornerRadius: 'var(--md-sys-shape-corner-full)',
      spacingScale: 1.4,
      backdropBlur: 'var(--md-sys-elevation-blur-level2)',
      opacity: 'var(--md-sys-state-opacity-hover-overlay)'
    } as unknown as EmotionalPresetTokens,
    professional: {
      primary: 'var(--md-sys-color-primary)',
      secondary: 'var(--md-sys-color-secondary)',
      tertiary: 'var(--md-sys-color-tertiary)',
      motionDuration: 'var(--md-sys-motion-duration-medium2)',
      motionEasing: 'var(--md-sys-motion-easing-standard)',
      cornerRadius: 'var(--md-sys-shape-corner-medium)',
      spacingScale: 1.0,
      elevationLevel: 2,
      contrastLevel: 1.0
    } as unknown as EmotionalPresetTokens,
    playful: {
      primary: 'var(--md-sys-color-tertiary)',
      secondary: 'var(--md-sys-color-primary-container)',
      tertiary: 'var(--md-sys-color-secondary-container)',
      motionDuration: 'var(--md-sys-motion-duration-medium4)',
      motionEasing: 'var(--md-sys-motion-easing-emphasized-accelerate)',
      cornerRadius: 'var(--md-sys-shape-corner-large)',
      spacingScale: 1.1,
      fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)',
      elevationLevel: 4
    } as unknown as EmotionalPresetTokens,
    minimal: {
      primary: 'var(--md-sys-color-on-surface)',
      secondary: 'var(--md-sys-color-outline-variant)',
      tertiary: 'var(--md-sys-color-surface-variant)',
      motionDuration: 'var(--md-sys-motion-duration-short1)',
      motionEasing: 'var(--md-sys-motion-easing-standard)',
      cornerRadius: 'var(--md-sys-shape-corner-small)',
      spacingScale: 0.7,
      elevationLevel: 0,
      backdropBlur: 'none'
    } as unknown as EmotionalPresetTokens
  } as Record<EmotionalPreset, EmotionalPresetTokens>,

  /**
   * Gets the token overrides for a specific emotional preset
   */
  getEmotionalPresetTokens(preset: EmotionalPreset): EmotionalPresetTokens {
    return this.emotionalPresets[preset];
  },

  /**
   * Maps AppThemeState to the design system and applies it to the DOM.
   * This is the primary method for synchronizing the UI with the theme state.
   */
  applyThemeState(state: AppThemeState): void {
    if (!state) return;

    // Resolve 'system' to the actual OS preference
    const systemPrefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedMode =
      state.mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : state.mode;

    // Get base theme configuration
    const baseThemeConfig = {
      name: state.customizationName || state.generatedName || 'Default',
      mode: resolvedMode,
      visualStyle: state.visualStyle,
      colors: state.customColors || state.generatedColors,
      glassBlur: state.glassBlur,
      radiusMultiplier: state.radiusMultiplier,
      fontScale: state.fontScale,
      contrastLevel: state.contrastLevel
    };

    // Apply emotional preset overrides if selected
    if (state.emotionalPreset) {
      const presetTokens = this.getEmotionalPresetTokens(state.emotionalPreset);

      // Merge preset overrides with base configuration
      Object.assign(baseThemeConfig, {
        colors: {
          ...baseThemeConfig.colors,
          ...(presetTokens.primary && { primary: presetTokens.primary }),
          ...(presetTokens.secondary && { secondary: presetTokens.secondary }),
          ...(presetTokens.tertiary && { tertiary: presetTokens.tertiary })
        },
        glassBlur: presetTokens.backdropBlur ? parseFloat(presetTokens.backdropBlur) : baseThemeConfig.glassBlur,
        radiusMultiplier: presetTokens.spacingScale || baseThemeConfig.radiusMultiplier,
        contrastLevel: presetTokens.contrastLevel || baseThemeConfig.contrastLevel
      });
    }

    const theme = createTheme(baseThemeConfig);
    applyTheme(theme);

    // Apply uiMode globally via data attribute (with safe fallback)
    const uiMode = state.uiMode || 'classic';
    document.documentElement.setAttribute('data-ui-mode', uiMode);

    // Apply emotional preset data attribute for CSS targeting
    if (state.emotionalPreset) {
      document.documentElement.setAttribute('data-emotional-preset', state.emotionalPreset);
    } else {
      document.documentElement.removeAttribute('data-emotional-preset');
    }
  },

  /**
   * Generates a new theme using AI based on a prompt.
   * Returns the generated name and color tokens.
   */
  async generateViaAi(prompt: string, aiSettings: AiSettings): Promise<{
    name: string;
    colors: Partial<ColorTokens>;
  }> {
    const generated = await AIBrain.generateWithCentralPrompt('theme-generation', { prompt }, aiSettings);
    
    // Map the AI response to our ColorTokens structure
    return {
      name: generated.name as string || 'AI Generated',
      colors: {
        primary: generated.primary as string,
        secondary: generated.secondary as string,
        tertiary: generated.tertiary as string
      } as Partial<ColorTokens>
    };
  }
};

