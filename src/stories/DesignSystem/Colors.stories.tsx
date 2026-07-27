// MD3 Compliant
// EXCLUDED FROM PRODUCTION: This Storybook file is for demo/documentation only and must NOT be included in production builds.
// Per MD3 governance, this file is not maintained for MD3 Gold compliance. See COPILOT_RULES.md and DESIGN_SYSTEM_POLICY.md.
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const ColorDocumentation = () => (
  <div style={{ padding: 'var(--md-sys-spacing-6)', fontFamily: 'var(--md-sys-typescale-body-large-font-family)' }}>
    <h1 style={{ fontSize: 'var(--md-sys-typescale-headline-small-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginBottom: 'var(--md-sys-spacing-4)' }}>Material Design 3 Color System</h1>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)', marginBottom: 'var(--md-sys-spacing-8)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      The design system uses an expressive color palette based on Material Design 3 (Aura theme) with carefully selected colors for accessibility and visual hierarchy.
    </p>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Primary Colors</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-workflow-card-min-width), var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-6)' }}>
      <ColorSwatch name="Primary" token="--md-sys-color-primary" hex="var(--md-sys-color-primary)" />
      <ColorSwatch name="Primary Container" token="--md-sys-color-primaryContainer" hex="var(--md-sys-color-primaryContainer)" />
      <ColorSwatch name="On Primary" token="--md-sys-color-on-primary" hex="#FFFFFF" border />
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Secondary Colors</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-workflow-card-min-width), var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-6)' }}>
      <ColorSwatch name="Secondary" token="--md-sys-color-secondary" hex="var(--md-sys-color-secondary)" />
      <ColorSwatch name="Secondary Container" token="--md-sys-color-secondary-container" hex="var(--md-sys-color-secondary-container)" />
      <ColorSwatch name="On Secondary" token="--md-sys-color-on-secondary" hex="#FFFFFF" border />
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Tertiary Colors</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-workflow-card-min-width), var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-6)' }}>
      <ColorSwatch name="Tertiary" token="--md-sys-color-tertiary" hex="var(--md-sys-color-tertiary)" />
      <ColorSwatch name="Tertiary Container" token="--md-sys-color-tertiary-container" hex="var(--md-sys-color-tertiary-container)" />
      <ColorSwatch name="On Tertiary" token="--md-sys-color-on-tertiary" hex="#FFFFFF" border />
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Semantic Colors</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-workflow-card-min-width), var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-6)' }}>
      <ColorSwatch name="Error" token="--md-sys-color-error" hex="#B3261E" />
      <ColorSwatch name="Warning" token="--md-sys-color-warning" hex="#E65100" />
      <ColorSwatch name="On Error" token="--md-sys-color-on-error" hex="#FFFFFF" border />
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Surface & Background Colors</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-6)' }}>
      <ColorSwatch name="Background" token="--md-sys-color-background" hex="#FDFBFF" border />
      <ColorSwatch name="Surface" token="--md-sys-color-surface" hex="#FDFBFF" border />
      <ColorSwatch name="On Background" token="--md-sys-color-on-background" hex="#1C1B1F" />
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Surface Containers (Elevation)</h2>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)', marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Elevation levels for layered surfaces:
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-3)', marginBottom: 'var(--md-sys-spacing-6)' }}>
      <ColorSwatch name="Lowest" token="--md-sys-color-surfaceContainerLowest" hex="#FFFFFF" border small />
      <ColorSwatch name="Low" token="--md-sys-color-surfaceContainerLow" hex="#F7F2FA" border small />
      <ColorSwatch name="Default" token="--md-sys-color-surfaceContainer" hex="#F3EDF7" border small />
      <ColorSwatch name="High" token="--md-sys-color-surfaceContainerHigh" hex="#ECE6F0" border small />
      <ColorSwatch name="Highest" token="--md-sys-color-surfaceContainerHighest" hex="#E6E0E9" border small />
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Outline & Accessibility</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, var(--md-sys-grid-fr-1)))', gap: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-6)' }}>
      <ColorSwatch name="Outline" token="--md-sys-color-outline" hex="#79747E" />
      <ColorSwatch name="Outline Variant" token="--md-sys-color-outline-variant" hex="#C4C7C5" border />
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-typescale-title-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-8)', marginBottom: 'var(--md-sys-spacing-4)' }}>Usage Guidelines</h2>
    <ul style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-6)', color: 'var(--md-sys-color-on-surface)', paddingLeft: 'var(--md-sys-spacing-6)' }}>
      <li>Use <strong>Primary</strong> colors for main actions and focus states</li>
      <li>Use <strong>Secondary</strong> for supporting elements and toggles</li>
      <li>Use <strong>Tertiary</strong> for alternate accent colors</li>
      <li>Use <strong>Error</strong> and <strong>Warning</strong> for validation feedback</li>
      <li>Use <strong>Surface Containers</strong> for layered surfaces and elevation</li>
      <li>Always use CSS variables (<code>var(--md-sys-color-*)</code>) instead of hardcoded hex values</li>
      <li>All colors meet WCAG AA contrast ratio requirements</li>
    </ul>
  </div>
);

interface ColorSwatchProps {
  name: string;
  token: string;
  hex: string;
  border?: boolean;
  small?: boolean;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, token, hex, border = false, small = false }) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        width: 'var(--md-sys-percent-full)',
        height: small ? 'var(--md-sys-spacing-6)' : 'var(--md-sys-spacing-8)',
        backgroundColor: `var(${token})`,
        borderRadius: 'var(--md-sys-spacing-2)',
        marginBottom: 'var(--md-sys-spacing-2)',
        boxShadow: 'var(--md-sys-elevation1)',
        border: border ? 'var(--md-sys-border-width-thick) solid var(--md-sys-color-outline-variant)' : 'none',
      }}
    />
    <strong style={{ fontSize: small ? 'var(--md-sys-typescale-body-small-font-size)' : 'var(--md-sys-typescale-body-medium-font-size)' }}>{name}</strong>
    <div style={{ fontSize: small ? 'var(--md-sys-typescale-body-small-font-size)' : 'var(--md-sys-typescale-body-small-font-size)', color: 'var(--md-sys-color-on-surface-variant)', marginTop: 'var(--md-sys-spacing-1)' }}>
      <code style={{ fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>{token}</code>
      <br />
      {hex}
    </div>
  </div>
);

// ---
// WARNING: This file is excluded from production and is for Storybook/demo use only.
// ---
const meta = {
  title: 'Design System/Colors',
  component: ColorDocumentation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Material Design 3 color system with design tokens for consistent theming.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ColorDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllColors: Story = {};

