import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import Svg, { Line, Circle } from 'react-native-svg';

import { useTheme } from '../../lib/theme';
import { getPrices24h, calcDelta, isStale, PriceRow } from '../../services/prices';
import Sparkline from '../../components/Sparkline';
import { getCycleAnchor, getCycleDayFor, getCyclePhase } from '../../lib/cycle';
import { getLatestAlert, type AlertRow } from '../../services/alerts';
import { getLatestAlphaNote, type AlphaNote } from '../../services/alphaNotes';

const CHART_W = 320;
const CHART_H = 96;

export default function Home() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [anchor, setAnchor] = useState<Date | null>(null);
  const [latestAlert, setLatestAlert] = useState<AlertRow | null>(null);
  const [latestNote, setLatestNote] = useState<AlphaNote | null>(null);

  async function loadPrices() {
    setError(null);
    try {
      const r = await getPrices24h();
      setRows(r);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function loadAlert() {
    try {
      const a = await getLatestAlert();
      setLatestAlert(a);
    } catch {}
  }

  async function loadAlphaNote() {
    try {
      const n = await getLatestAlphaNote();
      setLatestNote(n);
    } catch {}
  }

  useEffect(() => {
    // initial loads
    loadPrices();
    loadAlert();
    loadAlphaNote();
    getCycleAnchor().then(setAnchor).catch(() => {});

    // minute polling
    const id = setInterval(() => {
      loadPrices();
      loadAlert();
      loadAlphaNote();
    }, 60_000);

    return () => clearInterval(id);
  }, []);

  useFocusEffect(
  useCallback(() => {
    loadPrices();
    loadAlert();
    loadAlphaNote();
    getCycleAnchor().then(setAnchor).catch(() => {});
    return () => {};
  }, [])
);


  const latest = rows.at(-1);
        useEffect(() => {
      if (latest?.ts) {
        const now = Date.now();
        const then = Date.parse(latest.ts);
        const ageMs = now - then;
        //console.log('[debug] Latest price ts:', latest.ts);
        //console.log('[debug] Now (client):', new Date(now).toISOString());
        //console.log('[debug] Age (ms):', ageMs, '| Age (sec):', Math.floor(ageMs / 1000));
        //console.log('[debug] typeof latest.ts:', typeof latest.ts);
      //} else {
       // console.log('[debug] No latest price or ts is undefined.');
      }
    }, [latest?.ts]);

  const delta = useMemo(() => calcDelta(rows), [rows]);
  const stale = isStale(latest?.ts);
  const values = useMemo(() => rows.map((r) => Number(r.price)), [rows]);

  // Range bar inputs
  const hasSeries = values.length >= 2 && values.every((v) => Number.isFinite(v));
  const low = hasSeries ? Math.min(...values) : null;
  const high = hasSeries ? Math.max(...values) : null;
  const cur = latest ? Number(latest.price) : null;
  const pct =
    low != null && high != null && cur != null && high > low
      ? (cur - low) / (high - low)
      : null;

  // Cycle
  const cycleDay = anchor ? getCycleDayFor(anchor) : null;
  const cyclePhase = cycleDay ? getCyclePhase(cycleDay) : null;

  // pull-to-refresh
  const onRefresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPrices(), loadAlert(), loadAlphaNote()]);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.active} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderColor: colors.border }]}>
          <Text style={[styles.brand, { color: colors.text }]}>Bitcoin Alpha</Text>
        </View>

        {/* Title + price row */}
        <Text style={[styles.title, { color: colors.text }]}>Bitcoin (BTC)</Text>

        <View style={styles.row}>
          <Text style={[styles.price, { color: colors.text }]}>
            {latest
              ? `$${Number(latest.price).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
              : '—'}
          </Text>
          {!!latest && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    delta.pct >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: delta.pct >= 0 ? '#10b981' : '#f43f5e',
                  fontWeight: '700',
                }}
              >
                {delta.pct >= 0 ? '▲' : '▼'} {delta.pct.toFixed(2)}%
              </Text>
            </View>
          )}
          {stale ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: 'rgba(234,179,8,0.15)', borderColor: colors.border },
              ]}
            >
              <Text style={{ color: '#eab308', fontWeight: '700' }}>STALE</Text>
            </View>
          ) : (
            !!latest && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: colors.border },
                ]}
              >
                <Text style={{ color: '#10b981', fontWeight: '700' }}>LIVE</Text>
              </View>
            )
          )}
        </View>

        <View style={{ height: 8 }} />

        {/* Sparkline + Range bar */}
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Sparkline width={CHART_W} height={CHART_H} values={values} color={colors.active} />
          {hasSeries && low != null && high != null && cur != null && pct != null && (
            <View style={{ marginTop: 10 }}>
              {/* Range graphic */}
              <Svg width={CHART_W} height={22}>
                {/* track */}
                <Line
                  x1={4}
                  y1={11}
                  x2={CHART_W - 4}
                  y2={11}
                  stroke={colors.border}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {/* current dot */}
                <Circle cx={4 + pct * (CHART_W - 8)} cy={11} r={5} fill={colors.active} />
              </Svg>
              {/* labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.inactive, fontSize: 12 }}>
                  Low {formatUsd(low)}
                </Text>
                <Text style={{ color: colors.inactive, fontSize: 12 }}>
                  High {formatUsd(high)}
                </Text>
              </View>
            </View>
          )}
          {!hasSeries && (
            <Text style={{ color: colors.inactive, fontSize: 12, marginTop: 6 }}>
              {loading ? 'Loading…' : error ? error : 'No series yet'}
            </Text>
          )}
        </View>

        <View style={{ height: 12 }} />

        {/* Cycle pill */}
        <View style={[styles.pill, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Cycle</Text>
          <Text style={{ color: colors.inactive, marginLeft: 8 }}>
            {anchor && cycleDay && cyclePhase ? `Day ${cycleDay} • Phase: ${cyclePhase}` : '…'}
          </Text>
        </View>

        <View style={{ height: 12 }} />

        {/* Latest Alert preview */}
        <View style={[styles.card, { borderColor: colors.border }]}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Latest Alert</Text>
            <Link href="/inbox">
              <Text style={{ color: colors.active, fontWeight: '700' }}>View all →</Text>
            </Link>
          </View>
        {latestAlert ? (
          <View style={{ marginTop: 6 }}>
            {!!latestAlert.title && (
              <Text style={{ color: colors.text, fontWeight: '700' }}>{latestAlert.title}</Text>
            )}
            {!!latestAlert.body && (
              <Text style={{ color: colors.inactive, marginTop: 4 }} numberOfLines={6}>
                {latestAlert.body}
              </Text>
            )}
            {(latestAlert.cycle_day ?? null) && (
              <Text style={{ color: colors.inactive, marginTop: 4, fontSize: 12 }}>
                Day {latestAlert.cycle_day} • {latestAlert.cycle_phase ?? '—'}
              </Text>
            )}
          </View>
        ) : (
          <Text style={{ color: colors.inactive, marginTop: 4 }}>
            {error ? error : loading ? 'Loading…' : 'No alerts yet.'}
          </Text>
        )}
      </View>

      <View style={{ height: 12 }} />

      {/* Alpha Notes preview */}
      <View style={[styles.card, { borderColor: colors.border }]}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Alpha Notes</Text>
            <Link href="/alpha-notes">
              <Text style={{ color: colors.active, fontWeight: '700' }}>View all →</Text>
            </Link>
          </View>
        {latestNote ? (
          <View style={{ marginTop: 6 }}>
            {!!latestNote.title && (
              <Text style={{ color: colors.text, fontWeight: '700' }}>{latestNote.title}</Text>
            )}
            {!!latestNote.body && (
              <Text style={{ color: colors.inactive, marginTop: 4 }} numberOfLines={9}>
                {latestNote.body}
              </Text>
            )}
          </View>
        ) : (
          <Text style={{ color: colors.inactive, marginTop: 4 }}>No notes yet.</Text>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatUsd(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 8, marginBottom: 8 },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  price: { fontSize: 32, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  card: { borderWidth: 1, borderRadius: 16, padding: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  cardHeaderTitle: { fontSize: 18, fontWeight: '800' },
});