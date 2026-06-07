# Cadence

A calm, light focus-timer. One clean window with a **left sidebar** (total time
today, technique picker, category, navigation) and a big distraction-free timer.
Pick a **technique** (Pomodoro, 52/17, Custom, Flowtime, Stopwatch) and a
**category** (Study, Work, Hobby, Personal); every finished session is logged to
that category and rolls up into **Statistics** (Day/Week/Month/Year + per-category
breakdown). Runs on **iOS, Android, and web** from one codebase, plus a native
home-screen **widget**.

> The name *Cadence* is a placeholder — change it in `app.json` (`name`) and
> `src/components/Sidebar.tsx` / `views/SettingsView.tsx` whenever you decide.

## Run it

```bash
npm install                # first time only

npx expo start             # dev server — press i (iOS), a (Android), w (web)
npm run ios                # iOS simulator
npm run android            # Android emulator
npm run web                # web in the browser (best place to see the sidebar)
```

- **Expo Go** is enough to try it on a phone (scan the QR from `expo start`).
- **Web/desktop** shows the persistent left sidebar; **phones** show the timer with
  a slide-in drawer (tap the ☰ menu). The layout switches automatically at 900px.
- The **home-screen widget** needs a native dev build (not Expo Go):
  `npx expo prebuild` → `npx expo run:android` / `run:ios`. iOS needs a one-time
  Xcode target — see [widget/README.md](widget/README.md).

## How it's built

| Piece | File |
|---|---|
| Responsive shell (sidebar / drawer) | `src/components/AppShell.tsx`, `Sidebar.tsx` |
| Timer (technique-driven) | `src/components/views/TimerView.tsx` |
| Statistics (D/W/M/Y + categories) | `src/components/views/StatisticsView.tsx` |
| Settings | `src/components/views/SettingsView.tsx` |
| Techniques & categories | `src/constants/focus.ts` |
| State (Zustand + AsyncStorage) | `src/stores/` — `statsStore`, `settingsStore`, `uiStore` |

It's a **single window**: `app/(tabs)/index.tsx` renders the shell and the sidebar
swaps the active view. The other route files (`pomodoro`, `two`, `stopwatch`, …)
are thin redirects so widget deep links still resolve.

## What is `app/` vs `src/`?

### `app/` (Expo Router)
- `app/` is your **file-based routing** folder.
- Every `.tsx` file inside `app/` becomes a **screen/route**.
- Layout files like `app/_layout.tsx` and `app/(tabs)/_layout.tsx` define navigation structure.

In short: **`app/` = navigation + screens**.

### `src/` (Application code)
- `src/` holds the code that screens *use*:
  - `src/components/` reusable UI
  - `src/theme/` design tokens (colors/typography/etc)
  - `src/utils/` pure helpers (formatting, math)
  - `src/stores/` global state (Zustand stores)

In short: **`src/` = reusable building blocks**.

## Practical rule of thumb
- Keep `app/` **thin**: screens should mostly compose components and call stores.
- Put reusable logic/UI in `src/` so it can be shared across screens.

## Notes
- Path alias `@/*` maps to the project root (see `tsconfig.json`).
- You can import like `@/src/theme/colors` or `@/src/components/GlassCard`.
