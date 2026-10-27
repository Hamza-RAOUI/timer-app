/**
 * Legal page copy. Plain-language and specific to what Flowglass actually does
 * (local-first storage, cookieless analytics, monthly Pro). Not legal advice —
 * have it reviewed for your jurisdiction before relying on it.
 */
import { SITE_URL } from '../constants/appConfig';
import { LEGAL_ENTITY } from '../constants/legal';
import { SESSIONS_KEY } from '../stores/statsStore';
import { SETTINGS_KEY } from '../stores/settingsStore';

export type Block = { p: string } | { list: string[] } | { h3: string };

export interface LegalSection {
  title: string;
  blocks: Block[];
}

export interface LegalDoc {
  path: '/privacy' | '/terms' | '/refunds' | '/cookies' | '/legal';
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
}

const contact = `${LEGAL_ENTITY.email}`;

export const PRIVACY: LegalDoc = {
  path: '/privacy',
  title: 'Privacy Policy',
  description: 'How Flowglass handles your data: local-first storage, an optional account for sync, no cookies, anonymous analytics you can turn off.',
  intro:
    'Flowglass is built to know as little about you as possible. You can use it without an account: your sessions, XP, levels and settings then stay on your device and we never receive them. If you choose to sign in, a private copy is kept in your account so it syncs across your devices.',
  sections: [
    {
      title: 'The short version',
      blocks: [
        {
          list: [
            'No account needed. Without one, your focus data stays on your device (browser local storage or app storage).',
            'Optional account: only your email address, plus a synced copy of your sessions and settings. Delete it anytime in Settings.',
            'No cookies, no ads, no selling or sharing of personal data, no cross-site tracking.',
            'On the website we use cookieless, anonymous analytics (Vercel Web Analytics), which you can turn off at any time.',
            'You can export or delete everything yourself in Settings → Privacy & data.',
          ],
        },
      ],
    },
    {
      title: 'Data stored on your device',
      blocks: [
        {
          p: `Each focus session is saved as a small record (start and end time, focused minutes, planned length, technique, skill, whether it was completed), together with your settings and custom skill names. On the web this lives in your browser's local storage under the keys “${SESSIONS_KEY}” and “${SETTINGS_KEY}”; in the apps it lives in the app's private storage. It is never uploaded to us.`,
        },
        { p: 'XP, levels, streaks and quests are calculated from these records on your device.' },
      ],
    },
    {
      title: 'Optional account and sync',
      blocks: [
        {
          p: 'Signing in is optional. If you do, we use your email address to send you a one-time sign-in code or link — there is no password — and we store a copy of your session records and settings (including custom skill names) in your account so they sync across your devices. Pro status and your analytics choice are not synced.',
        },
        {
          p: 'Accounts are run on Supabase (Supabase Inc.), which hosts the database and sends the sign-in emails on our behalf. Each account’s data is protected by row-level security: only you, signed in, can read or change it. We do not use it for marketing and never sell or share it.',
        },
        {
          p: 'Legal basis (EU/UK GDPR): performance of a contract — providing the sync you asked for. Sign out anytime; to remove the cloud copy use Settings → Account & sync → Delete account, or Settings → Privacy & data → Delete all my data.',
        },
      ],
    },
    {
      title: 'Website analytics',
      blocks: [
        {
          p: 'To understand which features are useful, the website uses Vercel Web Analytics. It does not use cookies and does not store identifiers on your device. It records page views (page address, referring site, browser, operating system, device type and an approximate country derived from the IP address) and four product events:',
        },
        {
          list: [
            'session_completed — the technique and the built-in skill (or simply “custom”)',
            'level_up — the new level number',
            'quest_completed — which quest and whether it was daily or weekly',
            'pro_interest_clicked — where the “I’m interested” button was pressed',
          ],
        },
        {
          p: 'Custom skill names and other text you type are never sent. Analytics are not linked to you, and we cannot use them to identify you. You can decline or turn analytics off at any time in the privacy notice or in Settings → Privacy & data; after that, nothing is sent. The native apps send no analytics at all.',
        },
        { p: 'Legal basis (EU/UK GDPR): our legitimate interest in improving the product with minimal, non-identifying statistics, or your consent where the law requires it.' },
      ],
    },
    {
      title: 'Hosting',
      blocks: [
        {
          p: 'The website is hosted by Vercel Inc. Like any web host, Vercel processes technical data such as IP addresses and request logs to deliver and protect the site. Vercel may process data in the United States and other countries; see Vercel’s privacy policy for details and the safeguards it uses.',
        },
      ],
    },
    {
      title: 'Purchases (Pro)',
      blocks: [
        {
          p: 'Pro is planned as a monthly subscription. No payments are taken on the website. If in-app subscriptions become available in the iOS or Android apps, Apple or Google will process the payment under their own privacy policies, and a purchase-verification service (RevenueCat) will receive an anonymous app user ID and the purchase receipt to confirm your subscription. We never see your card details.',
        },
      ],
    },
    {
      title: 'Third-party services',
      blocks: [
        {
          list: [
            'Vercel — website hosting and cookieless analytics (web only).',
            'Supabase — optional accounts: sign-in emails and the synced copy of your data (only if you sign in).',
            'Apple App Store / Google Play — app distribution and, in future, payments.',
            'RevenueCat — purchase verification, only once in-app purchases are switched on (not active today).',
          ],
        },
        { p: 'Flowglass contains no advertising, social-media or tracking SDKs.' },
      ],
    },
    {
      title: 'Children',
      blocks: [
        {
          p: 'Flowglass is suitable for students of all ages and works fully without an account, so nobody has to give us personal information to use it. The optional account is for users aged 13 or older (or the minimum age in your country, up to 16 in parts of the EEA); younger users should keep using Flowglass signed out or ask a parent. We do not knowingly collect personal data from children below that age. If you believe a child has created an account, contact us and we will delete it.',
        },
      ],
    },
    {
      title: 'Your rights and choices',
      blocks: [
        {
          p: 'Depending on where you live (for example under the GDPR, UK GDPR or California law), you may have rights to access, correct, export, delete or object to the processing of personal data. You can exercise most of these directly in the app:',
        },
        {
          list: [
            'Export: Settings → Privacy & data → Export my data (a JSON file).',
            'Delete: Settings → Privacy & data → Delete all my data (this device, and your account’s copy if you are signed in). Clearing your browser’s site data or uninstalling the app also removes the local copy.',
            'Delete your account: Settings → Account & sync → Delete account removes the account, your email and everything synced to it.',
            'Object to analytics: decline in the privacy notice or switch analytics off in Settings.',
          ],
        },
        { p: `For anything else — or to complain about how we handle data — email ${contact}. You can also contact your local data protection authority.` },
      ],
    },
    {
      title: 'Retention',
      blocks: [
        {
          p: 'Data on your device is kept until you delete it. If you have an account, its data is kept until you delete it or the account (deletion is immediate; provider backups roll off within their normal backup window). Analytics are kept in aggregate according to Vercel’s retention periods. Emails you send us are kept only as long as needed to answer them.',
        },
      ],
    },
    {
      title: 'Changes',
      blocks: [{ p: 'If this policy changes, we will update the date at the top of this page. Significant changes will be highlighted in the app.' }],
    },
    {
      title: 'Contact',
      blocks: [{ p: `Questions or requests: ${contact}.` }],
    },
  ],
};

