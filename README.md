# Vela SaaS - Multi-tenant Architecture Portfolio

### 🚀 [**Live Production Demo →**](https://vela-ui-drab.vercel.app)

[![CI](https://github.com/samuelcsantana/vela-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/samuelcsantana/vela-ui/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/samuelcsantana/vela-ui/branch/main/graph/badge.svg)](https://codecov.io/gh/samuelcsantana/vela-ui)
[![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-0-brightgreen)](https://github.com/samuelcsantana/vela-ui/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](./tsconfig.json)

A multi-tenant SaaS front-end ecosystem demonstrating advanced multi-tenant architecture patterns, cloud-security-conscious auth, and defensive UX — backed by a 100%-coverage automated test suite and a CI pipeline that enforces both, deployed to production on Vercel.

## Tech Stack

| Layer | Choice |
|---|---|
| UI library | React 19 |
| Build tool | [Rsbuild](https://rsbuild.rs) (Rspack) — a Vite-alternative, Rust-based bundler |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Components | [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives) + a small hand-built design system for pieces outside its catalog |
| Charts | [Recharts](https://recharts.org) |
| Routing | [TanStack Router](https://tanstack.com/router) |
| Server state | [TanStack Query](https://tanstack.com/query) v5 |
| Client state | [Zustand](https://zustand.docs.pmnd.rs) — **no Redux** |
| Forms & validation | React Hook Form + [Zod](https://zod.dev) |
| Icons | [Lucide React](https://lucide.dev) |
| i18n | [react-i18next](https://react.i18next.com) |
| Testing | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com), 100% coverage threshold |
| CI/CD | GitHub Actions + [Codecov](https://codecov.io) |
| Hosting | [Vercel](https://vercel.com) |

## Highlighted features

- **Dynamic RBAC dashboard** — KPI cards and charts are driven by the caller's role: a `VELA_ADMIN` (platform root) sees system-wide metrics across every tenant (total companies, global user distribution, recent signups), while a tenant `ADMIN`/`MEMBER` only ever sees data scoped to their own company. The same principle gates which actions are even visible — e.g. "Create Tenant" and "Delete Tenant" only render for `VELA_ADMIN`.
- **Defensive UX for destructive operations** — deleting a tenant that still has active users doesn't fail silently or with a raw error: the API's `409 TENANT_HAS_USERS` response is caught and escalated to a second "double confirmation" cascade-delete dialog, so an admin can never accidentally wipe out a company's users as a side effect of deleting the company.
- **Protected API integration** — httpOnly-cookie-based session auth (no tokens in `localStorage`), Axios configured with `withCredentials`, and route guards (`beforeLoad`) that redirect unauthorized roles before a protected view ever renders.
- **White-label theming** — each tenant's primary brand color is applied at runtime via CSS custom properties, with a live color-swatch-and-hex-input editor in the tenant form.

## Architecture

### Feature-based structure

```
src/
  components/   # Reusable, domain-agnostic UI (design system + app shell: layout, header, sidebar)
  components/ui/# shadcn/ui primitives (Radix-based)
  hooks/        # Generic hooks shared across features (useDebounce, useMediaQuery, ...)
  lib/          # Infra: query client, i18n setup, framework-agnostic utilities
  features/     # Domain modules (auth, tenants, users, dashboard). Each owns its components, hooks, schema, and API layer
  store/        # Global/cross-feature Zustand stores (theme, layout)
  routes/       # TanStack Router route definitions (thin — real logic lives in features/)
```

Dependency direction is enforced by convention: `components/` and `hooks/` never import from `features/`; `features/` may import from `components/`, `hooks/`, `lib/`, and `store/`. The one documented exception is `features/auth/store`, treated as global session state because the app shell (header, sidebar, route guards) depends on it.

### State separation

- **Server state** (anything from an API) lives exclusively in TanStack Query — no manual copies into Zustand or component state.
- **Client state** (sidebar open/closed, theme, session) lives in Zustand, split into small, scoped stores rather than one monolithic store.
- Optimistic/instant updates go through TanStack Query's cache APIs (`setQueryData`) with invalidation on settle, not through ad-hoc state syncing.

### Multi-tenant & RBAC model

Every `User` and `Tenant` record is scoped by `tenantId`, and the API itself enforces the boundary (a tenant `ADMIN` can never read or write another tenant's data, even by guessing an ID). The frontend mirrors this with three roles:

| Role | Scope |
|---|---|
| `VELA_ADMIN` | Platform root — every tenant, every user, global metrics, tenant lifecycle (create/delete) |
| `ADMIN` | Their own tenant only — manage that tenant's users |
| `MEMBER` | Their own tenant, read-scoped |

### Auth & route protection

Authentication is cookie-based (httpOnly, set by the backend on login) via an Axios instance configured with `withCredentials: true` — no JWTs are ever stored in `localStorage`. Protected routes live under a pathless `_protected` layout route whose `beforeLoad` guard redirects unauthenticated visitors to `/login` and role-ineligible visitors back to the dashboard; the layout (sidebar/header) is only rendered for authenticated routes.

## Accessibility (WCAG)

- **Semantic structure**: landmark elements (`header`, `nav`, `main`), a "skip to main content" link, and fully-labeled data tables (`scope`, `role="columnheader"/"rowheader"/"cell"`) that keep their semantics even in the mobile card layout.
- **Keyboard support**: full focus trap, `Escape`-to-close, and focus restoration in every dialog; `Tab`-order-safe off-canvas sidebar (uses the native `inert` attribute).
- **Screen reader feedback**: `aria-live` regions for async states (loading/error/empty) and form validation errors; `aria-invalid`/`aria-describedby` wired to every validated field.
- **Continuous checking**: [`@axe-core/react`](https://github.com/dequelabs/axe-core-npm) runs automatically in development and logs violations to the console as you work.

## Internationalization (i18n)

- English and Portuguese, powered by `react-i18next` + `i18next-browser-languagedetector`.
- Language resolution order: previously saved choice (`localStorage`) → browser language → English fallback.
- All user-facing strings — including Zod validation messages and formatted dates — follow the active language; nothing is hardcoded to one locale.

## Getting started

```bash
git clone git@github.com:samuelcsantana/vela-ui.git
cd vela-ui
npm install
```

Copy the example environment file and point it at your backend API:

```bash
cp .env.example .env
```

```env
# .env
VITE_API_URL="http://localhost:3333/api"
```

```bash
npm run dev       # start the dev server at http://localhost:3000
npm run build     # production build
npm run preview   # preview the production build locally
```

## Testing

```bash
npm run test           # watch mode
npm run test:coverage  # single run with a coverage report; fails below 100%
```

The suite uses Vitest with `jsdom`, Testing Library, and `@testing-library/jest-dom`/`user-event`. External boundaries (TanStack Router, Zustand-backed stores, `react-i18next`, Recharts, Radix UI) are mocked per test file so each unit is verified in isolation. Coverage thresholds (`statements`, `branches`, `functions`, `lines`) are set to 100% in `vitest.config.ts` and enforced in CI.

### End-to-end (Playwright)

`npm run test:e2e` drives the real app in Chromium through the multi-tenant story end to end: route protection and role-based redirects, the RBAC-scoped dashboard (`VELA_ADMIN` sees `scope: GLOBAL` platform metrics, a `MEMBER` only their tenant's), the `TENANT_HAS_USERS` cascade-delete double confirmation, and white-label branding on `/$slug/login`. Every vela-core endpoint is mocked per-test via `page.route()` — the suite is deterministic and needs no backend or database, which is what lets it run in CI on every push (`tests.yml`'s `e2e` job).

## CI/CD

Every push and pull request to `main` or `develop` runs three workflows:

- **[`ci.yml`](./.github/workflows/ci.yml)** — lint (ESLint: typescript-eslint typeChecked + react-hooks + jsx-a11y), typecheck (`tsc --noEmit`) and production build.
- **[`security.yml`](./.github/workflows/security.yml)** — `npm audit --audit-level=high` plus a full secretlint sweep (also on a weekly cron, to catch new advisories against unchanged code). Locally, a husky pre-commit hook runs secretlint on every commit via lint-staged.
- **[`tests.yml`](./.github/workflows/tests.yml)** — `npm run test:coverage`, which fails if coverage drops below 100% on any metric, then uploads `coverage/lcov.info` to [Codecov](https://codecov.io/gh/samuelcsantana/vela-ui).

Production deploys are handled by Vercel on every push to `main`, with a `vercel.json` rewrite rule so client-side routes (TanStack Router) resolve correctly on refresh/deep-link instead of 404ing.

## License

Released under the [MIT License](./LICENSE).
