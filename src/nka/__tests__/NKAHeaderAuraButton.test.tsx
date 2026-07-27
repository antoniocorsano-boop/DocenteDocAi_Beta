import { renderWithM3Theme } from '../../test-utils';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import NKAHeaderAuraButton from '../NKAHeaderAuraButton';

describe('NKAHeaderAuraButton', () => {
  it('renders with badge if hasNewNode', () => {
    renderWithM3Theme(<NKAHeaderAuraButton hasNewNode={true} onClick={() => {}} onLongPress={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByLabelText(/apri mappa neurale/i)).toBeInTheDocument();
    expect(screen.getByText('auto_awesome')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /nuovo nodo disponibile/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    renderWithM3Theme(<NKAHeaderAuraButton hasNewNode={false} onClick={onClick} onLongPress={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});

