import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
  onboarding_completed: boolean | null;
};

export default function Entry() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [onboardingDone, setOnboardingDone] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session ?? null);

      if (data.session?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', data.session.user.id)
          .single<Profile>();
        if (!cancelled) setOnboardingDone(!!profile?.onboarding_completed);
      } else {
        if (!cancelled) setOnboardingDone(false);
      }
    }
    run();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  if (session === undefined || onboardingDone === undefined) return null;

  if (!session) return <Redirect href='/(auth)/signin' />;
  if (!onboardingDone) return <Redirect href='/(onboarding)/terms' />;
  return <Redirect href='/(tabs)' />;
}
