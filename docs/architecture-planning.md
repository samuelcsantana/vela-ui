# Architecture Planning

Architecture rules for Vela UI (corporate SPA). This document is the source of truth for structural front-end decisions — follow it before proposing alternative abstractions.

## Stack

- **Build**: Rsbuild (Rspack) + TypeScript
- **Styling**: Tailwind CSS (v4, configured via `postcss.config.mjs`, no `tailwind.config.js` for simple tokens)
- **Server state**: TanStack Query v5
- **Client state**: Zustand
- **Forms**: React Hook Form + Zod (via `@hookform/resolvers` when integrated)
- **Icons**: Lucide React

## Golden rule: state separation

- **Zero Redux.** Do not introduce Redux, Redux Toolkit, MobX, or equivalent libraries. The only two global state mechanisms are Zustand (client) and TanStack Query (server).
- **Server state belongs to TanStack Query.** Any data coming from an API (listings, details, mutations) must be modeled with `useQuery`/`useMutation`, never copied into a Zustand store or global `useState`. This avoids cache duplication and stale state.
- **Client state belongs to Zustand.** UI state (open modals, local filters, theme, wizard steps, row selection) lives in Zustand stores, created per scope/feature — avoid a single monolithic global store.
- Do not manually sync Zustand with TanStack Query. If data needs to be both "server-fetched" and "locally editable" at the same time, prefer TanStack Query's cache with `setQueryData`/optimistic updates instead of mirroring it into another store.

## Performance

- Every routable `feature` must be loaded via `React.lazy` + `Suspense` (route-based code-splitting).
- Large list components must use a stable `key` and avoid recreating inline functions/objects in props when that breaks memoization (`useCallback`/`useMemo` used judiciously, not by default).
- Zustand selectors must be granular (`useStore((s) => s.field)`), never `useStore((s) => s)`, to avoid cascading re-renders.
- Configure `staleTime`/`gcTime` on the `QueryClient` (`src/lib/query-client.ts`) per query when the data doesn't change on every request; avoid aggressive refetching without a reason.
- Prefer "dumb" data-presentation components (props in) and keep fetch/mutation logic in `features/*` hooks, not in presentation components.

## Forms

- Every form uses `react-hook-form` with a `zod` validation schema, resolved via `zodResolver`.
- Zod schemas live in `lib/schemas` or alongside the feature (`features/<feature>/schema.ts`) and are the single source of truth for validation — don't duplicate validation rules manually.

## Folder structure (`/src`)

```
src/
  components/   # Reusable, domain-agnostic UI components (internal design system)
  hooks/        # Generic hooks reused across features (e.g. useDebounce, useMediaQuery)
  lib/          # Infra and utilities: query-client, api client, global schemas, pure helpers
  features/     # Domain modules (e.g. features/invoices, features/users). Each feature groups
                # its own components, hooks, Zustand stores, queries/mutations, and Zod schemas.
  store/        # Global/cross-feature Zustand stores (e.g. session, theme, layout)
  styles/       # Tailwind entry point (globals.css) and minimal global styles
```

- Dependency rule: `components` and `hooks` cannot import from `features`. `features` may import from `components`, `hooks`, `lib`, and `store`.
- Prefer creating a store/hook inside the feature itself when the state isn't shared; only promote it to `store/` or `hooks/` when there's real (not speculative) reuse.
- **Documented exception:** `features/auth/store/auth-store.ts` is treated as global/cross-cutting state (equivalent to something in `store/`), since the application shell (`AppLayout`, `Header`, `Sidebar`, route guards) depends on it to know who's logged in. Layout components may import this store directly, even though it physically lives under `features/`. Do not replicate this pattern for other features' stores without an equivalent justification (a real dependency from the application shell).

## General conventions

- TypeScript in strict mode — avoid `any`; prefer `unknown` + narrowing, or types inferred from Zod (`z.infer<typeof schema>`).
- No CSS-in-JS and no per-component `.css` files — styling via Tailwind utility classes.
- Icons always via `lucide-react`; don't mix in other icon libraries.

## Commands

- `npm run dev` — starts the development server
- `npm run build` — production build
- `npm run preview` — local preview of the production build
