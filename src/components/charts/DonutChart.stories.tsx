// MD3 Compliant
import type { Meta, StoryObj } from '@storybook/react';
import DonutChart from './DonutChart';

const meta = {
  title: 'Components/Charts/DonutChart',
  component: DonutChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive donut chart component with hover interactions showing segment details in the center.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: 'Array of chart segments with labels, values, and colors',
    },
  },
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: [
      { label: 'Completed', value: 65, color: 'var(--md-sys-color-primary)' },
      { label: 'In Progress', value: 25, color: 'var(--md-sys-color-secondary)' },
      { label: 'Pending', value: 10, color: 'var(--md-sys-color-tertiary)' },
    ],
  },
};

export const GradeDistribution: Story = {
  args: {
    data: [
      { label: 'A', value: 20, color: 'var(--md-sys-color-primary)' },
      { label: 'B', value: 35, color: 'var(--md-sys-color-secondary)' },
      { label: 'C', value: 30, color: 'var(--md-sys-color-tertiary)' },
      { label: 'D', value: 10, color: 'var(--md-sys-color-error)' },
      { label: 'F', value: 5, color: 'var(--md-sys-color-surface-variant)' },
    ],
  },
};

export const BudgetAllocation: Story = {
  args: {
    data: [
      { label: 'Salaries', value: 40, color: 'var(--md-sys-color-primary)' },
      { label: 'Operations', value: 25, color: 'var(--md-sys-color-secondary)' },
      { label: 'Marketing', value: 20, color: 'var(--md-sys-color-tertiary)' },
      { label: 'R&D', value: 15, color: 'var(--md-sys-color-error)' },
    ],
  },
};

export const TaskStatus: Story = {
  args: {
    data: [
      { label: 'Done', value: 45, color: 'var(--md-sys-color-primary)' },
      { label: 'In Progress', value: 30, color: 'var(--md-sys-color-secondary)' },
      { label: 'Todo', value: 25, color: 'var(--md-sys-color-surface-variant)' },
    ],
  },
};

export const BrowserShare: Story = {
  args: {
    data: [
      { label: 'Chrome', value: 65, color: 'var(--md-sys-color-primary)' },
      { label: 'Safari', value: 20, color: 'var(--md-sys-color-secondary)' },
      { label: 'Firefox', value: 10, color: 'var(--md-sys-color-tertiary)' },
      { label: 'Edge', value: 5, color: 'var(--md-sys-color-error)' },
    ],
  },
};

export const TwoSegments: Story = {
  args: {
    data: [
      { label: 'Pass', value: 85, color: 'var(--md-sys-color-primary)' },
      { label: 'Fail', value: 15, color: 'var(--md-sys-color-error)' },
    ],
  },
};

export const ManySegments: Story = {
  args: {
    data: [
      { label: 'Segment 1', value: 15, color: 'var(--md-sys-color-error)' },
      { label: 'Segment 2', value: 12, color: 'var(--md-sys-color-error-container)' },
      { label: 'Segment 3', value: 10, color: 'var(--md-sys-color-tertiary)' },
      { label: 'Segment 4', value: 13, color: 'var(--md-sys-color-tertiary-container)' },
      { label: 'Segment 5', value: 11, color: 'var(--md-sys-color-secondary)' },
      { label: 'Segment 6', value: 14, color: 'var(--md-sys-color-primary)' },
      { label: 'Segment 7', value: 10, color: 'var(--md-sys-color-surface-variant)' },
      { label: 'Segment 8', value: 15, color: 'var(--md-sys-color-outline)' },
    ],
  },
};

export const AttendanceRate: Story = {
  args: {
    data: [
      { label: 'Present', value: 90, color: 'var(--md-sys-color-primary)' },
      { label: 'Absent', value: 5, color: 'var(--md-sys-color-error)' },
      { label: 'Excused', value: 5, color: 'var(--md-sys-color-tertiary)' },
    ],
  },
};

export const CourseCompletion: Story = {
  args: {
    data: [
      { label: 'Completed', value: 75, color: 'var(--md-sys-color-primary)' },
      { label: 'Remaining', value: 25, color: 'var(--md-sys-color-surfaceContainerHigh)' },
    ],
  },
};

export const DocumentTypes: Story = {
  args: {
    data: [
      { label: 'PDF', value: 40, color: 'var(--md-sys-color-error)' },
      { label: 'DOCX', value: 30, color: 'var(--md-sys-color-primary)' },
      { label: 'PPTX', value: 20, color: 'var(--md-sys-color-tertiary)' },
      { label: 'XLSX', value: 10, color: 'var(--md-sys-color-secondary)' },
    ],
  },
};

export const Equal: Story = {
  args: {
    data: [
      { label: 'Q1', value: 25, color: 'var(--md-sys-color-error)' },
      { label: 'Q2', value: 25, color: 'var(--md-sys-color-primary)' },
      { label: 'Q3', value: 25, color: 'var(--md-sys-color-secondary)' },
      { label: 'Q4', value: 25, color: 'var(--md-sys-color-tertiary)' },
    ],
  },
};

export const StudentEngagement: Story = {
  args: {
    data: [
      { label: 'Highly Engaged', value: 35, color: 'var(--md-sys-color-primary)' },
      { label: 'Moderately Engaged', value: 45, color: 'var(--md-sys-color-tertiary)' },
      { label: 'Low Engagement', value: 20, color: 'var(--md-sys-color-error)' },
    ],
  },
};

export const CustomColors: Story = {
  args: {
    data: [
      { label: 'Category A', value: 30, color: 'var(--md-sys-color-error-container)' },
      { label: 'Category B', value: 25, color: 'var(--md-sys-color-tertiary)' },
      { label: 'Category C', value: 20, color: 'var(--md-sys-color-tertiary-container)' },
      { label: 'Category D', value: 15, color: 'var(--md-sys-color-secondary)' },
      { label: 'Category E', value: 10, color: 'var(--md-sys-color-primary)' },
    ],
  },
};

