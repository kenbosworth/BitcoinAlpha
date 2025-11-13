// supabase/functions/start-trial/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  // CORS not required for native apps, but harmless to include:
  if (!headers.has('access-control-allow-origin')) headers.set('access-control-allow-origin', '*');
  return new Response(JSON.stringify(body), { ...init, headers });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'authorization, content-type',
        },
      });
    }
    if (req.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, { status: 405 });
    }

    // 1) AuthN: derive user id from caller's JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'missing_bearer' }, { status: 401 });
    }

    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u, error: uerr } = await authed.auth.getUser();
    if (uerr || !u?.user?.id) {
      return json({ error: 'invalid_token', details: uerr?.message }, { status: 401 });
    }
    const userId = u.user.id;

    // 2) Read current profile to enforce one-time trial & subscription precedence
    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: prof, error: profErr } = await service
      .from('profiles')
      .select('id, tier, trial_started_at, trial_expires_at')
      .eq('id', userId)
      .maybeSingle();

    if (profErr) {
      return json({ error: 'profile_read_failed', details: profErr.message }, { status: 500 });
    }
    if (!prof) {
      // If you have a DB trigger that creates profiles on signup, this shouldn't happen.
      // Otherwise: create the profile row here or return 404.
      return json({ error: 'profile_not_found' }, { status: 404 });
    }

    // Already subscribed? (promo or standard)
    if (prof.tier === 'promo' || prof.tier === 'standard') {
      return json({ ok: false, error: 'already_subscribed', tier: prof.tier }, { status: 409 });
    }

    // Trial already consumed?
    if (prof.trial_started_at) {
      return json({ ok: false, error: 'trial_already_consumed' }, { status: 409 });
    }

    // 3) Start 30-day trial
    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: upErr } = await service
      .from('profiles')
      .update({
        tier: 'trial',
        trial_started_at: now.toISOString(),
        trial_expires_at: trialEnds.toISOString(),
      })
      .eq('id', userId);

    if (upErr) {
      return json({ error: 'update_failed', details: upErr.message }, { status: 500 });
    }

    return json({
      ok: true,
      tier: 'trial',
      trial_started_at: now.toISOString(),
      trial_expires_at: trialEnds.toISOString(),
    }, { status: 200 });
  } catch (e) {
    return json({ error: 'unexpected', details: String(e) }, { status: 500 });
  }
});
