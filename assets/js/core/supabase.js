// CHNU core

const ENABLE_SUPABASE_BROWSER = false;

// ✅ Substituir estes placeholders pelos valores reais do teu projecto Supabase.
const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

let supabaseClient = null;

function hasValidConfig() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== '__SUPABASE_URL__' &&
    SUPABASE_ANON_KEY !== '__SUPABASE_ANON_KEY__'
  );
}

export function isSupabaseEnabled() {
  return ENABLE_SUPABASE_BROWSER && hasValidConfig();
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!isSupabaseEnabled()) return null;

  const createClient = window?.supabase?.createClient;
  if (typeof createClient !== 'function') {
    console.warn('[CHNU] Supabase SDK não está disponível em window.supabase.');
    return null;
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}
