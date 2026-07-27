import { describe, it, expect } from 'vitest';
import { getViewRouter } from '../../src/components/views/ViewRouters';

describe('getViewRouter', () => {
  it('returns null for unknown views', () => {
    expect(getViewRouter('non-existent-view')).toBeNull();
  });

  it('uses canonical token `calendario` and rejects English alias', () => {
    expect(getViewRouter('calendar')).toBeNull();
    expect(getViewRouter('calendario')).toEqual({ category: 'scheduling', viewType: 'calendario' });
  });

  it('uses canonical token `reportistica` and rejects English alias', () => {
    expect(getViewRouter('reports')).toBeNull();
    expect(getViewRouter('reportistica')).toEqual({ category: 'analytics', viewType: 'reportistica' });
  });

  it('uses canonical planning tokens and rejects English aliases for udas/rubric', () => {
    expect(getViewRouter('udas')).toBeNull();
    expect(getViewRouter('uda')).toEqual({ category: 'planning', viewType: 'uda' });
    expect(getViewRouter('rubric')).toBeNull();
    expect(getViewRouter('rubriche')).toEqual({ category: 'planning', viewType: 'rubriche' });
  });

  it('uses canonical token `consiglio-di-classe` and rejects old alias', () => {
    expect(getViewRouter('consiglio-classe')).toBeNull();
    expect(getViewRouter('consiglio-di-classe')).toEqual({ category: 'analytics', viewType: 'consiglio-di-classe' });
  });
});
