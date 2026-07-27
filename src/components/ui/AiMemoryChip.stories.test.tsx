import { renderWithM3Theme } from './test-utils';
// MD3 Compliant
import React from 'react';
import { render } from '@testing-library/react';
import AiMemoryChip from './AiMemoryChip';

describe('AiMemoryChip Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(<AiMemoryChip label="Test Context" />);
    expect(container).toMatchSnapshot();
  });
});

