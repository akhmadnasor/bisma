import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://rddalpqvkwtcbfrdxvfc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZGFscHF2a3d0Y2JmcmR4dmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTE1NTksImV4cCI6MjA4NDQyNzU1OX0.CQk02hhQ3gE4M5LMT-MQF5q5teetncbC-zBGcncWSSw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return true;
};