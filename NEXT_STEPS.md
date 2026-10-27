# Flowglass — where things stand (Oct 21, 2026)

## Done
- Everything is committed on branch `flowglass-rpg-sync` and pushed to GitHub.
- Supabase project `hwcjffmzzwdgvwanqpgh`: tables + row-level security, redirect URLs,
  Resend SMTP, the "Your Flowglass code" email template (code + link), 100 emails/hour.
- Keys: `.env.local` locally (not in git) and Vercel environment variables.
- Pro is $1.99/month (fake door until payments go live).

## Still to do
1. **Test sign-in** — Settings → Account & sync, use the email you signed up to Resend with
   (the `onboarding@resend.dev` sender only delivers there), enter the 6-digit code, finish a
   session, check rows in `focus_sessions` / `user_state`.
2. **Real emails for everyone** — verify your domain in Resend, then rerun
   `SENDER_EMAIL=no-reply@yourdomain node scripts/setup-supabase-email.mjs`.
3. **Delete the Supabase access token** (supabase.com/dashboard/account/tokens) — only needed
   for the setup script. Consider rotating the Resend key too (it was pasted in a chat).
4. **Merge `flowglass-rpg-sync` into `master`** (PR on GitHub) so Vercel deploys it to production.
5. **App icons** — the in-app logo and `public/favicon.svg` are the new Flowkeeper; the PNG app
   icons (`assets/images/icon.png`, `public/icon-192.png`/`icon-512.png`, Android adaptive icons)
   still show the old design. Export them from `public/favicon.svg` or a painted version
   (prompts in `docs/art-prompts.md`).

## Prompt to paste next time
> Continue Flowglass from NEXT_STEPS.md. I signed in with the code email and ran a session —
> check the Supabase tables for my rows. Character picks: <numbers → class>.
