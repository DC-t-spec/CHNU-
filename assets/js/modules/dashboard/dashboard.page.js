import { getDashboardExecutiveData } from '../../services/dashboard.service.js';

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
  if (Number.isNaN(date.getTime())) return String(value);

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
  return {
    draft: 'Rascunho',
    posted: 'Postado',
    cancelled: 'Cancelado',
  }[status] || status || '-';
}

function getDocumentStatusClass(status) {
  return {
    draft: 'status-draft',
    posted: 'status-posted',
    cancelled: 'status-cancelled',
  }[status] || '';
}

function getMovementTypeLabel(type) {
  return {
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
  }[type] || type || '-';
}

function renderKpis(kpis) {
  const items = [
    { label: 'Produtos ativos', value: formatNumber(kpis.activeProducts) },
    { label: 'Documentos totais', value: formatNumber(kpis.totalDocuments) },
    { label: 'Vendas postadas', value: formatNumber(kpis.postedSales) },
    { label: 'Compras postadas', value: formatNumber(kpis.postedPurchases) },
    { label: 'Itens em stock', value: formatNumber(kpis.stockItems) },
    { label: 'Produtos com stock baixo', value: formatNumber(kpis.lowStockProducts) },
    { label: 'Produtos sem stock', value: formatNumber(kpis.outOfStockProducts) },
    { label: 'Valor total de stock', value: formatCurrency(kpis.totalStockValue) },
  ];

  return `
    <section class="dashboard-kpis-grid">
      ${items
        .map(
          (item) => `
            <article class="dashboard-kpi-card">
              <span class="dashboard-kpi-card__label">${item.label}</span>
              <strong class="dashboard-kpi-card__value">${item.value}</strong>
            </article>
          `
        )
        .join('')}
    </section>
  `;
}

function renderOperationalStatus(documentsByStatus) {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Estado operacional dos documentos</h2>
          <p>Distribuição por status da operação documental.</p>
        </div>
      </div>

      <div class="detail-grid">
        <div><strong>Total</strong><span>${formatNumber(documentsByStatus.total)}</span></div>
        <div><strong>Rascunho</strong><span>${formatNumber(documentsByStatus.draft)}</span></div>
        <div><strong>Postado</strong><span>${formatNumber(documentsByStatus.posted)}</span></div>
        <div><strong>Cancelado</strong><span>${formatNumber(documentsByStatus.cancelled)}</span></div>
      </div>
    </section>
  `;
}

function renderRecentDocuments(documents) {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Últimos documentos</h2>
          <p>Documentos mais recentes com acesso rápido ao detalhe.</p>
        </div>
      </div>
      ${
        documents.length
          ? `
            <div class="table-responsive">
              <table class="data-table dashboard-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Total</th>
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
                          <td>${escapeHtml(doc.type_label || doc.type || '-')}</td>
                          <td><span class="status-chip ${getDocumentStatusClass(doc.status)}">${escapeHtml(getDocumentStatusLabel(doc.status))}</span></td>
                          <td>${formatCurrency(doc.grandTotal)}</td>
                          <td><a class="btn btn-sm btn-secondary" href="#documents/view?id=${doc.id}">Ver</a></td>
                        </tr>
                      `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          : '<div class="empty-state"><h2>Sem documentos</h2><p>Ainda não existem documentos registados.</p></div>'
      }
    </section>
  `;
}

