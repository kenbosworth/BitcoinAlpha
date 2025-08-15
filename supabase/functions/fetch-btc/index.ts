// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SYMBOL = "BTCUSD";
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// ---------- Providers ----------
async function cgLatest() {
  const r = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true",
    { headers: { accept: "application/json" } }
  );
  if (!r.ok) throw new Error(`cg_simple ${r.status}`);
  const j = await r.json();
  const price = Number(j?.bitcoin?.usd);
  const updated = Number(j?.bitcoin?.last_updated_at) * 1000;
  if (!price || !updated) throw new Error("cg_simple_payload");
  return { ts: new Date(updated).toISOString(), price };
}

async function cgBackfill() {
  const r = await fetch(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=minute",
    { headers: { accept: "application/json" } }
  );
  if (!r.ok) throw new Error(`cg_chart ${r.status}`);
  const j = await r.json();
  const rows = (j?.prices ?? []) as [number, number][];
  return rows.map(([ms, price]) => ({ ts: new Date(ms).toISOString(), price }));
}

async function cbSpotLatest() {
  const r = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
    headers: { accept: "application/json", "user-agent": "bitcoin-alpha/1.0" },
  });
  if (!r.ok) throw new Error(`cb_spot ${r.status}`);
  const j = await r.json();
  const price = Number(j?.data?.amount);
  if (!price) throw new Error("cb_spot_payload");
  return { ts: new Date().toISOString(), price };
}

// Coinbase candles API returns max 300 points. We’ll chunk 24h into 5-hour windows.
async function cbBackfillPaginated() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const CHUNK_MINUTES = 300; // 5 hours
  const granularity = 60;    // 1 minute

  // Build [start, end) chunk windows of <=300 minutes each
  const windows: Array<{ s: Date; e: Date }> = [];
  for (let s = new Date(start); s < end; ) {
    const e = new Date(Math.min(s.getTime() + CHUNK_MINUTES * 60_000, end.getTime()));
    windows.push({ s: new Date(s), e });
    s = e;
  }

  const all: Array<{ ts: string; price: number }> = [];
  for (const w of windows) {
    const url = new URL("https://api.exchange.coinbase.com/products/BTC-USD/candles");
    url.searchParams.set("granularity", String(granularity));
    url.searchParams.set("start", w.s.toISOString());
    url.searchParams.set("end", w.e.toISOString());

    const r = await fetch(url.toString(), {
      headers: { accept: "application/json", "user-agent": "bitcoin-alpha/1.0" },
    });
    if (!r.ok) {
      // Skip bad window; continue with others
      continue;
    }
    const arr = (await r.json()) as [number, number, number, number, number, number][];
    // Format: [time, low, high, open, close, volume], newest first
    for (const [sec, _low, _high, _open, close] of arr) {
      all.push({ ts: new Date(sec * 1000).toISOString(), price: Number(close) });
    }
    // Be polite to API (optional)
    await new Promise((res) => setTimeout(res, 120));
  }

  // Dedupe & sort ascending
  const map = new Map<string, number>();
  for (const r of all) map.set(r.ts, r.price);
  return Array.from(map.entries())
    .map(([ts, price]) => ({ ts, price }))
    .sort((a, b) => a.ts.localeCompare(b.ts));
}

// ---------- Upsert helper ----------
async function upsertRows(rows: Array<{ ts: string; price: number }>) {
  if (!rows.length) return { count: 0 };
  const payload = rows.map((r) => ({ symbol: SYMBOL, ts: r.ts, price: r.price }));
  const { error } = await sb.from("prices_intraday").upsert(payload, { onConflict: "symbol,ts" });
  if (error) throw error;
  return { count: rows.length };
}

// ---------- HTTP handler ----------
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const doBackfill = url.searchParams.get("backfill") === "1";

    if (doBackfill) {
      let rows: Array<{ ts: string; price: number }> = [];
      try {
        rows = await cgBackfill();
      } catch (_cgErr) {
        rows = await cbBackfillPaginated();
      }
      if (!rows.length) throw new Error("no-backfill-rows");
      const res = await upsertRows(rows);
      return new Response(JSON.stringify({ ok: true, mode: "backfill", ...res }), {
        headers: { "content-type": "application/json" },
      });
    }

    // latest
    let row: { ts: string; price: number } | null = null;
    try {
      row = await cgLatest();
    } catch (_cgErr) {
      row = await cbSpotLatest();
    }
    if (!row) throw new Error("no-latest-row");
    const res = await upsertRows([row]);
    return new Response(JSON.stringify({ ok: true, mode: "latest", ...res }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
