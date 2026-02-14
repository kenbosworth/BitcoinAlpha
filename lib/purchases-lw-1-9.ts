import Purchases, { PurchasesPackage } from 'react-native-purchases';

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!;

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts
 */
export async function initializePurchases() {
  try {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: REVENUECAT_IOS_KEY });
    console.log('[RevenueCat] Initialized');
  } catch (e) {
    console.error('[RevenueCat] Failed to initialize:', e);
    throw e;
  }
}

/**
 * Login user to RevenueCat with their user ID
 */
export async function loginToRevenueCat(userId: string) {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] Logged in:', customerInfo.originalAppUserId);
    return customerInfo;
  } catch (e) {
    console.error('[RevenueCat] Login failed:', e);
    throw e;
  }
}

/**
 * Logout from RevenueCat
 */
export async function logoutFromRevenueCat() {
  try {
    const { customerInfo } = await Purchases.logOut();
    console.log('[RevenueCat] Logged out');
    return customerInfo;
  } catch (e) {
    console.error('[RevenueCat] Logout failed:', e);
    throw e;
  }
}

/**
 * Get all available offerings
 * Returns an object with offering IDs as keys
 */
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      throw new Error('No current offering available');
    }

    console.log('[RevenueCat] Available offerings:', Object.keys(offerings.all));
    
    return offerings.all;
  } catch (e) {
    console.error('[RevenueCat] Failed to get offerings:', e);
    throw e;
  }
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
    console.log('[RevenueCat] Has active subscription:', hasPremium);
    return hasPremium;
  } catch (e) {
    console.error('[RevenueCat] Failed to check subscription:', e);
    return false;
  }
}

/**
 * Get customer info
 */
export async function getCustomerInfo() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (e) {
    console.error('[RevenueCat] Failed to get customer info:', e);
    throw e;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(packageToPurchase: PurchasesPackage) {
  try {
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
    console.log('[RevenueCat] Purchase successful:', productIdentifier);
    return { customerInfo, productIdentifier };
  } catch (e: any) {
    if (e.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
      throw { userCancelled: true };
    }
    console.error('[RevenueCat] Purchase failed:', e);
    throw e;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored');
    return customerInfo;
  } catch (e) {
    console.error('[RevenueCat] Restore failed:', e);
    throw e;
  }
}