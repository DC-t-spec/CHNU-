// assets/js/core/config.js

const SUPABASE_URL = window.__CHNU_SUPABASE_URL__ || '';
const SUPABASE_ANON_KEY = window.__CHNU_SUPABASE_ANON_KEY__ || '';

const SUPABASE_ENABLED =
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.trim().length > 0 &&
  typeof SUPABASE_ANON_KEY === 'string' &&
  SUPABASE_ANON_KEY.trim().length > 0;

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ENABLED };
