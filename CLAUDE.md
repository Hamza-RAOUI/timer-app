# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

**Flowglass** is a focus timer with an **RPG progression layer**, built with
**Expo + Expo Router + React Native**, running on **iOS, Android, and web** from one
codebase. It is a **single-window app**: a left **sidebar** (or a slide-in drawer on
phones) plus one active view (Timer / Character / Statistics / Settings). The hero
visual is an **hourglass** (`src/components/Hourglass.tsx`) that drains as a session
runs and **flips** when it completes. Light + dark themes, game-style UI (slanted
panels, heavy caps, ghost words).

Pick a **technique** (Pomodoro, 52/17, Custom, Flowtime, Stopwatch) and a **skill**
(the category pills: Study, Work, Hobby, Personal, + custom on Pro). Every session is
logged as an event; XP, levels, skill levels, streaks and quests are derived from that
log.

## Commands

```bash
npm install                       # install deps
npx expo start                    # dev server (press i / a / w)
npm run web                       # web — best place to see the sidebar
npm test                          # RPG engine unit tests (node:test, no deps)
npx tsc --noEmit                  # typecheck (run before declaring done)
npx expo export --platform web    # validate the bundle + static render end-to-end
npx expo prebuild                 # generate native projects (needed for the widget)
```

**Validation = `npm test` + `tsc --noEmit` + a web export.** All must pass.
Dev-only testing aid: `http://localhost:8081/?devspeed=60` runs timers 60× faster
(also a switch in Settings → Developer, with a local "Pro" toggle).

## Architecture

- **Routing** (`app/`): Expo Router, `web.output: "static"`. The `(tabs)` group is a
  plain `Stack`; `app/(tabs)/index.tsx` renders `<AppShell />`. The other `(tabs)`
  routes are **`<Redirect>` shims** for widget deep links. SEO pages
  (`pomodoro-timer`, …) use `SeoArticle`; legal pages (`privacy`, `terms`, `refunds`,
  `cookies`, `legal`) use `LegalPage` with copy in `src/content/legal.ts` and business
  details in `src/constants/legal.ts`.
- **Shell** (`src/components/AppShell.tsx`): `width >= 900` → sidebar, else top bar +
  drawer. The **TimerView stays mounted (hidden)** on other views so a running session
  is still logged. Hosts the overlays (level-up, toasts, Pro sheet, consent banner)
  and the web keyboard shortcuts.
- **RPG engine** (`src/lib/rpg/`): pure TS, no React. `config.ts` holds every number
  (XP rules, daily cap, level curve, titles, quest pool). `computeProgress(log, opts)`
  derives everything; `buildReward(before, after, session)` drives the feedback.
  Tests in `src/lib/rpg/__tests__/` run on Node's built-in runner via
  `scripts/ts-resolve.mjs` — use `import type` for type-only imports there.
- **Game glue** (`src/lib/game.ts`): `useProgress()` (memoized) and
  `recordSession(input, { flip })` — logs, diffs, plays feedback, tracks analytics.
  Always log sessions through `recordSession`, never `statsStore.logSession` directly.
- **State** (`src/stores/`, Zustand + AsyncStorage):
  - `statsStore` — the session log (`SessionEvent[]`, key `@flowglass/sessions/v2`,
    migrates v1 `@cadence/stats/v1`) + range helpers.
  - `settingsStore` — prefs, theme mode, Pro (`isPro`, `proSince`), skills, sand theme,
    analytics consent.
  - `uiStore` — view, drawer, Pro sheet, `today` (midnight rollover), dev speed.
  - `rewardStore` — XP panel, level-up modal, toasts. Ephemeral.
  - `countdownStore`, `stopwatchStore` — ticking engines (track `startedAt` for logs).
- **Domain constants** (`src/constants/focus.ts`): `CATEGORIES` (built-in skills),
  `TECHNIQUES`, `SAND_THEMES`, swatches. `appConfig.ts`: feature flags + Pro product.
- **Theme** (`src/theme/`): `ThemeProvider` + `useTheme()` + `makeStyles()`. Palettes
  in `colors.ts` (`lightColors` / `darkColors`, AA-checked). Fonts: Inter, `display` =
  Inter Black for game headings; `SLANT`/`UNSLANT` + `hardTextShadow` for the look.
- **Game UI** (`src/components/game/`, `art/`, `feedback/`): SkewTag, XpBar,
  SectionHeader, QuestRow, GhostWord, StripeField; original SVG art (RankEmblem,
  SkillCrest, SandScene); `Critter` — the evolving creature (4 families × 5 stages,
  Grain → Pebble → Rock → Monolith → Timekeeper), shown by `EvolutionPanel` behind the
  timer and in the Character hero; `FlowglassMark` — the logo (keep `public/favicon.svg` in sync);
  RewardPanel, LevelUpOverlay, ToastStack, ProSheet,
  ConsentBanner.
