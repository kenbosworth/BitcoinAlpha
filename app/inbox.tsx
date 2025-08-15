import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../lib/theme';
import { getAlerts, type AlertRow } from '../services/alerts';
import { parseTs } from '../services/prices'; // reuse our safe timestamp parser

export default function Inbox() {
  const { colors } = useTheme();
  const [items, setItems] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(initial = false) {
    try {
      if (initial) setLoading(true);
      setError(null);
      const data = await getAlerts(50, 0);
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load alerts');
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
      return () => {};
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  const renderItem: ListRenderItem<AlertRow> = ({ item }) => (
    <View style={[styles.card, { borderColor: colors.border }]}>
      {!!item.title && (
        <Text style={{ color: colors.text, fontWeight: '700' }}>{item.title}</Text>
      )}
      {!!item.body && (
        <Text style={{ color: colors.inactive, marginTop: 4 }} selectable>
          {item.body}
        </Text>
      )}
      <View style={styles.metaRow}>
        {(item.cycle_day ?? null) && (
          <Text style={{ color: colors.inactive, fontSize: 12 }}>
            Day {item.cycle_day} • {item.cycle_phase ?? '—'}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        <Text style={{ color: colors.inactive, fontSize: 12 }}>
          {timeAgo(item.created_at)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Inbox</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.active}
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 20 }}>
            <Text style={{ color: colors.inactive }}>
              {loading ? 'Loading…' : error ? error : 'No alerts yet.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function timeAgo(iso: string) {
  const t = parseTs(iso);
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
