import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../lib/theme';
import {
  getCycleAnchor,
  setCycleAnchor,
  getCycleDayFor,
  getCyclePhase,
  toLocalYMD,
} from '../lib/cycle';

import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CHIP_BG = 'rgba(148,163,184,0.15)';
const CHIP_BG_ACTIVE = 'rgba(14,165,233,0.2)';

export default function Settings() {
  const { colors, choice, resolved, setChoice } = useTheme();

  // Cycle anchor state
  const [anchor, setAnchorState] = useState<string>(''); // YYYY-MM-DD
  const [showPicker, setShowPicker] = useState(false);

  const parsedDate = useMemo(() => {
    if (!anchor) return null;
    const [y, m, d] = anchor.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }, [anchor]);

  const cycleDay = anchor ? getCycleDayFor(anchor) : null;
  const cyclePhase = cycleDay ? getCyclePhase(cycleDay) : null;

  useEffect(() => {
    getCycleAnchor().then(setAnchorState).catch(() => {});
  }, []);

  function onChangeDate(_e: DateTimePickerEvent, date?: Date) {
    if (!date) {
      setShowPicker(false);
      return;
    }
    const ymd = toLocalYMD(date);
    setAnchorState(ymd);
    setCycleAnchor(ymd).catch(() => {});
    setShowPicker(false);
  }

  function setTodayAsDay1() {
    const ymd = toLocalYMD(new Date());
    setAnchorState(ymd);
    setCycleAnchor(ymd).catch(() => {});
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={{ height: 12 }} />

      {/* Theme section */}
      <Text style={[styles.section, { color: colors.inactive }]}>Theme</Text>
      <View style={styles.row}>
        {(['system', 'light', 'dark'] as const).map((opt) => {
          const active = choice === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setChoice(opt)}
              style={[
                styles.chip,
                { backgroundColor: active ? CHIP_BG_ACTIVE : CHIP_BG, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: active ? colors.active : colors.text, fontWeight: '600' }}>
                {opt.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 12 }} />
      <Text style={{ color: colors.inactive, fontSize: 12 }}>
        Resolved: <Text style={{ color: colors.text, fontWeight: '600' }}>{resolved.toUpperCase()}</Text>
      </Text>

      <View style={{ height: 20 }} />

      {/* Cycle section */}
      <Text style={[styles.section, { color: colors.inactive }]}>Cycle</Text>

      <View style={[styles.card, { borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Cycle Anchor</Text>
        <Text style={{ color: colors.inactive, marginTop: 4 }}>
          {anchor ? new Date(anchor).toLocaleDateString() : '—'}
        </Text>

        <View style={{ height: 10 }} />

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={[styles.chip, { backgroundColor: CHIP_BG, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>Change date…</Text>
          </Pressable>

          <Pressable
            onPress={setTodayAsDay1}
            style={[styles.chip, { backgroundColor: CHIP_BG, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>Set today as Day 1</Text>
          </Pressable>
        </View>

        <View style={{ height: 12 }} />
        <Text style={{ color: colors.inactive, fontSize: 12 }}>
          {cycleDay ? `Now: Day ${cycleDay} • Phase: ${cyclePhase}` : '—'}
        </Text>
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

      {showPicker && (
        <DateTimePicker
          mode="date"
          value={parsedDate ?? new Date()}
          onChange={onChangeDate}
          display="default"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, paddingTop: 20, paddingBottom: 20, paddingHorizontal: 28,
  },
  title: { fontSize: 22, fontWeight: '700' },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  card: { borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 8 },
  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
