// supabase/functions/agree-terms/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
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

    // 1) Auth: derive user id from JWT
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

    // Optional termsVersion from body
    let termsVersion: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      if (body && typeof body.termsVersion === 'string') {
        termsVersion = body.termsVersion;
      }
    } catch {
      // ignore bad JSON
    }

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const nowIso = new Date().toISOString();

    // 2) Try UPDATE first, returning the row
    const { data: updated, error: upErr } = await service
      .from('profiles')
      .update({
        terms_agreed_at: nowIso,
        ...(termsVersion ? { terms_version: termsVersion } : {}),
      })
      .eq('id', userId)
      .select('id, terms_agreed_at')
      .maybeSingle();

    if (upErr) {
      return json({ error: 'update_failed', details: upErr.message }, { status: 500 });
    }

    if (!updated) {
      // 3) No row existed → UPSERT a new profile row
      const { data: inserted, error: insErr } = await service
        .from('profiles')
        .upsert(
          {
            id: userId,
            terms_agreed_at: nowIso,
            ...(termsVersion ? { terms_version: termsVersion } : {}),
          },
          { onConflict: 'id' },
        )
        .select('id, terms_agreed_at')
        .maybeSingle();

      if (insErr || !inserted) {
        return json({ error: 'profile_upsert_failed', details: insErr?.message }, { status: 500 });
      }

      return json({ ok: true });
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'unexpected', details: String(e) }, { status: 500 });
  }
});
