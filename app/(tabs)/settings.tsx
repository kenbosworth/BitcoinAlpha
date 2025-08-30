// app/settings.tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { registerPushToken } from '../../lib/notifications';
import { useTheme } from '../../lib/theme';
import { Link } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { colors, choice, resolved, setChoice } = useTheme();
  const [pushMsg, setPushMsg] = useState<string>('');
  const [dailyCycleDate, setDailyCycleDate] = useState<Date>(new Date());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);
      setLoading(false);
      if (!currentSession) router.replace('/signin');
    });
  }, []);

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'cycle_anchor')
      .single()
      .then(({ data }) => {
        if (data?.value) {
          setDailyCycleDate(new Date(data.value));
        }
      });
  }, []);

  async function onEnablePush() {
    setPushMsg('');
    const res = await registerPushToken();
    setPushMsg(
      res.ok
        ? 'Notifications enabled on this device'
        : res.reason === 'simulator'
        ? 'Use a physical device for push (simulator cannot receive)'
        : res.reason === 'permission-denied'
        ? 'Permission denied — enable notifications in iOS Settings'
        : res.reason === 'missing-projectId'
        ? 'Project ID missing in app.config.ts → extra.eas.projectId'
        : res.reason
    );
  }

  async function onSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error signing out', error.message);
    else router.replace('/signin');
  }

  const handleDateChange = async (_: any, date?: Date) => {
    if (date) {
      setDailyCycleDate(date);
      const isoDate = date.toISOString().split('T')[0];
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'cycle_anchor', value: isoDate }, { onConflict: ['key'] });

      Alert.alert(error ? 'Error' : 'Success', error ? error.message : 'Cycle anchor updated.');
    }
  };

  const referralCode = session?.user?.id.slice(0, 6);
  const inviteLink = `https://app.getbitcoinalpha.com/invite/${referralCode}`;
  const isAdmin = session?.user?.email === 'ken.bosworth@gmail.com';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color={colors.text} />
      </SafeAreaView>
    );
  }

  if (!session) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}> 
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Theme section */}
        <Text style={[styles.section, { color: colors.inactive }]}>Theme</Text>
        <View style={styles.row}>
          {(['system', 'light', 'dark'] as const).map((opt) => {
            const active = choice === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setChoice(opt)}
                style={[styles.chip, {
                  backgroundColor: active ? 'rgba(14,165,233,0.2)' : 'rgba(148,163,184,0.15)',
                  borderColor: colors.border,
                }]}
              >
                <Text style={{ color: active ? colors.active : colors.text, fontWeight: '600' }}>
                  {opt.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: colors.inactive, fontSize: 12, marginTop: 12 }}>
          Resolved: <Text style={{ color: colors.text, fontWeight: '600' }}>{resolved.toUpperCase()}</Text>
        </Text>

        {/* Notifications section */}
        <Text style={[styles.section, { color: colors.inactive, marginTop: 24 }]}>Notifications</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Push</Text>
          <View style={{ height: 10 }} />
          <Pressable
            onPress={onEnablePush}
            style={[styles.chip, { backgroundColor: 'rgba(148,163,184,0.15)', borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>Enable push on this device</Text>
          </Pressable>
          {!!pushMsg && (
            <Text style={{
              color: pushMsg.startsWith('Notifications enabled') ? colors.active : '#f43f5e',
              marginTop: 8,
              fontSize: 12,
            }}>
              {pushMsg}
            </Text>
          )}
          <Text style={{ color: colors.inactive, marginTop: 8, fontSize: 12 }}>
            Note: iOS Simulator cannot receive push.
          </Text>
        </View>

        {/* Referral section */}
        <Text style={[styles.section, { color: colors.inactive, marginTop: 24 }]}>Referral</Text>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Your Invite Code</Text>
          <Text style={{ color: colors.inactive, marginTop: 4 }}>{referralCode}</Text>
          <View style={{ height: 10 }} />
          <Text style={{ color: colors.text }}>Share this link:</Text>
          <Text selectable style={{ color: colors.active, marginTop: 4 }}>{inviteLink}</Text>
        </View>

        {/* About section */}
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Link href="/about" asChild>
            <Pressable style={styles.rowItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="information-circle-outline" size={18} color={colors.inactive} />
                <Text style={{ color: colors.text, fontWeight: '700' }}>About Bitcoin Alpha</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inactive} />
            </Pressable>
          </Link>
          <Text style={{ color: colors.inactive, marginTop: 6, fontSize: 12 }}>
            What it is, how to use it, and legal notes.
          </Text>
        </View>

        {/* Admin panel (if admin) */}
        {isAdmin && (
          <View style={[styles.card, { borderColor: colors.border }]}>
            <Pressable onPress={() => router.push('/admin')} style={styles.rowItem}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>Go to Admin Panel</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.inactive} />
            </Pressable>
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Set Daily Cycle Start</Text>
              <DateTimePicker
                value={dailyCycleDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                themeVariant="dark"
                textColor="white"
              />
            </View>
          </View>
        )}

        {/* Sign out */}
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Pressable onPress={onSignOut} style={styles.rowItem}>
            <Text style={{ color: '#f43f5e', fontWeight: '700' }}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 28,
  },
  title: { fontSize: 22, fontWeight: '700' },
  section: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 12,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