- **Analytics** (`src/lib/analytics.ts`): Vercel Web Analytics, web only, cookieless.
  Only `session_completed`, `level_up`, `quest_completed`, `pro_interest_clicked`.
  Never send free text (custom skill names). Consent model: `FEATURES.analyticsOptIn`.
- **Accounts / sync** (`src/lib/cloud.ts`, `src/lib/supabase.ts`): optional Supabase
  account (email code, no password). Off unless `EXPO_PUBLIC_SUPABASE_URL` +
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (`.env.example`). Sessions sync as immutable
  events merged by id (`statsStore.mergeSessions`); settings as one JSON doc, last
  write wins (`SYNCED_KEYS` — Pro and analytics consent stay local). Schema + RLS in
  `supabase/migrations/`. UI state in `accountStore`. The client is created lazily —
  never at import (the static render has no storage).
- **Pro** (`src/lib/purchases.ts`): $1.99/month subscription, RevenueCat entitlement `pro`,
  stubbed behind `FEATURES.payments` (off → "Founding Pro" fake door everywhere).
- **Widget** (`widget/`): native home-screen widget injected at `expo prebuild` by
  `widget/plugin/withTempoWidget.js`. JS↔native sync is `src/widget/widgetBridge.ts`.

## Conventions

- TypeScript strict. Path alias `@/*` → project root (e.g. `@/src/theme/colors`).
- Use markdown `[text](path)` links when referencing files in chat, not backticks.
- **Styles are themed**: `const useStyles = makeStyles((t) => ({ … t.colors.surface … }))`
  then `const styles = useStyles()`; inline colors via `useTheme()`. Don't import the
  static `colors` in components — it ignores dark mode.
- Colored text uses a swatch's `.text` (contrast-safe), never its `.fill`.
- Match the surrounding style: functional components, small presentational
  subcomponents in the same file.
- Platform guards: haptics, analytics and the widget bridge **no-op where they don't
  apply** (web/native) — keep it that way. Respect `useReducedMotionPref()` in animations.

## Gotchas (read before editing stores or views)

- **Zustand v5 selector loop (caused a real crash here).** A selector that returns a
  **new object/array every call** makes `useSyncExternalStore` think state changed on
  every render → "Maximum update depth exceeded". Never do
  `useStatsStore(s => s.minutesBySkill(range))`. Instead subscribe to the stable
  array and derive with `useMemo`:
  ```ts
  const sessions = useStatsStore((s) => s.sessions);
  const bySkill = useMemo(() => useStatsStore.getState().minutesBySkill(range), [sessions, range]);
  ```
  Number/boolean/function selectors are fine.
- **Don't persist before hydrating.** Deep-link params run before the stores load;
  `settingsStore`/`statsStore` queue early changes and merge them in `hydrate()`.
  Keep that pattern for new persisted state.
- **Static web render** has no window: first paint is light + narrow, then the client
  switches (`ThemeProvider` waits for mount to avoid hydration mismatches; `+html.tsx`
  hides the page for dark visitors until `data-ready`).
- **Typed routes**: `.expo/types/router.d.ts` regenerates when the dev server starts —
  new routes fail `tsc` until then.
- **Reanimated**: the babel plugin ships inside `babel-preset-expo` (Expo SDK 55) —
  don't add it again. `useAnimatedStyle`/`useSharedValue` callbacks are auto-worklets.
- **react-native-purchases is not installed**; see the go-live steps in
  `src/lib/purchases.ts`. Vercel custom events need a Vercel plan that supports them.
- **Creatures are original vector art** (`src/components/art/Critter.tsx`); evolution rules
  live in `src/lib/rpg/evolution.ts` (thresholds in `config.ts`). Never add characters,
  faces or catchphrases from existing anime/games/celebrities — the app sells Pro, so it's
  a takedown risk (the Rock easter egg uses original jokes only). Painted-art prompts:
  `docs/art-prompts.md`. Dev: Settings → Developer → Preview level shows any stage.
- **Sound** (`src/lib/sound.ts`), web only; native no-ops. Cues are synthesized tones;
  ambience plays `public/audio/<key>.mp3` (Pixabay, sources in `public/audio/CREDITS.md`,
  built by `node scripts/prepare-audio.mjs <downloads>`). Missing files are simply not
  offered. Ambience must start from a user gesture (browser autoplay rules).
- **New persisted setting?** Add it to `DEFAULTS` in `settingsStore` — it syncs to
  the account automatically unless you add it to `LOCAL_ONLY`. Changing a session's
  shape needs a migration on both the local log and `focus_sessions.event`.
- The native **widget still shows the old "TEMPO" dark branding** — it works via the
  redirect shims but hasn't been reskinned.

## Naming

The app is named **Flowglass** (flow + hourglass). The name lives in three places:
`app.json` (`name`), `src/components/Sidebar.tsx` (wordmark), and
`src/components/views/SettingsView.tsx` (About). Change all three together.
