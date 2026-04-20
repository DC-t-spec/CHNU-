import * as productsProvider from '../core/state.js';

function hasMethod(provider, name) {
  return Boolean(provider && typeof provider[name] === 'function');
}

function callProvider(methodNames, ...args) {
  for (const name of methodNames) {
    if (hasMethod(productsProvider, name)) {
      return productsProvider[name](...args);
    }
  }

  // Fallback de compatibilidade (legado) para ambientes que ainda expõem provider global.
  const legacyProvider = globalThis?.productsProvider;
  for (const name of methodNames) {
    if (hasMethod(legacyProvider, name)) {
      return legacyProvider[name](...args);
    }
  }

  return [];
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeProduct(product = {}, index = 0) {
  return {
    id: product.id ?? `product-${index + 1}`,
    code: product.code ?? product.sku ?? '',
    name: product.name ?? product.itemName ?? product.description ?? `Produto ${index + 1}`,
    unitPrice: toNumber(product.unitPrice ?? product.price ?? product.avgCost, 0),
  };
}

export function getProducts() {
  const result = callProvider(
    ['getProducts', 'listProducts', 'getInventoryProducts', 'getProductsService'],
    {}
  );

  return (Array.isArray(result) ? result : []).map((product, index) =>
    normalizeProduct(product, index)
  );
}

// Aliases de compatibilidade pública
export const listProducts = getProducts;
export const getProductsService = getProducts;
