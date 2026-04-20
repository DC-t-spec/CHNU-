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
import { renderProductEditPage } from './modules/products/product-edit.page.js';
import { renderReportsDashboardPage } from './modules/reports/reports-dashboard.page.js';
import { renderReportsStockPage } from './modules/reports/reports-stock.page.js';
import { renderReportsMovementsPage } from './modules/reports/reports-movements.page.js';
import { renderSalesListPage } from './modules/sales/sales-list.page.js';
import { renderSaleFormPage } from './modules/sales/sale-form.page.js';
import { renderSaleDetailPage } from './modules/sales/sale-detail.page.js';

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

  registerRoute('/sales', renderSalesListPage);
  registerRoute('/sales/new', renderSaleFormPage);
  registerRoute('/sales/edit', renderSaleFormPage);
  registerRoute('/sales/view', renderSaleDetailPage);

  registerRoute('/inventory', renderInventoryBalancesPage);
  registerRoute('/inventory-balances', renderInventoryBalancesPage);
  registerRoute('/inventory-ledger', renderInventoryLedgerPage);

  registerRoute('/products', renderProductsPage);
  registerRoute('/products/new', renderProductFormPage);
  registerRoute('/products/edit/:id', renderProductEditPage);

  registerRoute('/reports', renderReportsDashboardPage);
  registerRoute('/reports-stock', renderReportsStockPage);
  registerRoute('/reports-movements', renderReportsMovementsPage);
}

function bootstrapApp() {
  bootstrapRoutes();
  startRouter();
}

bootstrapApp();
