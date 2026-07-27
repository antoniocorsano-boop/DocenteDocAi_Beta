import { renderWithM3Theme } from '../test-utils';
// MD3 Compliant
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ChipInputList from './ChipInputList';

describe('ChipInputList', () => {
  it('renders label and icon', () => {
    renderWithM3Theme(
      <ChipInputList
        items={['A', 'B']}
        onAdd={() => {}}
        onRemove={() => {}}
        placeholder="Aggiungi"
        icon="class"
        label="Classi"
        variant="class"
      />
    );
    expect(screen.getByText('Classi')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Aggiungi')).toBeInTheDocument();
  });

  it('calls onAdd when adding item', () => {
    const onAdd = vi.fn();
    renderWithM3Theme(
      <ChipInputList
        items={[]}
        onAdd={onAdd}
        onRemove={() => {}}
        placeholder="Aggiungi"
        icon="add"
        label="Test"
      />
    );
    const input = screen.getByPlaceholderText('Aggiungi');
    fireEvent.change(input, { target: { value: 'Nuovo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith('Nuovo');
  });

  it('calls onRemove when clicking delete', () => {
    const onRemove = vi.fn();
    renderWithM3Theme(
      <ChipInputList
        items={['X']}
        onAdd={() => {}}
        onRemove={onRemove}
        placeholder="Aggiungi"
        icon="close"
        label="Test"
      />
    );
    fireEvent.click(screen.getByLabelText('Rimuovi X'));
    expect(onRemove).toHaveBeenCalledWith(0);
  });
});

