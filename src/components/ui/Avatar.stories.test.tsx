import { renderWithM3Theme } from './test-utils';
// MD3 Compliant
import React from 'react';
import { render } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(<Avatar name="Test User" />);
    expect(container).toMatchSnapshot();
  });
});

