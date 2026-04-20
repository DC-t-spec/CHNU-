import { getProducts as getProductsFromState } from '../core/state.js';

function isPromiseLike(value) {
  return !!value && typeof value.then === 'function';
}

function resolveProductsProvider() {
  if (typeof globalThis === 'undefined') return null;

  return (
    globalThis.productsProvider ||
    globalThis.ProductsProvider ||
    globalThis.CHNU?.productsProvider ||
    null
  );
}

function readFromProvider(methodName) {
  const provider = resolveProductsProvider();

  if (!provider || typeof provider[methodName] !== 'function') {
    return null;
  }

  try {
    const result = provider[methodName]();

    if (isPromiseLike(result)) {
      return null;
    }

    return Array.isArray(result) ? result : [];
  } catch {
    return null;
  }
}

function readFromFallback() {
  const result = getProductsFromState?.();
  return Array.isArray(result) ? result : [];
}

export function getProducts() {
  return (
    readFromProvider('getProducts') ??
    readFromProvider('listProducts') ??
    readFromFallback()
  );
}

export function listProducts() {
  return getProducts();
}

export function getInventoryProducts() {
  return getProducts();
}

export function getProductsService() {
  return getProducts();
}
