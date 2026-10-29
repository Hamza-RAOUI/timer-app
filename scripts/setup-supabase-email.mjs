/**
 * One-time: send auth emails through Resend and use the Flowglass code template.
 * Talks to the Supabase Management API, so no dashboard clicks are needed.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_...  (supabase.com → Account → Access Tokens)
 *   RESEND_API_KEY=re_...          (resend.com → API Keys)
 *   node scripts/setup-supabase-email.mjs
 *
 * Optional: SENDER_EMAIL (default onboarding@resend.dev — Resend then only delivers
 * to your own Resend account email until you verify a domain). To switch to a verified
 * domain later, rerun with SENDER_EMAIL and press Enter at the Resend key prompt.
 * Secrets are read from the environment and never printed.
 */
import { createInterface } from 'node:readline';

const PROJECT_REF = 'hwcjffmzzwdgvwanqpgh';

/** Ask for a secret in the terminal without echoing it. */
const askHidden = (question) =>
  new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve('');
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      // Readline redraws "prompt + typed text" on paste: show only the prompt part.
      if (s.startsWith(question)) process.stdout.write(question);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
  });

const token = process.env.SUPABASE_ACCESS_TOKEN || (await askHidden('Supabase access token (sbp_…, hidden): '));
const resendKey = process.env.RESEND_API_KEY || (await askHidden('Resend API key (re_…, hidden — Enter keeps the saved one): '));
const sender = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

if (!token) {
  console.error('Need a Supabase access token (see the comment at the top).');
  process.exit(1);
}

// Prove the Resend key can send from this sender before handing it to Supabase
// (Supabase only ever says "Error sending confirmation email").
if (resendKey) {
  const test = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Flowglass <${sender}>`, to: 'delivered@resend.dev', subject: 'Flowglass key check', text: 'ok' }),
  });
  if (!test.ok) {
    const { message } = await test.json().catch(() => ({}));
    console.error(`Resend rejected the key (${test.status}): ${message ?? 'no details'}. Nothing was saved.`);
    process.exit(1);
  }
  console.log('✓ Resend key can send from', sender);
}

const body = `<h2>Your Flowglass code</h2>
<p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
<p>Or <a href="{{ .ConfirmationURL }}">tap here to sign in</a>.</p>`;

const config = {
  smtp_admin_email: sender,
  smtp_sender_name: 'Flowglass',
  smtp_host: 'smtp.resend.com',
  smtp_port: '465',
  smtp_user: 'resend',
  // Left out when empty, so Supabase keeps the key it already has.
  ...(resendKey && { smtp_pass: resendKey }),
  rate_limit_email_sent: 100,
  mailer_subjects_magic_link: 'Your Flowglass code',
  mailer_templates_magic_link_content: body,
  mailer_subjects_confirmation: 'Your Flowglass code',
  mailer_templates_confirmation_content: body,
};

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(config),
});

if (!res.ok) {
  console.error(`Supabase said ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const saved = await res.json();
console.log('✓ Custom SMTP on:', saved.smtp_host === 'smtp.resend.com' ? 'yes' : 'no');
console.log('✓ Sender:', saved.smtp_admin_email);
console.log('✓ Code template set:', String(saved.mailer_templates_magic_link_content).includes('{{ .Token }}') ? 'yes' : 'no');
console.log('✓ Email rate limit / hour:', saved.rate_limit_email_sent);
