// assets/js/modules/documents/document-detail.page.js

import { getDocumentService } from '../../services/documents.service.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

export async function renderDocumentDetailPage(context = {}) {
  const appRoot = document.querySelector('#app');
  const documentId = context?.params?.id || context?.query?.id;

  if (!documentId) {
    appRoot.innerHTML = renderError('Documento não encontrado', 'ID não fornecido.');
    return;
  }

  const doc = getDocumentService(documentId);

  if (!doc) {
    appRoot.innerHTML = renderError('Documento não encontrado', 'O documento não existe.');
    return;
  }

  appRoot.innerHTML = `
    <section class="page-shell document-detail-page">
      <div class="page-header">
        <div>
          <div class="page-title-row">
            <h1>${escapeHtml(doc.number || 'Documento')}</h1>
            <span class="status-chip status-${doc.status}">
              ${escapeHtml(doc.statusLabel)}
            </span>
          </div>
        </div>

        <div class="page-actions">
          <a href="#documents" class="btn btn-secondary">Voltar</a>

          ${
            doc.canEdit
              ? `<a href="#documents/edit?id=${doc.id}" class="btn btn-primary">Editar</a>`
              : ''
          }

          ${
            doc.canPost
              ? `<button class="btn btn-success" data-action="post" data-id="${doc.id}">Postar</button>`
              : ''
          }

          ${
            doc.canCancel
              ? `<button class="btn btn-danger" data-action="cancel" data-id="${doc.id}">Cancelar</button>`
              : ''
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Informação</h3>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item__label">Data</span>
            <strong>${formatDate(doc.date)}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-item__label">Tipo</span>
            <strong>${escapeHtml(doc.type)}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-item__label">Origem</span>
            <strong>${escapeHtml(doc.origin)}</strong>
          </div>

          <div class="detail-item">
            <span class="detail-item__label">Destino</span>
            <strong>${escapeHtml(doc.destination)}</strong>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Linhas</h3>
        </div>

        ${
          doc.lines?.length
            ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd</th>
                <th>Preço</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${doc.lines
                .map(
                  (l) => `
                    <tr>
                      <td>${escapeHtml(l.item)}</td>
                      <td>${l.quantity}</td>
                      <td>${formatCurrency(l.unitPrice)}</td>
                      <td>${formatCurrency(l.total)}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        `
            : `<div class="empty-state">Sem linhas</div>`
        }
      </div>
    </section>
  `;

  bindActions();
}

function bindActions() {
  const root = document.querySelector('#app');

  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;

    if (btn.dataset.action === 'post') {
      await handleDocumentPosting(id, { redirectTo: 'detail' });
    }

    if (btn.dataset.action === 'cancel') {
      await handleDocumentCancel(id, { redirectTo: 'detail' });
    }
  });
}

function renderError(title, message) {
  return `
    <section class="page-shell">
      <div class="card">
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    </section>
  `;
}

function formatDate(v) {
  if (!v) return '-';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
}

function formatCurrency(v) {
  return Number(v || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
  });
}

function escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
