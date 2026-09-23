---
'shadcn-ui-lib': major
---

Migrate underlying UI primitives from Radix (`radix-ui`) to Base UI (`@base-ui-components/react`).

- `Button` now uses the Base UI native `render` prop instead of `asChild` (breaking change for consumers that relied on `asChild`).
- Removed unused components and their stories/registry entries: `avatar`, `card`, `dialog`, `dropdown-menu`, `select`, `sheet`, `sonner`, `tabs`. The library now ships only `button` and `input` (plus `theme` / `theme-provider` / `utils`).
- Dropped the `sonner` dependency; `App` no longer renders a `Toaster`.
