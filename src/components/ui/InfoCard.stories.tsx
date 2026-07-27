/* eslint-disable react-hooks/rules-of-hooks -- Storybook render() functions are valid React renders */
// MD3 Compliant
import type { Meta, StoryObj } from '@storybook/react';
import InfoCard from './InfoCard';

const meta = {
  title: 'Components/Display/InfoCard',
  component: InfoCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Versatile info card component with multiple style variants, icons, and optional actions. Features backdrop blur and glass morphism effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title',
    },
    description: {
      control: 'text',
      description: 'Card description or main content',
    },
    icon: {
      control: 'text',
      description: 'Material Symbols icon name',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'error', 'surface', 'elevated', 'tonal'],
      description: 'Card color variant',
    },
  },
} satisfies Meta<typeof InfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Welcome',
    description: 'Get started with your learning journey today',
    icon: 'star',
    variant: 'surface',
  },
};

export const PrimaryVariant: Story = {
  args: {
    title: 'Important Update',
    description: 'Read the latest changes and improvements to the platform',
    icon: 'info',
    variant: 'primary',
  },
};

export const SecondaryVariant: Story = {
  args: {
    title: 'Success!',
    description: 'Your lesson has been created and is ready to share',
    icon: 'check_circle',
    variant: 'secondary',
  },
};

export const TertiaryVariant: Story = {
  args: {
    title: 'Pro Tip',
    description: 'Use keyboard shortcuts to save time while creating lessons',
    icon: 'lightbulb',
    variant: 'tertiary',
  },
};

export const ErrorVariant: Story = {
  args: {
    title: 'Error',
    description: 'Something went wrong. Plvar(--md-sys-motion-easing-standard) try again or contact support.',
    icon: 'error',
    variant: 'error',
  },
};

export const ElevatedVariant: Story = {
  args: {
    title: 'Featured',
    description: 'Check out our new interactive learning modules',
    icon: 'rocket',
    variant: 'elevated',
  },
};

export const TonalVariant: Story = {
  args: {
    title: 'Reminder',
    description: 'Don\'t forget to save your progress',
    icon: 'notifications_active',
    variant: 'tonal',
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'Getting Started',
    description: 'Learn how to create your first lesson in just a few steps',
    variant: 'surface',
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Quick Tip',
    icon: 'tips_and_updates',
    variant: 'tertiary',
  },
};

export const DescriptionOnly: Story = {
  args: {
    description: 'Your changes have been saved automatically',
    variant: 'secondary',
  },
};

export const WithChildren: Story = {
  args: {
    title: 'Learning Features',
    icon: 'auto_awesome',
    variant: 'primary',
    children: (
      <ul style={{ marginTop: 'var(--md-sys-spacing-4)', paddingLeft: 'var(--md-sys-spacing-6)' }}>
        <li>Interactive lessons</li>
        <li>Real-time feedback</li>
        <li>Adaptive learning paths</li>
      </ul>
    ),
  },
};

export const Clickable: Story = {
  args: {
    title: 'View Details',
    description: 'Click to expand and see more information',
    icon: 'expand',
    variant: 'surface',
    onClick: () => alert('Card clicked!'),
  },
};

export const WithAction: Story = {
  args: {
    title: 'Upgrade Available',
    description: 'Get access to premium features',
    icon: 'upgrade',
    variant: 'primary',
    action: (
      <button
        style={{
          padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)',
          background: 'var(--md-sys-color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--md-sys-spacing-4)',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Learn More
      </button>
    ),
  },
};

export const Dismissible: Story = {
  render: () => {
    const [visible, setVisible] = React.useState(true);

    if (!visible) {
      return <div style={{ padding: 'var(--md-sys-spacing-4)' }}>Card dismissed. (You can refresh to see it again)</div>;
    }

    return (
      <InfoCard
        title="Announcement"
        description="Check out our new documentation"
        icon="announcement"
        variant="secondary"
        onClose={() => setVisible(false)}
      />
    );
  },
};

export const Multiple: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-6)', padding: 'var(--md-sys-spacing-4)' }}>
      <InfoCard
        title="Welcome Back"
        description="You have 3 new assignments to review"
        icon="assignment"
        variant="primary"
      />
      <InfoCard
        title="System Update"
        description="We've improved performance and fixed several bugs"
        icon="system_update"
        variant="secondary"
      />
      <InfoCard
        title="Security Alert"
        description="Plvar(--md-sys-motion-easing-standard) review your account security settings"
        icon="security"
        variant="tertiary"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const Dashboard: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(2, var(--md-sys-grid-fr-1))`,
        gap: 'var(--md-sys-spacing-6)',
        padding: 'var(--md-sys-spacing-4)',
      }}
    >
      <InfoCard
        title="Total Students"
        description="42 active students in your classes"
        icon="group"
        variant="primary"
      />
      <InfoCard
        title="Pending Reviews"
        description="12 assignments awaiting your review"
        icon="pending_actions"
        variant="secondary"
      />
      <InfoCard
        title="Recent Activity"
        description="5 new lessons created this week"
        icon="trending_up"
        variant="tertiary"
      />
      <InfoCard
        title="System Status"
        description="All systems operational"
        icon="check_circle"
        variant="elevated"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Dashboard layout with multiple info cards.',
      },
    },
  },
};

export const Accessibility: Story = {
  args: {
    title: 'Accessibility Support',
    description: 'Full keyboard navigation and screen reader support',
    icon: 'accessibility_new',
    variant: 'primary',
    onClick: () => console.log('Accessible card clicked'),
  },
};

// Import React for the Dismissible story
import React from 'react';

