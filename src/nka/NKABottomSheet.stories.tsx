import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NKABottomSheet from './NKABottomSheet';
import { NKANode } from './types';

// Sample nodes for demonstration - using CSS variables instead of hardcoded colors
const sampleNodes: NKANode[] = [
  { id: '1', label: 'Introduzione', color: 'var(--md-sys-color-error)', elevation: 1, depth: 0, shape: 'circle', actions: [] },
  { id: '2', label: 'Concetti Base', color: 'var(--md-sys-color-tertiary)', elevation: 2, depth: 1, shape: 'circle', actions: [] },
  { id: '3', label: 'Applicazioni', color: 'var(--md-sys-color-secondary)', elevation: 2, depth: 1, shape: 'circle', actions: [] },
  { id: '4', label: 'Esempi Pratici', color: 'var(--md-sys-color-primary)', elevation: 3, depth: 2, shape: 'circle', actions: [] },
  { id: '5', label: 'Conclusioni', color: 'var(--md-sys-color-surface-variant)', elevation: 4, depth: 3, shape: 'circle', actions: [] },
];

const meta = {
  title: 'Components/NKA/NKABottomSheet',
  component: NKABottomSheet,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Neural Knowledge Architecture (NKA) Bottom Sheet modal displaying an interactive force-directed graph of knowledge nodes with AI-powered wizard generation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the bottom sheet is visible',
    },
    nodes: {
      description: 'Array of NKA nodes to display in the map',
    },
  },
} satisfies Meta<typeof NKABottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    nodes: sampleNodes,
    onClose: () => {},
    onNodeSelect: (node) => {},
  },
};

export const Closed: Story = {
  args: {
    open: false,
    nodes: sampleNodes,
    onClose: () => {},
    onNodeSelect: (node) => {},
  },
};

export const Interactive: Story = {
  args: {
    open: true,
    nodes: sampleNodes,
    onClose: () => {},
    onNodeSelect: (node: NKANode) => {},
  },
  render: (args) => {
    const [open, setOpen] = React.useState(args.open);
    const [selectedNode, setSelectedNode] = React.useState<NKANode | null>(null);

    return (
      <div style={{ padding: 'var(--md-sys-spacing-8)' }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: 'var(--md-sys-spacing-4) var(--md-sys-spacing-8)',
            background: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
            border: 'none',
            borderRadius: 'var(--md-sys-spacing-6)',
            cursor: 'pointer',
            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
            fontWeight: 'var(--md-sys-typescale-weight-semibold)',
          }}
        >
          Open Knowledge Map
        </button>
        {selectedNode && (
          <div style={{ marginTop: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-4)', background: 'var(--md-sys-color-surfaceContainer)', borderRadius: 'var(--md-sys-spacing-2)' }}>
            <strong>Selected Node:</strong> {selectedNode.label}
          </div>
        )}
        <NKABottomSheet
          open={open}
          nodes={args.nodes}
          onClose={() => setOpen(false)}
          onNodeSelect={(node) => {
            setSelectedNode(node);
            console.log('Selected:', node);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo - click the button to open the bottom sheet and explore the knowledge map.',
      },
    },
  },
};

export const ManyNodes: Story = {
  args: {
    open: true,
    nodes: Array.from({ length: 20 }, (_, i) => ({
      id: `node-${i}`,
      label: `Node ${i + 1}`,
      color: `hsl(${(i * 18) % 360}, 70%, 60%)`,
      elevation: (i % 4) + 1,
      depth: Math.floor(i / 5),
      shape: 'circle' as const,
      actions: [],
    })),
    onClose: () => console.log('Close'),
    onNodeSelect: (node) => console.log('Selected node:', node),
  },
};

export const LinearPath: Story = {
  args: {
    open: true,
    nodes: [
      { id: '1', label: 'Step 1: Introduction', color: 'var(--md-sys-color-primary)', elevation: 1, depth: 0, shape: 'circle', actions: [] },
      { id: '2', label: 'Step 2: Setup', color: 'var(--md-sys-color-secondary)', elevation: 2, depth: 1, shape: 'circle', actions: [] },
      { id: '3', label: 'Step 3: Configuration', color: 'var(--md-sys-color-tertiary)', elevation: 2, depth: 1, shape: 'circle', actions: [] },
      { id: '4', label: 'Step 4: Implementation', color: 'var(--md-sys-color-error)', elevation: 3, depth: 2, shape: 'circle', actions: [] },
      { id: '5', label: 'Step 5: Testing', color: 'var(--md-sys-color-warning)', elevation: 3, depth: 2, shape: 'circle', actions: [] },
      { id: '6', label: 'Step 6: Deployment', color: 'var(--md-sys-color-tertiary)', elevation: 4, depth: 3, shape: 'circle', actions: [] },
    ],
    onClose: () => console.log('Close'),
    onNodeSelect: (node) => console.log('Selected node:', node),
  },
  parameters: {
    docs: {
      description: {
        story: 'Linear knowledge path demonstrating sequential dependencies.',
      },
    },
  },
};

export const ComplexNetwork: Story = {
  args: {
    open: true,
    nodes: [
      { id: 'root', label: 'Root Concept', color: 'var(--md-sys-color-primary)', elevation: 4, depth: 0, shape: 'circle', actions: [] },
      { id: 'branch1', label: 'Branch A', color: 'var(--md-sys-color-secondary)', elevation: 3, depth: 1, shape: 'circle', actions: [] },
      { id: 'branch2', label: 'Branch B', color: 'var(--md-sys-color-secondary)', elevation: 3, depth: 1, shape: 'circle', actions: [] },
      { id: 'branch3', label: 'Branch C', color: 'var(--md-sys-color-secondary)', elevation: 3, depth: 1, shape: 'circle', actions: [] },
      { id: 'leaf1', label: 'Leaf A1', color: 'var(--md-sys-color-tertiary)', elevation: 2, depth: 2, shape: 'circle', actions: [] },
      { id: 'leaf2', label: 'Leaf A2', color: 'var(--md-sys-color-tertiary)', elevation: 2, depth: 2, shape: 'circle', actions: [] },
      { id: 'leaf3', label: 'Leaf B1', color: 'var(--md-sys-color-tertiary)', elevation: 2, depth: 2, shape: 'circle', actions: [] },
      { id: 'leaf4', label: 'Leaf B2', color: 'var(--md-sys-color-tertiary)', elevation: 2, depth: 2, shape: 'circle', actions: [] },
      { id: 'convergence', label: 'Convergence', color: 'var(--md-sys-color-error)', elevation: 3, depth: 3, shape: 'circle', actions: [] },
    ],
    onClose: () => console.log('Close'),
    onNodeSelect: (node) => console.log('Selected node:', node),
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex network showing branching and convergence patterns.',
      },
    },
  },
};

export const SingleNode: Story = {
  args: {
    open: true,
    nodes: [{ id: '1', label: 'Single Concept', color: 'var(--md-sys-color-primary)', elevation: 1, depth: 0, shape: 'circle', actions: [] }],
    onClose: () => console.log('Close'),
    onNodeSelect: (node) => console.log('Selected node:', node),
  },
};

