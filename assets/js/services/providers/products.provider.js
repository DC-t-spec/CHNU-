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

function normalizeUnitPrice(product) {
  const price = Number(product?.price);
  if (Number.isFinite(price)) return price;

  const cost = Number(product?.cost);
  if (Number.isFinite(cost)) return cost;

  const unitPrice = Number(product?.unit_price ?? product?.unitPrice);
  if (Number.isFinite(unitPrice)) return unitPrice;

  return 0;
}

function normalizeProduct(product) {
  return {
    id: product?.id ?? null,
    code: product?.code ?? '',
    name: product?.name ?? '',
    unit_price: normalizeUnitPrice(product),
    created_at: product?.created_at ?? null,
  };
}

function listProductsFromState() {
  const products = getProducts();
  if (!Array.isArray(products)) return [];
  return products.map(normalizeProduct);
}

async function listProductsFromSupabase() {
  const client = getSupabaseClientSafe();

  if (!client) {
    return listProductsFromState();
  }

  const { data, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !Array.isArray(data)) {
    return listProductsFromState();
  }

  return data.map(normalizeProduct);
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
