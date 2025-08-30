// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export type RegisterResult = { ok: true; token: string } | { ok: false; reason: string };

export async function registerPushToken(): Promise<RegisterResult> {
  try {
    if (!Device.isDevice) return { ok: false, reason: 'simulator' };

    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
    if (!granted) {
      const ask = await Notifications.requestPermissionsAsync();
      granted = ask.granted || ask.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
    }
    if (!granted) return { ok: false, reason: 'permission-denied' };

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return { ok: false, reason: 'missing-projectId' };

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = data;

    const { error } = await supabase.from('devices').upsert({
      expo_push_token: token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      last_seen: new Date().toISOString(),
    }, { onConflict: 'expo_push_token' });
    if (error) return { ok: false, reason: error.message };

    return { ok: true, token };
  } catch (e:any) {
    return { ok: false, reason: e?.message ?? 'unknown' };
  }
}

// Optional: show notifications while app is foregrounded
export function initNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
