// MD3 Compliant
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ActionTile from './ActionTile';

const meta = {
  title: 'Components/Interactive/ActionTile',
  component: ActionTile,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive action tile with icon, title, and optional subtitle. Features hover animations and shine effect.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title text',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle text',
    },
    icon: {
      control: 'text',
      description: 'Material Symbols icon name',
    },
    variant: {
      control: 'text',
      description: 'Style variant (surface, primary, secondary, etc.)',
    },
    tooltip: {
      control: 'text',
      description: 'Hover tooltip text',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler callback',
    },
  },
} satisfies Meta<typeof ActionTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Create Document',
    icon: 'add_document',
    onClick: () => console.log('Create Document clicked'),
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'New Quiz',
    subtitle: 'Generate Assessment',
    icon: 'quiz',
    onClick: () => console.log('New Quiz clicked'),
  },
};

export const WithTooltip: Story = {
  args: {
    title: 'Upload Files',
    icon: 'upload_file',
    tooltip: 'Upload documents and materials',
    onClick: () => console.log('Upload Files clicked'),
  },
};

export const PrimaryVariant: Story = {
  args: {
    title: 'Generate Content',
    subtitle: 'AI Assistant',
    icon: 'auto_awesome',
    variant: 'primary',
    onClick: () => console.log('Generate Content clicked'),
  },
};

export const SecondaryVariant: Story = {
  args: {
    title: 'Schedule Lesson',
    subtitle: 'Plan Teaching',
    icon: 'schedule',
    variant: 'secondary',
    onClick: () => console.log('Schedule Lesson clicked'),
  },
};

export const TertiaryVariant: Story = {
  args: {
    title: 'View Analytics',
    subtitle: 'Performance Metrics',
    icon: 'analytics',
    variant: 'tertiary',
    onClick: () => console.log('View Analytics clicked'),
  },
};

export const CreateLesson: Story = {
  args: {
    title: 'Create Lesson',
    subtitle: 'New Teaching Material',
    icon: 'school',
    onClick: () => console.log('Create Lesson clicked'),
  },
};

export const GenerateTest: Story = {
  args: {
    title: 'Generate Test',
    subtitle: 'AI-Powered Assessment',
    icon: 'assignment',
    onClick: () => console.log('Generate Test clicked'),
  },
};

export const ManageStudents: Story = {
  args: {
    title: 'Manage Students',
    subtitle: 'Class Roster',
    icon: 'group',
    onClick: () => console.log('Manage Students clicked'),
  },
};

export const ViewReports: Story = {
  args: {
    title: 'View Reports',
    subtitle: 'Performance Analysis',
    icon: 'description',
    onClick: () => console.log('View Reports clicked'),
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Edit',
    icon: 'edit',
    onClick: () => console.log('Edit clicked'),
  },
};

export const Multiple: Story = {
  args: {
    title: 'Create Lesson',
    icon: 'school',
    onClick: () => console.log('Create Lesson'),
  },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(2, var(--md-sys-grid-fr-1))`, gap: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-4)' }}>
      <ActionTile
        title="Create Lesson"
        subtitle="New Material"
        icon="school"
        onClick={() => console.log('Create Lesson')}
      />
      <ActionTile
        title="Generate Test"
        subtitle="Assessment"
        icon="assignment"
        onClick={() => console.log('Generate Test')}
      />
      <ActionTile
        title="Manage Students"
        subtitle="Class Roster"
        icon="group"
        onClick={() => console.log('Manage Students')}
      />
      <ActionTile
        title="View Analytics"
        subtitle="Performance"
        icon="analytics"
        onClick={() => console.log('View Analytics')}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple action tiles in a grid layout.',
      },
    },
  },
};

export const Dashboard: Story = {
  args: {
    title: 'New Lesson',
    icon: 'add_circle',
    onClick: () => console.log('New Lesson'),
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(3, var(--md-sys-grid-fr-1))`,
        gap: 'var(--md-sys-spacing-6)',
        padding: 'var(--md-sys-spacing-4)',
      }}
    >
      <ActionTile
        title="New Lesson"
        icon="add_circle"
        onClick={() => console.log('New Lesson')}
        tooltip="Create a new lesson"
      />
      <ActionTile
        title="My Lessons"
        icon="library_books"
        onClick={() => console.log('My Lessons')}
        tooltip="View all lessons"
      />
      <ActionTile
        title="Templates"
        icon="template_banner"
        onClick={() => console.log('Templates')}
        tooltip="Browse templates"
      />
      <ActionTile
        title="Generate Quiz"
        subtitle="AI-Powered"
        icon="quiz"
        onClick={() => console.log('Generate Quiz')}
        tooltip="Create new assessment"
      />
      <ActionTile
        title="Student Progress"
        subtitle="Analytics"
        icon="trending_up"
        onClick={() => console.log('Student Progress')}
        tooltip="View performance metrics"
      />
      <ActionTile
        title="Settings"
        icon="settings"
        onClick={() => console.log('Settings')}
        tooltip="Manage preferences"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Full dashboard layout with multiple action tiles.',
      },
    },
  },
};

export const IconVariations: Story = {
  args: {
    title: 'Add',
    icon: 'add',
    onClick: () => {},
  },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-4)', flexWrap: 'wrap' }}>
      <ActionTile title="Add" icon="add" onClick={() => {}} />
      <ActionTile title="Edit" icon="edit" onClick={() => {}} />
      <ActionTile title="Delete" icon="delete" onClick={() => {}} />
      <ActionTile title="Download" icon="download" onClick={() => {}} />
      <ActionTile title="Upload" icon="upload" onClick={() => {}} />
      <ActionTile title="Search" icon="search" onClick={() => {}} />
      <ActionTile title="Settings" icon="settings" onClick={() => {}} />
      <ActionTile title="Help" icon="help" onClick={() => {}} />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Various icon examples.',
      },
    },
  },
};

export const Accessibility: Story = {
  args: {
    title: 'Accessible Action Tile',
    subtitle: 'Keyboard Navigable',
    icon: 'accessibility_new',
    onClick: () => console.log('Accessible tile clicked'),
    tooltip: 'This tile is fully accessible with keyboard navigation and screen reader support',
  },
  parameters: {
    docs: {
      description: {
        story: 'Action tile with full accessibility support including keyboard navigation and ARIA labels.',
      },
    },
  },
};

