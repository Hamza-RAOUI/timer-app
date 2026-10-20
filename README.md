# Flowglass

A focus timer with an RPG twist. One clean window with a **left sidebar** (player
level, today, technique, skill, menu) and a big hourglass timer. Pick a **technique**
(Pomodoro, 52/17, Custom, Flowtime, Stopwatch) and a **skill** (Study, Work, Hobby,
Personal). Every session is logged; finishing one flips the hourglass and earns
**XP** — level up, grow each skill, keep a **streak** and clear the **daily quest**.
Light and dark themes. Runs on **iOS, Android, and web** from one codebase, plus a
native home-screen **widget**.

## Run it

```bash
npm install                # first time only

npx expo start             # dev server — press i (iOS), a (Android), w (web)
npm run web                # web in the browser (best place to see the sidebar)
npm test                   # RPG engine unit tests
npm run typecheck          # tsc --noEmit
npm run export:web         # production web build → dist/
```

Testing the XP loop quickly (dev builds only): open `http://localhost:8081/?devspeed=60`
— a 25-minute Pomodoro then takes 25 seconds. Settings → Developer also has a local
"Pro" switch.

## How it's built

| Piece | File |
|---|---|
| Responsive shell (sidebar / drawer, overlays, shortcuts) | `src/components/AppShell.tsx`, `Sidebar.tsx` |
| Timer (technique-driven, logs sessions) | `src/components/views/TimerView.tsx` |
| Character (level, quests, streak, skills, sand) | `src/components/views/CharacterView.tsx` |
| Statistics / Settings | `src/components/views/StatisticsView.tsx`, `SettingsView.tsx` |
| RPG rules (pure TS + tests) | `src/lib/rpg/` — all numbers in `config.ts` |
| Logging + feedback glue | `src/lib/game.ts` (`recordSession`, `useProgress`) |
| Theme (light/dark, `makeStyles`) | `src/theme/` |
| Techniques, skills, sand themes | `src/constants/focus.ts` |
| Feature flags, Pro product | `src/constants/appConfig.ts` |
| Analytics (4 events, consent) | `src/lib/analytics.ts` |
| Legal pages | `app/privacy.tsx` … + `src/content/legal.ts`, `src/constants/legal.ts` |
| State (Zustand + AsyncStorage) | `src/stores/` |
| Optional account + cloud sync (Supabase) | `src/lib/cloud.ts`, `src/lib/supabase.ts`, `supabase/migrations/` |

## Accounts & cloud sync (optional, Supabase free tier)

The app is local-first; accounts only add backup + sync of the session log and
settings. Without the env vars below, the Account section is hidden.

1. Create a free project at supabase.com (you do this — it's your account).
2. **SQL editor** → paste and run `supabase/migrations/0001_flowglass_sync.sql`
   (tables, row-level security, `delete_my_account()`).
3. **Authentication → Sign In / Providers → Email**: keep it on. In **Emails →
   Magic Link** add `{{ .Token }}` to the template so the email shows the 6-digit
   code (the link works too, on web). **URL Configuration**: add your site URL and
   `http://localhost:8081` to the redirect URLs.
4. Copy `.env.example` → `.env.local`, fill in Project URL + anon/publishable key
   (Project Settings → API), restart `npx expo start`. On Vercel add the same two
   variables under Settings → Environment Variables.
5. Before launch: the built-in mailer allows only a few emails per hour — set up
   custom SMTP (e.g. Resend's free tier) under Authentication → Emails → SMTP.

## Deploy the web app (Vercel)

`vercel.json` already sets the build (`npx expo export --platform web` → `dist/`),
clean URLs and the SPA fallback.

1. Fill in your business details in `src/constants/legal.ts` (name, contact email).
2. `npm test && npm run typecheck && npm run export:web` — all must pass.
3. `npm i -g vercel` then `vercel` (first time: link/create the project) and
   `vercel --prod`. Or push to a GitHub repo and import it in the Vercel dashboard.
4. In the Vercel project: **Analytics → Enable Web Analytics**. Custom events need a
   **Pro** plan; on Hobby set `FEATURES.analyticsEventsAsPageviews = true` so events
   show up as `/e/<event>` pages.
5. Point `www.flowglass.app` at the project (Settings → Domains).

## Notes
- Path alias `@/*` maps to the project root (see `tsconfig.json`).
- The home-screen **widget** needs a native dev build (not Expo Go):
  `npx expo prebuild` → `npx expo run:android` / `run:ios`. See [widget/README.md](widget/README.md).
