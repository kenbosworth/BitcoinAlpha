import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

async function callClaim(choice: 'trial' | 'dollar_1000') {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim-promo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ choice }),
  });
  const json = await res.json();
  return { ok: res.ok && json?.ok === true, json };
}

export default function Promo() {
  const [busy, setBusy] = useState<'trial' | 'dollar_1000' | null>(null);

  async function selectTrial() {
    try {
      setBusy('trial');
      const { ok, json } = await callClaim('trial');
      if (!ok) throw new Error(json?.error || 'Failed to start trial');
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function selectDollar() {
    try {
      setBusy('dollar_1000');
      const { ok, json } = await callClaim('dollar_1000');
      if (!ok) {
        if (json?.reason === 'cap_reached') {
          Alert.alert('Sorry', 'The $1/month founder plan has reached its cap. You can start a 30‑day free trial instead.');
        } else {
          Alert.alert('Error', json?.reason || 'Unable to lock promo');
        }
        return;
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/ba_logo.png')} style={styles.logo} />
      <Text style={styles.title}>Choose your plan</Text>

      <Pressable style={[styles.card]} onPress={selectTrial} disabled={busy !== null}>
        <Text style={styles.planTitle}>30‑day Free Trial</Text>
        <Text style={styles.planSub}>then $2.99/month (subject to change)</Text>
        <Text style={[styles.cta, busy === 'trial' && { opacity: 0.7 }]}>{busy === 'trial' ? 'Starting…' : 'Start free trial'}</Text>
      </Pressable>

      <Pressable style={[styles.card]} onPress={selectDollar} disabled={busy !== null}>
        <Text style={styles.planTitle}>Founders’ Price</Text>
        <Text style={styles.planSub}>$1/month while active — capped at first 1,000</Text>
        <Text style={[styles.cta, busy === 'dollar_1000' && { opacity: 0.7 }]}>{busy === 'dollar_1000' ? 'Locking…' : 'Lock $1/mo'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  card: { backgroundColor: '#111', borderColor: '#333', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16 },
  planTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  planSub: { color: '#aaa', fontSize: 14, marginBottom: 10 },
  cta: { color: '#fff', fontWeight: '700', textAlign: 'center', backgroundColor: '#f7931a', paddingVertical: 10, borderRadius: 10, marginTop: 6 },
});
