// app/(onboarding)/email-pending.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function EmailPending() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase.auth.getUser();
      const confirmed = data?.user?.email_confirmed_at !== null;

      if (confirmed) {
        clearInterval(interval);
        router.replace('/(onboarding)/terms');
      } else {
        setChecking(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/ba_logo.png')} style={styles.logo} />
      <Text style={styles.title}>Confirm your email</Text>
      <Text style={styles.body}>
        We've sent a confirmation link to your inbox. Once confirmed, you'll continue setup.
      </Text>
      {checking ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <Text style={styles.hint}>Still waiting… check your spam folder if needed.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24, justifyContent: 'center' },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 24 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  body: { color: '#ccc', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  hint: { color: '#666', textAlign: 'center', marginTop: 20 },
});
