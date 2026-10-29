# Flowglass — where things stand (Oct 29, 2026)

## Done
- Accounts/sync, creatures and logo on GitHub (PRs #1–#4 merged, #5 `timekeeper-names` open).
- Painted art: 16 creatures (4 families × 4 stages) + the Timekeeper mascot, which is also the
  logo, favicon, app/PWA icons, splash and Android adaptive icon.
- Supabase project `hwcjffmzzwdgvwanqpgh`: tables + row-level security, redirect URLs,
  Resend SMTP, the "Your Flowglass code" email template (code + link), 100 emails/hour.
- Resend domain `flowglass.app` (Ireland / eu-west-1): DKIM, SPF (`send`, `rsend`) and DMARC
  records at Name.com. Codes are sent from `no-reply@flowglass.app` to any address.
- Keys: `.env.local` locally (not in git) and Vercel environment variables (URL fixed).
- Pro is $1.99/month, shown as "Pro · coming soon" (records anonymous interest only).
  Custom skills, more sounds, full history, weekly quests and every sand are Pro.

## Still to do
1. **Test sign-in** — Settings → Account & sync on www.flowglass.app, any email, enter the
   6-digit code, finish a session, check rows in `focus_sessions` / `user_state`.
2. **Delete the Supabase access token** you made for the email script (Account → Access Tokens).
3. **Business details** — fill the `TODO(owner)` fields in `src/constants/legal.ts` (name,
   contact email, address if required, governing law) before charging anyone.
4. **Payments** — follow the go-live steps in `src/lib/purchases.ts` (RevenueCat, store
   products, `FEATURES.payments`). Until then nobody can buy Pro.
5. **Art license** — confirm the image tool you used allows commercial use of its output.
6. **Later** — 8 more creatures for custom skills (Bard + Wildcard, keyword rules; drafts in
   `docs/art-prompts.md`) and the native widget's old "TEMPO" branding.

## Prompt to paste next time
> Continue Flowglass from NEXT_STEPS.md. I signed in with the code email and ran a session —
> check the Supabase tables for my rows.
