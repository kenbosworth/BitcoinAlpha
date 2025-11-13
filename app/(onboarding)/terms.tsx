import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Image, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context'; // ✅ NEW IMPORT

export default function Terms() {
  const { reloadProfile } = useAuth(); // ✅ NEW: Get reload function from context
  const [busy, setBusy] = useState(false);

  async function agree() {
    try {
      setBusy(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/agree-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ termsVersion: 'v1' }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to agree terms');
      }
      
      // ✅ NEW: Reload profile so gate sees updated terms_agreed_at
      // This triggers the gate to re-evaluate and navigate to promo automatically
      await reloadProfile();
      
      // ✅ REMOVED: router.replace('/(onboarding)/promo')
      // The gate handles navigation now that profile is fresh
      
    } catch (e: any) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../assets/ba_logo.png')} style={styles.logo} />
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.body}>
        {/* Replace with your T&C summary or render from MD */}
        By using Bitcoin Alpha, you agree to our Terms and acknowledge our Privacy Policy...
      </Text>
      <Pressable style={[styles.button, busy && { opacity: 0.7 }]} onPress={agree} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Saving…' : 'I Agree'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  body: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  button: { backgroundColor: '#f7931a', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});