
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, amount, customerDetails, itemDetails } = await req.json()
    
    console.log('create-payment: Processing payment for order:', orderId, 'amount:', amount)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify order exists using midtrans_order_id field (not id field)
    console.log('create-payment: Verifying order exists with midtrans_order_id:', orderId)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status')
      .eq('midtrans_order_id', orderId)
      .single()

    if (orderError) {
      console.error('create-payment: Order verification error:', orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found', details: orderError.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('create-payment: Order found:', orderData)

    // Prepare Midtrans request
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    if (!midtransServerKey) {
      throw new Error('Midtrans server key not configured')
    }

    const auth = btoa(`${midtransServerKey}:`)
    
    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: customerDetails,
      item_details: itemDetails,
      credit_card: {
        secure: true
      }
    }

    console.log('create-payment: Creating Midtrans transaction:', midtransPayload)

    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(midtransPayload)
    })

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text()
      console.error('create-payment: Midtrans error:', errorText)
      throw new Error(`Midtrans error: ${midtransResponse.status} - ${errorText}`)
    }

    const midtransData = await midtransResponse.json()
    console.log('create-payment: Midtrans response:', midtransData)

    return new Response(
      JSON.stringify({ 
        snap_token: midtransData.token,
        redirect_url: midtransData.redirect_url 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('create-payment: Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
