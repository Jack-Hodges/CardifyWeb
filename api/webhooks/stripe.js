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
    console.log('Stripe webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
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

async function handleCheckoutSessionCompleted(session) {
  try {
    const userId = session.metadata?.userId;
    const customerId = session.customer;
    console.log('Handling checkout.session.completed for userId:', userId, 'customerId:', customerId);
    if (!userId || !customerId) {
      console.log('Missing userId or customerId in session metadata.');
      return;
    }

    // Get the customer's active subscription
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
    const subscription = subscriptions.data[0];
    if (!subscription) {
      console.log('No subscription found for customer:', customerId);
      return;
    }
    const isActive = subscription.status === 'active';
    const periodEnd = new Date(subscription.current_period_end * 1000);

    // Update the user's profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        pro: isActive,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_period_end: periodEnd.toISOString(),
      })
      .eq('id', userId);
    if (error) {
      console.error('Error updating user profile after checkout.session.completed:', error);
    } else {
      console.log('User profile updated to pro after checkout.session.completed:', userId);
    }
  } catch (err) {
    console.error('Error in handleCheckoutSessionCompleted:', err);
  }
}

async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;
  const isActive = subscription.status === 'active';
  const periodEnd = new Date(subscription.current_period_end * 1000);
  console.log('Handling subscription update for customer:', customerId, 'active:', isActive);

  const { error } = await supabase
    .from('profiles')
    .update({
      pro: isActive,
      stripe_subscription_id: subscription.id,
      subscription_period_end: periodEnd.toISOString(),
    })
    .eq('stripe_customer_id', customerId);
  if (error) {
    console.error('Error updating user profile after subscription update:', error);
  } else {
    console.log('User profile updated after subscription update for customer:', customerId);
  }
}

async function handleSubscriptionCancellation(subscription) {
  const customerId = subscription.customer;
  console.log('Handling subscription cancellation for customer:', customerId);

  const { error } = await supabase
    .from('profiles')
    .update({
      pro: false,
      stripe_subscription_id: null,
      subscription_period_end: null,
    })
    .eq('stripe_customer_id', customerId);
  if (error) {
    console.error('Error updating user profile after subscription cancellation:', error);
  } else {
    console.log('User profile updated after subscription cancellation for customer:', customerId);
  }
}

async function handlePaymentFailed(invoice) {
  // Optionally handle failed payments
  // Could send email notifications or set grace period
  console.log('Payment failed for customer:', invoice.customer);
} 