export const TERMS: LegalDoc = {
  path: '/terms',
  title: 'Terms of Service',
  description: 'The terms for using the Flowglass focus timer on the web, iOS and Android.',
  intro: 'These terms apply when you use Flowglass on the web or in the iOS and Android apps. By using Flowglass you agree to them.',
  sections: [
    {
      title: 'The service',
      blocks: [
        {
          p: 'Flowglass is a focus timer with an optional game layer (XP, levels, skills, streaks and quests). The timers, XP, levels, skills, streaks, the daily quest and the last 7 days of statistics are free. Optional extras are planned as a low-cost monthly “Pro” subscription.',
        },
      ],
    },
    {
      title: 'Your data',
      blocks: [
        {
          p: 'Flowglass works without an account and then stores your data only on your device — which means we cannot recover it for you if you clear your browser data, change devices or uninstall the app. Use Settings → Privacy & data → Export my data to keep a copy, or sign in (optional) to back it up and sync it. You are responsible for keeping access to the email address you sign in with. We may delete accounts that are used to abuse the service.',
        },
      ],
    },
    {
      title: 'Pro',
      blocks: [
        {
          p: 'Pro is not for sale on the website. The “Founding Pro — I’m interested” button only records anonymous interest; it is not an order and creates no obligation for you or for us.',
        },
        {
          p: 'If Pro becomes available as an in-app purchase, it will be an auto-renewing monthly subscription that unlocks the listed extras on the store account you subscribe with. The price is always shown before you confirm. It renews each month at the same price until you cancel; you can cancel anytime in your App Store or Google Play subscription settings, at least 24 hours before the renewal date, and keep Pro until the end of the period you paid for. If we ever change the price, the store will tell you in advance and ask for your consent where required. Payments are processed by Apple or Google under their terms; see the Refund Policy for refunds.',
        },
      ],
    },
    {
      title: 'Acceptable use',
      blocks: [
        {
          list: [
            'Don’t attempt to disrupt, overload or gain unauthorized access to the service.',
            'Don’t copy, resell or redistribute the app, its artwork or its code except as the law allows.',
            'Don’t use Flowglass in breach of applicable law.',
          ],
        },
      ],
    },
    {
      title: 'Not medical advice',
      blocks: [
        {
          p: 'Flowglass is a productivity tool, not a medical device or treatment. Articles about focus, studying or ADHD are general information and are not medical advice. Talk to a qualified professional about health concerns.',
        },
      ],
    },
    {
      title: 'Intellectual property',
      blocks: [
        {
          p: 'The Flowglass name, interface, illustrations, emblems and text belong to the operator of Flowglass. Third-party components are used under their own licenses (see Legal notice & credits).',
        },
      ],
    },
    {
      title: 'Disclaimers and liability',
      blocks: [
        {
          p: 'Flowglass is provided “as is” and “as available”. To the extent permitted by law, we make no warranties that it will be uninterrupted or error-free, and we are not liable for indirect or consequential losses, or for loss of locally stored data. Nothing in these terms limits liability that cannot be limited by law, or your statutory rights as a consumer.',
        },
      ],
    },
    {
      title: 'Changes and termination',
      blocks: [
        {
          p: 'We may update Flowglass and these terms. If the terms change materially we will update the date at the top of this page. You can stop using Flowglass at any time; deleting your data is described in the Privacy Policy.',
        },
      ],
    },
    {
      title: 'Governing law and contact',
      blocks: [
        {
          p: `${LEGAL_ENTITY.governingLaw ? `These terms are governed by the laws of ${LEGAL_ENTITY.governingLaw}, without affecting mandatory consumer protections where you live. ` : ''}Questions: ${contact}.`,
        },
      ],
    },
  ],
};

