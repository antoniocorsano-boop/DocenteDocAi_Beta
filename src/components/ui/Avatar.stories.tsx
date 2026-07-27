// MD3 Compliant
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta = {
  title: 'Components/Display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Avatar component displaying user initials or profile image in different sizes. Automatically generates initials from the name.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Full name - used to generate initials if no image provided',
    },
    src: {
      control: 'text',
      description: 'Image URL for avatar',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Avatar size',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    name: 'Alice Johnson',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    name: 'Bob Smith',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    name: 'Carol Williams',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    name: 'David Brown',
    size: 'xl',
  },
};

export const WithImage: Story = {
  args: {
    name: 'Emma Wilson',
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    size: 'lg',
  },
};

export const SingleName: Story = {
  args: {
    name: 'Prince',
    size: 'md',
  },
};

export const LongName: Story = {
  args: {
    name: 'Alexander Montgomery III',
    size: 'md',
  },
};

export const MultipleAvatars: Story = {
  args: {
    name: 'Alice Johnson',
    size: 'md',
  },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--md-sys-spacing-4)', alignItems: 'center' }}>
      <Avatar name="Alice Johnson" size="sm" />
      <Avatar name="Bob Smith" size="md" />
      <Avatar name="Carol Williams" size="lg" />
      <Avatar name="David Brown" size="xl" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple avatars in different sizes displayed together.',
      },
    },
  },
};

export const Initials: Story = {
  args: {
    name: 'Maria Garcia',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Avatar showing initials (MG) generated from the name.',
      },
    },
  },
};

export const ProfileImage: Story = {
  args: {
    name: 'Sarah Lee',
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Avatar displaying a profile image.',
      },
    },
  },
};

export const TextFallback: Story = {
  args: {
    name: 'John Doe',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Avatar with initials fallback when image is unavailable.',
      },
    },
  },
};

export const Accessibility: Story = {
  args: {
    name: 'Lisa Martinez',
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Avatar with proper alt text for images, supporting screen readers.',
      },
    },
  },
};

export const TeamGroup: Story = {
  args: {
    name: 'Alice Johnson',
    size: 'md',
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, var(--md-sys-grid-fr-1))',
        gap: 'var(--md-sys-spacing-6)',
        padding: 'var(--md-sys-spacing-4)',
      }}
    >
      <Avatar name="Alice Johnson" size="md" />
      <Avatar name="Bob Smith" size="md" />
      <Avatar name="Carol Williams" size="md" />
      <Avatar name="David Brown" size="md" />
      <Avatar name="Emma Wilson" size="md" />
      <Avatar name="Frank Davis" size="md" />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple avatars in a grid layout representing a team.',
      },
    },
  },
};

export const SpecialCharacters: Story = {
  args: {
    name: 'José García',
    size: 'md',
  },
};

export const TwoCharInitials: Story = {
  args: {
    name: 'Vincent van Gogh',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Avatar showing two-character initials (VV) from a three-word name.',
      },
    },
  },
};

