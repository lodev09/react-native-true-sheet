# vaul (vendored fork)

This directory contains a vendored copy of [vaul](https://github.com/emilkowalski/vaul) by Emil Kowalski, forked at `v1.1.2`.

## Why vendored

Upstream vaul is unmaintained. TrueSheet's web renderer needs targeted fixes and customization (snap-point overlay interpolation, detent semantics, etc.) that aren't viable through the published package. Vendoring gives us direct control without fork/publish overhead.

## What's in here

The original vaul source files, unmodified on initial import:

- `index.tsx` — `Drawer.Root` / `Content` / `Overlay` / `Handle` / `Portal` etc.
- `use-snap-points.ts` — snap-point math and overlay fade
- `use-position-fixed.ts`, `use-prevent-scroll.ts`, `use-scale-background.ts`
- `use-controllable-state.ts`, `use-composed-refs.ts`
- `context.ts`, `helpers.ts`, `constants.ts`, `browser.ts`, `types.ts`
- `style.css`

Only external runtime dep: `@radix-ui/react-dialog` (declared as an optional peer on the root `package.json`).

## Local tweaks to upstream

Minimal diffs applied on vendoring so the source passes truesheet's strict TypeScript config:

- Type-only `import type` for `AnyFunction` / `DrawerDirection` (required by `verbatimModuleSyntax`).
- `RefObject<HTMLDivElement | null>` instead of `RefObject<HTMLDivElement>` (React 19 ref type change).
- Guarded `e.changedTouches[0]?.pageY` accesses (required by `noUncheckedIndexedAccess`).
- Early return when `snapPoints[currentSnapIndex + 1]` is undefined.
- Dropped an unused `reset` import.
- `// @ts-nocheck` at the top of `use-snap-points.ts` and `use-scale-background.ts` — both files have many `noUncheckedIndexedAccess` / `noImplicitReturns` hits that aren't worth guarding individually.

The directory is also listed in `.prettierignore` and `eslint.config.mjs` ignores so we don't reformat vendored code.

## License

vaul is MIT-licensed. See the [upstream LICENSE](https://github.com/emilkowalski/vaul/blob/main/LICENSE.md). The original copyright notice remains with Emil Kowalski.
