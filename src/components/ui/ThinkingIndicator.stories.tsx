// MD3 Compliant
import type { Meta, StoryObj } from '@storybook/react';
import ThinkingIndicator from './ThinkingIndicator';

const meta: Meta<typeof ThinkingIndicator> = {
  title: 'Components/Interactive/ThinkingIndicator',
  component: ThinkingIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component that shows AI thinking/processing states with animated dots and customizable messages.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'The message to display during thinking state'
    },
    size: {
      control: { type: 'select', options: ['small', 'medium', 'large'] },
      description: 'Size variant of the indicator'
    }
  }
} satisfies Meta<typeof ThinkingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Pensando...',
    size: 'medium'
  }
};

export const Small: Story = {
  args: {
    message: 'Elaborando risposta...',
    size: 'small'
  }
};

export const Large: Story = {
  args: {
    message: 'Analizzando documento complesso...',
    size: 'large'
  }
};

export const CustomMessage: Story = {
  args: {
    message: 'Generando suggerimenti personalizzati...',
    size: 'medium'
  }
};

