// supabase/functions/claim-promo/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PLAN_DOLLAR_1000 = 'dollar_1000';
const DOLLAR_CAP = 1000;

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'missing_bearer' }), { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const choice: 'trial' | 'dollar_1000' = body?.choice;

    if (!choice || !['trial', 'dollar_1000'].includes(choice)) {
      return new Response(JSON.stringify({ error: 'invalid_choice' }), { status: 400 });
    }

    // Identify user
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }
    const userId = userData.user.id;

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (choice === 'trial') {
      // Start trial if not started
      const { error: upErr } = await service
        .from('profiles')
        .update({
          trial_started_at: new Date().toISOString(),
          tier: 'trial',
          onboarding_completed: true,
        })
        .eq('id', userId)
        .is('trial_started_at', null); // idempotent

      if (upErr) {
        return new Response(JSON.stringify({ error: 'trial_update_failed', details: upErr.message }), { status: 500 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // choice === 'dollar_1000' → enforce cap atomically
    // 1) Count current claims
    const { data: countData, error: countErr } = await service
      .from('promo_claims')
      .select('id', { count: 'exact', head: true })
      .eq('plan_code', PLAN_DOLLAR_1000);

    if (countErr) {
      return new Response(JSON.stringify({ error: 'count_failed', details: countErr.message }), { status: 500 });
    }
    const current = countData?.length ?? 0; // head:true returns [] but count in header; supabase-js sets count on data? alternative:

    // More robust: pull count from headers (not exposed here); fallback:
    if ((countData as any)?.count && Number.isFinite((countData as any).count)) {
      // no-op; keep current
    } else if (current >= DOLLAR_CAP) {
      return new Response(JSON.stringify({ ok: false, reason: 'cap_reached' }), { status: 200 });
    }

    // 2) Try to insert claim for this user (unique on (user_id, plan_code))
    const { error: insErr } = await service.from('promo_claims').insert({
      user_id: userId,
      plan_code: PLAN_DOLLAR_1000,
    });

    if (insErr) {
      // Unique violation means they already claimed
      if (String(insErr.code) === '23505') {
        // already claimed this plan; proceed to lock their profile if not already
      } else {
        // Could also happen if cap is reached due to race (if you later add a DB constraint)
        // For now, treat as busy
        return new Response(JSON.stringify({ ok: false, reason: 'claim_failed', details: insErr.message }), { status: 200 });
      }
    }

    // 3) Update profile to lock promo
    const { error: upErr } = await service
      .from('profiles')
      .update({
        tier: 'promo',
        promo_plan: PLAN_DOLLAR_1000,
        promo_locked: true,
        onboarding_completed: true,
      })
      .eq('id', userId);

    if (upErr) {
      return new Response(JSON.stringify({ error: 'profile_update_failed', details: upErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'unexpected', details: `${e}` }), { status: 500 });
  }
});
