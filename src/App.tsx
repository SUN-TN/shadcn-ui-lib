import { ThemeProvider } from './components/theme/theme-provider';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen bg-background p-6 text-foreground">
        <h1 className="text-2xl font-semibold">shadcn-ui-lib</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Run <code className="rounded bg-muted px-1 py-0.5">pnpm dev</code> to launch Storybook.
        </p>
      </main>
    </ThemeProvider>
  );
}
