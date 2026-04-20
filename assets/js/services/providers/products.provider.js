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

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeProduct(product) {
  return {
    id: product?.id ?? null,
    company_id: product?.company_id ?? null,
    code: product?.code ?? '',
    name: product?.name ?? '',
    unit: product?.unit ?? '',
    product_type: product?.product_type ?? '',
    cost: toNumber(product?.cost, 0),
    price: toNumber(product?.price, 0),
    unit_price: toNumber(product?.price, 0),
    is_active: product?.is_active ?? true,
    min_qty: toNumber(product?.min_qty, 0),
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

async function getProductByIdFromSupabase(id) {
  const client = getSupabaseClientSafe();
  if (!client || !id) return null;

  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeProduct(data);
}

function pickCompanyIdFromUser(user) {
  if (!user || typeof user !== 'object') return null;

  const metadataCandidates = [
    user.user_metadata?.company_id,
    user.user_metadata?.companyId,
    user.app_metadata?.company_id,
    user.app_metadata?.companyId,
    user.company_id,
  ];

  for (const candidate of metadataCandidates) {
    if (candidate) return candidate;
  }

  const relationCandidates = [
    user.user_metadata?.company,
    user.app_metadata?.company,
    user.company,
  ];

  for (const relation of relationCandidates) {
    if (!relation) continue;

    if (typeof relation === 'string') return relation;
    if (typeof relation === 'object' && relation.id) return relation.id;
  }

  return null;
}

async function resolveCompanyId(client, payload) {
  if (payload?.company_id) {
    return payload.company_id;
  }

  if (client?.auth && typeof client.auth.getUser === 'function') {
    const { data, error } = await client.auth.getUser();

    if (!error) {
      const companyIdFromUser = pickCompanyIdFromUser(data?.user);
      if (companyIdFromUser) return companyIdFromUser;
    }
  }

  const fallbackQuery = await client
    .from('products')
    .select('company_id')
    .not('company_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!fallbackQuery.error && fallbackQuery.data?.company_id) {
    return fallbackQuery.data.company_id;
  }

  throw new Error(
    'Não foi possível resolver company_id para criar o produto. Faça login com empresa associada ou informe company_id.'
  );
}

function buildInsertPayload(payload, companyId) {
  return {
    company_id: companyId,
    code: String(payload?.code ?? '').trim(),
    name: String(payload?.name ?? '').trim(),
    price: toNumber(payload?.price, 0),
    cost: toNumber(payload?.cost, 0),
    unit: String(payload?.unit ?? '').trim() || null,
    min_qty: toNumber(payload?.min_qty, 0),
    is_active: payload?.is_active ?? true,
  };
}

async function createProductInSupabase(payload) {
  const client = getSupabaseClientSafe();

  if (!client) {
    throw new Error('Supabase não está configurado para criar produtos.');
  }

  const companyId = await resolveCompanyId(client, payload);
  const insertPayload = buildInsertPayload(payload, companyId);

  const { data, error } = await client
    .from('products')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) {
    const message = error?.message?.trim() || 'Erro ao criar produto no Supabase.';
    throw new Error(message);
  }

  return normalizeProduct(data);
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

function buildUpdatePayload(payload = {}) {
  const updatePayload = {
    code: String(payload.code ?? '').trim(),
    name: String(payload.name ?? '').trim(),
    price: toNumber(payload.price, 0),
    cost: toNumber(payload.cost, 0),
    unit: String(payload.unit ?? '').trim() || null,
    min_qty: toNumber(payload.min_qty, 0),
  };

  if (payload.is_active !== undefined) {
    updatePayload.is_active = payload.is_active;
  }

  return updatePayload;
}

export async function getById(id) {
  if (!id) return null;

  if (isSupabaseReadySafe()) {
    const fromSupabase = await getProductByIdFromSupabase(id);
    if (fromSupabase) return fromSupabase;
  }

  return getProductById(id);
}

export async function update(id, payload = {}) {
  if (!id) {
    throw new Error('ID do produto é obrigatório para atualização.');
  }

  const client = getSupabaseClientSafe();
  if (!client) {
    throw new Error('Supabase não está configurado para atualizar produtos.');
  }

  const updatePayload = buildUpdatePayload(payload);

  const { data, error } = await client
    .from('products')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    const message = error?.message?.trim() || 'Erro ao atualizar produto no Supabase.';
    throw new Error(message);
  }

  return normalizeProduct(data);
}

export async function createProduct(payload) {
  return createProductInSupabase(payload);
}
