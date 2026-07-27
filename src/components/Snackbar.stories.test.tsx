import { renderWithM3Theme } from '../test-utils';
// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React from 'react';
import { render } from '@testing-library/react';
import Snackbar from './Snackbar';

describe('Snackbar Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(<Snackbar />);
    expect(container).toMatchSnapshot();
  });
});

