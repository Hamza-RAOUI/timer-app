# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

**Flowglass** is a calm, light focus-timer built with **Expo + Expo Router +
React Native**, running on **iOS, Android, and web** from one codebase. It is a
**single-window app**: a left **sidebar** (or a slide-in drawer on phones) plus one
active view (Timer / Statistics / Settings). The hero visual is an **hourglass**
(`src/components/Hourglass.tsx`) that drains as a countdown runs and refills each
new session.

Pick a **technique** (Pomodoro, 52/17, Custom, Flowtime, Stopwatch) and a
**category** (Study, Work, Hobby, Personal); each finished session is logged to that
category and rolls up in Statistics.

## Commands

```bash
npm install                       # install deps
npx expo start                    # dev server (press i / a / w)
npm run web                       # web — best place to see the sidebar
npx tsc --noEmit                  # typecheck (run before declaring done)
npx expo export --platform web    # validate the bundle compiles end-to-end
npx expo prebuild                 # generate native projects (needed for the widget)
```

There is no test runner or linter wired up. **Validation = `tsc --noEmit` + a web
export.** Both must pass.

## Architecture

- **Routing** (`app/`): Expo Router. The `(tabs)` group is **not** a tab navigator —
  it's a plain `Stack`. `app/(tabs)/index.tsx` renders `<AppShell />` (the whole UI).
  The other route files (`pomodoro`, `two`, `stopwatch`, `techniques`, `settings`)
  are **thin `<Redirect>` shims** that forward into the single window with params —
  they exist so the home-screen widget's deep links still resolve.
- **Shell** (`src/components/AppShell.tsx`): responsive. `width >= 900` → persistent
  sidebar; otherwise a top bar + animated drawer. Renders one view from `uiStore.view`.
- **Views** (`src/components/views/`): `TimerView`, `StatisticsView`, `SettingsView`.
  `TimerView` branches on the technique's `kind` (`countdown` | `flow` | `stopwatch`).
- **Primitives** (`src/components/`): `Card`, `Dropdown`, `Controls`, `ProgressDots`,
  `Sidebar`. Export via `src/components/index.ts`.
- **State** (`src/stores/`, Zustand + AsyncStorage):
  - `statsStore` — `sessions: Session[]`, `completeSession(minutes, category, technique)`,
    plus range helpers (`minutesInRange`, `minutesByCategory`, `series`, `streak`, …).
  - `settingsStore` — prefs + `lastTechnique` / `lastCategory` / `dailyGoalMinutes`.
  - `uiStore` — `view`, `drawerOpen`, `pendingStart` (deep-link auto-start). Ephemeral.
  - `countdownStore`, `stopwatchStore` — the actual ticking engines, shared by views.
- **Domain constants** (`src/constants/focus.ts`): `CATEGORIES` and `TECHNIQUES` are the
  single source of truth. Add a technique/category here, not in screens.
- **Theme** (`src/theme/`): light indigo/slate. Import tokens from `theme/colors`
  (`colors`, `shadow`) and `theme/typography` (`fonts`, `tabular`). **Inter** for all
  text; digits use `tabular` so they don't jiggle.
- **Widget** (`widget/`): native home-screen widget (Android `AppWidgetProvider` +
  iOS WidgetKit) injected at `expo prebuild` by `widget/plugin/withTempoWidget.js`.
  JS↔native sync is `src/widget/widgetBridge.ts`. See `widget/README.md`.

## Conventions

- TypeScript strict. Path alias `@/*` → project root (e.g. `@/src/theme/colors`).
- Use markdown `[text](path)` links when referencing files in chat, not backticks.
- Match the surrounding style: `StyleSheet.create`, functional components, small
  presentational subcomponents in the same file.
- Platform guards: haptics and the widget bridge **no-op on web** — keep it that way.

## Gotchas (read before editing stores or views)

- **Zustand v5 selector loop (caused a real crash here).** A selector that returns a
  **new object/array every call** makes `useSyncExternalStore` think state changed on
  every render → "Maximum update depth exceeded". Never do
  `useStatsStore(s => s.minutesByCategory(range))`. Instead subscribe to the stable
  array and derive with `useMemo`:
  ```ts
  const sessions = useStatsStore((s) => s.sessions);
  const byCat = useMemo(() => useStatsStore.getState().minutesByCategory(range), [sessions, range]);
  ```
  Number/boolean/function selectors are fine.
- **Reanimated**: the babel plugin ships inside `babel-preset-expo` (Expo SDK 55) —
  don't add it again. `useAnimatedStyle`/`useSharedValue` callbacks are auto-worklets.
- **react-native-purchases is a stub** (`src/lib/purchases.ts`) so the app bundles on
  web/Expo Go. There is no live billing; "Pro" just flips a local flag.
- The native **widget still shows the old "TEMPO" dark branding** — it works via the
  redirect shims but hasn't been reskinned to match the light theme.

## Naming

The app is named **Flowglass** (flow + hourglass). The name lives in three places:
`app.json` (`name`), `src/components/Sidebar.tsx` (wordmark), and
`src/components/views/SettingsView.tsx` (About). Change all three together.
