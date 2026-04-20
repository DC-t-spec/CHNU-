import { getProducts as getProductsFromState } from '../core/state.js';
import {
  createProduct as createProductFromProvider,
  listProducts as listProductsFromProvider,
} from './providers/products.provider.js';

function isPromiseLike(value) {
  return !!value && typeof value.then === 'function';
}

function normalizeProducts(result) {
  return Array.isArray(result) ? result : [];
}

function readFromFallback() {
  const result = getProductsFromState?.();
  return normalizeProducts(result);
}

function readFromProviderSync() {
  if (typeof listProductsFromProvider !== 'function') return null;

  try {
    const result = listProductsFromProvider();

    if (isPromiseLike(result)) {
      return null;
    }

    return normalizeProducts(result);
  } catch {
    return null;
  }
}

async function readFromProviderAsync() {
  if (typeof listProductsFromProvider !== 'function') return null;

  try {
    const result = await listProductsFromProvider();
    return normalizeProducts(result);
  } catch {
    return null;
  }
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeLookup(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeCreatePayload(payload = {}) {
  const code = String(payload.code ?? '').trim();
  const name = String(payload.name ?? '').trim();
  const price = toNumber(payload.price);
  const cost = toNumber(payload.cost);
  const unit = String(payload.unit ?? '').trim() || null;
  const min_qty = toNumber(payload.min_qty);

  return {
    code,
    name,
    price,
    cost,
    unit,
    min_qty: min_qty ?? 0,
    is_active: payload.is_active ?? true,
    company_id: payload.company_id ?? null,
  };
}

function validateCreatePayload(payload) {
  if (!payload.code) {
    throw new Error('Código do produto é obrigatório.');
  }

  if (!payload.name) {
    throw new Error('Nome do produto é obrigatório.');
  }

  if (payload.price === null) {
    throw new Error('Preço do produto é obrigatório.');
  }

  if (payload.cost === null) {
    throw new Error('Custo do produto é obrigatório.');
  }

  if (payload.price < 0) {
    throw new Error('Preço do produto não pode ser negativo.');
  }

  if (payload.cost < 0) {
    throw new Error('Custo do produto não pode ser negativo.');
  }

  if (payload.min_qty < 0) {
    throw new Error('Quantidade mínima não pode ser negativa.');
  }

  const lookupCode = normalizeLookup(payload.code);
  const hasDuplicate = getProducts().some(
    (product) => normalizeLookup(product?.code ?? product?.sku) === lookupCode
  );

  if (hasDuplicate) {
    throw new Error('Já existe um produto com o mesmo código.');
  }
}

export function getProducts() {
  return readFromProviderSync() ?? readFromFallback();
}

export function listProducts() {
  return getProducts();
}

export async function listProductsAsync() {
  return (await readFromProviderAsync()) ?? readFromFallback();
}

export function getInventoryProducts() {
  return getProducts();
}

export function getProductsService() {
  return getProducts();
}

export async function createProduct(payload = {}) {
  const normalizedPayload = normalizeCreatePayload(payload);
  validateCreatePayload(normalizedPayload);

  if (typeof createProductFromProvider !== 'function') {
    throw new Error('Provider de produtos indisponível para criação.');
  }

  return createProductFromProvider(normalizedPayload);
}
