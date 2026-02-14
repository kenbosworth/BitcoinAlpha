import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const event = await req.json()
    console.log('RevenueCat webhook received:', JSON.stringify(event, null, 2))

    const { type, app_user_id, product_id, expiration_at_ms } = event.event

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const expiresAt = expiration_at_ms 
      ? new Date(expiration_at_ms).toISOString() 
      : null

    let updateData: any = {
      revenuecat_customer_id: app_user_id,
      subscription_product_id: product_id,
    }

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
        const isTrial = event.event.is_trial_period === true
        updateData.subscription_status = isTrial ? 'trialing' : 'active'
        updateData.subscription_expires_at = expiresAt
        console.log(`Setting subscription to ${updateData.subscription_status}`)
        break

      case 'CANCELLATION':
        updateData.subscription_status = 'cancelled'
        updateData.subscription_expires_at = expiresAt
        console.log('Subscription cancelled, but access until:', expiresAt)
        break

      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        updateData.subscription_status = 'expired'
        console.log('Subscription expired')
        break

      case 'UNCANCELLATION':
        updateData.subscription_status = 'active'
        updateData.subscription_expires_at = expiresAt
        console.log('Subscription uncancelled')
        break

      default:
        console.log('Unhandled event type:', type)
        return new Response(
          JSON.stringify({ ok: true, message: 'Event type not handled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', app_user_id)

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    console.log('Profile updated successfully:', data)

    return new Response(
      JSON.stringify({ ok: true, message: 'Webhook processed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
