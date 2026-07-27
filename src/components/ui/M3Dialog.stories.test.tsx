import { renderWithM3Theme } from './test-utils';
// MD3 Compliant
import React from 'react';
import { render } from '@testing-library/react';
import M3Dialog from './M3Dialog';

describe('M3Dialog Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(
      <M3Dialog title="Test Dialog" onClose={() => {}}>
        Test content
      </M3Dialog>
    );
    expect(container).toMatchSnapshot();
  });
});

