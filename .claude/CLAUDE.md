# Vela UI - System Context & AI Agent Rules

## 🎯 Project Objective
Vela is a **multi-tenant SaaS platform** built as a portfolio piece whose explicit audience is recruiters and technical evaluators. This repo is the front-end: its job is to make the multi-tenancy story *visible* — RBAC-driven dashboards (a `VELA_ADMIN` sees the whole platform, a tenant `ADMIN`/`MEMBER` only their company), white-label theming per tenant, and defensive UX around destructive operations. The backend is the sibling repo **vela-core** (Fastify + Prisma, deployed on Render); this app deploys on Vercel at https://vela-ui-scapps.vercel.app.

## 🌍 Language & Localization
- **STRICT RULE:** The entire codebase MUST be written in English - components, variables, comments, documentation, commit messages.
- User-facing copy is translated (pt/en) via `react-i18next`; translation keys live in `src/lib/i18n/`. Codebase language and UI language are independent axes. Components render raw keys in unit tests (i18n is not initialized there) - tests assert on keys like `'tenants.form.title'` on purpose.

## 🛠️ Tech Stack
- **React 19 + Rsbuild** (Rspack; not Vite, not Next - there is no server side to this app).
- **Routing:** TanStack Router with file-based routes in `src/routes/` (`src/routeTree.gen.ts` is generated - never edit it, never lint it). Auth guards live in `beforeLoad` and use `throw redirect(...)` - that's the framework contract, and the eslint config disables `only-throw-error` for `src/routes/**` because of it.
- **Server state:** TanStack Query v5. **Client state:** Zustand (no Redux). **Forms:** React Hook Form + Zod resolvers.
- **Styling:** Tailwind CSS v4 + shadcn/ui primitives (`src/components/ui/`) plus hand-built components where shadcn has no catalog piece.
- **Testing:** Vitest + Testing Library, **100% coverage threshold enforced in `vitest.config.ts`** - a new branch without a test fails CI, so write the test in the same change, not after.

## 🏗️ Architecture & Conventions
- **Feature-sliced structure:** `src/features/<domain>/{api,components,hooks,store}` (auth, dashboard, tenants, users). Cross-cutting UI lives in `src/components/`, shared hooks in `src/hooks/`, infra in `src/lib/`.
- **API access only through feature `api/` modules** using the shared Axios instance (`src/lib/api.ts`, `withCredentials: true` - auth is an httpOnly cookie, never a token in localStorage). Components never call axios directly; they use TanStack Query hooks from the feature's `hooks/`.
- **RBAC in the UI is presentational, never authoritative:** roles gate what renders (e.g. "Create Tenant" only for `VELA_ADMIN`) and route guards redirect early, but the real enforcement is vela-core's query-level scoping. Never treat a hidden button as a security boundary.
- **The `scope` discriminant:** `GET /metrics/dashboard` returns `scope: 'GLOBAL' | 'TENANT'` and the dashboard switches on it. That literal is a cross-repo contract with vela-core, as is the `TENANT_HAS_USERS` error code that drives the double-confirmation cascade-delete dialog. Changing either means changing both repos in the same milestone.
- **White-label theming:** a tenant's `primaryColor` is applied at runtime via CSS custom properties (see `use-tenant-branding`); `GET /tenants/:slug` is public exactly so branding can render before login.
- **Dialogs:** backdrop click closes via an `event.target === event.currentTarget` check on the `role="presentation"` overlay (no stopPropagation on the panel), Escape closes via a document keydown listener, and focus returns to the previously focused element. Reuse `ConfirmDialog` / follow the existing dialog components rather than inventing a new pattern.
- **Responsive tables** (`UsersTable`, `TenantsTable`) declare explicit ARIA table roles because the mobile card layout (`display: block`) strips native table semantics - the file-level eslint-disable comments there explain this; don't "clean them up".

## 🧪 Quality Gates
- `npm run lint` (eslint flat config: typescript-eslint typeChecked + react-hooks + jsx-a11y) and `npm run typecheck` must pass with zero errors; CI enforces both plus the build (`ci.yml`).
- `security.yml` runs `npm audit --audit-level=high` + a secretlint sweep (weekly cron too); locally husky + lint-staged run secretlint on every commit - never bypass with `--no-verify`.
- `tests.yml` runs the suite with coverage; the 100% threshold makes it a gate, not a report. Codecov gets the lcov upload.
- Accessibility is a feature here (axe-core in dev, ARIA-complete tables, focus management) - new UI must keep `jsx-a11y` clean without blanket disables.

## 🌿 Version Control & Git Strategy
- **Branching:** Gitflow - `main` (production, auto-deployed by Vercel), `develop` (integration), `feature/*` / `bugfix/*` / `chore/*` off `develop`.
- **Conventional Commits, in English, always** (`feat(ui):`, `fix(ui):`, `chore(ui):`, `docs:`, `test:`). Each PR is one atomic change, squash-merged with a clean final message.
- **AI Git Execution:** when asked to commit, branch off first (never commit directly to `main`), and craft the Semantic Commit message for the eventual squash-merge.

## 🤖 AI Assistant Directives
1. **Always read this file** when starting a session, creating features, or answering architectural questions here.
2. **Do not ask for interactive inputs** - use non-interactive flags.
3. **`swagger.json` at the repo root** is a checked-in snapshot of vela-core's OpenAPI spec, kept for reference while building API integrations - refresh it from the API's `GET /docs/json` when endpoints change, don't hand-edit it.
4. **Demo data and copy are recruiter-visible** - keep seeds, fixtures and UI copy professional; pt/en translations must both be added for any new user-facing string.
