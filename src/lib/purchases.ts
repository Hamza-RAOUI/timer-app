/**
 * Pro / in-app-purchase wrapper.
 *
 * The paywall UI is built and wired, but the real purchase flow is a stub so
 * the app keeps bundling and running on web + Expo Go (react-native-purchases
 * is a native module that needs a dev build).
 *
 * To go live:
 *   1. `npx expo install react-native-purchases`
 *   2. Replace the stubbed bodies below with the RevenueCat SDK calls
 *      (Purchases.configure, getOfferings, purchasePackage, restorePurchases).
 *   3. On a successful purchase/restore, call `useSettingsStore.getState().setPro(true)`.
 */
import { useSettingsStore } from '@/src/stores/settingsStore';

export const PRO_PRODUCT_ID = 'zentimer_pro_monthly';
export const PRO_PRICE_LABEL = '$0.99/month';

let configured = false;

/** Call once at app start. No-op until RevenueCat is wired. */
export const initPurchases = () => {
  if (configured) return;
  configured = true;
  // TODO: Purchases.configure({ apiKey: '<REVENUECAT_KEY>' });
};

/** Stubbed purchase — flips the local Pro flag so the UI can be exercised. */
export const purchasePro = async (): Promise<boolean> => {
  // TODO: const { customerInfo } = await Purchases.purchasePackage(pkg);
  useSettingsStore.getState().setPro(true);
  return true;
};

/** Stubbed restore. */
export const restorePurchases = async (): Promise<boolean> => {
  // TODO: const info = await Purchases.restorePurchases();
  // Until wired, restore does nothing (no entitlement to recover).
  return useSettingsStore.getState().isPro;
};

export const useIsPro = () => useSettingsStore((s) => s.isPro);
