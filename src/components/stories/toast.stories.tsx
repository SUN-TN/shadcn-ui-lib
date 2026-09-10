import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

const meta = {
  title: 'Components/Toast',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success('Saved successfully')}>Show success</Button>
  ),
};

export const Info: Story = {
  render: () => <Button onClick={() => toast.info('New update available')}>Show info</Button>,
};

export const Warning: Story = {
  render: () => (
    <Button variant="secondary" onClick={() => toast.warning('Please review your input')}>
      Show warning
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button variant="destructive" onClick={() => toast.error('Something went wrong')}>
      Show error
    </Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.message('New message', {
          description: 'You have a new message from the team.',
        })
      }
    >
      Show message
    </Button>
  ),
};
