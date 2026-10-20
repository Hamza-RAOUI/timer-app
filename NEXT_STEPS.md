# Flowglass — where things stand (Oct 19, 2026)

## Done (not committed yet)
- Class art blends as a deep-blue panel in light + dark; sound picker is a small pill + icon row.
- Rest hint back as one line.
- Pro is **$1.99/month** (Pro sheet, Settings, purchases notes, Terms / Refunds / Privacy).
- Optional accounts + cloud sync (Supabase): code in `src/lib/cloud.ts`, `src/lib/supabase.ts`,
  Settings → Account & sync. Tables + security already created in the Supabase project.
- Keys are in `.env.local` (not in git). Redirect URLs are set in Supabase.
- 22 new character image options: `.claude/character-candidates.jpg` (+ `.md` with sources).
- Tests 66/66, typecheck and web export pass.

## Still to do
1. **Test sign-in** — open `http://localhost:8083` in your normal browser, Settings → Account &
   sync, use the email you log in to Supabase with (the built-in mailer only sends to that), click
   the link in "Your sign-in link". Then check that rows appear in `focus_sessions` / `user_state`.
2. **Resend (real emails)** — you: create a resend.com account, (ideally) verify your domain,
   create an API key, paste it into Supabase → Authentication → Emails → SMTP Settings → Password.
3. **Email with a code** — after step 2, put this in the "Magic link or OTP" and "Confirm sign up"
   templates, then raise Authentication → Rate Limits → emails/hour to ~100:
   ```html
   <h2>Your Flowglass code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   <p>Or <a href="{{ .ConfirmationURL }}">tap here to sign in</a>.</p>
   ```
4. **Characters** — pick numbers from the contact sheet and which class each replaces.
5. **Vercel** — add `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` as environment
   variables, then redeploy.
6. **Commit** everything once you're happy.

## Prompt to paste next time
> Continue Flowglass from NEXT_STEPS.md. I've created a Resend account and pasted the API key into
> Supabase SMTP Settings → Password (I'm signed in to Supabase in the browser pane). Fill in the
> rest of the SMTP settings (smtp.resend.com, port 465, user `resend`, sender
> no-reply@<my domain>, name Flowglass), add the code-block email template to "Magic link or OTP"
> and "Confirm sign up", raise the email rate limit, then help me test sign-in and confirm the
> sync writes rows. Character picks: <numbers → class>.
