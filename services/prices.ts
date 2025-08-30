import { supabase } from '../lib/supabase';

export type PriceRow = { symbol: string; ts: string; price: number };

export async function getPrices24h(symbol = 'BTCUSD') {
  const { data, error } = await supabase
    .from('prices_intraday')
    .select('symbol, ts, price')
    .eq('symbol', symbol)
    .order('ts', { ascending: false }) // newest first
    .limit(50); // adjust for your chart resolution

  if (error) throw error;

  return (data ?? []).reverse() as PriceRow[]; // oldest-to-newest for chart
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

export function isStale(ts?: string | null): boolean {
  if (!ts) return true;
  const then = Date.parse(ts); // safely respects timezones
  const now = Date.now();
  return now - then > 2 * 60_000; // 2 minutes = 120,000 ms
}

