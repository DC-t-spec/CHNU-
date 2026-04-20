// assets/js/core/supabase.js

import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED } from './config.js';

let supabaseClient = null;

function hasSupabaseFactory() {
  return typeof window !== 'undefined' && !!window.supabase?.createClient;
}

function initSupabaseClient() {
  if (!SUPABASE_ENABLED || !hasSupabaseFactory()) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = initSupabaseClient();
  return supabaseClient;
}

function isSupabaseReady() {
  return !!getSupabaseClient();
}

export { getSupabaseClient, isSupabaseReady };
