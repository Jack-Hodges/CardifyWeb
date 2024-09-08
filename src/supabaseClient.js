// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gzinbphtkdabusglzjjh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aW5icGh0a2RhYnVzZ2x6ampoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3NzgxMjMsImV4cCI6MjA0MTM1NDEyM30.smb7m0iX1umOvMPlq4c6ASqYB6y5eIkowR6XttcO3oo' // Found in your Supabase dashboard under Project Settings > API > Anon Key

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase