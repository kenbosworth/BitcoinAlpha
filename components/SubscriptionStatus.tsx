// components/SubscriptionStatus.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { getSubscriptionInfo, getProductDisplayName, restorePurchases } from '../lib/purchases';
import { supabase } from '../lib/supabase';

type SubscriptionInfo = {
  isActive: boolean;
  productId: string | null;
  willRenew: boolean;
  expirationDate: string | null;
  isInTrial: boolean;
  unsubscribeDetectedAt?: string | null;
  billingIssueDetectedAt?: string | null;
};

type DatabaseSubscription = {
  subscription_status: string | null;
  subscription_product_id: string | null;
  subscription_expires_at: string | null;
};

type SubscriptionStatusProps = {
  onRestoreComplete?: () => void;
};

export function SubscriptionStatus({ onRestoreComplete }: SubscriptionStatusProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [dbSub, setDbSub] = useState<DatabaseSubscription | null>(null);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  async function loadSubscriptionStatus() {
    try {
      setLoading(true);
      
      // Get RevenueCat subscription info
      const info = await getSubscriptionInfo();
      setSubInfo(info);

      // Get database subscription status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_product_id, subscription_expires_at')
          .eq('id', user.id)
          .single();
        
        setDbSub(data || null);
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
      Alert.alert('Error', 'Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestorePurchases() {
    try {
      setRestoring(true);
      const customerInfo = await restorePurchases();
      
      // Check if restoration found any active subscriptions
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      if (hasPremium) {
        Alert.alert(
          'Success!',
          'Your purchase has been restored. Your subscription is now active.',
          [{ text: 'OK', onPress: () => {
            loadSubscriptionStatus();
            onRestoreComplete?.();
          }}]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore. If you believe this is an error, please contact support.'
        );
      }
    } catch (error: any) {
      console.error('Restore purchases failed:', error);
      Alert.alert(
        'Restore Failed',
        'Failed to restore purchases. Please try again or contact support if the problem persists.'
      );
    } finally {
      setRestoring(false);
    }
  }

  function handleManageSubscription() {
    // Link to Apple's subscription management
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Determine if subscription is active from either source
  const isActive = subInfo?.isActive || dbSub?.subscription_status === 'active';
  
  // Use database info if RevenueCat doesn't have it
  const displayProductId = subInfo?.productId || dbSub?.subscription_product_id;
  const displayExpirationDate = subInfo?.expirationDate || dbSub?.subscription_expires_at;
  const isFromDatabase = !subInfo?.isActive && dbSub?.subscription_status === 'active';

  if (loading) {
    return (
      <View style={[styles.card, { borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons 
            name={isActive ? "checkmark-circle" : "alert-circle-outline"} 
            size={20} 
            color={isActive ? colors.active : colors.inactive} 
          />
          <Text style={[styles.title, { color: colors.text }]}>Subscription</Text>
        </View>
        {isActive && (
          <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.2)' }]}>
            <Text style={[styles.badgeText, { color: '#22c55e' }]}>Active</Text>
          </View>
        )}
      </View>

      {/* Subscription Details */}
      {isActive ? (
        <>
          <View style={styles.detail}>
            <Text style={[styles.label, { color: colors.inactive }]}>Plan</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {getProductDisplayName(displayProductId)}
            </Text>
          </View>

          {subInfo?.isInTrial && (
            <View style={[styles.trialBanner, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }]}>
              <Ionicons name="gift-outline" size={16} color="#3b82f6" />
              <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '600' }}>
                You're in your free trial period
              </Text>
            </View>
          )}

          <View style={styles.detail}>
            <Text style={[styles.label, { color: colors.inactive }]}>
              {subInfo?.willRenew ? 'Renews on' : 'Expires on'}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {formatDate(displayExpirationDate)}
            </Text>
          </View>

          {subInfo?.unsubscribeDetectedAt && (
            <View style={[styles.warningBanner, { backgroundColor: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.3)' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#fb923c" />
              <Text style={{ color: '#fb923c', fontSize: 13 }}>
                Subscription will not renew. Access until {formatDate(displayExpirationDate)}
              </Text>
            </View>
          )}

          {subInfo?.billingIssueDetectedAt && (
            <View style={[styles.warningBanner, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }]}>
              <Ionicons name="warning-outline" size={16} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>
                Billing issue detected. Please update your payment method.
              </Text>
            </View>
          )}

          {/* Show note if displaying database subscription */}
          {isFromDatabase && (
            <View style={[styles.infoBanner, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
              <Text style={{ color: '#3b82f6', fontSize: 12 }}>
                Subscription managed through account settings
              </Text>
            </View>
          )}

          {/* Manage Subscription Button */}
          <Pressable 
            onPress={handleManageSubscription}
            style={[styles.button, { backgroundColor: 'rgba(148,163,184,0.15)', borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>Manage Subscription</Text>
            <Ionicons name="open-outline" size={16} color={colors.inactive} />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.inactiveText, { color: colors.inactive }]}>
            No active subscription
          </Text>
          <Text style={[styles.inactiveSubtext, { color: colors.inactive }]}>
            Previously purchased? Restore your purchases to regain access.
          </Text>
        </>
      )}

      {/* Restore Purchases Button */}
      <Pressable 
        onPress={handleRestorePurchases}
        disabled={restoring}
        style={[styles.button, { 
          backgroundColor: 'rgba(14,165,233,0.1)', 
          borderColor: 'rgba(14,165,233,0.3)',
          marginTop: 12,
        }]}
      >
        {restoring ? (
          <ActivityIndicator size="small" color={colors.active} />
        ) : (
          <>
            <Ionicons name="refresh-outline" size={18} color={colors.active} />
            <Text style={{ color: colors.active, fontWeight: '600' }}>Restore Purchases</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detail: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  inactiveText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  inactiveSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
});
