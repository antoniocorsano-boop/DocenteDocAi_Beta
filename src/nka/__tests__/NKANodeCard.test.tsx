import { renderWithM3Theme } from '../../test-utils';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NKANodeCard from '../NKANodeCard';
import type { NKANode } from '../types';

describe('NKANodeCard', () => {

  const node: NKANode = {
    id: 'ai_per_educatori',
    label: 'AI per educatori',
    color: '80',
    elevation: 1,
    depth: 0.85,
    shape: 'circle',
    actions: ['crea_lezione', 'simula_classe'],
  };

  it('renders node info and actions', () => {
    renderWithM3Theme(<NKANodeCard node={node} onSelect={() => {}} />);
    expect(screen.getByText('AI per educatori')).toBeInTheDocument();
    expect(screen.getByText('Profondità 85%')).toBeInTheDocument();
    expect(screen.getByText('crea_lezione')).toBeInTheDocument();
    expect(screen.getByText('simula_classe')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    renderWithM3Theme(<NKANodeCard node={node} onSelect={onSelect} />);
    // The first button-like element is the card itself
    const [cardButton] = screen.getAllByRole('button');
    fireEvent.click(cardButton);
    expect(onSelect).toHaveBeenCalled();
  });
});

