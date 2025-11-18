// lib/purchases.ts
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

let isConfigured = false;

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts
 */
export async function initializePurchases(userId?: string) {
  if (isConfigured) {
    console.log('Purchases already configured');
    return;
  }

  try {
    const apiKey = Platform.select({
      ios: REVENUECAT_API_KEY.ios,
      android: REVENUECAT_API_KEY.android,
    });

    if (!apiKey) {
      console.warn('RevenueCat API key not found');
      return;
    }

    // Configure RevenueCat
    await Purchases.configure({ apiKey });

    // Enable debug logs in development
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // If we have a user ID, log them in to RevenueCat
    if (userId) {
      await Purchases.logIn(userId);
    }

    isConfigured = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
}

/**
 * Log in user to RevenueCat
 * Call this after user signs in to Supabase
 */
export async function loginToRevenueCat(userId: string) {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('Logged in to RevenueCat:', customerInfo.originalAppUserId);
    return customerInfo;
  } catch (error) {
    console.error('Failed to log in to RevenueCat:', error);
    throw error;
  }
}

/**
 * Log out user from RevenueCat
 * Call this when user signs out
 */
export async function logoutFromRevenueCat() {
  try {
    await Purchases.logOut();
    console.log('Logged out from RevenueCat');
  } catch (error) {
    console.error('Failed to log out from RevenueCat:', error);
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
}

/**
 * Check if user has active premium entitlement
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
}

/**
 * Get customer info (subscription status, entitlements, etc.)
 */
export async function getCustomerInfo() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
}

/**
 * Restore purchases (for users who reinstall app)
 */
export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw error;
  }
}