function renderRecentMoves(moves) {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Últimos movimentos de stock</h2>
          <p>Movimentos recentes no ledger para monitorização operacional.</p>
        </div>
      </div>

      ${
        moves.length
          ? `
            <div class="table-responsive">
              <table class="data-table dashboard-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Produto</th>
                    <th>Armazém</th>
                    <th>Tipo</th>
                    <th>Direção</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  ${moves
                    .map(
                      (move) => `
                        <tr>
                          <td>${formatDate(move.date)}</td>
                          <td>${escapeHtml(move.product_name || '-')}</td>
                          <td>${escapeHtml(move.warehouse_name || '-')}</td>
                          <td>${escapeHtml(getMovementTypeLabel(move.movement_type || move.move_type))}</td>
                          <td>${escapeHtml(move.direction === 'in' ? 'Entrada' : move.direction === 'out' ? 'Saída' : '-')}</td>
                          <td>${formatNumber(move.qty)}</td>
                        </tr>
                      `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          : '<div class="empty-state"><h2>Sem movimentos</h2><p>Ainda não existem movimentos de stock registados.</p></div>'
      }
    </section>
  `;
}

function renderSalesVsPurchases(commerce) {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Resumo rápido: vendas vs compras</h2>
          <p>Comparação de documentos postados e valor total movimentado.</p>
        </div>
      </div>

      <div class="dashboard-compare-grid">
        <div class="dashboard-compare-item">
          <strong>Vendas postadas</strong>
          <span>${formatNumber(commerce.postedSalesCount)}</span>
          <small>${formatCurrency(commerce.postedSalesValue)}</small>
        </div>

        <div class="dashboard-compare-item">
          <strong>Compras postadas</strong>
          <span>${formatNumber(commerce.postedPurchasesCount)}</span>
          <small>${formatCurrency(commerce.postedPurchasesValue)}</small>
        </div>
      </div>
    </section>
  `;
}

function renderHighlights(highlights) {
  return `
    <section class="card">
      <div class="section-header">
        <div>
          <h2>Destaques operacionais</h2>
          <p>Produtos com risco de ruptura para ação imediata.</p>
        </div>
      </div>

      <div class="dashboard-highlight-summary">
        <span class="status-pill status-pill--danger">Sem stock: ${formatNumber(highlights.outOfStockProducts)}</span>
        <span class="status-pill status-pill--warning">Stock baixo: ${formatNumber(highlights.lowStockProducts)}</span>
      </div>

      ${
        highlights.lowOrOutRows.length
          ? `
            <div class="table-responsive">
              <table class="data-table dashboard-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Armazém</th>
                    <th>Disponível</th>
                    <th>Mínimo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${highlights.lowOrOutRows
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.product_name || '-')}</td>
                          <td>${escapeHtml(row.warehouse_name || '-')}</td>
                          <td>${formatNumber(row.qty_available)}</td>
                          <td>${formatNumber(row.product_min_qty)}</td>
                          <td>
                            <span class="status-pill ${row.stock_status === 'out' ? 'status-pill--danger' : 'status-pill--warning'}">
                              ${row.stock_status === 'out' ? 'Sem stock' : 'Stock baixo'}
                            </span>
                          </td>
                        </tr>
                      `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
          : '<div class="empty-state"><h2>Sem alertas</h2><p>Não há produtos em condição crítica no momento.</p></div>'
      }
    </section>
  `;
}

export async function renderDashboardPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const data = await getDashboardExecutiveData();

  appRoot.innerHTML = `
    <section class="page-shell dashboard-page">
      <div class="page-header">
        <div>
          <h1>Dashboard Executivo</h1>
          <p>Visão integrada da operação com dados de produtos, documentos, vendas, compras e stock.</p>
        </div>

        <div class="page-actions">
          <a href="#documents/new" class="btn btn-primary">Novo documento</a>
          <a href="#reports" class="btn btn-secondary">Abrir reports</a>
        </div>
      </div>

      ${renderKpis(data.kpis)}

      <section class="dashboard-grid-2">
        ${renderOperationalStatus(data.documentsByStatus)}
        ${renderSalesVsPurchases(data.commerce)}
      </section>

      <section class="dashboard-grid-2">
        ${renderRecentDocuments(data.recentDocuments)}
        ${renderRecentMoves(data.recentMoves)}
      </section>

      ${renderHighlights(data.highlights)}
    </section>
  `;
}
