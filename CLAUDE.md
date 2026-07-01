# CLAUDE.md

Regras de arquitetura para a Vela UI (SPA corporativa). Este documento é a fonte de verdade para decisões estruturais do frontend — siga-o antes de propor abstrações alternativas.

## Stack

- **Build**: Rsbuild (Rspack) + TypeScript
- **Estilização**: Tailwind CSS (v4, config via `postcss.config.mjs`, sem `tailwind.config.js` para tokens simples)
- **Server state**: TanStack Query v5
- **Client state**: Zustand
- **Formulários**: React Hook Form + Zod (via `@hookform/resolvers` quando integrado)
- **Ícones**: Lucide React

## Regra de ouro: separação de estado

- **Zero Redux.** Não introduza Redux, Redux Toolkit, MobX ou libs equivalentes. Os dois únicos mecanismos de estado global são Zustand (cliente) e TanStack Query (servidor).
- **Server state pertence ao TanStack Query.** Qualquer dado que venha de uma API (listagens, detalhes, mutações) deve ser modelado com `useQuery`/`useMutation`, nunca copiado para um store Zustand ou `useState` global. Isso evita duplicação de cache e estados desatualizados.
- **Client state pertence ao Zustand.** Estado de UI (modais abertos, filtros locais, tema, wizard steps, seleção de linhas) vive em stores Zustand, criados por escopo/feature — evite um único store monolítico global.
- Não sincronize manualmente Zustand com TanStack Query. Se um dado precisa ser "servido" e "editável localmente" ao mesmo tempo, prefira o cache do TanStack Query com `setQueryData`/optimistic updates em vez de espelhar em outro store.

## Performance

- Toda `feature` roteável deve ser carregada via `React.lazy` + `Suspense` (code-splitting por rota).
- Componentes de lista grande devem usar `key` estável e evitar recriar funções/objetos inline em props quando isso quebrar memoization (`useCallback`/`useMemo` de forma criteriosa, não por padrão).
- Seletores do Zustand devem ser granulares (`useStore((s) => s.campo)`), nunca `useStore((s) => s)`, para não causar re-renders em cascata.
- Configure `staleTime`/`gcTime` no `QueryClient` (`src/lib/query-client.ts`) por query quando o dado não muda a cada request; evite refetch agressivo sem necessidade.
- Prefira componentes de servidor de dados "burros" (recebem props) e mantenha lógica de fetch/mutação nos hooks de `features/*`, não em componentes de apresentação.

## Formulários

- Todo formulário usa `react-hook-form` com schema de validação `zod`, resolvido via `zodResolver`.
- Schemas Zod ficam em `lib/schemas` ou junto da feature (`features/<feature>/schema.ts`) e são a fonte única de verdade de validação — não duplique regras de validação manualmente.

## Estrutura de pastas (`/src`)

```
src/
  components/   # Componentes de UI reutilizáveis e agnósticos de domínio (design system interno)
  hooks/        # Hooks genéricos reutilizáveis entre features (ex: useDebounce, useMediaQuery)
  lib/          # Infra e utilidades: query-client, api client, schemas globais, helpers puros
  features/     # Módulos de domínio (ex: features/invoices, features/users). Cada feature agrupa
                # seus próprios componentes, hooks, stores Zustand, queries/mutations e schemas Zod.
  store/        # Stores Zustand de escopo global/cross-feature (ex: sessão, tema, layout)
  styles/       # Entry point do Tailwind (globals.css) e estilos globais mínimos
```

- Regra de dependência: `components` e `hooks` não podem importar de `features`. `features` pode importar de `components`, `hooks`, `lib` e `store`.
- Prefira criar um store/hook dentro da própria `feature` quando o estado não é compartilhado; só promova para `store/` ou `hooks/` quando houver reuso real (não especulativo).
- **Exceção documentada:** `features/auth/store/auth-store.ts` é tratado como estado global/cross-cutting (equivalente a algo em `store/`), pois o shell da aplicação (`AppLayout`, `Header`, `Sidebar`, guards de rota) depende dele para saber quem está logado. Componentes de layout podem importar esse store diretamente, mesmo estando fisicamente sob `features/`. Não replique esse padrão para stores de outras features sem justificativa equivalente (dependência real do shell da aplicação).

## Convenções gerais

- TypeScript em modo estrito — evite `any`; prefira `unknown` + narrowing ou tipos inferidos do Zod (`z.infer<typeof schema>`).
- Sem CSS-in-JS e sem arquivos `.css` por componente — estilização via classes utilitárias do Tailwind.
- Ícones sempre via `lucide-react`, não misture com outras libs de ícones.

## Comandos

- `npm run dev` — inicia o servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview local do build de produção
