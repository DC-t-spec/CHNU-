import { getProducts as getProductsFromState } from '../core/state.js';
import { listProducts as listProductsFromProvider } from './providers/products.provider.js';

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
  if (typeof listProductsFromProvider !== 'function') {
    return null;
  }

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
  if (typeof listProductsFromProvider !== 'function') {
    return null;
  }

  try {
    const result = await listProductsFromProvider();
    return normalizeProducts(result);
  } catch {
    return null;
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
