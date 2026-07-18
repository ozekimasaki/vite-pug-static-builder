# AGENTS.md

Guidance for coding agents working in the **vite-pug-static-builder** repository. Keep this file in sync with the actual code and configuration — do not document commands or features that do not exist.

## Project Overview

`vite-pug-static-builder` is a Vite plugin (published to npm) that builds multiple Pug files into static HTML and serves them with HMR during development. It supports Vite 6, 7, and 8. It is a **library/plugin**, not an application, so there is no `dev`/`preview`/`start` server of its own.

The default export returns an **array of two Vite plugins**: one that runs at `build` time and one that runs at `serve` (dev-server) time.

## Project Structure

```
src/
├── index.ts   # Default export; merges user settings and returns [build, serve] plugins
├── build.ts   # apply: 'build' plugin — resolveId maps .pug → .html, load compiles via pug.compileFile
├── serve.ts   # apply: 'serve' plugin — Connect middleware + hotUpdate hook for the dev server
├── pug.ts     # Dev-server Pug compilation + Vite module-graph dependency registration/invalidation
└── utils.ts   # outputLog helper built on Vite's createLogger and ansis
```

Other relevant files:

- `package.json` — scripts, dependencies, and package metadata (`type: module`, ESM only).
- `tsconfig.json` — strict TypeScript config; `rootDir: src`, `outDir: dist`, emits declarations.
- `vitest.config.ts` — Vitest config (node environment, v8 coverage with 80% thresholds, `@` → `src` alias).
- `.prototools` — pins the Node.js toolchain to `~22`.
- `pnpm-lock.yaml` — the project uses **pnpm** as its package manager.
- `README.md` / `README.ja.md` / `README.zh-CN.md` — user-facing docs (English is the primary; keep new docs in English).
- `.cursor/rules/global.mdc` — project-wide contributor rules (in Japanese).

## Entry Point

- Public entry: `src/index.ts` → default export `vitePluginPugStatic(userSettings?)`.
- Built output entry: `dist/index.js` (`main`), types at `dist/index.d.ts`. Only `dist` is published (`files` field).

## Setup

Use **pnpm** (a `pnpm-lock.yaml` is committed). The `.prototools` file pins Node to `~22`.

```bash
pnpm install
```

## Build / Test / Typecheck / Lint Commands

All of the following are defined in `package.json` and are the only real scripts:

```bash
pnpm build         # clean + tsc: emit dist/ (also: pnpm clean, pnpm tsc)
pnpm type-check    # tsc --noEmit -p . (use this as the typecheck gate)
pnpm test          # Vitest against Vite 8 (alias of pnpm test:vite8)
pnpm test:vite6    # Vitest against Vite 6
pnpm test:vite7    # Vitest against Vite 7
pnpm test:vite8    # Vitest against Vite 8
pnpm test:watch    # Vitest in watch mode
pnpm test:update   # Vitest, update snapshots
pnpm coverage      # Vitest with v8 coverage (Vite 8)
```

Notes:

- The `test:vite*` scripts select the Vite major version via the `VITE_MAJOR_VERSION` env var using `cross-env`.
- **There are currently no test files in the repo**, so the test commands exit with "No test files found" (exit code 1). Add tests as `*.test.ts` / `*.spec.ts` (Vitest's default include patterns; `tsconfig.json` excludes `__tests__`).
- **There is no linter or formatter** configured (no ESLint/Prettier/Biome, no `lint` script). Do not invent a lint command. `pnpm type-check` is the closest static-analysis gate.
- **There are no pre-commit hooks** (no Husky, no `.pre-commit-config.yaml`) and **no CI workflows** (`.github/` is absent).

Before committing changes, at minimum run `pnpm type-check` and `pnpm build` and make sure both succeed.

## Coding Conventions

- **Language:** TypeScript, ESM only (`"type": "module"`). Use `.js` extensions in relative import specifiers (e.g. `import { outputLog } from './utils.js'`) as the existing source does — required because `tsconfig.json` emits ESM and does not rewrite extensions.
- **Strictness:** `tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`, and more. Write code that passes these — e.g. use `import type` for type-only imports (`verbatimModuleSyntax`), and handle possibly-undefined indexed access.
- **Path alias:** `@/*` maps to `src/*` (configured in both `tsconfig.json` and `vitest.config.ts`).
- **Public API types:** exported settings interfaces (`BuildSettings`, `ServeSettings`, `Settings`) use `readonly` members; keep that style for new options.
- **Comments/JSDoc:** existing source uses Japanese JSDoc comments. Match the surrounding style of the file you edit; keep comments minimal and meaningful.
- **Logging:** use the `outputLog` helper from `src/utils.ts` (built on Vite's logger + `ansis`) rather than `console.*`.
- **Node built-ins:** import with the `node:` prefix (e.g. `import path from 'node:path'`) as existing code does.

## Vite Version Compatibility (important)

The plugin must keep working across Vite 6, 7, and 8. The dev-server code (`src/serve.ts`, `src/pug.ts`) relies on the Vite module graph and the `hotUpdate` hook / Environment API, which differ between major versions. When touching dev-server or module-graph logic, verify against all supported majors with `pnpm test:vite6`, `pnpm test:vite7`, and `pnpm test:vite8` (once tests exist) and avoid APIs unavailable in the lowest supported major.

## Scope & PR Guidance

- Keep changes minimal and focused; follow existing conventions.
- Do not change dependency/framework versions (Vite/Pug/TypeScript) without explicit approval — see `.cursor/rules/global.mdc`.
- The `dist/` directory is generated (git-ignored); never edit it by hand — rebuild with `pnpm build`.
- Do not commit `node_modules/`, `dist/`, or `coverage/` (all git-ignored).
