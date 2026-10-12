import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://htmzjummkdwvuguzvavn.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bXpqdW1ta2R3dnVndXp2YXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTE3MTYsImV4cCI6MjEwNzMyNzcxNn0.d7sCs_l2gZBOLO_fFwilr9YLTMlvoqQxlHLYahTND70';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
