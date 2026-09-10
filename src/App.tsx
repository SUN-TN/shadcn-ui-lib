import { ThemeProvider } from './components/theme/theme-provider';
import { Toaster } from './shadcn-ui-lib/ui/sonner';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="bg-background text-foreground min-h-screen p-6">
        <h1 className="text-2xl font-semibold">shadcn-ui-lib</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Run <code className="bg-muted rounded px-1 py-0.5">pnpm dev</code> to launch Storybook.
        </p>
      </main>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
