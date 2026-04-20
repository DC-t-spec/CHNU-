import {
  getDocumentById,
  saveDocument,
  getProducts,
  getWarehouses,
  getCustomers,
} from '../../services/documents.service.js';
import { getInventoryBalances } from '../../services/inventory.service.js';
import { assertEditableDocument } from '../../services/document-status.service.js';
import { showToast } from '../../ui/toast.js';
import { initDocumentLines } from '../documents/document-lines.js';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function renderSaleFormPage(context = {}) {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const documentId = context?.params?.id || context?.query?.id || null;
  const existing = documentId ? getDocumentById(documentId) : null;

  if (documentId && (!existing || existing.type !== 'sale')) {
    appRoot.innerHTML = '<section class="page-shell"><div class="card"><h2>Venda não encontrada</h2><a href="#sales" class="btn btn-primary">Voltar</a></div></section>';
    return;
  }

  if (documentId && existing) {
    try {
      assertEditableDocument(documentId);
    } catch (error) {
      appRoot.innerHTML = `<section class="page-shell"><div class="card"><h2>Edição bloqueada</h2><p>${escapeHtml(error.message)}</p><a href="#sales/view?id=${existing.id}" class="btn btn-primary">Ver venda</a></div></section>`;
      return;
    }
  }

  const products = getProducts();
  const warehouses = getWarehouses();
  const customers = getCustomers();
  const stockBalances = getInventoryBalances();

  const initialLines = existing?.lines?.length
    ? existing.lines.map((line) => ({
      id: line.id || crypto.randomUUID(),
      product_id: line.product_id || '',
      quantity: Number(line.qty || 0),
      unitPrice: Number(line.unit_cost || 0),
    }))
    : [{ id: crypto.randomUUID(), product_id: '', quantity: 1, unitPrice: 0 }];

  appRoot.innerHTML = `
    <section class="page-shell documents-form-page">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div><h1>${documentId ? 'Editar venda' : 'Nova venda'}</h1><p>Sales PRO com validação de stock.</p></div>
        <div style="display:flex;gap:8px;"><a href="#sales" class="btn btn-secondary">Voltar</a><button type="button" class="btn btn-primary" id="save-sale-btn">Guardar draft</button></div>
      </div>

      <div class="card" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
        <div class="form-group"><label>Data</label><input type="date" id="sale-date" class="toolbar__input" value="${escapeHtml(existing?.date || getTodayDate())}" /></div>
        <div class="form-group"><label>Cliente *</label><select id="sale-customer" class="toolbar__select"><option value="">Selecionar</option>${customers.map((customer) => `<option value="${escapeHtml(customer.id)}">${escapeHtml(customer.name)}</option>`).join('')}</select></div>
        <div class="form-group"><label>Armazém origem *</label><select id="sale-origin" class="toolbar__select"><option value="">Selecionar</option>${warehouses.map((warehouse) => `<option value="${escapeHtml(warehouse.id)}">${escapeHtml(warehouse.name)}</option>`).join('')}</select></div>
        <div class="form-group" style="grid-column:1 / -1;"><label>Notas</label><textarea id="sale-notes" class="toolbar__input" rows="3">${escapeHtml(existing?.notes || '')}</textarea></div>
      </div>

      <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;"><h3>Linhas da venda</h3><button type="button" class="btn btn-secondary" id="add-line-btn">+ Linha</button></div><div id="document-lines"></div></div>

      <div class="card" style="display:flex;justify-content:flex-end;gap:24px;"><div>Linhas: <strong id="sale-lines-count">0</strong></div><div>Total Qtd: <strong id="sale-total-qty">0.00</strong></div><div>Total Venda: <strong id="sale-total">0.00</strong></div></div>

      <div class="card"><h3>Stock disponível (origem)</h3><div id="sale-stock-preview">Selecione armazém para pré-visualizar stock.</div></div>
    </section>
  `;

  if (existing?.customer_id) document.getElementById('sale-customer').value = existing.customer_id;
  if (existing?.origin) {
    const wh = warehouses.find((warehouse) => warehouse.name === existing.origin || warehouse.id === existing.origin);
    if (wh) document.getElementById('sale-origin').value = wh.id;
  }

  const linesController = initDocumentLines({
    containerSelector: '#document-lines',
    addButtonSelector: '#add-line-btn',
    products,
    warehouses: [],
    initialLines,
    onChange: (summary) => {
      document.getElementById('sale-lines-count').textContent = String(summary.linesCount || 0);
      document.getElementById('sale-total-qty').textContent = Number(summary.totalQty || 0).toFixed(2);
      document.getElementById('sale-total').textContent = formatMoney(summary.grandTotal || 0);
    },
  });

  document.getElementById('sale-origin')?.addEventListener('change', () => updateStockPreview(stockBalances));
  updateStockPreview(stockBalances);

  document.getElementById('save-sale-btn')?.addEventListener('click', () => {
    const payload = {
      id: documentId,
      type: 'sale',
      date: document.getElementById('sale-date')?.value || '',
      customer_id: document.getElementById('sale-customer')?.value || '',
      origin: document.getElementById('sale-origin')?.value || '',
      notes: document.getElementById('sale-notes')?.value || '',
      lines: linesController.getLines().map((line) => ({
        product_id: line.product_id,
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
      })),
    };

    const validationError = validateSale(payload, stockBalances, warehouses, products, customers);
    if (validationError) {
      showToast({ type: 'error', message: validationError });
      return;
    }

    try {
      const saved = saveDocument(payload);
      showToast({ type: 'success', message: 'Venda em draft guardada.' });
      window.location.hash = `#sales/view?id=${saved.id}`;
    } catch (error) {
      showToast({ type: 'error', message: error?.message || 'Erro ao guardar venda.' });
    }
  });
}

function updateStockPreview(stockBalances) {
  const origin = document.getElementById('sale-origin')?.value || '';
  const box = document.getElementById('sale-stock-preview');
  if (!box) return;
  if (!origin) {
    box.textContent = 'Selecione armazém para pré-visualizar stock.';
    return;
  }

  const rows = stockBalances.filter((item) => item.warehouse_id === origin);
  if (!rows.length) {
    box.textContent = 'Sem stock disponível neste armazém.';
    return;
  }

  box.innerHTML = `<div class="table-responsive"><table class="table"><thead><tr><th>Produto</th><th>Disponível</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.product_name)}</td><td>${Number(row.qty_available || 0).toFixed(2)}</td></tr>`).join('')}</tbody></table></div>`;
}

function validateSale(payload, stockBalances, warehouses, products, customers) {
  if (!payload.customer_id) return 'Cliente obrigatório.';
  if (!customers.find((item) => item.id === payload.customer_id)) return 'Cliente inválido.';
  if (!payload.origin) return 'Armazém origem obrigatório.';
  if (!warehouses.find((item) => item.id === payload.origin)) return 'Armazém origem inválido.';
  if (!Array.isArray(payload.lines) || !payload.lines.length) return 'Linhas obrigatórias.';

  for (let index = 0; index < payload.lines.length; index += 1) {
    const line = payload.lines[index];
    const row = index + 1;
    if (!line.product_id) return `Linha ${row}: produto obrigatório.`;
    if (!products.find((item) => item.id === line.product_id)) return `Linha ${row}: produto inválido.`;
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) return `Linha ${row}: qty > 0.`;

    const balance = stockBalances.find((item) => item.product_id === line.product_id && item.warehouse_id === payload.origin);
    const available = Number(balance?.qty_available ?? 0);
    if (line.quantity > available) return `Linha ${row}: stock insuficiente. Disponível ${available}.`;
  }

  return null;
}
