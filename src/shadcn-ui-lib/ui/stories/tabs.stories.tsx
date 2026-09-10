import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { Input } from '../input';
import { Button } from '../button';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Update your account information.
        </p>
        <Input placeholder="Name" />
        <Input placeholder="Username" />
      </TabsContent>
      <TabsContent value="password" className="space-y-3">
        <p className="text-sm text-muted-foreground">Change your password here.</p>
        <Input type="password" placeholder="Current password" />
        <Input type="password" placeholder="New password" />
        <Button>Save password</Button>
      </TabsContent>
    </Tabs>
  ),
};

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview content</TabsContent>
      <TabsContent value="analytics">Analytics content</TabsContent>
      <TabsContent value="reports">Reports content</TabsContent>
    </Tabs>
  ),
};
