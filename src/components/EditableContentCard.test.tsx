import { renderWithM3Theme } from '../test-utils';
// MD3 Compliant
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EditableContentCard from './EditableContentCard';
import { EditableContentCardProps } from '../types';

describe('EditableContentCard', () => {
  const defaultProps: EditableContentCardProps = {
    title: 'Titolo',
    content: 'Contenuto iniziale',
    onSave: vi.fn(),
    icon: 'note',
  };

  it('renders title and content', () => {
    renderWithM3Theme(<EditableContentCard {...defaultProps} />);
    expect(screen.getByText('Titolo')).toBeInTheDocument();
    expect(screen.getByText('Contenuto iniziale')).toBeInTheDocument();
  });

  it('shows edit button and enters edit mode', () => {
    renderWithM3Theme(<EditableContentCard {...defaultProps} />);
    const editBtn = screen.getByLabelText('Modifica contenuto');
    fireEvent.click(editBtn);
    expect(screen.getByLabelText('Modifica contenuto')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('saves edited content', () => {
    const onSave = vi.fn();
    renderWithM3Theme(<EditableContentCard {...defaultProps} onSave={onSave} />);
    fireEvent.click(screen.getByLabelText('Modifica contenuto'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Nuovo contenuto' } });
    fireEvent.click(screen.getByLabelText('Salva contenuto'));
    expect(onSave).toHaveBeenCalledWith('Nuovo contenuto');
  });

  it('cancels edit and restores content', () => {
    renderWithM3Theme(<EditableContentCard {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Modifica contenuto'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Modifica annullata' } });
    fireEvent.click(screen.getByLabelText('Annulla modifica'));
    expect(screen.getByText('Contenuto iniziale')).toBeInTheDocument();
  });
});

