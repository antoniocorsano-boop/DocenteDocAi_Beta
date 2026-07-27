import { renderWithM3Theme } from './test-utils';
// MD3 Compliant
import React from 'react';
import { render } from '@testing-library/react';
import CategoryCard from './CategoryCard';

describe('CategoryCard Story Snapshots', () => {
  it('renders default story correctly', () => {
    const { container } = renderWithM3Theme(
      <CategoryCard id="test" label="Test" icon="test" color="blue" isSelected={false} onClick={() => {}} />
    );
    expect(container).toMatchSnapshot();
  });
});

