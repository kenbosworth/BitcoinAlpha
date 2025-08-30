// deno-lint-ignore-file no-explicit-any
import { createClient } from "@supabase/supabase-js";

type SendBody = { title?: string; body?: string; cycle_day?: number; cycle_phase?: string; };
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function chunk<T>(a: T[], n: number) { const o:T[][]=[]; for (let i=0;i<a.length;i+=n) o.push(a.slice(i,i+n)); return o; }

Deno.serve(async (req) => {
  try {
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") ?? "";
    if (!serviceKey || bearer !== serviceKey) return new Response(JSON.stringify({ ok:false, error:"unauthorized" }), { status: 401 });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!; // provided by platform
    const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

    const p = (await req.json().catch(() => ({}))) as SendBody;

    // 1) Insert alert
    const { data: alertRow, error: insErr } = await supabase
      .from("alerts").insert({
        title: p.title ?? null, body: p.body ?? null,
        cycle_day: p.cycle_day ?? null, cycle_phase: p.cycle_phase ?? null,
      }).select("id").single();
    if (insErr) throw insErr;

    // 2) Fetch tokens
    const { data: devices, error: devErr } = await supabase
      .from("devices").select("id, expo_push_token");
    if (devErr) throw devErr;

    const tokens = (devices ?? []).map(d => d.expo_push_token).filter(Boolean);
    const batches = chunk(tokens, 100);

    let okCount = 0; const results:any[] = [];

    // 3) Send to Expo
    for (const batch of batches) {
      const messages = batch.map(to => ({
        to, sound: "default", title: p.title ?? "Bitcoin Alpha",
        body: p.body ?? "", priority: "high",
        data: { alert_id: alertRow.id, cycle_day: p.cycle_day, cycle_phase: p.cycle_phase },
      }));
      const res = await fetch(EXPO_PUSH_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(messages) });
      const json = await res.json().catch(() => ({}));
      const items = json?.data ?? [];
      results.push(...items);
      okCount += items.filter((x: any) => x?.status === "ok").length;

      // 4) Log deliveries
      const rows = items.map((it:any,i:number)=>({ alert_id: alertRow.id, device_id: null, push_token: batch[i], status: it?.status ?? (res.ok?'ok':'error'), details: it ?? {} }));
      if (rows.length) await supabase.from("alert_deliveries").insert(rows);
    }

    return new Response(JSON.stringify({ ok:true, alert_id: alertRow.id, sent: okCount, results }), { headers: { "content-type":"application/json" } });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error: String(e?.message ?? e) }), { status: 500, headers: { "content-type":"application/json" } });
  }
});

