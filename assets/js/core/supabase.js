// assets/js/core/supabase.js

import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED } from './config.js';

let supabaseClient = null;

export function isSupabaseReady() {
  return (
    SUPABASE_ENABLED &&
    typeof window !== 'undefined' &&
    window.supabase &&
    typeof window.supabase.createClient === 'function'
  );
}

export function getSupabaseClient() {
  if (!isSupabaseReady()) return null;

  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  return supabaseClient;
}
