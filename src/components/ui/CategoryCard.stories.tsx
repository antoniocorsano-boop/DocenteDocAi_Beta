/* eslint-disable react-hooks/rules-of-hooks -- Storybook render() functions are valid React renders */
// MD3 Compliant
import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import CategoryCard from './CategoryCard';

const meta = {
  title: 'Components/Interactive/CategoryCard',
  component: CategoryCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Category card component with icon, label, and selection state. Features hover animations and smooth transitions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Category label text',
    },
    icon: {
      control: 'text',
      description: 'Material Symbols icon name',
    },
    color: {
      control: 'color',
      description: 'Card accent color',
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the card is selected',
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler callback',
    },
  },
} satisfies Meta<typeof CategoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: '1',
    label: 'Mathematics',
    icon: 'calculate',
    color: 'var(--md-sys-color-primary)',
    isSelected: false,
    onClick: () => console.log('Mathematics selected'),
  },
};

export const Selected: Story = {
  args: {
    id: '2',
    label: 'Science',
    icon: 'science',
    color: 'var(--md-sys-color-secondary)',
    isSelected: true,
    onClick: () => console.log('Science selected'),
  },
};

export const WithDescription: Story = {
  args: {
    id: '3',
    label: 'Literature',
    icon: 'library_books',
    color: 'var(--md-sys-color-tertiary)',
    isSelected: false,
    description: 'Explore language and writing',
    onClick: () => console.log('Literature selected'),
  },
};

export const SelectedWithDescription: Story = {
  args: {
    id: '4',
    label: 'History',
    icon: 'history',
    color: 'var(--md-sys-color-error)',
    isSelected: true,
    description: 'Timeline and events',
    onClick: () => console.log('History selected'),
  },
};

export const Arts: Story = {
  args: {
    id: '5',
    label: 'Arts',
    icon: 'palette',
    color: 'var(--md-sys-color-surface-variant)',
    isSelected: false,
    onClick: () => console.log('Arts selected'),
  },
};

export const Music: Story = {
  args: {
    id: '6',
    label: 'Music',
    icon: 'music_note',
    color: 'var(--md-sys-color-outline)',
    isSelected: false,
    onClick: () => console.log('Music selected'),
  },
};

export const PhysicalEducation: Story = {
  args: {
    id: '7',
    label: 'Physical Ed.',
    icon: 'sports_soccer',
    color: 'var(--md-sys-color-secondary)',
    isSelected: false,
    description: 'Health and sports',
    onClick: () => console.log('PE selected'),
  },
};

export const Technology: Story = {
  args: {
    id: '8',
    label: 'Technology',
    icon: 'computer',
    color: 'var(--md-sys-color-primary)',
    isSelected: false,
    description: 'Digital skills',
    onClick: () => console.log('Technology selected'),
  },
};

export const Interactive: Story = {
  args: {
    id: '1',
    label: 'Math',
    icon: 'calculate',
    color: 'var(--md-sys-color-primary)',
    isSelected: false,
    onClick: () => {},
  },
  render: () => {
    const [selected, setSelected] = useState<string>('1');

    const categories = [
      { id: '1', label: 'Math', icon: 'calculate', color: 'var(--md-sys-color-primary)' },
      { id: '2', label: 'Science', icon: 'science', color: 'var(--md-sys-color-secondary)' },
      { id: '3', label: 'English', icon: 'language', color: 'var(--md-sys-color-tertiary)' },
      { id: '4', label: 'History', icon: 'history', color: 'var(--md-sys-color-error)' },
    ];

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(2, var(--md-sys-grid-fr-1))`,
          gap: 'var(--md-sys-spacing-6)',
          padding: 'var(--md-sys-spacing-4)',
        }}
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            id={cat.id}
            label={cat.label}
            icon={cat.icon}
            color={cat.color}
            isSelected={selected === cat.id}
            onClick={() => setSelected(cat.id)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Interactive demo showing category selection.',
      },
    },
  },
};

export const AllCategories: Story = {
  args: {
    id: '1',
    label: 'Mathematics',
    icon: 'calculate',
    color: 'var(--md-sys-color-primary)',
    isSelected: false,
    onClick: () => {},
  },
  render: () => {
    const [selected, setSelected] = useState<string>('1');

    const categories = [
      { id: '1', label: 'Mathematics', icon: 'calculate', color: 'var(--md-sys-color-primary)', description: 'Numbers and logic' },
      { id: '2', label: 'Science', icon: 'science', color: 'var(--md-sys-color-secondary)', description: 'Natural sciences' },
      { id: '3', label: 'Literature', icon: 'library_books', color: 'var(--md-sys-color-tertiary)', description: 'Language & writing' },
      { id: '4', label: 'History', icon: 'history', color: 'var(--md-sys-color-error)', description: 'Past events' },
      { id: '5', label: 'Arts', icon: 'palette', color: 'var(--md-sys-color-surface-variant)', description: 'Creative expression' },
      { id: '6', label: 'Music', icon: 'music_note', color: 'var(--md-sys-color-outline)', description: 'Rhythm & sound' },
      { id: '7', label: 'PE', icon: 'sports_soccer', color: 'var(--md-sys-color-secondary)', description: 'Health & sports' },
      { id: '8', label: 'Tech', icon: 'computer', color: 'var(--md-sys-color-primary)', description: 'Digital skills' },
    ];

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(4, var(--md-sys-grid-fr-1))`,
          gap: 'var(--md-sys-spacing-4)',
          padding: 'var(--md-sys-spacing-4)',
        }}
      >
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            id={cat.id}
            label={cat.label}
            icon={cat.icon}
            color={cat.color}
            isSelected={selected === cat.id}
            description={cat.description}
            onClick={() => setSelected(cat.id)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Grid of all academic categories with descriptions.',
      },
    },
  },
};

