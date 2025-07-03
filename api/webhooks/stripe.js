import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;
  const isActive = subscription.status === 'active';
  
  // Convert Unix timestamp to timezone-aware date
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await supabase
    .from('profiles')
    .update({
      pro: isActive,
      stripe_subscription_id: subscription.id,
      subscription_period_end: periodEnd.toISOString()
    })
    .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionCancellation(subscription) {
  const customerId = subscription.customer;

  await supabase
    .from('profiles')
    .update({
      pro: false,
      stripe_subscription_id: null,
      subscription_period_end: null
    })
    .eq('stripe_customer_id', customerId);
}

async function handlePaymentFailed(invoice) {
  // Optionally handle failed payments
  // Could send email notifications or set grace period
  console.log('Payment failed for customer:', invoice.customer);
} 