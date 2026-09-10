import type { Preview } from '@storybook/react';
import '../src/index.css';
import { ThemeProvider } from '../src/components/theme/theme-provider';
import { Toaster } from '../src/components/ui/sonner';
import React from 'react';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="bg-background text-foreground min-h-screen p-6">
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
