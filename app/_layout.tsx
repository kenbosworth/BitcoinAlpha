// app/_layout.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { ActivityIndicator, AppState, AppStateStatus, View } from 'react-native';
import { AuthContext } from '../lib/auth-context'; // ✅ NEW IMPORT

type Profile = {
  id: string;
  tier: 'free' | 'trial' | 'promo' | 'standard' | null;
  terms_agreed_at: string | null;
  trial_expires_at: string | null;
};

function parseIso(iso?: string | null) {
  if (!iso) return NaN;
  const s = iso.includes('T') ? iso : iso.replace(' ', 'T');
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : NaN;
}

function isEntitled(p?: Profile | null) {
  if (!p) return false;
  if (p.tier === 'standard' || p.tier === 'promo') return true;
  if (p.tier === 'trial') {
    const t = parseIso(p.trial_expires_at);
    return Number.isFinite(t) && Date.now() < t;
  }
  return false;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [loadingGate, setLoadingGate] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = useMemo(() => segments[0] === '(auth)', [segments]);
  const inOnboardingGroup = useMemo(() => segments[0] === '(onboarding)', [segments]);

  // Keep your original auth subscription behavior
  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setInitialCheckDone(true);
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    bootstrap();
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load the profile when we have a session
  const loadProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, tier, terms_agreed_at, trial_expires_at')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) {
      console.warn('profiles load error:', error.message);
    }
    setProfile(data ?? null);
  }, [session?.user]);

  useEffect(() => {
    if (session) loadProfile();
    else setProfile(null);
  }, [session, loadProfile]);

  // Gate logic (runs after initial checks + whenever session/profile changes)
  const runGate = useCallback(() => {
    setLoadingGate(true);

    // 1) Not signed in → auth
    if (!session?.user) {
      if (!inAuthGroup) router.replace('/(auth)/signin');
      setLoadingGate(false);
      return;
    }

    // 2) No terms → onboarding/terms
    if (!profile?.terms_agreed_at) {
      if (!inOnboardingGroup || segments[1] !== 'terms') {
        router.replace('/(onboarding)/terms');
      }
      setLoadingGate(false);
      return;
    }

    // 3) Not entitled → onboarding/promo
    if (!isEntitled(profile)) {
      if (!inOnboardingGroup || segments[1] !== 'promo') {
        router.replace('/(onboarding)/promo');
      }
      setLoadingGate(false);
      return;
    }

    // 4) Entitled → tabs
    if (inAuthGroup || inOnboardingGroup) {
      router.replace('/(tabs)');
    }
    setLoadingGate(false);
  }, [session?.user, profile, inAuthGroup, inOnboardingGroup, router, segments]);

  useEffect(() => {
    if (!initialCheckDone) return;
    runGate();
  }, [initialCheckDone, runGate]);

  // Re-run gate on foreground (captures trial expiry while app was backgrounded)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') runGate();
    });
    return () => sub.remove();
  }, [runGate]);

  // ✅ NEW: Create context value to expose reloadProfile
  const authContextValue = useMemo(() => ({
    reloadProfile: loadProfile
  }), [loadProfile]);

  // While we're establishing session/profile/gate, show a spinner (keeps UI clean)
  const showSpinner = !initialCheckDone || loadingGate;

  return (
    <AuthContext.Provider value={authContextValue}>
      <SafeAreaProvider>
        <ThemeProvider>
          {showSpinner ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <Slot />
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}