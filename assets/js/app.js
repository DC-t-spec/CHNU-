import { registerRoute, startRouter } from './core/router.js';

import { renderDocumentsListPage } from './modules/documents/documents-list.page.js';
import { renderDocumentFormPage } from './modules/documents/document-form.page.js';
import { renderDocumentDetailPage } from './modules/documents/document-detail.page.js';

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
      <div class="empty-state">
        <div class="empty-state__icon">404</div>
        <h3>Página não encontrada</h3>
        <p>A rota que tentaste abrir não existe.</p>
      </div>
    </section>
  `;
}

registerRoute('/dashboard', renderDashboardPage);

registerRoute('/documents', renderDocumentsListPage);
registerRoute('/documents/new', renderDocumentFormPage);
registerRoute('/documents/view', renderDocumentDetailPage);
registerRoute('/documents/edit', renderDocumentFormPage);

startRouter({
  notFound: renderNotFoundPage,
});