export const REFUNDS: LegalDoc = {
  path: '/refunds',
  title: 'Refund Policy',
  description: 'Refunds for Flowglass Pro: no web payments today; in-app purchases are refunded through Apple or Google.',
  intro: 'Most of Flowglass is free. This page explains cancellations and refunds for the optional Pro subscription.',
  sections: [
    {
      title: 'On the website',
      blocks: [
        {
          p: 'No payments are taken on the website. “Founding Pro — coming soon” only measures interest; pressing “I’m interested” never charges you, so there is nothing to refund.',
        },
      ],
    },
    {
      title: 'In the iOS and Android apps',
      blocks: [
        {
          p: 'When Pro is available as an in-app purchase, the payment is processed by Apple or Google, and they handle refunds under their policies:',
        },
        {
          list: [
            'Apple App Store: request a refund at reportaproblem.apple.com, or from your purchase history.',
            'Google Play: request a refund from your Google Play order history, or via Google Play support.',
          ],
        },
        { p: 'Because the store processes the payment, we cannot issue refunds directly — but if something went wrong, email us and we will help you through it.' },
      ],
    },
    {
      title: 'Renewal, cancellation and no hidden fees',
      blocks: [
        {
          p: 'Pro is one monthly price shown before you confirm. It renews automatically each month until you cancel, there are no other fees, and cancelling is as easy as subscribing: open your App Store or Google Play subscriptions and tap Cancel. You keep Pro until the end of the month you paid for; we do not charge cancellation fees. Taxes may be added by the store depending on your country.',
        },
      ],
    },
    {
      title: 'Your statutory rights',
      blocks: [{ p: `This policy does not affect any rights you have under consumer law where you live. Contact: ${contact}.` }],
    },
  ],
};

