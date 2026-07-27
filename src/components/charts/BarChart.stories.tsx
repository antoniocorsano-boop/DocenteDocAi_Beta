// MD3 Compliant
import type { Meta, StoryObj } from '@storybook/react';
import BarChart from './BarChart';

const meta = {
  title: 'Components/Charts/BarChart',
  component: BarChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive bar chart component supporting both vertical and horizontal orientations with hover tooltips.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: 'Array of chart data with labels and values',
    },
    color: {
      control: 'color',
      description: 'Color for the bars',
    },
    horizontal: {
      control: 'boolean',
      description: 'Display chart horizontally instead of vertically',
    },
  },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VerticalDefault: Story = {
  args: {
    data: [
      { label: 'Jan', value: 65 },
      { label: 'Feb', value: 59 },
      { label: 'Mar', value: 80 },
      { label: 'Apr', value: 81 },
      { label: 'May', value: 56 },
      { label: 'Jun', value: 55 },
    ],
    color: 'var(--md-sys-color-primary)',
    horizontal: false,
  },
};

export const HorizontalDefault: Story = {
  args: {
    data: [
      { label: 'Product A', value: 120 },
      { label: 'Product B', value: 90 },
      { label: 'Product C', value: 150 },
      { label: 'Product D', value: 70 },
      { label: 'Product E', value: 110 },
    ],
    color: 'var(--md-sys-color-primary)',
    horizontal: true,
  },
};

export const StudentGrades: Story = {
  args: {
    data: [
      { label: 'A', value: 25 },
      { label: 'B', value: 40 },
      { label: 'C', value: 30 },
      { label: 'D', value: 15 },
      { label: 'F', value: 5 },
    ],
    color: 'var(--md-sys-color-tertiary)',
    horizontal: false,
  },
};

export const MonthlyRevenue: Story = {
  args: {
    data: [
      { label: 'Jan', value: 12000 },
      { label: 'Feb', value: 15000 },
      { label: 'Mar', value: 18000 },
      { label: 'Apr', value: 22000 },
      { label: 'May', value: 25000 },
      { label: 'Jun', value: 28000 },
      { label: 'Jul', value: 30000 },
      { label: 'Aug', value: 27000 },
      { label: 'Sep', value: 24000 },
      { label: 'Oct', value: 26000 },
      { label: 'Nov', value: 29000 },
      { label: 'Dec', value: 32000 },
    ],
    color: 'var(--md-sys-color-primary)',
    horizontal: false,
  },
};

export const TaskCompletion: Story = {
  args: {
    data: [
      { label: 'Week 1', value: 8 },
      { label: 'Week 2', value: 12 },
      { label: 'Week 3', value: 15 },
      { label: 'Week 4', value: 10 },
    ],
    color: 'var(--md-sys-color-secondary)',
    horizontal: false,
  },
};

export const CategoryComparison: Story = {
  args: {
    data: [
      { label: 'Math', value: 85 },
      { label: 'Science', value: 92 },
      { label: 'History', value: 78 },
      { label: 'English', value: 88 },
      { label: 'Art', value: 95 },
    ],
    color: 'var(--md-sys-color-tertiary)',
    horizontal: true,
  },
};

export const WebsiteTraffic: Story = {
  args: {
    data: [
      { label: 'Mon', value: 1200 },
      { label: 'Tue', value: 1900 },
      { label: 'Wed', value: 3000 },
      { label: 'Thu', value: 2500 },
      { label: 'Fri', value: 2800 },
      { label: 'Sat', value: 2100 },
      { label: 'Sun', value: 1500 },
    ],
    color: 'var(--md-sys-color-error)',
    horizontal: false,
  },
};

export const SmallDataset: Story = {
  args: {
    data: [
      { label: 'Yes', value: 75 },
      { label: 'No', value: 25 },
    ],
    color: 'var(--md-sys-color-primary)',
    horizontal: false,
  },
};

export const LargeDataset: Story = {
  args: {
    data: Array.from({ length: 20 }, (_, i) => ({
      label: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 100) + 20,
    })),
    color: 'var(--md-sys-color-tertiary)',
    horizontal: false,
  },
};

export const ErrorColor: Story = {
  args: {
    data: [
      { label: 'Critical', value: 5 },
      { label: 'High', value: 12 },
      { label: 'Medium', value: 25 },
      { label: 'Low', value: 40 },
    ],
    color: 'var(--md-sys-color-error)',
    horizontal: true,
  },
};

export const ZeroValues: Story = {
  args: {
    data: [
      { label: 'Q1', value: 0 },
      { label: 'Q2', value: 50 },
      { label: 'Q3', value: 0 },
      { label: 'Q4', value: 75 },
    ],
    color: 'var(--md-sys-color-primary)',
    horizontal: false,
  },
};

export const UniformValues: Story = {
  args: {
    data: [
      { label: 'A', value: 50 },
      { label: 'B', value: 50 },
      { label: 'C', value: 50 },
      { label: 'D', value: 50 },
    ],
    color: 'var(--md-sys-color-tertiary)',
    horizontal: false,
  },
};

