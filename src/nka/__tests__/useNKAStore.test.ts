import { act } from 'react-dom/test-utils';
import { useNKAStore } from '../useNKAStore';

describe('useNKAStore', () => {
  it('toggles enabled state', () => {
    act(() => {
      useNKAStore.getState().setEnabled(true);
    });
    expect(useNKAStore.getState().enabled).toBe(true);
    act(() => {
      useNKAStore.getState().setEnabled(false);
    });
    expect(useNKAStore.getState().enabled).toBe(false);
  });

  it('sets nodes and settings', () => {
    const nodes = [{ id: '1', label: 'Test', color: '80', elevation: 1, depth: 0.5, shape: 'circle', actions: [] }];
    const settings = { sound: false, reducedMotion: true };
    act(() => {
      useNKAStore.getState().setNodes(nodes);
      useNKAStore.getState().setSettings(settings);
    });
    expect(useNKAStore.getState().nodes).toEqual(nodes);
    expect(useNKAStore.getState().settings).toEqual(settings);
  });
});