export const Grid: Story = {
  args: {
    id: '1',
    label: 'Math',
    icon: 'calculate',
    color: 'var(--md-sys-color-primary)',
    isSelected: false,
    onClick: () => {},
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
      <CategoryCard
        id="1"
        label="Math"
        icon="calculate"
        color="var(--md-sys-color-primary)"
        isSelected={false}
        onClick={() => {}}
      />
      <CategoryCard
        id="2"
        label="Science"
        icon="science"
        color="var(--md-sys-color-secondary)"
        isSelected={true}
        onClick={() => {}}
      />
      <CategoryCard
        id="3"
        label="English"
        icon="language"
        color="var(--md-sys-color-tertiary)"
        isSelected={false}
        onClick={() => {}}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

export const CompactSelection: Story = {
  args: {
    id: '0',
    label: 'Cat 1',
    icon: 'category',
    color: 'hsl(0, 0.7, 0.6)',
    isSelected: false,
    onClick: () => {},
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(6, var(--md-sys-grid-fr-1))`,
        gap: 'var(--md-sys-spacing-4)',
        padding: 'var(--md-sys-spacing-4)',
      }}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <CategoryCard
          key={i}
          id={String(i)}
          label={`Cat ${i + 1}`}
          icon="category"
          color={`hsl(${(i * 30) % 360}, 0.7, 0.6)`}
          isSelected={i === 2}
          onClick={() => {}}
        />
      ))}
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Compact grid showing many categories.',
      },
    },
  },
};

export const Accessibility: Story = {
  args: {
    id: '1',
    label: 'Accessible Category',
    icon: 'accessibility_new',
    color: 'var(--md-sys-color-primary)',
    isSelected: false,
    description: 'Keyboard navigable and screen reader friendly',
    onClick: () => console.log('Accessibility selected'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Category card with full keyboard navigation and ARIA support.',
      },
    },
  },
};

export const CustomColors: Story = {
  args: {
    id: '0',
    label: 'Color 1',
    icon: 'palette',
    color: 'var(--md-sys-color-primary)',
    isSelected: false,
    onClick: () => {},
  },
  render: () => {
    const [selected, setSelected] = useState<string>('1');

    const colors = ['var(--md-sys-color-primary)', 'var(--md-sys-color-secondary)', 'var(--md-sys-color-tertiary)', 'var(--md-sys-color-error)', 'var(--md-sys-color-surface-variant)', 'var(--md-sys-color-outline)'];

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, var(--md-sys-grid-fr-1))`,
          gap: 'var(--md-sys-spacing-6)',
          padding: 'var(--md-sys-spacing-4)',
        }}
      >
        {colors.map((color, i) => (
          <CategoryCard
            key={i}
            id={String(i)}
            label={`Color ${i + 1}`}
            icon="palette"
            color={color}
            isSelected={selected === String(i)}
            onClick={() => setSelected(String(i))}
          />
        ))}
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Category cards with various color schemes.',
      },
    },
  },
};

