// MD3 Compliant
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import UseCaseCard from './UseCaseCard';

const meta = {
  title: 'Components/Display/UseCaseCard',
  component: UseCaseCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component displaying a use case scenario with step-by-step instructions and optional tips.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    scenario: {
      control: 'text',
      description: 'The use case scenario description',
    },
    steps: {
      description: 'Array of step descriptions',
    },
    tip: {
      control: 'text',
      description: 'Optional tip or best practice',
    },
  },
} satisfies Meta<typeof UseCaseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    scenario: 'Creating a lesson on photosynthesis',
    steps: [
      'Start with a simple introduction to light and energy',
      'Show diagrams of the chloroplast and its parts',
      'Explain the light-dependent and light-independent reactions',
      'Use interactive animations to demonstrate the process',
    ],
    tip: 'Students learn better when you start with familiar concepts',
  },
};

export const WithoutTip: Story = {
  args: {
    scenario: 'Assessing student understanding through quizzes',
    steps: [
      'Review the learning objectives from the lesson',
      'Create questions that test different cognitive levels',
      'Mix question types for variety',
      'Set a reasonable time limit for completion',
    ],
  },
};

export const DetailedScenario: Story = {
  args: {
    scenario: 'Setting up a collaborative group project on climate change',
    steps: [
      'Divide students into groups of 4-5 members',
      'Assign specific topics within climate change to each group',
      'Provide research materials and data sources',
      'Set clear expectations for group roles and responsibilities',
      'Schedule check-in meetings to monitor progress',
      'Plan presentation date and evaluation criteria',
    ],
    tip: 'Assign roles like leader, researcher, presenter, and note-taker for better organization',
  },
};

export const TeachingStrategy: Story = {
  args: {
    scenario: 'Implementing gamification in your lessons',
    steps: [
      'Identify key learning concepts that can be gamified',
      'Design point systems or achievement badges',
      'Create engaging challenges or quests',
      'Track progress visibly for student motivation',
      'Provide immediate feedback on their actions',
    ],
    tip: 'Keep the game mechanics simple so they don\'t overshadow the learning content',
  },
};

export const FormativeAssessment: Story = {
  args: {
    scenario: 'Using formative assessment to guide instruction',
    steps: [
      'Use quick polls or exit tickets to check understanding',
      'Analyze results to identify knowledge gaps',
      'Provide immediate feedback to students',
      'Adjust lessons based on assessment data',
      'Offer targeted support for struggling students',
    ],
    tip: 'Formative assessment should be frequent and low-stakes to reduce student anxiety',
  },
};

export const DifferentiatedInstruction: Story = {
  args: {
    scenario: 'Meeting diverse learner needs with differentiation',
    steps: [
      'Assess prior knowledge and learning styles',
      'Create varied learning pathways for different levels',
      'Provide choice in how students demonstrate learning',
      'Use flexible grouping based on needs',
      'Monitor progress and adjust interventions',
    ],
    tip: 'Differentiation is not about doing different lessons, but adapting the same content',
  },
};

export const Multiple: Story = {
  args: {
    scenario: 'Quick daily review activity',
    steps: [
      'Start with a 5-minute recap of yesterday\'s lesson',
      'Use interactive polls to check retention',
      'Clarify any misconceptions',
      'Connect to today\'s new content',
    ],
    tip: 'Spaced review helps with long-term retention',
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-sys-spacing-4)', padding: 'var(--md-sys-spacing-4)' }}>
      <UseCaseCard
        scenario="Quick daily review activity"
        steps={[
          'Start with a 5-minute recap of yesterday\'s lesson',
          'Use interactive polls to check retention',
          'Clarify any misconceptions',
          'Connect to today\'s new content',
        ]}
        tip="Spaced review helps with long-term retention"
      />
      <UseCaseCard
        scenario="Peer teaching opportunity"
        steps={[
          'Select student experts for specific topics',
          'Provide preparation time and materials',
          'Have them teach small groups',
          'Encourage Q&A and discussion',
          'Provide feedback on teaching quality',
        ]}
        tip="Teaching others deepens understanding and builds confidence"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Multiple use case cards demonstrating different teaching scenarios.',
      },
    },
  },
};

export const WithHtmlFormatting: Story = {
  args: {
    scenario: 'Creating an inclusive classroom environment',
    steps: [
      'Establish <strong>clear classroom norms</strong> together with students',
      'Use <em>universal design for learning</em> (UDL) principles',
      'Provide multiple means of <strong>representation, action, and engagement</strong>',
      'Create a safe space for questions and mistakes',
      'Celebrate diverse perspectives and contributions',
    ],
    tip: 'An inclusive classroom benefits ALL students, not just those with special needs',
  },
};

export const Accessibility: Story = {
  args: {
    scenario: 'Making content accessible for all learners',
    steps: [
      'Provide captions for all video content',
      'Include alt text for images and diagrams',
      'Use high contrast text and backgrounds',
      'Ensure keyboard navigation works throughout',
      'Test with screen readers regularly',
    ],
    tip: 'Accessibility improvements benefit everyone, not just students with disabilities',
  },
};

export const LongList: Story = {
  args: {
    scenario: 'Comprehensive unit planning for a semester project',
    steps: [
      'Define learning outcomes and standards alignment',
      'Break unit into 4-5 week-long modules',
      'Plan daily lessons with clear objectives',
      'Design formative assessments for each module',
      'Create summative assessment or project',
      'Develop supplementary resources for different levels',
      'Plan enrichment activities for advanced learners',
      'Build in reflection opportunities throughout',
    ],
    tip: 'Backward design starting with end goals helps create coherent, effective units',
  },
};

export const QuickStart: Story = {
  args: {
    scenario: 'Getting started with AI-powered lesson generation',
    steps: [
      'Input your learning objective or topic',
      'Let AI generate lesson outline and activities',
      'Customize and adapt to your classroom needs',
      'Test activities with a small group first',
      'Gather feedback and iterate',
    ],
    tip: 'AI-generated content is a starting point - always review and personalize for your students',
  },
};

