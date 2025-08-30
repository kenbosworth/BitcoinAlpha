// supabase/functions/agree-terms/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
    }

    // 1) Identify the user from the bearer token
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'missing_bearer' }), { status: 401 });
    }

    // user-scoped client (to fetch user id)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const termsVersion: string = body?.termsVersion ?? 'v1';

    // 2) Privileged update with service-role
    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { error: upErr } = await service
      .from('profiles')
      .update({
        terms_version: termsVersion,
        terms_agreed_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (upErr) {
      return new Response(JSON.stringify({ error: 'update_failed', details: upErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'unexpected', details: `${e}` }), { status: 500 });
  }
});
