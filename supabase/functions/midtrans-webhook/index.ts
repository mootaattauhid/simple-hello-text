
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const notification = await req.json();
    console.log('Received Midtrans notification:', notification);

    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
      throw new Error('Midtrans server key not configured');
    }

    // Verify signature using Web Crypto API
    const signatureKey = notification.signature_key;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    
    // Create signature string and hash it using Web Crypto API
    const signatureString = orderId + statusCode + grossAmount + serverKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const mySignatureKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signatureKey !== mySignatureKey) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 400 });
    }

    // Map Midtrans status to our payment status
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    switch (notification.transaction_status) {
      case 'capture':
      case 'settlement':
        paymentStatus = 'paid';
        orderStatus = 'confirmed';
        break;
      case 'pending':
        paymentStatus = 'pending';
        orderStatus = 'pending';
        break;
      case 'cancel':
      case 'expire':
      case 'failure':
        paymentStatus = 'failed';
        orderStatus = 'cancelled';
        break;
    }

    // Update order in database
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        midtrans_transaction_id: notification.transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq('midtrans_order_id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }

    console.log(`Order ${orderId} updated: payment_status=${paymentStatus}, status=${orderStatus}`);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
