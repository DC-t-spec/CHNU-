// assets/js/modules/documents/document-detail.page.js

import { getDocumentService } from '../../services/documents.service.js';
import { getStockMoves, getProducts, getWarehouses } from '../../core/state.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

export async function renderDocumentDetailPage(context = {}) {
  const appRoot = document.querySelector('#app');
  const documentId = context?.params?.id || context?.query?.id || '';

  if (!documentId) {
    appRoot.innerHTML = renderErrorState(
      'Documento não encontrado',
      'O identificador do documento não foi informado.'
    );
    return;
  }

  const doc = getDocumentService(documentId);

  if (!doc) {
    appRoot.innerHTML = renderErrorState(
      'Documento não encontrado',
      'O documento solicitado não existe ou já não está disponível.'
    );
    return;
  }

  const products = getProducts() || [];
  const warehouses = getWarehouses() || [];
  const moves = (getStockMoves() || [])
    .filter((move) => move.reference_document_id === documentId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const stockImpact = buildStockImpact(moves, products, warehouses);

  appRoot.innerHTML = `
    <section class="page-shell document-detail-page">
      <div class="page-header">
        <div>
          <div class="page-title-row">
            <h1>${escapeHtml(doc.number || 'Documento')}</h1>
            <span class="status-chip status-${escapeHtml(doc.status || 'draft')}">
              ${escapeHtml(doc.statusLabel || doc.status || '-')}
            </span>
          </div>
          <p>Consulta detalhada do documento e impacto gerado no stock.</p>
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
              ? `
                <button
                  type="button"
                  class="btn btn-success"
                  data-action="post-document"
                  data-document-id="${doc.id}"
                >
                  Postar
                </button>
              `
              : ''
          }

          ${
            doc.canCancel
              ? `
                <button
                  type="button"
                  class="btn btn-danger"
                  data-action="cancel-document"
                  data-document-id="${doc.id}"
                >
                  Cancelar
                </button>
              `
              : ''
          }
        </div>
      </div>

      <div class="documents-stats-grid">
        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Linhas</span>
          <strong class="documents-stat-card__value">${Number(doc.linesCount || 0)}</strong>
        </div>

        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Total</span>
          <strong class="documents-stat-card__value">${formatCurrency(doc.grandTotal || 0)}</strong>
        </div>

        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Movimentos gerados</span>
          <strong class="documents-stat-card__value">${moves.length}</strong>
        </div>

        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Impactos em stock</span>
          <strong class="documents-stat-card__value">${stockImpact.length}</strong>
        </div>
      </div>

      <div class="document-detail-grid">
        <div class="card">
          <div class="card-header">
            <h3>Informação geral</h3>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-item__label">Número</span>
              <strong class="detail-item__value">${escapeHtml(doc.number || '-')}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-item__label">Data</span>
              <strong class="detail-item__value">${formatDate(doc.date)}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-item__label">Tipo</span>
              <strong class="detail-item__value">${escapeHtml(doc.type || '-')}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-item__label">Status</span>
              <strong class="detail-item__value">${escapeHtml(doc.statusLabel || '-')}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-item__label">Origem</span>
              <strong class="detail-item__value">${escapeHtml(doc.origin || '-')}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-item__label">Destino</span>
              <strong class="detail-item__value">${escapeHtml(doc.destination || '-')}</strong>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Eventos do documento</h3>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-item__label">Postado em</span>
              <strong class="detail-item__value">${formatDateTime(doc.postedAt)}</strong>
            </div>

            <div class="detail-item">
              <span class="detail-item__label">Cancelado em</span>
              <strong class="detail-item__value">${formatDateTime(doc.cancelledAt)}</strong>
            </div>

            <div class="detail-item detail-item--full">
              <span class="detail-item__label">Motivo do cancelamento</span>
              <strong class="detail-item__value">${escapeHtml(doc.cancelReason || '-')}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Linhas do documento</h3>
        </div>

        ${
          doc.lines?.length
            ? `
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Preço unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${doc.lines
                      .map(
                        (line) => `
                          <tr>
                            <td>${escapeHtml(line.item || '-')}</td>
                            <td>${formatNumber(line.quantity)}</td>
                            <td>${formatCurrency(line.unitPrice)}</td>
                            <td><strong>${formatCurrency(line.total)}</strong></td>
                          </tr>
                        `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
            : `
              <div class="empty-state">
                <h2>Sem linhas</h2>
                <p>Este documento ainda não possui linhas registadas.</p>
              </div>
            `
        }
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Movimentos gerados</h3>
        </div>

        ${
          moves.length
            ? `
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Movimento</th>
                      <th>Direcção</th>
                      <th>Produto</th>
                      <th>Armazém</th>
                      <th>Qtd</th>
                      <th>Custo unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${moves
                      .map((move) => {
                        const product = products.find((p) => p.id === move.product_id);
                        const warehouse = warehouses.find((w) => w.id === move.warehouse_id);

                        return `
                          <tr>
                            <td>${formatDateTime(move.date)}</td>
                            <td>${escapeHtml(move.movement_type || '-')}</td>
                            <td>${escapeHtml((move.direction || '-').toUpperCase())}</td>
                            <td>${escapeHtml(product?.name || move.product_id || '-')}</td>
                            <td>${escapeHtml(warehouse?.name || move.warehouse_id || '-')}</td>
                            <td>${formatNumber(move.qty)}</td>
                            <td>${formatCurrency(move.unit_cost)}</td>
                            <td><strong>${formatCurrency(move.total_cost)}</strong></td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
            : `
              <div class="empty-state">
                <h2>Sem movimentos</h2>
                <p>Este documento ainda não gerou movimentos de stock.</p>
              </div>
            `
        }
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Impacto em stock</h3>
        </div>

        ${
          stockImpact.length
            ? `
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Armazém</th>
                      <th>Entradas</th>
                      <th>Saídas</th>
                      <th>Saldo líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${stockImpact
                      .map(
                        (row) => `
                          <tr>
                            <td>${escapeHtml(row.productName)}</td>
                            <td>${escapeHtml(row.warehouseName)}</td>
                            <td>${formatNumber(row.qtyIn)}</td>
                            <td>${formatNumber(row.qtyOut)}</td>
                            <td><strong>${formatSignedNumber(row.netQty)}</strong></td>
                          </tr>
                        `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
            : `
              <div class="empty-state">
                <h2>Sem impacto</h2>
                <p>Não há impacto de stock calculado para este documento.</p>
              </div>
            `
        }
      </div>

      <div class="card">
        <div class="document-summary-bar">
          <div class="document-summary-bar__item">
            <span>Linhas</span>
            <strong>${Number(doc.linesCount || 0)}</strong>
          </div>

          <div class="document-summary-bar__item">
            <span>Total geral</span>
            <strong>${formatCurrency(doc.grandTotal || 0)}</strong>
          </div>
        </div>
      </div>
    </section>
  `;

  bindDetailActions();
}

function bindDetailActions() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  appRoot.addEventListener('click', handleDetailActionClick);
}

async function handleDetailActionClick(event) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;

  const action = trigger.dataset.action;
  const documentId = trigger.dataset.documentId;

  if (!action || !documentId) return;

  if (action === 'post-document') {
    await handleDocumentPosting(documentId, { redirectTo: 'detail' });
    return;
  }

  if (action === 'cancel-document') {
    await handleDocumentCancel(documentId, { redirectTo: 'detail' });
  }
}

function buildStockImpact(moves = [], products = [], warehouses = []) {
  const map = new Map();

  moves.forEach((move) => {
    const key = `${move.product_id}::${move.warehouse_id}`;
    const current = map.get(key) || {
      product_id: move.product_id,
      warehouse_id: move.warehouse_id,
      qtyIn: 0,
      qtyOut: 0,
      netQty: 0,
    };

    const qty = Number(move.qty || 0);

    if (move.direction === 'in') {
      current.qtyIn += qty;
      current.netQty += qty;
    }

    if (move.direction === 'out') {
      current.qtyOut += qty;
      current.netQty -= qty;
    }

    map.set(key, current);
  });

  return [...map.values()].map((row) => {
    const product = products.find((p) => p.id === row.product_id);
    const warehouse = warehouses.find((w) => w.id === row.warehouse_id);

    return {
      ...row,
      productName: product?.name || row.product_id || '-',
      warehouseName: warehouse?.name || row.warehouse_id || '-',
    };
  });
}

function renderErrorState(title, message) {
  return `
    <section class="page-shell">
      <div class="card">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <a href="#documents" class="btn btn-primary">Voltar à lista</a>
      </div>
    </section>
  `;
}

function formatDate(value) {
  if (!value) return '-';

  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatSignedNumber(value) {
  const number = Number(value || 0);
  const formatted = number.toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return number > 0 ? `+${formatted}` : formatted;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
