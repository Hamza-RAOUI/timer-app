/**
 * Business details shown on the legal pages. Fill these in before going live —
 * every legal page reads from here.
 */
export const LEGAL_ENTITY = {
  /** TODO(owner): your legal name or company name. */
  operator: 'the Flowglass team',
  /** TODO(owner): a monitored inbox for privacy, refund and legal requests. */
  email: 'hello@flowglass.app',
  /** TODO(owner): postal address, if your country requires one (e.g. an EU/UK imprint). Leave empty to hide. */
  address: '',
  /** TODO(owner): country whose law governs the Terms (e.g. "Ireland"). Leave empty to hide. */
  governingLaw: '',
  /** Date shown as "Last updated" on every legal page. */
  lastUpdated: 'October 19, 2026',
} as const;
