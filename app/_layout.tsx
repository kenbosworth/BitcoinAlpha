// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setInitialCheckDone(true);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    getSession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!initialCheckDone) return;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/signin');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, inAuthGroup, initialCheckDone]);

  if (!initialCheckDone) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
