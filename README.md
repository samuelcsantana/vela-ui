# Vela UI

[![CI](https://github.com/samuelcsantana/vela-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/samuelcsantana/vela-ui/actions/workflows/ci.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./vitest.config.ts)
[![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-0-brightgreen)](https://github.com/samuelcsantana/vela-ui/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](./tsconfig.json)

A corporate SPA portfolio project demonstrating a modern, production-grade React front-end architecture: multi-tenant user management, mock authentication with route guards, dark mode, internationalization, and a strict accessibility (WCAG) baseline — backed by a 100%-coverage automated test suite and a CI pipeline that enforces both.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | [Rsbuild](https://rsbuild.rs) (Rspack) | Rust-based bundler, near-instant dev server and cold starts, webpack-compatible plugin ecosystem |
| Language | TypeScript (strict mode) | No `any`; `noUnusedLocals`/`noUnusedParameters` enforced |
| Routing | [TanStack Router](https://tanstack.com/router) | Fully type-safe routes, file-based route generation, built-in search-param validation via Zod |
| Server state | [TanStack Query](https://tanstack.com/query) v5 | Caching, optimistic updates, and cache invalidation for all API-backed data |
| Client state | [Zustand](https://zustand.docs.pmnd.rs) | Minimal, hook-based stores for UI/session state (theme, sidebar, auth) — **no Redux** |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 | Utility-first, CSS-variable-driven dark mode via a custom `dark` variant |
| Forms & validation | React Hook Form + [Zod](https://zod.dev) | Schemas are the single source of truth for validation; error messages are i18n keys, resolved at render time |
| Icons | [Lucide React](https://lucide.dev) | Single icon set across the app |
| i18n | [react-i18next](https://react.i18next.com) | English/Portuguese, browser-language detection, `localStorage` persistence |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | `@vitest/coverage-v8` with a hard 100% threshold on statements/branches/functions/lines |
| CI/CD | GitHub Actions | Dependency audit + full coverage run on every push/PR to `main` and `develop` |

## Architecture

### Feature-based structure

```
src/
  components/   # Reusable, domain-agnostic UI (the app shell: layout, header, sidebar)
  hooks/        # Generic hooks shared across features (useDebounce, useMediaQuery, ...)
  lib/          # Infra: query client, i18n setup, framework-agnostic utilities
  features/     # Domain modules (auth, users). Each owns its components, hooks, schema, and API layer
  store/        # Global/cross-feature Zustand stores (theme, layout)
  routes/       # TanStack Router route definitions (thin — real logic lives in features/)
```

Dependency direction is enforced by convention: `components/` and `hooks/` never import from `features/`; `features/` may import from `components/`, `hooks/`, `lib/`, and `store/`. The one documented exception is `features/auth/store`, treated as global session state because the app shell (header, sidebar, route guards) depends on it.

### State separation

- **Server state** (anything from an API) lives exclusively in TanStack Query — no manual copies into Zustand or component state.
- **Client state** (sidebar open/closed, theme, session) lives in Zustand, split into small, scoped stores rather than one monolithic store.
- Optimistic updates go through TanStack Query's cache APIs (`setQueriesData` / `getQueriesData`) with rollback on error, not through ad-hoc state syncing.

### Multi-tenant model

Every `User` record carries a `tenantId`, and the mock API's `createUser` assigns new users to the current tenant — the data model, filtering, and the users table are all built around tenant-scoped records from day one, so wiring in a real tenant-aware backend later is a data-layer change, not a UI rewrite.

### Auth & route protection

Authentication is mocked (no password — this is a portfolio demo) via a Zustand store (`features/auth/store`) persisted to `localStorage`. Protected routes live under a pathless `_protected` layout route whose `beforeLoad` guard redirects unauthenticated visitors to `/login`; the layout (sidebar/header) is only rendered for authenticated routes, so `/login` itself never mounts the app shell.

## Accessibility (WCAG)

Accessibility was audited and fixed as a first-class requirement, not an afterthought:

- **Semantic structure**: landmark elements (`header`, `nav`, `main`), a "skip to main content" link, and a fully-labeled data table (`scope`, `role="columnheader"/"rowheader"/"cell"`) that keeps its semantics even in the mobile card layout, where CSS alone would otherwise strip them.
- **Keyboard support**: full focus trap, `Escape`-to-close, and focus restoration in the create-user dialog; `Tab`-order-safe off-canvas sidebar (uses the native `inert` attribute so hidden mobile navigation can't be tabbed into).
- **Screen reader feedback**: `aria-live` regions for async states (loading/error/empty) and form validation errors; `aria-invalid`/`aria-describedby` wired to every validated field.
- **Color contrast**: dark mode was specifically re-checked with `axe-core` after implementation — an initial contrast regression (near-black text on a near-black input in dark mode) was caught this way and fixed.
- **Touch targets**: interactive controls meet the 44×44px minimum.
- **Continuous checking**: [`@axe-core/react`](https://github.com/dequelabs/axe-core-npm) runs automatically in development (excluded from the production bundle) and logs violations to the console as you work.

## Internationalization (i18n)

- English and Portuguese, powered by `react-i18next` + `i18next-browser-languagedetector`.
- Language resolution order: previously saved choice (`localStorage`) → browser language → English fallback. The resolved language is cached back to `localStorage` on every change, so a manual switch survives reloads.
- All user-facing strings — including Zod validation messages — are translation keys, not hardcoded text. Since Zod schemas are defined outside of React (no hook access), validation messages are stored as **keys** (e.g. `users.validation.invalidEmail`) and translated at render time in the component that displays them.
- Translation catalogs live in `src/lib/i18n/locales/{en,pt}.json`.

## Getting started

```bash
npm install       # install dependencies
npm run dev        # start the dev server at http://localhost:3000
npm run build       # production build
npm run preview      # preview the production build locally
```

## Testing

```bash
npm run test          # watch mode
npm run test:coverage  # single run with a coverage report; fails below 100%
```

The suite uses Vitest with `jsdom`, Testing Library, and `@testing-library/jest-dom`/`user-event`. External boundaries (TanStack Router, Zustand-backed stores where relevant, `react-i18next`) are mocked per test file so each unit is verified in isolation. Coverage thresholds (`statements`, `branches`, `functions`, `lines`) are set to 100% in `vitest.config.ts` and enforced in CI; bootstrap/config files that add no testable logic (entrypoint, router wiring, route definitions, build configs) are explicitly excluded rather than silently inflating the number.

## CI/CD

Every push and pull request to `main` or `develop` runs [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

1. Checkout
2. Setup Node.js (with npm cache)
3. `npm ci`
4. `npm audit --audit-level=high` — fails the build on any high/critical severity vulnerability
5. `npm run test:coverage` — fails the build if coverage drops below 100% on any metric
