import { renderWithM3Theme } from './test-utils';
// MD3 Compliant
import React from 'react';
import { render } from '@testing-library/react';
import InfoCard from './InfoCard';

describe('InfoCard Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(<InfoCard />);
    expect(container).toMatchSnapshot();
  });
});

