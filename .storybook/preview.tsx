import type { Preview } from '@storybook/react';
import '../src/global.css';
import { ThemeProvider } from '../src/components/theme/theme-provider';
import { Toaster } from '../src/shadcn-ui-lib/ui/sonner';
import React from 'react';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background p-6 text-foreground">
          <Story />
          <Toaster richColors position="top-right" />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    backgrounds: { disable: true },
    themes: { themeOverride: 'system' },
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
  },
};

export default preview;
