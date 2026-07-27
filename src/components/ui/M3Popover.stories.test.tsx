import { renderWithM3Theme } from './test-utils';
// MD3 Compliant
import React from 'react';
import { render } from '@testing-library/react';
import M3Popover from './M3Popover';

describe('M3Popover Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(<M3Popover open={false} anchorEl={null} onClose={() => {}}>Content</M3Popover>);
    expect(container).toMatchSnapshot();
  });
});

