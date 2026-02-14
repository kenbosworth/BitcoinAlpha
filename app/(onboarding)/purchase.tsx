import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';
import { getOfferings, purchasePackage } from '../../lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

type OfferingType = 'founders' | 'default';

export default function Purchase() {
  const { reloadProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [offeringType, setOfferingType] = useState<OfferingType>('default');
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  async function loadOfferings() {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .single();

      const isFounder = profile?.tier === 'promo';
      const offeringId = isFounder ? 'founders' : 'default';
      setOfferingType(offeringId);

      console.log(`Loading ${offeringId} offering...`);

      const offerings = await getOfferings();
      const offering = offerings[offeringId];

      if (!offering) {
        throw new Error(`Offering "${offeringId}" not found in RevenueCat`);
      }

      console.log('Offering packages:', offering.availablePackages.map(p => p.identifier));

      const monthly = offering.availablePackages.find(
        p => p.packageType === 'MONTHLY' || p.identifier.includes('monthly')
      );
      const annual = offering.availablePackages.find(
        p => p.packageType === 'ANNUAL' || p.identifier.includes('annual')
      );

      if (!monthly || !annual) {
        throw new Error('Could not find monthly or annual packages');
      }

      setMonthlyPackage(monthly);
      setAnnualPackage(annual);
    } catch (e: any) {
      console.error('Error loading offerings:', e);
      Alert.alert(
        'Error',
        'Unable to load subscription options. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(pkg: PurchasesPackage) {
    try {
      setPurchasing(true);
      console.log('Attempting purchase:', pkg.identifier);

      const { customerInfo, productIdentifier } = await purchasePackage(pkg);

      console.log('Purchase successful!', {
        productIdentifier,
        entitlements: Object.keys(customerInfo.entitlements.active)
      });

      if (customerInfo.entitlements.active['premium']) {
        console.log('Premium entitlement confirmed, waiting for webhook...');
        
        const statusUpdated = await waitForSubscriptionStatus();
        
        if (statusUpdated) {
          Alert.alert('Success!', 'Your subscription is now active.');
        } else {
          Alert.alert('Success!', 'Your subscription is active. If you experience any issues, please restart the app.');
        }
        
        await reloadProfile();
        router.replace('/(tabs)');
      } else {
        throw new Error('Purchase completed but premium entitlement not active');
      }
    } catch (e: any) {
      console.error('Purchase error:', e);
      
      if (e.userCancelled) {
        return;
      }

      Alert.alert(
        'Purchase Failed',
        e.message || 'Unable to complete purchase. Please try again.'
      );
    } finally {
      setPurchasing(false);
    }
  }

  async function waitForSubscriptionStatus(maxAttempts = 10, delayMs = 1000): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Checking subscription status (attempt ${i + 1}/${maxAttempts})...`);
      
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status')
        .single();
      
      if (data?.subscription_status === 'active' || data?.subscription_status === 'trialing') {
        console.log('✅ Subscription status confirmed:', data.subscription_status);
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    console.warn('⚠️ Webhook did not update status in time, proceeding anyway');
    return false;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#f7931a" />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  const isFounders = offeringType === 'founders';

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/ba_logo.png')} style={styles.logo} />
      
      <Text style={styles.title}>
        {isFounders ? '🔥 Founders Pricing' : '✨ Early Adopter Pricing'}
      </Text>
      <Text style={styles.subtitle}>
        {isFounders 
          ? 'Locked in as long as you keep your subscription'
          : 'Start with a 7-day free trial'
        }
      </Text>

      {annualPackage && (
        <Pressable
          style={[styles.card, styles.recommendedCard]}
          onPress={() => handlePurchase(annualPackage)}
          disabled={purchasing}
        >
          <Text style={styles.recommendedBadge}>BEST VALUE</Text>
          <Text style={styles.planTitle}>Annual Plan</Text>
          <Text style={styles.priceMain}>
            {annualPackage.product.priceString}/year
          </Text>
          <Text style={styles.priceSub}>
            {isFounders ? '$0.82/month' : '$1.25/month'} • Save 17%
          </Text>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>
              {purchasing ? 'Processing purchase...' : `Subscribe for ${annualPackage.product.priceString}`}
            </Text>
          </View>
        </Pressable>
      )}

      {monthlyPackage && (
        <Pressable
          style={styles.card}
          onPress={() => handlePurchase(monthlyPackage)}
          disabled={purchasing}
        >
          <Text style={styles.planTitle}>Monthly Plan</Text>
          <Text style={styles.priceMain}>
            {monthlyPackage.product.priceString}/month
          </Text>
          <Text style={styles.priceSub}>
            {isFounders ? 'Billed monthly' : '7-day free trial, then billed monthly'}
          </Text>
          <View style={[styles.ctaButton, styles.ctaButtonSecondary]}>
            <Text style={[styles.ctaText, styles.ctaTextSecondary]}>
              {purchasing ? 'Processing purchase...' : `Subscribe for ${monthlyPackage.product.priceString}`}
            </Text>
          </View>
        </Pressable>
      )}

      <Text style={styles.footnote}>
        Cancel anytime from your Apple ID settings
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#111',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  recommendedCard: {
    borderColor: '#f7931a',
    borderWidth: 2,
  },
  recommendedBadge: {
    color: '#f7931a',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  planTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceMain: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  priceSub: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#f7931a',
    paddingVertical: 14,
    borderRadius: 10,
  },
  ctaButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#f7931a',
    borderWidth: 1,
  },
  ctaText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  ctaTextSecondary: {
    color: '#f7931a',
  },
  footnote: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 24,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});