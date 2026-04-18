import {
  getDocuments,
  getProducts,
  getWarehouses,
} from '../../core/state.js';

import {
  getInventoryBalanceSummary,
  getInventoryLedgerSummary,
  getInventoryLedger,
} from '../../services/inventory.service.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-PT').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    if (typeof value === 'string' && value.includes('-')) {
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
    }

    return value;
  }

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getDocumentStatusLabel(status) {
  const labels = {
    draft: 'Rascunho',
    posted: 'Postado',
    cancelled: 'Cancelado',
  };

  return labels[status] || status || '-';
}

function getDocumentStatusClass(status) {
  const map = {
    draft: 'status-draft',
    posted: 'status-posted',
    cancelled: 'status-cancelled',
  };

  return map[status] || '';
}

function getDirectionBadge(direction) {
  if (direction === 'in') {
    return `<span class="status-pill status-pill--success">Entrada</span>`;
  }

  if (direction === 'out') {
    return `<span class="status-pill status-pill--danger">Saída</span>`;
  }

  return `<span class="status-pill">-</span>`;
}

function getMovementTypeLabel(type) {
  const labels = {
    transfer_out: 'Transferência saída',
    transfer_in: 'Transferência entrada',
    transfer_reversal_in: 'Reversão entrada',
    transfer_reversal_out: 'Reversão saída',
    adjustment_in: 'Ajuste entrada',
    adjustment_reversal_out: 'Reversão ajuste',
    sale: 'Venda',
    purchase: 'Compra',
    production_in: 'Produção entrada',
    production_out: 'Produção saída',
  };

  return labels[type] || type || '-';
}

function getDashboardData() {
  const documents = safeArray(getDocuments?.());
  const products = safeArray(getProducts?.());
  const warehouses = safeArray(getWarehouses?.());

  const inventorySummary = getInventoryBalanceSummary?.() || {
    total_items: 0,
    total_qty_on_hand: 0,
    total_qty_reserved: 0,
    total_qty_available: 0,
    total_stock_value: 0,
    total_out_of_stock: 0,
    total_low_stock: 0,
  };

  const ledgerSummary = getInventoryLedgerSummary?.() || {
    total_moves: 0,
    total_in: 0,
    total_out: 0,
    total_value: 0,
  };

  const ledger = safeArray(getInventoryLedger?.());

  const documentStats = {
    total: documents.length,
    draft: documents.filter((doc) => doc.status === 'draft').length,
    posted: documents.filter((doc) => doc.status === 'posted').length,
    cancelled: documents.filter((doc) => doc.status === 'cancelled').length,
  };

  const recentDocuments = [...documents]
    .sort((a, b) => {
      const dateA = new Date(b.updatedAt || b.createdAt || b.date || 0);
      const dateB = new Date(a.updatedAt || a.createdAt || a.date || 0);
      return dateA - dateB;
    })
    .slice(0, 6);

  const recentMoves = [...ledger]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8);

  return {
    documentStats,
    inventorySummary,
    ledgerSummary,
    masterData: {
      products: products.length,
      warehouses: warehouses.length,
    },
    recentDocuments,
    recentMoves,
  };
}

function renderTopMetrics(data) {
  return `
    <section class="documents-stats-grid">
      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Documentos</span>
        <strong class="documents-stat-card__value">${formatNumber(data.documentStats.total)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Itens em stock</span>
        <strong class="documents-stat-card__value">${formatNumber(data.inventorySummary.total_items)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Movimentos stock</span>
        <strong class="documents-stat-card__value">${formatNumber(data.ledgerSummary.total_moves)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Valor total stock</span>
        <strong class="documents-stat-card__value">${formatCurrency(data.inventorySummary.total_stock_value)}</strong>
      </article>
    </section>
  `;
}

