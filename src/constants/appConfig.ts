export const APP_NAME = 'Flowglass';
export const APP_VERSION = '1.1.0';
export const SITE_URL = 'https://www.flowglass.app';

/** Feature flags — flip here, nowhere else. */
export const FEATURES = {
  /**
   * Real in-app purchases through RevenueCat (entitlement `pro`), native only.
   * Off until `react-native-purchases` is installed and wired in
   * `src/lib/purchases.ts`; while off, every Pro prompt shows the
   * "Founding Pro — coming soon" fake door. Web never takes payments in this build.
   */
  payments: false,
  /**
   * Analytics consent model (web only — native sends nothing):
   *  - false → cookieless, anonymous Vercel Web Analytics run by default, with a
   *            one-tap opt-out in the notice and in Settings.
   *  - true  → nothing loads or sends until the visitor taps "Allow".
   */
  analyticsOptIn: false,
  /**
   * Vercel records custom events only on Pro/Enterprise plans. On Hobby, set this to
   * true to also count each event as a virtual page view (/e/session_completed, …)
   * that shows up in the Pages panel.
   */
  analyticsEventsAsPageviews: false,
} as const;

/** Pro is a low-cost monthly subscription (auto-renews, cancel anytime in the store). */
export const PRO = {
  /** RevenueCat entitlement identifier. */
  entitlement: 'pro',
  /** Store product id (non-consumable). */
  productId: 'flowglass_pro_monthly',
  /** Shown until the store returns a localized price. Change freely. */
  priceLabel: '$1.99',
  /** Billing period shown next to the price. */
  period: 'month',
} as const;
