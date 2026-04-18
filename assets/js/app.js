import { registerRoute, startRouter } from './core/router.js';

import { renderDocumentsListPage } from './modules/documents/documents-list.page.js';
import { renderDocumentFormPage } from './modules/documents/document-form.page.js';
import { renderDocumentDetailPage } from './modules/documents/document-detail.page.js';

import { renderInventoryPage } from './modules/inventory/inventory.page.js';
import { renderInventoryBalancesPage } from './modules/inventory/inventory-balances.page.js';
import { renderInventoryLedgerPage } from './modules/inventory/inventory-ledger.page.js';

function renderDashboardPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do sistema.</p>
        </div>
      </div>

      <div class="empty-state">
        <div class="empty-state__icon">📊</div>
        <h3>Dashboard pronto</h3>
        <p>Escolhe um módulo no menu lateral.</p>
      </div>
    </section>
  `;
}

function renderNotFoundPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `
    <section class="page-shell">
      <div class="card">
        <div class="card-header">
          <h3>Página não encontrada</h3>
        </div>
        <div class="card-body" style="display:grid;gap:12px;">
          <p>A rota que tentaste abrir não existe.</p>
          <div>
            <a class="btn btn-secondary" href="#dashboard">Ir para dashboard</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

registerRoute('/dashboard', renderDashboardPage);

registerRoute('/documents', renderDocumentsListPage);
registerRoute('/documents/new', renderDocumentFormPage);
registerRoute('/documents/view', renderDocumentDetailPage);
registerRoute('/documents/edit', renderDocumentFormPage);

registerRoute('/inventory', renderInventoryPage);
registerRoute('/inventory-balances', renderInventoryBalancesPage);
registerRoute('/inventory-ledger', renderInventoryLedgerPage);

startRouter({
  notFound: renderNotFoundPage,
});
