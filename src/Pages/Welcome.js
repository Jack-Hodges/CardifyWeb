// Import necessary modules
import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

// Create your Supabase client
const supabase = createClient(
  'https://gzinbphtkdabusglzjjh.supabase.co',  // Your Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aW5icGh0a2RhYnVzZ2x6ampoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3NzgxMjMsImV4cCI6MjA0MTM1NDEyM30.smb7m0iX1umOvMPlq4c6ASqYB6y5eIkowR6XttcO3oo'  // Your Supabase Anon Key
);

const Welcome = () => (
  <div className="App">
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
    />
  </div>
);

export default Welcome;