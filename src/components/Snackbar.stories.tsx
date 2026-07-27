// MD3 GOLD COMPLIANT – Audit 2026-01-25
// Nessun valore hardcoded: solo token MD3, nessun px/rem/%/hex/rgba, nessuna utility custom.
// Conforme a MD3_GOVERNANCE_COMPLIANCE_CONTRACT.md
// Tutti i layout, colori, spaziature e tipografia sono gestiti tramite token MD3.
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Snackbar from './Snackbar';

const meta = {
  title: 'Components/Feedback/Snackbar',
  component: Snackbar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Material Design 3 Snackbar component for displaying brief messages. Auto-dismisses after 3.5 seconds (5 seconds for errors). Uses global UI store for state management.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: 'var(--md-sys-spacing-4)', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Snackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Snackbar />,
};

export const Success: Story = {
  render: () => <Snackbar />,
  parameters: {
    docs: {
      description: {
        story: 'Success snackbar shows for 3.5 seconds after completion. Connected to global UI store.',
      },
    },
  },
};

export const Error: Story = {
  render: () => <Snackbar />,
  parameters: {
    docs: {
      description: {
        story: 'Error snackbar shows for 5 seconds to give users more time to read. Connected to global UI store.',
      },
    },
  },
};

export const Info: Story = {
  render: () => <Snackbar />,
  parameters: {
    docs: {
      description: {
        story: 'Info snackbar shows for 3.5 seconds. Connected to global UI store.',
      },
    },
  },
};

