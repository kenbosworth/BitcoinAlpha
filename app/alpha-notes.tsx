// app/alpha-notes.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../lib/theme';
import { getAlphaNotes } from '../services/alphaNotes';
import type { AlphaNote } from '../services/alphaNotes';
import { parseTs } from '../services/prices';

export default function AlphaNotesScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<AlphaNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(initial = false) {
    try {
      if (initial) setLoading(true);
      setError(null);
      const rows = await getAlphaNotes(50, 0);
      setItems(rows);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load notes');
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

  const renderItem = ({ item }: { item: AlphaNote }) => (
    <View style={[styles.card, { borderColor: colors.border }]}>
      {!!item.title && (
        <Text style={{ color: colors.text, fontWeight: '700' }}>{item.title}</Text>
      )}
      {!!item.body && (
        <Text style={{ color: colors.inactive, marginTop: 6, lineHeight: 20 }}>
          {item.body}
        </Text>
      )}
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Text style={{ color: colors.inactive, fontSize: 12 }}>
          {new Date(parseTs(item.created_at)).toLocaleDateString()}
        </Text>
        <View style={{ flex: 1 }} />
        {item.category && (
          <Text
            style={{ color: colors.inactive, fontSize: 12, textTransform: 'capitalize' }}
          >
            {item.category}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>Alpha Notes</Text>

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
              {loading ? 'Loading…' : error ? error : 'No notes yet.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  card: { borderWidth: 1, borderRadius: 16, padding: 12 },
});
