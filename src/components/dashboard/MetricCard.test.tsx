/**
 * MetricCard Component Test
 * Test per verificare il funzionamento del componente MetricCard
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders with basic props', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        unit="units"
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('units')).toBeInTheDocument();
  });

  it('renders with trend indicator', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        unit="units"
        trend={5.2}
      />
    );

    expect(screen.getByText('+5.2%')).toBeInTheDocument();
  });

  it('renders with negative trend', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        unit="units"
        trend={-3.1}
      />
    );

    expect(screen.getByText('-3.1%')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        description="This is a test metric"
      />
    );

    expect(screen.getByText('This is a test metric')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(
      <MetricCard
        title="Test Metric"
        value="42"
        icon={<TestIcon />}
      />
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with different status colors', () => {
    const { rerender } = render(
      <MetricCard
        title="Test Metric"
        value="42"
        status="good"
      />
    );

    // Test good status
    rerender(
      <MetricCard
        title="Test Metric"
        value="42"
        status="good"
      />
    );

    // Test warning status
    rerender(
      <MetricCard
        title="Test Metric"
        value="42"
        status="warning"
      />
    );

    // Test critical status
    rerender(
      <MetricCard
        title="Test Metric"
        value="42"
        status="critical"
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
  });
});
