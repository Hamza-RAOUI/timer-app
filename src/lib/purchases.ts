/**
 * Pro — a monthly auto-renewing subscription ($1.99/month, cancel anytime).
 *
 * Native purchases go through RevenueCat, entitlement `pro`. The SDK isn't
 * installed yet (it's a native module that needs a dev build and would break
 * the web/Expo Go bundle), so the calls below are stubs behind
 * `FEATURES.payments`. While that flag is off — and always on web — every Pro
 * prompt shows the "Founding Pro — coming soon" fake door instead.
 *
 * To go live on native:
 *   1. `npx expo install react-native-purchases` and create a dev build.
 *   2. In App Store Connect / Play Console: an auto-renewable monthly subscription
 *      `PRO.productId`. In RevenueCat: attach it to the entitlement
 *      `PRO.entitlement` ("pro") as the `$rc_monthly` package of the default offering.
 *      The entitlement goes inactive when a subscription lapses — syncEntitlement
 *      then turns Pro off again.
 *   3. Replace the TODOs below (configure, getOfferings, purchasePackage,
 *      restorePurchases) and set `FEATURES.payments = true` in appConfig.
 */
import { Platform } from 'react-native';
import { FEATURES, PRO } from '@/src/constants/appConfig';
import { useSettingsStore } from '@/src/stores/settingsStore';

export const PRO_ENTITLEMENT = PRO.entitlement;
export const PRO_PRODUCT_ID = PRO.productId;

/** Real checkout available (native + flag on). Otherwise show the fake door. */
export const paymentsEnabled = (): boolean => FEATURES.payments && Platform.OS !== 'web';

let configured = false;

/** Call once at app start. No-op until RevenueCat is wired. */
export const initPurchases = () => {
  if (configured || !paymentsEnabled()) return;
  configured = true;
  // TODO: Purchases.configure({ apiKey: Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY });
  // TODO: Purchases.getCustomerInfo().then(syncEntitlement);
};

/** `customerInfo.entitlements.active.pro` → local Pro flag. */
export const syncEntitlement = (customerInfo: { entitlements: { active: Record<string, unknown> } }) => {
  useSettingsStore.getState().setPro(PRO_ENTITLEMENT in customerInfo.entitlements.active);
};

/** Localized price from the store, falling back to the configured label. */
export const getProPriceLabel = async (): Promise<string> => {
  // TODO: const offerings = await Purchases.getOfferings();
  //       return offerings.current?.monthly?.product.priceString ?? PRO.priceLabel;
  return PRO.priceLabel;
};

export type PurchaseResult = 'purchased' | 'cancelled' | 'unavailable' | 'error';

export const purchasePro = async (): Promise<PurchaseResult> => {
  if (!paymentsEnabled()) return 'unavailable';
  // TODO: const pkg = (await Purchases.getOfferings()).current?.monthly;
  //       const { customerInfo } = await Purchases.purchasePackage(pkg);
  //       syncEntitlement(customerInfo);  (catch e.userCancelled → 'cancelled')
  return 'unavailable';
};

export const restorePurchases = async (): Promise<boolean> => {
  if (!paymentsEnabled()) return useSettingsStore.getState().isPro;
  // TODO: const customerInfo = await Purchases.restorePurchases(); syncEntitlement(customerInfo);
  return useSettingsStore.getState().isPro;
};

export const useIsPro = () => useSettingsStore((s) => s.isPro);
