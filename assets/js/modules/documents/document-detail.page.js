import { getDocumentDetails } from './documents.service.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

export async function renderDocumentDetailPage({ params }) {
  const appRoot = window.document.querySelector('#app');
  const documentId = params.id;
  const documentData = getDocumentDetails(documentId);

  if (!documentData) {
    appRoot.innerHTML = `
      <section class="page-shell">
        <div class="card">
          <h2>Documento não encontrado</h2>
          <p>O documento solicitado não existe.</p>
          <a href="#documents" class="btn btn-primary">Voltar à lista</a>
        </div>
      </section>
    `;
    return;
  }

  const lines = Array.isArray(documentData.lines) ? documentData.lines : [];
  const totals = documentData.totals || {
    linesCount: lines.length,
    grandTotal: 0,
  };

  appRoot.innerHTML = `
    <section class="page-shell document-detail-page">
      <div class="page-header">
        <div>
          <h1>Documento ${documentData.number}</h1>
          <p>Detalhe completo do documento</p>
        </div>

        <div class="page-actions">
          <a href="#documents" class="btn btn-secondary">Voltar</a>

          ${
            documentData.canEdit
              ? `<a href="#documents/edit?id=${documentData.id}" class="btn btn-secondary">Editar</a>`
              : ''
          }

          ${
            documentData.canPost
              ? `<button type="button" class="btn btn-primary" id="post-document-button">Postar documento</button>`
              : ''
          }

          ${
            documentData.canCancel
              ? `<button type="button" class="btn btn-danger" id="cancel-document-button">Cancelar documento</button>`
              : ''
          }
        </div>
      </div>

      <div class="card detail-grid">
        <div><strong>Número</strong>${documentData.number || '-'}</div>
        <div><strong>Data</strong>${formatDocumentDate(documentData.date)}</div>
        <div><strong>Tipo</strong>${documentData.type || '-'}</div>
        <div><strong>Origem</strong>${documentData.origin || '-'}</div>
        <div><strong>Destino</strong>${documentData.destination || '-'}</div>
        <div>
          <strong>Status</strong>
          <span class="status-chip status-${documentData.status}">
            ${documentData.statusLabel}
          </span>
        </div>
      </div>

      <div class="card operational-meta">
        <div class="section-header">
          <div>
            <h2>Informação operacional</h2>
            <p>Eventos do ciclo de vida do documento</p>
          </div>
        </div>

        <div class="operational-meta__grid">
          <div class="operational-meta__item">
            <span class="operational-meta__label">Postado em</span>
            <strong class="operational-meta__value">${formatDateTime(documentData.postedAt)}</strong>
          </div>

          <div class="operational-meta__item">
            <span class="operational-meta__label">Cancelado em</span>
            <strong class="operational-meta__value">${formatDateTime(documentData.cancelledAt)}</strong>
          </div>

          <div class="operational-meta__item operational-meta__item--full">
            <span class="operational-meta__label">Motivo do cancelamento</span>
            <strong class="operational-meta__value">${escapeHtml(documentData.cancelReason || '-')}</strong>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Linhas</h2>
            <p>Resumo dos itens associados ao documento</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantidade</th>
                <th>Preço unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                lines.length
                  ? lines.map((line) => `
                    <tr>
                      <td>${escapeHtml(line.item || '-')}</td>
                      <td>${formatNumber(line.quantity)}</td>
                      <td>${formatCurrency(line.unitPrice)}</td>
                      <td>${formatCurrency(line.total)}</td>
                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td colspan="4" class="empty-state-cell">
                        Nenhuma linha adicionada.
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>

        <div class="document-totals">
          <div class="document-totals__item">
            <span class="document-totals__label">Total de linhas</span>
            <strong class="document-totals__value">${totals.linesCount ?? lines.length}</strong>
          </div>

          <div class="document-totals__item document-totals__item--highlight">
            <span class="document-totals__label">Total geral</span>
            <strong class="document-totals__value">${formatCurrency(totals.grandTotal)}</strong>
          </div>
        </div>
      </div>
    </section>
  `;

  bindDetailActions(documentData);
}

function bindDetailActions(documentData) {
  if (documentData.canPost) {
    const postButton = window.document.querySelector('#post-document-button');

    if (postButton) {
      postButton.addEventListener('click', async () => {
        await handleDocumentPosting(documentData.id);
      });
    }
  }

  if (documentData.canCancel) {
    const cancelButton = window.document.querySelector('#cancel-document-button');

    if (cancelButton) {
      cancelButton.addEventListener('click', async () => {
        await handleDocumentCancel(documentData.id);
      });
    }
  }
}

function formatCurrency(value) {
  const amount = Number(value) || 0;

  return `${amount.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDocumentDate(value) {
  if (!value) return '-';

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('pt-PT');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
