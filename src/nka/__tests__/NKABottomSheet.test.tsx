import { renderWithM3Theme } from '../../test-utils';
import { render, screen, fireEvent } from '@testing-library/react';
import NKABottomSheet from '../NKABottomSheet';
import { NKANode } from '../types';
import { vi } from "vitest";

describe('NKABottomSheet', () => {
  const nodes: NKANode[] = [
    { id: '1', label: 'Nodo 1', color: '80', elevation: 1, depth: 0.5, shape: "circle", actions: [] },
    { id: '2', label: 'Nodo 2', color: '90', elevation: 2, depth: 0.7, shape: "pill", actions: [] }
  ];

  it('renders when open and calls onNodeSelect', () => {
    const onNodeSelect = vi.fn();
    renderWithM3Theme(
      <NKABottomSheet open={true} nodes={nodes} onClose={() => {}} onNodeSelect={onNodeSelect} />
    );
    expect(screen.getAllByText('Nodo 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nodo 2').length).toBeGreaterThan(0);
    const node2Card = screen.getByLabelText(/Nodo 2/, { selector: '[aria-describedby*="nka-node-details-"]' });
    expect(node2Card).toBeDefined();
    fireEvent.click(node2Card); // Click second node card
    expect(onNodeSelect).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    renderWithM3Theme(
      <NKABottomSheet open={false} nodes={nodes} onClose={() => {}} onNodeSelect={() => {}} />
    );
    expect(screen.queryByText('Nodo 1')).toBeNull();
  });
});

