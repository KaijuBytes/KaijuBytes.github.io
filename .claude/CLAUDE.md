# KaijuBytes Portfolio Site

Static portfolio site for Orlando G. Martinez (Lanz) / KaijuBytes. Deployed to GitHub Pages at https://kaijubytes.github.io.

Copyright header on source files: `Orlando G. Martinez (Lanz) / KaijuBytes`.

## Stack (pinned — see package.json)

- **Astro 6** (`astro@^6.1.6`) — static-first; `output` is static (default).
- **React 19** (`react@^19.2.5`, `@astrojs/react@^5`) — islands only, for interactivity.
- **Tailwind CSS 4** (`tailwindcss@^4`) via `@tailwindcss/vite` (NOT the old `@astrojs/tailwind` integration — config is in `astro.config.mjs` vite plugins).
- **Node ≥ 22.12** (CI uses Node 22).
- Demo libs: `tesseract.js` (OCR demo), `@dnd-kit/*` (drag-drop), `framer-motion` (animation).
- TypeScript: `astro/tsconfigs/strict`, JSX via `react-jsx`.

## Layout

- `src/pages/` — routes. Includes `blog/`, `demos/`, `aninaya/` (the Aninaya app landing).
- `src/components/` — Astro/React components; `components/demos/` holds the interactive demos (OCR via tesseract.js, dnd-kit boards, framer-motion). These are the heaviest/most fragile components — touch with care.
- `src/content/blog/` and `src/content/projects/` — content collections. NOTE: no `src/content.config.ts` / `config.ts` is present yet; if you add collection entries, define the collection schema first (Astro 6 requires it) or `astro check` will flag it.
- `src/layouts/`, `src/styles/` — shared layout + global CSS (CSS variables, `.dark` class theming).
- `public/images/` — static images.

## Rules

- Astro pages for static content; React components only when interactivity is genuinely needed.
- Tailwind utility classes only — no custom CSS framework. Theme via CSS variables + `.dark` class.
- No emoji in content. External links: `target="_blank" rel="noopener"`.
- Blog posts as markdown in `src/content/blog/`; projects in `src/content/projects/`.
- This is a **user page** (`username.github.io`), so it serves from the domain root — `base` is `/`. Do NOT add a project-page base path; absolute `/...` asset links are correct.

## Verify before done (Claude checks its own work)

There is now a real verification path — use it before declaring a change done:

- `npm run check` — `astro check` (type + content-collection errors). This runs in CI (deploy.yml + ci.yml) and **gates deploy**.
- `npm run lint` — `astro check && tsc --noEmit` (stricter).
- `npm run build` — full static build; catches anything check misses.
- `npm run dev` / `npm run preview` — run locally to eyeball.

Requires devDeps `@astrojs/check` + `typescript` (in package.json) — run `npm install` once after pulling.

## Deploy

`.github/workflows/deploy.yml` on push to `main`: `npm ci` → `npm run check` → `npm run build` → upload → GitHub Pages. `ci.yml` runs check+build on PRs. A red check now blocks a broken deploy.
