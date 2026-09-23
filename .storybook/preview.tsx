import type { Preview } from '@storybook/react';
import '../src/global.css';
import { ThemeProvider } from '../src/components/theme/theme-provider';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background p-6 text-foreground">
          <Story />
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
