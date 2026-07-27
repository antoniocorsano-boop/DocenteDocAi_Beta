import { renderWithM3Theme } from '../ui/test-utils';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DemoGantt from '../DemoGantt';

describe('DemoGantt keyboard accessibility', () => {
  it('allows Space+Arrow+Enter to move a bar to the right', async () => {
    const { container, getByText, findAllByRole } = renderWithM3Theme(<DemoGantt />);

    const columns = container.querySelectorAll('.gantt-col');
    expect(columns.length).toBeGreaterThan(1);

    let bar = getByText('UDA 1');
    // ensure it's initially in first column
    expect(columns[0].contains(bar)).toBe(true);

    // Start keyboard drag
    bar.focus();
    fireEvent.keyDown(bar, { key: ' ' }); // Space to start
    fireEvent.keyDown(bar, { key: 'ArrowRight' }); // Move to next col
    fireEvent.keyDown(bar, { key: 'Enter' }); // Commit

    // After commit, bar is a new DOM node, re-query it
    const updatedColumns = container.querySelectorAll('.gantt-col');
    bar = getByText('UDA 1');
    expect(updatedColumns[1].contains(bar)).toBe(true);

    // Live region should announce final status
    const lives = await findAllByRole('status');
    // Cerca la live region con il testo atteso
    expect(lives.some(live => /colonna 2/.test(live.textContent || ''))).toBe(true);
  });
});

