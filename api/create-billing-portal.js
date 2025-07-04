import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== BILLING PORTAL REQUEST ===');
    const { userId } = req.body;
    console.log('userId:', userId);

    if (!userId) {
      console.log('❌ No userId provided');
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get user profile
    console.log('🔍 Fetching profile for userId:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, pro')
      .eq('id', userId)
      .single();

    console.log('📄 Profile data:', profile);
    console.log('❌ Profile error:', profileError);

    if (profileError) {
      console.log('❌ Database error:', profileError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!profile) {
      console.log('❌ No profile found');
      return res.status(404).json({ error: 'User not found' });
    }

    if (!profile.stripe_customer_id) {
      console.log('❌ No stripe_customer_id found for user');
      return res.status(404).json({ error: 'No subscription found' });
    }

    console.log('✅ Found customer ID:', profile.stripe_customer_id);

    // Create billing portal session
    console.log('🏦 Creating billing portal session...');
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${req.headers.origin}/dashboard`,
    });

    console.log('✅ Billing portal session created:', session.id);
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('💥 Error creating billing portal session:', error);
    res.status(500).json({ error: error.message });
  }
} 