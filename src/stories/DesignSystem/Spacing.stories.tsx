// MD3 Compliant
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const SpacingDocumentation = () => (
  <div style={{ padding: 'var(--md-sys-spacing-6)', fontFamily: 'var(--md-sys-typescale-body-large-font-family)' }}>
    <h1 style={{ fontSize: 'var(--md-sys-typescale-headline-small-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginBottom: 'var(--md-sys-spacing-4)' }}>Spacing System</h1>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)', marginBottom: 'var(--md-sys-spacing-8)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Consistent spacing scale for margins, padding, and gaps to create rhythm and visual balance.
    </p>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Spacing Scale</h2>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)', marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      The spacing system uses an var(--md-sys-spacing-2) base unit, enabling flexible and predictable layouts.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-workflow-card-min-width), var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-8)' }}>
      {[
        { value: 'var(--md-sys-spacing-0)', description: 'No spacing - elements touching' },
        { value: 'var(--md-sys-spacing-1)', description: 'Minimal spacing' },
        { value: 'var(--md-sys-spacing-1)', description: 'Extra small spacing' },
        { value: 'var(--md-sys-spacing-2)', description: 'Small spacing (1 unit)' },
        { value: 'var(--md-sys-spacing-3)', description: 'Small-medium spacing' },
        { value: 'var(--md-sys-spacing-4)', description: 'Medium spacing (2 units)' },
        { value: 'var(--md-sys-spacing-5)', description: 'Medium-large spacing' },
        { value: 'var(--md-sys-spacing-6)', description: 'Large spacing (3 units)' },
        { value: 'var(--md-sys-spacing-8)', description: 'Extra large spacing (4 units)' },
        { value: 'var(--md-sys-spacing-10)', description: 'Extra large spacing (5 units)' },
        { value: 'var(--md-sys-spacing-12)', description: 'Extra extra large spacing (6 units)' },
        { value: 'var(--md-sys-spacing-16)', description: 'Largest spacing (8 units)' },
      ].map((space) => (
        <SpacingSwatch key={space.value} value={space.value} description={space.description} />
      ))}
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Common Spacing Combinations</h2>
    <table style={{ width: 'var(--md-sys-percent-100)', borderCollapse: 'collapse', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', marginBottom: 'var(--md-sys-spacing-8)' }}>
      <thead>
        <tr style={{ backgroundColor: 'var(--md-sys-color-surfaceContainer)', textAlign: 'left' }}>
          <th style={{ padding: 'var(--md-sys-spacing-3)', borderBottom: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-outline-variant)' }}>Use Case</th>
          <th style={{ padding: 'var(--md-sys-spacing-3)', borderBottom: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-outline-variant)' }}>Spacing</th>
          <th style={{ padding: 'var(--md-sys-spacing-3)', borderBottom: 'var(--md-sys-border-width-thick) solid var(--md-sys-color-outline-variant)' }}>Example</th>
        </tr>
      </thead>
      <tbody>
        {[
          { useCase: 'Button Padding', spacing: 'var(--md-sys-spacing-3) var(--md-sys-spacing-6)', example: 'Small vertical, medium horizontal' },
          { useCase: 'Card Padding', spacing: 'var(--md-sys-spacing-4)', example: 'Uniform spacing' },
          { useCase: 'Section Margin', spacing: 'var(--md-sys-spacing-8)', example: 'Top/bottom separation' },
          { useCase: 'Component Gap', spacing: 'var(--md-sys-spacing-2) to var(--md-sys-spacing-4)', example: 'Internal element spacing' },
          { useCase: 'Grid Gap', spacing: 'var(--md-sys-spacing-4) to var(--md-sys-spacing-6)', example: 'Between grid items' },
          { useCase: 'List Item Padding', spacing: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)', example: 'Vertical var(--md-sys-spacing-3), horizontal var(--md-sys-spacing-4)' },
        ].map((row, idx) => (
          <tr key={idx} style={{ borderBottom: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)' }}>
            <td style={{ padding: 'var(--md-sys-spacing-3)' }}><strong>{row.useCase}</strong></td>
            <td style={{ padding: 'var(--md-sys-spacing-3)' }}><code>{row.spacing}</code></td>
            <td style={{ padding: 'var(--md-sys-spacing-3)', color: 'var(--md-sys-color-on-surface-variant)' }}>{row.example}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Padding Patterns</h2>

    <h3 style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-3)' }}>Cards & Containers</h3>
    <div style={{ padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surfaceContainer)', borderRadius: 'var(--md-sys-spacing-2)', border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)', marginBottom: 'var(--md-sys-spacing-4)' }}>
      <div style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: 'var(--md-sys-spacing-2)' }}>
        <strong>Card Padding: var(--md-sys-spacing-4)</strong>
      </div>
      <div style={{ padding: 'var(--md-sys-spacing-3)', backgroundColor: 'var(--md-sys-color-surfaceContainerLow)', borderRadius: 'var(--md-sys-spacing-1)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>
        Content inside card with consistent padding
      </div>
    </div>

    <h3 style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-3)' }}>Form Fields</h3>
    <div style={{ marginBottom: 'var(--md-sys-spacing-6)' }}>
      <label style={{ display: 'block', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginBottom: 'var(--md-sys-spacing-1)' }}>
        Input Label
      </label>
      <input
        type="text"
        placeholder="Placeholder text"
        style={{
          width: 'var(--md-sys-percent-100)',
          padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
          border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline)',
          borderRadius: 'var(--md-sys-spacing-1)',
          fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
          fontFamily: 'inherit',
        }}
      />
      <div style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 'var(--md-sys-spacing-1)' }}>
        Padding: var(--md-sys-spacing-3) vertical, var(--md-sys-spacing-4) horizontal
      </div>
    </div>

    <h3 style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-3)' }}>Buttons</h3>
    <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-3)', marginBottom: 'var(--md-sys-spacing-6)', flexWrap: 'wrap' }}>
      <button style={{ padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', border: 'none', borderRadius: 'var(--md-sys-spacing-6)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', cursor: 'pointer' }}>
        Small Button
      </button>
      <button style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-6)', backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', border: 'none', borderRadius: 'var(--md-sys-spacing-6)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', cursor: 'pointer' }}>
        Medium Button
      </button>
      <button style={{ padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-8)', backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)', border: 'none', borderRadius: 'var(--md-sys-spacing-6)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', cursor: 'pointer' }}>
        Large Button
      </button>
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Best Practices</h2>
    <ol style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)', color: 'var(--md-sys-color-on-surface)', paddingLeft: 'var(--md-sys-spacing-6)' }}>
      <li>Use multiples of var(--md-sys-spacing-1) or var(--md-sys-spacing-2) for consistency</li>
      <li>Maintain rhythm with the spacing scale</li>
      <li>Group related elements with smaller spacing (var(--md-sys-spacing-2) - var(--md-sys-spacing-3))</li>
      <li>Separate different groups with larger spacing (var(--md-sys-spacing-4) - var(--md-sys-spacing-6))</li>
      <li>Use padding to define content area within containers</li>
      <li>Use margin for spacing between separate elements</li>
      <li>Be consistent - don&apos;t mix random spacing values</li>
      <li>Respect density - more compact on mobile, more breathing room on desktop</li>
    </ol>
  </div>
);

interface SpacingSwatchProps {
  value: string;
  description: string;
}

const SpacingSwatch: React.FC<SpacingSwatchProps> = ({ value, description }) => (
  <div style={{ marginBottom: 'var(--md-sys-spacing-4)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--md-sys-spacing-2)', marginBottom: 'var(--md-sys-spacing-2)' }}>
      <div
        style={{
          backgroundColor: 'var(--md-sys-color-primary)',
          width: value === '0px' ? 'var(--md-sys-spacing-1)' : value,
          height: value === '0px' ? 'var(--md-sys-spacing-1)' : 'var(--md-sys-spacing-8)',
          borderRadius: 'var(--md-sys-spacing-1)',
          flexShrink: 0,
        }}
      />
      <div>
        <strong style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)' }}>{value}</strong>
        <p style={{ margin: 'var(--md-sys-spacing-1) 0 0 0', fontSize: 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)' }}>
          {description}
        </p>
      </div>
    </div>
  </div>
);

const meta = {
  title: 'Design System/Spacing',
  component: SpacingDocumentation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Material Design 3 spacing system based on var(--md-sys-spacing-2) grid for consistent layouts.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpacingDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSpacing: Story = {};

