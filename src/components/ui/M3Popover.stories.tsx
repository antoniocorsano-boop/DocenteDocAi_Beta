/* eslint-disable react-hooks/rules-of-hooks -- Storybook render() functions are valid React renders */
// MD3 Compliant
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import M3Popover from './M3Popover';
import Button from '@mui/material/Button';

const meta: Meta<typeof M3Popover> = {
  component: M3Popover,
  title: 'UI/Popovers/M3Popover',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Material Design 3 Popover component. A lightweight, position-aware popover for menus, tooltips, and dropdown content. Replaces MUI Popover.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof M3Popover>;

/**
 * Basic Popover
 */
export const Basic: Story = {
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    
    return (
      <div style={{ padding: 'var(--md-sys-spacing-8)' }}>
        <Button
          variant="contained"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Open Popover
        </Button>
        
        <M3Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          title="Popover Title"
        >
          <div style={{ padding: 'var(--md-sys-spacing-4)', minWidth: 'var(--md-sys-spacing-4)' }}>
            <p style={{ margin: `0 0 var(--md-sys-spacing-3) 0`, color: 'var(--md-sys-color-onSurface)' }}>
              This is a basic popover with some content.
            </p>
            <p style={{ margin: '0', color: 'var(--md-sys-color-onSurface-variant)', fontSize: 'var(--md-sys-typescale-body-small-font-size)' }}>
              Click outside to close.
            </p>
          </div>
        </M3Popover>
      </div>
    );
  },
};

/**
 * Popover with Actions
 */
export const WithActions: Story = {
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    
    return (
      <div style={{ padding: 'var(--md-sys-spacing-8)' }}>
        <Button
          variant="contained"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Event Actions
        </Button>
        
        <M3Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          title="Meeting - Jan 15"
          subtitle="10:00 AM - 11:00 AM"
          minWidth={280}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => {
                console.log('Edit clicked');
                setAnchorEl(null);
              }}
              style={{
                padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--md-sys-color-onSurface)',
                fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
                transition: 'background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
              }}
              onMouseEnter={() => {
                // removed runtime mutation
              }}
              onMouseLeave={() => {
                // removed runtime mutation
              }}
            >
              📝 Modifica
            </button>
            <button
              onClick={() => {
                console.log('Delete clicked');
                setAnchorEl(null);
              }}
              style={{
                padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--md-sys-color-error)',
                fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
                transition: 'background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
              }}
              onMouseEnter={() => {
                // removed runtime mutation
              }}
              onMouseLeave={() => {
                // removed runtime mutation
              }}
            >
              🗑️ Elimina
            </button>
          </div>
        </M3Popover>
      </div>
    );
  },
};

/**
 * Popover Positioned Top
 */
export const PositionedTop: Story = {
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    
    return (
      <div style={{ padding: 'var(--md-sys-spacing-16) var(--md-sys-spacing-8) var(--md-sys-spacing-8) var(--md-sys-spacing-8)' }}>
        <Button
          variant="contained"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Popover Above
        </Button>
        
        <M3Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorVertical="top"
          title="Positioned Above"
        >
          <div style={{ padding: 'var(--md-sys-spacing-4)', minWidth: 'var(--md-sys-spacing-4)' }}>
            <p style={{ margin: '0', color: 'var(--md-sys-color-onSurface)' }}>
              This popover appears above the trigger button.
            </p>
          </div>
        </M3Popover>
      </div>
    );
  },
};

/**
 * Popover with Scrollable Content
 */
export const ScrollableContent: Story = {
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    
    const items = Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`);
    
    return (
      <div style={{ padding: 'var(--md-sys-spacing-8)' }}>
        <Button
          variant="contained"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Long List
        </Button>
        
        <M3Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          title="Select an Item"
          maxWidth={300}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item) => (
              <button
                key={item}
                onClick={() => {
                  console.log(item);
                  setAnchorEl(null);
                }}
                style={{
                  padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--md-sys-color-onSurface)',
                  fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
                  transition: 'background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
                  borderBottom: 'var(--md-sys-border-width-normal) solid var(--md-sys-color-outline-variant)',
                }}
                onMouseEnter={() => {
                  // removed runtime mutation
                }}
                onMouseLeave={() => {
                  // removed runtime mutation
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </M3Popover>
      </div>
    );
  },
};

/**
 * Popover without Backdrop
 */
export const NoBackdrop: Story = {
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    
    return (
      <div style={{ padding: 'var(--md-sys-spacing-8)' }}>
        <Button
          variant="outlined"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          Quick Menu
        </Button>
        
        <M3Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          showBackdrop={false}
          minWidth={180}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {['Copy', 'Paste', 'Delete'].map((action) => (
              <button
                key={action}
                onClick={() => {
                  console.log(action);
                  setAnchorEl(null);
                }}
                style={{
                  padding: 'var(--md-sys-spacing-3) var(--md-sys-spacing-4)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--md-sys-color-onSurface)',
                  fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
                  transition: 'background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
                }}
                onMouseEnter={() => {
                  // removed runtime mutation
                }}
                onMouseLeave={() => {
                  // removed runtime mutation
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </M3Popover>
      </div>
    );
  },
};

