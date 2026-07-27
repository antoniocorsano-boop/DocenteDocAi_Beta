// MD3 Compliant
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AiMemoryChip from './AiMemoryChip';

const meta = {
  title: 'Components/Feedback/AiMemoryChip',
  component: AiMemoryChip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Small chip component indicating AI context usage with animated icon. Shows what context was used by the AI system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text indicating the context used',
    },
  },
} satisfies Meta<typeof AiMemoryChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Course Context',
  },
};

export const StudentProfile: Story = {
  args: {
    label: 'Student Profile',
  },
};

export const LessonHistory: Story = {
  args: {
    label: 'Lesson History',
  },
};

export const ClassData: Story = {
  args: {
    label: 'Class Data',
  },
};

export const DocumentContent: Story = {
  args: {
    label: 'Document Content',
  },
};

export const Multiple: Story = {
  args: {
    label: 'Course Context',
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-4)' }}>
      <AiMemoryChip label="Course Context" />
      <AiMemoryChip label="Student Profile" />
      <AiMemoryChip label="Lesson History" />
      <AiMemoryChip label="Class Data" />
      <AiMemoryChip label="Document Content" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple AI memory chips showing different context types.',
      },
    },
  },
};

export const WithLongLabel: Story = {
  args: {
    label: 'Previous Lesson Content',
  },
};

export const InContext: Story = {
  args: {
    label: 'Student Level',
  },
  render: () => (
    <div style={{ padding: 'var(--md-sys-spacing-4)', background: 'var(--md-sys-color-surfaceContainer)', borderRadius: 'var(--md-sys-spacing-2)' }}>
      <h3 style={{ marginBottom: 'var(--md-sys-spacing-4)' }}>AI Response Generated With Context:</h3>
      <div style={{ marginBottom: 'var(--md-sys-spacing-4)' }}>
        <p>
          Here&apos;s a personalized lesson summary based on your previous progress and
          current learning objectives...
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--md-sys-spacing-2)' }}>
        <AiMemoryChip label="Student Level" />
        <AiMemoryChip label="Learning Goals" />
        <AiMemoryChip label="Progress Data" />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'AI Memory Chip shown as used in response generation.',
      },
    },
  },
};

export const Accessibility: Story = {
  args: {
    label: 'Accessibility Context',
  },
  parameters: {
    docs: {
      description: {
        story: 'Chip with full accessibility support including aria-label and role attributes.',
      },
    },
  },
};

export const Pulsing: Story = {
  args: {
    label: 'Real-time Update',
  },
  parameters: {
    docs: {
      description: {
        story: 'Chip with pulsing animation indicating active AI processing.',
      },
    },
  },
};

export const Interactive: Story = {
  args: {
    label: 'Student Learning Profile',
  },
  render: () => (
    <div
      style={{
        padding: 'var(--md-sys-spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-sys-spacing-4)',
        cursor: 'help',
      }}
    >
      <p style={{ fontSize: 'var(--md-sys-typescale-body-large-font-size)', color: 'var(--md-sys-color-onSurface-variant)' }}>
        Hover over the chips to see what context the AI system is using:
      </p>
      <AiMemoryChip label="Student Learning Profile" />
      <AiMemoryChip label="Course Curriculum Data" />
      <AiMemoryChip label="Assessment Results" />
      <AiMemoryChip label="Peer Comparison Stats" />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Interactive demo showing multiple context types with hover effects.',
      },
    },
  },
};

