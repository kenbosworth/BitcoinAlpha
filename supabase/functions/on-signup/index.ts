// supabase/functions/on-signup/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { supabase_url, supabase_key } = Deno.env.toObject()
  const client = createClient(supabase_url, supabase_key, {
    auth: { persistSession: false }
  })

  const { user } = await req.json()

  if (!user) {
    return new Response('Missing user data', { status: 400 })
  }

  const { id, email } = user

  const { error } = await client.from('profiles').insert({
    id,
    email,
    is_admin: false,
    tier: 'free',
    trial_started_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Insert error:', error.message)
    return new Response('Insert failed', { status: 500 })
  }

  return new Response('Trial profile created', { status: 200 })
})
