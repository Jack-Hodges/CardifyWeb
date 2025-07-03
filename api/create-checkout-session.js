import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

console.log('Starting create-checkout-session API');
console.log('ENV STRIPE_SECRET_KEY:', !!process.env.STRIPE_SECRET_KEY);
console.log('ENV STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
console.log('Stripe instance created');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('Request method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    const { userId } = req.body;
    if (!userId) {
      console.log('No userId provided in request body');
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get user profile
    console.log('Fetching user profile for userId:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.log('Profile error or not found:', profileError, profile);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Fetched profile:', profile);

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      console.log('No Stripe customer ID, creating new customer for email:', profile.email);
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId: userId }
      });
      customerId = customer.id;
      console.log('Created Stripe customer:', customerId);
      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    } else {
      console.log('Using existing Stripe customer ID:', customerId);
    }

    // Create checkout session
    console.log('Creating Stripe checkout session with price ID:', process.env.STRIPE_PRICE_ID);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/dashboard?success=true`,
      cancel_url: `${req.headers.origin}/dashboard?canceled=true`,
      metadata: { userId: userId }
    });
    console.log('Created Stripe checkout session:', session.id);

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
} 