// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettingsLogic } from '../../src/hooks/useSettingsLogic';

vi.mock('../../src/services/aiService', () => ({
  generateThemeFromPrompt: vi.fn()
}));

vi.mock('../../src/constants', async () => {
  const actual = await vi.importActual('../../src/constants');
  return {
    ...actual,
    AI_PROFILES: {
      creativo: { model: 'gemini-pro', label: 'Creativo', description: 'Desc' },
      rapido: { model: 'gemini-flash', label: 'Rapido', description: 'Desc' }
    }
  };
});

describe('useSettingsLogic', () => {
  const mockSettings = {
    teachingAssignments: [],
    classes: ['1A'],
    subjects: ['Math']
  } as any;

  const mockAiSettings = {
    profile: 'standard'
  } as any;

  const mockThemeState = {
    mode: 'light'
  } as any;

  const mockProps = {
    settings: mockSettings,
    onSaveSettings: vi.fn(),
    aiSettings: mockAiSettings,
    onSaveAiSettings: vi.fn(),
    themeState: mockThemeState,
    onSaveTheme: vi.fn(),
    showToast: vi.fn(),
    onCleanDemoData: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should initialize with local state', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    expect(result.current.localSettings).toMatchObject(mockSettings);
    expect(result.current.localAiSettings).toEqual(mockAiSettings);
  });

  it('should handle change and debounce save', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.handleChange('classes', ['1A', '2B']);
    });
    
    expect(result.current.localSettings.classes).toEqual(['1A', '2B']);
    expect(mockProps.onSaveSettings).not.toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(800);
    });
    
    expect(mockProps.onSaveSettings).toHaveBeenCalledWith(expect.objectContaining({
      classes: ['1A', '2B']
    }));
  });

  it('should handle AI profile change', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.handleAiProfileChange('creativo');
    });
    
    expect(mockProps.onSaveAiSettings).toHaveBeenCalled();
    expect(mockProps.showToast).toHaveBeenCalled();
  });

  it('should handle reset AI cache', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.handleResetAiCache();
    });
    
    expect(mockProps.onSaveAiSettings).toHaveBeenCalled();
  });

  it('should handle theme generation', async () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.setThemePrompt('Ocean Breeze');
    });
    
    const { generateThemeFromPrompt } = await import('../../src/services/aiService');
    (generateThemeFromPrompt as any).mockResolvedValue({
      primary: '#0000ff',
      secondary: '#00ff00',
      tertiary: '#ff0000',
      name: 'Ocean'
    });

    await act(async () => {
      await result.current.handleGenerateThemeFromPrompt();
    });
    
    expect(mockProps.onSaveTheme).toHaveBeenCalled();
    expect(mockProps.showToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should handle theme generation error', async () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.setThemePrompt('Ocean Breeze');
    });
    
    const { generateThemeFromPrompt } = await import('../../src/services/aiService');
    (generateThemeFromPrompt as any).mockRejectedValue(new Error('AI Error'));

    await act(async () => {
      await result.current.handleGenerateThemeFromPrompt();
    });
    
    expect(mockProps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('should not generate theme if prompt is empty', async () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.setThemePrompt('  ');
    });
    
    await act(async () => {
      await result.current.handleGenerateThemeFromPrompt();
    });
    
    expect(mockProps.showToast).toHaveBeenCalledWith(expect.any(String), 'error');
  });

  it('should handle theme change', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.handleThemeChange({ mode: 'dark' });
    });
    
    expect(mockProps.onSaveTheme).toHaveBeenCalledWith(expect.objectContaining({ mode: 'dark' }));
  });

  it('should handle bulk assign', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.handleBulkAssign(['1A'], ['Math']);
    });
    
    expect(mockProps.showToast).toHaveBeenCalledWith(expect.stringContaining('1 nuove associazioni create!'), 'success');
  });

  it('should not bulk assign if already exists', () => {
    const settingsWithAssignment = {
      ...mockSettings,
      teachingAssignments: [{ classId: '1A', subjectId: 'Math' }]
    };
    const { result } = renderHook(() => useSettingsLogic({ ...mockProps, settings: settingsWithAssignment }));
    
    act(() => {
      result.current.handleBulkAssign(['1A'], ['Math']);
    });
    
    expect(mockProps.showToast).toHaveBeenCalledWith(expect.stringContaining('Nessuna nuova associazione'), 'info');
  });

  it('should toggle association', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.toggleAssociation('1A', 'Math');
    });
    
    expect(result.current.localSettings.teachingAssignments.length).toBe(1);
    
    act(() => {
      result.current.toggleAssociation('1A', 'Math');
    });
    
    expect(result.current.localSettings.teachingAssignments.length).toBe(0);
  });

  it('should update assignment hours', () => {
    const settingsWithAssignment = {
      ...mockSettings,
      teachingAssignments: [{ id: '1', classId: '1A', subjectId: 'Math', hoursPerWeek: 2 }]
    };
    const { result } = renderHook(() => useSettingsLogic({ ...mockProps, settings: settingsWithAssignment }));
    
    act(() => {
      result.current.updateAssignmentHours('1', 5);
    });
    
    expect(result.current.localSettings.teachingAssignments[0].hoursPerWeek).toBe(5);
  });

  it('should handle reset', () => {
    const { result } = renderHook(() => useSettingsLogic(mockProps));
    
    act(() => {
      result.current.setIsResetModalOpen(true);
      result.current.performReset();
    });
    
    expect(mockProps.onCleanDemoData).toHaveBeenCalled();
    expect(result.current.isResetModalOpen).toBe(false);
  });
});