export const COOKIES: LegalDoc = {
  path: '/cookies',
  title: 'Cookie Policy',
  description: 'Flowglass uses no cookies. Here is what it stores in your browser and why.',
  intro: 'Flowglass does not use cookies — not for analytics, not for advertising, not at all. Here is everything the website stores in your browser.',
  sections: [
    {
      title: 'Local storage (strictly necessary)',
      blocks: [
        {
          p: `The app saves your sessions under “${SESSIONS_KEY}” and your settings (including your privacy choice) under “${SETTINGS_KEY}” in your browser's local storage. This is what makes the timer, statistics and RPG progress work. It stays in your browser and is never sent to us.`,
        },
      ],
    },
    {
      title: 'Offline cache',
      blocks: [
        {
          p: 'A service worker caches the app’s static files (code, icons) so Flowglass opens quickly and works offline. It contains no personal data.',
        },
      ],
    },
    {
      title: 'Analytics',
      blocks: [
        {
          p: 'Vercel Web Analytics is cookieless: it does not set cookies or store identifiers in your browser. It counts visits without identifying you and records four product events described in the Privacy Policy. Decline in the privacy notice, or switch it off in Settings → Privacy & data, and nothing is sent.',
        },
      ],
    },
    {
      title: 'Managing storage',
      blocks: [
        {
          p: 'If you sign in to the optional account, the sign-in session is also kept in local storage (a key starting with “sb-”) so you stay signed in; signing out removes it. It is not a cookie and is not used for tracking.',
        },
        {
          p: 'You can erase everything Flowglass stores with Settings → Privacy & data → Delete all my data, or by clearing this site’s data in your browser settings.',
        },
      ],
    },
  ],
};

export const LEGAL_NOTICE: LegalDoc = {
  path: '/legal',
  title: 'Legal Notice & Credits',
  description: 'Who operates Flowglass, how to reach us, and the licenses for fonts, icons and libraries.',
  intro: 'Business details, contact information and the third-party licenses Flowglass relies on.',
  sections: [
    {
      title: 'Operator',
      blocks: [
        { p: `Flowglass (${SITE_URL.replace('https://', '')}) is operated by ${LEGAL_ENTITY.operator}.` },
        ...(LEGAL_ENTITY.address ? [{ p: `Address: ${LEGAL_ENTITY.address}` }] : []),
        { p: `Email: ${contact}` },
      ],
    },
    {
      title: 'Email',
      blocks: [{ p: 'Flowglass does not send newsletters or marketing email, and never asks for your email address. If we reply to a message you sent, we will not add you to any list.' }],
    },
    {
      title: 'Fonts, icons and artwork',
      blocks: [
        {
          list: [
            'Inter typeface by Rasmus Andersson — SIL Open Font License 1.1 (bundled via @expo-google-fonts/inter, MIT).',
            'Ionicons by Ionic — MIT License (via @expo/vector-icons).',
            'Hourglass, rank emblems, skill crests, scenery, the evolving creatures and the Timekeeper logo — original artwork drawn in code for Flowglass.',
            'Ambience and lo-fi tracks — recordings from Pixabay (Pixabay Content License), trimmed and looped for Flowglass. Sources are listed in public/audio/CREDITS.md.',
          ],
        },
      ],
    },
    {
      title: 'Open-source software',
      blocks: [
        {
          p: 'Flowglass is built with open-source software including React and React Native (MIT), Expo and Expo Router (MIT), React Native Web (MIT), React Native Reanimated (MIT), react-native-svg (MIT), Zustand (MIT), AsyncStorage (MIT) and @vercel/analytics (MIT). Their licenses are included with the respective packages.',
        },
      ],
    },
    {
      title: 'Claims',
      blocks: [
        {
          p: 'Flowglass does not show testimonials, star ratings or user counts. Articles on the site describe common focus techniques as general information; results vary from person to person.',
        },
      ],
    },
  ],
};

export const LEGAL_DOCS = [PRIVACY, TERMS, REFUNDS, COOKIES, LEGAL_NOTICE];
