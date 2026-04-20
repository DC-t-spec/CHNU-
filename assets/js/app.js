// assets/js/app.js

import { registerRoute, startRouter, navigateTo } from './core/router.js';
import { renderDashboardPage } from './modules/dashboard/dashboard.page.js';
import { renderDocumentsListPage } from './modules/documents/documents-list.page.js';
import { renderDocumentDetailPage } from './modules/documents/document-detail.page.js';
import { renderDocumentFormPage } from './modules/documents/document-form.page.js';
import { renderInventoryBalancesPage } from './modules/inventory/inventory-balances.page.js';
import { renderInventoryLedgerPage } from './modules/inventory/inventory-ledger.page.js';
import { renderProductsPage } from './modules/products/products.page.js';
import { renderProductFormPage } from './modules/products/product-form.js';

function redirectToDashboard() {
  navigateTo('#dashboard');
}

function bootstrapRoutes() {
  registerRoute('/', redirectToDashboard);
  registerRoute('/dashboard', renderDashboardPage);

  registerRoute('/documents', renderDocumentsListPage);
  registerRoute('/documents/new', renderDocumentFormPage);
  registerRoute('/documents/view', renderDocumentDetailPage);
  registerRoute('/documents/edit', renderDocumentFormPage);

  registerRoute('/inventory', renderInventoryBalancesPage);
  registerRoute('/inventory-balances', renderInventoryBalancesPage);
  registerRoute('/inventory-ledger', renderInventoryLedgerPage);

  registerRoute('/products', renderProductsPage);
  registerRoute('/products/new', renderProductFormPage);
}

function bootstrapApp() {
  bootstrapRoutes();
  startRouter();
}

bootstrapApp();
