@AGENTS.md

# Wilaya — BKPM Investment Explorer (prototype)

A clickable **pitch prototype** for "Wilaya", an investment-intelligence platform for
Indonesia's Investment Ministry / BKPM. It passed the competition's top 5; this repo
turns the original design mockups into a working demo. **No auth, no real backend** —
the goal is a prototype that genuinely works in the browser.

## Stack
- **Next.js 16** (App Router) + **React 19**, plain **JavaScript** (`.js` with JSX). No TypeScript.
- **Plain CSS** with design tokens (no Tailwind). Tokens live in `app/midfi-styles.css` + `app/map-styles.css`.
- **mapbox-gl v3** for the map. **DeepSeek** (OpenAI-compatible) for chat.

## Layout of the repo
- `app/` — routes: `/` (Landing), `/map` (Mapbox + chat sidebar), `/workspace` (chat thread). API: `app/api/chat/route.js` (DeepSeek proxy).
- `components/` — `shared.js` (DATA + primitives: Avatar, Logo, BKPM, TopBar, Cite, ArtifactCard), `MapboxMap.js`, `map-screens.js` (Landing, MapPage), `thread.js` (ActiveThread), `useChat.js` (chat hook).
- `content/` — **ARCHIVE of the original Babel-standalone mockups. Reference only. Do NOT edit, import, or ship from here.** New screens are *ported* out of it into `components/`.
- `public/assets/bkpm-logo.png` — BKPM mark (also the favicon source: `app/icon.png` / `favicon.ico`).

## Conventions (match the existing code)
- Components that use hooks / browser / mapbox start with `"use client"`.
- Reuse primitives from `components/shared.js`; don't re-copy Avatar/Logo/chip markup.
- When porting from `content/*.jsx`: remove `Object.assign(window, …)`, convert to `export`, add imports, fix asset paths (`assets/x.png` → `/assets/x.png`).
- Navigate with `next/link`. Keep the BKPM palette/typography — don't swap the design language.
- UI copy is English today; full ID/EN i18n is planned (issue #8).

## Chat / secrets (do not break)
- DeepSeek model: **`deepseek-v4-flash`** (the old `deepseek-chat` was retired). Default fallback is in `app/api/chat/route.js`; override via `DEEPSEEK_MODEL`.
- The API key is **server-side only** in `.env.local` (gitignored). **Never** read, print, commit, or move `.env.local`. Mapbox uses a public `pk.*` token in `NEXT_PUBLIC_MAPBOX_TOKEN`.
- `.env.example` documents the variables (no secrets) and may be committed.

## How to run
```bash
npm install      # first time
npm run dev      # http://localhost:3000
```
The user runs the dev server in their own terminal — **don't start a long-lived server in the agent shell.** To verify a change, build (`npm run build`) or briefly hit the route, then stop.

## Working an issue (READ THIS before starting one)
The roadmap is tracked as GitHub issues #1–#12 (`gh issue list`). Each session typically takes one issue. Per session:
1. **Branch** off `main` — never commit straight to `main`. Name it `issue-<n>-short-slug`.
2. Implement, following the conventions above and the issue's acceptance criteria.
3. **Verify it actually works** — run the app and exercise the feature (chat replies, map renders, nav works), not just "code written".
4. Open a **PR** that references the issue (`Closes #<n>`). Keep PRs small and focused; split oversized issues (e.g. #1, #11).
5. Don't change unrelated files; don't touch `content/` or `.env.local`.

### Foundation first (avoid rework / conflicts)
`#12` (DRY refactor) and `#11` (icon + base components) define shared structure that `#1`, `#4`, etc. build on. **Do not run issues that touch the same files (`components/`) in parallel** — serialize them, foundation issues first. `#9` (real BKPM data JSON) is a prerequisite for `#4` and `#7`.
