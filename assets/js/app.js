import { registerRoute, startRouter } from './core/router.js';
import { renderDashboardPage } from './modules/dashboard/dashboard.page.js';
import { renderDocumentsListPage } from './modules/documents/documents-list.page.js';
import { renderDocumentDetailPage } from './modules/documents/document-detail.page.js';
import { renderDocumentFormPage } from './modules/documents/document-form.page.js';

function bootstrapRoutes() {
  registerRoute('/dashboard', renderDashboardPage);

  registerRoute('/documents', renderDocumentsListPage);
  registerRoute('/documents/new', renderDocumentFormPage);
  registerRoute('/documents/view', renderDocumentDetailPage);
  registerRoute('/documents/edit', renderDocumentFormPage);
}

function bootstrapApp() {
  bootstrapRoutes();
  startRouter();
}

bootstrapApp();
