import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../lib/theme';
import Constants from 'expo-constants';

type SectionProps = { title: string; children: React.ReactNode };
function Section({ title, children }: SectionProps) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{title}</Text>
      <Text style={{ color: colors.inactive, marginTop: 6, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export default function About() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}> 
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>About Bitcoin Alpha</Text>
        <Text style={[styles.subtitle, { color: colors.inactive }]}>A focused companion for cycle‑aware Bitcoin watchers.</Text>

        <Section title="What it is">
          Bitcoin Alpha shows a cached Bitcoin price with a lightweight 24h chart, plus a 60‑day cycle day/phase indicator and broadcast alerts authored by the team.
        </Section>

        <Section title="Why it matters">
          We present price and cycle context with minimal noise so you can glance, decide, and move. The 60‑day cycle framing helps orient short‑to‑medium‑term expectations.
        </Section>

        <Section title="How to use it">
          Check the Home price and sparkline, note the current cycle Day/Phase, and read Inbox alerts. Enable notifications to receive important broadcast updates.
        </Section>

        <Section title="Data & freshness">
          Prices are fetched server‑side roughly every minute and cached. Displayed values may be delayed or temporarily stale; network conditions and providers can affect timing.
        </Section>

        <Section title="Notifications">
          If enabled, we may send broadcast alerts related to price action or cycle context. You can disable notifications anytime in your system settings.
        </Section>

        <Section title="Legal">
          This app is for informational purposes only and does not constitute investment advice. No guarantee of accuracy or fitness for any purpose. Use at your own risk.
        </Section>

        <View style={{ height: 20 }} />
        <Text style={{ color: colors.inactive, fontSize: 12 }}>
            Version {Constants.expoConfig?.version ?? '0.0.0'}
          </Text>
          <Text style={{ color: colors.inactive, fontSize: 12, marginTop: 4 }}>
            © {new Date().getFullYear()} Bitcoin Alpha.
          </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 20 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, fontSize: 13 },
});