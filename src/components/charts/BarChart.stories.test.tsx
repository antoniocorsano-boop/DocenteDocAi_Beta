import { renderWithM3Theme } from '../ui/test-utils';
// MD3 Compliant
import React from 'react';
import { render } from '@testing-library/react';
import BarChart from './BarChart';

describe('BarChart Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(<BarChart data={[{label: 'Test', value: 10}]} color="var(--md-sys-color-primary)" />);
    expect(container).toMatchSnapshot();
  });
});

