import { getProducts } from '../../core/state.js';
import * as supabaseCore from '../../core/supabase.js';

function isSupabaseReadySafe() {
  if (typeof supabaseCore.isSupabaseReady === 'function') {
    return Boolean(supabaseCore.isSupabaseReady());
  }

  if (typeof globalThis.isSupabaseReady === 'function') {
    return Boolean(globalThis.isSupabaseReady());
  }

  return false;
}

function getSupabaseClientSafe() {
  if (typeof supabaseCore.getSupabaseClient === 'function') {
    return supabaseCore.getSupabaseClient();
  }

  if (typeof supabaseCore.getSupabase === 'function') {
    return supabaseCore.getSupabase();
  }

  if (typeof globalThis.getSupabaseClient === 'function') {
    return globalThis.getSupabaseClient();
  }

  if (globalThis.supabase && typeof globalThis.supabase.from === 'function') {
    return globalThis.supabase;
  }

  return null;
}

function listProductsFromState() {
  const products = getProducts();
  return Array.isArray(products) ? products : [];
}

async function listProductsFromSupabase() {
  const client = getSupabaseClientSafe();

  if (!client) {
    return listProductsFromState();
  }

  const { data, error } = await client.from('products').select('*');

  if (error || !Array.isArray(data)) {
    return listProductsFromState();
  }

  return data;
}

export async function listProducts() {
  if (isSupabaseReadySafe()) {
    return listProductsFromSupabase();
  }

  return listProductsFromState();
}

export async function getProductById(id) {
  if (!id) return null;

  const products = await listProducts();

  return products.find((product) => product.id === id) || null;
}
