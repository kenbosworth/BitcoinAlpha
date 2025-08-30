import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { user_id } = await req.json();

  if (!user_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check how many promo users exist
  const { count, error: countError } = await supabase
    .from('promo_signup_counter')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return new Response(JSON.stringify({ error: countError.message }), { status: 500 });
  }

  const cap = 1000;

  if (count < cap) {
    // Under cap → grant promo tier
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        tier: 'promo',
        trial_started_at: new Date().toISOString(),
      })
      .eq('id', user_id);

    const { error: insertError } = await supabase
      .from('promo_signup_counter')
      .insert({ user_id });

    if (updateError || insertError) {
      return new Response(
        JSON.stringify({ error: updateError?.message || insertError?.message }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ status: 'promo granted' }), { status: 200 });
  }

  // Cap hit → free tier with trial
  const { error: fallbackError } = await supabase
    .from('profiles')
    .update({
      tier: 'free',
      trial_started_at: new Date().toISOString(),
    })
    .eq('id', user_id);

  if (fallbackError) {
    return new Response(JSON.stringify({ error: fallbackError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ status: 'free trial only' }), { status: 200 });
});
