/* eslint-disable react-hooks/rules-of-hooks -- Storybook render() functions are valid React renders */
// MD3 Compliant - Block G Migration (14 violations eliminated)
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import M3Dialog from './M3Dialog';

const meta = {
  title: 'M3/Dialog',
  component: M3Dialog,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Dialog title (required)',
    },
    headline: {
      control: 'text',
      description: 'Optional subtitle',
    },
    children: {
      control: 'text',
      description: 'Dialog content',
    },
    mode: {
      control: 'select',
      options: ['modal', 'fullscreen'],
      description: 'Dialog display mode',
    },
    backdropClickable: {
      control: 'boolean',
      description: 'Close dialog when clicking backdrop',
    },
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Maximum width constraint',
    },
    level: {
      control: { type: 'number', min: 1, max: 5, step: 1 },
      description: 'Nesting level for z-index',
    },
  },
} satisfies Meta<typeof M3Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Simple modal dialog
 */
export const Default: Story = {
  args: {
    title: 'Dialog Title',
    children: 'This is a simple dialog with basic content.',
    onClose: () => console.log('Dialog closed'),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
          >
            Open Dialog
          </button>
        )}
        {isOpen && (
          <M3Dialog
            {...args}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
};

/**
 * Dialog with headline
 */
export const WithHeadline: Story = {
  args: {
    title: 'Important Notice',
    headline: 'Plvar(--md-sys-motion-easing-standard) read carefully',
    children: 'This dialog has both a title and headline for better context.',
    onClose: () => console.log('Dialog closed'),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
          >
            Open Dialog
          </button>
        )}
        {isOpen && (
          <M3Dialog
            {...args}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
};

/**
 * Dialog with action buttons
 */
export const WithButtons: Story = {
  args: {
    title: 'Confirm Action',
    children: 'Are you sure you want to proceed? This action cannot be undone.',
    buttons: (
      <div>
        <button>
          Cancel
        </button>
        <button>
          Confirm
        </button>
      </div>
    ),
    onClose: () => console.log('Dialog closed'),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
          >
            Open Dialog
          </button>
        )}
        {isOpen && (
          <M3Dialog
            {...args}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
};

/**
 * Fullscreen dialog
 */
export const Fullscreen: Story = {
  args: {
    title: 'Fullscreen Dialog',
    mode: 'fullscreen',
    children: (
      <div>
        <p>This dialog takes up the full screen.</p>
        <p>It's useful for complex forms or detailed content.</p>
      </div>
    ),
    onClose: () => console.log('Dialog closed'),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
          >
            Open Fullscreen
          </button>
        )}
        {isOpen && (
          <M3Dialog
            {...args}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
};

/**
 * Dialog with rich content
 */
export const RichContent: Story = {
  args: {
    title: 'Settings',
    headline: 'Customize your experience',
    children: <div>
        <div>
          <label htmlFor="theme-select">
            Theme
          </label>
          <div>Select element here</div>
        </div>
        <div>
          <label htmlFor="notifications-checkbox">
            <input type="checkbox" defaultChecked />
            Enable notifications
          </label>
        </div>
      </div>,
    buttons: (
      <button>
        Save Settings
      </button>
    ),
    onClose: () => console.log('Dialog closed'),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
          >
            Open Settings
          </button>
        )}
        {isOpen && (
          <M3Dialog
            {...args}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
};

/**
 * Dialog with different max width
 */
export const SmallDialog: Story = {
  args: {
    title: 'Quick Confirmation',
    maxWidth: 'sm',
    children: 'This is a small dialog with constrained width.',
    onClose: () => console.log('Dialog closed'),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
          >
            Open Small Dialog
          </button>
        )}
        {isOpen && (
          <M3Dialog
            {...args}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  },
};

