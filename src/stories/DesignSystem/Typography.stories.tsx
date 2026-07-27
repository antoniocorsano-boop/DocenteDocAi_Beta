// MD3 Compliant
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const TypographyDocumentation = () => (
  <div style={{ padding: 'var(--md-sys-spacing-6)', fontFamily: 'var(--font-family)' }}>
    <h1 style={{ fontSize: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginBottom: 'var(--md-sys-spacing-4)' }}>Typography System</h1>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-6)', marginBottom: 'var(--md-sys-spacing-8)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Material Design 3 typography scales with clear hierarchy for readability and visual consistency.
    </p>

    <div style={{ marginBottom: 'var(--md-sys-spacing-8)', padding: 'var(--md-sys-spacing-4)', backgroundColor: 'var(--md-sys-color-surfaceContainer)', borderRadius: 'var(--md-sys-spacing-2)' }}>
      <h3 style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginBottom: 'var(--md-sys-spacing-3)' }}>Font Family</h3>
      <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-2)' }}>
        <strong>Primary Font:</strong> Roboto Flex
      </p>
      <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-2)' }}>
        <strong>Monospace Font:</strong> Roboto Mono
      </p>
      <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-4)' }}>
        <strong>Variable Font Range:</strong> Weight 100-1000, Optical Size 8-144
      </p>
    </div>

    <h2 style={{ fontSize: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)' }}>Display Styles</h2>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)', marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Large, impactful headings for hero sections and major content divisions.
    </p>

    <TypeSample
      text="Display Large"
      fontSize="var(--md-sys-spacing-4)"
      fontWeight={400}
      lineHeight="1.25rem"
      letterSpacing="var(--md-sys-typescale-display-large-tracking)"
    />
    <TypeSample
      text="Display Medium"
      fontSize="var(--md-sys-typescale-display-medium-font-size)"
      fontWeight={400}
      lineHeight="var(--md-sys-typescale-display-medium-line-height)"
      letterSpacing="var(--md-sys-typescale-display-medium-tracking)"
    />
    <TypeSample
      text="Display Small"
      fontSize="var(--md-sys-typescale-body-large-font-size)"
      fontWeight={400}
      lineHeight="var(--md-sys-typescale-body-large-line-height)"
      letterSpacing="var(--md-sys-typescale-display-large-tracking)"
    />

    <h2 style={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-typescale-body-large-font-size)', marginBottom: 'var(--md-sys-typescale-body-large-font-size)' }}>Headline Styles</h2>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-typescale-body-large-line-height)', marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Prominent headings for content sections.
    </p>

    <TypeSample
      text="Headline Large"
      fontSize="var(--md-sys-spacing-8)"
      fontWeight={400}
      lineHeight="1.25rem"
      letterSpacing="var(--md-sys-typescale-display-large-tracking)"
      compact
    />
    <TypeSample
      text="Headline Medium"
      fontSize="1rem"
      fontWeight={400}
      lineHeight="1.25rem"
      letterSpacing="var(--md-sys-typescale-display-large-tracking)"
      compact
    />
    <TypeSample
      text="Headline Small"
      fontSize="var(--md-sys-spacing-6)"
      fontWeight={400}
      lineHeight="var(--md-sys-spacing-8)"
      letterSpacing={'var(--md-sys-spacing-4)'}
      compact
    />

    <h2 style={{ fontSize: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)' }}>Title Styles</h2>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Section titles and card headings.
    </p>

    <TypeSample
      text="Title Large"
      fontSize={'var(--md-sys-spacing-4)'}
      fontWeight={500}
      lineHeight={'var(--md-sys-spacing-4)'}
      letterSpacing={'var(--md-sys-spacing-4)'}
      compact
      bgColor="var(--md-sys-color-surfaceContainerLow)"
    />
    <TypeSample
      text="Title Medium"
      fontSize="var(--md-sys-spacing-4)"
      fontWeight={500}
      lineHeight="var(--md-sys-spacing-6)"
      letterSpacing="var(--md-sys-typescale-tracking-title)"
      compact
      bgColor="var(--md-sys-color-surfaceContainerLow)"
    />
    <TypeSample
      text="Title Small"
      fontSize={'var(--md-sys-spacing-4)'}
      fontWeight={500}
      lineHeight={'var(--md-sys-spacing-4)'}
      letterSpacing="var(--md-sys-typescale-tracking-title-sm)"
      compact
      bgColor="var(--md-sys-color-surfaceContainerLow)"
    />

    <h2 style={{ fontSize: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)' }}>Body Styles</h2>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Body copy for main content and descriptions.
    </p>

    <div style={{ marginBottom: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-3)', backgroundColor: 'var(--md-sys-color-surfaceContainerLowest)', borderRadius: 'var(--md-sys-spacing-2)' }}>
      <p style={{ margin: 'var(--md-sys-spacing-0) var(--md-sys-spacing-0) var(--md-sys-spacing-3) var(--md-sys-spacing-0)', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)' }}>Body Large</p>
      <div style={{ fontSize: 'var(--md-sys-spacing-3)', color: 'var(--md-sys-color-on-surface-variant)', fontFamily: 'monospace', marginBottom: 'var(--md-sys-spacing-3)' }}>
        var(--md-sys-spacing-4) • Weight 400 • Line height var(--md-sys-spacing-6) • Letter spacing 0.5px
      </div>
      <p style={{ margin: '0', fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-6)', letterSpacing: 'var(--md-sys-typescale-label-large-tracking)', color: 'var(--md-sys-color-on-surface-variant)' }}>
        This is a sample body large text. It&apos;s used for primary content and longer passages of text that need to be easily readable and comfortable to scan.
      </p>
    </div>

    <TypeSample
      text="Body Medium"
      fontSize={'var(--md-sys-spacing-4)'}
      fontWeight={400}
      lineHeight={'var(--md-sys-spacing-4)'}
      letterSpacing="var(--md-sys-typescale-tracking-body)"
      compact
      bgColor="var(--md-sys-color-surfaceContainerLowest)"
    />
    <TypeSample
      text="Body Small"
      fontSize="var(--md-sys-spacing-3)"
      fontWeight={400}
      lineHeight="var(--md-sys-spacing-4)"
      letterSpacing="0.var(--md-sys-spacing-1)"
      compact
      bgColor="var(--md-sys-color-surfaceContainerLowest)"
    />

    <h2 style={{ fontSize: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)' }}>Label Styles</h2>
    <p style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)', color: 'var(--md-sys-color-on-surface-variant)' }}>
      Labels for buttons, chips, and form fields.
    </p>

    <TypeSample
      text="Label Large"
      fontSize={'var(--md-sys-spacing-4)'}
      fontWeight={500}
      lineHeight={'var(--md-sys-spacing-4)'}
      letterSpacing="var(--md-sys-typescale-tracking-title-sm)"
      compact
      bgColor="var(--md-sys-color-surfaceContainerLow)"
    />
    <TypeSample
      text="Label Medium"
      fontSize="var(--md-sys-spacing-3)"
      fontWeight={500}
      lineHeight="var(--md-sys-spacing-4)"
      letterSpacing="var(--md-sys-typescale-label-medium-tracking)"
      compact
      bgColor="var(--md-sys-color-surfaceContainerLow)"
    />
    <TypeSample
      text="Label Small"
      fontSize={'var(--md-sys-spacing-4)'}
      fontWeight={500}
      lineHeight="var(--md-sys-spacing-4)"
      letterSpacing="var(--md-sys-typescale-label-small-tracking)"
      compact
      bgColor="var(--md-sys-color-surfaceContainerLow)"
    />

    <h2 style={{ fontSize: 'var(--md-sys-spacing-4)', fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)', marginTop: 'var(--md-sys-spacing-4)', marginBottom: 'var(--md-sys-spacing-4)' }}>Usage Guidelines</h2>
    <ul style={{ fontSize: 'var(--md-sys-typescale-body-medium-font-size)', lineHeight: 'var(--md-sys-spacing-6)', color: 'var(--md-sys-color-on-surface-variant)', paddingLeft: 'var(--md-sys-spacing-4)' }}>
      <li><strong>Display:</strong> Use for hero sections and major page titles</li>
      <li><strong>Headline:</strong> Use for section titles and subsection headings</li>
      <li><strong>Title:</strong> Use for card titles, dialog titles, and emphasis</li>
      <li><strong>Body:</strong> Use for main content and paragraphs</li>
      <li><strong>Label:</strong> Use for button text, chips, field labels, and UI elements</li>
      <li>Maintain line height for readability (minimum 1.4x font size)</li>
      <li>Use semantic HTML tags matching visual hierarchy</li>
      <li>Adjust font weights for emphasis, not just size</li>
    </ul>
  </div>
);

interface TypeSampleProps {
  text: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
  compact?: boolean;
  bgColor?: string;
}

const TypeSample: React.FC<TypeSampleProps> = ({
  text,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  compact = false,
  bgColor = 'var(--md-sys-color-surfaceContainer)',
}) => (
  <div style={{ marginBottom: compact ? 'var(--md-sys-spacing-6)' : 'var(--md-sys-spacing-8)', padding: compact ? 'var(--md-sys-spacing-3)' : 'var(--md-sys-spacing-4)', backgroundColor: bgColor, borderRadius: 'var(--md-sys-spacing-2)' }}>
    <p style={{ margin: 'var(--md-sys-spacing-0) var(--md-sys-spacing-0) var(--md-sys-spacing-2) var(--md-sys-spacing-0)', fontSize, fontWeight, lineHeight, letterSpacing }}>
      {text}
    </p>
    <div style={{ fontSize: 'var(--md-sys-spacing-3)', color: 'var(--md-sys-color-on-surface-variant)', fontFamily: 'monospace' }}>
      {fontSize} • Weight {fontWeight} • Line height {lineHeight}
      {letterSpacing !== 'var(--md-sys-spacing-4)' && ` • Letter spacing ${letterSpacing}`}
    </div>
  </div>
);

const meta = {
  title: 'Design System/Typography',
  component: TypographyDocumentation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Material Design 3 typography system with hierarchical type scales.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TypographyDocumentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTypography: Story = {};

