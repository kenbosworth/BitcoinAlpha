import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

// Check how many promo slots have been claimed
async function checkPromoCounter() {
  console.log('Checking promo counter...');
  const { data, error } = await supabase
    .from('promo_signup_counter')
    .select('count')
    .eq('id', 'singleton')
    .limit(1);
  
  console.log('Promo counter response:', { data, error });
  
  if (error) {
    console.error('Error checking promo counter:', error);
    return 1000; // Default to showing Early Adopter if we can't check
  }
  
  if (!data || data.length === 0) {
    console.warn('No promo counter row found, defaulting to Early Adopter');
    return 1000;
  }
  
  const count = data[0]?.count || 0;
  console.log('Current promo count:', count);
  return count;
}

// Call claim-promo for Founders tier
async function callClaimPromo() {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim-promo`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      Authorization: `Bearer ${token}` 
    },
  });
  const json = await res.json();
  return { ok: res.ok && json?.ok === true, json };
}

type PricingTier = 'founders' | 'early_adopter' | null;

export default function Promo() {
  const { reloadProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [tier, setTier] = useState<PricingTier>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineTier() {
      try {
        const count = await checkPromoCounter();
        const selectedTier = count < 1000 ? 'founders' : 'early_adopter';
        console.log(`Count: ${count}, Selected tier: ${selectedTier}`);
        setTier(selectedTier);
      } catch (e) {
        console.error('Error determining tier:', e);
        setTier('early_adopter'); // Default to Early Adopter on error
      } finally {
        setLoading(false);
      }
    }
    determineTier();
  }, []);

  async function selectFounders() {
    try {
      setBusy(true);
      const { ok, json } = await callClaimPromo();
      if (!ok) {
        if (json?.cappedOut) {
          Alert.alert(
            'Sorry', 
            'The Founders tier has reached its 1,000 user cap. Refreshing to show Early Adopter pricing...'
          );
          setTier('early_adopter'); // Switch to Early Adopter
        } else {
          Alert.alert('Error', json?.error || 'Unable to claim Founders tier');
        }
        return;
      }
      
      await reloadProfile();
      
      // Navigate to purchase screen to complete subscription
      router.push('/(onboarding)/purchase');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  function selectEarlyAdopter() {
    // Navigate directly to purchase screen for Early Adopter
    router.push('/(onboarding)/purchase');
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f7931a" />
        <Text style={styles.loadingText}>Loading pricing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/ba_logo.png')} style={styles.logo} />
      
      {tier === 'founders' ? (
        // FOUNDERS TIER (First 1,000 users)
        <>
          <Text style={styles.title}>Founders' Pricing 🎉</Text>
          <Text style={styles.subtitle}>
            Limited to first 1,000 users • Locked in as long as you are subscribed!
          </Text>
          
          <View style={styles.card}>
            <Text style={styles.badge}>🔥 FOUNDERS ONLY</Text>
            <Text style={styles.planTitle}>$0.99/month</Text>
            <Text style={styles.planSubBold}>or $9.99/year</Text>
            <Text style={styles.planSub}>
              No trial • Guaranteed price as long as you retain subscription • Exclusive access
            </Text>
            <Pressable 
              style={[styles.ctaButton, busy && styles.ctaButtonDisabled]}
              onPress={selectFounders}
              disabled={busy}
            >
              <Text style={styles.ctaText}>
                {busy ? 'Claiming...' : 'Claim Founders Price'}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        // EARLY ADOPTER TIER (After 1,000 users)
        <>
          <Text style={styles.title}>Early Adopter Pricing</Text>
          <Text style={styles.subtitle}>
            Start with a 7-day free trial
          </Text>
          
          <View style={styles.card}>
            <Text style={styles.badge}>✨ EARLY ADOPTER</Text>
            <Text style={styles.planTitle}>$1.99/month</Text>
            <Text style={styles.planSubBold}>or $14.99/year</Text>
            <Text style={styles.planSub}>
              7-day free trial • Cancel anytime • Full access
            </Text>
            <Pressable 
              style={[styles.ctaButton]}
              onPress={selectEarlyAdopter}
            >
              <Text style={styles.ctaText}>
                Start 7-Day Free Trial
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <Text style={styles.footnote}>
        {tier === 'founders' 
          ? '⚡ Act fast - only available to first 1,000 users'
          : '🎯 Early adopter pricing - may increase in the future'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', 
    padding: 20, 
    justifyContent: 'center' 
  },
  logo: { 
    width: 120, 
    height: 120, 
    alignSelf: 'center', 
    marginBottom: 16 
  },
  title: { 
    color: '#fff', 
    fontSize: 26, 
    fontWeight: '700', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  subtitle: { 
    color: '#aaa', 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 24 
  },
  card: { 
    backgroundColor: '#111', 
    borderColor: '#f7931a', 
    borderWidth: 2, 
    borderRadius: 16, 
    padding: 24, 
    marginBottom: 16 
  },
  badge: {
    color: '#f7931a',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1
  },
  planTitle: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: '800', 
    textAlign: 'center',
    marginBottom: 4 
  },
  planSubBold: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12
  },
  planSub: { 
    color: '#aaa', 
    fontSize: 14, 
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20
  },
  ctaButton: {
    backgroundColor: '#f7931a',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8
  },
  ctaButtonDisabled: {
    opacity: 0.6
  },
  ctaText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.5
  },
  footnote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16
  }
});