function renderOperationalCards(data) {
  return `
    <section class="grid-3">
      <article class="card">
        <div class="section-header">
          <div>
            <h2>Documentos</h2>
            <p>Estado operacional actual</p>
          </div>
        </div>

        <div class="detail-grid">
          <div>
            <strong>Total</strong>
            <span>${formatNumber(data.documentStats.total)}</span>
          </div>

          <div>
            <strong>Rascunhos</strong>
            <span>${formatNumber(data.documentStats.draft)}</span>
          </div>

          <div>
            <strong>Postados</strong>
            <span>${formatNumber(data.documentStats.posted)}</span>
          </div>

          <div>
            <strong>Cancelados</strong>
            <span>${formatNumber(data.documentStats.cancelled)}</span>
          </div>
        </div>
      </article>

      <article class="card">
        <div class="section-header">
          <div>
            <h2>Inventário</h2>
            <p>Capacidade actual do stock</p>
          </div>
        </div>

        <div class="detail-grid">
          <div>
            <strong>Qty on hand</strong>
            <span>${formatNumber(data.inventorySummary.total_qty_on_hand)}</span>
          </div>

          <div>
            <strong>Qty available</strong>
            <span>${formatNumber(data.inventorySummary.total_qty_available)}</span>
          </div>

          <div>
            <strong>Sem stock</strong>
            <span>${formatNumber(data.inventorySummary.total_out_of_stock)}</span>
          </div>

          <div>
            <strong>Stock baixo</strong>
            <span>${formatNumber(data.inventorySummary.total_low_stock)}</span>
          </div>
        </div>
      </article>

      <article class="card">
        <div class="section-header">
          <div>
            <h2>Base do sistema</h2>
            <p>Dados mestres disponíveis</p>
          </div>
        </div>

        <div class="detail-grid">
          <div>
            <strong>Produtos</strong>
            <span>${formatNumber(data.masterData.products)}</span>
          </div>

          <div>
            <strong>Armazéns</strong>
            <span>${formatNumber(data.masterData.warehouses)}</span>
          </div>

          <div>
            <strong>Entradas</strong>
            <span>${formatNumber(data.ledgerSummary.total_in)}</span>
          </div>

          <div>
            <strong>Saídas</strong>
            <span>${formatNumber(data.ledgerSummary.total_out)}</span>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderQuickActions() {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Ações rápidas</h2>
          <p>Acessos directos para operação diária</p>
        </div>
      </div>

      <div class="page-actions">
        <a href="#documents/new" class="btn btn-primary">Novo documento</a>
        <a href="#documents" class="btn btn-secondary">Ver documentos</a>
        <a href="#inventory-balances" class="btn btn-secondary">Inventory Balances</a>
        <a href="#inventory-ledger" class="btn btn-secondary">Inventory Ledger</a>
      </div>
    </section>
  `;
}

function renderRecentDocuments(documents) {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Documentos recentes</h2>
          <p>Últimos documentos registados no sistema</p>
        </div>
      </div>

      ${
        documents.length
          ? `
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Origem</th>
                    <th>Destino</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  ${documents
                    .map(
                      (doc) => `
                        <tr>
                          <td>${escapeHtml(doc.number || '-')}</td>
                          <td>${formatDate(doc.date || doc.createdAt || doc.updatedAt)}</td>
                          <td>${escapeHtml(doc.type || '-')}</td>
                          <td>
                            <span class="status-chip ${getDocumentStatusClass(doc.status)}">
                              ${escapeHtml(getDocumentStatusLabel(doc.status))}
                            </span>
                          </td>
                          <td>${escapeHtml(doc.origin || '-')}</td>
                          <td>${escapeHtml(doc.destination || '-')}</td>
                          <td>
                            <a href="#documents/view?id=${doc.id}" class="btn btn-sm btn-secondary">Ver</a>
                          </td>
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
              <h2>Sem documentos</h2>
              <p>Ainda não existem documentos registados.</p>
            </div>
          `
      }
    </section>
  `;
}

function renderRecentMoves(moves) {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Movimentos recentes</h2>
          <p>Últimos movimentos do ledger de stock</p>
        </div>
      </div>

      ${
        moves.length
          ? `
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Armazém</th>
                    <th>Tipo</th>
                    <th>Direcção</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Referência</th>
                  </tr>
                </thead>
                <tbody>
                  ${moves
                    .map(
                      (move) => `
                        <tr class="ledger-row ledger-row--${escapeHtml(move.direction || '')}">
                          <td>${formatDate(move.date)}</td>
                          <td>${escapeHtml(move.product_name)}</td>
                          <td>${escapeHtml(move.warehouse_name)}</td>
                          <td>${escapeHtml(getMovementTypeLabel(move.movement_type || move.move_type))}</td>
                          <td>${getDirectionBadge(move.direction)}</td>
                          <td>${formatNumber(move.qty)}</td>
                          <td>${formatCurrency(move.total_cost)}</td>
                          <td>
                            ${
                              move.reference_id
                                ? `<a href="#documents/view?id=${move.reference_id}" class="btn btn-sm btn-secondary">${escapeHtml(move.reference_label || 'Documento')}</a>`
                                : escapeHtml(move.reference_label || '-')
                            }
                          </td>
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
              <h2>Sem movimentos</h2>
              <p>Ainda não existem movimentos de stock registados.</p>
            </div>
          `
      }
    </section>
  `;
}

export async function renderDashboardPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const data = getDashboardData();

  appRoot.innerHTML = `
    <section class="page-shell dashboard-page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão executiva do sistema ERP/Admin.</p>
        </div>

        <div class="page-actions">
          <a href="#documents/new" class="btn btn-primary">Novo documento</a>
          <a href="#inventory-balances" class="btn btn-secondary">Ver stock</a>
        </div>
      </div>

      ${renderTopMetrics(data)}
      ${renderOperationalCards(data)}
      ${renderQuickActions()}

      <section class="grid-2">
        ${renderRecentDocuments(data.recentDocuments)}
        ${renderRecentMoves(data.recentMoves)}
      </section>
    </section>
  `;
}
