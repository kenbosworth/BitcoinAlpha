import { supabase } from '../lib/supabase';

export type PriceRow = { symbol: string; ts: string; price: number };

export async function getPrices24h(symbol = 'BTCUSD') {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('prices_intraday')
    .select('symbol, ts, price')
    .eq('symbol', symbol)
    .gte('ts', sinceIso)
    .order('ts', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PriceRow[];
}

export function calcDelta(rows: PriceRow[]) {
  if (!rows.length) return { pct: 0, abs: 0 };
  const first = Number(rows[0].price);
  const last = Number(rows[rows.length - 1].price);
  const abs = last - first;
  const pct = first ? (abs / first) * 100 : 0;
  return { pct, abs };
}

/** Safe timestamp parser for iOS/Safari (normalizes space → 'T') */
export function parseTs(iso: string) {
  if (!iso) return NaN;
  const s = iso.includes('T') ? iso : iso.replace(' ', 'T');
  return Date.parse(s);
}

export function isStale(latestIso?: string, thresholdSec = 300) {
  if (!latestIso) return true;
  const t = parseTs(latestIso);
  if (Number.isNaN(t)) return true;
  const ageSec = (Date.now() - t) / 1000;
  return ageSec > thresholdSec;
}
